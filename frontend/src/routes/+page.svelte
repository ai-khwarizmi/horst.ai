<script lang="ts">
	import { SvelteFlow, Background, Controls, Panel, MiniMap } from '@xyflow/svelte';

	import '@xyflow/svelte/dist/style.css';
	import { nodes, edges, openai_key } from '$lib';
	import { nodeTypes } from '@/nodes';
	import Input from '@/components/ui/input/input.svelte';
	import BottomBar from '@/components/BottomBar.svelte';
</script>

<main>
	<SvelteFlow {nodes} {edges} {nodeTypes}>
		<Background />
		<Controls />
		<Panel position="top-center">
			<Input bind:value={$openai_key} placeholder="Open AI" />
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
