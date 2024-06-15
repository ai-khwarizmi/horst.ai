<script lang="ts">
	import { cn, getNodeBackgroundColor, isValidConnection, removeEdgeByIds } from '$lib/utils';
	import { Handle, NodeResizer, Position, type Connection } from '@xyflow/svelte';
	import { onMount } from 'svelte';
	import { edges } from '..';
	import { get } from 'svelte/store';
	import { NodeType, type Input, type Output } from '@/types';
	import { registeredNodes, type CustomNodeName } from '@/nodes';

	const ROW_HEIGHT = 20;

	export let id: string | undefined = undefined; // Node ID
	export let type: string = '';
	export let selected: boolean = false;

	$: registered = registeredNodes[type as CustomNodeName];
	$: label = registered?.name || type;
	$: nodeType = registeredNodes[type]?.nodeType ?? NodeType.DEFAULT;
	$: headerColor = getNodeBackgroundColor(nodeType);

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
</script>

<div
	class={cn(
		'p-[4px] pb-2 shadow-md rounded-md bg-white border-2 border-stone-400 h-full flex flex-col',
		errors.length && 'border-red-500'
	)}
	style="min-width: 200px;"
>
	<div
		class={cn('text-xs w-full bg-black text-white rounded-md text-center p-0.5', headerColor)}
		bind:clientHeight={HEADER_HEIGHT}
	>
		{label}
	</div>
	<NodeResizer
		minWidth={200}
		minHeight={ROW_HEIGHT * (rows + 2) + HEADER_HEIGHT + 4}
		isVisible={selected}
	/>
	<div
		class="flex justify-between text-xs uppercase gap-4 pt-[7px] max-w-full overflow-hidden flex-shrink-0"
	>
		<div class="flex flex-col w-1/2">
			{#each inputs as input, index}
				{@const connected = inputConnections.filter(
					(edge) => edge.targetHandle === `${input.type}-${index}-i`
				)}
				<Handle
					type="target"
					position={Position.Left}
					class={cn(connected.length && '!bg-green-500', !connected.length && '!bg-gray-500 ')}
					style="left:1px; top: {ROW_HEIGHT * (index + 1) +
						HEADER_HEIGHT +
						4}px; height: 14px; width: 8px; border-radius: 3px;"
					id="{input.type}-{index}-i"
					{isValidConnection}
					{onconnect}
				/>
				<div
					class="text-ellipsis truncate overflow-hidden w-full font-bold"
					style="height: {ROW_HEIGHT}px; line-height: {ROW_HEIGHT}px;"
				>
					{input.label ?? input.type}
				</div>
			{/each}
		</div>
		<div class="flex flex-col text-end w-1/2">
			{#each outputs as output, index}
				{@const connected = outputConnections.filter(
					(edge) => edge.sourceHandle === `${output.type}-${index}-o`
				)}
				<Handle
					type="source"
					position={Position.Right}
					class={cn(connected.length && '!bg-green-500', !connected.length && '!bg-gray-500 ')}
					style="right: 1px; top: {ROW_HEIGHT * (index + 1) +
						HEADER_HEIGHT +
						4}px; height: 14px; width: 8px; border-radius: 3px;"
					{isValidConnection}
					{onconnect}
					id="{output.type}-{index}-o"
				/>
				<div
					class="text-ellipsis truncate overflow-hidden w-full font-bold"
					style="height: {ROW_HEIGHT}px; line-height: {ROW_HEIGHT}px;"
				>
					{output.label ?? output.type}
				</div>
			{/each}
		</div>
	</div>
	<div class="flex flex-col h-full overflow-auto">
		<slot />
	</div>
</div>
