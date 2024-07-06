<script lang="ts">
	import CustomNode from '../../CustomNode.svelte';
	import { NodeIOHandler } from '$lib/utils';
	import type { OnExecuteCallbacks } from '$lib/types';
	import { basicInputOptionInput } from '@/types';

	export let id: string;

	const INPUT_IDS = {
		ENDPOINT: 'endpoint',
		SYSTEM: 'system',
		MODEL: 'model',
		PROMPT: 'prompt',
		TEMPLATE: 'template',
		CONTEXT: 'context',
		TEMPERATURE: 'temperature',
		TOP_K: 'top_k',
		TOP_P: 'top_p',
		NUM_PREDICT: 'num_predict',
		STOP: 'stop'
	};

	const DEFAULT_ENDPOINT = 'http://localhost:11434/api/generate';

	let temporaryOutput: string | null = null;
	let lastExecutedValue: string | null = null;
	let lastOutputValue: string | null = null;

	const onExecute = async (
		callbacks: OnExecuteCallbacks,
		forceExecute: boolean,
		wrap: <T>(promise: Promise<T>) => Promise<T>
	) => {
		try {
			const model = io.getInputData(INPUT_IDS.MODEL) as string;
			const prompt = io.getInputData(INPUT_IDS.PROMPT) as string;
			const system = io.getInputData(INPUT_IDS.SYSTEM) as string;
			const template = io.getInputData(INPUT_IDS.TEMPLATE) as string;
			const context = io.getInputData(INPUT_IDS.CONTEXT) as number[];
			const endpoint = io.getInputData(INPUT_IDS.ENDPOINT) as string;
			const options = {
				temperature: io.getInputData(INPUT_IDS.TEMPERATURE) as number,
				top_k: io.getInputData(INPUT_IDS.TOP_K) as number,
				top_p: io.getInputData(INPUT_IDS.TOP_P) as number,
				num_predict: io.getInputData(INPUT_IDS.NUM_PREDICT) as number,
				stop: io.getInputData(INPUT_IDS.STOP) as string[]
			};

			const newValue = JSON.stringify({
				model,
				endpoint,
				prompt,
				system,
				template,
				context,
				options
			});

			if (model && prompt && system && endpoint) {
				if (!forceExecute && newValue === lastExecutedValue) {
					return;
				}
				lastExecutedValue = newValue;
				lastOutputValue = null;
				temporaryOutput = '';
				io.setOutputData('response', null);

				try {
					callbacks.setStatus('loading');

					const response = await wrap(
						fetch(endpoint, {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json'
							},
							body: JSON.stringify({
								model,
								prompt,
								system,
								template,
								context,
								options,
								stream: true
							})
						})
					);

					const reader = response.body?.getReader();
					if (!reader) throw new Error('Failed to get response reader');

					let output = '';
					while (true) {
						const { done, value } = await reader.read();
						if (done) break;
						const chunk = new TextDecoder().decode(value);
						const lines = chunk.split('\n');
						for (const line of lines) {
							if (line.trim() === '') continue;
							const data = JSON.parse(line);
							output += data.response;
							if (lastExecutedValue === newValue) {
								temporaryOutput = output;
							}
						}
					}

					if (lastExecutedValue === newValue) {
						lastOutputValue = output;
						io.setOutputData('response', lastOutputValue);
						callbacks.setStatus('success');
					}
				} catch (error) {
					let errorMessage = 'Unknown error';
					if (error instanceof Error) {
						errorMessage = error.message;
						if ('cause' in error && error.cause instanceof Error) {
							errorMessage += ` - ${error.cause.message}`;
						}
					}
					if (error instanceof TypeError && error.message === 'Failed to fetch') {
						errorMessage =
							'Network error: Unable to connect to the server. Please check if the server is running and accessible.';
					}
					callbacks.setErrors(['Error calling Ollama', errorMessage]);
					console.error('Detailed error:', error);
				}
			} else {
				if (lastOutputValue !== null) {
					temporaryOutput = '';
					lastOutputValue = null;
					io.setOutputData('response', null);
				}
			}
		} catch (error: any) {
			callbacks.setErrors(['Error executing Ollama node', error.toString?.() || 'Unknown error']);
			if (lastOutputValue !== null) {
				lastOutputValue = null;
				io.setOutputData('response', null);
			}
		}
	};

	const io = new NodeIOHandler({
		nodeId: id,
		inputs: [
			{
				id: INPUT_IDS.ENDPOINT,
				type: 'text',
				label: 'Endpoint',
				input: {
					inputOptionType: 'input-field',
					default: DEFAULT_ENDPOINT
				}
			},
			{
				id: INPUT_IDS.SYSTEM,
				type: 'text',
				label: 'System Prompt',
				input: {
					inputOptionType: 'input-field',
					default: undefined
				}
			},
			{
				id: INPUT_IDS.MODEL,
				type: 'text',
				label: 'Model',
				input: {
					inputOptionType: 'input-field',
					default: 'llama3'
				}
			},
			{
				id: INPUT_IDS.PROMPT,
				type: 'text',
				label: 'Prompt',
				input: {
					inputOptionType: 'input-field',
					default: undefined
				}
			},
			{
				id: INPUT_IDS.TEMPLATE,
				type: 'text',
				label: 'Template',
				optional: true,
				input: basicInputOptionInput()
			},
			{
				id: INPUT_IDS.CONTEXT,
				type: 'number[]',
				label: 'Context',
				optional: true,
				input: basicInputOptionInput()
			},
			{
				id: INPUT_IDS.TEMPERATURE,
				type: 'number',
				label: 'Temperature',
				optional: true,
				input: basicInputOptionInput()
			},
			{
				id: INPUT_IDS.TOP_K,
				type: 'number',
				label: 'Top K',
				optional: true,
				input: basicInputOptionInput()
			},
			{
				id: INPUT_IDS.TOP_P,
				type: 'number',
				label: 'Top P',
				optional: true,
				input: basicInputOptionInput()
			},
			{
				id: INPUT_IDS.NUM_PREDICT,
				type: 'number',
				label: 'Number of Tokens to Predict',
				optional: true,
				input: basicInputOptionInput()
			},
			{
				id: INPUT_IDS.STOP,
				type: 'text',
				label: 'Stop',
				optional: true,
				input: basicInputOptionInput()
			}
		],
		outputs: [
			{
				id: 'response',
				type: 'text',
				label: 'Response'
			}
		],
		onExecute,
		isInputUnsupported: async () => {
			return { unsupported: false };
		}
	});
</script>

<CustomNode {io} {onExecute} {...$$props}>
	{#if temporaryOutput}
		<p style="user-select: text; white-space: pre-wrap;">{temporaryOutput}</p>
	{/if}
</CustomNode>
