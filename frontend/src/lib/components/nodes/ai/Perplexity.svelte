<script lang="ts">
	import CustomNode from '../../CustomNode.svelte';
	import { NodeIOHandler } from '$lib/utils';
	import type { OnExecuteCallbacks } from '$lib/types';
	import { onMount } from 'svelte';
	import { basicInputOptionInput, SPECIAL_ERRORS } from '@/types';
	import { perplexity_key } from '$lib/apikeys';
	import { get } from 'svelte/store';
	import { generatePerplexityResponse, streamPerplexityResponse } from '$lib/utils/perplexity';

	export let id: string;

	let temporaryOutput = '';

	const onExecute = async (
		callbacks: OnExecuteCallbacks,
		forceExecute: boolean,
		wrap: <T>(promise: Promise<T>) => Promise<T>
	) => {
		try {
			const apiKey = get(perplexity_key) as string;
			const systemPrompt = io.getInputData('prompt_system') as string;
			const userPrompt = io.getInputData('prompt_user') as string;
			const model = io.getInputData('model') as string;
			const maxTokens = io.getInputData('max_tokens') as number;
			const temperature = io.getInputData('temperature') as number;
			const topP = io.getInputData('top_p') as number;
			const stream = io.getInputData('stream') as boolean;

			const newValue = JSON.stringify({
				systemPrompt,
				userPrompt,
				apiKey,
				model,
				maxTokens,
				temperature,
				topP,
				stream
			});

			if (systemPrompt && userPrompt) {
				if (!forceExecute && newValue === lastExecutedValue) {
					return;
				}
				lastExecutedValue = newValue;
				if (!apiKey) {
					callbacks.setErrors([SPECIAL_ERRORS.PERPLEXITY_API_KEY_MISSING]);
					return;
				}
				lastOutputValue = null;
				temporaryOutput = '';
				io.setOutputDataDynamic('response', null);

				const messages = [
					{ role: 'system' as const, content: systemPrompt },
					{ role: 'user' as const, content: userPrompt }
				];

				try {
					callbacks.setStatus('loading');

					const requestBody = {
						model,
						messages,
						max_tokens: maxTokens,
						temperature,
						top_p: topP,
						stream
					};

					const response = await wrap(generatePerplexityResponse(requestBody));

					if (stream) {
						let output = '';
						for await (const chunk of streamPerplexityResponse(response)) {
							output += chunk;
							if (lastExecutedValue === newValue) {
								temporaryOutput = output;
							}
						}

						if (lastExecutedValue === newValue) {
							lastOutputValue = output;
							io.setOutputDataDynamic('response', lastOutputValue);
							callbacks.setStatus('success');
						}
					} else {
						const data = await response.json();
						const output = data.choices[0].message.content;

						if (lastExecutedValue === newValue) {
							lastOutputValue = output;
							io.setOutputDataDynamic('response', lastOutputValue);
							callbacks.setStatus('success');
						}
					}
				} catch (error) {
					callbacks.setErrors(['Error calling Perplexity API', JSON.stringify(error)]);
				}
			} else {
				if (lastOutputValue !== null) {
					temporaryOutput = '';
					lastOutputValue = null;
					io.setOutputDataDynamic('response', null);
				}
			}
		} catch (error: any) {
			callbacks.setErrors(['Error executing Perplexity node', error.toString?.() || 'Unknown error']);
			if (lastOutputValue !== null) {
				lastOutputValue = null;
				temporaryOutput = '';
				io.setOutputDataDynamic('response', null);
			}
		}
	};

	const io = new NodeIOHandler({
		nodeId: id,
		inputs: [
			{
				id: 'prompt_system',
				type: 'text',
				label: 'System Prompt',
				input: {
					inputOptionType: 'input-field',
					default: undefined
				}
			},
			{
				id: 'prompt_user',
				type: 'text',
				label: 'User Prompt',
				input: {
					inputOptionType: 'input-field',
					default: undefined
				}
			},
			{
				id: 'model',
				type: 'text',
				label: 'Model',
				input: {
					inputOptionType: 'dropdown',
					options: [
						'llama-3-sonar-small-32k-online',
						'llama-3-sonar-small-32k-chat',
						'llama-3-sonar-large-32k-online',
						'llama-3-sonar-large-32k-chat',
						'llama-3-8b-instruct',
						'llama-3-70b-instruct',
						'mixtral-8x7b-instruct'
					],
					default: 'llama-3-sonar-small-32k-online'
				}
			},
			{
				id: 'max_tokens',
				type: 'number',
				label: 'Max Tokens',
				optional: true,
				input: basicInputOptionInput()
			},
			{
				id: 'temperature',
				type: 'number',
				label: 'Temperature',
				optional: true,
				input: basicInputOptionInput()
			},
			{
				id: 'top_p',
				type: 'number',
				label: 'Top P',
				optional: true,
				input: basicInputOptionInput()
			},
			{
				id: 'stream',
				type: 'boolean',
				label: 'Stream',
				optional: true,
				input: basicInputOptionInput()
			}
		],
		outputs: [{ id: 'response', type: 'text', label: 'Response' }],
		onExecute: onExecute,
		isInputUnsupported: () => Promise.resolve({ unsupported: false })
	});

	let lastExecutedValue: null | string = null;
	let lastOutputValue: null | string = '';

	onMount(() => {
		lastOutputValue = io.getOutputData('response');
	});
</script>

<CustomNode {io} {...$$props}>
	<p style="user-select: text; white-space: pre-wrap;">{temporaryOutput}</p>
</CustomNode>
