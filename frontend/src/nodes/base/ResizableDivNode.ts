import { LGraphNode, LGraphCanvas } from 'litegraph.js';

export class ResizableDivNode extends LGraphNode {
	protected containerDiv: HTMLDivElement;
	static title = 'Resizable Div';

	constructor() {
		super();
		this.title = 'Resizable Div';
		this.size = [300, 150];

		this.containerDiv = document.createElement('div');
		this.containerDiv.style.position = 'absolute';
		this.containerDiv.style.resize = 'none';
		this.containerDiv.style.boxSizing = 'border-box';
		this.containerDiv.style.padding = '4px';
		this.containerDiv.style.background = 'rgba(255, 255, 255, 0.7)';
		this.containerDiv.style.border = '0';
		this.containerDiv.style.visibility = 'hidden';
		this.containerDiv.style.borderRadius = '0px 0px 8px 8px';
		this.containerDiv.style.zIndex = '10';
		document.body.appendChild(this.containerDiv);

		if (!(window as any).containerDivs) {
			(window as any).containerDivs = {};
		}
		(window as any).containerDivs[this.id] = this.containerDiv;
	}

	onExecute() {
		if (super.onExecute) {
			super.onExecute();
		}
	}

	onDrawForeground(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
		if (super.onDrawForeground) {
			super.onDrawForeground(ctx, canvas);
		}

		if (this.flags.collapsed) {
			return;
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

		this.containerDiv.style.left = `${absoluteX}px`;
		this.containerDiv.style.top = `${absoluteY}px`;
		this.containerDiv.style.width = `${nodeWidth}px`;
		this.containerDiv.style.height = `${nodeHeight}px`;
		this.containerDiv.style.fontSize = `${14 * zoom}px`; // Adjust font size according to zoom level
		if (this.containerDiv.style.visibility === 'hidden' && !this.flags.collapsed) {
			this.containerDiv.style.visibility = 'visible';
		} else if (this.flags.collapsed) {
			this.containerDiv.style.visibility = 'hidden';
		}
	}

	onResize(width: number, height: number) {
		if (this.containerDiv) {
			this.containerDiv.style.width = `${width - 8}px`;
			this.containerDiv.style.height = `${height - 28}px`;
		}
	}

	cleanContainerDiv() {
		try {
			if ((window as any).containerDivs && (window as any).containerDivs[this.id])
				document.body.removeChild((window as any).containerDivs[this.id]);
			if ((window as any).containerDivs)
				delete (window as any).containerDivs[this.id];
		} catch (e) {
		}
	}

	onRemoved() {
		if (super.onRemoved) {
			super.onRemoved();
		}
		if (this.containerDiv) {
			try {
				document.body.removeChild(this.containerDiv);
			} catch (e) {
			}
		}
		this.cleanContainerDiv();
	}
}

export default ResizableDivNode;
