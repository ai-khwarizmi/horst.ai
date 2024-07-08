<script lang="ts">
	import * as Command from '$lib/components/ui/command';
	import { registeredNodes, type CustomNodeName, type RegisteredNode } from '@/nodes';
	import { addNode, cn, getNodeColors } from '@/utils';
	import { useSvelteFlow } from '@xyflow/svelte';
	import { commandOpen, createNodeParams } from '..';

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
		if (e.code === 'Space' && (e.metaKey || e.ctrlKey)) {
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

<svelte:document on:keydown={handleKeydown} />

<Command.Dialog bind:open={$commandOpen}>
	<Command.Input placeholder="Search" />
	<p class="text-sm text-muted-foreground m-2 text-center">
		Haven't found what you need? <a
			class="text-primary underline"
			href="https://github.com/ai-khwarizmi/horst.ai/issues/new?assignees=metjm&labels=enhancement&projects=&template=feature-request---new-node.md&title=enhancement%2C+new+node"
			target="_blank"
		>
			Open a Github issue
		</a>
		or fill out
		<a class="text-primary underline" href="https://tally.so/r/wdP9Xo" target="_blank">
			this form
		</a>
	</p>
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
