<script lang="ts">
	import * as Menubar from '$lib/components/ui/menubar/index.js';
	import { loadGraph, saveGraph, shareUrl } from '@/utils';
	import { Download, Upload } from 'lucide-svelte';

	let bookmarks = false;
	let fullUrls = true;

	const profileRadioValue = 'benoit';
</script>

<Menubar.Root>
	<Menubar.Menu>
		<Menubar.Trigger>File</Menubar.Trigger>
		<Menubar.Content>
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
