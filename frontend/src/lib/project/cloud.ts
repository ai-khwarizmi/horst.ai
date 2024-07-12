import { replaceState } from '$app/navigation';
import { clerk } from '@/auth/Clerk';
import { get, writable } from 'svelte/store';
import { getSaveData, loadFromGraph } from '.';
import { PUBLIC_API_HOST } from '$env/static/public';
import { edges, nodes, nonce, projectType, state } from '..';
import type { CloudSaveFileFormat, ProjectType, SaveFileFormat } from '@/types';
import { resetLocalProject } from './local';
import { createGraphScreenshot } from '@/utils/screenshot';
import {
	NODE_MOVEMENTS_SERVER_UPDATE_INTERVAL,
	moveAndResizeNode
} from '@/utils/customNodeMovement';

const API_HOST = new URL(PUBLIC_API_HOST);
const WS_HOST = new URL(API_HOST);
WS_HOST.protocol = WS_HOST.protocol === 'https:' ? 'wss:' : 'ws:';

export const socketId = writable<number>(-1);

let loadCallbacks: Array<{ resolve: () => void; reject: (reason?: any) => void }> = [];

export const previewImageFileNameToUrl = (fileName: string) => {
	if (fileName.startsWith('/')) {
		fileName = fileName.substring(1);
	}
	return `${API_HOST.toString()}${fileName}`;
};

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
		});

	if (data) {
		console.log('data', data);
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

type CHANGE_TYPE =
	| 'NODES'
	| 'NODE_INPUT_PLACEHOLDER'
	| 'NODE_OUTPUT_PLACEHOLDER'
	| 'EDGES'
	| 'PROJECT_NAME'
	| 'NONE';

function hasDataChanged(data: SaveFileFormat): CHANGE_TYPE {
	if (lastSentData?.projectId !== data.projectId) {
		throw new Error('Project id mismatch (hasDataChanged)');
	}

	if (data.edges.length !== lastSentData?.edges.length) {
		return 'EDGES';
	}
	if (data.nodes.length !== lastSentData?.nodes.length) {
		return 'NODES';
	}

	if (
		JSON.stringify(data.inputDataPlaceholder) !== JSON.stringify(lastSentData?.inputDataPlaceholder)
	) {
		return 'NODE_INPUT_PLACEHOLDER';
	}

	if (
		JSON.stringify(data.outputDataPlaceholder) !==
		JSON.stringify(lastSentData?.outputDataPlaceholder)
	) {
		return 'NODE_OUTPUT_PLACEHOLDER';
	}

	if (data.projectName !== lastSentData?.projectName) {
		return 'PROJECT_NAME';
	}

	return 'NONE';
}

async function sendUpdate() {
	const saveData = getSaveData(true, false);

	if (!canSendData) return;

	const changeType = hasDataChanged(saveData.graph);
	if (changeType === 'NONE') {
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
export async function takeAndUploadScreenshot() {
	if (get(nodes).length === 0 && get(edges).length === 0) {
		return;
	}
	try {
		const screenshot = await createGraphScreenshot();
		if (screenshot) {
			await uploadScreenshot(screenshot);
		}
	} catch (error) {
		console.error('Error creating preview image:', error);
	}
}

async function uploadScreenshot(screenshot: string) {
	const clerkClient = get(clerk);
	const token = await clerkClient?.session?.getToken();
	const projectId = get(state).projectId;

	if (!token || !projectId) {
		console.error('Failed to upload screenshot: missing token or project ID');
		return;
	}

	try {
		const response = await fetch(`${API_HOST.toString()}project/uploadImage/${projectId}`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'image/png'
			},
			body: dataURItoBlob(screenshot)
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
	} catch (error) {
		console.error('Error uploading screenshot:', error);
	}
}

// Helper function to convert data URI to Blob
function dataURItoBlob(dataURI: string) {
	const byteString = atob(dataURI.split(',')[1]);
	const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
	const ab = new ArrayBuffer(byteString.length);
	const ia = new Uint8Array(ab);
	for (let i = 0; i < byteString.length; i++) {
		ia[i] = byteString.charCodeAt(i);
	}
	return new Blob([ab], { type: mimeString });
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

const nodeMoveResizeUpdateTimer: Record<string, NodeJS.Timeout> = {};
const nodeMoveResizeData: Record<
	string,
	{ position?: { x: number; y: number }; size?: { width: number; height: number } }
> = {};

export function sendNodeMoveResize(nodeId: string) {
	const node = get(nodes).find((node) => node.id === nodeId);
	if (!node || !webSocket || webSocket.readyState !== WebSocket.OPEN || !hasWritePermission) {
		return;
	}

	if (!node.width || !node.height) {
		return;
	}

	const updateData = {
		nodeId: node.id,
		position: node.position,
		size: { width: node.width, height: node.height }
	};
	nodeMoveResizeData[nodeId] = updateData;
	if (!nodeMoveResizeUpdateTimer[nodeId]) {
		nodeMoveResizeUpdateTimer[nodeId] = setTimeout(() => {
			webSocket?.send(
				JSON.stringify({
					type: 'moveResizeNode',
					data: nodeMoveResizeData[nodeId]
				})
			);
			delete nodeMoveResizeUpdateTimer[nodeId];
		}, NODE_MOVEMENTS_SERVER_UPDATE_INTERVAL);
	}
}

export const websocketStatus = writable<'disconnected' | 'error' | 'connecting' | 'connected'>(
	'disconnected'
);

export const _connectToCloud = (
	projectId: string,
	resetProject: (projectType: ProjectType) => void,
	awaitLoading: boolean = false
) => {
	//reset project, set it to UNINITIALIZED
	canSendData = false;
	resetProject('UNINITIALIZED');
	state.update((s) => ({
		...s,
		projectId: projectId
	}));
	disconnectFromCloud();
	return new Promise<true>((resolve, reject) => {
		websocketStatus.set('connecting');
		webSocket = new WebSocket(`${WS_HOST.toString()}project/${projectId}`);
		hasWritePermission = false;
		webSocket.onopen = async () => {
			console.log('WebSocket connection opened');
			websocketStatus.set('connected');
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
				websocketStatus.set('error');
				reject();
			}
			if (!awaitLoading) {
				resolve(true);
			}
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

				resolve(true);
				loadCallbacks.forEach(({ resolve }) => resolve());
				loadCallbacks = [];

				setTimeout(() => {
					canSendData = true;
				}, 20);
			} else if (data.type === 'write') {
				hasWritePermission = true;
				websocketStatus.set('connected');
			} else if (data.type === 'nodeMoveResized') {
				moveAndResizeNode(data.data);
			}
		};

		webSocket.onclose = () => {
			console.log('WebSocket connection closed');
			websocketStatus.set('disconnected');

			// auto reconnect
			setTimeout(() => {
				_connectToCloud(projectId, resetProject);
			}, 3000);
		};
		webSocket.onerror = (error) => {
			console.error('WebSocket error:', error);
			websocketStatus.set('error');
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
