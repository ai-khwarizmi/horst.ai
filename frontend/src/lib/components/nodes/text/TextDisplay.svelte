<script lang="ts">
	import CustomNode from '../../CustomNode.svelte';
	import { NodeIOHandler } from '$lib/utils';

	export let id: string;
	let data: string | null = null;

	const io = new NodeIOHandler({
		nodeId: id,
		inputs: [{ id: 'text', type: 'text' }],
		outputs: []
	});

	function onExecute() {
		const input = io.getInputData('text') ?? null;
		data = typeof input === 'string' ? input : String(input);
	}
</script>

<CustomNode {io} {onExecute} {...$$props}>
	<textarea class="w-full h-full outline-none border-none bg-transparent resize-none" readonly
		>{data}</textarea
	>
</CustomNode>
