<script lang="ts">
	import { SvelteFlow, Background, Controls, Panel, MiniMap } from '@xyflow/svelte';

	import '@xyflow/svelte/dist/style.css';
	import { nodes, edges } from '$lib';
	import { nodeTypes } from '@/nodes';
</script>

<main>
	<SvelteFlow {nodes} {edges} {nodeTypes}>
		<Background />
		<Controls />
		<Panel position="bottom-center">bottom-center</Panel>
		<MiniMap nodeStrokeWidth={3} />
	</SvelteFlow>
</main>

<style>
	main {
		height: 100vh;
	}
</style>
