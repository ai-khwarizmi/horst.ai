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
		outputs: [{ id: 'contains', type: 'boolean' }]
	});

	let currentOutput: boolean | null = null;

	function onExecute() {
		const input = io.getInputData('text') as string;
		const input2 = io.getInputData('text2') as string;
		if (!input || !input2) {
			if (currentOutput !== null) {
				io.setOutputData('contains', null);
			}
			return;
		} else {
			const output = input.includes(input2);
			if (output !== currentOutput) {
				io.setOutputData('contains', output);
				currentOutput = output;
			}
		}
	}
</script>

<CustomNode {io} {onExecute} {...$$props}></CustomNode>
