<script lang="ts">
	import CustomNode from '../../CustomNode.svelte';
	import { NodeIOHandler } from '$lib/utils';
	import type { OnExecuteCallbacks } from '$lib/types';
	import { SPECIAL_ERRORS } from '@/types';
	import { leonardo_key } from '$lib/apikeys';
	import { get } from 'svelte/store';
	import { HorstFile } from '@/utils/horstfile';

	export let id: string;

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
		const width = io.getInputData('width') as number;
		const height = io.getInputData('height') as number;
		const presetStyle = io.getInputData('preset_style') as string;
		const isPublic = io.getInputData('is_public') as boolean;
		const numImages = io.getInputData('num_images') as number;
		const guidanceScale = io.getInputData('guidance_scale') as number;
		const seed = io.getInputData('seed') as number;
		const alchemy = io.getInputData('alchemy') as boolean;
		const photoReal = io.getInputData('photo_real') as boolean;
		const photoRealVersion = io.getInputData('photo_real_version') as string;

		const requestBody: any = {
			height,
			width,
			prompt,
			modelId
		};

		// Add optional parameters only if they're set
		if (negativePrompt) requestBody.negative_prompt = negativePrompt;
		if (presetStyle) requestBody.presetStyle = presetStyle;
		if (numImages) requestBody.num_images = numImages;
		if (guidanceScale) requestBody.guidance_scale = guidanceScale;
		if (seed) requestBody.seed = seed;
		if (isPublic !== undefined) requestBody.public = isPublic;
		if (alchemy !== undefined) requestBody.alchemy = alchemy;
		if (photoReal !== undefined) requestBody.photoReal = photoReal;
		if (photoRealVersion) requestBody.photoRealVersion = photoRealVersion;

		const newValue = JSON.stringify({
			prompt,
			negativePrompt,
			modelId,
			width,
			height,
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
			io.setOutputData('image_urls', null);
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
				const imageUrls = await pollForGenerationResult(generationId, apiKey);
				lastOutputValue = await Promise.all(imageUrls.map(HorstFile.fromUrl));
				io.setOutputData('image_urls', lastOutputValue);
				callbacks.setStatus('success');
			} catch (error: any) {
				callbacks.setErrors(['Error calling Leonardo AI', error.message]);
				console.error('Error calling Leonardo AI: ', error);
			}
		} else {
			callbacks.setStatus('idle');
			io.setOutputData('image_urls', null);
			lastOutputValue = null;
		}
	};

	async function pollForGenerationResult(generationId: string, apiKey: string): Promise<string[]> {
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
				return data.generations_by_pk.generated_images.map((image: any) => image.url);
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
				id: 'width',
				type: 'number',
				label: 'Width',
				input: {
					inputOptionType: 'input-field',
					default: 1024
				}
			},
			{
				id: 'height',
				type: 'number',
				label: 'Height',
				input: {
					inputOptionType: 'input-field',
					default: 1024
				}
			},
			{ id: 'negative_prompt', type: 'text', label: 'Negative Prompt', optional: true },
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
			},
			{
				id: 'alchemy',
				type: 'boolean',
				label: 'Alchemy',
				optional: true,
				input: {
					inputOptionType: 'dropdown',
					options: ['true', 'false'],
					default: 'true'
				}
			},
			{
				id: 'photo_real',
				type: 'boolean',
				label: 'Photo Real',
				optional: true,
				input: {
					inputOptionType: 'dropdown',
					options: ['true', 'false'],
					default: 'true'
				}
			},
			{
				id: 'photo_real_version',
				type: 'text',
				label: 'Photo Real Version',
				optional: true,
				input: {
					inputOptionType: 'input-field',
					default: 'v2'
				}
			}
		],
		outputs: [{ id: 'image_urls', type: 'array', label: 'Image URLs' }],
		onExecute: onExecute
	});

	let lastExecutedValue: null | string = null;
	let lastOutputValue: HorstFile[] | null = null;

	function openInNewTab(file: HorstFile) {
		const blob = file.getBlob();
		const url = URL.createObjectURL(blob);
		const newTab = window.open(url);
		if (newTab) {
			newTab.onload = () => URL.revokeObjectURL(url);
		}
	}

	function downloadImage(file: HorstFile) {
		if (!file) {
			return;
		}
		const link = document.createElement('a');
		link.href = file.getDataUrl();
		link.download = 'image.webp';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}
</script>

<CustomNode {io} {onExecute} {...$$props}>
	{#if lastOutputValue && lastOutputValue.length > 0}
		<div class={`grid ${lastOutputValue.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
			{#each lastOutputValue as file, index}
				<div class="relative">
					<img
						src={file.getDataUrl()}
						alt={`Leonardo.AI Result ${index + 1}`}
						class="object-contain w-full h-full"
					/>
					<div class="absolute bottom-0 right-0 flex space-x-1 m-1">
						<button
							class="px-1 py-0.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
							on:click={() => openInNewTab(file)}
						>
							Open
						</button>
						<button
							class="px-1 py-0.5 text-xs bg-green-500 text-white rounded hover:bg-green-6000"
							on:click={() => downloadImage(file)}
						>
							Download
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</CustomNode>
