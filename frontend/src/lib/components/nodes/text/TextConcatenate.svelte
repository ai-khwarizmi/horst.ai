<script lang="ts">
	import CustomNode from '../../CustomNode.svelte';
	import { NodeIOHandler } from '$lib/utils';

	export let id: string;

	const io = new NodeIOHandler({
		nodeId: id,
		inputs: [
			{ id: 'text', type: 'text' },
			{ id: 'text2', type: 'text' }
		],
		outputs: [{ id: 'text', type: 'text' }]
	});

	let currentOutput: string | null = null;

	function onExecute() {
		const input = io.getInputData('text') as string;
		const input2 = io.getInputData('text2') as string;
		if (!input || !input2) {
			if (currentOutput !== null) {
				io.setOutputData('text', null);
			}
			return;
		} else {
			const output = input + input2;
			if (output !== currentOutput) {
				io.setOutputData('text', output);
				currentOutput = output;
			}
		}
	}
</script>

<CustomNode {io} {onExecute} {...$$props}></CustomNode>
