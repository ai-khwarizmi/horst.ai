<script lang="ts">
	import { browser } from '$app/environment';
	import * as Command from '$lib/components/ui/command';
	import type { CustomNodeName } from '@/nodes';
	import { addNode } from '@/utils';
	import { useSvelteFlow, type XYPosition } from '@xyflow/svelte';
	import {
		AlignLeft,
		Bot,
		BoxIcon,
		CalendarCog,
		GitCompareArrows,
		ImagePlus,
		ImageUp,
		TextCursor,
		TextCursorInput
	} from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { commandOpen } from '..';

	let mousePos: XYPosition = { x: 0, y: 0 };
	let pos: XYPosition | null = null;

	onMount(() => {
		function handleKeydown(e: KeyboardEvent) {
			// if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
			// 	e.preventDefault();
			// 	commandOpen.update((prev) => !prev);
			// }
			if (e.code === 'Space') {
				if (!$commandOpen) {
					e.preventDefault();
					commandOpen.set(true);
					pos = browser
						? screenToFlowPosition(mousePos)
						: {
								x: 0,
								y: 0
							};
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
		const center = screenToFlowPosition({
			x: window.innerWidth / 2,
			y: window.innerHeight / 2
		});
		// Do we want to place it where the cursor was previously?
		addNode(nodeType, center);
		commandOpen.set(false);
	};
</script>

<svelte:window on:mousemove={(e) => (mousePos = { x: e.clientX, y: e.clientY })} />

<Command.Dialog bind:open={$commandOpen}>
	<Command.Input placeholder="Search" />
	<Command.List>
		<Command.Empty>No results found.</Command.Empty>
		<!-- <Command.Group heading="Recently Used">
			<Command.Item onSelect={() => onSelect('textInput')}>Text Input</Command.Item>
			<Command.Item onSelect={() => onSelect('textDisplay')}>Text Display</Command.Item>
		</Command.Group> -->
		<Command.Group heading="Text">
			<Command.Item onSelect={() => onSelect('textInput')}>
				<TextCursorInput class="mr-2" />
				Text Input
			</Command.Item>
			<Command.Item onSelect={() => onSelect('textDisplay')}>
				<AlignLeft class="mr-2" />
				Text
			</Command.Item>
		</Command.Group>
		<Command.Group heading="Numbers">
			<Command.Item onSelect={() => onSelect('num2str')}>
				<GitCompareArrows class="mr-2" />
				Number to Text
			</Command.Item>
			<Command.Item onSelect={() => onSelect('num2date')}>
				<CalendarCog class="mr-2" />
				Number to Date
			</Command.Item>
		</Command.Group>
		<Command.Group heading="AI">
			<Command.Item onSelect={() => onSelect('chatGpt')}>
				<Bot class="mr-2" />
				Chat GPT
			</Command.Item>
			<Command.Item onSelect={() => onSelect('dalle3')}>
				<ImagePlus class="mr-2" />
				Dall-E 3
			</Command.Item>
		</Command.Group>
		<Command.Group heading="Miscellaneous">
			<Command.Item onSelect={() => onSelect('currentTime')}>Current Time</Command.Item>
		</Command.Group>
	</Command.List>
</Command.Dialog>
