import { goto } from '$app/navigation';
import { clerk } from '@/auth/Clerk';
import { toast } from 'svelte-sonner';
import { get, writable } from 'svelte/store';
import { getSaveData, loadFromGraph } from '.';
import { PUBLIC_API_HOST } from '$env/static/public';
import { nonce, state } from '..';
import type { CloudSaveFileFormat, ProjectType } from '@/types';

const API_HOST = new URL(PUBLIC_API_HOST);
const WS_HOST = new URL(API_HOST);
WS_HOST.protocol = WS_HOST.protocol === 'https:' ? 'wss:' : 'ws:';

export const socketId = writable<number>(-1);

export const saveAsCloudProject = async () => {
	const clerkClient = get(clerk);
	const token = await clerkClient?.session?.getToken();

	const saveData = getSaveData(true, false);

	const cloudSave: CloudSaveFileFormat = {
		nonce: get(nonce),
		...saveData.graph,
		projectType: 'CLOUD'
	};

	const data = await fetch(`${API_HOST.toString()}project/new`, {
		method: 'POST',
		headers: {
			authorization: 'Bearer ' + token
		},
		body: JSON.stringify(cloudSave)
	})
		.then((res) => res.json())
		.catch((err) => {
			console.error(err);
			toast.error('failed to save to cloud');
		});

	if (data) {
		state.update((s) => ({
			...s,
			projectId: data.id
		}));
		goto(`/project/${data.id}`);
	}
};

let webSocket: WebSocket | null = null;
let hasWritePermission = false;

const disconnectFromCloud = async () => {
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
	const saveData = getSaveData(true, false);
	const dataString = saveData.stringifiedGraph;

	if (dataString === lastSentData) {
		console.log('skipping update. Equal to remote');
		return;
	}

	const saveDataCloud: CloudSaveFileFormat = {
		nonce: get(nonce) + 1,
		...saveData.graph
	};

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
					data: saveDataCloud
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

export function _saveToCloud() {
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

export const _connectToCloud = (
	projectId: string,
	resetProject: (projectType: ProjectType) => void
) => {
	//reset project, set it to UNINITIALIZED
	resetProject('UNINITIALIZED');
	state.update((s) => ({
		...s,
		projectId: projectId
	}));
	disconnectFromCloud();
	return new Promise<true>((resolve) => {
		webSocket = new WebSocket(`${WS_HOST.toString()}project/${projectId}`);
		hasWritePermission = false;
		webSocket.onopen = async () => {
			toast.info('Loading project from cloud...');
			const c = get(clerk);
			const token = await c?.session?.getToken();
			if (token) {
				console.log('sending auth token...');
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

				console.log(
					'loading graph that we received from the cloud',
					graph.nonce,
					locallyStoredNonce,
					graph
				);
				loadFromGraph(graph);
				lastSentData = getSaveData(true, false).stringifiedGraph;
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
				_connectToCloud(projectId, resetProject);
			}, 3000);
		};
		webSocket.onerror = () => {
			// toast.error('error connecting to server');
		};

		return webSocket;
	});
};
