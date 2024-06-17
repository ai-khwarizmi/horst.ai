<script lang="ts">
	import { NodeIOHandler } from '@/utils';
	import CustomNode from '../../CustomNode.svelte';

	export let id: string;

	const io = new NodeIOHandler({
		nodeId: id,
		inputs: [{ id: 'num', type: 'number' }],
		outputs: [{ id: 'str', type: 'text' }]
	});

	const onExecute = () => {
		const input = io.getInputData('num');
		io.setOutputData('str', String(input));
	};
</script>

<CustomNode {io} {onExecute} {...$$props} />
