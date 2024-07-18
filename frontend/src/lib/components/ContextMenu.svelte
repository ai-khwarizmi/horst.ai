<script lang="ts">
	import {
		Plus,
		Grid2x2,
		Grid3x3,
		Square,
		Magnet,
		SquareMousePointer,
		Trash,
		Copy
	} from 'lucide-svelte';
	import { addNode, removeNode } from '$lib/utils';
	import * as ContextMenu from '$lib/components/ui/context-menu';
	import { commandOpen, createNodeParams, gridSnap, nodes, state } from '..';
	import type { XYPosition } from '@xyflow/svelte';
	import { registeredNodes, type CustomNodeName } from '@/nodes';

	const ignoreNodeTypes = ['a', 'input', 'button', 'textarea', 'select', 'option', 'label'];

	let contextMenuData:
		| ({
				position: XYPosition;
		  } & (
				| {
						type: 'canvas';
				  }
				| {
						type: 'node';
						nodeId: string;
				  }
		  ))
		| null;

	const handleContextMenu = (e: MouseEvent) => {
		const position = { x: e.clientX, y: e.clientY };

		const isPaneElement = (e.target as Element)?.classList?.contains?.('svelte-flow__pane');
		const nodeElement = (e.target as Element)?.closest?.('.svelte-flow__node');
		const isToBeIgnored = ignoreNodeTypes.includes(
			(e.target as Element)?.tagName.toLowerCase() ?? ''
		);

		if (isPaneElement) {
			contextMenuData = {
				type: 'canvas',
				position
			};
		} else if (nodeElement && !isToBeIgnored) {
			const id = nodeElement?.getAttribute('data-id');
			if (!id) return;
			contextMenuData = {
				type: 'node',
				nodeId: id,
				position
			};
		} else {
			return;
		}
		e.preventDefault();
	};

	const toggleSnapMode = (e: CustomEvent) => {
		e.preventDefault();
		const snapModes = [0, 20, 40, 60];
		const currentIndex = snapModes.indexOf($gridSnap[0] ?? 0);
		const nextIndex = (currentIndex + 1) % snapModes.length;
		$state.gridSnap = snapModes[nextIndex];
	};

	const openAddNodeMenu = () => {
		const position = contextMenuData?.position;
		createNodeParams.set(
			position
				? {
						position
					}
				: null
		);
		commandOpen.set(true);
	};

	const deleteNode = () => {
		if (contextMenuData?.type !== 'node') {
			console.log('not a node');
			return;
		}
		const nodeId = contextMenuData.nodeId;
		removeNode(nodeId);
	};

	$: allSelected = $nodes.every((node) => node.selected);

	const toggleSelectAll = () => {
		nodes.update((nodes) => {
			const newSelectedState = !allSelected;
			nodes.forEach((node) => {
				node.selected = newSelectedState;
			});
			return nodes;
		});
	};

	const cloneNode = () => {
		if (!contextMenuData || contextMenuData?.type !== 'node') return;
		const nodeId = contextMenuData.nodeId;
		const node = $nodes.find((node) => node.id === nodeId);
		if (!node) return;
		createNodeParams.set({
			position: {
				x: node.position.x + 100,
				y: node.position.y + 100
			}
		});
		if (!node.type) return;
		if (registeredNodes[node.type]) {
			const nodeType = node.type as CustomNodeName;
			addNode(nodeType, {
				x: node.position.x + 100,
				y: node.position.y + 100
			});
		}
	};
</script>

<svelte:window on:contextmenu={handleContextMenu} />

{#if contextMenuData}
	<ContextMenu.Root
		open={true}
		onOpenChange={(open) => {
			if (!open) {
				contextMenuData = null;
			}
		}}
	>
		<ContextMenu.Trigger
			style="position: fixed; top: {contextMenuData.position.y}px; left: {contextMenuData.position
				.x}px;"
		/>
		<ContextMenu.Content
			style="position: fixed; top: {contextMenuData.position.y}px; left: {contextMenuData.position
				.x}px;"
		>
			{#if contextMenuData.type === 'canvas'}
				<ContextMenu.Item on:click={openAddNodeMenu}>
					<Plus class="w-4 h-4 mr-2" />
					Add Node
				</ContextMenu.Item>
				<ContextMenu.Separator />
				<ContextMenu.Item on:click={toggleSelectAll}>
					<SquareMousePointer class="w-4 h-4 mr-2" />
					{allSelected ? 'Unselect All' : 'Select All'}
				</ContextMenu.Item>
				<ContextMenu.Separator />
				<!-- <ContextMenu.Item>
					<Grip class="w-4 h-4 mr-2" />
					Toggle Grid
				</ContextMenu.Item> -->
				<ContextMenu.Item on:click={toggleSnapMode}>
					{#if $state.gridSnap === 20}
						<Square class="w-4 h-4 mr-2" />
						Grid Snap: Fine
					{:else if $state.gridSnap === 40}
						<Grid2x2 class="w-4 h-4 mr-2" />
						Grid Snap: Medium
					{:else if $state.gridSnap === 60}
						<Grid3x3 class="w-4 h-4 mr-2" />
						Grid Snap: Large
					{:else}
						<Magnet class="w-4 h-4 mr-2" />
						Grid Snap: {$state.gridSnap}
					{/if}
				</ContextMenu.Item>
			{:else if contextMenuData.type === 'node'}
				<!-- clone -->
				<ContextMenu.Item on:click={cloneNode}>
					<Copy class="w-4 h-4 mr-2" />
					Clone
				</ContextMenu.Item>
				<ContextMenu.Item on:click={deleteNode}>
					<Trash class="w-4 h-4 mr-2" />
					Delete
				</ContextMenu.Item>
			{/if}
		</ContextMenu.Content>
	</ContextMenu.Root>
{/if}
