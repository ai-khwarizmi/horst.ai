<script lang="ts">
	import CustomNode from '../../CustomNode.svelte';
	import { NodeIOHandler } from '$lib/utils';

	export let id: string;
	let data: any;

	const io = new NodeIOHandler(id, [{ id: 'text', type: 'text' }]);

	function onExecute() {
		data = io.getInputData('text');
	}
</script>

<CustomNode {io} {onExecute} {...$$props}>
	{data}
</CustomNode>
