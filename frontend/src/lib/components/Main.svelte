<script lang="ts">
	import {
		SvelteFlow,
		Background,
		Panel,
		type OnConnectStart,
		type Connection
	} from '@xyflow/svelte';

	import '@xyflow/svelte/dist/style.css';
	import { commandOpen, createNodeParams, gridSnap, nodes, recentProjectsOpen, state } from '$lib';
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
	import SaveFilePopup from './popups/SaveFilePopup.svelte';
	import { cn } from '$lib/utils';
	import OpenFilePopup from './popups/OpenFilePopup.svelte';
	import VersionChangePopup from './popups/VersionChangePopup.svelte';
	import CustomEdge from './CustomEdge.svelte';
	import { createNewProject, loadCloudProject, loadLocalProject } from '@/project';
	import RecentCloudProjects from './popups/RecentCloudProjects.svelte';
	import { get } from 'svelte/store';
	import { session } from '@/auth/Clerk';
	import ContextMenu from './ContextMenu.svelte';
	import { saveAsCloudProject, sendNodeMoveResize, takeAndUploadScreenshot } from '@/project/cloud';
	import { resetLocalProject } from '@/project/local';
	import HotkeysPopup from './popups/HotkeysPopup.svelte';
	import WebsocketStatus from './WebsocketStatus.svelte';
	import PlayPause from './PlayPause.svelte';

	export let projectId: string | undefined = undefined;

	onMount(async () => {
		if (projectId) {
			console.log('[MAIN onMount] loading cloud project', projectId);
			await loadCloudProject(projectId);
			return;
		}

		const result = loadLocalProject();
		const userLoggedIn = !!get(session);

		if (userLoggedIn) {
			await handleLoggedInUser(result);
		} else {
			handleNonLoggedInUser(result);
		}
	});

	async function handleLoggedInUser(localProjectLoaded: boolean) {
		if (!localProjectLoaded) {
			console.log('[MAIN onMount] no local project found. User logged in, showing recents');
			recentProjectsOpen.set(true);
			return;
		}

		if ($nodes.length > 0) {
			console.log('[MAIN onMount] saving local project to cloud');
			await saveAsCloudProject(true);
			await takeAndUploadScreenshot();
		} else {
			console.log('[MAIN onMount] local project empty, showing recents');
			resetLocalProject();
			recentProjectsOpen.set(true);
		}
	}

	function handleNonLoggedInUser(localProjectLoaded: boolean) {
		if (localProjectLoaded) {
			console.log('[MAIN onMount] loading local project');
		} else {
			console.log('[MAIN onMount] no local project found. Creating new project');
			createNewProject();
		}
	}

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
					: { x: e.touches[0]!.clientX, y: e.touches[0]!.clientY };
			createNodeParams.set({
				position,
				node: startNode ?? undefined
			});
		}
	};

	const handleNodeDrag = (e: CustomEvent) => {
		const nodeId = e.detail.nodes[0]?.id;
		if (nodeId) {
			sendNodeMoveResize(nodeId);
		}
	};

	const edgeTypes = {
		custom: CustomEdge
	};
</script>

<main>
	<Apikeys />
	<FileDropper />
	<ProjectSettings />
	<NewFilePopup />
	<VersionChangePopup />
	<RecentCloudProjects />
	<OpenFilePopup />
	<SaveFilePopup />
	<ContextMenu />
	<SvelteFlow
		nodes={$state.nodes}
		edges={$state.edges}
		{nodeTypes}
		{edgeTypes}
		viewport={$state.viewport}
		minZoom={0.25}
		deleteKey={['Delete', 'Backspace']}
		snapGrid={$gridSnap}
		onconnect={handleConnect}
		onconnectstart={handleConnectionStart}
		onconnectend={handleConnectionEnd}
		on:nodedrag={handleNodeDrag}
		defaultEdgeOptions={{
			type: 'custom'
		}}
	>
		<HotkeysPopup />
		<DebugView />
		<FullCommand />
		<Background />
		<Panel position="bottom-left">
			<WebsocketStatus />
		</Panel>
		<Panel position="top-center">
			<PlayPause />
		</Panel>
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
