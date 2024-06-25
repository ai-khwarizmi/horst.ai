<script lang="ts" context="module">
	const open = writable(false);
	export const openApiKeySettings = () => open.set(true);
</script>

<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import { anthropic_key, openai_key } from '@/index';
	import Input from '../ui/input/input.svelte';
	import Label from '../ui/label/label.svelte';
	import { writable } from 'svelte/store';
	import Button from '../ui/button/button.svelte';

	let visible = false;
	let visibleAnthropic = false;
</script>

<Sheet.Root bind:open={$open}>
	<Sheet.Content side={'left'}>
		<Sheet.Header>
			<Sheet.Title>API Keys</Sheet.Title>
			<Sheet.Description>
				<p>
					API keys are used to authenticate with external services. <br />
				</p>
			</Sheet.Description>
		</Sheet.Header>
		<div class="flex flex-col gap-2 pt-4">
			<div>
				<Label for="openai_key">OpenAI API Key</Label>
				<div class="flex gap-2 items-center">
					<Input
						type={visible ? 'text' : 'password'}
						bind:value={$openai_key}
						id="openai_key"
						placeholder="OpenAI API Key"
					/>
					<Button on:click={() => (visible = !visible)}>
						{#if visible}
							Hide
						{:else}
							Show
						{/if}
					</Button>
				</div>
				{#if $openai_key && !$openai_key.startsWith('sk-')}
					<p class="text-red-500 text-xs mt-2">
						<strong>Error:</strong> OpenAI API key start with "sk-".
					</p>
				{/if}

				<Label for="anthropic_key">Anthropic API Key</Label>
				<div class="flex gap-2 items-center">
					<Input
						type={visibleAnthropic ? 'text' : 'password'}
						bind:value={$anthropic_key}
						id="anthropic_key"
						placeholder="Anthropic API Key"
					/>
					<Button on:click={() => (visibleAnthropic = !visibleAnthropic)}>
						{#if visibleAnthropic}
							Hide
						{:else}
							Show
						{/if}
					</Button>
				</div>
				{#if $anthropic_key && !$anthropic_key.startsWith('sk-ant-')}
					<p class="text-red-500 text-xs mt-2">
						<strong>Error:</strong> Anthropic API key start with "sk-".
					</p>
				{/if}

				<p class="text-gray-500">
					<small>
						<strong>Note:</strong> We don't store your API keys. They are stored in your browser's local
						storage.
					</small>
				</p>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>
