<script lang="ts">
	import CustomNode from '../CustomNode.svelte';
	import { getInputData, getOutputData, setOutputData } from '$lib/utils';
	import type { Output } from '@/types';
	import Textarea from '../ui/textarea/textarea.svelte';
	import { onMount } from 'svelte';

	let value = '';

	onMount(() => {
		value = String(getOutputData(id, 0));
	});

	const outputs: Output[] = [{ type: 'text' }];

	export let id: string;
</script>

<CustomNode label="Text Input" {outputs} {...$$props}>
	<Textarea
		bind:value
		class="w-full h-full"
		style="resize: none;"
		on:change={() => {
			setOutputData(id, 0, value);
		}}
	/>
</CustomNode>
