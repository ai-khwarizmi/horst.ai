<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import {
		Download,
		Menu,
		Folder,
		Key,
		Info,
		Workflow,
		LifeBuoy,
		Save,
		Keyboard,
		LucideGithub,
		ExternalLinkIcon,
		UsersRound,
		Handshake,
		Clock,
		Settings,
		FilePlus
	} from 'lucide-svelte';
	import { openApiKeySettings } from './settings/APIKeys.svelte';
	import Button from './ui/button/button.svelte';
	import { isMobile } from './Mobile.svelte';
	import PackageJson from '../../../package.json';
	import { usesClerk } from '@/auth/Clerk';
	import { openSaveFilePopup } from './popups/SaveFilePopup.svelte';
	import { projectName } from '$lib';
	import { commandOpen } from '$lib';
	import { loadGraphFromUploadedFile, saveGraphToJson } from '@/project/file';
	import { openProjectSettings } from './ProjectSettings.svelte';
	import { openNewFilePopup } from './popups/NewFilePopup.svelte';
	import { openHotkeysPopup } from './popups/HotkeysPopup.svelte';

	export let projectId: string | undefined;

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'o' && (e.metaKey || e.ctrlKey)) {
			loadGraphFromUploadedFile();
			e.preventDefault();
		}
	}
</script>

<svelte:window on:keypress={handleKeydown} />

<div class="flex items-center gap-2">
	<a
		href="/"
		class="h-10 flex gap-2 shadow-2xl aspect-square rounded-lg border pointer-events-auto"
	>
		<img src="/logo.png" alt="Logo" class="h-full select-none" />
	</a>
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			<Button class="flex gap-2 items-center pointer-events-auto flex-shrink-0">
				<Menu class="size-3.5" />
			</Button>
		</DropdownMenu.Trigger>
		<DropdownMenu.Content class="w-64">
			<DropdownMenu.Item on:click={openNewFilePopup}>
				<FilePlus class="mr-2 size-3.5" />
				New
				<DropdownMenu.Shortcut>
					{#if navigator.userAgent.match('Mac')}
						⌘
					{:else}
						Ctrl
					{/if} + N
				</DropdownMenu.Shortcut>
			</DropdownMenu.Item>
			<DropdownMenu.Item on:click={loadGraphFromUploadedFile}>
				<Folder class="mr-2 size-3.5" />
				Open
				<DropdownMenu.Shortcut>
					{#if navigator.userAgent.match('Mac')}
						⌘
					{:else}
						Ctrl
					{/if} + O
				</DropdownMenu.Shortcut>
			</DropdownMenu.Item>
			<DropdownMenu.Sub>
				<DropdownMenu.SubTrigger>
					<Clock class="mr-2 size-3.5" />
					Recent
				</DropdownMenu.SubTrigger>
				<DropdownMenu.SubContent class="w-40">
					<DropdownMenu.Label>Cloud</DropdownMenu.Label>
					<DropdownMenu.Item disabled>No recent files</DropdownMenu.Item>
					<DropdownMenu.Label class="flex justify-between">Local</DropdownMenu.Label>
					<!--
					re-add once we have cloud list of projects
					{#each projects.slice(0, 5) as project}
						<DropdownMenu.Item href="/project/{project.id}">
							{project.name}
						</DropdownMenu.Item>
					{/each}
					{#if projects.length == 0}
						<DropdownMenu.Item disabled>No recent files</DropdownMenu.Item>
					{/if}
					-->
					<DropdownMenu.Separator />
				</DropdownMenu.SubContent>
			</DropdownMenu.Sub>
			{#if usesClerk && (!projectId || projectId.startsWith('local'))}
				<DropdownMenu.Item on:click={openSaveFilePopup}>
					<Download class="mr-2 size-3.5" />
					Save as..
				</DropdownMenu.Item>
			{:else}
				<DropdownMenu.Item on:click={saveGraphToJson}>
					<Save class="mr-2 size-3.5" />
					Save to Disk
				</DropdownMenu.Item>
			{/if}
			<!-- <DropdownMenu.Item disabled>
				<Share2 class="mr-2 size-3.5" />
				Share
			</DropdownMenu.Item>
			<DropdownMenu.Item disabled>
				<Cloud class="mr-2 size-3.5" />
				Collaborate
			</DropdownMenu.Item> -->
			<DropdownMenu.Separator />
			<DropdownMenu.Item on:click={openApiKeySettings}>
				<Key class="mr-2 size-3.5" />
				Set API Keys
			</DropdownMenu.Item>
			<DropdownMenu.Separator />
			<DropdownMenu.Item on:click={() => commandOpen.set(true)}>
				<Workflow class="mr-2 size-3.5" />
				Node Palette
				<DropdownMenu.Shortcut>
					{#if navigator.userAgent.match('Mac')}
						⌘
					{:else}
						Ctrl
					{/if} + Space
				</DropdownMenu.Shortcut>
			</DropdownMenu.Item>
			<DropdownMenu.Item on:click={openHotkeysPopup}>
				<Keyboard class="mr-2 size-3.5" />
				Hotkeys
			</DropdownMenu.Item>
			<DropdownMenu.Item href="/how-to-use" target="_blank">
				<LifeBuoy class="mr-2 size-3.5" />
				Help
				<DropdownMenu.Shortcut>
					<ExternalLinkIcon class="size-3.5" />
				</DropdownMenu.Shortcut>
			</DropdownMenu.Item>
			<DropdownMenu.Separator />

			<DropdownMenu.Sub>
				<DropdownMenu.SubTrigger>
					<Info class="mr-2 size-3.5" />
					Learn More
				</DropdownMenu.SubTrigger>
				<DropdownMenu.SubContent class="w-40">
					<DropdownMenu.Item href="/credits" target="_blank">
						<UsersRound class="mr-2 size-3.5" />
						Credits
						<DropdownMenu.Shortcut>
							<ExternalLinkIcon class="size-3.5" />
						</DropdownMenu.Shortcut>
					</DropdownMenu.Item>
					<DropdownMenu.Item href="/terms" target="_blank">
						<Handshake class="mr-2 size-3.5" />
						Terms
						<DropdownMenu.Shortcut>
							<ExternalLinkIcon class="size-3.5" />
						</DropdownMenu.Shortcut>
					</DropdownMenu.Item>
				</DropdownMenu.SubContent>
			</DropdownMenu.Sub>
			<DropdownMenu.Separator />
			<DropdownMenu.Item href={PackageJson.repository.url} target="_blank" class="cursor-pointer">
				<LucideGithub class="mr-2 size-3.5" />
				Source
				<DropdownMenu.Shortcut>
					<ExternalLinkIcon class="size-3.5" />
				</DropdownMenu.Shortcut>
			</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
	<Button
		variant="outline"
		class="pointer-events-auto max-w-52 justify-start items-center gap-2"
		on:click={openProjectSettings}
	>
		<span class="text-ellipsis overflow-hidden whitespace-nowrap pr-1">
			{$projectName || 'Untitled'}
		</span>
		<div class="ml-auto">
			<Settings class="size-3.5" />
		</div>
	</Button>
	{#if !$isMobile}
		<div class="w-4 h-[1px] bg-gray-500"></div>
		<Button variant="secondary" size="sm" on:click={openApiKeySettings} class="pointer-events-auto">
			<Key class="mr-2 size-3.5" />
			Set API Keys
		</Button>
	{/if}
</div>

<div class="bg-white rounded-md border mt-2 p-2 text-xs w-28 pointer-events-auto select-none">
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
