<script lang="ts">
	import CustomNode from '@/components/CustomNode.svelte';
	import { NodeIOHandler } from '@/utils';

	export let id: string;
	const io = new NodeIOHandler({
		nodeId: id,
		inputs: [{ id: 'encoded', type: 'text', label: 'Base64' }],
		outputs: [{ id: 'data', type: 'text' }]
	});

	const onExecute = () => {
		const input = io.getInputData('encoded');
		if (!input) {
			return;
		}
		io.setOutputData('data', atob(input));
	};
</script>

<CustomNode {io} {onExecute} {...$$props} />
