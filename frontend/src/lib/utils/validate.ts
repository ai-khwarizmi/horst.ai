import { registeredNodes } from '@/nodes';
import type { NodeValueType } from '@/types';
import { NodeIOHandler, nodeIOHandlers } from '@/utils';
import type { Connection, Edge, Node } from '@xyflow/svelte';
import { get } from 'svelte/store';
import { edges } from '@/index';

export const canConnectTypes = (obj: { output: NodeValueType; input: NodeValueType }) => {
	if (obj.input === 'any') return true;
	if (obj.input === 'number' && obj.output === 'text') return true;
	if (obj.input === 'file' && obj.output === 'file[]') return true;
	if (obj.input === 'file[]' && obj.output === 'file') return true;
	return obj.output === obj.input;
};

const detectLoop = (source: string, target: string, visited: Set<string> = new Set()): boolean => {
	if (source === target) return true;
	if (visited.has(source)) return false;
	visited.add(source);

	const outgoingEdges = get(edges).filter((edge) => edge.source === source);
	for (const edge of outgoingEdges) {
		if (detectLoop(edge.target, target, visited)) return true;
	}

	return false;
};

export const isValidConnection = (
	connection: Edge | Connection,
	checkIfNodeConnectionPossible = false
) => {
	if (typeof connection.source !== 'string' || typeof connection.target !== 'string') {
		return false;
	}
	if (connection.source === connection.target) {
		return false;
	}
	// Check for loops
	if (detectLoop(connection.target, connection.source)) {
		return false;
	}
	// Dont check this for now, to allow checking if the node is connectable
	// if (typeof connection.sourceHandle !== 'string' || typeof connection.targetHandle !== 'string') {
	//     return false;
	// }

	// check if the connection type is valid using nodeIOHandlers
	const sourceNode = nodeIOHandlers[connection.source] as NodeIOHandler<string, string>;
	const targetNode = nodeIOHandlers[connection.target] as NodeIOHandler<string, string>;
	if (!sourceNode || !targetNode) return false;

	const sourceNodeOutputs = get(sourceNode.outputs);
	const targetNodeInputs = get(targetNode.inputs);

	const sourceOutput = sourceNodeOutputs.find((o) => o.id === connection.sourceHandle);
	const targetInput = targetNodeInputs.find((i) => i.id === connection.targetHandle);

	if (!sourceOutput && !targetInput) return false;
	if (!sourceOutput || !targetInput) {
		if (!checkIfNodeConnectionPossible) return false;
		if (sourceOutput && !targetInput) {
			return targetNodeInputs.some((i) =>
				canConnectTypes({
					output: sourceOutput.type,
					input: i.type
				})
			);
		} else if (!sourceOutput && targetInput) {
			return sourceNodeOutputs.some((o) =>
				canConnectTypes({
					output: o.type,
					input: targetInput.type
				})
			);
		} else {
			return false;
		}
	}

	return canConnectTypes({
		output: sourceOutput.type,
		input: targetInput.type
	});
};

export const isValidViewPort = (viewport: any) => {
	if (typeof viewport !== 'object') return false;
	if (!viewport) return false;
	if (typeof viewport.x !== 'number') return false;
	if (typeof viewport.y !== 'number') return false;
	if (typeof viewport.zoom !== 'number') return false;
	return true;
};

export const isValidGraph = (graph: unknown) => {
	if (typeof graph !== 'object') return false;
	if (!graph) return false;
	if ('version' in graph === false) return false;
	if ('nodes' in graph === false) return false;
	if ('edges' in graph === false) return false;
	if (!Array.isArray(graph.nodes)) return false;
	if (!Array.isArray(graph.edges)) return false;
	return true;
};

export const isValidNode = (node: any) => {
	if (typeof node !== 'object') return false;
	if (!node) return false;
	if (typeof node.id !== 'string') return false;
	if (typeof node.type !== 'string') return false;
	if (!registeredNodes[node.type]) return false;
	return true;
};

export const isValidEdge = (edge: any, nodes: Node[]) => {
	if (typeof edge !== 'object') return false;
	if (!edge) return false;
	if (typeof edge.id !== 'string') return false;
	if (typeof edge.source !== 'string') return false;
	if (typeof edge.target !== 'string') return false;
	if (typeof edge.sourceHandle !== 'string') return false;
	if (typeof edge.targetHandle !== 'string') return false;
	if (!nodes.find((n) => n.id === edge.source)) return false;
	if (!nodes.find((n) => n.id === edge.target)) return false;
	return true;
};
