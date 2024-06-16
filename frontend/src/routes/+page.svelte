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
	import Input from '@/components/ui/input/input.svelte';

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
		<Panel position="top-center">
			<Input placeholder="Project Name" bind:value={$projectName} />
		</Panel>
		<Panel position="top-right">
			<Button variant="link" target="_blank" href="/how-to-use">How to Use</Button>
		</Panel>
		<Panel position="top-left" class="pointer-events-none">
			<TopMenuBar />
		</Panel>
		<Panel position="bottom-center">
			<BottomBar />
		</Panel>
		<Panel position="bottom-right" style="display: flex; align-items: center; gap: 10px;">
			<Button
				variant="link"
				target="_blank"
				class="text-xs"
				href="https://github.com/ai-khwarizmi/horst.ai"
				style="display: flex; align-items: center;"
			>
				<img
					src="/github-mark.png"
					alt="Github"
					style="margin-right: 10px; width: 1.5rem; height: 1.5rem;"
				/>
				Github
			</Button>
			<Button variant="link" class="text-xs" href="/credits">Credits</Button>
			<Button variant="link" class="text-xs" target="_blank" href="/terms">Terms of Use</Button>
		</Panel>
	</SvelteFlow>
</main>

<style>
	main {
		height: 100vh;
	}
</style>
