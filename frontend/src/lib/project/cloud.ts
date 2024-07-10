import { replaceState } from '$app/navigation';
import { clerk } from '@/auth/Clerk';
import { toast } from 'svelte-sonner';
import { get, writable } from 'svelte/store';
import { getSaveData, loadFromGraph } from '.';
import { PUBLIC_API_HOST } from '$env/static/public';
import { nonce, projectType, state } from '..';
import type { CloudSaveFileFormat, ProjectType } from '@/types';
import { resetLocalProject } from './local';

const API_HOST = new URL(PUBLIC_API_HOST);
const WS_HOST = new URL(API_HOST);
WS_HOST.protocol = WS_HOST.protocol === 'https:' ? 'wss:' : 'ws:';

export const socketId = writable<number>(-1);

let loadCallbacks: Array<{ resolve: () => void; reject: (reason?: any) => void }> = [];

export const saveAsCloudProject = async (awaitLoading: boolean = false) => {
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
		console.log('Created new project with id: ', data.id);
		state.update((s) => ({
			...s,
			projectId: data.id,
			nonce: get(nonce) + 1
		}));
		replaceState(`/project/${data.id}`, { replace: true });
		resetLocalProject();

		_connectToCloud(data.id, resetLocalProject);
		if (awaitLoading) {
			console.log('awaiting loading...');
			return new Promise<void>((resolve, reject) => {
				loadCallbacks.push({ resolve, reject });
			});
		}
	} else {
		throw new Error('failed to save to cloud');
	}
};

let webSocket: WebSocket | null = null;
let hasWritePermission = false;

const disconnectFromCloud = async () => {
	if (webSocket) {
		webSocket.close();
		webSocket = null;
	}

	// Reject all pending promises
	loadCallbacks.forEach(({ reject }) => reject(new Error('Disconnected from websocket')));
	loadCallbacks = [];
};

let lastSentData: any | null = null;
let canSendData: boolean = false;

async function sendUpdate() {
	if (!canSendData) {
		console.log('cannot send data!');
		return;
	} else {
		console.log('can send data!');
	}
	const saveData = getSaveData(true, false);
	const dataString = saveData.stringifiedGraph;

	if (dataString === lastSentData) {
		return;
	} else {
		console.log('data changed!');
		console.log(dataString);
		console.log(lastSentData);
	}

	const saveDataCloud: CloudSaveFileFormat = {
		nonce: get(nonce) + 1,
		...saveData.graph
	};

	state.update((s) => ({
		...s,
		nonce: s.nonce + 1
	}));

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
	canSendData = false;
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
			//toast.info('Loading project from cloud...');
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
				console.log('project', data);

				const graph: CloudSaveFileFormat = data.data;
				const currentProjectType = get(projectType);
				const currentProjectId = get(state).projectId;
				const isCurrentLoadedProject =
					graph.projectType === currentProjectType && graph.projectId === currentProjectId;

				loadFromGraph(graph, isCurrentLoadedProject);
				lastSentData = getSaveData(true, false).stringifiedGraph;

				console.log('resolving promises, num: ', loadCallbacks.length);
				loadCallbacks.forEach(({ resolve }) => resolve());
				loadCallbacks = [];

				setTimeout(() => {
					canSendData = true;
				}, 20);
			} else if (data.type === 'write') {
				hasWritePermission = true;
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
