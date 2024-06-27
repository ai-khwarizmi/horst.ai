<script lang="ts">
	import CustomNode from '../../CustomNode.svelte';
	import { NodeIOHandler } from '$lib/utils';
	import type { OnExecuteCallbacks } from '$lib/types';
	import { SPECIAL_ERRORS } from '@/types';
	import OpenAI from 'openai';
	import { openai_key } from '@/index';
	import { get } from 'svelte/store';

	let openai: OpenAI;

	function getOpenai() {
		if (!openai) {
			const apiKey = get(openai_key) as string;
			openai = new OpenAI({
				apiKey,
				dangerouslyAllowBrowser: true
			});
		}
		return openai;
	}

	export let id: string;

	const VALID_IMAGE_SIZES = ['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792'];
	const VALID_IMAGE_STYLES = ['vivid', 'natural'];
	const VALID_IMAGE_QUALITIES = ['standard', 'hd'];
	const VALID_IMAGE_MODELS = ['dall-e-2', 'dall-e-3'];

	const io = new NodeIOHandler({
		nodeId: id,
		inputs: [
			{ id: 'prompt', type: 'text', label: 'Prompt' },
			{
				id: 'model',
				type: 'text',
				label: 'Model',
				input: {
					inputOptionType: 'dropdown',
					options: VALID_IMAGE_MODELS,
					default: 'dall-e-3'
				}
			},
			{
				id: 'quality',
				type: 'text',
				label: 'Quality',
				input: {
					inputOptionType: 'dropdown',
					options: VALID_IMAGE_QUALITIES,
					default: 'standard'
				},
				optional: true
			},
			{
				id: 'size',
				type: 'text',
				label: 'Size',
				input: {
					inputOptionType: 'dropdown',
					options: VALID_IMAGE_SIZES,
					default: '1024x1024'
				}
			},
			{
				id: 'style',
				type: 'text',
				label: 'Style',
				input: {
					inputOptionType: 'dropdown',
					options: VALID_IMAGE_STYLES,
					default: 'vivid'
				},
				optional: true
			},
			{ id: 'user', type: 'text', label: 'User Identifier', optional: true }
		],
		outputs: [{ id: 'image_url', type: 'text', label: 'Image URL' }]
	});

	let lastExecutedValue: null | string = null;
	let lastOutputValue: null | string = '';

	const onExecute = async (callbacks: OnExecuteCallbacks, forceExecute: boolean) => {
		const apiKey = get(openai_key) as string;

		const prompt = io.getInputData('prompt') as string;
		const model = io.getInputData('model') as string;
		const quality = io.getInputData('quality') as string;
		const size = io.getInputData('size') as string;
		const style = io.getInputData('style') as string;
		const user = io.getInputData('user') as string;

		const newValue = JSON.stringify({
			prompt,
			model,
			quality,
			size,
			style,
			user,
			apiKey
		});

		if (prompt) {
			if (!forceExecute && newValue === lastExecutedValue) {
				return;
			}
			lastExecutedValue = newValue;
			if (!apiKey) {
				callbacks.setErrors([SPECIAL_ERRORS.OPENAI_API_KEY_MISSING]);
				return;
			}
			lastOutputValue = null;
			io.setOutputData('image_url', null);
			try {
				callbacks.setStatus('loading');

				const request: OpenAI.ImageGenerateParams = {
					model,
					prompt,
					size: size as any
				};

				if (quality) {
					request.quality = quality as any;
				}
				if (style) {
					request.style = style as any;
				}
				if (user) {
					request.user = user;
				}

				const response = await getOpenai().images.generate(request);

				const imageUrl = response.data[0].url;
				console.log('Generated image URL: ', imageUrl);
				lastOutputValue = imageUrl || null;
				io.setOutputData('image_url', lastOutputValue);
				callbacks.setStatus('success');
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

<CustomNode {io} {onExecute} {...$$props}>
	{#if lastOutputValue}
		<img src={lastOutputValue} alt="Dalle3 Result" class="object-contain max-w-full max-h-full" />
	{/if}
</CustomNode>
