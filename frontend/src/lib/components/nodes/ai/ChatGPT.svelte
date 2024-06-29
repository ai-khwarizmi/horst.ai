<script lang="ts">
	import CustomNode from '../../CustomNode.svelte';
	import { NodeIOHandler } from '$lib/utils';
	import type { OnExecuteCallbacks } from '$lib/types';
	import { onMount } from 'svelte';
	import { basicInputOptionInput, SPECIAL_ERRORS } from '@/types';
	import OpenAI from 'openai';
	import { openai_key } from '$lib/apikeys';
	import { get } from 'svelte/store';

	let openai: OpenAI;
	let temporaryOutput = '';

	function getOpenai() {
		if (!openai) {
			const apiKey = get(openai_key) as string;
			openai = new OpenAI({
				apiKey,
				dangerouslyAllowBrowser: true
			});
		}
		return openai;
	}

	export let id: string;

	const onExecute = async (callbacks: OnExecuteCallbacks, forceExecute: boolean) => {
		try {
			const apiKey = get(openai_key) as string;
			const systemPrompt = io.getInputData('prompt_system') as string;
			const userPrompt = io.getInputData('prompt_user') as string;
			const model = io.getInputData('model') as string;
			const maxTokens = io.getInputData('max_tokens') as number;
			const temperature = io.getInputData('temperature') as number;
			const topP = io.getInputData('top_p') as number;
			const n = io.getInputData('n') as number;
			const stream = io.getInputData('stream') as boolean;
			const stop = io.getInputData('stop') as string;
			const presencePenalty = io.getInputData('presence_penalty') as number;
			const frequencyPenalty = io.getInputData('frequency_penalty') as number;
			const logitBias = io.getInputData('logit_bias') as string;
			const user = io.getInputData('user') as string;

			const newValue = JSON.stringify({
				systemPrompt,
				userPrompt,
				apiKey: apiKey,
				model,
				maxTokens,
				temperature,
				topP,
				n,
				stream,
				stop,
				presencePenalty,
				frequencyPenalty,
				logitBias,
				user
			});

			if (systemPrompt && userPrompt) {
				if (!forceExecute && newValue === lastExecutedValue) {
					return;
				}
				lastExecutedValue = newValue;
				if (!apiKey) {
					callbacks.setErrors([SPECIAL_ERRORS.OPENAI_API_KEY_MISSING]);
					return;
				}
				lastOutputValue = null;
				temporaryOutput = '';
				io.setOutputData('response', null);

				const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: userPrompt }
				];
				try {
					callbacks.setStatus('loading');

					const request: OpenAI.Chat.ChatCompletionCreateParams = {
						model: model,
						messages: messages,
						stream: true
					};

					if (maxTokens) request.max_tokens = maxTokens;
					if (temperature) request.temperature = temperature;
					if (topP) request.top_p = topP;
					if (n) request.n = n;
					if (stop) request.stop = stop;
					if (presencePenalty) request.presence_penalty = presencePenalty;
					if (frequencyPenalty) request.frequency_penalty = frequencyPenalty;
					if (logitBias) request.logit_bias = JSON.parse(logitBias);
					if (user) request.user = user;

					const stream = await getOpenai().chat.completions.create(request);

					let output = '';
					for await (const chunk of stream) {
						output += chunk.choices[0]?.delta?.content || '';
						if (lastExecutedValue === newValue) {
							temporaryOutput = output;
						}
					}

					if (lastExecutedValue === newValue) {
						lastOutputValue = output;
						io.setOutputData('response', lastOutputValue);
						callbacks.setStatus('success');
					}
				} catch (error) {
					callbacks.setErrors(['Error calling GPT-4', JSON.stringify(error)]);
				}
			} else {
				if (lastOutputValue !== null) {
				temporaryOutput = '';
					lastOutputValue = null;
					io.setOutputData('response', null);
				}
			}
		} catch (error: any) {
			callbacks.setErrors(['Error executing ChatGPT node', error.toString?.() || 'Unknown error']);
			if (lastOutputValue !== null) {
				lastOutputValue = null;
				temporaryOutput = '';
				io.setOutputData('response', null);
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
						// GPT-4o
						'gpt-4o',
						'gpt-4o-2024-05-13',
						// GPT-4 Turbo
						'gpt-4-turbo',
						'gpt-4-turbo-2024-04-09',
						'gpt-4-turbo-preview',
						'gpt-4-0125-preview',
						'gpt-4-1106-preview',
						// GPT-4
						'gpt-4',
						'gpt-4-0613',
						'gpt-4-0314',
						// GPT-3.5 Turbo
						'gpt-3.5-turbo',
						'gpt-3.5-turbo-0125',
						'gpt-3.5-turbo-1106',
						'gpt-3.5-turbo-instruct',
						// GPT base models
						'babbage-002',
						'davinci-002'
					],
					default: 'gpt-4o'
				}
			},
			{ id: 'max_tokens', type: 'number', label: 'Max Tokens', optional: true, input: basicInputOptionInput() },
			{ id: 'temperature', type: 'number', label: 'Temperature', optional: true, input: basicInputOptionInput() },
			{ id: 'top_p', type: 'number', label: 'Top P', optional: true, input: basicInputOptionInput() },
			{ id: 'n', type: 'number', label: 'N (Number of completions)', optional: true, input: basicInputOptionInput() },
			{ id: 'stream', type: 'boolean', label: 'Stream', optional: true, input: basicInputOptionInput() },
			{ id: 'stop', type: 'text', label: 'Stop Sequences', optional: true, input: basicInputOptionInput() },
			{ id: 'presence_penalty', type: 'number', label: 'Presence Penalty', optional: true, input: basicInputOptionInput() },
			{ id: 'frequency_penalty', type: 'number', label: 'Frequency Penalty', optional: true, input: basicInputOptionInput() },
			{ id: 'logit_bias', type: 'text', label: 'Logit Bias (JSON)', optional: true },
			{ id: 'user', type: 'text', label: 'User Identifier', optional: true, input: basicInputOptionInput() }
		],
		outputs: [{ id: 'response', type: 'text', label: 'Response' }],
		onExecute: onExecute
	});

	let lastExecutedValue: null | string = null;
	let lastOutputValue: null | string = '';

	onMount(() => {
		lastOutputValue = io.getOutputData('response');
	});

</script>

<CustomNode {io} {onExecute} {...$$props}>
	<p style="user-select: text; white-space: pre-wrap;">{temporaryOutput}</p>
</CustomNode>
