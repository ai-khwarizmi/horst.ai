import { writable } from "svelte/store";
import { browser } from "$app/environment";

export const openai_key = writable(browser ? localStorage.getItem('openai_api_key') : '');
export const anthropic_key = writable(browser ? localStorage.getItem('anthropic_api_key') : '');

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