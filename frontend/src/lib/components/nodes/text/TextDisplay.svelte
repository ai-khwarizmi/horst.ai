<script lang="ts">
	import CustomNode from '../../CustomNode.svelte';
	import { NodeIOHandler } from '$lib/utils';

	export let id: string;
	let data: string | null = null;

	const io = new NodeIOHandler(id, [{ id: 'text', type: 'text' }]);

	function onExecute() {
		const input = io.getInputData('text') ?? null;
		data = typeof input === 'string' ? input : String(input);
	}
</script>

<CustomNode {io} {onExecute} {...$$props}>
	{data}
</CustomNode>
