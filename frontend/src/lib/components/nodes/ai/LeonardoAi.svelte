<script lang="ts">
	import CustomNode from '../../CustomNode.svelte';
	import { NodeIOHandler } from '$lib/utils';
	import type { OnExecuteCallbacks } from '$lib/types';
	import { SPECIAL_ERRORS } from '@/types';
	import { leonardo_key } from '$lib/apikeys';
	import { get } from 'svelte/store';
	import { HorstFile } from '@/utils/horstfile';
	import { validate } from 'uuid';
	import { generateImage, pollForGenerationResult, tryGetModelById } from '$lib/utils/leonardoai';
	import { mode } from 'mode-watcher';

	export let id: string;

	const DEFAULT_IMAGE_MODEL = 'aa77f04e-3eec-4034-9c07-d0f619684628'; // Leonardo Kino XL
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

	const INPUT_IDS = {
		PROMPT: 'prompt',
		MODEL_ID: 'model_id',
		WIDTH: 'width',
		HEIGHT: 'height',
		NUM_IMAGES: 'num_images',
		NEGATIVE_PROMPT: 'negative_prompt',
		PRESET_STYLE: 'preset_style',
		GUIDANCE_SCALE: 'guidance_scale',
		SEED: 'seed',
		IS_PUBLIC: 'is_public',
		ALCHEMY: 'alchemy',
		PHOTO_REAL: 'photo_real',
		PHOTO_REAL_VERSION: 'photo_real_version',

		CONTROLNET_STYLE_REFERENCE: 'controlnet_style_reference',
		CONTROLNET_CHARACTER_REFERENCE: 'controlnet_character_reference',
		CONTROLNET_CONTENT_REFERENCE: 'controlnet_content_reference',
		CONTROLNET_EDGE_TO_IMAGE: 'controlnet_edge_to_image',
		CONTROLNET_DEPTH_TO_IMAGE: 'controlnet_depth_to_image',
		CONTROLNET_POSE_TO_IMAGE: 'controlnet_pose_to_image',
		CONTROLNET_TEXT_IMAGE_INPUT: 'controlnet_text_image_input',
		CONTROLNET_SKETCH_TO_IMAGE: 'controlnet_sketch_to_image',
		CONTROLNET_NORMAL_MAP: 'controlnet_normal_map',
		CONTROLNET_LINE_ART: 'controlnet_line_art',
		CONTROLNET_PATTERN_TO_IMAGE: 'controlnet_pattern_to_image',
		CONTROLNET_QR_CODE_TO_IMAGE: 'controlnet_qr_code_to_image'
	};

	const CONTROLNET_MATRIX = {
		[INPUT_IDS.CONTROLNET_STYLE_REFERENCE]: { SD1_5: null, SD2_1: null, SDXL: 67 },
		[INPUT_IDS.CONTROLNET_CHARACTER_REFERENCE]: { SD1_5: null, SD2_1: null, SDXL: 133 },
		[INPUT_IDS.CONTROLNET_CONTENT_REFERENCE]: { SD1_5: null, SD2_1: null, SDXL: 100 },
		[INPUT_IDS.CONTROLNET_EDGE_TO_IMAGE]: { SD1_5: 1, SD2_1: 12, SDXL: 19 },
		[INPUT_IDS.CONTROLNET_DEPTH_TO_IMAGE]: { SD1_5: 3, SD2_1: 13, SDXL: 20 },
		[INPUT_IDS.CONTROLNET_POSE_TO_IMAGE]: { SD1_5: 7, SD2_1: 16, SDXL: 21 },
		[INPUT_IDS.CONTROLNET_TEXT_IMAGE_INPUT]: { SD1_5: 11, SD2_1: 18, SDXL: 22 },
		[INPUT_IDS.CONTROLNET_SKETCH_TO_IMAGE]: { SD1_5: 10, SD2_1: 17, SDXL: null },
		[INPUT_IDS.CONTROLNET_NORMAL_MAP]: { SD1_5: 6, SD2_1: 15, SDXL: null },
		[INPUT_IDS.CONTROLNET_LINE_ART]: { SD1_5: 5, SD2_1: null, SDXL: null },
		[INPUT_IDS.CONTROLNET_PATTERN_TO_IMAGE]: { SD1_5: 8, SD2_1: null, SDXL: null },
		[INPUT_IDS.CONTROLNET_QR_CODE_TO_IMAGE]: { SD1_5: 9, SD2_1: null, SDXL: null }
	};

	const MODEL_VERSION_MAP: any = {
		SD1_5: 'SD1_5',
		SD2_1: 'SD2_1',
		SDXL: 'SDXL',
		v1_5: 'SD1_5',
		v2: 'SD2_1',
		v2_1: 'SD2_1'
	};

	const onExecute = async (callbacks: OnExecuteCallbacks, forceExecute: boolean) => {
		const apiKey = get(leonardo_key) as string;

		const prompt = io.getInputData(INPUT_IDS.PROMPT) as string;
		const negativePrompt = io.getInputData(INPUT_IDS.NEGATIVE_PROMPT) as string;
		const modelId = io.getInputData(INPUT_IDS.MODEL_ID) as string;
		const width = io.getInputData(INPUT_IDS.WIDTH) as number;
		const height = io.getInputData(INPUT_IDS.HEIGHT) as number;
		const presetStyle = io.getInputData(INPUT_IDS.PRESET_STYLE) as string;
		const isPublic = io.getInputData(INPUT_IDS.IS_PUBLIC) as boolean;
		const numImages = io.getInputData(INPUT_IDS.NUM_IMAGES) as number;
		const guidanceScale = io.getInputData(INPUT_IDS.GUIDANCE_SCALE) as number;
		const seed = io.getInputData(INPUT_IDS.SEED) as number;
		const alchemy = io.getInputData(INPUT_IDS.ALCHEMY) as boolean;
		const photoReal = io.getInputData(INPUT_IDS.PHOTO_REAL) as boolean;
		const photoRealVersion = io.getInputData(INPUT_IDS.PHOTO_REAL_VERSION) as string;

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
				const response = await generateImage(requestBody);

				const generationId = response.sdGenerationJob.generationId;

				// Poll for the generation result
				const imageUrls = await pollForGenerationResult(generationId);
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

	const isInputUnsupported = async (
		inputId: string,
		currentInputData: Record<string, any>
	): Promise<{
		unsupported: boolean;
		message?: string;
	}> => {
		/*
		leonardo supports different controlnets
		the matrix of what is supported: can be found here: https://docs.leonardo.ai/docs/generate-images-using-image-to-image-guidance
		*/
		let modelId = currentInputData[INPUT_IDS.MODEL_ID];
		if (!modelId || !validate(modelId)) {
			return {
				unsupported: false
			};
		}

		let model = await tryGetModelById(currentInputData[INPUT_IDS.MODEL_ID]);
		if (!model || !model.custom_models_by_pk) {
			return {
				unsupported: false
			};
		}

		if (CONTROLNET_MATRIX[inputId]) {
			let modelType = model.custom_models_by_pk.sdVersion;
			if (!modelType) {
				return {
					unsupported: false
				};
			}
			if (modelType.startsWith('SDXL_')) {
				modelType = 'SDXL';
			}
			const modelTypeMapped = MODEL_VERSION_MAP[modelType];
			const preprocessorId = (CONTROLNET_MATRIX as any)[inputId][modelTypeMapped];
			if (!preprocessorId) {
				console.log('unsupported model type', inputId, modelType, modelTypeMapped, preprocessorId);
				return {
					unsupported: true,
					message: 'Not supported by this model: ' + model.custom_models_by_pk.name
				};
			} else {
				console.log('supported model type', inputId, modelType, modelTypeMapped, preprocessorId);
			}
		}

		return {
			unsupported: false
		};
	};

	const io = new NodeIOHandler({
		nodeId: id,
		inputs: [
			{ id: INPUT_IDS.PROMPT, type: 'text', label: 'Prompt' },
			{
				id: INPUT_IDS.MODEL_ID,
				type: 'text',
				label: 'Model ID',
				input: {
					inputOptionType: 'input-field',
					default: DEFAULT_IMAGE_MODEL
				}
			},
			{
				id: INPUT_IDS.WIDTH,
				type: 'number',
				label: 'Width',
				input: {
					inputOptionType: 'input-field',
					default: 512
				}
			},
			{
				id: INPUT_IDS.HEIGHT,
				type: 'number',
				label: 'Height',
				input: {
					inputOptionType: 'input-field',
					default: 512
				}
			},
			{
				id: INPUT_IDS.NUM_IMAGES,
				type: 'number',
				label: 'Number of Images',
				input: {
					inputOptionType: 'input-field',
					default: 1
				}
			},
			{
				id: INPUT_IDS.NEGATIVE_PROMPT,
				type: 'text',
				label: 'Negative Prompt',
				input: {
					inputOptionType: 'input-field',
					default: ''
				},
				optional: true
			},
			{
				id: INPUT_IDS.PRESET_STYLE,
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
				id: INPUT_IDS.GUIDANCE_SCALE,
				type: 'number',
				label: 'Guidance Scale',
				optional: true,
				input: {
					inputOptionType: 'input-field',
					default: 7
				}
			},
			{
				id: INPUT_IDS.SEED,
				type: 'number',
				label: 'Seed',
				optional: true,
				input: {
					inputOptionType: 'input-field',
					default: undefined
				}
			},
			{
				id: INPUT_IDS.IS_PUBLIC,
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
				id: INPUT_IDS.ALCHEMY,
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
				id: INPUT_IDS.PHOTO_REAL,
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
				id: INPUT_IDS.PHOTO_REAL_VERSION,
				type: 'text',
				label: 'Photo Real Version',
				optional: true,
				input: {
					inputOptionType: 'input-field',
					default: 'v2'
				}
			},
			{
				id: INPUT_IDS.CONTROLNET_STYLE_REFERENCE,
				type: 'file',
				label: 'Style Reference (Image)',
				optional: true
			},
			{
				id: INPUT_IDS.CONTROLNET_CHARACTER_REFERENCE,
				type: 'file',
				label: 'Character Reference (Image)',
				optional: true
			},
			{
				id: INPUT_IDS.CONTROLNET_CONTENT_REFERENCE,
				type: 'file',
				label: 'Content Reference (Image)',
				optional: true
			},
			{
				id: INPUT_IDS.CONTROLNET_EDGE_TO_IMAGE,
				type: 'file',
				label: 'Edge to Image (Image)',
				optional: true
			},
			{
				id: INPUT_IDS.CONTROLNET_DEPTH_TO_IMAGE,
				type: 'file',
				label: 'Depth to Image (Image)',
				optional: true
			},
			{
				id: INPUT_IDS.CONTROLNET_POSE_TO_IMAGE,
				type: 'file',
				label: 'Pose to Image (Image)',
				optional: true
			},
			{
				id: INPUT_IDS.CONTROLNET_TEXT_IMAGE_INPUT,
				type: 'file',
				label: 'Text to Image (Image)',
				optional: true
			},
			{
				id: INPUT_IDS.CONTROLNET_SKETCH_TO_IMAGE,
				type: 'file',
				label: 'Sketch to Image (Image)',
				optional: true
			},
			{
				id: INPUT_IDS.CONTROLNET_NORMAL_MAP,
				type: 'file',
				label: 'Normal Map (Image)',
				optional: true
			},
			{
				id: INPUT_IDS.CONTROLNET_LINE_ART,
				type: 'file',
				label: 'Line Art (Image)',
				optional: true
			},
			{
				id: INPUT_IDS.CONTROLNET_PATTERN_TO_IMAGE,
				type: 'file',
				label: 'Pattern to Image (Image)',
				optional: true
			},
			{
				id: INPUT_IDS.CONTROLNET_QR_CODE_TO_IMAGE,
				type: 'file',
				label: 'QR Code to Image (Image)',
				optional: true
			}
		],
		outputs: [{ id: 'image_urls', type: 'array', label: 'Image URLs' }],
		onExecute: onExecute,
		isInputUnsupported: isInputUnsupported
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
