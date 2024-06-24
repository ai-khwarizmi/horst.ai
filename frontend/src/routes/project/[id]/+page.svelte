<script lang="ts">
	import Main from "@/components/Main.svelte";

	export let data: { projectId: string };
	const { projectId } = data;
</script>

<Main {projectId}></Main>
