<script lang="ts">
	import Button from '@/components/ui/button/button.svelte';
	import { clerk, clerkLoaded, session, usesClerk } from './Clerk';

	function handleSignout() {
		$clerk?.signOut();
	}
</script>

{#if usesClerk && $clerkLoaded && $session}
	<Button on:click={handleSignout}>Sign out</Button>
{/if}
