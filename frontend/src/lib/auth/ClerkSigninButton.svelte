<script lang="ts">
	import Button from '@/components/ui/button/button.svelte';
	import { clerk, clerkLoaded, session, usesClerk } from './Clerk';

	function handleSignin() {
		$clerk?.openSignIn();
	}
</script>

{#if usesClerk && $clerkLoaded && !$session}
	<Button on:click={handleSignin}>Sign in</Button>
{/if}
