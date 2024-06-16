import { registeredNodes } from "@/nodes";
import { nodeIOHandlers } from "@/utils";
import type { IsValidConnection, Node } from "@xyflow/svelte";

export const isValidConnection: IsValidConnection = (connection) => {
    if (typeof connection.source !== 'string' || typeof connection.target !== 'string') {
        return false;
    }
    if (typeof connection.sourceHandle !== 'string' || typeof connection.targetHandle !== 'string') {
        return false;
    }
    if (connection.source === connection.target) {
        return false;
    }

    // check if the connection type is valid using nodeIOHandlers
    const sourceNode = nodeIOHandlers.get(connection.source);
    const targetNode = nodeIOHandlers.get(connection.target);
    if (!sourceNode || !targetNode) return false;

    const sourceOutput = sourceNode.outputs.find(o => o.id === connection.sourceHandle);
    const targetInput = targetNode.inputs.find(i => i.id === connection.targetHandle);

    if (!sourceOutput || !targetInput) return false;

    // for now allow "any", though we should clean this up
    if (sourceOutput.type !== targetInput.type && targetInput.type !== 'any') {
        return false;
    }
    return true;
}


export const isValidViewPort = (viewport: any) => {
    if (typeof viewport !== 'object') return false;
    if (!viewport) return false;
    if (typeof viewport.x !== 'number') return false;
    if (typeof viewport.y !== 'number') return false;
    if (typeof viewport.zoom !== 'number') return false;
    return true;
}

export const isValidGraph = (graph: unknown) => {
    if (typeof graph !== 'object') return false;
    if (!graph) return false;
    if ('version' in graph === false) return false;
    if ('nodes' in graph === false) return false;
    if ('edges' in graph === false) return false;
    if (!Array.isArray(graph.nodes)) return false;
    if (!Array.isArray(graph.edges)) return false;
    return true;
}

export const isValidNode = (node: any) => {
    if (typeof node !== 'object') return false;
    if (!node) return false;
    if (typeof node.id !== 'string') return false;
    if (typeof node.type !== 'string') return false;
    if (!registeredNodes[node.type]) return false;
    return true;
}

export const isValidEdge = (edge: any, nodes: Node[]) => {
    if (typeof edge !== 'object') return false;
    if (!edge) return false;
    if (typeof edge.id !== 'string') return false;
    if (typeof edge.source !== 'string') return false;
    if (typeof edge.target !== 'string') return false;
    if (typeof edge.sourceHandle !== 'string') return false;
    if (typeof edge.targetHandle !== 'string') return false;
    if (!nodes.find(n => n.id === edge.source)) return false;
    if (!nodes.find(n => n.id === edge.target)) return false;
    return true;
}