import { LGraphCanvas, LGraphNode } from "litegraph.js"

type Constructor<T = {}> = new (...args: any[]) => T;
export function withSpinner<TBase extends Constructor<LGraphNode>>(Base: TBase) {
	return class extends Base {
		spinner: HTMLDivElement | null = null;

		declare graph: any;
		declare pos: any;
		declare size: any;

		showSpinner() {
			console.log('Showing spinner');
			if (!this.spinner) {
				this.spinner = document.createElement('div');
				this.spinner.className = 'spinner';
				document.body.appendChild(this.spinner);
			}
			this.updateSpinnerPosition();
			this.spinner.style.visibility = 'visible';
		}

		hideSpinner() {
			if (this.spinner) {
				this.spinner.style.visibility = 'hidden';
			}
		}

		updateSpinnerPosition() {
			const graphCanvas = this.graph?.canvas as LGraphCanvas;
			if (graphCanvas && this.spinner) {
				const canvasRect = graphCanvas.canvas.getBoundingClientRect();
				const zoom = graphCanvas.ds.scale;
				const offset = graphCanvas.ds.offset;

				const spinnerSize = 20 * zoom; // Adjust spinner size based on zoom
				this.spinner.style.width = `${spinnerSize}px`;
				this.spinner.style.height = `${spinnerSize}px`;
				this.spinner.style.borderWidth = `${4 * zoom}px`;

				const absoluteX = canvasRect.left + ((this.pos[0] + offset[0]) * zoom);
				const absoluteY = canvasRect.top + ((this.pos[1] + offset[1]) * zoom) - (29 * zoom);

				this.spinner.style.left = `${absoluteX + this.size[0] * zoom - (spinnerSize + 4 * zoom)}px`;
				this.spinner.style.top = `${absoluteY + 4 * zoom}px`;
			}
		}

		onDrawForeground(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
			super.onDrawForeground?.call(this, ctx, canvas);
			this.updateSpinnerPosition();
		}

		onRemoved() {
			super.onRemoved?.call(this);
			if (this.spinner) {
				document.body.removeChild(this.spinner);
			}
		}
	};
}
