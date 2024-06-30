<script lang="ts">
	import { cn, removeEdgeByIds } from '@/utils';
	import { edges, inputDataWithoutPlaceholder } from '..';
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
	import { onMount } from 'svelte';

	const HANDLE_WIDTH = 12;
	const c = useConnection();

	export let nodeId: string;
	export let type: 'input' | 'output';
	export let base: Input<string> | Output<string>;
	export let showOptionalInputs: boolean = true;
	export let setInputPlaceholderData: ((handleId: string, value: any) => void);
	export let getCurrentInputPlaceholderData: ((handleId: string) => any);

	let selectedOption = 'Select option';
	let searchTerm = '';
	let filteredOptions: string[] = [];
	let selectedIndex = -1;
	let isOpen = false;
	let tempInputValue = '';

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

	if ('input' in base && base.input?.default) {
		if (base.input.inputOptionType === 'dropdown') {
			selectedOption = base.input.default;
		} else if (base.input.inputOptionType === 'input-field') {
			tempInputValue = base.input.default;
		}
	}

	function fuzzySearch(query: string, text: string): boolean {
		const words = query.toLowerCase().split(/\s+/);
		return words.every((word) => text.toLowerCase().includes(word));
	}

	$: if ('input' in base && base.input && 'options' in base.input) {
		filteredOptions = (base.input.options as string[]).filter((option) =>
			fuzzySearch(searchTerm, option)
		);
	}

	function handleSelect(option: string) {
		selectedOption = option;
		searchTerm = '';
		selectedIndex = -1;
		isOpen = false;
		setInputPlaceholderData!(base.id, option);
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
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
				scrollToSelectedItem();
			} else if (event.key === 'ArrowUp' || (event.key === 'Tab' && event.shiftKey)) {
				event.preventDefault();
				selectedIndex = (selectedIndex - 1 + filteredOptions.length) % filteredOptions.length;
				scrollToSelectedItem();
			} else if (event.key === 'Enter') {
				if (selectedIndex !== -1) {
					handleSelect(filteredOptions[selectedIndex]);
				}
				isOpen = false;
			}
		} else if (event.key === 'Enter' || ((event.ctrlKey || event.metaKey) && event.key === 's')) {
			event.preventDefault();
			saveInputValue();
		}
	}

	function handleFocus() {
		if (selectedIndex === -1 && filteredOptions.length > 0) {
			selectedIndex = 0;
		}
	}

	let searchInput: HTMLInputElement;
	let dropdownContent: HTMLElement | null = null;

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

	function scrollToSelectedItem() {
		if (dropdownContent && selectedIndex !== -1) {
			const selectedItem = dropdownContent.querySelector(`[data-index="${selectedIndex}"]`);
			if (selectedItem instanceof HTMLElement) {
				selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
			}
		}
	}

	function handleInput(event: Event) {
		tempInputValue = (event.target as HTMLInputElement).value;
	}

	function saveInputValue() {
		setInputPlaceholderData(base.id, tempInputValue);
	}

	onMount(() => {
		//set defaults depending on type
		const currentValue = getCurrentInputPlaceholderData(base.id);
		if ('input' in base && base.input?.inputOptionType === 'dropdown' && currentValue) {
			selectedOption = currentValue;
		}
		if ('input' in base && base.input?.inputOptionType === 'input-field' && currentValue) {
			tempInputValue = currentValue;
		}
	})
</script>

<div
	style="flex-direction: {isInput ? 'row' : 'row-reverse'};"
	class="flex items-center mb-4 h-[40px] relative"
	class:hidden={canHideOptionalInput}
>
	<Handle
		type={isInput ? 'target' : 'source'}
		position={isInput ? Position.Left : Position.Right}
		class={cn('handle', connected.length ? '!bg-green-500' : '!bg-gray-500')}
		id={base.id}
		{isValidConnection}
		{onconnect}
		style={`
			position: absolute; // Changed from 'relative' to 'absolute'
			top: 50%; // Center vertically
			transform: translateY(-50%); // Adjust for exact centering
			${isInput ? 'left: 0;' : 'right: 0;'} // Position on the correct side
			${getStyle}
		`}
	/>
	<div
		class={cn(
			'w-full h-full flex items-center',
			isInput ? 'pl-4' : 'pr-4',
			canHideOptionalInput && 'hidden'
		)}
	>

		{#if isInput && 'input' in base && ($inputDataWithoutPlaceholder?.[nodeId]?.[base.id] === undefined || connected.length === 0)}
			<div class="flex flex-col w-full justify-center">
				<label class="text-xs text-muted-foreground" for="input-element"
					>{base.label} <span class="text-gray-500 bg-white">[{base.type}]</span></label
				>
				{#if base.input?.inputOptionType === 'dropdown'}
					<DropdownMenu bind:open={isOpen}>
						<DropdownMenuTrigger class="w-full">
							<Button
								size="sm"
								class="text-button w-full justify-between h-[24px] bg-white hover:bg-gray-100 text-black"
								id="input-element"
							>
								<span class="truncate">{selectedOption}</span>
								<ChevronDown class="flex-shrink-0 ml-2" size={16} />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							class="min-w-[120px] border border-border rounded-md bg-background shadow-md max-h-[200px] overflow-y-auto"
							on:keydown={handleKeyDown}
						>
							<div bind:this={dropdownContent} class="overflow-y-auto">
								<div class="p-2 sticky top-0 bg-background z-10">
									<input
										type="text"
										placeholder="Search..."
										bind:value={searchTerm}
										class="w-full p-1 text-sm border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring focus:ring-opacity-20"
										on:keydown={handleKeyDown}
										on:focus={handleFocus}
										bind:this={searchInput}
										use:focusSearchInput
									/>
								</div>
								<div>
									{#each filteredOptions as option, index}
										<div
											class={index === selectedIndex ? 'border-2 border-black' : ''}
											data-index={index}
										>
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
								</div>
							</div>
						</DropdownMenuContent>
					</DropdownMenu>
				{:else if base.input?.inputOptionType === 'input-field'}
					<input
						type="text"
						bind:value={tempInputValue}
						class="w-full p-1 text-sm border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring focus:ring-opacity-20 h-[24px]"
						placeholder="Enter value or connect"
						on:input={handleInput}
						on:blur={saveInputValue}
						on:keydown={handleKeyDown}
					/>
				{/if}
			</div>
		{:else}
			<div
				class="flex-grow flex flex-col w-full {isInput
					? 'items-start'
					: 'items-end'} justify-center h-full"
			>
				<span class="text-xs text-muted-foreground whitespace-nowrap">{base.label || ''}</span>
				<div class="text-sm font-medium w-full overflow-hidden">
					{#if connected.length === 0 && isInput}
						<span class="truncate block">...connect [{base.type}]</span>
					{:else if isInput}
						<span 
							class="truncate block whitespace-nowrap text-gray-700 text-sm" 
							title="{$inputDataWithoutPlaceholder?.[nodeId]?.[base.id]}"
						>
							{$inputDataWithoutPlaceholder?.[nodeId]?.[base.id]?.substring(0, 50)}
						</span>
					{:else}
						<span class="truncate block">[{base.type}]</span>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.selected-item {
		border: 2px solid black !important;
	}
</style>
