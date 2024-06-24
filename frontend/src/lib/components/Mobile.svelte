<script lang="ts" context="module">
	import { writable } from 'svelte/store';

	import { browser } from '$app/environment';

	export const isMobile = writable(false);
</script>

<script lang="ts">
	let innerWidth = browser ? window.innerWidth : 0;
	let innerHeight =  browser ? window.innerHeight : 0;

	$: if (innerWidth < 768) {
		isMobile.set(true);
	} else {
		isMobile.set(false);
	}
</script>

<svelte:window bind:innerWidth bind:innerHeight />
