<script lang="ts">
	import { SvelteFlow, Background, Controls, Panel, MiniMap } from '@xyflow/svelte';

	import '@xyflow/svelte/dist/style.css';
	import { nodes, edges, openai_key, viewport, projectName } from '$lib';
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

	onMount(() => {
		const existingOpenaiApiKey = window.localStorage.getItem('openai_api_key');
		if (existingOpenaiApiKey) {
			openai_key.set(existingOpenaiApiKey);
		}
	});
</script>

<main>
	<ShareGraph />
	<Apikeys />
	<FileDropper />
	<NewFilePopup />
	<SvelteFlow
		{nodes}
		{edges}
		{nodeTypes}
		{viewport}
		deleteKey={['Delete', 'Backspace']}
		proOptions={{
			hideAttribution: true
		}}
	>
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
		</Panel>
		<Panel position="top-left" class="pointer-events-none">
			<TopMenuBar />
		</Panel>
		<Panel position="bottom-center">
			<BottomBar />
		</Panel>
		<Panel position="bottom-right">
			{#if !$isMobile}
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
