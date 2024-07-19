<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { writable } from 'svelte/store';
	import Button from '../ui/button/button.svelte';
	import { onMount } from 'svelte';
	import Checkbox from '../ui/checkbox/checkbox.svelte';
	import PackageJson from '../../../../package.json';
	import '@mux/mux-player';

	const open = writable(false);
	let dontShowAgain = false;

	onMount(async () => {
		const shouldShow = localStorage.getItem('showWelcomePopup') !== 'false';
		if (shouldShow) {
			open.set(true);
		}
	});

	const onOpenChange = (isOpen: boolean) => {
		open.set(isOpen);
		if (!isOpen && dontShowAgain) {
			localStorage.setItem('showWelcomePopup', 'false');
		}
	};

	function handleClose() {
		if (dontShowAgain) {
			localStorage.setItem('showWelcomePopup', 'false');
		}
		open.set(false);
	}
</script>

<Dialog.Root bind:open={$open} {onOpenChange}>
	<Dialog.Content class="w-full max-w-4xl">
		<Dialog.Header>
			<Dialog.Title>Welcome to horst.ai</Dialog.Title>
		</Dialog.Header>
		<div class="space-y-4">
			<p>
				Horst.ai is a visual playground for experimenting with and prototyping AI workflows. It lets
				you quickly connect AI tools like ChatGPT and DALL-E to create, test, and share your ideas
				without writing code.
			</p>
			<div>
				<p class="mt-2">
					This project is in its early stages and is evolving fast. Expect frequent (sometimes
					breaking) changes!
				</p>
				<p class="mt-2">
					The frontend is open source, you can check it out on <a
						href={PackageJson.repository.url}
						target="_blank"
						class="hover:underline"
						rel="noopener noreferrer">Github</a
					>.
				</p>
			</div>
			<div class="flex flex-col justify-center items-center mt-2">
				<mux-player
					src="https://static.horst.ai/horst_demo.mp4"
					type="video/mp4"
					metadata={{
						video_id: 'horst_demo',
						video_title: 'Horst.ai Demo'
					}}
					controls
					class="w-2/3 h-full"
					accentColor="rgb(255 255 255)"
				/>
			</div>
		</div>
		<Dialog.Footer class="flex items-center justify-between">
			<div class="flex items-center space-x-2">
				<Checkbox bind:checked={dontShowAgain} id="dont-show-again" />
				<label for="dont-show-again" class="text-sm text-gray-700"> Don't show this again </label>
			</div>
			<Button on:click={handleClose}>Get Started</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
