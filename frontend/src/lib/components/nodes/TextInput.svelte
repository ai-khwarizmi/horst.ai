<script lang="ts">
	import CustomNode from '../CustomNode.svelte';
	import { setOutputData } from '$lib/utils';
	import type { Output } from '@/types';
	import { Input } from '$lib/components/ui/input';

	let value = '';

	const outputs: Output[] = [{ type: 'string', label: 'Text' }];

	export let id: string;
</script>

<CustomNode label="Text Input" {outputs} {...$$props}>
	<Input
		type="text"
		bind:value
		on:change={() => {
			setOutputData(id, 0, value);
		}}
	/>
</CustomNode>
