<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { loadGraph, resetGraph, saveGraph } from '@/utils';
	import { Download, Upload, FilePlus, Share2, Key } from 'lucide-svelte';
	import { openShareGraphModal } from './file/ShareGraph.svelte';
	import { openApiKeySettings } from './settings/APIKeys.svelte';
	import Button from './ui/button/button.svelte';

	let newFileOpen = false;
</script>

<div class="flex items-center gap-2">
	<Dialog.Root bind:open={newFileOpen}>
		<Dialog.Trigger>
			<Button size="sm">
				<FilePlus class="mr-2 size-3.5" />
				New
			</Button>
		</Dialog.Trigger>
		<Dialog.Content>
			<Dialog.Header>New Graph</Dialog.Header>
			<Dialog.Content>
				<Dialog.Header>
					<Dialog.Title>New Graph</Dialog.Title>
					<Dialog.Description>
						Are you sure you want to create a new graph? This will clear all the data.
					</Dialog.Description>
				</Dialog.Header>
				<Dialog.Footer>
					<Button
						variant="default"
						on:click={() => {
							resetGraph();
							newFileOpen = false;
						}}>Yes, create new graph</Button
					>
					<Button variant="secondary" on:click={() => (newFileOpen = false)}>Cancel</Button>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Content>
	</Dialog.Root>
	<Button variant="secondary" size="sm" on:click={loadGraph}>
		<Upload class="mr-2 size-3.5" />
		Load
	</Button>
	<Button variant="secondary" size="sm" on:click={saveGraph}>
		<Download class="mr-2 size-3.5" />
		Save
	</Button>
	<Button variant="secondary" size="sm" on:click={openShareGraphModal}>
		<Share2 class="mr-2 size-3.5" />
		Share
	</Button>
	<div class="w-4 h-[1px] bg-gray-500"></div>
	<Button variant="outline" size="sm" class="ml-auto" on:click={openApiKeySettings}>
		<Key class="mr-2 size-3.5" />
		Set OpenAI Key
	</Button>
</div>

<div class="bg-white rounded-md border mt-2 p-2 text-xs w-40">
	<div class="font-bold text-center text-sm">Legend</div>
	<div class="flex flex-col gap-2 p-2">
		<div class="flex items-center gap-1">
			<div class="w-2 h-2 bg-blue-500 rounded-full"></div>
			<div>Input</div>
		</div>
		<div class="flex items-center gap-1">
			<div class="w-2 h-2 bg-green-500 rounded-full"></div>
			<div>Viewer</div>
		</div>
		<div class="flex items-center gap-1">
			<div class="w-2 h-2 bg-yellow-500 rounded-full"></div>
			<div>Transform</div>
		</div>
		<div class="flex items-center gap-1">
			<div class="w-2 h-2 bg-purple-500 rounded-full"></div>
			<div>Function</div>
		</div>
	</div>
</div>
