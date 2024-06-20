<script lang="ts">
	import CustomNode from '@/components/CustomNode.svelte';
	import Input from '@/components/ui/input/input.svelte';
	import { NodeIOHandler } from '@/utils';

	export let id: string;
	const io = new NodeIOHandler({
		nodeId: id,
		inputs: [],
		outputs: [
			{
				id: 'file',
				type: 'file'
			}
		]
	});

	let file: File | null = null;

	let lastFileId: string | null = null;

	function onExecute() {
		if (!file) {
			if (lastFileId) {
				io.setOutputData('file', null);
				lastFileId = null;
			}
			return;
		}
		const fileId = `${file.name}_${file.size}_${file.lastModified}`;
		if (lastFileId === fileId) return;
		io.setOutputData('file', file);
	}
</script>

<CustomNode {io} {onExecute} {...$$props}>
	<Input type="file" on:change={(e) => (file = e.currentTarget.files?.[0] ?? null)} />
	{file?.name ?? 'no file'} ({file?.size ?? 0} bytes)
</CustomNode>
