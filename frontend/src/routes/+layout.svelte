<script lang="ts">
	import '../app.css';
	import '@xyflow/svelte/dist/style.css';
	import { Toaster } from '$lib/components/ui/sonner';
	import Mobile from '@/components/Mobile.svelte';
	import { attemptClerkInit, clerkLoaded, usesClerk } from '@/auth/Clerk';
	import { onMount } from 'svelte';
	import ImportModal from '@/components/import/ImportModal.svelte';

	onMount(() => {
		attemptClerkInit();
	});
</script>

<!-- Utils -->
{#if !usesClerk || $clerkLoaded}
	<Toaster />
	<Mobile />
	<ImportModal />

	<slot />
{:else}
	<!-- LOADER -->
{/if}
