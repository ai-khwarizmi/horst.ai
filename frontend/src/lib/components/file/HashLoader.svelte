<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { page } from '$app/stores';
	import Button from '../ui/button/button.svelte';
	import { loadFromHash } from '@/utils';
	import { toast } from 'svelte-sonner';
</script>

{#if $page.url.hash}
	<Dialog.Root open>
		<Dialog.Content>
			<Dialog.Title>Project detected in URL</Dialog.Title>
			<Dialog.Description>
				A project has been detected in the URL. Do you want to load it? This will replace the
				current project.
			</Dialog.Description>
			<Dialog.Footer>
				<Button
					variant="default"
					on:click={() => {
						let success = loadFromHash();
						if (success) {
							window.location.hash = '';
						} else {
							toast.error('Failed to load project from URL');
						}
					}}
				>
					Load Project
				</Button>
				<Button
					variant="secondary"
					on:click={() => {
						window.location.hash = '';
					}}
				>
					Cancel
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
{/if}
