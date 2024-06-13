<script lang="ts">
	import { customNodes } from '$lib';
	import { isValidConnection } from '$lib/utils';
	import { Background, BackgroundVariant, Handle, NodeResizer, Position } from '@xyflow/svelte';
	import { onMount } from 'svelte';

	const ROW_HEIGHT = 20;

	export let id: string; // Node ID
	export let type: string;
	export let selected: boolean;

	export let inputs: {
		type: NodeValueType;
		label?: string;
	}[] = [
		{ label: 'text input lol', type: 'string' },
		{ type: 'string' },
		{ type: 'string' },
		{ type: 'string' }
	];

	export let outputs: {
		type: NodeValueType;
		label?: string;
	}[] = [{ type: 'string' }, { type: 'string' }];

	onMount(() => {
		customNodes[type] = {
			inputs,
			outputs
		};
	});

	$: rows = Math.max(inputs.length, outputs.length);
</script>

<div
	class="px-1 pb-2 shadow-md rounded-md bg-white border-2 border-stone-400 h-full"
	style="min-width: 200px"
>
	<NodeResizer minWidth={200} minHeight={ROW_HEIGHT * (rows + 1)} isVisible={selected} />

	<div class="flex justify-between text-xs uppercase gap-4 pt-[7px] max-w-full overflow-hidden">
		<div class="flex flex-col w-1/2">
			{#each inputs as input, index}
				<Handle
					type="target"
					position={Position.Left}
					style="left:1px; top: {ROW_HEIGHT *
						(index + 1)}px; height: 14px; width: 8px; border-radius: 3px;"
					id="{input.type}-{index}-i"
					{isValidConnection}
				/>
				<div
					class="text-ellipsis truncate overflow-hidden w-full"
					style="height: {ROW_HEIGHT}px; line-height: {ROW_HEIGHT}px;"
				>
					{input.label ?? input.type}
				</div>
			{/each}
		</div>
		<div class="flex flex-col text-end w-1/2">
			{#each outputs as output, index}
				<Handle
					type="source"
					position={Position.Right}
					style="right: 1px; top: {ROW_HEIGHT *
						(index + 1)}px; height: 14px; width: 8px; border-radius: 3px;"
					{isValidConnection}
					id="{output.type}-{index}-o"
				/>
				<div
					class="text-ellipsis truncate overflow-hidden w-full"
					style="height: {ROW_HEIGHT}px; line-height: {ROW_HEIGHT}px;"
				>
					{output.label ?? output.type}
				</div>
			{/each}
		</div>
	</div>

	<!-- <div
		class="grid grid-cols-2 pt-[8px]"
		style="min-width: 100px; min-height: {ROW_HEIGHT * rows}px;"
	>
		<div class="h-[10px]" style="line-height: {ROW_HEIGHT}px">1</div>
		<div class="h-[10px]" style="line-height: {ROW_HEIGHT}px">1</div>
		<div class="h-[10px]" style="line-height: {ROW_HEIGHT}px">1</div>
		<div class="h-[10px]" style="line-height: {ROW_HEIGHT}px">1</div>
	</div> -->
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
