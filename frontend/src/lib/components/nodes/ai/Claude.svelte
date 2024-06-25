<script lang="ts">
	import CustomNode from '../../CustomNode.svelte';
	import { NodeIOHandler } from '$lib/utils';
	import type { OnExecuteCallbacks } from '$lib/types';
	import { onMount } from 'svelte';
	import { SPECIAL_ERRORS } from '@/types';
	import Anthropic from '@anthropic-ai/sdk';
	import { anthropic_key } from '@/index';
	import { get } from 'svelte/store';

	let anthropic: Anthropic;

	let temporaryOutput = '';

	function getAnthropic() {
		if (!anthropic) {
			const apiKey = get(anthropic_key) as string;
			anthropic = new Anthropic({
				apiKey,
				baseURL: 'https://anthropic-proxy.till-584.workers.dev'
			});
		}
		return anthropic;
	}

	export let id: string;

	const io = new NodeIOHandler({
		nodeId: id,
		inputs: [
			{ id: 'prompt_system', type: 'text', label: 'System Prompt' },
			{ id: 'prompt_user', type: 'text', label: 'User Prompt' }
		],
		outputs: [{ id: 'response', type: 'text', label: 'Response' }]
	});

	let lastExecutedValue: null | string = null;
	let lastOutputValue: null | string = '';

	onMount(() => {
		lastOutputValue = io.getOutputData('response');
	});

	const onExecute = async (callbacks: OnExecuteCallbacks, forceExecute: boolean) => {
		const apiKey = get(anthropic_key) as string;

		const systemPrompt = io.getInputData('prompt_system') as string;
		const userPrompt = io.getInputData('prompt_user') as string;

		const newValue = JSON.stringify({ systemPrompt, userPrompt, apiKey: apiKey });

		if (systemPrompt && userPrompt) {
			if (!forceExecute && newValue === lastExecutedValue) {
				return;
			}
			lastExecutedValue = newValue;
			if (!apiKey) {
				callbacks.setErrors([SPECIAL_ERRORS.ANTHROPIC_API_KEY_MISSING]);
				return;
			}
			lastOutputValue = null;
			lastExecutedValue = newValue;
			temporaryOutput = '';
			io.setOutputData('response', null);

			const messages: Anthropic.MessageParam[] = [
				{ role: 'user', content: `${systemPrompt}\n\n${userPrompt}` }
			];
			try {
				callbacks.setStatus('loading');

				const stream = await getAnthropic().messages.create({
					max_tokens: 1024,
					messages: messages,
					model: 'claude-3-5-sonnet-20240620',
					stream: true
				});

				let output = '';
				for await (const chunk of stream) {
					if (chunk.type === 'content_block_delta') {
						output += chunk.delta.text || '';
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
				console.error('Error calling Claude: ', error);
				callbacks.setErrors(['Error calling Claude', JSON.stringify(error)]);
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
