export type ApiKeys = {
	openai: string | null
}

export function getApiKeys(): ApiKeys {
	return {
		openai: window.localStorage.getItem('openai-api-key')
	}
}

