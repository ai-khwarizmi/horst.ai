<script lang="ts">
	import Input from '../ui/input/input.svelte';
	import Label from '../ui/label/label.svelte';
	import Button from '../ui/button/button.svelte';
	import { Loader2, Eye, EyeOff } from 'lucide-svelte';
	import { fade } from 'svelte/transition';

	export let label: string;
	export let id: string;
	export let placeholder: string;
	export let value: string;
	export let errorMessage: string;
	export let validateKey: (key: string) => Promise<boolean>;

	let tempValue = value;

	let isValid = true;
	let isValidating = false;
	let showSuccessMessage = false;

	let showPassword = false;

	async function handleSave() {
		if (!tempValue) {
			isValid = true;
			return;
		}

		isValidating = true;
		showSuccessMessage = false;
		try {
			isValid = await validateKey(tempValue);
			if (isValid) {
				value = tempValue;
				console.log('Key saved successfully');
				showSuccessMessage = true;
				setTimeout(() => {
					showSuccessMessage = false;
				}, 100);
			}
		} catch (error) {
			value = '';
			console.error('Validation error:', error);
			isValid = false;
			showSuccessMessage = false;
		}
		isValidating = false;
	}
</script>

<Label for={id}>{label}</Label>
<div class="flex gap-2 items-center">
	<div class="relative flex-grow">
		<Input
			type={showPassword ? 'text' : 'password'}
			bind:value={tempValue}
			{id}
			{placeholder}
			class="pr-10"
		/>
		<button
			type="button"
			class="absolute inset-y-0 right-0 px-3 flex items-center"
			on:click={() => (showPassword = !showPassword)}
		>
			{#if showPassword}
				<EyeOff class="h-5 w-5 text-gray-400" />
			{:else}
				<Eye class="h-5 w-5 text-gray-400" />
			{/if}
		</button>
	</div>
	<Button on:click={handleSave} disabled={isValidating} class="w-24">
		{#if isValidating}
			<Loader2 class="animate-spin mr-2 inline" size={16} />
			<span>Saving</span>
		{:else}
			<span>Save</span>
		{/if}
	</Button>
</div>
<div class="h-6 mt-2">
	{#if isValidating}
		<p class="text-yellow-500 text-xs flex items-center">Validating...</p>
	{:else if !isValid}
		<p class="text-red-500 text-xs">
			<strong>Error:</strong>
			{errorMessage}
		</p>
	{:else if showSuccessMessage}
		<p class="text-green-500 text-xs" in:fade={{ duration: 1 }} out:fade={{ duration: 2000 }}>
			API key saved successfully!
		</p>
	{/if}
</div>
