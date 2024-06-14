import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { cubicOut } from "svelte/easing";
import type { TransitionConfig } from "svelte/transition";

import { edges, nodes } from "$lib";
import type { Connection, EdgeTypes } from "@xyflow/svelte";
import { get } from "svelte/store";

export const isValidConnection = (connection: any): boolean => {
	if (typeof connection.source !== 'string' || typeof connection.target !== 'string') {
		return false;
	}
	if (typeof connection.sourceHandle !== 'string' || typeof connection.targetHandle !== 'string') {
		return false;
	}
	if (connection.source === connection.target) {
		return false;
	}
	const [sourceType] = connection.sourceHandle.split('-');
	const [targetType] = connection.targetHandle.split('-');
	if (sourceType !== targetType && targetType !== 'any') {
		return false;
	}
	const e = get(edges);
	// check if target already has a connection
	// const hasConnection = e.some(edge => {
	// 	console.log(edge, connection)
	// 	return edge.targetHandle === connection.targetHandle && edge.target === connection.target;
	// });

	// if (hasConnection) {
	// 	return false;
	// }
	return true;
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

export const setOutputData = (id: string, handle: number, data: any) => {
	const n = get(nodes);
	const node = n.find(n => n.id === id);
	if (!node) return;
	node.data[handle] = data;
}

export const getInputData = (id: string, handle: number) => {
	const e = get(edges);
	const edge = e.find(e => e.target === id && e.targetHandle?.endsWith(`${handle}-i`));
	if (!edge) return;

	const n = get(nodes);
	const node = n.find(n => n.id === edge.source);
	if (!node) return;

	if (!edge.sourceHandle) return;

	const [, sourceHandleString] = edge.sourceHandle.split('-');
	const sourceHandle = parseInt(sourceHandleString);
	if (isNaN(sourceHandle)) return;
	return node.data[sourceHandle]
}


export type ApiKeys = {
	openai: string | null
}

export function getApiKeys(): ApiKeys {
	return {
		openai: window.localStorage.getItem('openai-api-key')
	}
}