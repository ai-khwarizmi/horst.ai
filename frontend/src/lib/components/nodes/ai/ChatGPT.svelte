<script lang="ts">
	import CustomNode from '../../CustomNode.svelte';
	import { NodeIOHandler } from '$lib/utils';
	import type { OnExecuteCallbacks } from '$lib/types';
	import { onMount } from 'svelte';
	import { SPECIAL_ERRORS } from '@/types';
	import OpenAI from 'openai';
	import { openai_key } from '@/index';
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

	const io = new NodeIOHandler({
		nodeId: id,
		inputs: [
			{ id: 'prompt_system', type: 'text', label: 'System Prompt' },
			{ id: 'prompt_user', type: 'text', label: 'User Prompt' },
			{ id: 'temperature', type: 'text', label: 'Temperature', optional: true }
		],
		outputs: [{ id: 'response', type: 'text', label: 'Response' }]
	});

	let lastExecutedValue: null | string = null;
	let lastOutputValue: null | string = '';

	onMount(() => {
		lastOutputValue = io.getOutputData('response');
	});

	const onExecute = async (callbacks: OnExecuteCallbacks, forceExecute: boolean) => {
		const apiKey = get(openai_key) as string;

		const systemPrompt = io.getInputData('prompt_system') as string;
		const userPrompt = io.getInputData('prompt_user') as string;

		const newValue = JSON.stringify({ systemPrompt, userPrompt, apiKey: apiKey });

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
			lastExecutedValue = newValue;
			temporaryOutput = '';
			io.setOutputData('response', null);

			const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: userPrompt }
			];
			try {
				callbacks.setStatus('loading');

				const stream = await getOpenai().chat.completions.create({
					model: 'gpt-4o',
					messages: messages,
					stream: true
				});

				let output = '';
				for await (const chunk of stream) {
					//process.stdout.write(chunk.choices[0]?.delta?.content || '');
					output += chunk.choices[0]?.delta?.content || '';
					if (lastExecutedValue === newValue) {
						temporaryOutput = output;
					} else {
						//ignore
					}
				}

				if (lastExecutedValue === newValue) {
					lastOutputValue = output;
					io.setOutputData('response', lastOutputValue);
					callbacks.setStatus('success');
				}

				/* old
					const response = await getModel().invoke(messages);
					lastOutputValue = response.content as string;
					io.setOutputData('response', lastOutputValue);
					callbacks.setStatus('success');
				*/
			} catch (error) {
				console.error('Error calling GPT-4: ', error);
				callbacks.setErrors(['Error calling GPT-4', JSON.stringify(error)]);
			}
		} else {
			if (lastOutputValue !== null) {
				lastOutputValue = null;
				io.setOutputData('response', null);
			}
		}
	};
</script>

<CustomNode {io} {onExecute} {...$$props}>
	<p>{temporaryOutput}</p>
</CustomNode>
