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

	let focus = false;

	const onExecute = () => {
		if (focus) return;
		// allow for clearing the value or programmatically setting it
		if (value != getOutputData(id, 0)) {
			value = getOutputData(id, 0) as string;
		}
	};

	const outputs: Output[] = [{ type: 'text' }];

	export let id: string;
</script>

<CustomNode label="Text Input" {outputs} {...$$props} {onExecute} headerType="input">
	<Textarea
		bind:value
		class="w-full h-full min-h-0 min-w-0"
		style="resize: none;"
		on:focus={() => {
			focus = true;
		}}
		on:blur={(e) => {
			setOutputData(id, 0, e.currentTarget.value);
			focus = false;
		}}
	/>
</CustomNode>
