<script lang="ts">
	import Main from '@/components/Main.svelte';
	import {
		getGraphFromLocalProject,
		getLastLocalProjectId,
		resetLastProjectId
	} from '@/project/local';
	import * as Dialog from '$lib/components/ui/dialog';
	import Button from '@/components/ui/button/button.svelte';
	import { goto } from '$app/navigation';

	$: mostRecentProjectId = getLastLocalProjectId();
	$: project = mostRecentProjectId && getGraphFromLocalProject(mostRecentProjectId);
</script>

<Main />

{#if mostRecentProjectId}
	<Dialog.Root open>
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>Welcome back!</Dialog.Title>
				<Dialog.Description
					>Would you like to open your most recently edited project?</Dialog.Description
				>
			</Dialog.Header>
			<div class="text-sm text-gray-500">
				{#if project}
					You were last working on <strong>{project.name}</strong>.
				{:else}
					You were last working on an untitled project.
				{/if}
			</div>
			<Dialog.Footer class="gap-2">
				<Button
					variant="secondary"
					on:click={() => {
						if (mostRecentProjectId) goto(`/project/${mostRecentProjectId}`);
						mostRecentProjectId = undefined;
					}}
				>
					Yes, open it
				</Button>
				<Button
					variant="default"
					on:click={() => {
						mostRecentProjectId = undefined;
						resetLastProjectId();
					}}>No</Button
				>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
{/if}
