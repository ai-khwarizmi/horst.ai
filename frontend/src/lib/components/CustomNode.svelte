<script lang="ts" context="module">
	export const HANDLE_WIDTH = 12;
	export const ROW_HEIGHT = 30;
	export const ROW_GAP = 10;
	export const BORDER_WIDTH = 2;
	export const HEADER_HEIGHT = 40;
</script>

<script lang="ts">
	import { cn, getNodeColors, removeEdgeByIds, NodeIOHandler } from '$lib/utils';
	import {
		type OnExecuteCallbacks,
		type NodeStatus,
		type NodeStatusWithoutError,
		type NodeError
	} from '@/types';
	import { NodeResizer, NodeToolbar, type Connection } from '@xyflow/svelte';
	import { onMount } from 'svelte';
	import { edges } from '..';
	import { get } from 'svelte/store';
	import { NodeType, SPECIAL_ERRORS } from '@/types';
	import { registeredNodes, type CustomNodeName } from '@/nodes';
	import * as HoverCard from '$lib/components/ui/hover-card';
	import { Circle, LoaderCircle, TriangleAlert, Check } from 'lucide-svelte';
	import Button from './ui/button/button.svelte';
	import CustomHandle from './CustomHandle.svelte';
	import { openApiKeySettings } from './settings/APIKeys.svelte';

	export let id: string | undefined = undefined; // Node ID
	export let type: string = '';
	export let selected: boolean = false;

	$: registered = registeredNodes[type as CustomNodeName];
	$: label = registered?.name || type;
	$: nodeType = registeredNodes[type]?.nodeType ?? NodeType.DEFAULT;
	$: colors = getNodeColors(nodeType);

	let status: NodeStatus = 'idle';

	let errors: NodeError[] = [];
	export let io: NodeIOHandler<any, any>;

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
		console.log('Forcing execute');
		onExecute(onExecuteCallbacks, true);
	};

	onMount(() => {
		if (!id) {
			throw new Error('Node ID is required');
		}
		setInterval(() => {
			onExecute(onExecuteCallbacks, false);
		}, 50);
	});

	const onconnect = (connections: Connection[]) => {
		const edgesToRemove: string[] = [];
		for (const connection of connections) {
			const conn: Connection & { edgeId?: string } = connection;
			const e = get(edges);
			if (!e) return;
			const edge = e.filter(
				(edge) =>
					edge.target === conn.target &&
					edge.targetHandle === conn.targetHandle &&
					edge.id !== conn.edgeId
			);
			edgesToRemove.push(...edge.map((edge) => edge.id));
		}
		removeEdgeByIds(...edgesToRemove);
	};

	$: rows = Math.max(io.inputs.length, io.outputs.length);

	$: hasContent = !!$$slots['default'];

	$: top = (index: number) =>
		ROW_HEIGHT * index + ROW_GAP * index + HEADER_HEIGHT + ROW_HEIGHT * 0.5 + BORDER_WIDTH + 4 + 7;

	$: minHeight =
		HEADER_HEIGHT +
		ROW_HEIGHT * rows +
		ROW_GAP * rows +
		BORDER_WIDTH * 2 +
		4 +
		5 +
		(hasContent ? 20 : 0);

	let hovered = false;
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
	style="min-width: 200px"
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
				{#if io.inputs.length > 0}
					<div
						class={cn('flex flex-col', io.outputs.length > 0 ? 'w-1/2' : 'w-full')}
						style="gap: {ROW_GAP}px"
					>
						{#each io.inputs as input, index}
							<CustomHandle nodeId={id} type="input" base={input} top={top(index)} />
						{/each}
					</div>
				{/if}
				{#if io.outputs.length > 0}
					<div
						class={cn('flex flex-col text-end ', io.inputs.length > 0 ? 'w-1/2' : 'w-full')}
						style="gap: {ROW_GAP}px"
					>
						{#each io.outputs as output, index}
							<CustomHandle nodeId={id} type="output" base={output} top={top(index)} />
						{/each}
					</div>
				{/if}
			</div>
		</div>
		{#if hasContent}
			<div class="flex flex-col overflow-auto p-2 flex-grow nodrag cursor-auto">
				<slot />
			</div>
		{/if}
	</div>
</div>
