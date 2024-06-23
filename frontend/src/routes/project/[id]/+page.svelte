<script lang="ts">
	import Main from "@/components/Main.svelte";

	export let data: { projectId: string };
	const { projectId } = data;
	console.log('Received projectId in +page.svelte:', projectId); 
</script>

<Main {projectId}></Main>
