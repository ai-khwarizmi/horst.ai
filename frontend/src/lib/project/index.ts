import { isValidEdge, isValidGraph, isValidNode, isValidViewPort } from '@/utils/validate';
import { FILE_VERSION } from '@/utils/version';
import { toast } from 'svelte-sonner';
import {
	nodes,
	projectId,
	state
} from '..';
import { get, writable } from 'svelte/store';
import { goto } from '$app/navigation';
import {
	getGraphFromLocalProject,
	removeProjectFromLocalStorage,
	removeSaveFileId,
	resetLastProjectId,
	saveToLocalStorage
} from './local';
import { connectToCloud } from './cloud';
import { registeredNodes } from '@/nodes';
import { NodeType, type SaveFileFormat } from '@/types';
import { fullSuperJSON, minimalSuperJSON } from '@/utils/horstfile';
import { generateProjectId } from '@/utils/projectId';


export function getSaveData(
	includeData: boolean,
	includeFileData: boolean = false
): {
	graph: SavedGraph;
	stringifiedGraph: string;
} {
	let id = get(projectId);
	if (!id) {
		id = generateProjectId('local');
		projectId.set(id);
	}
	const name = get(projectName);
	const n = get(nodes);
	const e = get(edges);
	const v = get(viewport);
	const _nonce = get(nonce);
	const data: any = {};
	const _inputPlaceholderData: any = {};
	const _optionalInputsEnabled = get(optionalInputsEnabled);

	for (const node of n) {
		if (!node?.type) {
			continue;
		}
		if (!registeredNodes[node.type]) {
			continue;
		}
		const nodeType = registeredNodes[node.type].nodeType;
		if (includeData && nodeType === NodeType.INPUT) {
			const originalData = get(outputData)[node.id];
			data[node.id] = originalData;
		}
		if (includeData) {
			_inputPlaceholderData[node.id] = get(inputPlaceholderData)[node.id];
		}
	}

	const object: SavedGraph = {
		id,
		name,
		nodes: n,
		edges: e,
		viewport: v,
		data,
		inputPlaceholderData: _inputPlaceholderData,
		optionalInputsEnabled: _optionalInputsEnabled,
		nonce: _nonce,
		version: FILE_VERSION
	};

	const stringifiedGraph = includeFileData
		? fullSuperJSON.stringify(object)
		: minimalSuperJSON.stringify(object);

	return {
		graph: object,
		stringifiedGraph
	};
}

let loading = false;

export const loadProjectByProjectId = async (_projectId?: string): Promise<void> => {
	if (!_projectId) {
		return;
	}
	const activeProjectId = get(projectId);
	if (activeProjectId && activeProjectId === _projectId) {
		return;
	}
	if (loading) {
		return;
	}
	loading = true;
	try {
		if (_projectId.startsWith('local-')) {
			const graph = getGraphFromLocalProject(_projectId);
			if (!graph) {
				removeSaveFileId(_projectId);
				toast.error('Project not found: ' + _projectId);
				goto('/');
			} else loadFromGraph(graph);
		} else {
			await connectToCloud(_projectId);
		}
	} catch (err) {
		console.error(err);
		toast.error('Failed to load project');
	}
	loading = false;
};


function validateSaveFile(graph: SaveFileFormat): boolean {
	if (graph.version !== FILE_VERSION) {
		toast.error('Graph: Version mismatch');
		return false;
	}
	if (!isValidGraph(graph)) {
		toast.error('Graph: Invalid project file');
		return false;
	}
	if (Number.isNaN(graph.nonce)) {
		throw new Error('Graph: Invalid nonce');
	}

	for (const node of get(graph.nodes)) {
		if (!isValidNode(node)) {
			throw new Error('Graph: Invalid node');
		}
	}

	for (const edge of get(graph.edges)) {
		if (!isValidEdge(edge, get(graph.nodes))) {
			throw new Error('Graph: Invalid edge');
		}
	}

	if (!isValidViewPort(graph.viewport)) {
		throw new Error('Graph: Invalid viewport');
	}

	return true;

}

export const loadFromGraph = (graph: SaveFileFormat) => {
	if (!validateSaveFile(graph)) {
		return false;
	}

	state.set({
		projectId: graph.projectId,
		projectName: graph.projectName,
		nonce: graph.nonce,
		inputDataPlaceholder: graph.inputDataPlaceholder,
		optionalInputsEnabled: graph.optionalInputsEnabled,
		outputDataPlaceholder: graph.outputDataPlaceholder,
		nodes: graph.nodes,
		edges: graph.edges,
		viewport: graph.viewport,

		outputDataDynamic: {},
		inputData: {},
		inputDataWithoutPlaceholder: {},
	});

	return true;
};

export function deleteCurrentProject() {
	const _projectId = get(projectId);
	if (!_projectId) return;
	resetProject();
	goto('/');
	if (_projectId.startsWith('local-')) {
		removeProjectFromLocalStorage(_projectId);
	}
}

export const resetProject = (redirect = true) => {
	console.log('resetting project');
	state.set({
		projectId: undefined,
		projectName: '',
		nodes: writable([]),
		edges: writable([]),
		viewport: writable({ x: 0, y: 0, zoom: 1 }),
		inputDataPlaceholder: {},
		inputData: {},
		inputDataWithoutPlaceholder: {},
		optionalInputsEnabled: {},
		outputDataPlaceholder: {},
		outputDataDynamic: {},
		nonce: 0
	});
	resetLastProjectId();
	if (redirect) goto('/');
};

export function createNewProject() {
	console.log('creating new project');
	const _projectId = generateProjectId('local');

	resetProject();
	state.update((state) => ({
		...state,
		projectId: _projectId
	}));

	saveToLocalStorage();
	goto(`/project/${_projectId}`);
	return _projectId;
}
