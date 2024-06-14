<script lang="ts">
	import { onMount } from 'svelte';
	import CustomNode from './CustomNode.svelte';
	import { useInternalNode } from '@xyflow/svelte';
	import { setOutputData } from '$lib/utils';

	let currentTime = new Date();

	export let id: string;

	$: node = useInternalNode(id);

	const onExecute = () => {
		currentTime = new Date();
		setOutputData(id, 0, currentTime.toLocaleString());
		setOutputData(id, 1, currentTime.getTime());
	};
</script>

<CustomNode
	outputs={[
		{ type: 'string', label: 'Current Date' },
		{ type: 'number', label: 'current ms' }
	]}
	{onExecute}
	{...$$props}
>
	{currentTime.toLocaleString()}
</CustomNode>
