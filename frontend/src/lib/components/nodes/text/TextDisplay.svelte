<script lang="ts">
	import CustomNode from '../../CustomNode.svelte';
	import { NodeIOHandler } from '$lib/utils';
	import Button from '@/components/ui/button/button.svelte';
	import { Clipboard, Copy, Download } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	export let id: string;
	let data: any = null;

	const io = new NodeIOHandler({
		nodeId: id,
		inputs: [{ id: 'data', type: 'any' }],
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
		} else if (input instanceof Blob) {
			if (data !== input) data = input;
		} else if (typeof input === 'object' || Array.isArray(input)) {
			data = JSON.stringify(input, null, 2);
		} else {
			data = String(input);
		}
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
	{#if data && data instanceof File}
		{#if data.type.startsWith('image/')}
			<img src={URL.createObjectURL(data)} alt="blob" />
		{:else}
			<Button size="sm" variant="outline" href={URL.createObjectURL(data)} download={data.name}>
				<Download class="mr-2" />
				Download
			</Button>
			<iframe src={URL.createObjectURL(data)} class="w-full h-full" title="blob" />
		{/if}
	{:else}
		<Button size="sm" variant="outline" on:click={copyToClipboard}>
			<Copy class="mr-2" />
			Copy to clipboard
		</Button>
		<textarea class="w-full h-full outline-none border-none bg-transparent resize-none" readonly
			>{data ?? ''}</textarea
		>
	{/if}
</CustomNode>
