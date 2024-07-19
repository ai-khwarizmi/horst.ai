<script lang="ts">
	import CalendarIcon from 'lucide-svelte/icons/calendar';
	import { DateFormatter, type DateValue, getLocalTimeZone } from '@internationalized/date';
	import { NodeIOHandler, cn } from '$lib/utils.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Calendar } from '$lib/components/ui/calendar/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import CustomNode from '@/components/CustomNode.svelte';

	export let id: string;

	const io = new NodeIOHandler({
		nodeId: id,
		inputs: [],
		outputs: [{ id: 'text', type: 'text' }],
		onExecute: async () => {},
		isInputUnsupported: () => Promise.resolve({ unsupported: false }),
		resetDynamicState: () => {}
	});

	let value: DateValue | undefined = undefined;
	const df = new DateFormatter('en-US', {
		dateStyle: 'long'
	});
	$: date = value ? value.toDate(getLocalTimeZone()) : null;

	$: io.setOutputDataPlaceholder('text', date ? df.format(date) : null);
</script>

<CustomNode {io} {...$$props}>
	<Popover.Root>
		<Popover.Trigger asChild let:builder>
			<Button
				variant="outline"
				class={cn(
					'w-[280px] justify-start text-left font-normal',
					!value && 'text-muted-foreground'
				)}
				builders={[builder]}
			>
				<CalendarIcon class="mr-2 h-4 w-4" />
				{value ? df.format(value.toDate(getLocalTimeZone())) : 'Pick a date'}
			</Button>
		</Popover.Trigger>
		<Popover.Content class="w-auto p-0">
			<Calendar bind:value initialFocus />
		</Popover.Content>
	</Popover.Root>
</CustomNode>
