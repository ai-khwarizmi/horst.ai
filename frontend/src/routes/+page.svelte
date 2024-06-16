<script lang="ts">
	import { SvelteFlow, Background, Controls, Panel, MiniMap } from '@xyflow/svelte';

	import '@xyflow/svelte/dist/style.css';
	import { nodes, edges, openai_key, viewport } from '$lib';
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
			<Button variant="link" href="/credits">Credits</Button>
		</Panel>
		<Panel position="top-left" class="pointer-events-none">
			<TopMenuBar />
		</Panel>
		<Panel position="bottom-center">
			<BottomBar />
		</Panel>
		<MiniMap nodeStrokeWidth={3} />
	</SvelteFlow>
</main>

<style>
	main {
		height: 100vh;
	}
</style>
