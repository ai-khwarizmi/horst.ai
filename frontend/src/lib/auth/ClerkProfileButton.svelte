<script lang="ts">
	import Button from '@/components/ui/button/button.svelte';
	import { clerk, clerkLoaded, session, usesClerk } from './Clerk';

	function handleProfile() {
		$clerk?.openUserProfile();
	}
</script>

{#if usesClerk && $clerkLoaded && $session}
	<Button class="inline-fle item-center gap-2" on:click={handleProfile}>Profile</Button>
{/if}
