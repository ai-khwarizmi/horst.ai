<script lang="ts">
	import * as Menubar from '$lib/components/ui/menubar/index.js';
	import { loadGraph, resetGraph, saveGraph, shareUrl } from '@/utils';
	import { Download, File, Upload } from 'lucide-svelte';

	let bookmarks = false;
	let fullUrls = true;

	const profileRadioValue = 'benoit';

	let viewLegend = false;
</script>

<Menubar.Root>
	<Menubar.Menu>
		<Menubar.Trigger>File</Menubar.Trigger>
		<Menubar.Content>
			<Menubar.Item on:click={resetGraph}>
				<File class="mr-2 size-3.5" />
				New Graph
			</Menubar.Item>
			<Menubar.Separator />
			<Menubar.Item on:click={loadGraph}>
				<Upload class="mr-2 size-3.5" />
				Upload
			</Menubar.Item>
			<Menubar.Item on:click={saveGraph}>
				<Download class="mr-2 size-3.5" />
				Download
			</Menubar.Item>
			<Menubar.Separator />
			<Menubar.Sub>
				<Menubar.SubTrigger inset>Share</Menubar.SubTrigger>
				<Menubar.SubContent>
					<Menubar.Item on:click={shareUrl}>Generate URL</Menubar.Item>
					<Menubar.Item disabled>Messages</Menubar.Item>
					<Menubar.Item disabled>Notes</Menubar.Item>
				</Menubar.SubContent>
			</Menubar.Sub>
			<Menubar.Separator />
			<Menubar.Item inset disabled>
				Print... <Menubar.Shortcut>⌘P</Menubar.Shortcut>
			</Menubar.Item>
		</Menubar.Content>
	</Menubar.Menu>
	<Menubar.Menu>
		<Menubar.Trigger>Edit</Menubar.Trigger>
		<Menubar.Content>
			<Menubar.Item disabled>
				Undo <Menubar.Shortcut>⌘Z</Menubar.Shortcut>
			</Menubar.Item>
			<Menubar.Item disabled>
				Redo <Menubar.Shortcut>⇧⌘Z</Menubar.Shortcut>
			</Menubar.Item>
			<Menubar.Separator />
			<Menubar.Sub>
				<Menubar.SubTrigger disabled>Find</Menubar.SubTrigger>
				<Menubar.SubContent>
					<Menubar.Item>Search the web</Menubar.Item>
					<Menubar.Separator />
					<Menubar.Item>Find...</Menubar.Item>
					<Menubar.Item>Find Next</Menubar.Item>
					<Menubar.Item>Find Previous</Menubar.Item>
				</Menubar.SubContent>
			</Menubar.Sub>
			<Menubar.Separator />
			<Menubar.Item disabled>Cut</Menubar.Item>
			<Menubar.Item disabled>Copy</Menubar.Item>
			<Menubar.Item disabled>Paste</Menubar.Item>
		</Menubar.Content>
	</Menubar.Menu>
	<Menubar.Menu>
		<Menubar.Trigger>View</Menubar.Trigger>
		<Menubar.Content>
			<Menubar.CheckboxItem disabled bind:checked={bookmarks}
				>Always Show Bookmarks Bar</Menubar.CheckboxItem
			>
			<Menubar.CheckboxItem disabled bind:checked={fullUrls}
				>Always Show Full URLs</Menubar.CheckboxItem
			>
			<Menubar.Separator />
			<Menubar.Item disabled inset>
				Reload <Menubar.Shortcut>⌘R</Menubar.Shortcut>
			</Menubar.Item>
			<Menubar.Item disabled inset>
				Force Reload <Menubar.Shortcut>⇧⌘R</Menubar.Shortcut>
			</Menubar.Item>
			<Menubar.Separator />
			<Menubar.Item disabled inset>Toggle Fullscreen</Menubar.Item>
			<Menubar.Separator />
			<Menubar.Item disabled inset>Hide Sidebar</Menubar.Item>
		</Menubar.Content>
	</Menubar.Menu>
	<Menubar.Menu>
		<Menubar.Trigger>Profiles</Menubar.Trigger>
		<Menubar.Content>
			<Menubar.RadioGroup value={profileRadioValue}>
				<Menubar.RadioItem value="andy">Andy</Menubar.RadioItem>
				<Menubar.RadioItem value="benoit">Benoit</Menubar.RadioItem>
				<Menubar.RadioItem value="Luis">Luis</Menubar.RadioItem>
			</Menubar.RadioGroup>
			<Menubar.Separator />
			<Menubar.Item disabled inset>Edit...</Menubar.Item>
			<Menubar.Separator />
			<Menubar.Item disabled inset>Add Profile...</Menubar.Item>
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
