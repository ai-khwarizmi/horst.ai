<script lang="ts">
	import { useInternalNode } from '@xyflow/svelte';
	import CustomNode from './CustomNode.svelte';
	import { edges } from '$lib';
	import { getInputData } from '$lib/utils';

	export let id: string;
	let data: any;

	function onExecute() {
		data = getInputData(id, 0);
	}
</script>

<CustomNode inputs={[{ type: 'string', label: 'Text' }]} {onExecute} {...$$props}>
	{data ?? ''}
</CustomNode>
