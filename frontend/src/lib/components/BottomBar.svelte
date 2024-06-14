<script lang="ts">
	import { PlusIcon } from 'lucide-svelte';
	import Button from './ui/button/button.svelte';
	import { commandOpen } from '..';
</script>

<Button size="lg" on:click={() => commandOpen.set(true)}>
	<PlusIcon class="mr-2" />
	Add Node
</Button>
