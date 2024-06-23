<script context="module" lang="ts">
	import { writable } from 'svelte/store';
	import * as Dialog from '$lib/components/ui/dialog';
	import Label from './ui/label/label.svelte';
	import Input from './ui/input/input.svelte';
	import { projectName } from '..';
	import Button from './ui/button/button.svelte';

	let open = writable(false);

	export function openProjectSettings() {
		open.set(true);
	}
</script>

<Dialog.Root bind:open={$open}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Workflow Settings</Dialog.Title>
		</Dialog.Header>
		<Label for="projectName">Project Name</Label>
		<Input bind:value={$projectName} id="projectName" placeholder="Name" />
		<Dialog.Footer>
			<Button variant="outline" size="sm" on:click={() => open.set(false)}>Close</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
