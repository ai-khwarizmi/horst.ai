import { ResizableDivNode } from './base/ResizableDivNode';
import { withSpinner } from './mixins/Spinner';

class LatexToPdfNode extends ResizableDivNode {
	static title = 'LaTeX to PDF';

	lastCompiledCode: string | null = null;

	declare showSpinner: () => void;
	declare hideSpinner: () => void;

	constructor() {
		super();
		this.title = 'LaTeX to PDF';
		this.addInput('LaTeX Code', 'string');
		this.size = [300, 400];

	}

	extractLatexCode(inputString: string) {
		// Look for the start of a LaTeX document with \document and capture until the last \end{document}
		const latexCodePattern = /\\document[\s\S]*?\\end\{document\}/;
		const match = latexCodePattern.exec(inputString);

		if (match) {
			return match[0].trim();
		} else {
			return inputString
		}
	}

	async onExecute() {
		const latexCode = this.getInputData(0) as string;
		if (this.lastCompiledCode === latexCode) {
			return;
		}
		if (latexCode) {
			console.log('Received LaTeX code:', latexCode);
			this.lastCompiledCode = latexCode;

			const cleanedLatexCode = this.extractLatexCode(latexCode);
			this.showSpinner();
			try {
				await this.compileLatex(cleanedLatexCode);
			} catch (error) {
				console.error('Error compiling LaTeX:', error);
			}
			this.hideSpinner();
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

export default withSpinner(LatexToPdfNode);
