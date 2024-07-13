import { isValidEdge, isValidGraph, isValidNode, isValidViewPort } from '@/utils/validate';
import { FILE_VERSION } from '@/utils/version';
import { toast } from 'svelte-sonner';
import { edges, nodes, projectType, state, viewport } from '..';
import { get } from 'svelte/store';
import { _getGraphFromLocalStorage, _saveToLocalStorage } from './local';
import {
	_connectToCloud,
	_saveToCloud,
	saveAsCloudProject,
	takeAndUploadScreenshot
} from './cloud';
import { type CloudSaveFileFormat, type ProjectType, type SaveFileFormat } from '@/types';
import { fullSuperJSON, minimalSuperJSON } from '@/utils/horstfile';
import { generateProjectId } from '@/utils/projectId';
import { session } from '@/auth/Clerk';
import { debounce } from 'lodash-es';
import type { Node } from '@xyflow/svelte';
import { replaceState } from '$app/navigation';

export function getSaveData(
	_includeData: boolean,
	includeFileData: boolean = false
): {
	graph: SaveFileFormat;
	stringifiedGraph: string;
} {
	const _state = get(state);

	const object: SaveFileFormat = {
		projectType: _state.projectType,
		projectId: _state.projectId,
		projectName: _state.projectName,
		nodes: get(_state.nodes),
		edges: get(_state.edges),
		viewport: get(_state.viewport),
		version: FILE_VERSION,
		optionalInputsEnabled: _state.optionalInputsEnabled,
		outputDataPlaceholder: _state.outputDataPlaceholder,
		inputDataPlaceholder: _state.inputDataPlaceholder
	};

	const stringifiedGraph = includeFileData
		? fullSuperJSON.stringify(object)
		: minimalSuperJSON.stringify(object);

	const parsedGraph: SaveFileFormat = includeFileData
		? fullSuperJSON.parse(stringifiedGraph)
		: minimalSuperJSON.parse(stringifiedGraph);

	return {
		graph: parsedGraph, // object
		stringifiedGraph
	};
}

let loading = false;

export const loadCloudProject = async (projectId: string, changeUrl: boolean = false) => {
	if (loading) return;
	loading = true;
	try {
		await _connectToCloud(projectId, resetProject, true);
		if (changeUrl) {
			replaceState(`/project/${projectId}`, { replace: true });
		}
		takeAndUploadScreenshot().then(() => {});
	} catch (err) {
		console.error(err);
		toast.error('Failed to load project');
		loading = false;
	}
	loading = false;
};

export const loadLocalProject = () => {
	const graph = _getGraphFromLocalStorage();
	if (!graph) {
		return false;
	} else {
		console.log('loading local project', graph);
		return loadFromGraph(graph);
	}
};

const debouncedSaveProject = debounce(() => {
	const _projectType = get(projectType);
	if (_projectType === 'LOCAL') {
		_saveToLocalStorage();
	} else if (_projectType === 'CLOUD') {
		_saveToCloud();
	}
}, 50);

/*
	this is the only function that should ever be called for saving the project
	locally or cloud. (only exception is downloading a json file)
*/
export const saveProject = () => {
	debouncedSaveProject();
};

function validateSaveFile(graph: SaveFileFormat): boolean {
	if (graph.projectType !== 'LOCAL' && graph.projectType !== 'CLOUD') {
		return false;
	}
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

export const loadFromGraph = (
	graph: SaveFileFormat | CloudSaveFileFormat,
	skipViewport: boolean = false
) => {
	if (!validateSaveFile(graph)) {
		console.log('invalid graph', graph);
		return false;
	}

	state.update((state) => ({
		...state,
		projectType: graph.projectType,
		projectId: graph.projectId,
		projectName: graph.projectName,
		nonce: (graph as CloudSaveFileFormat).nonce || 1,
		inputDataPlaceholder: graph.inputDataPlaceholder,
		optionalInputsEnabled: graph.optionalInputsEnabled,
		outputDataPlaceholder: graph.outputDataPlaceholder,
		outputDataDynamic: {},
		inputData: {},
		inputDataWithoutPlaceholder: {}
	}));

	nodes.set(graph.nodes);
	edges.set(graph.edges);

	if (!skipViewport) {
		viewport.set(graph.viewport);
	}

	return true;
};

export function deleteCurrentProject() {
	throw 'this function doesnt appear to delete from the cloud yet, so shouldnt be used';
	/*
	const _projectId = get(projectId);
	if (!_projectId) return;
	resetProject();
	goto('/');
	*/
}

export const resetProject = (projectType: ProjectType, newNodes: Node[] = []) => {
	if (projectType === 'CLOUD') {
		throw new Error(
			'Cannot reset to cloud. Use UNINITIALIZED if you are preparing to connect to a cloud project'
		);
	}
	const newId = generateProjectId(projectType);
	state.update((state) => {
		state.edges.set([]);
		state.nodes.set(newNodes);
		state.viewport.set({ x: 0, y: 0, zoom: 1 });
		return {
			projectType: projectType,
			projectId: newId,
			projectName: '',
			nodes: state.nodes,
			edges: state.edges,
			viewport: state.viewport,
			inputDataPlaceholder: {},
			inputData: {},
			inputDataWithoutPlaceholder: {},
			optionalInputsEnabled: {},
			outputDataPlaceholder: {},
			outputDataDynamic: {},
			nonce: 0
		};
	});
};

export async function createNewProject(newNodes: Node[] = []) {
	if (get(session)) {
		console.log('creating new project in cloud');
		resetProject('UNINITIALIZED', newNodes);
		await saveAsCloudProject(true);
		console.log('Done!!!!! creating new project in cloud');
	} else {
		console.log('creating new project in local');
		resetProject('LOCAL', newNodes);
		_saveToLocalStorage();
	}
}

export const saveProjectToLocalStorage = () => {
	_saveToLocalStorage();
};
