<script lang="ts">
	import CustomNode from '../../CustomNode.svelte';
	import { NodeIOHandler } from '$lib/utils';
	import type { OnExecuteCallbacks } from '$lib/types';
	import { SPECIAL_ERRORS } from '@/types';
	import OpenAI from 'openai';
	import { openai_key } from '$lib/apikeys';
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

	const onExecute = async (
		callbacks: OnExecuteCallbacks,
		forceExecute: boolean,
		wrap: <T>(promise: Promise<T>) => Promise<T>
	) => {
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
			io.setOutputDataDynamic('image_url', null);
			try {
				callbacks.setStatus('loading');

				const request: OpenAI.ImageGenerateParams = {
					model,
					prompt,
					size: size as any,
					response_format: 'b64_json'
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

				const response = await wrap(getOpenai().images.generate(request));
				const dataUrl = 'data:image/webp;base64,' + response.data[0].b64_json;
				lastOutputValue = dataUrl || null;
				io.setOutputDataDynamic('image_url', lastOutputValue);
				callbacks.setStatus('success');
			} catch (error: any) {
				callbacks.setErrors(['Error calling DALL-E', error.message]);
				console.error('Error calling DALL-E: ', error);
			}
		} else {
			callbacks.setStatus('idle');
			io.setOutputDataDynamic('image_url', null);
			lastOutputValue = null;
		}
	};

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
				id: 'quality',
				type: 'text',
				label: 'Quality',
				input: {
					inputOptionType: 'dropdown',
					options: VALID_IMAGE_QUALITIES,
					default: 'hd'
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
		outputs: [{ id: 'image_url', type: 'text', label: 'Image URL' }],
		onExecute: onExecute,
		isInputUnsupported: () => Promise.resolve({ unsupported: false })
	});

	let lastExecutedValue: null | string = null;
	let lastOutputValue: null | string = '';

	function openInNewTab(imageUrl: string | null) {
		if (!imageUrl) {
			return;
		}
		const byteString = atob(imageUrl.split(',')[1]);
		const mimeString = imageUrl.split(',')[0].split(':')[1].split(';')[0];
		const ab = new ArrayBuffer(byteString.length);
		const ia = new Uint8Array(ab);
		for (let i = 0; i < byteString.length; i++) {
			ia[i] = byteString.charCodeAt(i);
		}
		const blob = new Blob([ab], { type: mimeString });
		const url = URL.createObjectURL(blob);
		window.open(url, '_blank');
	}

	function downloadImage(imageUrl: string | null) {
		if (!imageUrl) {
			return;
		}
		const link = document.createElement('a');
		link.href = imageUrl;
		link.download = 'image.webp';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}
</script>

<CustomNode {io} {...$$props}>
	{#if lastOutputValue}
		<img src={lastOutputValue} alt="Dalle3 Result" class="object-contain max-w-full max-h-full" />
		<div class="flex justify-end mt-2 space-x-2">
			<button
				on:click={() => openInNewTab(lastOutputValue)}
				class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
			>
				Open in New Tab
			</button>
			<button
				on:click={() => downloadImage(lastOutputValue)}
				class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
			>
				Download Image
			</button>
		</div>
	{/if}
</CustomNode>
