<script lang="ts">
	import { loadFromFile } from '@/project/file';
	import { toast } from 'svelte-sonner';

	const ondragover = (e: any) => {
		e.preventDefault();
	};

	const ondrop = (e: any) => {
		console.log('drop event fileDropper');
		if (e.target?.closest('.text-input-drop-zone')) {
			return;
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
	};
</script>

<svelte:window on:dragover={ondragover} on:drop={ondrop} />
