<script lang="ts">
	import CustomNode from '../../CustomNode.svelte';
	import { NodeIOHandler } from '$lib/utils';
	import Textarea from '../../ui/textarea/textarea.svelte';
	import { onMount } from 'svelte';
	import { HorstFile } from '@/utils/horstfile';

	export let id: string;
	let value = '';
	let files: HorstFile[] = [];

	const io = new NodeIOHandler({
		nodeId: id,
		inputs: [],
		outputs: [
			{ id: 'text', type: 'text' },
			{ id: 'files', type: 'file[]' }
		],
		onExecute: () => {}
	});

	onMount(() => {
		const data = io.getOutputData('text');
		if (data) {
			value = String(data);
		}
	});

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
	}

	function handleDrop(event: DragEvent) {
		const dropZone = event.target?.closest('.text-input-drop-zone');
		if (!dropZone || dropZone.dataset.id !== id) {
			return;
		}

		event.preventDefault();
		event.stopPropagation();
		if (event.dataTransfer?.files) {
			handleFiles(event.dataTransfer.files);
		}
	}

	const handleFiles = (newFiles: FileList) => {
		for (const file of newFiles) {
			files = [...files, new HorstFile(file)];
		}
		io.setOutputData('files', files);
	};

	const removeFile = (index: number) => {
		files = files.filter((_, i) => i !== index);
		io.setOutputData('files', files);
	};
</script>

<svelte:window on:dragover|capture={handleDragOver} on:drop|capture={handleDrop} />

<CustomNode {io} {...$$props}>
	<div class="flex flex-col w-full h-full">
		<!-- Move the file list above the input -->
		{#if files.length > 0}
			<ul class="mt-2 mb-2 flex flex-wrap w-full">
				{#each files as file, index}
					<li
						class="flex justify-between items-center bg-gray-100 p-0.5 rounded m-0.5 text-xs"
						style="width: calc(50% - 1rem); box-sizing: border-box;"
					>
						<span class="text-xxs truncate">{file.fileName}</span>
						<button
							class="bg-red-500 hover:bg-red-700 text-white font-bold py-0.5 px-1 rounded ml-1 text-xxs"
							on:click={() => removeFile(index)}
							style="line-height: 1; display: flex; align-items: center;"
						>
							X
						</button>
					</li>
				{/each}
			</ul>
		{/if}

		<div class="relative flex-grow">
			<Textarea
				bind:value
				class="w-full h-full min-h-0 min-w-0 nodrag text-input-drop-zone"
				style="resize: none;"
				data-id={id}
				on:blur={(e) => {
					io.setOutputData('text', e.currentTarget.value);
				}}
				on:dragover={handleDragOver}
				on:drop={handleDrop}
			/>
			<div class="absolute bottom-2 right-2">
				<label
					for="file-upload-{id}"
					class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer"
				>
					Upload Files
				</label>
				<input
					id="file-upload-{id}"
					type="file"
					multiple
					class="hidden"
					on:change={(e) => handleFiles(e.target?.files)}
				/>
			</div>
		</div>
	</div>
</CustomNode>
