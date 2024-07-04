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
	import { nodes, edges, viewport, commandOpen, createNodeParams, resetProject } from '$lib';
	import { nodeTypes } from '@/nodes';
	import BottomBar from '@/components/BottomBar.svelte';
	import TopMenuBar from '@/components/TopMenuBar.svelte';
	import FullCommand from '@/components/FullCommand.svelte';
	import ShareGraph from '@/components/file/ShareGraph.svelte';
	import { onMount } from 'svelte';
	import Apikeys from '@/components/settings/APIKeys.svelte';
	import Button from '@/components/ui/button/button.svelte';
	import FileDropper from '@/components/file/FileDropper.svelte';
	import HashLoader from '@/components/file/HashLoader.svelte';
	import { isMobile } from '@/components/Mobile.svelte';
	import { Info } from 'lucide-svelte';
	import MobileMenu from '@/components/MobileMenu.svelte';
	import NewFilePopup from '@/components/popups/NewFilePopup.svelte';

	import PackageJson from '../../../package.json';
	import DebugView from '@/components/DebugView.svelte';
	import type { ConnectWith } from '@/types';
	import ProjectSettings from '@/components/ProjectSettings.svelte';
	import { loadFromLocalStorage, loadFromProjectId } from '@/utils/file';
	import ClerkSigninButton from '@/auth/ClerkSigninButton.svelte';
	import ClerkSignoutButton from '@/auth/ClerkSignoutButton.svelte';
	import ClerkProfileButton from '@/auth/ClerkProfileButton.svelte';
	import { anthropic_key, openai_key } from '@/apikeys';

	export let projectId: string | undefined = undefined;

	onMount(async () => {
		const existingOpenaiApiKey = window.localStorage.getItem('openai_api_key');
		if (existingOpenaiApiKey) {
			openai_key.set(existingOpenaiApiKey);
		}
		const existingAnthropicApiKey = window.localStorage.getItem('anthropic_api_key');
		if (existingAnthropicApiKey) {
			anthropic_key.set(existingAnthropicApiKey);
		}

		//loading logic
		let loaded = false;
		if (projectId) {
			loaded = await loadFromProjectId(projectId);
		}
		if (!loaded) {
			console.log('Loading from local storage');
			loaded = await loadFromLocalStorage();
		}

		if (!loaded) {
			resetProject();
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
	<ShareGraph />
	<Apikeys />
	<FileDropper />
	<ProjectSettings />
	<NewFilePopup />
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
		<HashLoader />
		<FullCommand />
		<Background />
		<Controls />
		<Panel position="top-right">
			{#if $isMobile}
				<MobileMenu />
			{:else}
				<Button
					variant={$isMobile ? 'outline' : 'ghost'}
					size="sm"
					target="_blank"
					href="/how-to-use"
				>
					<Info class="mr-2 size-3.5" />
					How to Use
				</Button>
			{/if}
			<ClerkSigninButton />
			<ClerkProfileButton />
			<ClerkSignoutButton />
		</Panel>
		<Panel position="top-left" class="pointer-events-none">
			<TopMenuBar />
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
					Github
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
