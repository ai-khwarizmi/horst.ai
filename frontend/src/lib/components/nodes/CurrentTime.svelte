<script lang="ts">
	import CustomNode from '../CustomNode.svelte';
	import { NodeIOHandler } from '$lib/utils';
	import { type Output } from '@/types';

	export let id: string;

	let currentTime = new Date();

	const io = new NodeIOHandler(id, undefined, [
		{ id: 'text', type: 'text', label: 'Date' },
		{ id: 'num', type: 'number', label: 'Milliseconds' }
	]);

	const onExecute = () => {
		const date = new Date();
		date.setMilliseconds(0);
		date.setSeconds(0);
		currentTime = date;
		io.setOutputData('text', currentTime.toLocaleString());
		io.setOutputData('num', currentTime.getTime());
	};
</script>

<CustomNode {io} {onExecute} {...$$props}>
	{currentTime.toLocaleString()}
</CustomNode>
