<script lang="ts">
	import { SvelteFlow, Background, Controls, Panel, MiniMap } from '@xyflow/svelte';

	import '@xyflow/svelte/dist/style.css';
	import { nodes, edges, openai_key } from '$lib';
	import { nodeTypes } from '@/nodes';
	import Input from '@/components/ui/input/input.svelte';
	import BottomBar from '@/components/BottomBar.svelte';
	import { onMount } from 'svelte';
	import TopMenuBar from '@/components/TopMenuBar.svelte';
	import { page } from '$app/stores';
	import { loadFromHash } from '@/utils';
	import FullCommand from '@/components/FullCommand.svelte';

	onMount(() => {
		console.log('onMount');
		const existingOpenaiApiKey = window.localStorage.getItem('openai_api_key');
		console.log('existingOpenaiApiKey', existingOpenaiApiKey);
		if (existingOpenaiApiKey) {
			console.log('setting existingOpenaiApiKey');
			openai_key.set(existingOpenaiApiKey);
		}

		// load hash
		if ($page.url.hash) {
			const hash = $page.url.hash;
			if (hash.length > 1) {
				loadFromHash();
			}
		}
	});
</script>

<main>
	<SvelteFlow {nodes} {edges} {nodeTypes}>
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
