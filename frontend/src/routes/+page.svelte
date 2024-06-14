<script lang="ts">
	import { SvelteFlow, Background, Controls, Panel, MiniMap } from '@xyflow/svelte';

	import '@xyflow/svelte/dist/style.css';
	import { nodes, edges, openai_key } from '$lib';
	import { nodeTypes } from '@/nodes';
	import Input from '@/components/ui/input/input.svelte';
	import { onMount } from 'svelte';

	onMount(() => {
		console.log('onMount');
		const existingOpenaiApiKey = window.localStorage.getItem('openai_api_key');
		console.log('existingOpenaiApiKey', existingOpenaiApiKey);
		if (existingOpenaiApiKey) {
			console.log('setting existingOpenaiApiKey');
			openai_key.set(existingOpenaiApiKey);
		}
	});
</script>

<main>
	<SvelteFlow {nodes} {edges} {nodeTypes}>
		<Background />
		<Controls />
		<Panel position="top-center">
			<Input bind:value={$openai_key} placeholder="Search" />
		</Panel>
		<Panel position="bottom-center">bottom-center</Panel>
		<MiniMap nodeStrokeWidth={3} />
	</SvelteFlow>
</main>

<style>
	main {
		height: 100vh;
	}
</style>
