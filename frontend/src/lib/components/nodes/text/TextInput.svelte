<script lang="ts">
	import CustomNode from '../../CustomNode.svelte';
	import { NodeIOHandler } from '$lib/utils';
	import Textarea from '../../ui/textarea/textarea.svelte';
	import { onMount } from 'svelte';

	export let id: string;
	let value = '';

	let focus = false;

	const onExecute = async () => {
		if (focus) return;
		// allow for clearing the value or programmatically setting it
		if (value != io.getOutputData('text')) {
			value = io.getOutputData('text') as string;
		}
	};

	const io = new NodeIOHandler({
		nodeId: id,
		inputs: [],
		outputs: [{ id: 'text', type: 'text' }],
		onExecute,
		isInputUnsupported: () => Promise.resolve({ unsupported: false })
	});

	onMount(() => {
		const data = io.getOutputData('text');
		if (data) {
			value = String(data);
		}
	});
</script>

<CustomNode {io} {...$$props}>
	<Textarea
		bind:value
		class="w-full h-full min-h-0 min-w-0 nodrag"
		style="resize: none;"
		on:focus={() => {
			focus = true;
		}}
		on:blur={(e) => {
			io.setOutputDataPlaceholder('text', e.currentTarget.value);
			focus = false;
		}}
	/>
</CustomNode>
