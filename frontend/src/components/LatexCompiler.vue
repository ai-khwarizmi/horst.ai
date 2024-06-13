<template>
	<div>
		<h1>LaTeX Compiler</h1>
		<textarea v-model="latexCode" placeholder="Enter LaTeX code here"></textarea>
		<button @click="compileLatex">Compile</button>
		<div v-if="pdfUrl">
			<h2>Output PDF</h2>
			<iframe :src="pdfUrl" width="100%" height="500px"></iframe>
		</div>
		<pre>{{ consoleOutput }}</pre>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

export default defineComponent({
	name: 'LatexCompiler',
	setup() {
		const latexCode = ref<string>('\\documentclass{article}\\begin{document}Hello, world!\\end{document}');
		const pdfUrl = ref<string | null>(null);
		const consoleOutput = ref<string>('');

		const compileLatex = async () => {
			const globalEn = new (window as any).XeTeXEngine();
			const dvipdfmxEn = new (window as any).DvipdfmxEngine();

			await globalEn.loadEngine();
			await dvipdfmxEn.loadEngine();

			globalEn.writeMemFSFile('main.tex', latexCode.value);
			globalEn.setEngineMainFile('main.tex');
			const result = await globalEn.compileLaTeX();

			consoleOutput.value = result.log;

			if (result.status === 0) {
				dvipdfmxEn.writeMemFSFile('main.xdv', result.pdf);
				dvipdfmxEn.setEngineMainFile('main.xdv');
				const pdfResult = await dvipdfmxEn.compilePDF();
				const pdfBlob = new Blob([pdfResult.pdf], { type: 'application/pdf' });
				pdfUrl.value = URL.createObjectURL(pdfBlob);
			}
		};

		return {
			latexCode,
			pdfUrl,
			consoleOutput,
			compileLatex,
		};
	},
});
</script>

<style scoped>
textarea {
	width: 100%;
	height: 200px;
	margin-bottom: 10px;
}

button {
	margin-bottom: 10px;
}

iframe {
	border: none;
}
</style>
