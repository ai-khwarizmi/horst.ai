<script lang="ts">
	import CustomNode from './CustomNode.svelte';
	import { setOutputData } from '$lib/utils';

	let currentTime = new Date();

	const outputs: Output[] = [
		{ type: 'string', label: 'Current Date' },
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
