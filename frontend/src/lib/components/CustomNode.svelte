<script lang="ts" context="module">
	export const HANDLE_WIDTH = 12;
	export const ROW_HEIGHT = 30;
	export const ROW_GAP = 10;
	export const BORDER_WIDTH = 2;
	export const HEADER_HEIGHT = 40;

	const handlers: Record<string, () => void> = {};

	// Should we change this to timeouts to avoid overlapping executions?
	setInterval(() => {
		Object.values(handlers).forEach((handler) => handler());
	}, 50);
</script>

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
	import { edges, nodes } from '..';
	import { get } from 'svelte/store';

	/* eslint-disable*/
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
	/* eslint-enable*/

	// these are passed in
	export let id: string = '';
	export let type: string = '';
	export let selected: boolean = false;
	export let data: any = {};

	$: registered = registeredNodes[type as CustomNodeName];
	$: label = registered?.name || type;
	$: nodeType = registeredNodes[type]?.nodeType ?? NodeType.UNKNOWN;
	$: colors = getNodeColors(nodeType);

	let isResizing = false;

	export let status: NodeStatus = 'idle';

	export let errors: NodeError[] = [];
	export let io: NodeIOHandler<any, any>;

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

	export let onExecute: (callbacks: OnExecuteCallbacks, forceExecute: boolean) => void = () => {};

	const forceExecute = () => {
		onExecute(onExecuteCallbacks, true);
	};

	const toggleOptionalInputs = () => {
		showOptionalInputs = !showOptionalInputs;
		updateNodeInternals(id);
	};

	onMount(() => {
		if (!id) {
			throw new Error('Node ID is required');
		}

		if (Array.isArray(data.inputs)) {
			io.addInput(...data.inputs);
		}
		if (Array.isArray(data.outputs)) {
			io.addOutput(...data.outputs);
		}

		handlers[id] = () => onExecute(onExecuteCallbacks, false);
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
						nodes.update((nodes) => {
							// remove data.connectWith
							const node = nodes.find((n) => n.id === id);
							if (node) {
								delete node.data.connectWith;
							}
							return nodes;
						});
						edges.update((edges) => {
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
	});

	onDestroy(() => {
		io.destroy();
		delete handlers[id];
	});

	$: inputs = io.inputs;
	$: outputs = io.outputs;

	$: rows = Math.max($inputs.length, $outputs.length);
	$: hasContent = !!$$slots['default'];

	$: minHeight =
		HEADER_HEIGHT +
		ROW_HEIGHT * rows +
		ROW_GAP * rows +
		BORDER_WIDTH * 2 +
		4 +
		5 +
		(hasContent ? 20 : 0);

	$: hasOptionalInputs = $inputs.some((input) => input.optional);
	let showOptionalInputs = false;

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
</script>

{#if errors[0] === SPECIAL_ERRORS.OPENAI_API_KEY_MISSING}
	<div
		class="bg-red-100 p-4 text-red-800 w-full h-full fixed top-0 left-0 flex justify-center items-center"
	>
		<div class="text-center">
			<p class="font-bold">OpenAI API Key Missing</p>
			<p>Please add your OpenAI API key in the settings to use this node.</p>
			<Button variant="outline" size="sm" on:click={openApiKeySettings} class="mt-2">
				Set OpenAI Key
			</Button>
		</div>
	</div>
{/if}
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class={cn('flex flex-col h-full gap-1')}
	style="min-width: 200px; opacity: {hide ? 0.5 : 1};"
	on:mouseenter={() => (hovered = true)}
	on:mouseleave={() => (hovered = false)}
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
						<HoverCard.Content class="p-2 text-xs">
							<ul class="list-disc list-inside">
								{#each errors as error}
									{#if typeof error === 'string'}
										<li>{error}</li>
									{:else}
										<li>
											{error.message}
											<button class="text-blue-500 hover:underline" on:click={error.resolve}>
												Resolve
											</button>
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
		{minHeight}
		isVisible={selected || hovered}
		lineClass="!border-[1.5px]"
		handleClass="!size-2"
		onResizeStart={() => (isResizing = true)}
		onResizeEnd={() => (isResizing = false)}
	/>
	<div
		class={cn(
			colors.fullbackground,
			'w-full rounded-sm text-center font-semibold leading-none text-white flex items-center justify-center flex-shrink-0'
		)}
		style="height: {HEADER_HEIGHT}px;"
	>
		{label}
	</div>

	<div
		class={cn(
			'shadow-md rounded-md bg-white border-stone-400 flex flex-col flex-grow',
			colors.border,
			errors.length && 'border-red-500'
		)}
		style="min-width: 200px; border-width: {BORDER_WIDTH}px"
	>
		<div
			class={cn(
				'rounded-sm py-2 text-black',
				hasContent && 'border-b-2 rounded-b-none',
				colors.background,
				colors.text,
				colors.border
			)}
		>
			<div
				class="flex justify-between font-semibold leading-none gap-4 max-w-full overflow-hidden flex-shrink-0"
			>
				{#if $inputs.length > 0}
					<div
						class={cn('flex flex-col', $outputs.length > 0 ? 'w-1/2' : 'w-full')}
						style="gap: {ROW_GAP}px"
					>
						{#each $inputs as input}
							<CustomHandle {showOptionalInputs} nodeId={id} type="input" base={input} />
						{/each}
					</div>
				{/if}
				{#if $outputs.length > 0}
					<div
						class={cn('flex flex-col text-end ', $inputs.length > 0 ? 'w-1/2' : 'w-full')}
						style="gap: {ROW_GAP}px"
					>
						{#each $outputs as output}
							<CustomHandle nodeId={id} type="output" base={output} />
						{/each}
					</div>
				{/if}
			</div>
			{#if hasOptionalInputs}
				<div class="flex justify-left items-center ml-2 mt-4">
					<Button size="flat" class="text-button" on:click={toggleOptionalInputs}>
						{showOptionalInputs ? '▲ Hide Optional' : '▼ Show Optional'}
					</Button>
				</div>
			{/if}
		</div>

		{#if hasContent}
			<div
				class={cn(
					'flex flex-col overflow-auto p-2 flex-grow nodrag cursor-auto',
					isResizing && 'pointer-events-none'
				)}
			>
				<slot />
			</div>
		{/if}
	</div>
</div>
