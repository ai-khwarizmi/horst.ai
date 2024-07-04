<script lang="ts">
	import { loadFromFile } from '@/utils/file';
	import { toast } from 'svelte-sonner';
</script>

<svelte:window
	on:dragover={(e) => {
		e.preventDefault();
	}}
	on:drop={(e) => {
		// Check if the drop target or any of its parents have the text-input-drop-zone class
		console.log('drop event fileDropper');
		if (e.target?.closest('.text-input-drop-zone')) {
			return; // Exit early if dropped on a text input
		}

		e.preventDefault();
		if (e.dataTransfer?.files.length) {
			const file = e.dataTransfer?.files[0];
			if (file) {
				if (file.type !== 'application/json') {
					toast.error('Only JSON files are supported');
					return;
				}
				loadFromFile(file)
					.then(() => {
						toast.success('File loaded');
					})
					.catch((err) => {
						toast.error(err.message);
					});
			}
		}
	}}
/>
