<script lang="ts" context="module">
	let saveFileOpen = writable(false);

	export const openSaveFilePopup = () => {
		saveFileOpen.set(true);
	};
</script>

<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { writable } from 'svelte/store';
	import Button from '../ui/button/button.svelte';
	import { Download, UploadCloud } from 'lucide-svelte';
	import { clerk, session } from '@/auth/Clerk';
	import { saveAsCloudProject } from '@/project/cloud';
	import { saveGraphToJson } from '@/project/file';
</script>

<Dialog.Root bind:open={$saveFileOpen}>
	<Dialog.Content>
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>Save Project</Dialog.Title>
				<Dialog.Description>How do you want to save your project?</Dialog.Description>
			</Dialog.Header>
			<Dialog.Footer class="gap-2">
				<!-- Download / Upload to cloud -->
				<Button
					variant="default"
					on:click={() => {
						if ($session) {
							saveAsCloudProject();
						} else {
							$clerk?.openSignIn();
						}
						saveFileOpen.set(false);
					}}
				>
					<UploadCloud class="mr-2 size-3.5" />
					Upload to Cloud
				</Button>
				<Button
					variant="secondary"
					on:click={() => {
						saveGraphToJson();
						saveFileOpen.set(false);
					}}
				>
					<Download class="mr-2 size-3.5" />
					Download
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Content>
</Dialog.Root>
