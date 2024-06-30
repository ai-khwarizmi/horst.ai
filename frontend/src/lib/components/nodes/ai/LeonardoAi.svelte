<script lang="ts">
	import CustomNode from '../../CustomNode.svelte';
	import { NodeIOHandler } from '$lib/utils';
	import type { OnExecuteCallbacks } from '$lib/types';
	import { SPECIAL_ERRORS } from '@/types';
	import { leonardo_key } from '$lib/apikeys';
	import { get } from 'svelte/store';

	export let id: string;

	const VALID_IMAGE_SIZES = ['1024x1024', '256x256', '512x512', '1792x1024', '1024x1792'];
	const VALID_IMAGE_MODELS = [
		'aa77f04e-3eec-4034-9c07-d0f619684628', // Leonardo Kino XL
		'6bef9f1b-29cb-40c7-b9df-32b51c1f67d3', // Leonardo Diffusion XL
		'cd2b2a15-9760-4174-a5ff-4d2925057376' // Leonardo Vision XL
	];
	const VALID_PRESET_STYLES = [
		'BOKEH',
		'CINEMATIC',
		'CINEMATIC_CLOSEUP',
		'CREATIVE',
		'FASHION',
		'FILM',
		'FOOD',
		'HDR',
		'LONG_EXPOSURE',
		'MACRO',
		'MINIMALISTIC',
		'MONOCHROME',
		'MOODY',
		'NEUTRAL',
		'PORTRAIT',
		'RETRO',
		'STOCK_PHOTO',
		'VIBRANT',
		'UNPROCESSED',
		'DYNAMIC'
	];

	const onExecute = async (callbacks: OnExecuteCallbacks, forceExecute: boolean) => {
		const apiKey = get(leonardo_key) as string;

		const prompt = io.getInputData('prompt') as string;
		const negativePrompt = io.getInputData('negative_prompt') as string;
		const modelId = io.getInputData('model_id') as string;
		const size = io.getInputData('size') as string;
		const presetStyle = io.getInputData('preset_style') as string;
		const isPublic = io.getInputData('is_public') as boolean;
		const numImages = io.getInputData('num_images') as number;
		const guidanceScale = io.getInputData('guidance_scale') as number;
		const seed = io.getInputData('seed') as number;

		const [width, height] = size.split('x').map(Number);
		const requestBody: any = {
			height,
			width,
			prompt,
			modelId,
			alchemy: true,
			photoReal: true,
			photoRealVersion: 'v2'
		};

		// Add optional parameters only if they're set
		if (negativePrompt) requestBody.negative_prompt = negativePrompt;
		if (presetStyle) requestBody.presetStyle = presetStyle;
		if (numImages) requestBody.num_images = numImages;
		if (guidanceScale) requestBody.guidance_scale = guidanceScale;
		if (seed) requestBody.seed = seed;
		if (isPublic !== undefined) requestBody.public = isPublic;

		const newValue = JSON.stringify({
			prompt,
			negativePrompt,
			modelId,
			size,
			presetStyle,
			isPublic,
			numImages,
			guidanceScale,
			seed,
			apiKey
		});

		if (prompt) {
			if (!forceExecute && newValue === lastExecutedValue) {
				return;
			}
			lastExecutedValue = newValue;
			if (!apiKey) {
				callbacks.setErrors([SPECIAL_ERRORS.LEONARDO_API_KEY_MISSING]);
				return;
			}
			lastOutputValue = null;
			io.setOutputData('image_url', null);
			try {
				callbacks.setStatus('loading');

				const response = await fetch('https://cloud.leonardo.ai/api/rest/v1/generations', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${apiKey}`
					},
					body: JSON.stringify(requestBody)
				});

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				const data = await response.json();
				const generationId = data.sdGenerationJob.generationId;

				// Poll for the generation result
				const imageUrl = await pollForGenerationResult(generationId, apiKey);
				lastOutputValue = imageUrl || null;
				io.setOutputData('image_url', lastOutputValue);
				callbacks.setStatus('success');
			} catch (error: any) {
				callbacks.setErrors(['Error calling Leonardo AI', error.message]);
				console.error('Error calling Leonardo AI: ', error);
			}
		} else {
			callbacks.setStatus('idle');
			io.setOutputData('image_url', null);
			lastOutputValue = null;
		}
	};

	async function pollForGenerationResult(
		generationId: string,
		apiKey: string
	): Promise<string | null> {
		const maxAttempts = 30;
		const delayMs = 2000;

		for (let attempt = 0; attempt < maxAttempts; attempt++) {
			const response = await fetch(
				`https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`,
				{
					headers: {
						Authorization: `Bearer ${apiKey}`
					}
				}
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();

			if (data.generations_by_pk.status === 'COMPLETE') {
				return data.generations_by_pk.generated_images[0].url;
			}

			if (data.generations_by_pk.status === 'FAILED') {
				throw new Error('Generation failed');
			}

			await new Promise((resolve) => setTimeout(resolve, delayMs));
		}

		throw new Error('Generation timed out');
	}

	const io = new NodeIOHandler({
		nodeId: id,
		inputs: [
			{ id: 'prompt', type: 'text', label: 'Prompt' },
			{ id: 'negative_prompt', type: 'text', label: 'Negative Prompt', optional: true },
			{
				id: 'model_id',
				type: 'text',
				label: 'Model ID',
				input: {
					inputOptionType: 'dropdown',
					options: VALID_IMAGE_MODELS,
					default: VALID_IMAGE_MODELS[0]
				}
			},
			{
				id: 'size',
				type: 'text',
				label: 'Size',
				input: {
					inputOptionType: 'dropdown',
					options: VALID_IMAGE_SIZES,
					default: VALID_IMAGE_SIZES[0]
				}
			},
			{
				id: 'preset_style',
				type: 'text',
				label: 'Preset Style',
				input: {
					inputOptionType: 'dropdown',
					options: VALID_PRESET_STYLES,
					default: VALID_PRESET_STYLES[0]
				},
				optional: true
			},
			{
				id: 'num_images',
				type: 'number',
				label: 'Number of Images',
				optional: true,
				input: {
					inputOptionType: 'input-field',
					default: 1
				}
			},
			{
				id: 'guidance_scale',
				type: 'number',
				label: 'Guidance Scale',
				optional: true,
				input: {
					inputOptionType: 'input-field',
					default: 7
				}
			},
			{
				id: 'seed',
				type: 'number',
				label: 'Seed',
				optional: true,
				input: {
					inputOptionType: 'input-field',
					default: undefined
				}
			},
			{
				id: 'is_public',
				type: 'boolean',
				label: 'Public',
				optional: true,
				input: {
					inputOptionType: 'dropdown',
					options: ['true', 'false'],
					default: 'false'
				}
			}
		],
		outputs: [{ id: 'image_url', type: 'text', label: 'Image URL' }],
		onExecute: onExecute
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

<CustomNode {io} {onExecute} {...$$props}>
	{#if lastOutputValue}
		<img
			src={lastOutputValue}
			alt="Leonardo.AI Result"
			class="object-contain max-w-full max-h-full"
		/>
		<div class="flex justify-end mt-2 space-x-2">
			<button
				class="px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
				on:click={() => openInNewTab(lastOutputValue)}
			>
				Open in New Tab
			</button>
			<button
				class="px-2 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
				on:click={() => downloadImage(lastOutputValue)}
			>
				Download
			</button>
		</div>
	{/if}
</CustomNode>
