<script lang="ts" context="module">
	let newFileOpen = writable(false);

	export const openNewFilePopup = () => {
		newFileOpen.set(true);
	};
</script>

<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { writable } from 'svelte/store';
	import Button from '../ui/button/button.svelte';
	import { createNewProject } from '@/project';
</script>

<Dialog.Root bind:open={$newFileOpen}>
	<Dialog.Content>
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>New Project</Dialog.Title>
				<Dialog.Description>
					Are you sure you want to create a new project? Unsaved changes will be lost.
				</Dialog.Description>
			</Dialog.Header>
			<Dialog.Footer class="gap-2">
				<Button
					variant="default"
					on:click={() => {
						createNewProject();
						newFileOpen.set(false);
					}}
				>
					Yes
				</Button>
				<Button variant="secondary" on:click={() => newFileOpen.set(false)}>Cancel</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Content>
</Dialog.Root>
