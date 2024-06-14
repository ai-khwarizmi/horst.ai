<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { PlusIcon } from 'lucide-svelte';
	import Button from './ui/button/button.svelte';
	import type { CustomNodeName } from '@/nodes';
	import { nodes } from '..';

	import { useSvelteFlow } from '@xyflow/svelte';

	const { screenToFlowPosition } = useSvelteFlow();

	const addNode = (type: CustomNodeName) => {
		const { x, y } = screenToFlowPosition({
			x: window.innerWidth / 2,
			y: window.innerHeight / 2
		});
		nodes.update((prev) => {
			prev.push({
				id: Math.random().toString(36).substr(2, 9),
				type,
				data: {},
				position: {
					x,
					y
				}
			});
			return prev;
		});
	};
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		<Button size="lg">
			<PlusIcon class="mr-2" />
			Add Node
		</Button>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content>
		<DropdownMenu.Group>
			<DropdownMenu.Label>Add Nodes</DropdownMenu.Label>
			<DropdownMenu.Separator />
			<DropdownMenu.Sub>
				<DropdownMenu.SubTrigger>Text</DropdownMenu.SubTrigger>
				<DropdownMenu.SubContent>
					<DropdownMenu.Item on:click={() => addNode('textInput')}>Text Input</DropdownMenu.Item>
					<DropdownMenu.Item on:click={() => addNode('textDisplay')}>
						Text Display
					</DropdownMenu.Item>
				</DropdownMenu.SubContent>
			</DropdownMenu.Sub>
			<DropdownMenu.Sub>
				<DropdownMenu.SubTrigger>Numbers</DropdownMenu.SubTrigger>
				<DropdownMenu.SubContent>
					<DropdownMenu.Item on:click={() => addNode('num2str')}>Number to Text</DropdownMenu.Item>
					<DropdownMenu.Item on:click={() => addNode('num2date')}>Number to Date</DropdownMenu.Item>
				</DropdownMenu.SubContent>
			</DropdownMenu.Sub>
			<DropdownMenu.Sub>
				<DropdownMenu.SubTrigger>AI</DropdownMenu.SubTrigger>
				<DropdownMenu.SubContent>
					<DropdownMenu.Item on:click={() => addNode('chatGpt')}>ChatGPT</DropdownMenu.Item>
					<DropdownMenu.Item on:click={() => addNode('dalle3')}>Dall-E 3</DropdownMenu.Item>
				</DropdownMenu.SubContent>
			</DropdownMenu.Sub>
			<DropdownMenu.Separator />
			<DropdownMenu.Sub>
				<DropdownMenu.SubTrigger>Miscellaneous</DropdownMenu.SubTrigger>
				<DropdownMenu.SubContent>
					<DropdownMenu.Item on:click={() => addNode('currentTime')}>
						Current Time
					</DropdownMenu.Item>
				</DropdownMenu.SubContent>
			</DropdownMenu.Sub>
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>
