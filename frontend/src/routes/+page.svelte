<script lang="ts">
	import { writable } from 'svelte/store';
	import {
		SvelteFlow,
		Background,
		Controls,
		type NodeTypes,
		NodeToolbar,
		Panel,
		MiniMap
	} from '@xyflow/svelte';

	import '@xyflow/svelte/dist/style.css';
	import { nodes, edges, nodeTypes } from '$lib';
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
