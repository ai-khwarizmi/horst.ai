<script lang="ts">
	import { customNodes } from '$lib';
	import { cn, isValidConnection } from '$lib/utils';
	import {
		Background,
		BackgroundVariant,
		Handle,
		NodeResizer,
		Position,
		useConnection,
		useEdges,
		useHandleConnections,
		useInternalNode,
		type NodeProps
	} from '@xyflow/svelte';
	import { onMount } from 'svelte';

	const ROW_HEIGHT = 20;

	export let id: string | undefined = undefined; // Node ID
	// export let type: string;
	export let selected: boolean = false;

	export let errors: string[] = [];

	export let inputs: {
		type: NodeValueType;
		label?: string;
	}[] = [];

	export let outputs: {
		type: NodeValueType;
		label?: string;
	}[] = [];

	export let onExecute: () => void;

	onMount(() => {
		if (!id) {
			throw new Error('Node ID is required');
		}
		setInterval(() => {
			onExecute();
		}, 50);
	});

	$: rows = Math.max(inputs.length, outputs.length);
</script>

<!-- {JSON.stringify($$props)} -->

<div
	class={cn(
		'px-1 pb-2 shadow-md rounded-md bg-white border-2 border-stone-400 h-full overflow-auto'
	)}
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
					class="text-ellipsis truncate overflow-hidden w-full font-bold"
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
					class="text-ellipsis truncate overflow-hidden w-full font-bold"
					style="height: {ROW_HEIGHT}px; line-height: {ROW_HEIGHT}px;"
				>
					{output.label ?? output.type}
				</div>
			{/each}
		</div>
	</div>

	<slot />
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
