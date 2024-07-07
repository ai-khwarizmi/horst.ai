<script lang="ts" context="module">
	const newGraph = writable<SavedGraph | undefined>();

	export const setUpdatedGraph = (graph: SavedGraph) => {
		newGraph.set(graph);
	};
</script>

<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { writable } from 'svelte/store';
	import Button from '../ui/button/button.svelte';
	import { loadFromGraph, type SavedGraph } from '@/project';
</script>

<Dialog.Root open={!!$newGraph} onOpenChange={(open) => !open && newGraph.set(undefined)}>
	<Dialog.Content>
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>A new version of the project is available</Dialog.Title>
				<Dialog.Description>Do you want to load the new version?</Dialog.Description>
			</Dialog.Header>
			<Dialog.Footer class="gap-2">
				<Button
					variant="default"
					on:click={() => {
						// load new graph
						if ($newGraph) {
							loadFromGraph($newGraph);
						}
						newGraph.set(undefined);
					}}
				>
					Yes
				</Button>
				<Button
					variant="secondary"
					on:click={() => {
						// keep current graph
						newGraph.set(undefined);
					}}
				>
					No
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Content>
</Dialog.Root>
