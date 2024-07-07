<script lang="ts" context="module">
	let openRecentFiles = writable(false);

	export const openRecentPopup = () => {
		openRecentFiles.set(true);
	};
</script>

<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { writable } from 'svelte/store';
	import Button from '../ui/button/button.svelte';
	import { getGraphFromLocalProject, localProjectIds } from '@/project/local';
</script>

<Dialog.Root bind:open={$openRecentFiles}>
	<Dialog.Content>
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>Recent Files</Dialog.Title>
				<Dialog.Description>Select a recent file to open.</Dialog.Description>
			</Dialog.Header>
			<div class="grid grid-cols-3 gap-2">
				{#each $localProjectIds as id}
					{@const project = getGraphFromLocalProject(id)}
					{#if project}
						<div class="flex justify-center items-center">
							<Button
								class="w-full"
								variant="outline"
								href="/project/{project.projectId}"
								on:click={() => openRecentFiles.set(false)}
							>
								{project?.projectId || 'Untitled'}
							</Button>
						</div>
					{/if}
				{/each}
			</div>
		</Dialog.Content>
	</Dialog.Content>
</Dialog.Root>
