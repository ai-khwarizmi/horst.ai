<script lang="ts">
	import CustomNode from '../../CustomNode.svelte';
	import { NodeIOHandler } from '$lib/utils';
	import Textarea from '../../ui/textarea/textarea.svelte';
	import { onMount } from 'svelte';

	export let id: string;
	let value = '';

	const io = new NodeIOHandler(id, undefined, [{ id: 'text', type: 'text' }]);

	onMount(() => {
		const data = io.getOutputData('text');
		if (data) {
			value = String(data);
		}
	});

	let focus = false;

	const onExecute = () => {
		if (focus) return;
		// allow for clearing the value or programmatically setting it
		if (value != io.getOutputData('text')) {
			value = io.getOutputData('text') as string;
		}
	};
</script>

<CustomNode {io} {onExecute} {...$$props}>
	<Textarea
		bind:value
		class="w-full h-full min-h-0 min-w-0"
		style="resize: none;"
		on:focus={() => {
			focus = true;
		}}
		on:blur={(e) => {
			io.setOutputData('text', e.currentTarget.value);
			focus = false;
		}}
	/>
</CustomNode>
