import { ResizableDivNode } from './base/ResizableDivNode';

class LatexToPdfNode extends ResizableDivNode {
	static title = 'LaTeX to PDF';

	lastCompiledCode: string | null = null;

	constructor() {
		super();
		this.title = 'LaTeX to PDF';
		this.addInput('LaTeX Code', 'string');
		this.size = [300, 400];

	}

	async onExecute() {
		const latexCode = this.getInputData(0) as string;
		if (this.lastCompiledCode === latexCode) {
			return;
		}
		if (latexCode) {
			console.log('Received LaTeX code:', latexCode);
			this.lastCompiledCode = latexCode;
			await this.compileLatex(latexCode);
		}
	}

	async compileLatex(latexCode: string) {
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
			const pdfUrl = URL.createObjectURL(pdfBlob);

			this.renderPdf(pdfUrl);
		} else {
			console.error('LaTeX compilation failed:', result.log);
		}
	}

	renderPdf(pdfUrl: string) {
		if (this.containerDiv) {
			this.containerDiv.innerHTML = `<iframe src="${pdfUrl}" width="100%" height="100%" style="border: none;"></iframe>`;
		}
	}
}

export default LatexToPdfNode;
