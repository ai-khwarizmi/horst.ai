<script lang="ts">
	import {
		SvelteFlow,
		Background,
		Controls,
		Panel,
		type OnConnectStart,
		type Connection
	} from '@xyflow/svelte';

	import '@xyflow/svelte/dist/style.css';
	import { nodes, edges, viewport, commandOpen, createNodeParams } from '$lib';
	import { nodeTypes } from '@/nodes';
	import BottomBar from '@/components/BottomBar.svelte';
	import TopMenuBar from '@/components/TopMenuBar.svelte';
	import FullCommand from '@/components/FullCommand.svelte';
	import { onMount } from 'svelte';
	import Apikeys from '@/components/settings/APIKeys.svelte';
	import Button from '@/components/ui/button/button.svelte';
	import FileDropper from '@/components/file/FileDropper.svelte';
	import { isMobile } from '@/components/Mobile.svelte';
	import { Info } from 'lucide-svelte';
	import NewFilePopup from '@/components/popups/NewFilePopup.svelte';

	import PackageJson from '../../../package.json';
	import DebugView from '@/components/DebugView.svelte';
	import type { ConnectWith } from '@/types';
	import ProjectSettings from '@/components/ProjectSettings.svelte';
	import ClerkSigninButton from '@/auth/ClerkSigninButton.svelte';
	import ClerkSignoutButton from '@/auth/ClerkSignoutButton.svelte';
	import ClerkProfileButton from '@/auth/ClerkProfileButton.svelte';
	import { anthropic_key, openai_key } from '@/apikeys';
	import SaveFilePopup from './popups/SaveFilePopup.svelte';
	import { cn } from '$lib/utils';
	import { loadProjectByProjectId } from '@/project';
	import OpenFilePopup from './popups/OpenFilePopup.svelte';
	import OpenRecentPopup from './popups/OpenRecentPopup.svelte';
	import VersionChangePopup from './popups/VersionChangePopup.svelte';

	export let projectId: string | undefined = undefined;

	$: loadProjectByProjectId(projectId);

	onMount(async () => {
		const existingOpenaiApiKey = window.localStorage.getItem('openai_api_key');
		if (existingOpenaiApiKey) {
			openai_key.set(existingOpenaiApiKey);
		}
		const existingAnthropicApiKey = window.localStorage.getItem('anthropic_api_key');
		if (existingAnthropicApiKey) {
			anthropic_key.set(existingAnthropicApiKey);
		}
	});

	let startNode: ConnectWith | null = null;
	const handleConnectionStart: OnConnectStart = (e, { nodeId, handleId, handleType }) => {
		if (nodeId && handleId) {
			startNode = {
				id: nodeId,
				handle: handleId,
				type: handleType === 'source' ? 'output' : 'input'
			};
		}
	};

	const handleConnect = (_connection: Connection) => {
		startNode = null;
	};

	const handleConnectionEnd = (e: MouseEvent | TouchEvent) => {
		if (!startNode) return;
		if ((e.target as Element)?.classList?.contains?.('svelte-flow__pane')) {
			commandOpen.set(true);
			const position =
				e instanceof MouseEvent
					? { x: e.clientX, y: e.clientY }
					: { x: e.touches[0].clientX, y: e.touches[0].clientY };
			createNodeParams.set({
				position,
				node: startNode ?? undefined
			});
		}
	};
</script>

<main>
	<Apikeys />
	<FileDropper />
	<ProjectSettings />
	<NewFilePopup />
	<VersionChangePopup />
	<OpenFilePopup />
	<OpenRecentPopup />
	<SaveFilePopup />
	<SvelteFlow
		{nodes}
		{edges}
		{nodeTypes}
		{viewport}
		minZoom={0.25}
		deleteKey={['Delete', 'Backspace']}
		onconnect={handleConnect}
		onconnectstart={handleConnectionStart}
		onconnectend={handleConnectionEnd}
	>
		<DebugView />
		<FullCommand />
		<Background />
		<Controls />
		<Panel position="top-right">
			<div class="flex gap-2">
				<Button
					variant={$isMobile ? 'outline' : 'ghost'}
					size={$isMobile ? 'icon' : undefined}
					target="_blank"
					href="/how-to-use"
				>
					<Info class={cn('size-3.5', !$isMobile && 'mr-2')} />
					{#if !$isMobile}
						How to Use
					{/if}
				</Button>
				<ClerkSigninButton />
				<ClerkProfileButton />
				<ClerkSignoutButton />
			</div>
		</Panel>
		<Panel position="top-left" class="pointer-events-none">
			<TopMenuBar {projectId} />
		</Panel>
		<Panel position="bottom-center">
			<BottomBar />
		</Panel>
		<Panel position="bottom-right" style="display: flex; align-items: center; gap: 5px;">
			{#if !$isMobile}
				<Button
					variant="link"
					target="_blank"
					class="text-xs"
					href={PackageJson.repository.url}
					style="display: flex; align-items: center;"
				>
					<img
						src="/github-mark.png"
						alt="Github"
						style="margin-right: 10px; width: 1.5rem; height: 1.5rem;"
					/>
					Github (v{PackageJson.version})
				</Button>
				<Button variant="link" class="text-xs" target="_blank" href="/credits">Credits</Button>
			{/if}
			<Button variant="link" class="text-xs" target="_blank" href="/terms">
				{#if !$isMobile}
					Terms of Use
				{:else}
					Terms
				{/if}
			</Button>
		</Panel>
	</SvelteFlow>
</main>

<style>
	main {
		height: 100vh;
	}
</style>
