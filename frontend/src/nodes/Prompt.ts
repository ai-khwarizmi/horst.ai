import { LGraphNode, LGraphCanvas } from 'litegraph.js';

class MultilineTextInput extends LGraphNode {
	private textArea: HTMLTextAreaElement | null = null;
	static title = 'Text Prompt';

	constructor() {
		super();
		this.title = 'Text Prompt';
		this.addOutput('Text', 'string');
		this.size = [300, 150];
	}

	getTextValue(): string {
		return this.properties['textValue'] || ''
	}
	setTextValue(value: string) {
		this.properties['textValue'] = value;
	}

	onExecute() {
		this.setOutputData(0, this.getTextValue());
	}

	onDrawForeground() {
		if (this.flags.collapsed) {
			return;
		}

		if (!this.textArea) {
			const defaultBackgroundColor = 'rgba(255, 255, 255, 0.7)';
			const focusedBackgroundColor = 'rgba(255, 255, 255 )';

			this.cleanTextArea();

			console.log('Creating text area, as it was not found. Time: ', new Date().getTime())
			console.log('object id: ', this.id)
			this.textArea = document.createElement('textarea');
			this.textArea.style.position = 'absolute';
			this.textArea.style.resize = 'none';
			this.textArea.style.boxSizing = 'border-box';
			this.textArea.style.padding = '4px';
			this.textArea.style.background = defaultBackgroundColor;
			this.textArea.style.border = '0';
			this.textArea.style.visibility = 'hidden';
			this.textArea.style.borderRadius = '0px 0px 8px 8px';
			this.textArea.style.zIndex = '10';
			this.textArea.value = this.getTextValue()
			document.body.appendChild(this.textArea);

			//on focus have transparent background
			this.textArea.addEventListener('focus', () => {
				this.textArea!.style.background = focusedBackgroundColor;
			});

			//listen to cmd+s and ctrl+s to save
			this.textArea.addEventListener('keydown', (e) => {
				if (e.keyCode === 83 && (navigator.platform.match('Mac') ? e.metaKey : e.ctrlKey)) {
					e.preventDefault();
					this.saveText();
					//unfocus
					this.textArea!.blur();
				}
			});

			//listen to focus out
			this.textArea.addEventListener('focusout', () => {
				this.saveText();
				this.textArea!.style.background = defaultBackgroundColor;
			});

			if (!(window as any).textAreas) {
				(window as any).textAreas = {};
			}
			(window as any).textAreas[this.id] = this.textArea;
		}

		const graphCanvas = (this as any).graph?.canvas as LGraphCanvas;
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
		if (this.textArea.style.visibility === 'hidden' && !this.flags.collapsed) {
			this.textArea.style.visibility = 'visible';
		} else if (this.flags.collapsed) {
			this.textArea.style.visibility = 'hidden';
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

	saveText() {
		console.log('Saving text');
		if (this.textArea) {
			this.setTextValue(this.textArea.value);
		}
	}

	onDeselected(): void {
		this.saveText();
	}

	onDrawBackground() {
		if (this.flags.collapsed) {
			if (this.textArea && this.textArea.style.visibility !== 'hidden')
				this.textArea.style.visibility = 'hidden';
			return;
		}

		//ctx.fillStyle = '#FFF';
		//ctx.fillRect(4, 24, this.size[0] - 8, this.size[1] - 28);  // Adjust for header
	}

	onResize(width: number, height: number) {
		if (this.textArea) {
			this.textArea.style.width = `${width - 8}px`;
			this.textArea.style.height = `${height - 28}px`;
		}
	}

	cleanTextArea() {
		if ((window as any).textAreas && (window as any).textAreas[this.id])
			document.body.removeChild((window as any).textAreas[this.id]);
		if ((window as any).textAreas)
			delete (window as any).textAreas[this.id];
	}

	onRemoved() {
		if (this.textArea) {
			document.body.removeChild(this.textArea);
		}
		this.cleanTextArea();
	}
}

export default MultilineTextInput;
