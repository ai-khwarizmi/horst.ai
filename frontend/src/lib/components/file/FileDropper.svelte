<script lang="ts">
	import { loadFromFile } from '@/utils';
	import { toast } from 'svelte-sonner';
</script>

<svelte:window
	on:dragover={(e) => {
		e.preventDefault();
	}}
	on:drop={(e) => {
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
