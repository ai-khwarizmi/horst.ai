<script lang="ts">
	import CustomNode from '../../CustomNode.svelte';
	import { NodeIOHandler } from '$lib/utils';
	import Button from '@/components/ui/button/button.svelte';
	import { Clipboard, Copy } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	export let id: string;

	let lastDrawData: string | null = null;
	let data: string | null = null;

	const io = new NodeIOHandler({
		nodeId: id,
		inputs: [{ id: 'html', type: 'text' }],
		outputs: []
	});

	function cleanHtmlString(input: string): string {
		// check if ``` code tag, otherwise just return
		let codeTagStart = input.indexOf('```');
		if (codeTagStart === -1) {
			return input;
		}
		const codeTagEnd = input.indexOf('```', codeTagStart + 3);
		if (codeTagEnd === -1) {
			return input;
		}
		if (input.indexOf('```html') === codeTagStart) {
			codeTagStart += 5;
		}
		return input.slice(codeTagStart + 3, codeTagEnd);
	}

	function onExecute() {
		const input = io.getInputData('html') ?? null;
		if (input !== lastDrawData) {
			lastDrawData = input;
			data = cleanHtmlString(input);
		}
	}
</script>

<CustomNode {io} {onExecute} {...$$props}>
	<iframe
		srcdoc={data}
		sandbox="allow-scripts"
		title="html"
		style="width: 100%; height: 100%; border: none;"
	></iframe>
</CustomNode>
