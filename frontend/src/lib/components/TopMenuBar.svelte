<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { loadGraph, saveGraph } from '@/utils/file';
	import {
		Download,
		Upload,
		FilePlus,
		Share2,
		Key,
		Info,
		GithubIcon,
		Settings
	} from 'lucide-svelte';
	import { openShareGraphModal } from './file/ShareGraph.svelte';
	import { openApiKeySettings } from './settings/APIKeys.svelte';
	import Button from './ui/button/button.svelte';
	import { isMobile } from './Mobile.svelte';
	import { openNewFilePopup } from './popups/NewFilePopup.svelte';
	import PackageJson from '../../../package.json';
	import { openProjectSettings } from './ProjectSettings.svelte';
</script>

<div class="flex items-center gap-2">
	<Dialog.Root>
		<Dialog.Trigger>
			<div
				class="h-[36px] flex gap-2 shadow-2xl aspect-square rounded-lg border pointer-events-auto"
			>
				<img src="/logo.png" alt="Logo" class="h-full select-none" />
			</div>
		</Dialog.Trigger>
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>
					About {PackageJson.name}
					<span class="text-xs gray-300">
						(v{PackageJson.version})
					</span>
					<div class="text-sm text-gray-500">AI Workflow Editor</div>
				</Dialog.Title>
				<Dialog.Description>
					{PackageJson.description}
				</Dialog.Description>
			</Dialog.Header>
			<Dialog.Footer>
				<Button variant="link" size="sm" target="_blank" href={PackageJson.repository.url}>
					<GithubIcon class="mr-2 size-3.5" />
					View on GitHub
				</Button>
				<Button variant="outline" size="sm" target="_blank" href="/how-to-use">
					<Info class="mr-2 size-3.5" />
					How to Use
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
	{#if $isMobile}
		<Button
			variant="outline"
			size="sm"
			target="_blank"
			href="/how-to-use"
			class="pointer-events-auto"
		>
			<Info class="mr-2 size-3.5" />
			How to Use
		</Button>
	{:else}
		<Button size="sm" on:click={openNewFilePopup} class="pointer-events-auto">
			<FilePlus class="mr-2 size-3.5" />
			New
		</Button>
		<Button variant="secondary" size="sm" on:click={loadGraph} class="pointer-events-auto">
			<Upload class="mr-2 size-3.5" />
			Load
		</Button>
		<Button variant="secondary" size="sm" on:click={saveGraph} class="pointer-events-auto">
			<Download class="mr-2 size-3.5" />
			Save
		</Button>
		<Button
			variant="secondary"
			size="iconSm"
			on:click={openProjectSettings}
			class="pointer-events-auto"
		>
			<Settings class="size-3.5" />
		</Button>
		<Button
			variant="secondary"
			size="sm"
			on:click={openShareGraphModal}
			class="pointer-events-auto"
		>
			<Share2 class="mr-2 size-3.5" />
			Share
		</Button>
		<div class="w-4 h-[1px] bg-gray-500"></div>
		<Button variant="outline" size="sm" on:click={openApiKeySettings} class="pointer-events-auto">
			<Key class="mr-2 size-3.5" />
			Set OpenAI Key
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
