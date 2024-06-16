<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import {
		Download,
		FilePlus,
		Handshake,
		HelpCircle,
		Info,
		Key,
		Menu,
		Share2,
		Upload,
		UsersRound
	} from 'lucide-svelte';
	import Button from './ui/button/button.svelte';
	import { openApiKeySettings } from './settings/APIKeys.svelte';
	import { openShareGraphModal } from './file/ShareGraph.svelte';
	import { loadGraph, saveGraph } from '@/utils';
	import { openNewFilePopup } from './popups/NewFilePopup.svelte';
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
		<DropdownMenu.Item on:click={loadGraph}>
			<Upload class="mr-2 size-3.5" />
			Load
		</DropdownMenu.Item>
		<DropdownMenu.Item on:click={saveGraph}>
			<Download class="mr-2 size-3.5" />
			Save
		</DropdownMenu.Item>
		<DropdownMenu.Separator />
		<DropdownMenu.Item on:click={openShareGraphModal}>
			<Share2 class="mr-2 size-3.5" />
			Share
		</DropdownMenu.Item>
		<DropdownMenu.Separator />
		<DropdownMenu.Item on:click={openApiKeySettings}>
			<Key class="mr-2 size-3.5" />
			Set OpenAI Key
		</DropdownMenu.Item>
		<DropdownMenu.Separator />
		<DropdownMenu.Separator />
		<DropdownMenu.Sub>
			<DropdownMenu.SubTrigger>
				<Info class="mr-2 size-3.5" />
				About
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
	</DropdownMenu.Content>
</DropdownMenu.Root>
