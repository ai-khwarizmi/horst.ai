<script lang="ts">
	import CustomNode from '@/components/CustomNode.svelte';
	import { NodeIOHandler } from '@/utils';

	export let id: string;

	const onExecute = () => {
		const input = io.getInputData('data');
		if (!input) {
			return;
		}
		data = btoa(input);
		io.setOutputData('encoded', data);
	};

	const io = new NodeIOHandler({
		nodeId: id,
		inputs: [{ id: 'data', type: 'text' }],
		outputs: [{ id: 'encoded', type: 'text', label: 'Base64' }],
		onExecute: onExecute
	});

	let data: string | null = null;
</script>

<CustomNode {io} {onExecute} {...$$props}>
	<textarea class="w-full h-full outline-none border-none bg-transparent resize-none" readonly>
		{data}
	</textarea>
</CustomNode>
