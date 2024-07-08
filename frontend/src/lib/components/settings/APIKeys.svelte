<script lang="ts" context="module">
	const open = writable(false);
	export const openApiKeySettings = () => open.set(true);
</script>

<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import { anthropic_key, openai_key, leonardo_key, groq_key } from '$lib/apikeys';
	import { writable } from 'svelte/store';
	import APIKeySetter from './APIKeySetter.svelte';
	import { getUserInfo } from '$lib/utils/leonardoai';
	import OpenAI from 'openai';
	import Anthropic from '@anthropic-ai/sdk';
	import { Groq } from 'groq-sdk';
	import { ANTHROPIC_PROXY_BASE_URL } from '@/config';
	import { perplexity_key } from '$lib/apikeys';

	async function validateOpenAI(key: string) {
		const openai = new OpenAI({ apiKey: key, dangerouslyAllowBrowser: true });
		await openai.models.list();
		return true;
	}

	async function validateAnthropic(key: string) {
		const anthropic = new Anthropic({ apiKey: key, baseURL: ANTHROPIC_PROXY_BASE_URL });
		await anthropic.messages.create({
			max_tokens: 1,
			messages: [{ role: 'user', content: 'Hello' }],
			model: 'claude-3-5-sonnet-20240620'
		});
		return true;
	}

	async function validateLeonardo(key: string) {
		await getUserInfo(key);
		return true;
	}

	async function validateGroq(key: string) {
		const groq = new Groq({ apiKey: key, dangerouslyAllowBrowser: true });
		await groq.chat.completions.create({
			model: 'llama3-8b-8192',
			max_tokens: 1,
			messages: [{ role: 'user', content: 'Hello' }]
		});
		return true;
	}


	async function validatePerplexity(key: string) {
		const response = await fetch('https://api.perplexity.ai/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${key}`
			},
			body: JSON.stringify({
				model: 'mistral-7b-instruct',
				messages: [{ role: 'user', content: 'Hello' }],
				max_tokens: 1
			})
		});

		if (!response.ok) {
			throw new Error('Invalid Perplexity API key');
		}

		return true;
	}


</script>

<Sheet.Root bind:open={$open}>
	<Sheet.Content side={'left'}>
		<Sheet.Header>
			<Sheet.Title>API Keys</Sheet.Title>
			<Sheet.Description>
				<p>API keys are used to authenticate with external services.</p>
			</Sheet.Description>
		</Sheet.Header>
		<div class="flex flex-col gap-2 pt-4">
			<div>
				<APIKeySetter
					label="OpenAI API Key"
					id="openai_key"
					placeholder="OpenAI API Key"
					bind:value={$openai_key}
					errorMessage="Invalid OpenAI API key."
					validateKey={validateOpenAI}
				/>

				<APIKeySetter
					label="Anthropic API Key"
					id="anthropic_key"
					placeholder="Anthropic API Key"
					bind:value={$anthropic_key}
					errorMessage="Invalid Anthropic API key."
					validateKey={validateAnthropic}
				/>

				<APIKeySetter
					label="Leonardo API Key"
					id="leonardo_key"
					placeholder="Leonardo API Key"
					bind:value={$leonardo_key}
					errorMessage="Invalid Leonardo API key."
					validateKey={validateLeonardo}
				/>

				<APIKeySetter
					label="Groq API Key"
					id="groq_key"
					placeholder="Groq API Key"
					bind:value={$groq_key}
					errorMessage="Invalid Groq API key."
					validateKey={validateGroq}
				/>

				<APIKeySetter
					label="Perplexity API Key"
					id="perplexity_key"
					placeholder="Perplexity API Key"
					bind:value={$perplexity_key}
					errorMessage="Invalid Perplexity API key."
					validateKey={validatePerplexity}
				/>

				<p class="text-gray-500 text-sm mt-2">
					We do not store your API keys on our servers. They are only stored in your browser's local
					storage.
				</p>
				<p class="text-gray-500 text-sm mt-2">
					Please note that some services do not support CORS, so we use a proxy to bypass this.
				</p>
				<p class="text-gray-500 text-sm mt-2">
					You can find the code on our
					<a
						class="text-primary hover:underline"
						href="https://github.com/ai-khwarizmi/horst.ai/tree/main/cors-proxy"
						target="_blank">Github</a
					> if you want to deploy your own.
				</p>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>
