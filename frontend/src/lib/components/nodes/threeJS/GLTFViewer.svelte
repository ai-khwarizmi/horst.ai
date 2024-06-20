<script lang="ts">
	import * as THREE from 'three';
	import * as SC from 'svelte-cubed';
	import { NodeIOHandler } from '@/utils';
	import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
	import { toast } from 'svelte-sonner';
	import CustomNode from '@/components/CustomNode.svelte';
	import type { NodeError, NodeStatus } from '@/types';
	import Button from '@/components/ui/button/button.svelte';
	import { Download } from 'lucide-svelte';

	const loader = new GLTFLoader();

	let status: NodeStatus = 'idle';
	let errors: NodeError[] | undefined;

	export let id: string;
	const io = new NodeIOHandler({
		nodeId: id,
		inputs: [{ id: 'data', type: 'file' }],
		outputs: [
			{ id: 'file', type: 'file' },
			{ id: 'fileUrl', type: 'text', label: 'File URL' }
		]
	});

	let lastFileId: string;
	let model: THREE.Group | null = null;
	let fileBlobUrl: string | null = null;

	function loadGLTF(url: string) {
		return loader
			.loadAsync(url)
			.then((gltf) => {
				model = gltf.scene;
				fileBlobUrl = url;
				toast.success('Loaded GLTF file!');
			})
			.catch((err) => {
				status = 'error';
				errors = [err];
				toast.error('Failed to load GLTF file!');
			});
	}

	function onExecute() {
		const file = io.getInputData('data');
		if (!file) return;

		const fileId = `${file.name}_${file.size}_${file.lastModified}`;
		if (lastFileId === fileId) return;

		lastFileId = fileId;

		const url = URL.createObjectURL(file);
		loadGLTF(url);
	}
</script>

<CustomNode bind:errors {io} {onExecute} {...$$props}>
	<div class="relative w-full h-full">
		<SC.Canvas background={new THREE.Color('skyblue')} antialias>
			<SC.PerspectiveCamera position={[-2, 1.2, 4]} near={0.1} far={500} fov={40} />

			<SC.OrbitControls
				enabled={true}
				enableZoom={true}
				autoRotate={false}
				autoRotateSpeed={2}
				enableDamping={true}
				dampingFactor={0.1}
				target={[0, 0, 0]}
			/>

			<SC.DirectionalLight
				color={new THREE.Color(0xffffff)}
				position={[0, 10, 10]}
				intensity={0.75}
				shadow={false}
			/>
			<SC.AmbientLight color={new THREE.Color(0xffffff)} intensity={0.75} />

			{#if model}
				<SC.Primitive object={model} scale={[1, 1, 1]} position={[0, 0, 0]} />
			{/if}
		</SC.Canvas>
	</div>
	<div class="h-2"></div>
	<Button download href={fileBlobUrl}>
		<Download class="mr-2" />
		Download
	</Button>
</CustomNode>
