<script lang="ts">
	import CustomNode from '@/components/CustomNode.svelte';
	import type { NodeError, NodeStatus } from '@/types';
	import { NodeIOHandler } from '@/utils';
	import { Client } from '@gradio/client';
	import { onMount } from 'svelte';

	export let id: string;
	let status: NodeStatus = 'idle';
	let errors: NodeError[] | undefined;
	const io = new NodeIOHandler({
		nodeId: id,
		inputs: [{ id: 'data', type: 'file' }],
		outputs: [
			{ id: 'file', type: 'file' },
			{ id: 'fileUrl', type: 'text', label: 'File URL' }
		]
	});

	let app: Client | null = null;

	const space = 'overiit/Unique3D';
	const url = 'https://overiit-unique3d.hf.space/';
	onMount(async () => {
		status = 'loading';
		app = await Client.connect(space, {
			hf_token: 'hf_' // ... accesstoken
		}).catch((err) => {
			status = 'error';
			errors = [err];
			throw err;
		});
		status = 'idle';
	});

	let lastFileId: string | null = null;

	const onExecute = (callbacks: any, forceExecute = false) => {
		if (status === 'loading') return;
		if (!app) return;

		const input = io.getInputData('data') ?? null;
		if (input === null) return;

		const fileId = `${input.name}_${input.size}_${input.lastModified}`;
		if (lastFileId === fileId && !forceExecute) return;
		lastFileId = fileId;

		status = 'loading';
		app
			.predict('/generate3dv2', [
				input, // blob of bile
				true, // boolean  in 'Remove Background' Checkbox component
				-1, // number (numeric value between -1 and 1000000000) in 'Seed' Slider component
				true, // boolean  in 'generate video' Checkbox component
				true, // boolean  in 'Refine Multiview Details' Checkbox component
				-1, // number (numeric value between -1.0 and 1.0) in 'Expansion Weight' Slider component
				'std' // string  in 'Mesh Initialization' Dropdown component
			])
			.then(async (output) => {
				const [{ orig_name, path }] = output.data as any[];

				const fileUrl = url + 'file=' + path;
				const fileName = orig_name;

				io.setOutputData('fileUrl', fileUrl);
				const body = await fetch(fileUrl);
				const blob = await body.blob();
				io.setOutputData('file', new File([blob], fileName));

				status = 'idle';
			})
			.catch((err) => {
				status = 'error';
				console.error(err);
				errors = [err];
			});
	};
</script>

<CustomNode bind:status bind:errors {io} {onExecute} {...$$props} />
