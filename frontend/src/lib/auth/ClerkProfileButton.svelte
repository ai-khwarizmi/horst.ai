<script lang="ts">
	import Button from '@/components/ui/button/button.svelte';
	import { clerk, clerkLoaded, session, usesClerk } from './Clerk';
	import { User } from 'lucide-svelte';

	function handleProfile() {
		$clerk?.openUserProfile();
	}
</script>

{#if usesClerk && $clerkLoaded && $session}
	<Button
		size="icon"
		variant="outline"
		class="inline-fle item-center gap-2"
		on:click={handleProfile}
	>
		<User class="size-3.5" />
	</Button>
{/if}
