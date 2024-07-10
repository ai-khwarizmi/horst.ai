import { type Edge, type Node, type XYPosition } from '@xyflow/svelte';
import { derived, writable, type Writable } from 'svelte/store';
import { type ConnectWith, type State } from './types';
import { nodeIOHandlers } from './utils';
import { debounce } from 'lodash-es';
import { saveProject } from './project';

/*
	There are 3 types of data:
	A. Input Placeholder data - this is data that is added directly in a nodes input, for example from a dropdown or input.
	B. Output Placeholder data - this is data that is added directly in a nodes output. For example the text your write in a text node.
	C. Dynamic Output data - this is data that is generated as the graph is being processed, for example the GPT4 response. This is omitted when saving the project.
	
	The waterfall for how to decide the input of a handle is as follows:
	1. Output data from connected node [if connected, and not null]
	2. Output Placeholder data from connected node [if connected]
	3. Input Placeholder data from the input node itself
	4. null
*/
export const state: Writable<State> = writable({
	projectType: 'UNINITIALIZED',
	nonce: 0,
	projectId: '',
	projectName: '',
	nodes: writable([]),
	edges: writable([]),
	viewport: writable({ x: 0, y: 0, zoom: 1 }),
	optionalInputsEnabled: {} as Record<string, Record<string, boolean>>,

	// Type A
	outputDataDynamic: {} as Record<string, Record<string, any>>,
	// Type B
	outputDataPlaceholder: {} as Record<string, Record<string, any>>,
	// Type C
	inputDataPlaceholder: {} as Record<string, Record<string, any>>,

	/*
		These are computed based on the waterfall above.
	*/
	inputData: {} as Record<string, Record<string, any>>,
	inputDataWithoutPlaceholder: {} as Record<string, Record<string, any>>
});

export const recentProjectsOpen = writable(false);

export const outputDataDynamic = derived(state, ($state) => {
	return $state.outputDataDynamic;
});
export const outputDataPlaceholder = derived(state, ($state) => {
	return $state.outputDataPlaceholder;
});
export const inputDataPlaceholder = derived(state, ($state) => {
	return $state.inputDataPlaceholder;
});
export const edges = derived(state, ($state) => {
	return $state.edges;
});
export const projectId = derived(state, ($state) => {
	return $state.projectId;
});
export const nodes = derived(state, ($state) => {
	return $state.nodes;
});
export const optionalInputsEnabled = derived(state, ($state) => {
	return $state.optionalInputsEnabled;
});
export const viewport = derived(state, ($state) => {
	return $state.viewport;
});
export const projectName = derived(state, ($state) => {
	return $state.projectName;
});
export const nonce = derived(state, ($state) => {
	return $state.nonce;
});
export const inputData = derived(state, ($state) => {
	return $state.inputData;
});
export const inputDataWithoutPlaceholder = derived(state, ($state) => {
	return $state.inputDataWithoutPlaceholder;
});
export const projectType = derived(state, ($state) => {
	return $state.projectType;
});

export const projectStoreSaveable = derived(
	state,
	({
		nonce,
		projectId,
		projectName,
		nodes,
		edges,
		viewport,
		optionalInputsEnabled,
		outputDataPlaceholder,
		inputDataPlaceholder
	}) => ({
		nonce,
		projectId,
		projectName,
		nodes,
		edges,
		viewport,
		optionalInputsEnabled,
		outputDataPlaceholder,
		inputDataPlaceholder
	})
);

export const commandOpen = writable(false);
export const createNodeParams = writable<{
	position: XYPosition;
	node?: ConnectWith;
} | null>(null);

const debouncedHandleChanges = debounce(() => {
	Object.values(nodeIOHandlers).forEach((ioHandler) => {
		ioHandler.onOutputsChanged();
	});
}, 50);

outputDataDynamic.subscribe(() => {
	debouncedHandleChanges();
});

projectStoreSaveable.subscribe(() => {
	saveProject();
});

let subscribedEdgeWritable: Writable<Edge[]> | null = null;
let unsubscribeEdge: () => void;
let subscribedNodeWritable: Writable<Node[]> | null = null;
let unsubscribeNode: () => void;

let firstNodesWritable: any = null;
let firstEdgesWritable: any = null;
state.subscribe((state) => {
	if (!firstNodesWritable) {
		firstNodesWritable = state.nodes;
		firstEdgesWritable = state.edges;
	} else {
		if (firstNodesWritable !== state.nodes) {
			console.error('before: ', firstNodesWritable);
			console.error('after: ', state.nodes);
			throw new Error('nodes writable changed. This should never happen');
		}
		if (firstEdgesWritable !== state.edges) {
			console.error('before: ', firstEdgesWritable);
			console.error('after: ', state.edges);
			throw new Error('edges writable changed. This should never happen');
		}
	}
});

state.subscribe((state) => {
	saveProject();

	if (subscribedEdgeWritable !== state.edges) {
		if (unsubscribeEdge) {
			unsubscribeEdge();
		}
		unsubscribeEdge = state.edges.subscribe(() => {
			debouncedHandleChanges();
			saveProject();
		});
		subscribedEdgeWritable = state.edges;
	}
	if (subscribedNodeWritable !== state.nodes) {
		if (unsubscribeNode) {
			unsubscribeNode();
		}
		unsubscribeNode = state.nodes.subscribe(() => {
			debouncedHandleChanges();
			saveProject();
		});
		subscribedNodeWritable = state.nodes;
	}
});
