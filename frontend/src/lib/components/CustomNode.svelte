<script lang="ts">
	import { cn, getNodeColors, isValidConnection, removeEdgeByIds } from '$lib/utils';
	import { Handle, NodeResizer, NodeToolbar, Position, type Connection } from '@xyflow/svelte';
	import { onMount } from 'svelte';
	import { edges } from '..';
	import { get } from 'svelte/store';
	import { NodeType, type Input, type Output } from '@/types';
	import { registeredNodes, type CustomNodeName } from '@/nodes';

	const HANDLE_WIDTH = 8;
	const ROW_HEIGHT = 20;
	const ROW_GAP = 10;
	const BORDER_WIDTH = 2;

	export let id: string | undefined = undefined; // Node ID
	export let type: string = '';
	export let selected: boolean = false;

	$: registered = registeredNodes[type as CustomNodeName];
	$: label = registered?.name || type;
	$: nodeType = registeredNodes[type]?.nodeType ?? NodeType.DEFAULT;
	$: colors = getNodeColors(nodeType);

	export let errors: string[] = [];
	export let inputs: Input[] = [];

	export let outputs: Output[] = [];

	export let onExecute: () => void = () => {};

	onMount(() => {
		if (!id) {
			throw new Error('Node ID is required');
		}
		setInterval(() => {
			onExecute();
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

	let HEADER_HEIGHT = 0;
	// idk what 0.65 is for but it works
	$: top = (index: number) =>
		ROW_HEIGHT * index + ROW_GAP * index + HEADER_HEIGHT + ROW_HEIGHT * 0.5 + BORDER_WIDTH;
</script>

<div
	class={cn(
		'pb-2 shadow-md rounded-md bg-white border-stone-400 h-full flex flex-col',
		errors.length && 'border-red-500',
		colors.border
	)}
	style="min-width: 200px; border-width: {BORDER_WIDTH}px"
>
	<NodeResizer
		minWidth={200}
		minHeight={ROW_HEIGHT * rows + HEADER_HEIGHT + ROW_HEIGHT * 0.5 + 2 * BORDER_WIDTH}
		isVisible={selected}
		lineClass="!border-[1.5px]"
		handleClass="!size-2"
	/>
	<div class={cn('rounded-t-sm pb-2', colors.background, colors.text)}>
		<div bind:clientHeight={HEADER_HEIGHT} class={cn('pb-1')}>
			<div
				class={cn(
					colors.fullbackground,
					'py-1 w-full rounded-t-sm text-center p-0.5 text- font-semibold leading-none text-white'
				)}
			>
				{label}
			</div>
		</div>
		<div class="flex justify-between text-xs gap-4 max-w-full overflow-hidden flex-shrink-0">
			<div class={cn('flex flex-col w-1/2', colors.text)} style="gap: {ROW_GAP}px">
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
						class="text-ellipsis truncate overflow-hidden w-full font-semibold pl-2 leading-none -mt-[1px]"
						style="height: {ROW_HEIGHT}px; line-height: {ROW_HEIGHT}px;"
					>
						{input.label ?? input.type}
					</div>
				{/each}
			</div>
			<div class={cn('flex flex-col text-end w-1/2', colors.text)}>
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
						)}px; height: {ROW_HEIGHT}px; border-radius: {HANDLE_WIDTH / 2}px;"
						{isValidConnection}
						{onconnect}
						id="{output.type}-{index}-o"
					/>
					<div
						class="text-ellipsis truncate pr-2 overflow-hidden w-full font-semibold leading-none -mt-[1px]"
						style="height: {ROW_HEIGHT}px; line-height: {ROW_HEIGHT}px;"
					>
						{output.label ?? output.type}
					</div>
				{/each}
			</div>
		</div>
	</div>
	<div class="flex flex-col h-full overflow-auto">
		<slot />
	</div>
</div>
