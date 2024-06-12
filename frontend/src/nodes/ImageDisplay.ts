import { LiteGraph, LGraphNode } from 'litegraph.js';

class ImageDisplayNode extends LGraphNode {
	private imageUrl: string | null;
	private img: HTMLImageElement | null;

	constructor() {
		super();
		this.title = "Image Display";

		this.addInput("Image URL", "string");

		this.imageUrl = null;
		this.img = new Image();
	}

	onExecute() {
		const url = this.getInputData(0) as string;

		if (url && url !== this.imageUrl && this.img) {
			this.imageUrl = url;
			this.img.src = url;
			this.img.onload = () => {
				this.setDirtyCanvas(true, true);
			};
		}
	}

	onDrawForeground(ctx: CanvasRenderingContext2D) {
		if (this.img && this.img.complete && this.imageUrl) {
			ctx.drawImage(this.img, 0, 0, this.size[0], this.size[1]);
		} else {
			ctx.fillStyle = "#AAA";
			ctx.fillRect(0, 0, this.size[0], this.size[1]);
			ctx.fillStyle = "#000";
			ctx.fillText("Image not loaded", 10, 20);
		}
	}

	onResize(width: number, height: number) {
		this.size = [width, height];
	}
}

// Register the node type
LiteGraph.registerNodeType("display/ImageDisplayNode", ImageDisplayNode);

export default ImageDisplayNode;
