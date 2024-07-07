import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export const openai_key = writable('');
export const anthropic_key = writable('');
export const leonardo_key = writable('');
export const groq_key = writable('');

export const apiKeys = [
	{ name: 'openai', key: openai_key },
	{ name: 'anthropic', key: anthropic_key },
	{ name: 'leonardo', key: leonardo_key },
	{ name: 'groq', key: groq_key }
];

if (browser) {
	apiKeys.forEach(({ name, key }) => {
		const storageKey = `${name}_api_key`;
		const existingKey = localStorage.getItem(storageKey);
		if (existingKey) {
			key.set(existingKey);
		}
	});
}

apiKeys.forEach(({ name, key }) => {
	const storageKey = `${name}_api_key`;
	key.subscribe((value) => {
		if (browser) {
			if (value && value.length > 0) {
				localStorage.setItem(storageKey, value);
			} else {
				localStorage.removeItem(storageKey);
			}
		}
	});
});
