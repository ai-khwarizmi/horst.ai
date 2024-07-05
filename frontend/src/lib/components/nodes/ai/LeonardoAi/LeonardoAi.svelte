<script lang="ts">
	import CustomNode from '../../../CustomNode.svelte';
	import { NodeIOHandler } from '$lib/utils';
	import type { OnExecuteCallbacks } from '$lib/types';
	import { SPECIAL_ERRORS } from '@/types';
	import { leonardo_key } from '$lib/apikeys';
	import { get } from 'svelte/store';
	import { HorstFile } from '@/utils/horstfile';
	import { validate } from 'uuid';
	import {
		generateImage,
		pollForGenerationResult,
		tryGetModelById,
		uploadInitImage,
		type Controlnet
	} from '$lib/utils/leonardoai';
	import { inputData, optionalInputsEnabled } from '@/index';
	import { sha256 } from 'js-sha256';
	import LeonardoAiCustomInputControlnet from './LeonardoAiCustomInputControlnet.svelte';

	export let id: string;

	const DEFAULT_IMAGE_MODEL = 'aa77f04e-3eec-4034-9c07-d0f619684628'; // Leonardo Kino XL

	const INPUT_IDS_REQUIRED = {
		PROMPT: 'prompt',
		MODEL_ID: 'modelId',
		WIDTH: 'width',
		HEIGHT: 'height',
		NUM_IMAGES: 'num_images'
	};

	const INPUT_IDS_OPTIONAL = {
		NEGATIVE_PROMPT: 'negative_prompt',
		PRESET_STYLE: 'presetStyle',
		GUIDANCE_SCALE: 'guidance_scale',
		SEED: 'seed',
		IS_PUBLIC: 'public',
		ALCHEMY: 'alchemy',
		PHOTO_REAL: 'photoReal',
		PHOTO_REAL_VERSION: 'photoRealVersion',
		CONTRAST_RATIO: 'contrastRatio',
		EXPANDED_DOMAIN: 'expandedDomain',
		FANTASY_AVATAR: 'fantasyAvatar',
		HIGH_CONTRAST: 'highContrast',
		HIGH_RESOLUTION: 'highResolution',
		IMAGE_PROMPT_WEIGHT: 'imagePromptWeight',
		INIT_STRENGTH: 'init_strength',
		NUM_INFERENCE_STEPS: 'num_inference_steps',
		PHOTO_REAL_STRENGTH: 'photoRealStrength',
		PROMPT_MAGIC: 'promptMagic',
		PROMPT_MAGIC_STRENGTH: 'promptMagicStrength',
		PROMPT_MAGIC_VERSION: 'promptMagicVersion',
		SCHEDULER: 'scheduler',
		SD_VERSION: 'sd_version',
		TILING: 'tiling',
		TRANSPARENCY: 'transparency',
		UNZOOM: 'unzoom',
		UNZOOM_AMOUNT: 'unzoomAmount',
		UPSCALE_RATIO: 'upscaleRatio',
		ENHANCE_PROMPT: 'enhancePrompt',
		ENHANCE_PROMPT_INSTRUCTION: 'enhancePromptInstruction'
	};

	const INPUT_IDS_CONTROLNET = {
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

	const INPUT_IDS = {
		...INPUT_IDS_REQUIRED,
		...INPUT_IDS_OPTIONAL,
		...INPUT_IDS_CONTROLNET
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

	const getModelVersionFromModelId = async (modelId: string) => {
		const model = await tryGetModelById(modelId);
		if (!model || !model.custom_models_by_pk) {
			throw new Error('Model not found');
		}
		let modelVersion = model.custom_models_by_pk.sdVersion;
		if (!modelVersion) {
			throw new Error(`Model version not found for ${modelId}`);
		}
		if (modelVersion.startsWith('SDXL_')) {
			modelVersion = 'SDXL';
		}
		return MODEL_VERSION_MAP[modelVersion];
	};

	const prepareControlnets = async (modelId: string): Promise<Controlnet[] | false> => {
		const currentInputs = get(inputData)[id];
		const _optionalInputsEnabled = get(optionalInputsEnabled)[id];
		if (!_optionalInputsEnabled) return [];

		const expectedControlnets = Object.keys(CONTROLNET_MATRIX).reduce((count, inputId) => {
			return _optionalInputsEnabled[inputId] ? count + 1 : count;
		}, 0);

		let availableControlnets = Object.entries(CONTROLNET_MATRIX)
			.filter(([inputId, value]) => value !== null && currentInputs[inputId])
			.map(([inputId]) => ({
				inputId,
				value: currentInputs[inputId]
			}));

		//for now we only support 1 file per controlnet
		for (const controlnet of availableControlnets) {
			if (Array.isArray(controlnet.value) && controlnet.value.length > 1) {
				throw new Error(
					'Only 1 file per controlnet is supported for: [' +
						controlnet.inputId +
						'] Received: ' +
						controlnet.value.length
				);
			}
			if (Array.isArray(controlnet.value)) {
				controlnet.value = controlnet.value[0];
			}
		}
		availableControlnets = availableControlnets.filter((controlnet) => !!controlnet.value);

		const modelTypeMapped = await getModelVersionFromModelId(modelId);
		const controlnets = availableControlnets.map((controlnet) => ({
			initImageId: controlnet.value,
			initImageType: 'UPLOADED' as const,
			preprocessorId: (CONTROLNET_MATRIX as any)[controlnet.inputId]?.[modelTypeMapped],
			weight: 1,
			strengthType: null
		}));

		for (const controlnet of controlnets) {
			if (!controlnet.preprocessorId) {
				throw new Error(`Invalid controlnet: ${controlnet.initImageId}`);
			}
		}

		if (controlnets.length !== expectedControlnets) {
			return false;
		}

		return controlnets;
	};

	const uploadControlnetImages = async (
		controlnets: (Controlnet & { initImageId: HorstFile })[]
	): Promise<Controlnet[]> => {
		return Promise.all(
			controlnets.map(async (controlnet) => ({
				...controlnet,
				initImageId: await uploadInitImage(controlnet.initImageId)
			}))
		);
	};

	const onExecute = async (
		callbacks: OnExecuteCallbacks,
		forceExecute: boolean,
		wrap: <T>(promise: Promise<T>) => Promise<T>
	) => {
		const apiKey = get(leonardo_key) as string;
		const currentInputs = get(inputData)[id];

		const requestBody: any = {
			[INPUT_IDS.PROMPT]: currentInputs[INPUT_IDS.PROMPT],
			[INPUT_IDS.MODEL_ID]: currentInputs[INPUT_IDS.MODEL_ID],
			[INPUT_IDS.WIDTH]: currentInputs[INPUT_IDS.WIDTH],
			[INPUT_IDS.HEIGHT]: currentInputs[INPUT_IDS.HEIGHT],
			[INPUT_IDS.NUM_IMAGES]: currentInputs[INPUT_IDS.NUM_IMAGES]
		};

		Object.entries(INPUT_IDS_OPTIONAL).forEach(([_key, inputId]) => {
			const value = currentInputs[inputId];
			if (value !== undefined) {
				requestBody[inputId] = value;
			}
		});

		try {
			const controlnets = await wrap(prepareControlnets(requestBody[INPUT_IDS.MODEL_ID]));
			if (!controlnets) {
				callbacks.setStatus('idle');
				io.setOutputData('image_urls', null);
				lastOutputValue = null;
				return;
			}
			const hash = sha256(JSON.stringify(controlnets));
			console.log('controlnets', controlnets, hash);
			const newValue = JSON.stringify({
				...requestBody,
				apiKey,
				controlnets
			});

			if (requestBody[INPUT_IDS.PROMPT]) {
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

					const uploadedControlnets = await wrap(uploadControlnetImages(controlnets));
					if (uploadedControlnets.length > 0) {
						requestBody.controlnets = uploadedControlnets;
					}

					const response = await wrap(generateImage(requestBody));
					const generationId = response.sdGenerationJob.generationId;

					const imageUrls = await wrap(pollForGenerationResult(generationId));

					const values = await wrap(Promise.all(imageUrls.map(HorstFile.fromUrl)));
					lastOutputValue = values;
					io.setOutputData('image_urls', lastOutputValue);
					callbacks.setStatus('success');
				} catch (error: any) {
					if (error.name === 'AbortError') {
						console.log('Execution was cancelled');
						callbacks.setStatus('idle');
						return;
					}
					callbacks.setErrors(['Error calling Leonardo AI', error.message]);
					console.error('Error calling Leonardo AI: ', error);
				}
			} else {
				callbacks.setStatus('idle');
				io.setOutputData('image_urls', null);
				lastOutputValue = null;
			}
		} catch (error: any) {
			callbacks.setErrors(['Error calling Leonardo AI', error.message || 'Unknown error']);
			console.error('Error calling Leonardo AI: ', error);
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
				return {
					unsupported: true,
					message: 'Not supported by this model: ' + model.custom_models_by_pk.name
				};
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
					inputOptionType: 'input-field',
					default: ''
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
				optional: true,
				input: {
					inputOptionType: 'custom',
					component: LeonardoAiCustomInputControlnet,
					data: {}
				}
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
			},
			{
				id: INPUT_IDS.CONTRAST_RATIO,
				type: 'number',
				label: 'Contrast Ratio',
				optional: true,
				input: {
					inputOptionType: 'input-field',
					default: ''
				}
			},
			{
				id: INPUT_IDS.EXPANDED_DOMAIN,
				type: 'boolean',
				label: 'Expanded Domain',
				optional: true,
				input: {
					inputOptionType: 'input-field',
					default: ''
				}
			},
			{
				id: INPUT_IDS.FANTASY_AVATAR,
				type: 'boolean',
				label: 'Fantasy Avatar',
				optional: true,
				input: {
					inputOptionType: 'input-field',
					default: ''
				}
			},
			{
				id: INPUT_IDS.HIGH_CONTRAST,
				type: 'boolean',
				label: 'High Contrast',
				optional: true,
				input: {
					inputOptionType: 'input-field',
					default: ''
				}
			},
			{
				id: INPUT_IDS.HIGH_RESOLUTION,
				type: 'boolean',
				label: 'High Resolution',
				optional: true,
				input: {
					inputOptionType: 'input-field',
					default: ''
				}
			},
			{
				id: INPUT_IDS.IMAGE_PROMPT_WEIGHT,
				type: 'number',
				label: 'Image Prompt Weight',
				optional: true,
				input: {
					inputOptionType: 'input-field',
					default: ''
				}
			},
			{
				id: INPUT_IDS.INIT_STRENGTH,
				type: 'number',
				label: 'Init Strength',
				optional: true,
				input: {
					inputOptionType: 'input-field',
					default: ''
				}
			},
			{
				id: INPUT_IDS.NUM_INFERENCE_STEPS,
				type: 'number',
				label: 'Number of Inference Steps',
				optional: true,
				input: {
					inputOptionType: 'input-field',
					default: ''
				}
			},
			{
				id: INPUT_IDS.PHOTO_REAL_STRENGTH,
				type: 'number',
				label: 'PhotoReal Strength',
				optional: true,
				input: {
					inputOptionType: 'input-field',
					default: ''
				}
			},
			{
				id: INPUT_IDS.PROMPT_MAGIC,
				type: 'boolean',
				label: 'Prompt Magic',
				optional: true,
				input: {
					inputOptionType: 'input-field',
					default: ''
				}
			},
			{
				id: INPUT_IDS.PROMPT_MAGIC_STRENGTH,
				type: 'number',
				label: 'Prompt Magic Strength',
				optional: true,
				input: {
					inputOptionType: 'input-field',
					default: ''
				}
			},
			{
				id: INPUT_IDS.PROMPT_MAGIC_VERSION,
				type: 'text',
				label: 'Prompt Magic Version',
				optional: true,
				input: {
					inputOptionType: 'input-field',
					default: ''
				}
			},
			{
				id: INPUT_IDS.SCHEDULER,
				type: 'text',
				label: 'Scheduler',
				optional: true,
				input: {
					inputOptionType: 'input-field',
					default: ''
				}
			},
			{
				id: INPUT_IDS.SD_VERSION,
				type: 'text',
				label: 'SD Version',
				optional: true,
				input: {
					inputOptionType: 'input-field',
					default: ''
				}
			},
			{
				id: INPUT_IDS.TILING,
				type: 'boolean',
				label: 'Tiling',
				optional: true,
				input: {
					inputOptionType: 'input-field',
					default: ''
				}
			},
			{
				id: INPUT_IDS.TRANSPARENCY,
				type: 'text',
				label: 'Transparency',
				optional: true,
				input: {
					inputOptionType: 'input-field',
					default: ''
				}
			},
			{
				id: INPUT_IDS.UNZOOM,
				type: 'boolean',
				label: 'Unzoom',
				optional: true,
				input: {
					inputOptionType: 'input-field',
					default: ''
				}
			},
			{
				id: INPUT_IDS.UNZOOM_AMOUNT,
				type: 'number',
				label: 'Unzoom Amount',
				optional: true,
				input: {
					inputOptionType: 'input-field',
					default: ''
				}
			},
			{
				id: INPUT_IDS.UPSCALE_RATIO,
				type: 'number',
				label: 'Upscale Ratio',
				optional: true,
				input: {
					inputOptionType: 'input-field',
					default: ''
				}
			},
			{
				id: INPUT_IDS.ENHANCE_PROMPT,
				type: 'boolean',
				label: 'Enhance Prompt',
				optional: true,
				input: {
					inputOptionType: 'input-field',
					default: ''
				}
			},
			{
				id: INPUT_IDS.ENHANCE_PROMPT_INSTRUCTION,
				type: 'text',
				label: 'Enhance Prompt Instruction',
				optional: true,
				input: {
					inputOptionType: 'input-field',
					default: ''
				}
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
