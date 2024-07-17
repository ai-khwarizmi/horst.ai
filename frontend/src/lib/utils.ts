import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { cubicOut } from 'svelte/easing';
import type { TransitionConfig } from 'svelte/transition';
import { projectType, state } from '@/index';
import { type XYPosition } from '@xyflow/svelte';
import { get } from 'svelte/store';
import { type CustomNodeName } from './nodes';
import { NodeType } from './types';
import { createNewProject } from './project';

export const getNodeColors = (
	type: NodeType
): { fullbackground: string; background: string; text: string; border: string } => {
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
};

export const removeEdgeByIds = (...ids: string[]) => {
	get(state).edges.update((edges) => edges.filter((edge) => !ids.includes(edge.id)));
};

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
	const transform = style.transform === 'none' ? '' : style.transform;

	const scaleConversion = (valueA: number, scaleA: [number, number], scaleB: [number, number]) => {
		const [minA, maxA] = scaleA;
		const [minB, maxB] = scaleB;

		const percentage = (valueA - minA) / (maxA - minA);
		const valueB = percentage * (maxB - minB) + minB;

		return valueB;
	};

	const styleToString = (style: Record<string, number | string | undefined>): string => {
		return Object.keys(style).reduce((str, key) => {
			if (style[key] === undefined) return str;
			return str + `${key}:${style[key]};`;
		}, '');
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

export const addNode = async (
	type: CustomNodeName,
	pos: XYPosition,
	connectWith?: {
		id: string;
		handle: string;
	}
) => {
	console.log('adding new node', type);
	const node = {
		id: Math.random().toString(36).substr(2, 9),
		type,
		data: {
			connectWith
		},
		selected: true,
		position: pos
	};
	if (get(projectType) === 'UNINITIALIZED') {
		console.log('node being added, but projet is not initialized');
		await createNewProject([node]);
	} else {
		get(state).nodes.update((nodes) => {
			const updatedNodes = nodes.map((prev) => ({
				...prev,
				selected: false
			}));
			updatedNodes.push(node);
			return updatedNodes;
		});
	}

	return node;
};

export const removeNode = (id: string) => {
	get(state).nodes.update((nodes) => nodes.filter((node) => node.id !== id));
	get(state).edges.update((edges) =>
		edges.filter((edge) => edge.source !== id && edge.target !== id)
	);
};
