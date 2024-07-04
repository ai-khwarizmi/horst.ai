import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { cubicOut } from "svelte/easing";
import type { TransitionConfig } from "svelte/transition";
import { edges, handlers, inputData, inputDataWithoutPlaceholder, inputPlaceholderData, optionalInputsEnabled, nodes, outputData } from "$lib";
import { type XYPosition } from "@xyflow/svelte";
import { get, writable } from "svelte/store";
import { type CustomNodeName } from "./nodes";
import { NodeType, type Input, type Output, type NodeValueType, type OnExecuteCallbacks } from "./types";
import { HorstFile } from "./utils/horstfile";

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

export const nodeIOHandlers: Record<string, NodeIOHandler<any, any>> = {};

export class NodeIOHandler<TInput extends string, TOutput extends string> {
	public nodeId: string;
	readonly inputs = writable<Input<TInput>[]>([]);
	readonly outputs = writable<Output<TOutput>[]>([]);

	onExecuteCallbacks: OnExecuteCallbacks | null = null;
	isInputUnsupported: (inputId: string, data: Record<string, any>) => Promise<{
		unsupported: boolean,
		message?: string
	}>;
	onExecute: (callbacks: OnExecuteCallbacks, forceExecute: boolean) => void;

	constructor(args: {
		nodeId: string;
		inputs: Input<TInput>[];
		outputs: Output<TOutput>[];
		onExecute: (callbacks: OnExecuteCallbacks, forceExecute: boolean) => void;
		isInputUnsupported: (inputId: string, data: Record<string, any>) => Promise<{
			unsupported: boolean,
			message?: string
		}>;
	}) {
		this.isInputUnsupported = args.isInputUnsupported;
		this.onExecute = args.onExecute;

		this.nodeId = args.nodeId;
		this.inputs.set(args.inputs);
		this.outputs.set(args.outputs);

		nodeIOHandlers[this.nodeId] = this;
		setTimeout(() => {
			this.onOutputsChanged();
		}, 1);
	}

	async updateUnsupportedInputs() {
		const data = get(inputData);
		for (const input of get(this.inputs)) {
			const isUnsupported = await this.isInputUnsupported(input.id, data[this.nodeId]);
			if (isUnsupported.unsupported) {
				input.unsupported = isUnsupported;
			} else {
				delete input.unsupported;
			}
		}
	}

	destroy = () => {
		this.deleteHandler();
		delete nodeIOHandlers[this.nodeId];
	}

	setOnExecuteCallbacks(callbacks: OnExecuteCallbacks) {
		this.onExecuteCallbacks = callbacks;
	}

	setHandler(handler: () => void) {
		handlers[this.nodeId] = handler;
	}
	deleteHandler() {
		delete handlers[this.nodeId];
	}

	setOutputData = (id: string, data: any) => {
		_setNodeOutputData(this.nodeId, {
			[id]: data
		})
	}

	addInput = (...newInputs: Input<TInput>[]) => {
		nodes.update(n => {
			const node = n.find(n => n.id === this.nodeId);
			if (!node) return n;
			const inputs = Array.isArray(node.data.inputs) ? node.data.inputs : [];
			const inputsToAdd = newInputs.filter(i => !inputs.find((i2: any) => i2.id === i.id));
			node.data = { ...node.data, inputs: [...inputs, ...inputsToAdd] };
			return n;
		})
		this.inputs.update(i => {
			const inputsToAdd = newInputs.filter(input => !i.find(i2 => i2.id === input.id));
			return [...i, ...inputsToAdd];
		});
	}

	onOutputsChanged = () => {
		//iterate over all inputs, and check if their value changed
		try {
			let changed = false;
			let changedWithoutPlaceholders = false;
			const _inputData = get(inputData);
			const _inputDataWithoutPlaceholders = get(inputDataWithoutPlaceholder);
			get(this.inputs).forEach((input) => {
				const inputValue = this.getInputData(input.id);
				if (inputValue !== _inputData[this.nodeId]?.[input.id]) {
					if (!_inputData[this.nodeId]) {
						_inputData[this.nodeId] = {};
					}
					_inputData[this.nodeId][input.id] = inputValue;
					changed = true;
				}
				const inputValueWithoutPlaceholder = this.getInputData(input.id, true);
				if (inputValueWithoutPlaceholder !== _inputDataWithoutPlaceholders[this.nodeId]?.[input.id]) {
					if (!_inputDataWithoutPlaceholders[this.nodeId]) {
						_inputDataWithoutPlaceholders[this.nodeId] = {};
					}
					_inputDataWithoutPlaceholders[this.nodeId][input.id] = inputValueWithoutPlaceholder;
					changedWithoutPlaceholders = true;
				}
			})
			if (changedWithoutPlaceholders) {
				inputDataWithoutPlaceholder.set(_inputDataWithoutPlaceholders);
			}
			if (changed) {
				inputData.set(_inputData);
				this.onExecute(this.onExecuteCallbacks!, false);
				this.updateUnsupportedInputs().catch(console.error);
			}
			return changed;
		} catch (e: any) {
			this.onExecuteCallbacks?.setErrors([e.toString()]);
			return false;
		}
	}

	removeInput = (...ids: string[]) => {
		nodes.update(n => {
			const node = n.find(n => n.id === this.nodeId);
			if (!node) return n;
			const inputs = Array.isArray(node.data.inputs) ? node.data.inputs : [];
			node.data = { ...node.data, inputs: inputs.filter(i => !ids.includes(i.id)) };
			return n;
		})
		this.inputs.update(i => i.filter(input => !ids.includes(input.id)));
	}

	removeOutput = (...ids: string[]) => {
		nodes.update(n => {
			const node = n.find(n => n.id === this.nodeId);
			if (!node) return n;
			const outputs = Array.isArray(node.data.outputs) ? node.data.outputs : [];
			node.data = { ...node.data, outputs: outputs.filter((o: any) => !ids.includes(o.id)) };
			return n;
		})
		this.outputs.update(o => o.filter(output => !ids.includes(output.id)));
	}

	addOutput = (...newOutputs: Output<TOutput>[]) => {
		nodes.update(n => {
			const node = n.find(n => n.id === this.nodeId);
			if (!node) return n;
			const outputs = Array.isArray(node.data.outputs) ? node.data.outputs : [];
			const outputsToAdd = newOutputs.filter(o => !outputs.find((o2: any) => o2.id === o.id));
			node.data = { ...node.data, outputs: [...outputs, ...outputsToAdd] };
			return n;
		})
		this.outputs.update(o => {
			const outputsToAdd = newOutputs.filter(output => !o.find(o2 => o2.id === output.id));
			return [...o, ...outputsToAdd];
		});
	}

	getOutputData = (handle: string) => {
		const data = _getNodeOutputData(this.nodeId, handle) ?? null;
		return data;
	}

	getInputPlaceholderData = (handle: string) => {
		if (get(this.inputs).find((input: any) => input.id === handle)?.optional && !get(optionalInputsEnabled)[this.nodeId]?.[handle]) {
			return undefined;
		}
		const data = _getNodeInputPlaceholderData(this.nodeId, handle) ?? null;
		return data;
	}

	getInputData = (handle: string, ignorePlaceholder = false) => {
		let data = _getNodeInputData(this.nodeId, handle);

		if (!ignorePlaceholder && (data === null || data === undefined))
			data = this.getInputPlaceholderData(handle);

		const inputDef = get(this.inputs).find(input => input.id === handle);

		if (inputDef && data) {
			if (typeof data === 'string' && inputDef.type === 'number') {
				data = parseFloat(data);
			}
			if (typeof data === 'string' && inputDef.type === 'json') {
				data = JSON.parse(data);
			}
			if (typeof data === 'string' && inputDef.type === 'boolean') {
				data = data === 'true';
			}
			if (!this.validateDataType(data, inputDef.type)) {
				throw new Error(`Invalid data type for input '${handle}'. Expected ${inputDef.type}, got ${data}`);
			}
		}
		return data ?? undefined;
	}

	private validateDataType(data: any, expectedType: NodeValueType): boolean {
		switch (expectedType) {
			case 'number':
				return typeof data === 'number' && !isNaN(data);
			case 'text':
				return typeof data === 'string';
			case 'boolean':
				return typeof data === 'boolean' || data === 'true' || data === 'false';
			case 'file[]':
				return Array.isArray(data);
			case 'file':
				return data instanceof HorstFile || Array.isArray(data);
			case 'any':
				return true;
			default:
				// Handle array types
				if (expectedType.endsWith('[]')) {
					const baseType = expectedType.slice(0, -2) as 'number' | 'text' | 'boolean';
					return Array.isArray(data) && data.every(item => this.validateDataType(item, baseType));
				}
				return false;
		}
	}

	setInputPlaceholderData(handleId: string, value: any) {
		_setNodeInputPlaceholderData(this.nodeId, { [handleId]: value });
		this.onOutputsChanged();
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

export const addNode = (type: CustomNodeName, pos: XYPosition, connectWith?: {
	id: string;
	handle: string;
}) => {
	const node = {
		id: Math.random().toString(36).substr(2, 9),
		type,
		data: {
			connectWith,
		},
		selected: true,
		position: pos
	};
	nodes.update((prev) => {
		const nodes = prev.map(prev => ({
			...prev,
			selected: false
		}))
		nodes.push(node);
		return nodes;
	});

	return node
};

export const _setNodeOutputData = (id: string, data: Record<string, any>) => {
	outputData.update(currentData => ({
		...currentData,
		[id]: {
			...currentData[id],
			...data
		}
	}));
}

export const _setNodeInputPlaceholderData = (id: string, data: Record<string, any>) => {
	inputPlaceholderData.update(currentData => ({
		...currentData,
		[id]: {
			...currentData[id],
			...data
		}
	}));
}

export const _getNodeOutputData = (id: string, handle: string) => {
	const data = get(outputData)[id];
	if (!data) return;
	return data[handle];
}

export const _getNodeInputPlaceholderData = (id: string, handle: string) => {
	const data = get(inputPlaceholderData)[id];
	if (!data) return;
	return data[handle];
}

export const _getNodeInputData = (id: string, handle: string) => {
	const e = get(edges);
	const edge = e.find(e => e.target === id && e.targetHandle === handle);
	if (!edge) return;
	return edge.sourceHandle ? _getNodeOutputData(edge.source, edge.sourceHandle) : undefined;
}
