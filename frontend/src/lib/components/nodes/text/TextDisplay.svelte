<script lang="ts">
	import CustomNode from '../../CustomNode.svelte';
	import { NodeIOHandler } from '$lib/utils';

	export let id: string;
	let data: string | null = null;

	const io = new NodeIOHandler({
		nodeId: id,
		inputs: [{ id: 'text', type: 'any' }],
		outputs: []
	});

	function onExecute() {
		const input = io.getInputData('text') ?? null;
		if (input === null) {
			data = null;
			return;
		}
		if (typeof input === 'string') {
			data = input;
		} else if (typeof input === 'object' || Array.isArray(input)) {
			data = JSON.stringify(input, null, 2);
		}
		data = input.toString();
	}
</script>

<CustomNode {io} {onExecute} {...$$props}>
	<textarea class="w-full h-full outline-none border-none bg-transparent resize-none" readonly
		>{data}</textarea
	>
</CustomNode>
