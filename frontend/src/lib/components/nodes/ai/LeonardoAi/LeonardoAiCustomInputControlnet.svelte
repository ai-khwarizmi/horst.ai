<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { inputData } from '@/index';
	import { Input } from '@/components/ui/input';
	import { type Input as InputType, type Output as OutputType } from '@/types';
	import { afterUpdate } from 'svelte';
	import type { HorstFile } from '@/utils/horstfile';

	export let base: InputType<string> | OutputType<string>;
	export let nodeId: string;

	$: currentValue = $inputData[nodeId]?.[base.id] as HorstFile[];

	let imageUrl: string;

	afterUpdate(async () => {
		await currentValue?.[0].waitForLoad();
		imageUrl = currentValue?.[0].getDataUrl();
	});

	let showPopup = false;

	const showImagePopup = () => {
		showPopup = true;
	};

	const closeImagePopup = () => {
		showPopup = false;
	};
</script>

<div class="flex space-x-4 bg-gray-100 p-2">
	<div class="flex-1">
		<button id="image" class="mr-2 p-0 border-none bg-transparent" on:click={showImagePopup}>
			<img src={imageUrl} alt="" width="96" height="96" />
		</button>
	</div>

	<div class="flex-1 flex flex-col justify-center">
		<label class="text-xs text-muted-foreground mb-1 text-center" for="weight">Weight</label>
		<Input
			id="weight"
			type="number"
			class="w-full p-1 text-sm border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring focus:ring-opacity-20 h-[24px] text-center"
		/>
	</div>
</div>

{#if showPopup}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white p-4 rounded-lg max-w-3xl max-h-[90vh] overflow-auto">
			<img src={imageUrl} alt="" class="max-w-full max-h-[80vh] object-contain" />
			<Button on:click={closeImagePopup} class="mt-4 w-full">Close</Button>
		</div>
	</div>
{/if}
