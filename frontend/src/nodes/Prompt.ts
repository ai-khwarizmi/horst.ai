import { LiteGraph, LGraphNode, LGraphCanvas } from 'litegraph.js';

class MultilineTextInput extends LGraphNode {
	textArea: HTMLTextAreaElement | null = null;
	private textValue: string;
	private timeoutID: number | null = null;
	private isTyping: boolean = false;

	constructor() {
		super();
		this.title = 'Multiline Text Input';
		this.addOutput('Text', 'string');

		this.textArea = null;
		this.textValue = '';
		this.size = [300, 150];
	}

	onExecute() {
		this.setOutputData(0, this.textValue);
	}

	onDrawForeground(ctx: CanvasRenderingContext2D) {
		if (this.flags.collapsed) {
			return;
		}

		if (!this.textArea) {
			this.textArea = document.createElement('textarea');
			this.textArea.style.position = 'absolute';
			this.textArea.style.resize = 'none';
			this.textArea.style.boxSizing = 'border-box';
			this.textArea.style.padding = '4px';
			this.textArea.style.background = 'rgba(255, 255, 255)';
			this.textArea.style.border = '0';
			this.textArea.style.borderRadius = '0px';
			this.textArea.style.zIndex = '10';
			this.textArea.addEventListener('input', this.handleInput.bind(this));
			document.body.appendChild(this.textArea);

			this.ensureFocus();
		}

		const graphCanvas = this.graph?.canvas as LGraphCanvas;
		if (!graphCanvas) {
			console.error('LGraphCanvas instance not found.');
			return;
		}

		const canvasRect = graphCanvas.canvas.getBoundingClientRect();
		const zoom = graphCanvas.ds.scale;
		const offset = graphCanvas.ds.offset;
		const headerOffset = 24;
		const headerHeight = headerOffset * zoom;  // Adjusting for header, scaled with zoom

		// Convert the node's position to screen position
		const absoluteX = canvasRect.left + ((this.pos[0] + offset[0]) * zoom);
		const absoluteY = canvasRect.top + ((this.pos[1] + offset[1]) * zoom) + headerHeight;

		// Calculate node size considering the zoom level
		const nodeWidth = this.size[0] * zoom;
		const nodeHeight = (this.size[1] - headerOffset) * zoom;

		this.textArea.style.left = `${absoluteX}px`;
		this.textArea.style.top = `${absoluteY}px`;
		this.textArea.style.width = `${nodeWidth}px`;
		this.textArea.style.height = `${nodeHeight}px`;
		this.textArea.style.fontSize = `${14 * zoom}px`; // Adjust font size according to zoom level

		if (!this.isTyping) {
			this.textArea.value = this.textValue;
		}
	}

	ensureFocus() {
		if (this.textArea && document.activeElement !== this.textArea) {
			console.log('Setting focus to text area');
			this.textArea.focus();
			setTimeout(() => {
				this.ensureFocus();
			}, 10);
		} else {
			console.log('Focus set to text area');
		}
	}

	handleInput() {
		if (this.timeoutID !== null) {
			clearTimeout(this.timeoutID);
		}

		this.isTyping = true;

		this.timeoutID = window.setTimeout(() => {
			this.textValue = this.textArea!.value;
			this.setDirtyCanvas(true, true);
			this.isTyping = false;
		}, 500);
	}

	onDrawBackground(ctx: CanvasRenderingContext2D) {
		if (this.flags.collapsed) {
			return;
		}

		ctx.fillStyle = '#FFF';
		ctx.fillRect(4, 24, this.size[0] - 8, this.size[1] - 28);  // Adjust for header
	}

	onResize(width: number, height: number) {
		if (this.textArea) {
			this.textArea.style.width = `${width - 8}px`;
			this.textArea.style.height = `${height - 28}px`;
		}
	}

	onRemoved() {
		if (this.textArea) {
			document.body.removeChild(this.textArea);
		}
	}
}

export default MultilineTextInput;
