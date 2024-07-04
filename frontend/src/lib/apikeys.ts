import { writable } from "svelte/store";
import { browser } from "$app/environment";

export const openai_key = writable(browser ? localStorage.getItem('openai_api_key') : '');
export const anthropic_key = writable(browser ? localStorage.getItem('anthropic_api_key') : '');
export const leonardo_key = writable(browser ? localStorage.getItem('leonardo_api_key') : '');


if (typeof window !== 'undefined') {
	const existingOpenaiApiKey = window.localStorage.getItem('openai_api_key');
	if (existingOpenaiApiKey) {
		openai_key.set(existingOpenaiApiKey);
	}
	const existingAnthropicApiKey = window.localStorage.getItem('anthropic_api_key');
	if (existingAnthropicApiKey) {
		anthropic_key.set(existingAnthropicApiKey);
	}
	const existingLeonardoApiKey = window.localStorage.getItem('leonardo_api_key');
	if (existingLeonardoApiKey) {
		leonardo_key.set(existingLeonardoApiKey);
	}
}

openai_key.subscribe((key) => {
	if (browser) {
		if (key && key.length > 0) {
			localStorage.setItem('openai_api_key', key);
		} else {
			localStorage.removeItem('openai_api_key');
		}
	}
});

anthropic_key.subscribe((key) => {
	if (browser) {
		if (key && key.length > 0) {
			localStorage.setItem('anthropic_api_key', key);
		} else {
			localStorage.removeItem('anthropic_api_key');
		}
	}
});

leonardo_key.subscribe((key) => {
	if (browser) {
		if (key && key.length > 0) {
			localStorage.setItem('leonardo_api_key', key);
		} else {
			localStorage.removeItem('leonardo_api_key');
		}
	}
});