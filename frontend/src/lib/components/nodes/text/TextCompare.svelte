<script lang="ts">
	import CustomNode from '../../CustomNode.svelte';
	import { NodeIOHandler } from '$lib/utils';

	export let id: string;

	const onExecute = () => {
		const input = io.getInputData('text') as string;
		const input2 = io.getInputData('text2') as string;
		if (!input || !input2) {
			if (currentOutput !== null) {
				io.setOutputData('identical', null);
			}
			return;
		} else {
			const output = input === input2;
			if (output !== currentOutput) {
				io.setOutputData('identical', output);
				currentOutput = output;
			}
		}
	}

	const io = new NodeIOHandler({
		nodeId: id,
		inputs: [
			{ id: 'text', type: 'text' },
			{ id: 'text2', type: 'text' }
		],
		outputs: [{ id: 'identical', type: 'boolean' }],
		onExecute: onExecute
	});

	let currentOutput: boolean | null = null;

</script>

<CustomNode {io} {onExecute} {...$$props}></CustomNode>
