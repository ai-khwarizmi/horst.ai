<script lang="ts">
	import CustomNode from '../../CustomNode.svelte';
	import { NodeIOHandler } from '$lib/utils';
	import type { OnExecuteCallbacks } from '$lib/types';
	import { onMount } from 'svelte';
	import { SPECIAL_ERRORS } from '@/types';
	import Anthropic from '@anthropic-ai/sdk';
	import { anthropic_key } from '$lib/apikeys';
	import { get } from 'svelte/store';
	import { ANTHROPIC_PROXY_BASE_URL } from '@/config';

	let anthropic: Anthropic;

	let temporaryOutput = '';

	function getAnthropic() {
		if (!anthropic) {
			const apiKey = get(anthropic_key) as string;
			anthropic = new Anthropic({
				apiKey,
				baseURL: ANTHROPIC_PROXY_BASE_URL
			});
		}
		return anthropic;
	}

	export let id: string;

	const onExecute = async (
		callbacks: OnExecuteCallbacks,
		wrap: <T>(promise: Promise<T>) => Promise<T>
	) => {
		const apiKey = get(anthropic_key) as string;

		const systemPrompt = io.getInputData('prompt_system') as string;
		const userPrompt = io.getInputData('prompt_user') as string;

		if (systemPrompt && userPrompt) {
			if (!apiKey) {
				callbacks.setErrors([SPECIAL_ERRORS.ANTHROPIC_API_KEY_MISSING]);
				return;
			}
			lastOutputValue = null;
			temporaryOutput = '';
			io.setOutputDataDynamic('response', null);

			const messages: Anthropic.MessageParam[] = [
				{ role: 'user', content: `${systemPrompt}\n\n${userPrompt}` }
			];
			try {
				callbacks.setStatus('loading');

				const stream = await wrap(
					getAnthropic().messages.create({
						max_tokens: 1024,
						messages: messages,
						model: 'claude-3-5-sonnet-20240620',
						stream: true
					})
				);

				let output = '';
				for await (const chunk of stream) {
					if (chunk.type === 'content_block_delta') {
						output += (chunk as any).delta.text || '';
						temporaryOutput = output;
					}
				}

				lastOutputValue = output;
				io.setOutputDataDynamic('response', lastOutputValue);
				callbacks.setStatus('success');
			} catch (error) {
				console.error('Error calling Claude: ', error);
				callbacks.setErrors(['Error calling Claude', JSON.stringify(error)]);
			}
		} else {
			if (lastOutputValue !== null) {
				lastOutputValue = null;
				io.setOutputDataDynamic('response', null);
			}
		}
	};

	const io = new NodeIOHandler({
		nodeId: id,
		inputs: [
			{ id: 'prompt_system', type: 'text', label: 'System Prompt' },
			{ id: 'prompt_user', type: 'text', label: 'User Prompt' }
		],
		outputs: [{ id: 'response', type: 'text', label: 'Response' }],
		onExecute: onExecute,
		isInputUnsupported: () => Promise.resolve({ unsupported: false })
	});

	let lastOutputValue: null | string = '';

	onMount(() => {
		lastOutputValue = io.getOutputData('response');
	});
</script>

<CustomNode {io} {...$$props}>
	<p>{temporaryOutput}</p>
</CustomNode>
