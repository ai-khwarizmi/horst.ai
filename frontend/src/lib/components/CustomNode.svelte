<script lang="ts">
	import {
		cn,
		getNodeColors,
		isValidConnection,
		removeEdgeByIds,
		type OnExecuteCallbacks,
		type NodeStatus,
		type NodeStatusWithoutError,
		type NodeError,
		NodeIOHandler
	} from '$lib/utils';
	import { Handle, NodeResizer, NodeToolbar, Position, type Connection } from '@xyflow/svelte';
	import { onMount } from 'svelte';
	import { edges } from '..';
	import { get } from 'svelte/store';
	import { NodeType, type Input, type Output } from '@/types';
	import { registeredNodes, type CustomNodeName } from '@/nodes';
	import * as HoverCard from '$lib/components/ui/hover-card';
	import { Circle, LoaderCircle, TriangleAlert, Check } from 'lucide-svelte';

	const HANDLE_WIDTH = 12;
	const ROW_HEIGHT = 30;
	const ROW_GAP = 10;
	const BORDER_WIDTH = 2;
	const HEADER_HEIGHT = 40;

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

	$: outputConnections = $edges.filter((edge) => edge.source === id);
	$: inputConnections = $edges.filter((edge) => edge.target === id);

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
</script>

<div class={cn('flex flex-col h-full gap-1')} style="min-width: 200px">
	<NodeToolbar align={'start'} isVisible>
		<div class="flex items-center justify-between w-full">
			<div class="relative flex items-center space-x-2">
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
				<button
					class="m-2 bg-black border-1 text-xs text-white rounded-md p-1 transition-transform transform hover:scale-110 focus:scale-90"
					on:click={forceExecute}
				>
					run again
				</button>
			{/if}
		</div>
	</NodeToolbar>

	<NodeResizer
		minWidth={200}
		{minHeight}
		isVisible={selected}
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
							{@const connected = inputConnections.filter((edge) => edge.targetHandle === input.id)}
							<Handle
								type="target"
								position={Position.Left}
								class={cn(
									connected.length && '!bg-green-500',
									!connected.length && '!bg-gray-500 '
								)}
								style="left:1px; top: {top(
									index
								)}px; height: {ROW_HEIGHT}px; width: {HANDLE_WIDTH}px; border-radius: {HANDLE_WIDTH /
									2}px;"
								id={input.id}
								{isValidConnection}
								{onconnect}
							/>
							<div
								class="text-ellipsis truncate overflow-hidden w-full pl-2 -mt-[1px]"
								style="height: {ROW_HEIGHT}px; line-height: {ROW_HEIGHT}px;"
							>
								{#if input.label}
									{input.label} ({input.type})
								{:else}
									{input.type}
								{/if}
							</div>
						{/each}
					</div>
				{/if}
				{#if io.outputs.length > 0}
					<div
						class={cn('flex flex-col text-end ', io.inputs.length > 0 ? 'w-1/2' : 'w-full')}
						style="gap: {ROW_GAP}px"
					>
						{#each io.outputs as output, index}
							{@const connected = outputConnections.filter(
								(edge) => edge.sourceHandle === output.id
							)}
							<Handle
								type="source"
								position={Position.Right}
								class={cn(
									connected.length && '!bg-green-500',
									!connected.length && '!bg-gray-500 '
								)}
								style="right:1px; top: {top(
									index
								)}px; height: {ROW_HEIGHT}px; width: {HANDLE_WIDTH}px; border-radius: {HANDLE_WIDTH /
									2}px;"
								{isValidConnection}
								{onconnect}
								id={output.id}
							/>
							<div
								class="text-ellipsis truncate pr-2 overflow-hidden w-full -mt-[1px]"
								style="height: {ROW_HEIGHT}px; line-height: {ROW_HEIGHT}px;"
							>
								{#if output.label}
									{output.label} ({output.type})
								{:else}
									{output.type}
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
		{#if hasContent}
			<div class="flex flex-col overflow-auto p-2 flex-grow">
				<slot />
			</div>
		{/if}
	</div>
</div>
