<script lang="ts">
	import {
		cn,
		getNodeColors,
		isValidConnection,
		removeEdgeByIds,
		type OnExecuteCallbacks,
		type NodeStatus,
		type NodeStatusWithoutError
	} from '$lib/utils';
	import { Handle, NodeResizer, NodeToolbar, Position, type Connection } from '@xyflow/svelte';
	import { onMount } from 'svelte';
	import { edges } from '..';
	import { get } from 'svelte/store';
	import { NodeType, type Input, type Output } from '@/types';
	import { registeredNodes, type CustomNodeName } from '@/nodes';
	import {
		RefreshCw,
		Circle,
		LoaderCircle,
		Loader,
		TriangleAlert,
		Check,
		AlignCenter
	} from 'lucide-svelte';

	const HANDLE_WIDTH = 12;
	const ROW_HEIGHT = 30;
	const ROW_GAP = 10;
	const BORDER_WIDTH = 2;
	const HEADER_HEIGHT = 20;

	export let id: string | undefined = undefined; // Node ID
	export let type: string = '';
	export let selected: boolean = false;

	$: registered = registeredNodes[type as CustomNodeName];
	$: label = registered?.name || type;
	$: nodeType = registeredNodes[type]?.nodeType ?? NodeType.DEFAULT;
	$: colors = getNodeColors(nodeType);

	let status: NodeStatus = 'idle';

	let errors: string[] = [];
	export let inputs: Input[] = [];
	export let outputs: Output[] = [];

	const onExecuteCallbacks: OnExecuteCallbacks = {
		setStatus: (newStatus: NodeStatusWithoutError) => {
			errors = [];
			status = newStatus;
		},
		setErrors: (newErrors: string[]) => {
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

	$: rows = Math.max(inputs.length, outputs.length);

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
					<div class="relative group">
						<TriangleAlert class="w-6 h-6 text-red-500" />
						<div
							class="absolute hidden group-hover:block z-10 bg-white border border-gray-300 shadow-lg rounded-md p-2 text-xs max-w-xs w-max top-full left-1/2 -translate-x-1/2 mt-1"
						>
							<ul class="list-disc list-inside">
								{#each errors as error}
									<li>{error}</li>
								{/each}
							</ul>
						</div>
					</div>
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
			'w-full rounded-sm text-center text-sm font-semibold leading-none text-white flex items-center justify-center flex-shrink-0'
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
				class="flex justify-between text-sm font-semibold leading-none gap-4 max-w-full overflow-hidden flex-shrink-0"
			>
				<div class={cn('flex flex-col w-1/2')} style="gap: {ROW_GAP}px">
					{#each inputs as input, index}
						{@const connected = inputConnections.filter(
							(edge) => edge.targetHandle === `${input.type}-${index}-i`
						)}
						<Handle
							type="target"
							position={Position.Left}
							class={cn(connected.length && '!bg-green-500', !connected.length && '!bg-gray-500 ')}
							style="left:1px; top: {top(
								index
							)}px; height: {ROW_HEIGHT}px; width: {HANDLE_WIDTH}px; border-radius: {HANDLE_WIDTH /
								2}px;"
							id="{input.type}-{index}-i"
							{isValidConnection}
							{onconnect}
						/>
						<div
							class="text-ellipsis truncate overflow-hidden w-full pl-2 -mt-[1px]"
							style="height: {ROW_HEIGHT}px; line-height: {ROW_HEIGHT}px;"
						>
							{input.label ?? input.type}
						</div>
					{/each}
				</div>
				<div class={cn('flex flex-col text-end w-1/2')} style="gap: {ROW_GAP}px">
					{#each outputs as output, index}
						{@const connected = outputConnections.filter(
							(edge) => edge.sourceHandle === `${output.type}-${index}-o`
						)}
						<Handle
							type="source"
							position={Position.Right}
							class={cn(connected.length && '!bg-green-500', !connected.length && '!bg-gray-500 ')}
							style="right:1px; top: {top(
								index
							)}px; height: {ROW_HEIGHT}px; width: {HANDLE_WIDTH}px; border-radius: {HANDLE_WIDTH /
								2}px;"
							{isValidConnection}
							{onconnect}
							id="{output.type}-{index}-o"
						/>
						<div
							class="text-ellipsis truncate pr-2 overflow-hidden w-full -mt-[1px]"
							style="height: {ROW_HEIGHT}px; line-height: {ROW_HEIGHT}px;"
						>
							{output.label ?? output.type}
						</div>
					{/each}
				</div>
			</div>
		</div>
		{#if hasContent}
			<div class="flex flex-col overflow-auto p-2">
				<slot />
			</div>
		{/if}
	</div>
</div>
