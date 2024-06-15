<script lang="ts">
	import CustomNode from '../../CustomNode.svelte';
	import { getInputData, setOutputData } from '$lib/utils';
	import { DallEAPIWrapper } from '@langchain/openai';
	import { getApiKeys } from '../../../utils';
	import { ratelimit } from '../../../utils/ratelimit';
	import { Loader } from 'lucide-svelte';

	let tool: DallEAPIWrapper;

	let loading = false;

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

	const onExecute = () => {
		const apiKeys = getApiKeys();
		if (!apiKeys.openai) {
			return;
		}

		const prompt = getInputData(id, 0) as string;

		if (prompt) {
			if (prompt === lastExecutedValue) {
				setOutputData(id, 0, lastOutputValue);
				return;
			}
			lastExecutedValue = prompt;
			lastOutputValue = null;
			setOutputData(id, 0, null);
			try {
				ratelimit('dalle', 10, async () => {
					loading = true;
					const imageUrl = await getTool().invoke(prompt);
					console.log('Generated image URL: ', imageUrl);
					lastOutputValue = imageUrl;
					setOutputData(id, 0, lastOutputValue);
					loading = false;
				});
			} catch (error) {
				console.error('Error calling DALL-E: ', error);
			}
		} else {
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
	{#if loading}
		<div class="flex items-center justify-center">
			<Loader class="animate-spin w-6 h-6 mr-2" />
			<span>Loading...</span>
		</div>
	{/if}
	{#if lastOutputValue}
		<img src={lastOutputValue} alt="Generated Image" class="max-w-full max-h-full" />
	{/if}
</CustomNode>
