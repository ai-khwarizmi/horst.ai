<script lang="ts">
	import CustomNode from '../CustomNode.svelte';
	import { setOutputData } from '$lib/utils';
	import { NodeType, type Output } from '@/types';
	import { onMount } from 'svelte';

	let currentTime = new Date();

	export let type: string;

	const outputs: Output[] = [
		{ type: 'text', label: 'Current Date' },
		{ type: 'number', label: 'current ms' }
	];

	export let id: string;

	const onExecute = () => {
		currentTime = new Date();
		setOutputData(id, 0, currentTime.toLocaleString());
		setOutputData(id, 1, currentTime.getTime());
	};
</script>

<CustomNode {outputs} {onExecute} {...$$props}>
	{currentTime.toLocaleString()}
</CustomNode>
