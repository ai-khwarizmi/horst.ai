<script lang="ts">
	import Button from '@/components/ui/button/button.svelte';
	import { clerk, clerkLoaded, session, usesClerk } from './Clerk';
	import { LogOut } from 'lucide-svelte';

	function handleSignout() {
		$clerk?.signOut();
	}
</script>

{#if usesClerk && $clerkLoaded && $session}
	<Button size="icon" variant="ghost" class="hover:text-red-500" on:click={handleSignout}>
		<LogOut class="size-3.5" />
	</Button>
{/if}
