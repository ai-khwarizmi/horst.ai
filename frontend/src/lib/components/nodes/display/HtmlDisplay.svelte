<script lang="ts">
	import CustomNode from '../../CustomNode.svelte';
	import { NodeIOHandler } from '$lib/utils';

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
			if (input) {
				data = cleanHtmlString(input);
			} else {
				data = null;
			}
		}
	}

	function openInCodePen() {
		const htmlCode = data ?? '';
		const cssCode = ''; // Add any CSS code if needed
		const jsCode = ''; // Add any JS code if needed

		const penData = {
			title: 'New Pen',
			html: htmlCode,
			css: cssCode,
			js: jsCode,
			editors: '101' // Open HTML, CSS, and JS editors
		};

		const form = document.createElement('form');
		form.action = 'https://codepen.io/pen/define';
		form.method = 'POST';
		form.target = '_blank';

		const input = document.createElement('input');
		input.type = 'hidden';
		input.name = 'data';
		input.value = JSON.stringify(penData);

		form.appendChild(input);
		document.body.appendChild(form);
		form.submit();
		document.body.removeChild(form);
	}

	function copyToClipboard() {
		navigator.clipboard.writeText(data!);
	}
</script>

<CustomNode {io} {onExecute} {...$$props}>
	<div class="flex justify-end mb-2">
		{#if data}
			<button
				class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 mx-2 rounded"
				on:click={copyToClipboard}
			>
				Copy HTML
			</button>

			<button
				class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
				on:click={openInCodePen}
			>
				Open in CodePen
			</button>
		{/if}
	</div>
	<iframe
		srcdoc={data}
		sandbox="allow-scripts"
		title="html"
		style="width: 100%; height: 100%; border: none;"
	></iframe>
</CustomNode>
