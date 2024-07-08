<script lang="ts">
	import { cn, getNodeColors, NodeIOHandler, nodeIOHandlers } from '$lib/utils';
	import {
		type OnExecuteCallbacks,
		type NodeStatus,
		type NodeStatusWithoutError,
		type NodeError,
		type ConnectWith
	} from '@/types';
	import { NodeResizer, NodeToolbar, useConnection, useUpdateNodeInternals } from '@xyflow/svelte';
	import { onDestroy, onMount } from 'svelte';
	import { NodeType, SPECIAL_ERRORS } from '@/types';
	import { registeredNodes, type CustomNodeName } from '@/nodes';
	import * as HoverCard from '$lib/components/ui/hover-card';
	import { Circle, LoaderCircle, TriangleAlert, Check } from 'lucide-svelte';
	import Button from './ui/button/button.svelte';
	import CustomHandle from './CustomHandle.svelte';
	import { openApiKeySettings } from './settings/APIKeys.svelte';
	import { canConnectTypes, isValidConnection } from '@/utils/validate';
	import { edges, nodes, state } from '..';
	import { get } from 'svelte/store';
	import { Sheet, SheetContent, SheetTrigger, SheetClose } from '$lib/components/ui/sheet';
	import { optionalInputsEnabled } from '../index';

	export let selectable: boolean = false;
	export let deletable: boolean = false;
	export let sourcePosition: string | undefined = undefined;
	export let targetPosition: string | undefined = undefined;
	export let zIndex: number | undefined = undefined;
	export let dragging: boolean = false;
	export let draggable: boolean = false;
	export let dragHandle: string | undefined = undefined;
	export let parentId: string | undefined = undefined;
	export let isConnectable: boolean = false;
	export let positionAbsoluteX: number | undefined = undefined;
	export let positionAbsoluteY: number | undefined = undefined;
	export let width: number | undefined = undefined;
	export let height: number | undefined = undefined;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const otherProps = {
		selectable,
		deletable,
		sourcePosition,
		targetPosition,
		zIndex,
		dragging,
		draggable,
		dragHandle,
		parentId,
		isConnectable,
		positionAbsoluteX,
		positionAbsoluteY,
		width,
		height
	};

	export let id: string = '';
	export let type: string = '';
	export let selected: boolean = false;
	export let data: any = {};
	export let status: NodeStatus = 'idle';
	export let errors: NodeError[] = [];
	export let io: NodeIOHandler<any, any>;

	$: registered = registeredNodes[type as CustomNodeName];
	$: label = registered?.name || type;
	$: nodeType = registeredNodes[type]?.nodeType ?? NodeType.UNKNOWN;
	$: colors = getNodeColors(nodeType);

	let isResizing = false;

	const updateNodeInternals = useUpdateNodeInternals();

	const onExecuteCallbacks: OnExecuteCallbacks = {
		setStatus: (newStatus: NodeStatusWithoutError) => {
			errors = [];
			status = newStatus;
		},
		setErrors: (newErrors: NodeError[]) => {
			status = 'error';
			errors = newErrors;
		}
	};

	export const forceExecute = () => {
		io.onExecute(onExecuteCallbacks, true);
	};

	const connectToNodeOnMount = () => {
		if (data.connectWith) {
			const connectWith: ConnectWith = data.connectWith;
			const connectWithIO = nodeIOHandlers[connectWith.id];
			if (connectWithIO) {
				const handleToConnectTo = get(
					connectWithIO[connectWith.type === 'input' ? 'inputs' : 'outputs']
				).find((h) => h.id === connectWith.handle);
				if (handleToConnectTo) {
					const validHandle = get(io[connectWith.type === 'input' ? 'outputs' : 'inputs']).find(
						(h) =>
							canConnectTypes({
								input: connectWith.type === 'input' ? handleToConnectTo.type : h.type,
								output: connectWith.type === 'input' ? h.type : handleToConnectTo.type
							})
					);
					if (validHandle) {
						const source = connectWith.type === 'input' ? id : connectWith.id;
						const target = connectWith.type === 'input' ? connectWith.id : id;
						const sourceHandle = connectWith.type === 'input' ? validHandle.id : connectWith.handle;
						const targetHandle = connectWith.type === 'input' ? connectWith.handle : validHandle.id;
						get(nodes).update((nodes) => {
							// remove data.connectWith
							const node = nodes.find((n) => n.id === id);
							if (node) {
								delete node.data.connectWith;
							}
							return nodes;
						});
						get(edges).update((edges) => {
							edges.push({
								id: `xy-edge__${source}${sourceHandle}-${target}${targetHandle}`,
								source,
								target,
								sourceHandle,
								targetHandle
							});
							return edges;
						});
					}
				}
			}
		}
	};
	const setInputPlaceholderDataOnMount = () => {
		get(io.inputs).forEach((input) => {
			//get current default, if it exists
			const defaultValue = io.getInputPlaceholderData(input.id);
			if (defaultValue) return;

			switch (input.input?.inputOptionType) {
				case 'input-field':
					io.setInputDataPlaceholder(input.id, input.input.default ?? undefined);
					break;
				case 'dropdown':
					io.setInputDataPlaceholder(input.id, input.input.default ?? undefined);
					break;
				default:
					break;
			}
		});
	};
	onMount(() => {
		if (!id) {
			throw new Error('Node ID is required');
		}

		/*
		if (Array.isArray(data.inputs)) {
			io.addInput(...data.inputs);
		}
		if (Array.isArray(data.outputs)) {
			io.addOutput(...data.outputs);
		}
		*/
		io.setOnExecuteCallbacks(onExecuteCallbacks);

		connectToNodeOnMount();
		setInputPlaceholderDataOnMount();
	});

	onDestroy(() => {
		io.destroy();
	});

	$: inputs = io.inputs;
	$: outputs = io.outputs;

	$: hasContent = !!$$slots['default'];

	$: hasOptionalInputs = $inputs.some((input) => input.optional);

	let hovered = false;
	const c = useConnection();

	$: startType = $c.startHandle?.type;

	$: hide =
		$c.startHandle?.handleId &&
		!isValidConnection(
			{
				source: startType === 'source' ? $c.startHandle.nodeId : id,
				sourceHandle: startType === 'source' ? $c.startHandle.handleId : null,
				target: startType === 'source' ? id : $c.startHandle.nodeId,
				targetHandle: startType === 'source' ? null : $c.startHandle.handleId
			},
			true
		) &&
		$c.startHandle.nodeId !== id;

	let checked = get(optionalInputsEnabled)[id] || ({} as any);

	function handleCheckboxChange(inputId: string, event: any) {
		const isChecked = event.target.checked;
		state.update((state) => {
			const current = state.optionalInputsEnabled;
			if (!current[id]) {
				current[id] = {};
			}
			current[id][inputId] = isChecked;
			return {
				...state,
				optionalInputsEnabled: current
			};
		});
		updateNodeInternals(id);
	}
</script>

{#if errors[0] === SPECIAL_ERRORS.OPENAI_API_KEY_MISSING || errors[0] === SPECIAL_ERRORS.ANTHROPIC_API_KEY_MISSING || errors[0] === SPECIAL_ERRORS.LEONARDO_API_KEY_MISSING}
	<div
		class="bg-red-100 p-4 text-red-800 w-full h-full fixed top-0 left-0 flex justify-center items-center"
		style="z-index: 1000;"
	>
		<div class="text-center">
			<p class="font-bold">
				{#if errors[0] === SPECIAL_ERRORS.OPENAI_API_KEY_MISSING}
					OpenAI API Key Missing
				{:else if errors[0] === SPECIAL_ERRORS.ANTHROPIC_API_KEY_MISSING}
					Anthropic API Key Missing
				{:else if errors[0] === SPECIAL_ERRORS.LEONARDO_API_KEY_MISSING}
					Leonardo.ai API Key Missing
				{/if}
			</p>
			<p>Please add your API key in the settings to use this node.</p>
			<Button variant="outline" size="sm" on:click={openApiKeySettings} class="mt-2">
				Set API Key
			</Button>
		</div>
	</div>
{/if}
<div
	class={cn('flex flex-col h-full gap-1')}
	style="min-width: 200px; opacity: {hide ? 0.5 : 1}; max-height: 100%;"
	on:mouseenter={() => (hovered = true)}
	on:mouseleave={() => (hovered = false)}
	on:keydown={() => {}}
	role="button"
	tabindex="0"
>
	<NodeToolbar align={'start'} isVisible>
		<div class="flex items-center justify-between gap-2 w-full">
			<div class="relative flex items-centerspace-x-2">
				{#if status === 'loading'}
					<LoaderCircle class="animate-spin w-6 h-6" />
				{:else if status === 'error'}
					<HoverCard.Root openDelay={50}>
						<HoverCard.Trigger>
							<TriangleAlert class="w-6 h-6 text-red-500" />
						</HoverCard.Trigger>
						<HoverCard.Content
							class="p-2 text-xs max-w-xs max-h-60 overflow-y-auto overflow-x-hidden break-words"
						>
							<ul class="list-disc list-inside">
								{#each errors as error}
									{#if typeof error === 'string'}
										<li>{error}</li>
									{:else}
										<li>
											{error?.message}
										</li>
									{/if}
								{/each}
							</ul>
						</HoverCard.Content>
					</HoverCard.Root>
				{:else if status === 'idle'}
					<Circle class="w-6 h-6 invisible" />
				{:else if status === 'success'}
					<Check class="w-6 h-6 text-green-500" />
				{/if}
			</div>

			{#if nodeType === NodeType.FUNCTION && (status === 'success' || status === 'error')}
				<Button size="flat" on:click={forceExecute}>Re-run</Button>
			{/if}
		</div>
	</NodeToolbar>

	<NodeResizer
		minWidth={200}
		minHeight={300}
		isVisible={selected || hovered}
		lineClass="!border-[1.5px]"
		handleClass="!size-2"
		onResizeStart={() => (isResizing = true)}
		onResize={() => {
			isResizing = true;
		}}
		onResizeEnd={() => {
			isResizing = false;
		}}
	/>
	<div
		class="relative w-full flex flex-col flex-1 max-h-full bg-[rgba(255,255,255,0.7)] rounded-sm"
	>
		<div
			class={cn(
				colors.fullbackground,
				'w-full rounded-sm text-center font-semibold leading-none text-white flex items-center justify-between flex-shrink-0 mb-2'
			)}
			style="height: 40px;"
		>
			<div class="ml-2">
				{#if registered?.Icon}
					<svelte:component this={registered.Icon} size="24" />
				{/if}
			</div>
			<div class="flex-grow text-center">{label}</div>
			<div class="w-[20px]"></div>
		</div>

		<div
			class={cn(
				'shadow-md rounded-md bg-white border-stone-400 flex flex-col',
				'flex-1 min-h-0',
				colors.border,
				errors.length && 'border-red-500'
			)}
			style="min-width: 200px; border-width: 2px;"
		>
			<div
				class={cn(
					'rounded-sm py-2 text-black flex-shrink-0',
					hasContent && 'border-b-2 rounded-b-none',
					colors.background,
					colors.text,
					colors.border
				)}
			>
				<div class="flex justify-between font-semibold leading-none max-w-full flex-shrink-0">
					{#if $inputs.length > 0}
						<div class={cn('flex flex-col', $outputs.length > 0 ? 'w-1/2' : 'w-full')}>
							{#each $inputs as input}
								<CustomHandle nodeId={id} type="input" base={input} />
							{/each}
						</div>
					{/if}
					{#if $outputs.length > 0}
						<div class={cn('flex flex-col text-end ', $inputs.length > 0 ? 'w-1/2' : 'w-full')}>
							{#each $outputs as output}
								<CustomHandle nodeId={id} type="output" base={output} />
							{/each}
						</div>
					{/if}
				</div>
				{#if hasOptionalInputs}
					<div class="flex justify-left items-center ml-5">
						<Sheet>
							<SheetTrigger>
								<Button
									class={`${colors.fullbackground} hover:${colors.background} text-white font-bold py-2 px-4 rounded cursor-pointer`}
									size="flat"
								>
									Other Settings
								</Button>
							</SheetTrigger>
							<SheetContent side="right" class="overflow-y-auto scrollbar-visible">
								<SheetClose>
									<Button variant="outline" size="sm">Close</Button>
								</SheetClose>
								<h2 class="text-lg font-semibold">Node Settings</h2>
								<div class="mt-4">
									{#each $inputs as input}
										<div class="mb-4">
											{#if input.optional}
												<label class="flex items-center">
													<input
														type="checkbox"
														bind:checked={checked[input.id]}
														on:change={(e) => handleCheckboxChange(input.id, e)}
														disabled={input.unsupported?.unsupported}
														class="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 transition duration-150 ease-in-out
															disabled:opacity-50 disabled:cursor-not-allowed"
													/>
													<span class="ml-2">{input.label}</span>
												</label>
											{:else}
												<p>✔ {input.label}</p>
											{/if}
											{#if input.unsupported}
												<p class="text-red-500 text-xs mt-1 ml-5">
													{input.unsupported.message}
												</p>
											{/if}
										</div>
									{/each}
								</div>
							</SheetContent>
						</Sheet>
					</div>
				{/if}
			</div>

			{#if hasContent}
				<div class="flex-1 min-h-0 overflow-hidden nowheel nowheel">
					<div
						class={cn(
							'h-full overflow-x-hidden overflow-y-auto p-2 nodrag cursor-auto',
							isResizing && 'pointer-events-none'
						)}
					>
						<slot />
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
