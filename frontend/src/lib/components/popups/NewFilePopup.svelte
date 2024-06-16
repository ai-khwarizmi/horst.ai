<script lang="ts" context="module">
	let newFileOpen = writable(false);

	export const openNewFilePopup = () => {
		newFileOpen.set(true);
	};
</script>

<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { writable } from 'svelte/store';
	import Button from '../ui/button/button.svelte';
	import { resetGraph } from '@/utils/file';
</script>

<Dialog.Root bind:open={$newFileOpen}>
	<Dialog.Content>
		<Dialog.Header>New Project</Dialog.Header>
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>New Project</Dialog.Title>
				<Dialog.Description>
					Are you sure you want to create a new project? Unsaved changes will be lost.
				</Dialog.Description>
			</Dialog.Header>
			<Dialog.Footer class="gap-2">
				<Button variant="secondary" on:click={() => newFileOpen.set(false)}>Cancel</Button>
				<Button
					variant="default"
					on:click={() => {
						resetGraph();
						newFileOpen.set(false);
					}}
				>
					Yes
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Content>
</Dialog.Root>
