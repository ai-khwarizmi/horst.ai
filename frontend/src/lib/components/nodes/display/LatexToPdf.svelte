<script lang="ts">
	import { NodeIOHandler } from '$lib/utils';
	import type { OnExecuteCallbacks } from '$lib/types';
	import { writable } from 'svelte/store';
	import CustomNode from '@/components/CustomNode.svelte';

	export let id: string;

	let cleanedLatexCode: string | null = null;

	async function onExecute(callbacks: OnExecuteCallbacks) {
		const latexCode = io.getInputData('code') as string;
		if (lastCompiledCode === latexCode) {
			return;
		}
		cleanedLatexCode = null;
		if (latexCode) {
			console.log('Received LaTeX code:', latexCode);
			lastCompiledCode = latexCode;
			cleanedLatexCode = extractLatexCode(latexCode);
			try {
				callbacks.setStatus('loading');
				const result = await compileLatex(cleanedLatexCode);
				if (result.success) {
					callbacks.setStatus('success');
				} else {
					console.error('Error compiling LaTeX:', result.errorLogs);
					callbacks.setErrors(['Error compiling LaTeX', result.errorLogs]);
					pdfUrl.set(null);
				}
			} catch (error) {
				console.error('Error compiling LaTeX:', error);
				callbacks.setErrors(['Error compiling LaTeX', JSON.stringify(error)]);
				pdfUrl.set(null);
			}
		} else {
			callbacks.setStatus('idle');
		}
	}

	const io = new NodeIOHandler({
		nodeId: id,
		inputs: [{ id: 'code', type: 'text', label: 'LaTeX code' }],
		outputs: [],
		onExecute: onExecute,
		isInputUnsupported: () => Promise.resolve({ unsupported: false })
	});

	let lastCompiledCode: string | null = null;
	let pdfUrl = writable<string | null>(null);

	function extractLatexCode(inputString: string) {
		const latexCodePattern = /\\document[\s\S]*?\\end\{document\}/;
		const match = latexCodePattern.exec(inputString);

		if (match) {
			return match[0].trim();
		} else {
			return inputString;
		}
	}

	async function compileLatex(latexCode: string): Promise<{ success: boolean; errorLogs?: any }> {
		console.log('Compiling LaTeX:', latexCode);
		const globalEn = new (window as any).XeTeXEngine();
		const dvipdfmxEn = new (window as any).DvipdfmxEngine();

		await globalEn.loadEngine();
		await dvipdfmxEn.loadEngine();

		globalEn.writeMemFSFile('main.tex', latexCode);
		globalEn.setEngineMainFile('main.tex');
		const result = await globalEn.compileLaTeX();

		if (result.status === 0) {
			dvipdfmxEn.writeMemFSFile('main.xdv', result.pdf);
			dvipdfmxEn.setEngineMainFile('main.xdv');
			const pdfResult = await dvipdfmxEn.compilePDF();
			const pdfBlob = new Blob([pdfResult.pdf], { type: 'application/pdf' });
			const _pdfUrl = URL.createObjectURL(pdfBlob);

			pdfUrl.set(_pdfUrl);
			return {
				success: true
			};
		} else {
			console.error('LaTeX compilation failed:', result.log);
			return {
				success: false,
				errorLogs: result.log
			};
		}
	}

	function openInOverleaf(latexCode: string | null) {
		if (!latexCode) {
			return;
		}
		const form = document.createElement('form');
		form.action = 'https://www.overleaf.com/docs';
		form.method = 'post';
		form.target = '_blank';

		const input = document.createElement('input');
		input.type = 'text';
		input.name = 'snip_uri';
		input.value = `data:application/x-tex;base64,${btoa(extractLatexCode(latexCode))}`;
		form.appendChild(input);

		document.body.appendChild(form);
		form.submit();
		document.body.removeChild(form);
	}
</script>

<CustomNode {io} {onExecute} {...$$props}>
	{#if cleanedLatexCode}
		<div class="flex justify-end mt-2">
			<button
				on:click={() => openInOverleaf(cleanedLatexCode)}
				class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
			>
				Open in Overleaf
			</button>
		</div>
	{/if}

	{#if $pdfUrl}
		<iframe src={$pdfUrl} title="latex-to-pdf" width="100%" height="100%" style="border: none;"
		></iframe>
	{/if}
</CustomNode>
