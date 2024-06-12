import { LiteGraph, LGraphNode } from 'litegraph.js';
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const model = new ChatOpenAI({
	model: "gpt-4",
	openAIApiKey: window.localStorage.getItem("openai-api-key") || "",
});

class ChatGPTNode extends LGraphNode {

	lastExecutedValue: string;
	lastOutputValue: string | null;

	constructor() {
		super();
		this.title = "ChatGPT";

		// Input slots
		this.addInput("System Prompt", "string");
		this.addInput("User Prompt", "string");

		// Output slot
		this.addOutput("Response", "string");

		this.lastExecutedValue = '';
		this.lastOutputValue = null;
	}

	async onExecute() {
		const systemPrompt = this.getInputData(0) as string;
		const userPrompt = this.getInputData(1) as string;

		const newValue = JSON.stringify({ systemPrompt, userPrompt });

		if (systemPrompt && userPrompt) {
			if (newValue === this.lastExecutedValue) {
				this.setOutputData(0, this.lastOutputValue);
				return;
			}
			this.lastExecutedValue = newValue;
			this.lastOutputValue = null;
			const messages = [
				new SystemMessage(systemPrompt),
				new HumanMessage(userPrompt),
			];
			try {
				const response = await model.invoke(messages);
				console.log("Response from GPT-4: ", response);
				this.lastOutputValue = response.content as string;
				this.setOutputData(0, this.lastOutputValue);
			} catch (error) {
				console.error("Error calling GPT-4: ", error);
			}
		} else {
			this.setOutputData(0, null);
		}
	}
}

// Register the node type
LiteGraph.registerNodeType("openai/ChatGPT", ChatGPTNode);
