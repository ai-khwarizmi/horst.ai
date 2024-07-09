import { get } from 'svelte/store';
import { perplexity_key } from '$lib/apikeys';

const BASE_URL = 'https://api.perplexity.ai/chat/completions';

export interface PerplexityMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

export interface PerplexityRequestBody {
	model: string;
	messages: PerplexityMessage[];
	max_tokens?: number;
	temperature?: number;
	top_p?: number;
	stream: boolean;
}

export interface PerplexityResponse {
	choices: {
		delta: {
			content: string;
		};
		message: {
			content: string;
		};
	}[];
}

async function apiCall(body: PerplexityRequestBody, _apiKey?: string): Promise<Response> {
	const apiKey = _apiKey || (get(perplexity_key) as string);
	return fetch(BASE_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify(body)
	});
}

export async function generatePerplexityResponse(
	requestBody: PerplexityRequestBody
): Promise<Response> {
	return apiCall(requestBody);
}

export async function* streamPerplexityResponse(
	response: Response
): AsyncGenerator<string, void, unknown> {
	const reader = response.body?.getReader();
	const decoder = new TextDecoder();

	while (true) {
		const { done, value } = await reader!.read();
		if (done) break;

		const chunk = decoder.decode(value);
		const lines = chunk.split('\n');
		for (const line of lines) {
			if (line.startsWith('data: ')) {
				const data = JSON.parse(line.slice(6));
				if (data.choices && data.choices[0].delta.content) {
					yield data.choices[0].delta.content;
				}
			}
		}
	}
}
