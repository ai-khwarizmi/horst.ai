<script lang="ts">
	import { NodeIOHandler } from '@/utils';
	import CustomNode from '../../CustomNode.svelte';

	export let id: string;

	const onExecute = async () => {
		const input = io.getInputData('num');
		io.setOutputDataDynamic('str', String(input));
	};

	const io = new NodeIOHandler({
		nodeId: id,
		inputs: [{ id: 'num', type: 'number' }],
		outputs: [{ id: 'str', type: 'text' }],
		onExecute: onExecute,
		isInputUnsupported: () => Promise.resolve({ unsupported: false })
	});
</script>

<CustomNode {io} {...$$props} />
