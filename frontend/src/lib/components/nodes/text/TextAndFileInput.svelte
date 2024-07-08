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
		onExecute: async (_callbacks, _forceExecute, _wrap) => {},
		isInputUnsupported: async (_inputId, _data) => {
			return { unsupported: false };
		}
	});

	onMount(() => {
		const text = io.getOutputData('text');
		if (text) {
			value = String(text);
		}
		loadFiles();
	});

	const loadFiles = async () => {
		let _files = io.getOutputData('files');
		if (!_files) {
			return;
		}
		_files = await Promise.all(_files.map((file: HorstFile) => file.waitForLoad()));
		files = _files;
	};

	function handleDragOver(event: any) {
		event.preventDefault();
		event.stopPropagation();
	}

	function handleDrop(event: any) {
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

	const handleFiles = async (newFiles: FileList) => {
		const _files = await Promise.all(Array.from(newFiles).map((file) => HorstFile.fromFile(file)));
		files = [...files, ..._files];
		io.setOutputDataPlaceholder('files', files);
	};

	const onFilesSelected = (e: any) => {
		handleFiles(e.target?.files);
	};

	const removeFile = (index: number) => {
		files = files.filter((_, i) => i !== index);
		io.setOutputDataPlaceholder('files', files);
	};
</script>

<svelte:window on:dragover|capture={handleDragOver} on:drop|capture={handleDrop} />

<CustomNode {io} {...$$props}>
	<div class="flex flex-col w-full h-full">
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
					io.setOutputDataPlaceholder('text', e.currentTarget.value);
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
					on:change={onFilesSelected}
				/>
			</div>
		</div>
	</div>
</CustomNode>
