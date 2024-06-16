<script lang="ts">
	import { page } from '$app/stores';
	import * as Card from '$lib/components/ui/card';

	$: open = $page.url.searchParams.has('debug');
</script>

{#if open}
	<Card.Root
		class="fixed z-50 right-4 min-w-40 max-w-96 p-2 flex flex-col gap-2 top-1/2 -translate-y-1/2"
	>
		<div class="font-bold text-center leading-none">Debug</div>
		<hr />
		<!-- change the debug to whatever you want :) -->
	</Card.Root>
{/if}
