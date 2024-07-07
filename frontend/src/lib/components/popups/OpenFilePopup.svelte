<script lang="ts" context="module">
	let openFileOpen = writable(false);

	export const openFilePopup = () => {
		openFileOpen.set(true);
	};
</script>

<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { writable } from 'svelte/store';
</script>

<Dialog.Root bind:open={$openFileOpen}>
	<Dialog.Content>
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>Load Project</Dialog.Title>
				<Dialog.Description>Where do you want to load your project from?</Dialog.Description>
			</Dialog.Header>
			asd
		</Dialog.Content>
	</Dialog.Content>
</Dialog.Root>
