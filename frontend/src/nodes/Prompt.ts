import { LiteGraph, LGraphNode } from 'litegraph.js';

class MultilineTextInput extends LGraphNode {
	textArea: HTMLTextAreaElement | null = null;
	private textValue: string;
	private timeoutID: number | null = null;
	private isTyping: boolean = false;

	constructor() {
		super();
		this.title = "Multiline Text Input";

		this.addOutput("Text", "string");

		this.textValue = "";
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
			this.textArea = document.createElement("textarea");
			this.textArea.style.position = 'absolute';
			this.textArea.style.resize = 'none';
			this.textArea.style.boxSizing = 'border-box';
			this.textArea.style.padding = '4px';
			this.textArea.addEventListener("input", this.handleInput.bind(this));
			document.body.appendChild(this.textArea);
		}

		if (this.textArea) {
			const canvasContainer = ctx.canvas.getBoundingClientRect();
			this.textArea.style.left = `${canvasContainer.left + this.pos[0] + 4}px`;
			this.textArea.style.top = `${canvasContainer.top + this.pos[1] + 24}px`;
			this.textArea.style.width = `${this.size[0] - 8}px`;
			this.textArea.style.height = `${this.size[1] - 28}px`;

			// Only update textarea value if not currently typing
			if (!this.isTyping) {
				this.textArea.value = this.textValue;
			}
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
		ctx.fillStyle = "#FFF";
		ctx.fillRect(4, 24, this.size[0] - 8, this.size[1] - 28);
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

LiteGraph.registerNodeType("basic/Prompt", MultilineTextInput);

export default MultilineTextInput;
