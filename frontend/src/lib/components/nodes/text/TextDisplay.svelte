<script lang="ts">
	import CustomNode from '../../CustomNode.svelte';
	import { NodeIOHandler } from '$lib/utils';
	import Button from '@/components/ui/button/button.svelte';
	import { Copy } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	export let id: string;
	let data: string | null = null;

	const io = new NodeIOHandler({
		nodeId: id,
		inputs: [{ id: 'data', type: 'any', label: 'Data' }],
		outputs: []
	});

	function onExecute() {
		const input = io.getInputData('data') ?? null;
		if (input === null) {
			data = null;
			return;
		}
		if (typeof input === 'string') {
			data = input;
		} else if (typeof input === 'object' || Array.isArray(input)) {
			data = JSON.stringify(input, null, 2);
		}
		data = input.toString();
	}

	function copyToClipboard() {
		if (data) {
			navigator.clipboard.writeText(data);
			toast.success('Copied to clipboard');
		} else {
			toast.error('Nothing to copy');
		}
	}
</script>

<CustomNode {io} {onExecute} {...$$props}>
	<Button size="sm" variant="outline" on:click={copyToClipboard}>
		<Copy class="mr-2" />
		Copy to clipboard
	</Button>
	<textarea class="w-full h-full outline-none border-none bg-transparent resize-none" readonly
		>{data ?? ''}</textarea
	>
</CustomNode>
