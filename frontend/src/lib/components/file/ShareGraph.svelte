<script context="module" lang="ts">
	import { writable } from 'svelte/store';
	import * as Dialog from '$lib/components/ui/dialog';
	import { edges, nodes } from '@/index';
	import { getSaveData } from '@/utils/file';
	import * as LZString from 'lz-string';
	import Input from '../ui/input/input.svelte';
	import { toast } from 'svelte-sonner';
	import Label from '../ui/label/label.svelte';
	import Switch from '../ui/switch/switch.svelte';
	import Button from '../ui/button/button.svelte';

	let open = writable(false);

	export function openShareGraphModal() {
		open.set(true);
	}
</script>

<script lang="ts">
	let includeData = true;
	let sizeByes = 0;

	$: url = $open ? generateUrl(includeData) : '';

	const generateUrl = (includeData: boolean) => {
		const url = new URL(location.href);

		if ($nodes.length === 0 && $edges.length === 0) {
			url.hash = '';
			return url.href;
		}

		const graph = getSaveData(includeData);

		const str = JSON.stringify(graph);

		//uncompressed base64
		const base64 = btoa(str);

		//compress
		const compressed = LZString.compressToBase64(str);
		console.log('compression ratio:', compressed.length / base64.length);
		console.log('before:', base64.length, ' after:', compressed.length);

		const shorterVersion = compressed.length < base64.length ? compressed : base64;

		url.hash = shorterVersion;
		if (shorterVersion == compressed) console.log('using Compressed');
		else if (shorterVersion == base64) console.log('using Base64');

		sizeByes = new Blob([shorterVersion]).size;

		return url.href;
	};

	const onClick = () => {
		navigator.clipboard.writeText(url);
		toast.success('Copied to clipboard');
	};
</script>

<!-- Share Graph -->
<Dialog.Root bind:open={$open}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Share Project</Dialog.Title>
			<Dialog.Description>
				<p>
					Share the current project by copying the URL below. The URL will contain the current
					project data, which can be shared with others.
				</p>
				<div class="flex gap-2">
					<Input readonly value={url} placeholder="" class=" mt-2" />
					<Button class="mt-2" on:click={onClick}>Copy</Button>
				</div>
				<div class="flex mt-1 justify-between">
					<div class="text-xs">Size: {sizeByes} bytes</div>
				</div>
				<div class="flex flex-col mt-2">
					<Label class="flex gap-2">
						<Switch bind:checked={includeData} />
						<div class="flex flex-col">
							<div class="font-bold">Include Data</div>
							<div class="text-xs font-normal">
								Data is associated with each node (i.e. inputs) and will be included in the shared
								URL.
							</div>
						</div>
					</Label>
				</div>
			</Dialog.Description>
		</Dialog.Header>
	</Dialog.Content>
</Dialog.Root>
