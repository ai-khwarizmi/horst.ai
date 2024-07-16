<script lang="ts">
	import CustomNode from '../../CustomNode.svelte';
	import { NodeIOHandler } from '$lib/utils';
	import Button from '@/components/ui/button/button.svelte';
	import { Copy } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { HorstFile } from '@/utils/horstfile';
	import type { OnExecuteCallbacks } from '@/types';

	export let id: string;
	let data: string | null = null;

	const onExecute = async (
		callbacks: OnExecuteCallbacks,
		forceExecute: boolean,
		wrap: <T>(promise: Promise<T>) => Promise<T>
	) => {
		const input = [io.getInputData('data') ?? null].flat()[0];
		if (input === null) {
			data = null;
			return;
		}

		// For now show first if its an array
		if (typeof input === 'string') {
			data = input;
		} else if (input instanceof HorstFile || HorstFile.isHorstFile(input)) {
			if (input instanceof HorstFile) {
				data = await wrap(input.getAsText());
			} else {
				const file = await wrap(HorstFile.fromJSON(input));
				data = await wrap(file.getAsText());
			}
		} else if (typeof input === 'object' || Array.isArray(input)) {
			data = JSON.stringify(input, null, 2);
		} else {
			data = String(input);
		}
	};

	const io = new NodeIOHandler({
		nodeId: id,
		inputs: [{ id: 'data', type: 'any', label: 'Data' }],
		outputs: [],
		onExecute,
		isInputUnsupported: async () => {
			return { unsupported: false };
		}
	});
	function copyToClipboard() {
		if (data) {
			navigator.clipboard.writeText(data);
			toast.success('Copied to clipboard');
		} else {
			toast.error('Nothing to copy');
		}
	}
</script>

<CustomNode {io} {...$$props}>
	<Button size="sm" variant="outline" on:click={copyToClipboard}>
		<Copy class="mr-2" />
		Copy to clipboard
	</Button>
	<textarea class="w-full h-full outline-none border-none bg-transparent resize-none" readonly
		>{data ?? ''}</textarea
	>
</CustomNode>
