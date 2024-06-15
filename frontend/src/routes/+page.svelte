<script lang="ts">
	import { SvelteFlow, Background, Controls, Panel, MiniMap } from '@xyflow/svelte';

	import '@xyflow/svelte/dist/style.css';
	import { nodes, edges, openai_key, viewport } from '$lib';
	import { nodeTypes } from '@/nodes';
	import Input from '@/components/ui/input/input.svelte';
	import BottomBar from '@/components/BottomBar.svelte';
	import TopMenuBar from '@/components/TopMenuBar.svelte';
	import FullCommand from '@/components/FullCommand.svelte';
	import ShareGraph from '@/components/file/ShareGraph.svelte';
	import { onMount } from 'svelte';

	onMount(() => {
		const existingOpenaiApiKey = window.localStorage.getItem('openai_api_key');
		if (existingOpenaiApiKey) {
			openai_key.set(existingOpenaiApiKey);
		}
	});
</script>

<main>
	<ShareGraph />
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
		<FullCommand />
		<Background />
		<Controls />
		<Panel position="top-right">
			<Input bind:value={$openai_key} placeholder="Open AI" />
		</Panel>
		<Panel position="top-left">
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
