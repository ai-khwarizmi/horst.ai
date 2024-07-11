import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { cubicOut } from 'svelte/easing';
import type { TransitionConfig } from 'svelte/transition';
import {
	edges,
	inputData,
	inputDataPlaceholder,
	optionalInputsEnabled,
	outputDataDynamic,
	outputDataPlaceholder,
	projectType,
	state
} from '$lib';
import { type XYPosition } from '@xyflow/svelte';
import { get, writable } from 'svelte/store';
import { type CustomNodeName } from './nodes';
import {
	NodeType,
	type Input,
	type Output,
	type NodeValueType,
	type OnExecuteCallbacks
} from './types';
import { HorstFile } from './utils/horstfile';
import { createNewProject } from './project';
import { debounce } from 'lodash-es';

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

export const nodeIOHandlers: Record<string, NodeIOHandler<any, any>> = {};

export class NodeIOHandler<TInput extends string, TOutput extends string> {
	public nodeId: string;
	readonly inputs = writable<Input<TInput>[]>([]);
	readonly outputs = writable<Output<TOutput>[]>([]);

	executionCounter: number = 1;
	runningExecutions: number = 0;

	onExecuteCallbacks: OnExecuteCallbacks | null = null;
	isInputUnsupported: (
		inputId: string,
		data: Record<string, any>
	) => Promise<{
		unsupported: boolean;
		message?: string;
	}>;
	_onExecute: (
		callbacks: OnExecuteCallbacks,
		forceExecute: boolean,
		wrap: <T>(promise: Promise<T>) => Promise<T>,
		io: NodeIOHandler<TInput, TOutput>
	) => Promise<void>;

	private debouncedExecute = debounce((callbacks: OnExecuteCallbacks, forceExecute: boolean) => {
		this._runOnExecute(callbacks, forceExecute);
	}, 500);

	constructor(args: {
		nodeId: string;
		inputs: Input<TInput>[];
		outputs: Output<TOutput>[];
		onExecute: (
			callbacks: OnExecuteCallbacks,
			forceExecute: boolean,
			wrap: <T>(promise: Promise<T>) => Promise<T>,
			io: NodeIOHandler<TInput, TOutput>
		) => Promise<void>;
		isInputUnsupported: (
			inputId: string,
			data: Record<string, any>
		) => Promise<{
			unsupported: boolean;
			message?: string;
		}>;
	}) {
		this.isInputUnsupported = args.isInputUnsupported;
		this._onExecute = args.onExecute;

		this.nodeId = args.nodeId;
		this.inputs.set(args.inputs);
		this.outputs.set(args.outputs);

		nodeIOHandlers[this.nodeId] = this;
		setTimeout(() => {
			this.onOutputsChanged();
		}, 1);
	}

	onExecute = async (callbacks: OnExecuteCallbacks, forceExecute: boolean) => {
		this.debouncedExecute(callbacks, forceExecute);
	};

	_runOnExecute = async (callbacks: OnExecuteCallbacks, forceExecute: boolean) => {
		this.executionCounter++;
		this.runningExecutions++;
		const executionId = this.executionCounter;

		const throwOutdatedExecuteCall = () => {
			throw new Error(
				'Outdated onExecute call.' +
					' Expected: ' +
					executionId +
					' Actual: ' +
					this.executionCounter
			);
		};

		const wrap = async <T>(promise: Promise<T>): Promise<T> => {
			if (this.executionCounter !== executionId) {
				throwOutdatedExecuteCall();
			}
			const result = await promise;
			if (this.executionCounter !== executionId) {
				throwOutdatedExecuteCall();
			}
			return result;
		};

		const getExecutionCounter = () => {
			return this.executionCounter;
		};

		const ioProxy = new Proxy(this, {
			get(target, prop, receiver) {
				if (typeof target[prop as keyof typeof target] === 'function') {
					return async (...args: any[]) => {
						console.log('ioProxy', getExecutionCounter(), executionId);
						if (getExecutionCounter() !== executionId) {
							throwOutdatedExecuteCall();
						}
						return await (target[prop as keyof typeof target] as (...args: any[]) => any)(...args);
					};
				}
				return Reflect.get(target, prop, receiver);
			}
		});

		const callbacksProxy = new Proxy(callbacks, {
			get(target, prop, receiver) {
				if (typeof target[prop as keyof typeof target] === 'function') {
					return async (...args: any[]) => {
						if (getExecutionCounter() !== executionId) {
							throwOutdatedExecuteCall();
						}
						return await (target[prop as keyof typeof target] as (...args: any[]) => any)(...args);
					};
				}
				return Reflect.get(target, prop, receiver);
			}
		});

		try {
			//if we're killing the previous  execution we need to forceExecute to ensure it's executed
			if (this.runningExecutions > 1) {
				forceExecute = true;
			}
			const result = await this._onExecute(callbacksProxy, forceExecute, wrap, ioProxy);
			return result;
		} catch (e) {
			console.error('Error in onExecute', e);
		}
		this.runningExecutions--;
	};

	async updateUnsupportedInputs() {
		const data = get(inputData);
		for (const input of get(this.inputs)) {
			const isUnsupported = await this.isInputUnsupported(input.id, data[this.nodeId]!);
			if (isUnsupported.unsupported) {
				input.unsupported = isUnsupported;
			} else {
				delete input.unsupported;
			}
		}
	}

	destroy = () => {
		delete nodeIOHandlers[this.nodeId];
	};

	setOnExecuteCallbacks(callbacks: OnExecuteCallbacks) {
		this.onExecuteCallbacks = callbacks;
	}

	setOutputDataDynamic = (id: string, data: any) => {
		_setNodeOutputDataDynamic(this.nodeId, {
			[id]: data
		});
	};

	addInput = (...newInputs: Input<TInput>[]) => {
		state.update((state) => {
			const node = get(state.nodes).find((n) => n.id === this.nodeId);
			if (!node) return state;
			const inputs = Array.isArray(node.data['inputs']) ? node.data['inputs'] : [];
			const inputsToAdd = newInputs.filter((i) => !inputs.find((i2: any) => i2.id === i.id));
			node.data = { ...node.data, inputs: [...inputs, ...inputsToAdd] };
			return state;
		});
		this.inputs.update((i) => {
			const inputsToAdd = newInputs.filter((input) => !i.find((i2) => i2.id === input.id));
			return [...i, ...inputsToAdd];
		});
	};

	onOutputsChanged = () => {
		try {
			let changed = false;

			const currentState = get(state);
			const _inputData = { ...currentState.inputData };
			const _inputDataWithoutPlaceholders = { ...currentState.inputDataWithoutPlaceholder };

			get(this.inputs).forEach((input) => {
				const inputValue = this.getInputData(input.id);
				if (inputValue !== _inputData[this.nodeId]?.[input.id]) {
					if (!_inputData[this.nodeId]) {
						_inputData[this.nodeId] = {};
					}
					_inputData[this.nodeId]![input.id] = inputValue;
					changed = true;
				}

				const inputValueWithoutPlaceholder = this.getInputData(input.id, true);
				if (
					inputValueWithoutPlaceholder !== _inputDataWithoutPlaceholders[this.nodeId]?.[input.id]
				) {
					if (!_inputDataWithoutPlaceholders[this.nodeId]) {
						_inputDataWithoutPlaceholders[this.nodeId] = {};
					}
					_inputDataWithoutPlaceholders[this.nodeId]![input.id] = inputValueWithoutPlaceholder;
					changed = true;
				}
			});

			if (changed) {
				state.update((currentState) => ({
					...currentState,
					inputData: _inputData,
					inputDataWithoutPlaceholder: _inputDataWithoutPlaceholders
				}));
				this.onExecute(this.onExecuteCallbacks!, false);
				this.updateUnsupportedInputs().catch(console.error);
			}
			return changed;
		} catch (e: any) {
			this.onExecuteCallbacks?.setErrors([e.toString()]);
			return false;
		}
	};

	removeInput = (...ids: string[]) => {
		get(state).nodes.update((nodes) =>
			nodes.map((node) => {
				if (node.id === this.nodeId) {
					const inputs = Array.isArray(node.data['inputs']) ? node.data['inputs'] : [];
					return {
						...node,
						data: {
							...node.data,
							inputs: inputs.filter((i: any) => !ids.includes(i.id))
						}
					};
				}
				return node;
			})
		);

		this.inputs.update((i) => i.filter((input) => !ids.includes(input.id)));
	};

	removeOutput = (...ids: string[]) => {
		get(state).nodes.update((nodes) =>
			nodes.map((node) => {
				if (node.id === this.nodeId) {
					const outputs = Array.isArray(node.data['outputs']) ? node.data['outputs'] : [];
					return {
						...node,
						data: {
							...node.data,
							outputs: outputs.filter((o: any) => !ids.includes(o.id))
						}
					};
				}
				return node;
			})
		);

		this.outputs.update((o) => o.filter((output) => !ids.includes(output.id)));
	};

	addOutput = (...newOutputs: Output<TOutput>[]) => {
		get(state).nodes.update((nodes) =>
			nodes.map((node) => {
				if (node.id === this.nodeId) {
					const outputs = Array.isArray(node.data['outputs']) ? node.data['outputs'] : [];
					const outputsToAdd = newOutputs.filter((o) => !outputs.find((o2: any) => o2.id === o.id));
					return {
						...node,
						data: { ...node.data, outputs: [...outputs, ...outputsToAdd] }
					};
				}
				return node;
			})
		);

		this.outputs.update((o) => {
			const outputsToAdd = newOutputs.filter((output) => !o.find((o2) => o2.id === output.id));
			return [...o, ...outputsToAdd];
		});
	};

	getOutputData = (handle: string) => {
		const data = _getNodeOutputData(this.nodeId, handle) ?? null;
		return data;
	};

	getInputPlaceholderData = (handle: string) => {
		if (
			get(this.inputs).find((input: any) => input.id === handle)?.optional &&
			!get(optionalInputsEnabled)[this.nodeId]?.[handle]
		) {
			return undefined;
		}
		const data = _getNodeInputDataPlaceholder(this.nodeId, handle) ?? null;
		return data;
	};

	getInputData = (handle: string, ignorePlaceholder = false) => {
		let data = _getNodeInputData(this.nodeId, handle, ignorePlaceholder);

		const inputDef = get(this.inputs).find((input) => input.id === handle);

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
				throw new Error(
					`Invalid data type for input '${handle}'. Expected ${inputDef.type}, got ${data}`
				);
			}
		}
		return data ?? undefined;
	};

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
					return Array.isArray(data) && data.every((item) => this.validateDataType(item, baseType));
				}
				return false;
		}
	}

	setInputDataPlaceholder(handleId: string, value: any) {
		_setNodeInputDataPlaceholder(this.nodeId, { [handleId]: value });
		this.onOutputsChanged();
	}

	setOutputDataPlaceholder(handleId: string, value: any) {
		_setNodeOutputDataPlaceholder(this.nodeId, { [handleId]: value });
		this.onOutputsChanged();
	}
}

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

const _setNodeOutputDataDynamic = (id: string, data: Record<string, any>) => {
	state.update((currentState) => ({
		...currentState,
		outputDataDynamic: {
			...currentState.outputDataDynamic,
			[id]: {
				...currentState.outputDataDynamic[id],
				...data
			}
		}
	}));
};

const _setNodeOutputDataPlaceholder = (id: string, data: Record<string, any>) => {
	state.update((currentState) => ({
		...currentState,
		outputDataPlaceholder: {
			...currentState.outputDataPlaceholder,
			[id]: {
				...currentState.outputDataPlaceholder[id],
				...data
			}
		}
	}));
};

const _setNodeInputDataPlaceholder = (id: string, data: Record<string, any>) => {
	state.update((currentState) => {
		if (!currentState.inputDataPlaceholder[id]) {
			currentState.inputDataPlaceholder[id] = {
				...data
			};
		} else {
			currentState.inputDataPlaceholder[id] = {
				...currentState.inputDataPlaceholder[id],
				...data
			};
		}
		return {
			...currentState
		};
	});
};

const _getNodeOutputDataDynamic = (id: string, handle: string) => {
	const data = get(outputDataDynamic)[id];
	if (!data) return;
	return data[handle];
};

const _getNodeOutputDataPlaceholder = (id: string, handle: string) => {
	const data = get(outputDataPlaceholder)[id];
	if (!data) return;
	return data[handle];
};

const _getNodeOutputData = (id: string, handle: string) => {
	return _getNodeOutputDataDynamic(id, handle) || _getNodeOutputDataPlaceholder(id, handle);
};

const _getNodeInputDataPlaceholder = (id: string, handle: string) => {
	const data = get(inputDataPlaceholder)[id];
	if (!data) return;
	return data[handle];
};

const _getNodeInputDataWithoutPlaceholder = (id: string, handle: string) => {
	//yikes lol
	const e = get(edges);
	const edge = e.find((e) => e.target === id && e.targetHandle === handle);
	if (!edge) return;
	return edge.sourceHandle ? _getNodeOutputData(edge.source, edge.sourceHandle) : undefined;
};

const _getNodeInputData = (id: string, handle: string, ignorePlaceholder: boolean) => {
	if (ignorePlaceholder) {
		return _getNodeInputDataWithoutPlaceholder(id, handle);
	}
	return (
		_getNodeInputDataWithoutPlaceholder(id, handle) || _getNodeInputDataPlaceholder(id, handle)
	);
};
