<script lang="ts">
	import CustomNode from '../../CustomNode.svelte';
	import { getInputData, setOutputData } from '$lib/utils';
	import { ChatOpenAI } from '@langchain/openai';
	import { HumanMessage, SystemMessage } from '@langchain/core/messages';
	import { getApiKeys } from '../../../utils';
	import { ratelimit } from '../../../utils/ratelimit';
	import { Loader } from 'lucide-svelte';

	let model: ChatOpenAI;

	let loading = false;

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

	const onExecute = () => {
		const apiKeys = getApiKeys();
		if (!apiKeys.openai) {
			return;
		}

		const systemPrompt = getInputData(id, 0) as string;
		const userPrompt = getInputData(id, 1) as string;

		const newValue = JSON.stringify({ systemPrompt, userPrompt });

		if (systemPrompt && userPrompt) {
			if (newValue === lastExecutedValue) {
				setOutputData(id, 0, lastOutputValue);
				return;
			}
			lastOutputValue = null;
			lastExecutedValue = newValue;
			setOutputData(id, 0, null);
			const messages = [new SystemMessage(systemPrompt), new HumanMessage(userPrompt)];
			try {
				ratelimit('chatgpt', 10, async () => {
					loading = true;
					const response = await getModel().invoke(messages);
					console.log('Response from GPT-4: ', response);
					lastOutputValue = response.content as string;
					setOutputData(id, 0, lastOutputValue);
					loading = false;
				});
			} catch (error) {
				console.error('Error calling GPT-4: ', error);
				loading = false;
			}
		} else {
			setOutputData(id, 0, null);
		}
	};
</script>

<CustomNode
	label="ChatGPT"
	inputs={[
		{ type: 'text', label: 'System Prompt' },
		{ type: 'text', label: 'User Prompt' }
	]}
	outputs={[{ type: 'text', label: 'Response' }]}
	{onExecute}
	{...$$props}
>
	{#if loading}
		<div class="flex items-center justify-center">
			<Loader class="animate-spin w-6 h-6 mr-2" />
			<span>Loading...</span>
		</div>
	{/if}
</CustomNode>
