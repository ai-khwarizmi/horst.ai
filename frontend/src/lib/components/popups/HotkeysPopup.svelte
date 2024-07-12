<script lang="ts" context="module">
	import { writable } from 'svelte/store';

	let open = writable(false);

	export function openHotkeysPopup() {
		open.set(true);
	}
</script>

<script lang="ts">
	import { useSvelteFlow } from '@xyflow/svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { get } from 'svelte/store';
	import { commandOpen, inputDataPlaceholder, outputDataPlaceholder, state } from '$lib';
	import { nodes, edges } from '$lib';
	import type { Edge, Node } from '@xyflow/svelte';
	import Button from '$lib/components/ui/button/button.svelte';

	const { screenToFlowPosition } = useSvelteFlow();

	const isMac = navigator.userAgent.match('Mac');
	const cmdKey = isMac ? '⌘' : 'Ctrl';

	const hotkeys = {
		openHotkeysMenu: {
			key: '.',
			modifier: 'ctrlOrCmd',
			description: 'Open hotkeys menu'
		},
		openCommandPalette: {
			key: ['Space', '/'],
			modifier: 'ctrlOrCmd',
			description: 'Open node palette'
		},
		closeCommandPalette: { key: 'Escape', description: 'Close node palette' },
		selectAllNodes: { key: 'a', modifier: 'ctrlOrCmd', description: 'Select all nodes' },
		copySelectedNodes: { key: 'c', modifier: 'ctrlOrCmd', description: 'Copy selected nodes' },
		pasteNodes: { key: 'v', modifier: 'ctrlOrCmd', description: 'Paste copied nodes' }
	} as Record<string, { key: string | string[]; modifier?: string; description: string }>;

	const hotkeyCategories = [
		{
			name: 'General',
			keys: ['openHotkeysMenu', 'openCommandPalette', 'closeCommandPalette', 'selectAllNodes']
		},
		{
			name: 'Clipboard',
			keys: ['copySelectedNodes', 'pasteNodes']
		}
	];

	export const handleKeyDown = (e: KeyboardEvent) => {
		handleHotkeysMenu(e);
		handleCommandOpen(e);
		handleCopyPaste(e);
		handleSelectAll(e);
	};

	const handleHotkeysMenu = (e: KeyboardEvent) => {
		if (e.key === hotkeys.openHotkeysMenu.key && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			open.set(true);
		}
	};

	const handleCommandOpen = (e: KeyboardEvent) => {
		const { activeElement } = document;
		if (
			activeElement &&
			(activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')
		) {
			return;
		}

		const openCommandKeys = Array.isArray(hotkeys.openCommandPalette.key)
			? hotkeys.openCommandPalette.key
			: [hotkeys.openCommandPalette.key];

		if (openCommandKeys.includes(e.key) && (e.metaKey || e.ctrlKey)) {
			const open = get(commandOpen);
			if (!open) {
				e.preventDefault();
				commandOpen.set(true);
			}
		}
		if (e.key === hotkeys.closeCommandPalette.key) {
			e.preventDefault();
			commandOpen.set(false);
		}
	};

	const handleCopyPaste = (e: KeyboardEvent) => {
		const nodeList = get(nodes);
		const edgeList = get(edges);
		const placeholderInputData = get(inputDataPlaceholder);
		const placeholderOutputData = get(outputDataPlaceholder);

		if ((e.ctrlKey || e.metaKey) && e.key === hotkeys.copySelectedNodes.key) {
			e.preventDefault();
			const selectedNodes = nodeList.filter((node) => node.selected);
			const selectedNodeIds = selectedNodes.map((node) => node.id);
			const selectedEdges = edgeList.filter(
				(edge) => selectedNodeIds.includes(edge.source) || selectedNodeIds.includes(edge.target)
			);

			// Calculate the center of the selected nodes
			const centerX =
				selectedNodes.reduce((sum, node) => sum + node.position.x, 0) / selectedNodes.length;
			const centerY =
				selectedNodes.reduce((sum, node) => sum + node.position.y, 0) / selectedNodes.length;

			// Store nodes with positions relative to their center
			const relativeNodes = selectedNodes.map((node) => ({
				...node,
				position: {
					x: node.position.x - centerX,
					y: node.position.y - centerY
				}
			}));

			const clipboardData = {
				nodes: relativeNodes,
				edges: selectedEdges,
				placeholderInputData: selectedNodes.reduce(
					(acc, node) => {
						if (placeholderInputData[node.id]) {
							acc[node.id] = placeholderInputData[node.id];
						}
						return acc;
					},
					{} as Record<string, any>
				),
				placeholderOutputData: selectedNodes.reduce(
					(acc, node) => {
						if (placeholderOutputData[node.id]) {
							acc[node.id] = placeholderOutputData[node.id];
						}
						return acc;
					},
					{} as Record<string, any>
				)
			};

			navigator.clipboard.writeText(JSON.stringify(clipboardData));
		}

		if ((e.ctrlKey || e.metaKey) && e.key === hotkeys.pasteNodes.key) {
			e.preventDefault();
			navigator.clipboard.readText().then((text) => {
				try {
					const pastedData = JSON.parse(text);
					if (pastedData.nodes && Array.isArray(pastedData.nodes)) {
						const idMap = new Map<string, string>();
						const screenCenter = {
							x: window.innerWidth / 2,
							y: window.innerHeight / 2
						};
						const flowCenter = screenToFlowPosition(screenCenter);

						const newNodes = pastedData.nodes.map((node: Node) => {
							const newId = crypto.randomUUID();
							idMap.set(node.id, newId);
							const newPosition = {
								x: flowCenter.x + node.position.x,
								y: flowCenter.y + node.position.y
							};
							return {
								...node,
								id: newId,
								position: newPosition
							};
						});
						nodes.update((n) => [...n, ...newNodes]);

						if (pastedData.edges && Array.isArray(pastedData.edges)) {
							const newEdges = pastedData.edges.map((edge: Edge) => {
								const newSourceId = idMap.get(edge.source) || '';
								const newTargetId = idMap.get(edge.target) || '';
								return {
									...edge,
									id: crypto.randomUUID(),
									source: newSourceId,
									target: newTargetId
								};
							});
							edges.update((e) => [...e, ...newEdges]);
						}
						if (pastedData.placeholderInputData || pastedData.placeholderOutputData) {
							state.update((currentState) => {
								const newInputPlaceholderData = { ...currentState.inputDataPlaceholder };
								const newOutputPlaceholderData = { ...currentState.outputDataPlaceholder };
								Object.entries(
									pastedData.placeholderInputData as Record<string, Record<string, any>>
								).forEach(([oldId, data]) => {
									const newId = idMap.get(oldId);
									if (newId) {
										newInputPlaceholderData[newId] = data;
									}
								});
								Object.entries(
									pastedData.placeholderOutputData as Record<string, Record<string, any>>
								).forEach(([oldId, data]) => {
									const newId = idMap.get(oldId);
									if (newId) {
										newOutputPlaceholderData[newId] = data;
									}
								});
								return {
									...currentState,
									inputDataPlaceholder: newInputPlaceholderData,
									outputDataPlaceholder: newOutputPlaceholderData
								};
							});
						}
					}
				} catch (error) {
					console.error('Failed to paste nodes/edges:', error);
				}
			});
		}
	};

	const handleSelectAll = (e: KeyboardEvent) => {
		if ((e.ctrlKey || e.metaKey) && e.key === hotkeys.selectAllNodes.key) {
			const { activeElement } = document;
			if (
				activeElement &&
				(activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')
			) {
				return;
			}
			e.preventDefault();
			nodes.update((nodeList) => nodeList.map((node) => ({ ...node, selected: true })));
		}
	};
</script>

<svelte:document on:keydown={handleKeyDown} />

<Dialog.Root bind:open={$open}>
	<Dialog.Content class="w-[900px]">
		<Dialog.Header>
			<Dialog.Title>Keyboard Shortcuts</Dialog.Title>
		</Dialog.Header>
		<div class="grid grid-cols-2 gap-8">
			{#each hotkeyCategories as category}
				<div>
					<h3 class="font-semibold mb-2 text-sm text-muted-foreground">{category.name}</h3>
					<div class="space-y-2">
						{#each category.keys as key}
							<div class="flex justify-between items-center">
								<span>{hotkeys[key].description}</span>
								<kbd
									class="px-2 py-1 rounded bg-secondary text-secondary-foreground text-xs whitespace-nowrap"
								>
									{#if hotkeys[key].modifier}
										{cmdKey} +
									{/if}
									{[hotkeys[key].key].flat()[0]}
								</kbd>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
		<Dialog.Footer>
			<Dialog.Close>
				<Button class="bg-primary text-primary-foreground hover:bg-primary/90">Close</Button>
			</Dialog.Close>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
