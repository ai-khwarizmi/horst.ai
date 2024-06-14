<script lang="ts">
	import { cn, isValidConnection, removeEdgeByIds } from '$lib/utils';
	import { Handle, NodeResizer, Position, type Connection } from '@xyflow/svelte';
	import { onMount } from 'svelte';
	import { edges } from '..';
	import { get } from 'svelte/store';

	const ROW_HEIGHT = 20;

	export let id: string | undefined = undefined; // Node ID
	export let selected: boolean = false;

	export let label = 'Custom Node';
	export let errors: string[] = [];

	export let inputs: Input[] = [];

	export let outputs: Output[] = [];

	export let onExecute: () => void;

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
			const e = get(edges);
			if (!e) return;
			const edge = e.filter(
				(edge) =>
					edge.target === connection.target &&
					edge.targetHandle === connection.targetHandle &&
					edge.id !== connection.edgeId
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
		'p-[4px] pb-2 shadow-md rounded-md bg-white border-2 border-stone-400 h-full overflow-auto'
	)}
	style="min-width: 200px"
>
	<div
		class="text-xs w-full bg-black text-white rounded-md text-center p-0.5"
		bind:clientHeight={HEADER_HEIGHT}
	>
		{label}
	</div>
	<NodeResizer minWidth={200} minHeight={ROW_HEIGHT * (rows + 1)} isVisible={selected} />
	<div class="flex justify-between text-xs uppercase gap-4 pt-[7px] max-w-full overflow-hidden">
		<div class="flex flex-col w-1/2">
			{#each inputs as input, index}
				{@const connected = inputConnections.filter(
					(edge) => edge.targetHandle === `${input.type}-${index}-i`
				)}
				<Handle
					type="target"
					position={Position.Left}
					style="left:1px; top: {ROW_HEIGHT * (index + 1) +
						HEADER_HEIGHT +
						4}px; height: 14px; width: 8px; border-radius: 3px; background: {connected.length
						? 'green'
						: 'red'};"
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
					style="right: 1px; top: {ROW_HEIGHT * (index + 1) +
						HEADER_HEIGHT +
						4}px; height: 14px; width: 8px; border-radius: 3px; background: {connected.length
						? 'green'
						: 'red'};"
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

	<!-- <slot /> -->
</div>

<!-- 
<style>
	:global(.svelte-flow__node-custom) {
		font-size: 10px;
		width: 180px;
		background: #f5f5f6;
		color: #222;
		box-shadow:
			0 4px 6px -1px rgb(0 0 0 / 15%),
			0 2px 4px -1px rgb(0 0 0 / 8%);
		border-radius: 2px;
	}

	:global(.svelte-flow__node-custom .svelte-flow__handle) {
		top: 24px;
		right: -15px;
		width: 6px;
		height: 10px;
		border-radius: 2px;
		background-color: #778899;
	}

	:global(.custom-node__header) {
		padding: 8px 10px;
		border-bottom: 1px solid #e2e8f0;
	}

	:global(.custom-node__body) {
		padding: 10px;
	}

	:global(.custom-node__select) {
		position: relative;
		margin-bottom: 10px;
	}

	:global(.custom-node__select select) {
		width: 100%;
		margin-top: 5px;
		font-size: 10px;
	}
</style> -->
