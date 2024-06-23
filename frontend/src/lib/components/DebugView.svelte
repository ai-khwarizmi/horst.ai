<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import * as Card from '$lib/components/ui/card';
	import Button from './ui/button/button.svelte';
	import { addNode } from '@/utils';
	import Input from './ui/input/input.svelte';
	import Label from './ui/label/label.svelte';
	import { edges } from '..';
	import type { Node } from '@xyflow/svelte';

	$: open = browser && $page.url.searchParams.has('debug');

	const PER_LAYER = 10;
	const HEIGHT = 175;
	let stressLevel = 0;

	const stressTest = () => {
		const input = addNode('textInput', { x: 0, y: 0 });
		const transforms: Node[] = [];
		for (let i = 0; i < stressLevel; i++) {
			transforms.push(
				addNode('textEncode', {
					x: ((i % PER_LAYER) + 1) * 250,
					y: HEIGHT * (Math.floor(i / PER_LAYER) + 1)
				})
			);
		}
		const output = addNode('textDisplay', {
			x: 0,
			y: 200
		});

		// Add edges
		edges.update((e) => {
			for (let i = 0; i < transforms.length; i++) {
				const current = transforms[i];
				const next = i === transforms.length - 1 ? null : transforms[i + 1];
				if (next) {
					e.push({
						id: `${current.id}-${next.id}`,
						source: current.id,
						target: next.id,
						sourceHandle: 'encoded',
						targetHandle: 'data'
					});
				}
			}
			e.push({
				id: `${input.id}-${transforms[0].id}`,
				source: input.id,
				target: transforms[0].id,
				sourceHandle: 'text',
				targetHandle: 'data'
			});
			e.push({
				id: `${transforms[transforms.length - 1].id}-${output.id}`,
				source: transforms[transforms.length - 1].id,
				target: output.id,
				sourceHandle: 'encoded',
				targetHandle: 'data'
			});
			return e;
		});
	};
</script>

{#if open}
	<Card.Root
		class="fixed z-50 right-4 min-w-40 max-w-96 p-2 flex flex-col gap-2 top-1/2 -translate-y-1/2"
	>
		<div class="font-bold text-center leading-none">Debug</div>
		<hr />
		<!-- change the debug to whatever you want :) -->
		<div class="flex flex-col gap-2">
			<Label>Stress Level</Label>
			<Input type="number" bind:value={stressLevel} min={0} step={1} />
			<Button on:click={stressTest}>Stress Test</Button>
		</div>
	</Card.Root>
{/if}
