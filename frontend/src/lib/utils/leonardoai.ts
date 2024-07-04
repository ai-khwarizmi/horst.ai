import { get } from 'svelte/store';
import { leonardo_key } from '$lib/apikeys';

const BASE_URL = 'https://cloud.leonardo.ai/api/rest/v1';

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

const modelCache: { [key: string]: { response: GetModelResponse | null, timestamp: number } } = {};
let lastApiKey: string | null = null;

async function apiCall(endpoint: string, method: string, body?: any): Promise<any> {
	const apiKey = get(leonardo_key) as string;
	const response = await fetch(`${BASE_URL}${endpoint}`, {
		method,
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${apiKey}`
		},
		body: body ? JSON.stringify(body) : undefined
	});

	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message}`);
	}

	return await response.json();
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
