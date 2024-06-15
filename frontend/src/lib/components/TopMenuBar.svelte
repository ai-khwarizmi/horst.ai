<script lang="ts">
	import * as Menubar from '$lib/components/ui/menubar/index.js';
	import { clearData, loadGraph, resetGraph, saveGraph } from '@/utils';
	import { InfoIcon, Download, File, Upload, Eraser, Share, Share2, FilePlus } from 'lucide-svelte';
	import { open } from './file/ShareGraph.svelte';
</script>

<Menubar.Root>
	<Menubar.Menu>
		<Menubar.Trigger>File</Menubar.Trigger>
		<Menubar.Content>
			<Menubar.Item on:click={resetGraph}>
				<FilePlus class="mr-2 size-3.5" />
				New
			</Menubar.Item>
			<Menubar.Separator />
			<Menubar.Item on:click={loadGraph}>
				<Upload class="mr-2 size-3.5" />
				Open
			</Menubar.Item>
			<Menubar.Item on:click={saveGraph}>
				<Download class="mr-2 size-3.5" />
				Save
			</Menubar.Item>
			<Menubar.Separator />
			<Menubar.Item on:click={() => open.set(true)}>
				<Share2 class="mr-2 size-3.5" />
				Share
			</Menubar.Item>
		</Menubar.Content>
	</Menubar.Menu>
	<Menubar.Menu>
		<Menubar.Trigger>Edit</Menubar.Trigger>
		<Menubar.Content>
			<Menubar.Item on:click={clearData}>
				<Eraser class="mr-2 size-3.5" />
				Clear Data
			</Menubar.Item>
		</Menubar.Content>
	</Menubar.Menu>
	<Menubar.Menu>
		<Menubar.Trigger>Info</Menubar.Trigger>
		<Menubar.Content>
			<Menubar.Item>
				<InfoIcon class="mr-2 size-3.5" />
				About Us
			</Menubar.Item>
			<Menubar.Separator />
			<Menubar.Item disabled inset>Licenses</Menubar.Item>
		</Menubar.Content>
	</Menubar.Menu>
</Menubar.Root>

<div class="bg-white rounded-md border mt-2 p-2 text-xs">
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
