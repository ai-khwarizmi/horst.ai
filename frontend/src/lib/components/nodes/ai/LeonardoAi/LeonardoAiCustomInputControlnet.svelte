<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { inputData, inputPlaceholderData } from '@/index';
	import { type Input as InputType, type Output as OutputType } from '@/types';
	import { afterUpdate } from 'svelte';
	import { HorstFile } from '@/utils/horstfile';
	import { Upload, XCircle } from 'lucide-svelte';
	import { nodeIOHandlers } from '@/utils';
	import * as Dialog from '$lib/components/ui/dialog';

	export let base: InputType<string> | OutputType<string>;
	export let nodeId: string;

	$: currentValue = $inputData[nodeId]?.[base.id] as HorstFile[];
	$: currentPlaceholderData = $inputPlaceholderData[nodeId]?.[base.id] as HorstFile[];
	$: currentlyUsingPlaceholderData = !!(currentValue && currentValue === currentPlaceholderData);

	let imageUrl: string;
	let showPopup = false;
	let fileInput: HTMLInputElement;

	afterUpdate(async () => {
		await currentValue?.[0].waitForLoad();
		imageUrl = currentValue?.[0].getDataUrl();
	});

	const handleFileUpload = async (e: Event) => {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			const horstFile = await HorstFile.fromFile(file);
			nodeIOHandlers[nodeId].setInputPlaceholderData(base.id, [horstFile]);
		}
	};
</script>

<div class="flex h-[80px] py-2 w-full pt-2">
	<div class="flex-1 flex items-start justify-start">
		{#if imageUrl && imageUrl !== ''}
			<div class="relative h-full">
				<button class="h-full p-0 border-none bg-transparent" on:click={() => (showPopup = true)}>
					<img src={imageUrl} alt="" class="h-full object-contain object-left" />
				</button>
				{#if currentlyUsingPlaceholderData}
					<button
						class="absolute top-[-10px] left-[-10px] text-red-500 font-bold py-0.5 px-1 text-xs transition-transform hover:scale-110"
						on:click={() => nodeIOHandlers[nodeId].setInputPlaceholderData(base.id, null)}
					>
						<XCircle class="w-4 h-4 bg-white rounded-full" />
					</button>
				{/if}
			</div>
		{:else}
			<Button
				class="w-full h-full flex items-center justify-center bg-purple-500 text-white rounded hover:bg-purple-600"
				on:click={() => fileInput.click()}
			>
				<Upload class="w-5 h-5 mr-2" />
				Upload
			</Button>
			<input
				bind:this={fileInput}
				type="file"
				accept="image/*"
				class="hidden"
				on:change={handleFileUpload}
			/>
		{/if}
	</div>
</div>

<Dialog.Root bind:open={showPopup}>
	<Dialog.Content class="w-full max-w-3xl">
		<div class="max-h-[80vh] overflow-auto flex justify-center">
			<img src={imageUrl} alt="" class="max-w-full max-h-[80vh] object-contain" />
		</div>
		<Dialog.Footer>
			<Button
				on:click={() => (showPopup = false)}
				class="w-full bg-purple-500 text-white hover:bg-purple-600"
			>
				Close
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
