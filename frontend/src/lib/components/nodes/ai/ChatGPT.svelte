<script lang="ts">
	import CustomNode from '../../CustomNode.svelte';
	import {
		OPENAI_KEY_MISSING,
		getInputData,
		getOutputData,
		setOutputData,
		type OnExecuteCallbacks
	} from '$lib/utils';
	import { ChatOpenAI } from '@langchain/openai';
	import { HumanMessage, SystemMessage } from '@langchain/core/messages';
	import { getApiKeys } from '../../../utils';
	import { ratelimit } from '../../../utils/ratelimit';
	import { onMount } from 'svelte';

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

	let lastExecutedValue: null | string = null;
	let lastOutputValue: null | string = '';

	onMount(() => {
		lastOutputValue = String(getOutputData(id, 0));
	});

	const onExecute = async (callbacks: OnExecuteCallbacks, forceExecute: boolean) => {
		const apiKeys = getApiKeys();
		const systemPrompt = getInputData(id, 0) as string;
		const userPrompt = getInputData(id, 1) as string;

		const newValue = JSON.stringify({ systemPrompt, userPrompt, apiKey: apiKeys.openai });

		if (systemPrompt && userPrompt) {
			if (!forceExecute && newValue === lastExecutedValue) {
				return;
			}
			if (!apiKeys.openai) {
				callbacks.setErrors([OPENAI_KEY_MISSING]);
				return;
			}
			lastOutputValue = null;
			lastExecutedValue = newValue;
			setOutputData(id, 0, null);
			const messages = [new SystemMessage(systemPrompt), new HumanMessage(userPrompt)];
			try {
				callbacks.setStatus('loading');
				await ratelimit('chatgpt', 10, async () => {
					const response = await getModel().invoke(messages);
					console.log('Response from GPT-4: ', response);
					lastOutputValue = response.content as string;
					setOutputData(id, 0, lastOutputValue);
					callbacks.setStatus('success');
				});
			} catch (error) {
				console.error('Error calling GPT-4: ', error);
				callbacks.setErrors(['Error calling GPT-4', JSON.stringify(error)]);
			}
		} else {
			setOutputData(id, 0, null);
		}
	};
</script>

<CustomNode
	inputs={[
		{ type: 'text', label: 'System Prompt' },
		{ type: 'text', label: 'User Prompt' }
	]}
	outputs={[{ type: 'text', label: 'Response' }]}
	{onExecute}
	{...$$props}
></CustomNode>
