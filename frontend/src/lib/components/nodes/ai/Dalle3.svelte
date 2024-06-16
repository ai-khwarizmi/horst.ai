<script lang="ts">
	import CustomNode from '../../CustomNode.svelte';
	import { NodeIOHandler, OPENAI_KEY_MISSING, type OnExecuteCallbacks } from '$lib/utils';
	import { DallEAPIWrapper } from '@langchain/openai';
	import { getApiKeys } from '../../../utils';
	import { ratelimit } from '../../../utils/ratelimit';
	import { openai_key } from '@/index';
	import Button from '@/components/ui/button/button.svelte';
	import { openApiKeySettings } from '@/components/settings/APIKeys.svelte';

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

	const io = new NodeIOHandler(
		id,
		[{ id: 'prompt', type: 'text', label: 'Prompt' }],
		[{ id: 'image_url', type: 'text', label: 'Image URL' }]
	);

	let lastExecutedValue: null | string = null;
	let lastOutputValue: null | string = '';

	const onExecute = async (callbacks: OnExecuteCallbacks, forceExecute: boolean) => {
		const apiKeys = getApiKeys();

		const prompt = io.getInputData('prompt') as string;
		const newValue = JSON.stringify({ prompt, apiKey: apiKeys.openai });

		if (prompt) {
			if (!forceExecute && newValue === lastExecutedValue) {
				return;
			}
			lastExecutedValue = newValue;
			if (!apiKeys.openai) {
				callbacks.setErrors([OPENAI_KEY_MISSING]);
				return;
			}
			lastOutputValue = null;
			io.setOutputData('image_url', null);
			try {
				await ratelimit('dalle', 10, async () => {
					callbacks.setStatus('loading');
					const imageUrl = await getTool().invoke(prompt);
					console.log('Generated image URL: ', imageUrl);
					lastOutputValue = imageUrl;
					io.setOutputData('image_url', lastOutputValue);
					callbacks.setStatus('success');
				});
			} catch (error: any) {
				callbacks.setErrors(['Error calling DALL-E', error.message]);
				console.error('Error calling DALL-E: ', error);
			}
		} else {
			callbacks.setStatus('idle');
			io.setOutputData('image_url', null);
			lastOutputValue = null;
		}
	};
</script>

{#if $openai_key}
	<CustomNode {io} {onExecute} {...$$props}>
		{#if lastOutputValue}
			<img src={lastOutputValue} alt="Dalle3 Result" class="object-contain max-w-full max-h-full" />
		{/if}
	</CustomNode>
{:else}
	<div class="p-4 bg-red-100 text-red-800 rounded-lg">
		<p class="font-bold">OpenAI API Key Missing</p>
		<p>Please add your OpenAI API key in the settings to use this node.</p>
		<Button variant="outline" size="sm" on:click={openApiKeySettings} class="mt-2">
			Set OpenAI Key
		</Button>
	</div>
{/if}
