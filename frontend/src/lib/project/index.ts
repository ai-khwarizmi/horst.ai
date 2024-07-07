import { isValidEdge, isValidGraph, isValidNode, isValidViewPort } from '@/utils/validate';
import { FILE_VERSION } from '@/utils/version';
import { toast } from 'svelte-sonner';
import {
	edges,
	nodes,
	projectId,
	state,
	viewport
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
import { type CloudSaveFileFormat, type SaveFileFormat } from '@/types';
import { fullSuperJSON, minimalSuperJSON } from '@/utils/horstfile';
import { generateProjectId } from '@/utils/projectId';


export function getSaveData(
	_includeData: boolean,
	includeFileData: boolean = false
): {
	graph: SaveFileFormat;
	stringifiedGraph: string;
} {
	const _state = get(state);

	const object: SaveFileFormat = {
		projectId: _state.projectId,
		projectName: _state.projectName,
		nodes: get(_state.nodes),
		edges: get(_state.edges),
		viewport: get(_state.viewport),
		version: FILE_VERSION,
		optionalInputsEnabled: _state.optionalInputsEnabled,
		outputDataPlaceholder: _state.outputDataPlaceholder,
		inputDataPlaceholder: _state.inputDataPlaceholder,
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

	for (const node of graph.nodes) {
		if (!isValidNode(node)) {
			throw new Error('Graph: Invalid node');
		}
	}

	for (const edge of graph.edges) {
		if (!isValidEdge(edge, graph.nodes)) {
			throw new Error('Graph: Invalid edge');
		}
	}

	if (!isValidViewPort(graph.viewport)) {
		throw new Error('Graph: Invalid viewport');
	}

	return true;

}

export const loadFromGraph = (graph: SaveFileFormat | CloudSaveFileFormat) => {
	if (!validateSaveFile(graph)) {
		console.log('invalid graph', graph);
		return false;
	}

	console.log('loading graph', graph);


	state.update((state) => ({
		...state,
		projectId: graph.projectId,
		projectName: graph.projectName,
		nonce: (graph as CloudSaveFileFormat).nonce || 1,
		inputDataPlaceholder: graph.inputDataPlaceholder,
		optionalInputsEnabled: graph.optionalInputsEnabled,
		outputDataPlaceholder: graph.outputDataPlaceholder,
		outputDataDynamic: {},
		inputData: {},
		inputDataWithoutPlaceholder: {},
	}));
	get(nodes).set(graph.nodes);
	get(edges).set(graph.edges);
	get(viewport).set(graph.viewport);

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
		projectId: generateProjectId('local'),
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
