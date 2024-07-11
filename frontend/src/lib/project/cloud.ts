import { replaceState } from '$app/navigation';
import { clerk } from '@/auth/Clerk';
import { toast } from 'svelte-sonner';
import { get, writable } from 'svelte/store';
import { getSaveData, loadFromGraph } from '.';
import { PUBLIC_API_HOST } from '$env/static/public';
import { nonce, projectType, state } from '..';
import type { CloudSaveFileFormat, ProjectType, SaveFileFormat } from '@/types';
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
		state.update((s) => ({
			...s,
			projectId: data.id,
			nonce: get(nonce) + 1
		}));
		replaceState(`/project/${data.id}`, { replace: true });
		resetLocalProject();

		_connectToCloud(data.id, resetLocalProject);
		if (awaitLoading) {
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

	loadCallbacks.forEach(({ reject }) => reject(new Error('Disconnected from websocket')));
	loadCallbacks = [];
};

let lastSentData: SaveFileFormat | null = null;
let canSendData: boolean = false;

function hasDataChanged(data: SaveFileFormat): boolean {
	if (lastSentData?.projectId !== data.projectId) {
		throw new Error('Project id mismatch (hasDataChanged)');
	}

	if (data.edges.length !== lastSentData?.edges.length) {
		return true;
	}
	if (data.nodes.length !== lastSentData?.nodes.length) {
		return true;
	}

	if (
		JSON.stringify(data.inputDataPlaceholder) !== JSON.stringify(lastSentData?.inputDataPlaceholder)
	) {
		return true;
	}

	if (
		JSON.stringify(data.outputDataPlaceholder) !==
		JSON.stringify(lastSentData?.outputDataPlaceholder)
	) {
		return true;
	}

	if (data.projectName !== lastSentData?.projectName) {
		return true;
	}

	return false;
}

async function sendUpdate() {
	const saveData = getSaveData(true, false);

	if (!canSendData) return;

	if (!hasDataChanged(saveData.graph)) {
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

	if (webSocket?.readyState === WebSocket.OPEN) {
		if (hasWritePermission) {
			webSocket.send(
				JSON.stringify({
					type: 'update',
					data: saveDataCloud
				})
			);
			lastSentData = JSON.parse(JSON.stringify(saveDataCloud));
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

const nodeUpdateTimers: Record<string, NodeJS.Timeout> = {};
const lastNodePositions: Record<string, { id: string; position: { x: number; y: number } }> = {};

const FPS = 20;
const UPDATE_INTERVAL = 1000 / FPS;

export function sendNodePosition(event: CustomEvent) {
	if (!webSocket || webSocket.readyState !== WebSocket.OPEN || !hasWritePermission) {
		return;
	}

	const { nodes } = event.detail;
	if (nodes.length !== 1) {
		return;
	}

	const node = nodes[0];
	lastNodePositions[node.id] = { id: node.id, position: node.position };

	if (!nodeUpdateTimers[node.id]) {
		nodeUpdateTimers[node.id] = setTimeout(() => {
			sendNodeUpdate(node.id);
		}, UPDATE_INTERVAL);
	}
}

function sendNodeUpdate(nodeId: string) {
	const nodeData = lastNodePositions[nodeId];
	if (nodeData) {
		webSocket?.send(
			JSON.stringify({
				type: 'moveNode',
				data: {
					nodeId: nodeData.id,
					newPosition: nodeData.position
				}
			})
		);
	}
	delete nodeUpdateTimers[nodeId];
	delete lastNodePositions[nodeId];
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
				const graph: CloudSaveFileFormat = data.data;
				const currentProjectType = get(projectType);
				const currentProjectId = get(state).projectId;
				const isCurrentLoadedProject =
					graph.projectType === currentProjectType && graph.projectId === currentProjectId;

				loadFromGraph(graph, isCurrentLoadedProject);
				lastSentData = JSON.parse(JSON.stringify(getSaveData(true, false).graph));

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

export const fetchRecentProjects = async () => {
	const clerkClient = get(clerk);
	const token = await clerkClient?.session?.getToken();

	if (!token) {
		throw new Error('Not authenticated');
	}

	const response = await fetch(`${API_HOST.toString()}project/list`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json'
		}
	});

	if (!response.ok) {
		throw new Error('Failed to fetch recent projects');
	}

	const data = await response.json();
	return data.projects;
};
