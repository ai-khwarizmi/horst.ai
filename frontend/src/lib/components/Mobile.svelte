<script lang="ts" context="module">
	import { writable } from 'svelte/store';

	export const isMobile = writable(false);
</script>

<script lang="ts">
	let innerWidth = 0;
	let innerHeight = 0;

	$: if (innerWidth < 768) {
		isMobile.set(true);
	} else {
		isMobile.set(false);
	}
</script>

<svelte:window bind:innerWidth bind:innerHeight />
