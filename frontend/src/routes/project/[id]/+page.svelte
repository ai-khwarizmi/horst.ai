<script lang="ts">
	import { page } from '$app/stores';
	import Main from '@/components/Main.svelte';
	import { beforeUpdate } from 'svelte';

	let loaded = false;
	let projectId: string | undefined;

	$: {
		projectId = $page.params.id;
	}

	beforeUpdate(() => {
		projectId = $page.params.id;
		loaded = true;
	});
</script>

{#if loaded}
	<Main {projectId} />
{/if}
