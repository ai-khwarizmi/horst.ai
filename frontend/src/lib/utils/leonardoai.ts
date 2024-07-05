import { get } from 'svelte/store';
import { leonardo_key } from '$lib/apikeys';
import { HorstFile } from './horstfile';
import { corsProxyFetch } from './corsproxy';

const BASE_URL = 'https://cloud.leonardo.ai/api/rest/v1';

export interface Controlnet {
	initImageId: string;
	initImageType: 'UPLOADED' | 'GENERATED';
	preprocessorId: string;
	weight: number;
	strengthType: string | null;
}

export interface GenerateImageRequestBody {
	height: number;
	width: number;
	prompt: string;
	modelId: string;
	negative_prompt?: string;
	presetStyle?: string;
	num_images?: number;
	guidance_scale?: number;
	seed?: number;
	public?: boolean;
	alchemy?: boolean;
	photoReal?: boolean;
	photoRealVersion?: string;
	contrastRatio?: number;
	expandedDomain?: boolean;
	fantasyAvatar?: boolean;
	highContrast?: boolean;
	highResolution?: boolean;
	imagePromptWeight?: number;
	initStrength?: number;
	numInferenceSteps?: number;
	photoRealStrength?: number;
	promptMagic?: boolean;
	promptMagicStrength?: number;
	promptMagicVersion?: string;
	scheduler?: string;
	sdVersion?: string;
	tiling?: boolean;
	transparency?: string;
	unzoom?: boolean;
	unzoomAmount?: number;
	upscaleRatio?: number;
	enhancePrompt?: boolean;
	enhancePromptInstruction?: string;
	controlnets?: Controlnet[];
}

export interface GenerateImageResponse {
	sdGenerationJob: {
		generationId: string;
		apiCreditCost?: number;
	};
}

export interface GetModelResponse {
	custom_models_by_pk: {
		createdAt: string | null;
		description: string | null;
		id: string | null;
		instancePrompt: string | null;
		modelHeight: number | null;
		modelWidth: number | null;
		name: string | null;
		public: boolean | null;
		sdVersion: string | null;
		status: string | null;
		type: string | null;
		updatedAt: string | null;
	} | null;
}

export interface UserInfo {
	id: string;
	username: string;
	token_renewal_date: string;
	subscription_tokens: number;
	gpt_tokens: number;
	model_training_tokens: number;
}

const modelCache: { [key: string]: { response: GetModelResponse | null, timestamp: number } } = {};
let lastApiKey: string | null = null;

async function apiCall(endpoint: string, method: string, body?: any, _apiKey?: string): Promise<any> {
	const apiKey = _apiKey || get(leonardo_key) as string;
	const response = await fetch(`${BASE_URL}${endpoint}`, {
		method,
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${apiKey}`
		},
		body: body ? JSON.stringify(body) : undefined
	});

	const responseData = await response.json();

	if (!response.ok) {
		const errorMessage = responseData.error ||
			(responseData.code === 'unexpected' ? responseData.error : null) ||
			`HTTP error! status: ${response.status}`;
		throw new Error(errorMessage);
	}

	return responseData;
}

export async function generateImage(requestBody: GenerateImageRequestBody): Promise<GenerateImageResponse> {
	const response = await apiCall('/generations', 'POST', {
		...requestBody,
	});
	return response as GenerateImageResponse;
}

export async function tryGetModelById(modelId: string): Promise<GetModelResponse | null> {
	const apiKey = get(leonardo_key) as string;

	if (lastApiKey !== apiKey) {
		Object.keys(modelCache).forEach(key => delete modelCache[key]);
		lastApiKey = apiKey;
	}

	const cached = modelCache[modelId];
	const now = Date.now();

	// if we received a valid response previously, we return it
	if (cached && cached.response !== null) {
		return cached.response;
	}

	// if we received null previously, we return null for max 10 seconds
	if (cached && (now - cached.timestamp < 10000)) {
		return cached.response;
	}

	try {
		const response = await apiCall(`/models/${modelId}`, 'GET');
		const modelResponse = response as GetModelResponse;
		modelCache[modelId] = { response: modelResponse, timestamp: now };
		return modelResponse;
	} catch {
		modelCache[modelId] = { response: null, timestamp: now };
		return null;
	}
}

export async function pollForGenerationResult(
	generationId: string,
	maxAttempts: number = 30,
	delayMs: number = 2000
): Promise<string[]> {
	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		const response = await apiCall(`/generations/${generationId}`, 'GET');

		if (response.generations_by_pk.status === 'COMPLETE') {
			return response.generations_by_pk.generated_images.map((image: any) => image.url);
		}

		if (response.generations_by_pk.status === 'FAILED') {
			throw new Error('Generation failed');
		}

		await new Promise((resolve) => setTimeout(resolve, delayMs));
	}

	throw new Error('Generation timed out');
}

const initImageCache: { [hash: string]: string } = {};

export async function uploadInitImage(horstFile: HorstFile): Promise<string> {
	const fileHash = horstFile.getHash();

	if (initImageCache[fileHash]) {
		return initImageCache[fileHash];
	}

	const extension = horstFile.fileName.split('.').pop()?.toLowerCase();
	if (!['png', 'jpg', 'jpeg', 'webp'].includes(extension || '')) {
		throw new Error('Invalid file extension. Must be png, jpg, jpeg, or webp.');
	}

	const presignedData = await apiCall('/init-image', 'POST', { extension });

	const blob = horstFile.getBlob();

	const formData = new FormData();
	const fields = JSON.parse(presignedData.uploadInitImage.fields);

	Object.entries(fields).forEach(([key, value]) => {
		formData.append(key, value as string);
	});

	formData.append('file', blob, horstFile.fileName);

	const uploadResponse = await corsProxyFetch(presignedData.uploadInitImage.url, {
		method: 'POST',
		body: formData,
	});

	if (!uploadResponse.ok) {
		const errorText = await uploadResponse.text();
		console.error('Upload error:', errorText);
		throw new Error(`Failed to upload image to S3: ${uploadResponse.status} ${uploadResponse.statusText}`);
	}

	initImageCache[fileHash] = presignedData.uploadInitImage.id;

	return initImageCache[fileHash];
}

export async function getUserInfo(_apiKey?: string): Promise<UserInfo> {
	const response = await apiCall('/me', 'GET', undefined, _apiKey);
	return response as UserInfo;
}
