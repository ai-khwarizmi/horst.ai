<script lang="ts">
	import { PlusIcon } from 'lucide-svelte';
	import Button from './ui/button/button.svelte';
	import { commandOpen } from '..';
</script>

<div class="flex flex-col items-center gap-2">
	<div class="text-gray-500 text-xs">
		Press <kbd>Space</kbd> to add a node
	</div>
	<Button size="lg" on:click={() => commandOpen.set(true)}>
		<PlusIcon class="mr-2" />
		Add Node
	</Button>
</div>
