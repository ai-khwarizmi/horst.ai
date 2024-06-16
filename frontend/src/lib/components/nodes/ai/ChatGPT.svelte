<script lang="ts">
	import CustomNode from '../../CustomNode.svelte';
	import { NodeIOHandler } from '$lib/utils';
	import type { OnExecuteCallbacks } from '$lib/types';
	import { ChatOpenAI } from '@langchain/openai';
	import { HumanMessage, SystemMessage } from '@langchain/core/messages';
	import { getApiKeys } from '../../../utils';
	import { ratelimit } from '../../../utils/ratelimit';
	import { onMount } from 'svelte';
	import { SPECIAL_ERRORS } from '@/types';

	let model: ChatOpenAI;

	function getModel() {
		const apiKeys = getApiKeys();
		if (!model) {
			model = new ChatOpenAI({
				model: 'gpt-4o',
				openAIApiKey: apiKeys.openai!
			});
		}
		return model;
	}

	export let id: string;

	const io = new NodeIOHandler(
		id,
		[
			{ id: 'prompt_system', type: 'text', label: 'System Prompt' },
			{ id: 'prompt_user', type: 'text', label: 'User Prompt' }
		],
		[{ id: 'response', type: 'text', label: 'Response' }]
	);

	let lastExecutedValue: null | string = null;
	let lastOutputValue: null | string = '';

	onMount(() => {
		lastOutputValue = String(io.getOutputData('response'));
	});

	const onExecute = async (callbacks: OnExecuteCallbacks, forceExecute: boolean) => {
		const apiKeys = getApiKeys();
		const systemPrompt = io.getInputData('prompt_system') as string;
		const userPrompt = io.getInputData('prompt_user') as string;

		const newValue = JSON.stringify({ systemPrompt, userPrompt, apiKey: apiKeys.openai });

		if (systemPrompt && userPrompt) {
			if (!forceExecute && newValue === lastExecutedValue) {
				return;
			}
			lastExecutedValue = newValue;
			if (!apiKeys.openai) {
				callbacks.setErrors([SPECIAL_ERRORS.OPENAI_API_KEY_MISSING]);
				return;
			}
			lastOutputValue = null;
			lastExecutedValue = newValue;
			io.setOutputData('response', null);
			const messages = [new SystemMessage(systemPrompt), new HumanMessage(userPrompt)];
			try {
				callbacks.setStatus('loading');
				await ratelimit('chatgpt', 10, async () => {
					const response = await getModel().invoke(messages);
					console.log('Response from GPT-4: ', response);
					lastOutputValue = response.content as string;
					io.setOutputData('response', lastOutputValue);
					callbacks.setStatus('success');
				});
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

<CustomNode {io} {onExecute} {...$$props}></CustomNode>
