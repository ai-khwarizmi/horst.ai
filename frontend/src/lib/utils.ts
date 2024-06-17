import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { cubicOut } from "svelte/easing";
import type { TransitionConfig } from "svelte/transition";
import { edges, nodes, openai_key } from "$lib";
import { type XYPosition } from "@xyflow/svelte";
import { get } from "svelte/store";
import { type CustomNodeName } from "./nodes";
import { NodeType, type Input } from "./types";
import { onDestroy } from "svelte";

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


export const nodeIOHandlers = new Map<string, NodeIOHandler<any, any>>()

export class NodeIOHandler<TInput extends string, TOutput extends string> {

	// TODO store these in a writable so the CustomNode can process it dynamically

	public nodeId: string;
	public inputs: Input<TInput>[];
	public outputs: Input<TOutput>[]

	constructor(
		args: {
			nodeId: string,
			inputs: Input<TInput>[],
			outputs: Input<TOutput>[]
		}
	) {
		this.nodeId = args.nodeId;
		this.inputs = args.inputs;
		this.outputs = args.outputs;
		nodeIOHandlers.set(this.nodeId, this);
		onDestroy(this.destroy)
	}

	destroy = () => {
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