<script lang="ts">
	import { cn, removeEdgeByIds } from '@/utils';
	import { edges } from '..';
	import type { Input, Output } from '@/types';
	import { Handle, Position, useConnection, type Connection } from '@xyflow/svelte';
	import { get } from 'svelte/store';
	import { isValidConnection } from '@/utils/validate';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';
	import { ChevronDown } from 'lucide-svelte';
	import Button from './ui/button/button.svelte';

	const HANDLE_WIDTH = 12;

	export let nodeId: string;
	export let type: 'input' | 'output';
	export let base: Input<string> | Output<string>;
	export let showOptionalInputs: boolean = true;

	$: isInput = type === 'input';

	$: connections =
		type === 'output'
			? $edges.filter((edge) => edge.source === nodeId)
			: $edges.filter((edge) => edge.target === nodeId);

	$: connected = connections.filter((edge) =>
		type === 'output' ? edge.sourceHandle === base.id : edge.targetHandle === base.id
	);

	const onconnect = (connections: Connection[]) => {
		const edgesToRemove: string[] = [];
		for (const connection of connections) {
			const conn: Connection & { edgeId?: string } = connection;
			const e = get(edges);
			if (!e) return;
			const edge = e.filter(
				(edge) =>
					edge.target === conn.target &&
					edge.targetHandle === conn.targetHandle &&
					edge.id !== conn.edgeId
			);
			edgesToRemove.push(...edge.map((edge) => edge.id));
		}
		removeEdgeByIds(...edgesToRemove);
	};

	const c = useConnection();

	$: shouldDimHandle =
		$c.startHandle?.handleId &&
		$c.startHandle.nodeId !== nodeId &&
		!isValidConnection({
			source: $c.startHandle.type === 'source' ? $c.startHandle.nodeId : nodeId,
			sourceHandle: $c.startHandle.type === 'source' ? $c.startHandle.handleId : base.id,
			target: $c.startHandle.type === 'source' ? nodeId : $c.startHandle.nodeId,
			targetHandle: $c.startHandle.type === 'source' ? base.id : $c.startHandle.handleId
		});

	$: canHideOptionalInput = base.optional && !showOptionalInputs && connected.length === 0;

	$: getStyle = `
		${
			canHideOptionalInput
				? `
			display: none !important;
			visibility: hidden !important;
		`
				: `
			opacity: ${shouldDimHandle ? 0.3 : 1};
			height: 30px;
			width: ${HANDLE_WIDTH}px;
			border-radius: ${HANDLE_WIDTH / 2}px;
		`
		}
	`;

	let selectedOption = 'Select option';
	let searchTerm = '';
	let filteredOptions: string[] = [];
	let selectedIndex = -1;
	let isOpen = false;

	if ('input' in base && base.input?.default) {
		selectedOption = base.input.default;
	}

	function fuzzySearch(query: string, text: string): boolean {
		const words = query.toLowerCase().split(/\s+/);
		return words.every((word) => text.toLowerCase().includes(word));
	}

	$: if ('input' in base && base.input?.options) {
		filteredOptions = base.input.options.filter((option) => fuzzySearch(searchTerm, option));
	}

	function handleSelect(option: string) {
		selectedOption = option;
		searchTerm = '';
		selectedIndex = -1;
		isOpen = false;
	}

	function handleKeyDown(event: KeyboardEvent) {
		console.log('event', event.key);
		if (event.key === 'Escape') {
			console.log('Escape');
			event.preventDefault();
			isOpen = false;
			searchTerm = '';
			selectedIndex = -1;
			return;
		}

		if (isOpen) {
			event.stopPropagation();
			if (event.key === 'ArrowDown' || (event.key === 'Tab' && !event.shiftKey)) {
				event.preventDefault();
				selectedIndex = (selectedIndex + 1) % filteredOptions.length;
			} else if (event.key === 'ArrowUp' || (event.key === 'Tab' && event.shiftKey)) {
				event.preventDefault();
				selectedIndex = (selectedIndex - 1 + filteredOptions.length) % filteredOptions.length;
			} else if (event.key === 'Enter') {
				if (selectedIndex !== -1) {
					handleSelect(filteredOptions[selectedIndex]);
				}
				isOpen = false;
			}
		}
	}

	function handleFocus() {
		if (selectedIndex === -1 && filteredOptions.length > 0) {
			selectedIndex = 0;
		}
	}

	let searchInput: HTMLInputElement;

	const focusSearchInput = (node: HTMLInputElement) => {
		if (isOpen) {
			node.focus();
		}
	};

	$: if (isOpen) {
		setTimeout(() => {
			searchInput?.focus();
		}, 0);
	}
</script>

<div
	style="flex-direction: {isInput ? 'row' : 'row-reverse'};"
	class="handle-container mb-4"
	class:optional-input-hidden={canHideOptionalInput}
>
	<Handle
		type={isInput ? 'target' : 'source'}
		position={isInput ? Position.Left : Position.Right}
		class={cn('handle', connected.length ? '!bg-green-500' : '!bg-gray-500')}
		id={base.id}
		{isValidConnection}
		{onconnect}
		style={`
			position: relative;
			${getStyle}
		`}
	/>
	<div
		class={cn(
			'w-full flex items-center',
			isInput ? 'pl-2' : 'pr-2',
			canHideOptionalInput && 'optional-input-hidden'
		)}
		style="text-align: {isInput ? 'left' : 'right'};"
	>
		<div class="flex-grow">
			{#if base.label}
				{base.label} ({base.type})
			{:else if 'input' in base}
				{base.type}
			{/if}
		</div>

		{#if isInput && 'input' in base}
			{#if base.input?.inputOptionType === 'dropdown'}
				<div class="custom-dropdown-wrapper ml-2">
					<DropdownMenu bind:open={isOpen}>
						<DropdownMenuTrigger class="dropdown-trigger">
							<Button size="flat" class="text-button w-full justify-between">
								<span>{selectedOption}</span>
								<ChevronDown class="dropdown-arrow" size={16} />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent class="dropdown-menu-content" on:keydown={handleKeyDown}>
							<div class="search-container">
								<input
									type="text"
									placeholder="Search..."
									bind:value={searchTerm}
									class="search-input"
									on:keydown={handleKeyDown}
									on:focus={handleFocus}
									bind:this={searchInput}
									use:focusSearchInput
								/>
							</div>
							{#each filteredOptions as option, index}
								<div class={index === selectedIndex ? 'selected-item' : ''}>
									<DropdownMenuItem
										on:click={() => handleSelect(option)}
										on:keydown={(e) => {
											if (e.key === 'Enter') {
												handleSelect(option);
											}
										}}
									>
										{option}
									</DropdownMenuItem>
								</div>
							{/each}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			{/if}
		{/if}
	</div>
</div>

<style>
	.optional-input-hidden {
		display: none !important;
		visibility: hidden !important;
	}
	.handle-container {
		display: flex;
		align-items: center;
	}

	.custom-dropdown-wrapper {
		flex-shrink: 0;
	}

	.dropdown-trigger {
		width: 100%;
	}

	.dropdown-arrow {
		flex-shrink: 0;
		margin-left: 0.5rem;
	}

	.custom-dropdown-wrapper :global(.dropdown-menu-content) {
		min-width: 120px;
		border: 1px solid var(--border, #ccc);
		border-radius: 4px;
		background-color: var(--background, white);
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		max-height: 200px;
		overflow-y: auto;
	}

	.search-container {
		padding: 0.5rem;
	}

	.search-input {
		width: 100%;
		padding: 0.25rem 0.5rem;
		border: 1px solid var(--border, #ccc);
		border-radius: 4px;
		font-size: 0.875rem;
		background-color: var(--background, white);
		color: var(--foreground, #333);
	}

	.search-input::placeholder {
		color: var(--muted-foreground, #999);
	}

	.search-input:focus {
		outline: none;
		border-color: var(--ring, #d4b3ff);
		box-shadow: 0 0 0 2px rgba(212, 179, 255, 0.2);
	}

	.selected-item {
		border: 2px solid black !important;
	}
</style>
