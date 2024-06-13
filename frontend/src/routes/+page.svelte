<script lang="ts">
	import { writable } from 'svelte/store';
	import { SvelteFlow, Background, Controls } from '@xyflow/svelte';

	import '@xyflow/svelte/dist/style.css';
	import { nodes, edges } from '$lib';
	import CustomNode from '$lib/components/CustomNode.svelte';

	const nodeTypes = {
		custom: CustomNode
	};
</script>

<main>
	<SvelteFlow {nodes} {edges} {nodeTypes}>
		<Background />
		<Controls />
	</SvelteFlow>
</main>

<style>
	main {
		height: 100vh;
	}
</style>
