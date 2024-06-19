<script lang="ts">
	import * as Command from '$lib/components/ui/command';
	import { registeredNodes, type CustomNodeName, type RegisteredNode } from '@/nodes';
	import { addNode, cn, getNodeColors } from '@/utils';
	import { useSvelteFlow } from '@xyflow/svelte';
	import { onMount } from 'svelte';
	import { commandOpen, createNodeParams } from '..';

	onMount(() => {
		function handleKeydown(e: KeyboardEvent) {
			// if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
			// 	e.preventDefault();
			// 	commandOpen.update((prev) => !prev);
			// }
			const { activeElement } = document;
			if (activeElement) {
				if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') {
					return;
				}
			}
			if (e.code === 'Space') {
				if (!$commandOpen) {
					e.preventDefault();
					commandOpen.set(true);
				}
			}
			if (e.key === 'Escape') {
				e.preventDefault();
				commandOpen.set(false);
			}
		}

		document.addEventListener('keydown', handleKeydown);

		return () => {
			document.removeEventListener('keydown', handleKeydown);
		};
	});

	const { screenToFlowPosition } = useSvelteFlow();

	const onSelect = (nodeType: CustomNodeName) => {
		const newPosition = screenToFlowPosition(
			$createNodeParams?.position ?? {
				x: window.innerWidth / 2,
				y: window.innerHeight / 2
			}
		);
		const connectWith = $createNodeParams?.node;
		// Do we want to place it where the cursor was previously?
		addNode(nodeType, newPosition, connectWith);
		commandOpen.set(false);
		createNodeParams.set(null);
	};

	const groupedNodes = Object.entries(registeredNodes).reduce<
		Record<string, ({ id: CustomNodeName } & RegisteredNode)[]>
	>((acc, [key, node]) => {
		if (node.category) {
			if (!acc[node.category]) {
				acc[node.category] = [];
			}
			acc[node.category].push({
				id: key as CustomNodeName,
				...node
			});
		}
		return acc;
	}, {});
</script>

<Command.Dialog bind:open={$commandOpen}>
	<Command.Input placeholder="Search" />
	<Command.List>
		<Command.Empty>No results found.</Command.Empty>
		<!-- <Command.Group heading="Recently Used">
			<Command.Item onSelect={() => onSelect('textInput')}>Text Input</Command.Item>
			<Command.Item onSelect={() => onSelect('textDisplay')}>Text Display</Command.Item>
		</Command.Group> -->

		{#each Object.keys(groupedNodes) as category}
			<Command.Group heading={category}>
				{#each groupedNodes[category] as node}
					<Command.Item onSelect={() => onSelect(node.id)}>
						{#if node.Icon}
							<svelte:component
								this={node.Icon}
								class={cn('mr-2 text-gray-500', node.nodeType && getNodeColors(node.nodeType).text)}
							/>
						{/if}
						<span class="text-gray-700 text-sm font-semibold">
							{node.name || node.id}
						</span>
					</Command.Item>
				{/each}
			</Command.Group>
		{/each}
	</Command.List>
</Command.Dialog>
