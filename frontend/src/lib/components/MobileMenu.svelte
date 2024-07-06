<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import {
		Download,
		ExternalLinkIcon,
		FilePlus,
		Handshake,
		HelpCircle,
		Info,
		Key,
		LucideGithub,
		Menu,
		Settings,
		Share2,
		Upload,
		UsersRound
	} from 'lucide-svelte';
	import Button from './ui/button/button.svelte';
	import { openApiKeySettings } from './settings/APIKeys.svelte';
	import { loadGraphFromUploadedFile, saveGraphToJson } from '@/utils/file';
	import { openNewFilePopup } from './popups/NewFilePopup.svelte';
	import PackageJson from '../../../package.json';
	import { openProjectSettings } from './ProjectSettings.svelte';
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		<Button size="sm" variant="outline" class="pointer-events-auto">
			<Menu class="mr-2 size-3.5" />
			Menu
		</Button>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content>
		<DropdownMenu.Item on:click={openNewFilePopup}>
			<FilePlus class="mr-2 size-3.5" />
			New
		</DropdownMenu.Item>
		<DropdownMenu.Separator />
		<DropdownMenu.Item on:click={loadGraphFromUploadedFile}>
			<Upload class="mr-2 size-3.5" />
			Load
		</DropdownMenu.Item>
		<DropdownMenu.Item on:click={saveGraphToJson}>
			<Download class="mr-2 size-3.5" />
			Save
		</DropdownMenu.Item>
		<DropdownMenu.Item on:click={openProjectSettings}>
			<Settings class="mr-2 size-3.5" />
			Settings
		</DropdownMenu.Item>
		<DropdownMenu.Separator />
		<DropdownMenu.Item on:click={openApiKeySettings}>
			<Key class="mr-2 size-3.5" />
			Set OpenAI Key
		</DropdownMenu.Item>
		<DropdownMenu.Separator />
		<DropdownMenu.Sub>
			<DropdownMenu.SubTrigger>
				<Info class="mr-2 size-3.5" />
				Learn More
			</DropdownMenu.SubTrigger>
			<DropdownMenu.SubContent>
				<DropdownMenu.Item href="/how-to-use" target="_blank">
					<HelpCircle class="mr-2 size-3.5" />
					How to Use
				</DropdownMenu.Item>
				<DropdownMenu.Item href="/credits" target="_blank">
					<UsersRound class="mr-2 size-3.5" />
					Credits
				</DropdownMenu.Item>
				<DropdownMenu.Item href="/credits" target="_blank">
					<Handshake class="mr-2 size-3.5" />
					Terms
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
