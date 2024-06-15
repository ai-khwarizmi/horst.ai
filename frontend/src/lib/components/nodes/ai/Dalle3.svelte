<script lang="ts">
	import CustomNode from '../../CustomNode.svelte';
	import { getInputData, setOutputData, type OnExecuteCallbacks } from '$lib/utils';
	import { DallEAPIWrapper } from '@langchain/openai';
	import { getApiKeys } from '../../../utils';
	import { ratelimit } from '../../../utils/ratelimit';
	import { Loader } from 'lucide-svelte';

	let tool: DallEAPIWrapper;

	function getTool() {
		const apiKeys = getApiKeys();
		if (!apiKeys.openai) {
			console.error('OpenAI API key not found');
		}
		tool = new DallEAPIWrapper({
			n: 1, // Default number of images to generate
			model: 'dall-e-3', // Model to use
			quality: 'hd',
			apiKey: apiKeys.openai!
		});
		return tool;
	}

	export let id: string;

	let lastExecutedValue: null | string = null;
	let lastOutputValue: null | string = '';

	const onExecute = async (callbacks: OnExecuteCallbacks, forceExecute: boolean) => {
		const apiKeys = getApiKeys();

		const prompt = getInputData(id, 0) as string;
		const newValue = JSON.stringify({ prompt, apiKey: apiKeys.openai });

		if (prompt) {
			if (!forceExecute && newValue === lastExecutedValue) {
				return;
			}
			if (!apiKeys.openai) {
				callbacks.setErrors(['OpenAI API key not found']);
				return;
			}
			lastExecutedValue = newValue;
			lastOutputValue = null;
			setOutputData(id, 0, null);
			try {
				await ratelimit('dalle', 10, async () => {
					callbacks.setStatus('loading');
					const imageUrl = await getTool().invoke(prompt);
					console.log('Generated image URL: ', imageUrl);
					lastOutputValue = imageUrl;
					setOutputData(id, 0, lastOutputValue);
					callbacks.setStatus('success');
				});
			} catch (error: any) {
				callbacks.setErrors(['Error calling DALL-E', error.message]);
				console.error('Error calling DALL-E: ', error);
			}
		} else {
			callbacks.setStatus('idle');
			setOutputData(id, 0, null);
			lastOutputValue = null;
		}
	};
</script>

<CustomNode
	inputs={[{ type: 'text', label: 'Prompt' }]}
	outputs={[{ type: 'text', label: 'Image URL' }]}
	{onExecute}
	{...$$props}
>
	{#if lastOutputValue}
		<img src={lastOutputValue} alt="Dalle3 Result" class="object-contain max-w-full max-h-full" />
	{/if}
</CustomNode>
