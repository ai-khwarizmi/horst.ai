<script lang="ts">
	import { onMount } from 'svelte';
	import { getInputData, setOutputData, type OnExecuteCallbacks } from '$lib/utils';
	import { writable } from 'svelte/store';
	import CustomNode from '../CustomNode.svelte';

	export let id: string;
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

	async function compileLatex(latexCode: string): Promise<boolean> {
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
			return true;
		} else {
			console.error('LaTeX compilation failed:', result.log);
			return false;
		}
	}

	async function onExecute(callbacks: OnExecuteCallbacks) {
		const latexCode = getInputData(id, 0) as string;
		if (lastCompiledCode === latexCode) {
			return;
		}
		if (latexCode) {
			console.log('Received LaTeX code:', latexCode);
			lastCompiledCode = latexCode;
			const cleanedLatexCode = extractLatexCode(latexCode);
			try {
				callbacks.setStatus('loading');
				const result = await compileLatex(cleanedLatexCode);
				if (result) {
					callbacks.setStatus('success');
				} else {
					callbacks.setStatus('error');
					pdfUrl.set(null);
				}
			} catch (error) {
				console.error('Error compiling LaTeX:', error);
				callbacks.setStatus('error');
				pdfUrl.set(null);
			}
		} else {
			callbacks.setStatus('idle');
		}
	}
</script>

<CustomNode inputs={[{ type: 'text', label: 'LaTeX code' }]} {onExecute} {...$$props}>
	{#if $pdfUrl}
		<iframe src={$pdfUrl} title="latex-to-pdf" width="100%" height="100%" style="border: none;"
		></iframe>
	{/if}
</CustomNode>

<style>
</style>
