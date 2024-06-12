import { LiteGraph, LGraphNode } from 'litegraph.js';
import { DallEAPIWrapper } from "@langchain/openai";

const tool = new DallEAPIWrapper({
	n: 1, // Default number of images to generate
	model: "dall-e-3", // Model to use
	apiKey: window.localStorage.getItem("openai-api-key") || "", // API key from local storage
});

class DalleNode extends LGraphNode {
	lastExecutedValue: string;
	lastOutputValue: HTMLImageElement | null;
	url: string | null;

	constructor() {
		super();
		this.title = "Dalle3 Image Generator";

		// Input slots
		this.addInput("Prompt", "string");

		// Output slot
		this.addOutput("Image", "image");

		this.lastExecutedValue = '';
		this.lastOutputValue = null;
		this.url = null;
		this.size = [300, 300];
	}

	async onExecute() {
		const prompt = this.getInputData(0) as string;

		if (prompt) {
			if (prompt === this.lastExecutedValue) {
				this.setOutputData(0, this.lastOutputValue);
				return;
			}
			this.lastExecutedValue = prompt;
			this.lastOutputValue = null;
			this.url = null;
			try {
				const imageUrl = await tool.invoke(prompt);
				console.log("Generated image URL: ", imageUrl);
				this.url = imageUrl;

				// Create an image element and set its source
				const img = new Image();
				img.src = imageUrl;
				img.onload = () => {
					this.lastOutputValue = img;
					this.setOutputData(0, this.lastOutputValue);
					this.setDirtyCanvas(true, true);
				};
			} catch (error) {
				console.error("Error calling DALL-E: ", error);
			}
		} else {
			this.setOutputData(0, null);
		}
	}

	onDrawForeground(ctx: CanvasRenderingContext2D) {
		if (this.lastOutputValue) {
			const img = this.lastOutputValue;
			ctx.drawImage(img, 0, 0, this.size[0], this.size[1]);
		}
	}
}

// Register the node type
LiteGraph.registerNodeType("openai/PromptToImage-Dalle3", DalleNode);

export default DalleNode;
