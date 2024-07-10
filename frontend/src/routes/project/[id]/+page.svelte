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

<div style="position:fixed; bottom:0;left:0;color:red;font-size:8px">projectId {projectId}</div>
