<script lang="ts">
	import CustomNode from '../CustomNode.svelte';
	import { setOutputData } from '$lib/utils';
	import { type Output } from '@/types';

	let currentTime = new Date();

	export let type: string;

	const outputs: Output[] = [
		{ type: 'text', label: 'Current Date' },
		{ type: 'number', label: 'current ms' }
	];

	export let id: string;

	const onExecute = () => {
		const date = new Date();
		date.setMilliseconds(0);
		date.setSeconds(0);
		currentTime = date;
		setOutputData(id, 0, currentTime.toLocaleString());
		setOutputData(id, 1, currentTime.getTime());
	};
</script>

<CustomNode {outputs} {onExecute} {...$$props}>
	{currentTime.toLocaleString()}
</CustomNode>
