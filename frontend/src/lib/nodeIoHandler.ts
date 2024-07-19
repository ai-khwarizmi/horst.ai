import { get, writable } from 'svelte/store';
import type { Input, NodeValueType, OnExecuteCallbacks, Output } from './types';
import {
	autoPlay,
	edges,
	executionsRunning,
	inputData,
	inputDataPlaceholder,
	nodeIOHandlers,
	optionalInputsEnabled,
	outputDataDynamic,
	outputDataPlaceholder,
	state,
	waitingForChangedOutputs
} from '.';
import { debounce } from 'lodash-es';
import { HorstFile } from './utils/horstfile';

export type OnExecuteFunction<TInput extends string, TOutput extends string> = (
	callbacks: OnExecuteCallbacks,
	wrap: <T>(promise: Promise<T>) => Promise<T>,
	io: NodeIOHandler<TInput, TOutput>
) => Promise<void>;

export type IsInputUnsupportedFunction = (
	inputId: string,
	data: Record<string, any>
) => Promise<{
	unsupported: boolean;
	message?: string;
}>;

export class NodeIOHandler<TInput extends string, TOutput extends string> {
	public nodeId: string;
	readonly inputs = writable<Input<TInput>[]>([]);
	readonly outputs = writable<Output<TOutput>[]>([]);

	executionCounter: number = 1;
	runningExecutions: number = 0;

	unsubscribeAutoPlay: () => void;
	unsubscribeIsPlaying: () => void;
	executePending: boolean = false;
	playsRemaining: number = 0;

	isInputUnsupported: IsInputUnsupportedFunction;

	private onExecuteCallbacks: OnExecuteCallbacks | null = null;
	private _onExecute: OnExecuteFunction<TInput, TOutput>;
	private _debouncedExecute = debounce(async (callbacks: OnExecuteCallbacks) => {
		await this._runOnExecute(callbacks);
		console.log('debounced execute done', this.nodeId);
		executionsRunning.update((n) => {
			n.set(this.nodeId, false);
			return n;
		});
	}, 500);
	private _resetDynamicState: () => void;

	constructor(args: {
		nodeId: string;
		inputs: Input<TInput>[];
		outputs: Output<TOutput>[];

		onExecute: OnExecuteFunction<TInput, TOutput>;
		isInputUnsupported: IsInputUnsupportedFunction;
		resetDynamicState: () => void;
	}) {
		this.isInputUnsupported = args.isInputUnsupported;
		this._onExecute = args.onExecute;
		this._resetDynamicState = args.resetDynamicState;

		this.nodeId = args.nodeId;
		this.inputs.set(args.inputs);
		this.outputs.set(args.outputs);

		nodeIOHandlers[this.nodeId] = this;
		setTimeout(() => {
			this.onOutputsChanged();
		}, 1);

		this.unsubscribeAutoPlay = get(state).autoPlay.subscribe((value) =>
			this.onToggleAutoPlay(value)
		);
		this.unsubscribeIsPlaying = get(state).isPlaying.subscribe((value) =>
			this.onToggleIsPlaying(value)
		);
	}

	/*
	this resets the dynamic state of the node
	*/
	resetNode() {
		state.update((s) => {
			s.outputDataDynamic[this.nodeId] = {};
			return s;
		});
		this._resetDynamicState();
	}

	onToggleAutoPlay = (value: boolean) => {
		if (value && this.executePending) {
			this.onExecute();
		}
	};

	onToggleIsPlaying = (value: boolean) => {
		//console.log('onToggleIsPlaying', this.nodeId, value);
		if (value) {
			this.playsRemaining = 1;
			if (this.executePending) {
				this.onExecute();
			}
		} else {
			this.playsRemaining = 0;
		}
	};

	runDebounceExecute(callbacks: OnExecuteCallbacks) {
		executionsRunning.update((n) => {
			n.set(this.nodeId, true);
			return n;
		});
		this._debouncedExecute(callbacks);
	}

	onExecute() {
		this.runDebounceExecute(this.onExecuteCallbacks!);
	}

	private _runOnExecute = async (callbacks: OnExecuteCallbacks) => {
		const _isPlaying = get(get(state).isPlaying);
		const _autoPlay = get(get(autoPlay));
		if (!_autoPlay && !_isPlaying) {
			this.executePending = true;
			//console.log('not executing. will execute when autoPlay or isPlaying is true ', this.nodeId);
			return;
		} else if (_autoPlay === true) {
			//console.log('autoPlay is true, executing node ', this.nodeId);
		} else if (_isPlaying && this.playsRemaining > 0) {
			//console.log(
			//	'isPlaying is true, but playsRemaining is greater than 0, executing node ',
			//	this.nodeId
			//);
			this.playsRemaining--;
		} else if (_isPlaying && this.playsRemaining <= 0) {
			//console.log('isPlaying is true, but playsRemaining is 0, NOT executing node ', this.nodeId);
			this.executePending = true;
			return;
		}

		this.executePending = false;
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
					return (...args: any[]) => {
						if (getExecutionCounter() !== executionId) {
							throwOutdatedExecuteCall();
						}
						const result = (target[prop as keyof typeof target] as (...args: any[]) => any)(
							...args
						);
						if (result instanceof Promise) {
							return result.then((res) => {
								if (getExecutionCounter() !== executionId) {
									throwOutdatedExecuteCall();
								}
								return res;
							});
						} else {
							if (getExecutionCounter() !== executionId) {
								throwOutdatedExecuteCall();
							}
							return result;
						}
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
			const result = await this._onExecute(callbacksProxy, wrap, ioProxy);
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

	setOutputDataDynamic = <T extends TInput>(id: keyof T | string, data: any) => {
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

	_onOutputsChanged = () => {
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
				if (get(state).isPlaying) {
					this.playsRemaining = 1;
				}
				this.onExecute();
				this.updateUnsupportedInputs().catch(console.error);
			}
			return changed;
		} catch (e: any) {
			console.error('Error in _onOutputsChanged', e);
			this.onExecuteCallbacks?.setErrors([e.toString()]);
			return false;
		}
	};

	onOutputsChanged = () => {
		waitingForChangedOutputs.update((n) => {
			n.set(this.nodeId, false);
			return n;
		});
		this._onOutputsChanged();
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
				return (
					Array.isArray(data) &&
					data.every((item) => item instanceof HorstFile || HorstFile.isHorstFile(item))
				);
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

const setAllNodesWaitingForOutputs = (value: boolean) => {
	const allNodes = get(get(state).nodes);
	waitingForChangedOutputs.update((n) => {
		allNodes.forEach((node) => {
			n.set(node.id, value);
		});
		return n;
	});
};

const _setNodeOutputDataDynamic = (id: string, data: Record<string, any>) => {
	setAllNodesWaitingForOutputs(true);
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
	setAllNodesWaitingForOutputs(true);
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
	setAllNodesWaitingForOutputs(true);
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
