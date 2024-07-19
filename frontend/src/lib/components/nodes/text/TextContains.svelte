<script lang="ts">
	import CustomNode from '../../CustomNode.svelte';
	import { NodeIOHandler } from '$lib/utils';

	export let id: string;

	const onExecute = async () => {
		const input = io.getInputData('text') as string;
		const input2 = io.getInputData('text2') as string;
		if (!input || !input2) {
			if (currentOutput !== null) {
				io.setOutputDataDynamic('contains', null);
			}
			return;
		} else {
			const output = input.includes(input2);
			if (output !== currentOutput) {
				io.setOutputDataDynamic('contains', output);
				currentOutput = output;
			}
		}
	};

	const io = new NodeIOHandler({
		nodeId: id,
		inputs: [
			{ id: 'text', type: 'text' },
			{ id: 'text2', type: 'text' }
		],
		outputs: [{ id: 'contains', type: 'boolean' }],
		onExecute: onExecute,
		isInputUnsupported: () => Promise.resolve({ unsupported: false }),
		resetDynamicState: () => {}
	});

	let currentOutput: boolean | null = null;
</script>

<CustomNode {io} {...$$props}></CustomNode>
