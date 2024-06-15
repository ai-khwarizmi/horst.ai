<script lang="ts">
	import { NodeIOHandler } from '@/utils';
	import CustomNode from '../../CustomNode.svelte';

	export let id: string;

	const io = new NodeIOHandler(
		id,
		[{ id: 'num', type: 'number' }],
		[{ id: 'date', type: 'text', label: 'Date' }]
	);

	const onExecute = () => {
		const input = io.getInputData('num');
		io.setOutputData('date', new Date(input as number).toLocaleString());
	};
</script>

<CustomNode {io} {onExecute} {...$$props} />
