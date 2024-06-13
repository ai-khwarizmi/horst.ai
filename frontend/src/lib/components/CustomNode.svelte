<script lang="ts">
	import { customNodes } from '$lib';
	import { isValidConnection } from '$lib/utils';
	import { Handle, Position } from '@xyflow/svelte';
	import { onMount } from 'svelte';

	const ROW_HEIGHT = 15;

	export let id: string; // Node ID
	export let type: string;

	export let inputs: {
		type: NodeValueType;
		label?: string;
	}[] = [{ type: 'string' }, { type: 'string' }];

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

<div class="w-40 bg-red-500 min-h-1" style="padding-top: {ROW_HEIGHT * (rows + 1)}px">
	{#each inputs as input, index}
		<Handle
			type="target"
			position={Position.Left}
			style="top: {ROW_HEIGHT * (index + 1)}px"
			id="{input.type}-{index}-i"
			{isValidConnection}
		/>
	{/each}

	{#each outputs as output, index}
		<Handle
			type="source"
			position={Position.Right}
			style="right: 0; top: {ROW_HEIGHT * (index + 1)}px"
			{isValidConnection}
			id="{output.type}-{index}-o"
		/>
	{/each}
</div>
