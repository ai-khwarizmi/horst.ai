import { goto } from '$app/navigation';
import { clerk } from '@/auth/Clerk';
import { toast } from 'svelte-sonner';
import { get, writable } from 'svelte/store';
import { getSaveData, loadFromGraph, resetProject } from '.';
import { PUBLIC_API_HOST } from '$env/static/public';
import { nonce, projectStoreSaveable, state } from '..';
import type { CloudSaveFileFormat } from '@/types';

const API_HOST = new URL(PUBLIC_API_HOST);
const WS_HOST = new URL(API_HOST);
WS_HOST.protocol = WS_HOST.protocol === 'https:' ? 'wss:' : 'ws:';

export const socketId = writable<number>(-1);

export const saveAsCloudProject = async () => {
	const c = get(clerk);
	const token = await c?.session?.getToken();
	const data = await fetch(`${API_HOST.toString()}project/new`, {
		method: 'POST',
		headers: {
			authorization: 'Bearer ' + token
		},
		body: JSON.stringify(getSaveData(true, false).graph)
	})
		.then((res) => res.json())
		.catch((err) => {
			console.error(err);
			toast.error('failed to save to cloud');
		});
	if (data) goto(`/project/${data.id}`);
};

let webSocket: WebSocket | null = null;
let hasWritePermission = false;

export const disconnectFromCloud = async () => {
	if (webSocket) {
		webSocket.close();
		webSocket = null;
	}
};

let lastSentData: any | null = null;
let canSendData: boolean = false;

async function sendUpdate() {
	if (!canSendData) {
		console.log('skipping update. Not ready to send');
		return;
	}
	const dataString = JSON.stringify(get(projectStoreSaveable));
	console.log('length ', dataString.length, lastSentData?.length);
	if (dataString === lastSentData) {
		console.log('skipping update. Equal to remote');
		return;
	}
	console.log('lastSentData', lastSentData);
	console.log('dataString', dataString);

	state.update((s) => ({
		...s,
		nonce: s.nonce + 1
	}));

	console.log('sending update', get(nonce));
	if (webSocket?.readyState === WebSocket.OPEN) {
		if (hasWritePermission) {
			webSocket.send(
				JSON.stringify({
					type: 'update',
					data: getSaveData(true, false).graph
				})
			);
			lastSentData = dataString;
		}
	}
}

let updateTimeout: NodeJS.Timeout | null = null;
let lastUpdateTime = Date.now();

const UPDATE_DEBOUNCE_TIME = 1000;
const MAX_UPDATE_INTERVAL = 30000;
export function debouncedSendUpdate() {
	const now = Date.now();
	const timeSinceLastUpdate = now - lastUpdateTime;
	if (updateTimeout) {
		clearTimeout(updateTimeout);
	}
	if (timeSinceLastUpdate >= MAX_UPDATE_INTERVAL) {
		sendUpdate();
		lastUpdateTime = now;
	} else {
		updateTimeout = setTimeout(() => {
			sendUpdate();
			lastUpdateTime = Date.now();
		}, UPDATE_DEBOUNCE_TIME);
	}
}

export const connectToCloud = (projectId: string) => {
	resetProject(false);
	disconnectFromCloud();
	return new Promise<true>((resolve) => {
		webSocket = new WebSocket(`${WS_HOST.toString()}project/${projectId}`);
		hasWritePermission = false;
		webSocket.onopen = async () => {
			toast.info('Loading project from cloud...');
			const c = get(clerk);
			const token = await c?.session?.getToken();
			if (token) {
				webSocket?.send(
					JSON.stringify({
						type: 'auth',
						data: {
							token
						}
					})
				);
			} else {
				toast.error('failed to authenticate with server');
				resolve(true);
			}
			resolve(true);
		};

		webSocket.onmessage = (ev) => {
			const data = JSON.parse(ev.data);
			if (data.type === 'project') {
				canSendData = true;
				const graph: CloudSaveFileFormat = data.data;
				const locallyStoredNonce = get(nonce);
				if (locallyStoredNonce === 0) {
					//this kinda sucks, we need a better way to tell if they're equal
					lastSentData = JSON.stringify(get(projectStoreSaveable));
				}
				if (graph.nonce > locallyStoredNonce) {
					loadFromGraph(graph);
					lastSentData = JSON.stringify(get(projectStoreSaveable));
				} else if (graph.nonce === locallyStoredNonce) {
					console.log('received same version', graph.nonce, locallyStoredNonce);
				} else {
					/*
						this is really the case where we need to ask the user if they want to 
						override, or clone.
					*/
					console.log('received old version', graph.nonce, locallyStoredNonce);
				}
			} else if (data.type === 'write') {
				hasWritePermission = true;
			} else {
				console.log(data);
			}
		};

		webSocket.onclose = () => {
			toast.error('disconnected from server', {
				duration: 60000
			});


			// auto reconnect
			setTimeout(() => {
				connectToCloud(projectId);
			}, 3000);
		};
		webSocket.onerror = () => {
			// toast.error('error connecting to server');
		};

		return webSocket;
	});
};

export const cloudSaveCurrentProject = async () => {
	const saveData = getSaveData(true, false);
	if (!webSocket) return;

	webSocket.send(
		JSON.stringify({
			type: 'update',
			data: saveData.graph
		})
	);
};