<script lang="ts">
	import CustomNode from '../../CustomNode.svelte';
	import { NodeIOHandler } from '$lib/utils';
	import type { OnExecuteCallbacks } from '$lib/types';
	import { onMount } from 'svelte';
	import { basicInputOptionInput, SPECIAL_ERRORS } from '@/types';
	import Groq from 'groq-sdk';
	import { groq_key } from '$lib/apikeys';
	import { get } from 'svelte/store';
	import type { ChatCompletionCreateParamsStreaming } from 'groq-sdk/resources/chat/completions.mjs';

	let groq: Groq;
	let temporaryOutput = '';

	function getGroq() {
		if (!groq) {
			const apiKey = get(groq_key) as string;
			groq = new Groq({
				apiKey,
				dangerouslyAllowBrowser: true
			});
		}
		return groq;
	}

	export let id: string;

	const resetDynamicState = () => {
		temporaryOutput = '';
	};

	const onExecute = async (
		callbacks: OnExecuteCallbacks,
		wrap: <T>(promise: Promise<T>) => Promise<T>
	) => {
		try {
			const apiKey = get(groq_key) as string;
			const systemPrompt = io.getInputData('prompt_system') as string;
			const userPrompt = io.getInputData('prompt_user') as string;
			const model = io.getInputData('model') as string;
			const maxTokens = io.getInputData('max_tokens') as number;
			const temperature = io.getInputData('temperature') as number;
			const topP = io.getInputData('top_p') as number;
			const n = io.getInputData('n') as number;
			const stop = io.getInputData('stop') as string;
			const presencePenalty = io.getInputData('presence_penalty') as number;
			const frequencyPenalty = io.getInputData('frequency_penalty') as number;
			const logitBias = io.getInputData('logit_bias') as string;
			const user = io.getInputData('user') as string;

			if (systemPrompt && userPrompt) {
				if (!apiKey) {
					callbacks.setErrors([SPECIAL_ERRORS.GROQ_API_KEY_MISSING]);
					return;
				}
				lastOutputValue = null;
				temporaryOutput = '';
				io.setOutputDataDynamic('response', null);

				const messages: Groq.Chat.ChatCompletionMessageParam[] = [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: userPrompt }
				];
				try {
					callbacks.setStatus('loading');

					const request: ChatCompletionCreateParamsStreaming = {
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

					const response = await wrap(getGroq().chat.completions.create(request));

					let output = '';
					for await (const chunk of response) {
						output += chunk.choices[0]?.delta?.content || '';
						temporaryOutput = output;
					}

					lastOutputValue = output;
					io.setOutputDataDynamic('response', lastOutputValue);
					callbacks.setStatus('success');
				} catch (error) {
					console.error(error);
					callbacks.setErrors(['Error calling Groq', JSON.stringify(error)]);
				}
			} else {
				if (lastOutputValue !== null) {
					temporaryOutput = '';
					lastOutputValue = null;
					io.setOutputDataDynamic('response', null);
				}
			}
		} catch (error: any) {
			console.error(error);
			callbacks.setErrors(['Error executing Groq node', error.toString?.() || 'Unknown error']);
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
						'llama3-8b-8192',
						'llama3-70b-8192',
						'mixtral-8x7b-32768',
						'gemma-7b-it',
						'gemma2-9b-it',
						'llama2-70b-4096'
					],
					default: 'llama3-8b-8192'
				}
			},
			{
				id: 'files',
				type: 'file[]',
				label: 'Files',
				optional: true
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
				id: 'n',
				type: 'number',
				label: 'N (Number of completions)',
				optional: true,
				input: basicInputOptionInput()
			},
			{
				id: 'stream',
				type: 'boolean',
				label: 'Stream',
				optional: true,
				input: basicInputOptionInput()
			},
			{
				id: 'stop',
				type: 'text',
				label: 'Stop Sequences',
				optional: true,
				input: basicInputOptionInput()
			},
			{
				id: 'presence_penalty',
				type: 'number',
				label: 'Presence Penalty',
				optional: true,
				input: basicInputOptionInput()
			},
			{
				id: 'frequency_penalty',
				type: 'number',
				label: 'Frequency Penalty',
				optional: true,
				input: basicInputOptionInput()
			},
			{ id: 'logit_bias', type: 'text', label: 'Logit Bias (JSON)', optional: true },
			{
				id: 'user',
				type: 'text',
				label: 'User Identifier',
				optional: true,
				input: basicInputOptionInput()
			}
		],
		outputs: [{ id: 'response', type: 'text', label: 'Response' }],
		onExecute: onExecute,
		isInputUnsupported: () => Promise.resolve({ unsupported: false }),
		resetDynamicState
	});

	let lastOutputValue: null | string = '';

	onMount(() => {
		lastOutputValue = io.getOutputData('response');
	});
</script>

<CustomNode {io} {...$$props}>
	<p style="user-select: text; white-space: pre-wrap;">{temporaryOutput}</p>
</CustomNode>
