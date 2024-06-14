<script lang="ts">
	import CustomNode from '../CustomNode.svelte';
	import { getInputData, setOutputData } from '$lib/utils';
	import { ChatOpenAI } from '@langchain/openai';
	import { HumanMessage, SystemMessage } from '@langchain/core/messages';
	import { getApiKeys } from '../../utils';
	import { writable } from 'svelte/store';

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

	const lastExecutedValue = writable('');
	const lastOutputValue = writable<string | null>(null);

	const onExecute = async () => {
		const apiKeys = getApiKeys();
		if (!apiKeys.openai) {
			console.error('OpenAI API key is missing');
			return;
		}

		const systemPrompt = getInputData(id, 0) as string;
		const userPrompt = getInputData(id, 1) as string;

		const newValue = JSON.stringify({ systemPrompt, userPrompt });

		if (systemPrompt && userPrompt) {
			if (newValue === $lastExecutedValue) {
				setOutputData(id, 0, $lastOutputValue);
				return;
			}
			lastExecutedValue.set(newValue);
			lastOutputValue.set(null);
			setOutputData(id, 0, null);
			const messages = [new SystemMessage(systemPrompt), new HumanMessage(userPrompt)];
			try {
				const response = await getModel().invoke(messages);
				console.log('Response from GPT-4: ', response);
				lastOutputValue.set(response.content as string);
				setOutputData(id, 0, $lastOutputValue);
			} catch (error) {
				console.error('Error calling GPT-4: ', error);
			}
		} else {
			setOutputData(id, 0, null);
		}
	};
</script>

<CustomNode
	label="ChatGPT"
	inputs={[
		{ type: 'string', label: 'System Prompt' },
		{ type: 'string', label: 'User Prompt' }
	]}
	outputs={[{ type: 'string', label: 'Response' }]}
	{onExecute}
	{...$$props}
/>
