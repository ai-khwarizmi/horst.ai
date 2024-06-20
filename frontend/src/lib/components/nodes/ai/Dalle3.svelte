<script lang="ts">
	import CustomNode from '../../CustomNode.svelte';
	import { NodeIOHandler } from '$lib/utils';
	import type { OnExecuteCallbacks } from '$lib/types';
	import { DallEAPIWrapper } from '@langchain/openai';
	import { getApiKeys } from '../../../utils';
	import { ratelimit } from '../../../utils/ratelimit';
	import { SPECIAL_ERRORS } from '@/types';

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

	const io = new NodeIOHandler({
		nodeId: id,
		inputs: [{ id: 'prompt', type: 'text', label: 'Prompt' }],
		outputs: [
			{ id: 'file', type: 'file', label: 'Image' },
			{ id: 'image_url', type: 'text', label: 'Image URL' }
		]
	});

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
				callbacks.setErrors([SPECIAL_ERRORS.OPENAI_API_KEY_MISSING]);
				return;
			}
			lastOutputValue = null;
			io.setOutputData('image_url', null);
			io.setOutputData('file', null);
			try {
				await ratelimit('dalle', 10, async () => {
					callbacks.setStatus('loading');
					const imageUrl = await getTool().invoke(prompt);
					console.log('Generated image URL: ', imageUrl);
					lastOutputValue = imageUrl;
					const wrapperUrl = new URL('http://localhost:3000/');
					wrapperUrl.searchParams.append('image', lastOutputValue);
					io.setOutputData('image_url', wrapperUrl.toString());
					const body = await fetch(wrapperUrl.toString(), {});
					const blob = await body.blob();
					io.setOutputData('file', new File([blob], 'dalle3-image.png'));
					callbacks.setStatus('success');
				});
			} catch (error: any) {
				callbacks.setErrors(['Error calling DALL-E', error.message]);
				console.error('Error calling DALL-E: ', error);
			}
		} else {
			callbacks.setStatus('idle');
			io.setOutputData('image_url', null);
			io.setOutputData('file', null);
			lastOutputValue = null;
		}
	};
</script>

<CustomNode {io} {onExecute} {...$$props}>
	{#if lastOutputValue}
		<img src={lastOutputValue} alt="Dalle3 Result" class="object-contain max-w-full max-h-full" />
	{/if}
</CustomNode>
