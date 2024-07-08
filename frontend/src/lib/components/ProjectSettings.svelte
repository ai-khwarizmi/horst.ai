<script context="module" lang="ts">
	import { writable } from 'svelte/store';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Popover from '$lib/components/ui/popover';
	import Label from './ui/label/label.svelte';
	import Input from './ui/input/input.svelte';
	import { projectId, projectName } from '..';
	import Button from './ui/button/button.svelte';
	import { Trash } from 'lucide-svelte';
	import { deleteCurrentProject } from '@/project';

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
			<!-- Delete -->
			{#if $projectId}
				<Popover.Root>
					<Popover.Trigger>
						<Button
							variant="outline"
							class="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
							size="sm"
						>
							<Trash class="mr-2 size-3.5" />
							Delete Project
						</Button>
					</Popover.Trigger>
					<Popover.Content>
						<Dialog.Title>Delete Project</Dialog.Title>
						<Dialog.Description>Are you sure you want to delete this project?</Dialog.Description>
						<div class="flex gap-2 mt-2">
							<Button
								variant="destructive"
								on:click={() => {
									deleteCurrentProject();
									open.set(false);
								}}>Delete</Button
							>
							<Button variant="secondary" on:click={() => open.set(false)}>Cancel</Button>
						</div>
					</Popover.Content>
				</Popover.Root>
			{/if}
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
