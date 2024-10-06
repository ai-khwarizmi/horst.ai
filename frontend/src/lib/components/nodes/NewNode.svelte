<script lang="ts">
	import { Handle, Position } from '@xyflow/svelte';

	// export let id: string = '';
	// export let type: string = '';
	export let selected: boolean = false;
</script>

<div
	class="flex gap-2 items-center rounded-md border border-input bg-background p-2 {selected
		? 'border-primary'
		: ''}"
>
	<div class="h-10 w-10 flex items-center justify-center bg-gray-200 rounded-sm">
		<img src="https://static.horst.ai/openai-logomark.png" class="size-5" alt="" />
	</div>
	<div class="flex flex-col">
		<div class="text-sm font-medium">
			OpenAI
			<span class="text-xs text-muted-foreground"> (gpt-4o) </span>
		</div>
		<div class="text-xs text-muted-foreground">Generate a response to the user's message</div>
	</div>
</div>
<Handle position={Position.Left} type="source" />
<Handle position={Position.Right} type="target" />
