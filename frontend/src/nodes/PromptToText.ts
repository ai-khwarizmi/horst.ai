import { LiteGraph, LGraphNode } from 'litegraph.js';
import { OpenAI } from 'langchain';

class ChatGPTNode extends LGraphNode {
	private langChain: OpenAI;

	static title = "ChatGPT";
	static desc = "Call GPT-4 via LangChain";

	constructor() {
		super();

		this.langChain = new OpenAI({
			apiKey: 'your-openai-api-key',
			model: 'gpt-4', // Specify the model
		});

		// Input slots
		this.addInput("System Prompt", "string");
		this.addInput("User Prompt", "string");

		// Output slot
		this.addOutput("Response", "string");
	}

	async onExecute() {
		const systemPrompt = this.getInputData(0) as string;
		const userPrompt = this.getInputData(1) as string;

		if (systemPrompt && userPrompt) {
			try {
				const response = await this.langChain.chat({
					systemPrompt,
					userPrompt,
				});

				this.setOutputData(0, response.text);
			} catch (error) {
				console.error("Error calling GPT-4: ", error);
				this.setOutputData(0, "Error: " + error.message);
			}
		}
	}
}

// Register the node type
LiteGraph.registerNodeType("chatgpt/ChatGPTNode", ChatGPTNode);
