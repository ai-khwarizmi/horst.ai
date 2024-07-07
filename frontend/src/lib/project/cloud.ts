import { goto } from '$app/navigation';
import { clerk } from '@/auth/Clerk';
import { toast } from 'svelte-sonner';
import { get, writable } from 'svelte/store';
import { getSaveData, loadFromGraph, resetProject, type SavedGraph } from '.';
import { setUpdatedGraph } from '@/components/popups/VersionChangePopup.svelte';
import { PUBLIC_API_HOST } from '$env/static/public';
import { updatedAt } from '..';

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

let updateInterval: any = null;
let webSocket: WebSocket | null = null;
let hasWritePermission = false;

export const disconnectFromCloud = async () => {
	if (webSocket) {
		webSocket.close();
		webSocket = null;
	}
};

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
			// every five seconds for now
			updateInterval = setInterval(() => {
				if (webSocket?.readyState === WebSocket.OPEN) {
					if (hasWritePermission) {
						webSocket.send(
							JSON.stringify({
								type: 'update',
								data: getSaveData(true, false).graph
							})
						);
					} else {
						webSocket.send(
							JSON.stringify({
								type: 'project'
							})
						);
					}
				}
			}, 5000);
			resolve(true);
		};

		webSocket.onmessage = (ev) => {
			const data = JSON.parse(ev.data);
			if (data.type === 'project') {
				const graph: SavedGraph = data.data;
				const lastUpdated = get(updatedAt);
				if (lastUpdated === 0) {
					loadFromGraph(graph);
					toast.success('loaded project from cloud');
				} else if (graph.updatedAt > lastUpdated) {
					toast.info('loading latest version from cloud...');
					setUpdatedGraph(data.data);
				} else if (getSaveData(true).graph) {
					console.log('same version', graph.updatedAt, lastUpdated);
				} else {
					console.log('old version', graph.updatedAt, lastUpdated);
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

			if (updateInterval) clearInterval(updateInterval);

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
