<script lang="ts">
	import CustomNode from '../CustomNode.svelte';
	import { getInputData, getOutputData, setOutputData } from '$lib/utils';
	import type { Output } from '@/types';
	import Textarea from '../ui/textarea/textarea.svelte';
	import { onMount } from 'svelte';

	let value = '';

	onMount(() => {
		const data = getOutputData(id, 0);
		if (data) {
			value = String(data);
		}
	});

	const outputs: Output[] = [{ type: 'text' }];

	export let id: string;
</script>

<CustomNode label="Text Input" {outputs} {...$$props} headerType="input">
	<Textarea
		bind:value
		class="w-full h-full min-h-0 min-w-0"
		style="resize: none;"
		on:change={() => {
			setOutputData(id, 0, value);
		}}
	/>
</CustomNode>
