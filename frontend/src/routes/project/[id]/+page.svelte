<script lang="ts">
	import { page } from '$app/stores';
	import Main from '@/components/Main.svelte';

	$: projectId = $page.params.id;
</script>

<Main {projectId}></Main>
