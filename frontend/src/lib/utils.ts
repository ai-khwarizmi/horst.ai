import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { cubicOut } from "svelte/easing";
import type { TransitionConfig } from "svelte/transition";
import * as LZString from 'lz-string';
import { edges, nodes, openai_key, viewport } from "$lib";
import { type Connection, type IsValidConnection, type XYPosition } from "@xyflow/svelte";
import { get } from "svelte/store";
import { registeredNodes, type CustomNodeName } from "./nodes";
import { toast } from "svelte-sonner";
import { NodeType, type Input } from "./types";
import { openApiKeySettings } from "./components/settings/APIKeys.svelte";
import { onDestroy } from "svelte";

export const FILE_VERSION = 0.1;
const LOCALSTORAGE_KEY = 'horst.ai.graph'

export const clearData = () => {
	nodes.update(n => n.map(node => ({ ...node, data: {} })));
}

export const getNodeColors = (type: NodeType): { fullbackground: string, background: string, text: string, border: string } => {
	switch (type) {
		case NodeType.INPUT:
			return {
				fullbackground: 'bg-blue-500',
				background: 'bg-blue-100',
				text: 'text-blue-500',
				border: 'border-blue-500'
			};
		case NodeType.VIEWER:
			return {
				fullbackground: 'bg-green-500',
				background: 'bg-green-100',
				text: 'text-green-500',
				border: 'border-green-500'
			};
		case NodeType.TRANSFORM:
			return {
				fullbackground: 'bg-orange-500',
				background: 'bg-orange-100',
				text: 'text-orange-500',
				border: 'border-orange-500'
			};
		case NodeType.FUNCTION:
			return {
				fullbackground: 'bg-purple-500',
				background: 'bg-purple-100',
				text: 'text-purple-500',
				border: 'border-purple-500'
			};
		default:
			return {
				fullbackground: 'bg-gray-500',
				background: 'bg-gray-100',
				text: 'text-gray-500',
				border: 'border-gray-500'
			};
	}
}


const nodeIOHandlers = new Map<string, NodeIOHandler<any, any>>()

export class NodeIOHandler<TInput extends string, TOutput extends string> {

	// TODO store these in a writable so the CustomNode can process it dynamically

	constructor(
		public nodeId: string,
		public inputs: Input<TInput>[] = [],
		public outputs: Input<TOutput>[] = []
	) {
		nodeIOHandlers.set(nodeId, this);
		onDestroy(this.destroy)
	}

	destroy = () => {
		console.log('destroying', this.nodeId)
		nodeIOHandlers.delete(this.nodeId);
	}

	setOutputData = (handle: this['outputs'] extends [] ? never : this['outputs'][number]['id'], data: any) => {
		_setNodeOutputData(this.nodeId, {
			[handle]: data
		})
	}

	getOutputData = (handle: this['outputs'] extends [] ? never : this['outputs'][number]['id']) => {
		return _getNodeOutputData(this.nodeId, handle);
	}

	getInputData = (handle: this['inputs'] extends [] ? never : this['inputs'][number]['id']) => {
		return _getNodeInputData(this.nodeId, handle);
	}
}

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

export function getSaveData(includeData: boolean): {
	nodes: any; edges: any, version: number, viewport: any
} {
	const n = get(nodes);
	const e = get(edges);
	const v = get(viewport);
	const json = JSON.parse(JSON.stringify({
		nodes: n,
		edges: e,
		viewport: v,
		version: FILE_VERSION
	}));

	json.nodes = json.nodes.map((node: any) => {
		const nodeType = registeredNodes[node.type].nodeType;
		if (includeData && nodeType === 'input') {
			return node;
		}
		return {
			...node,
			data: {}
		}
	});
	return json;
}

export const saveGraph = () => {
	const graph = getSaveData(true);

	const str = JSON.stringify(graph, null, 4);
	const blob = new Blob([str], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.download = 'graph.json';
	a.href = url;
	a.click();
}

export const saveToLocalStorage = () => {
	if (typeof window === 'undefined') return;
	const graph = getSaveData(true);
	const str = JSON.stringify(graph);
	window.localStorage.setItem(LOCALSTORAGE_KEY, str);
}

export const loadFromHash = (): boolean => {
	if (typeof window === 'undefined') return false;
	const hash = window.location.hash;
	if (!hash) return false;
	const str = LZString.decompressFromBase64(hash.slice(1));
	if (!str) return false;
	const graph = JSON.parse(str);
	if (graph.version !== FILE_VERSION) {
		// TODO: improve
		console.error('version mismatch');
		return false;
	}
	nodes.set(graph.nodes);
	edges.set(graph.edges);
	if (graph.viewport) viewport.set(graph.viewport);
	return true;
}

export const loadFromLocalStorage = () => {
	if (typeof window === 'undefined') return;
	const str = window.localStorage.getItem(LOCALSTORAGE_KEY);
	if (!str) return;
	const graph = JSON.parse(str);
	if (graph.version !== FILE_VERSION) {
		console.error('version mismatch');
		return;
	}
	nodes.set(graph.nodes);
	edges.set(graph.edges);
	if (graph.viewport) viewport.set(graph.viewport);
}

export const resetGraph = () => {
	window.location.hash = '';
	nodes.set([]);
	edges.set([]);
	viewport.set({ x: 0, y: 0, zoom: 1 });
}

export const loadGraph = async () => {
	const input = document.createElement('input');
	input.type = 'file';
	input.accept = '.json';
	input.onchange = async (e) => {
		const target = e.target as HTMLInputElement;
		if (!target.files) return alert('no file selected');
		const file = target.files[0];
		await loadFromFile(file);
		toast.success('Graph loaded');
	};
	input.click();
}

export const loadFromFile = async (file: File) => {
	const text = await file.text();
	const graph = JSON.parse(text);
	if (graph.version !== FILE_VERSION) {
		alert('version mismatch');
		return
	}

	nodes.set(graph.nodes);
	edges.set(graph.edges);
	viewport.set(graph.viewport);
}

export const removeEdgeByIds = (...ids: string[]) => {
	edges.update(e => e.filter(edge => !ids.includes(edge.id)));
}

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

type FlyAndScaleParams = {
	y?: number;
	x?: number;
	start?: number;
	duration?: number;
};

export const flyAndScale = (
	node: Element,
	params: FlyAndScaleParams = { y: -8, x: 0, start: 0.95, duration: 150 }
): TransitionConfig => {
	const style = getComputedStyle(node);
	const transform = style.transform === "none" ? "" : style.transform;

	const scaleConversion = (
		valueA: number,
		scaleA: [number, number],
		scaleB: [number, number]
	) => {
		const [minA, maxA] = scaleA;
		const [minB, maxB] = scaleB;

		const percentage = (valueA - minA) / (maxA - minA);
		const valueB = percentage * (maxB - minB) + minB;

		return valueB;
	};

	const styleToString = (
		style: Record<string, number | string | undefined>
	): string => {
		return Object.keys(style).reduce((str, key) => {
			if (style[key] === undefined) return str;
			return str + `${key}:${style[key]};`;
		}, "");
	};

	return {
		duration: params.duration ?? 200,
		delay: 0,
		css: (t) => {
			const y = scaleConversion(t, [0, 1], [params.y ?? 5, 0]);
			const x = scaleConversion(t, [0, 1], [params.x ?? 0, 0]);
			const scale = scaleConversion(t, [0, 1], [params.start ?? 0.95, 1]);

			return styleToString({
				transform: `${transform} translate3d(${x}px, ${y}px, 0) scale(${scale})`,
				opacity: t
			});
		},
		easing: cubicOut
	};
};

export const addNode = (type: CustomNodeName, pos: XYPosition) => {
	nodes.update((prev) => {
		const nodes = prev.map(prev => ({
			...prev,
			selected: false
		}))
		nodes.push({
			id: Math.random().toString(36).substr(2, 9),
			type,
			data: {},
			selected: true,
			position: pos
		});
		return nodes;
	});
};

export const _setNodeOutputData = (id: string, data: Record<string, any>) => {
	nodes.update(n => {
		const node = n.find(n => n.id === id);
		if (!node) return n;
		node.data = { ...node.data, ...data };
		return n;
	});
}

export const _getNodeOutputData = (id: string, handle: string) => {
	const n = get(nodes);
	const node = n.find(n => n.id === id);
	if (!node) return;
	return node.data[handle];
}

export const _getNodeInputData = (id: string, handle: string) => {
	const e = get(edges);
	const edge = e.find(e => e.target === id && e.targetHandle === handle);
	if (!edge) return;

	const n = get(nodes);
	const node = n.find(n => n.id === edge.source);
	if (!node) return;

	if (!edge.sourceHandle) return;

	return node.data[edge.sourceHandle]
}


export type ApiKeys = {
	openai: string | null
}

export function getApiKeys(): ApiKeys {
	return {
		openai: get(openai_key)
	}
}

export type NodeError = string | {
	message: string;
	resolve?: () => void;
}
export type NodeStatusWithoutError = 'idle' | 'loading' | 'success';
export type NodeStatus = NodeStatusWithoutError | 'error';
export type OnExecuteCallbacks = {
	setStatus: (newStatus: NodeStatusWithoutError) => void;
	setErrors: (newErrors: NodeError[]) => void;
};

export const OPENAI_KEY_MISSING: NodeError = {
	message: 'OpenAI key missing. Please add your key in the settings tab.',
	resolve: openApiKeySettings
}