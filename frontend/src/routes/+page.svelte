<script lang="ts">
	import Header from '@/components/Header.svelte';
	import RecentCloudProjects from '@/components/popups/RecentCloudProjects.svelte';
	import Button from '@/components/ui/button/button.svelte';
	import { onMount } from 'svelte';

	onMount(() => {});

	let projectCount: number;
	let MAX_PROJECTS = 1;
</script>

<Header>
	<h1 class="text-xl font-semibold">
		My projects
		<span class="text-muted-foreground text-sm">({projectCount}/{MAX_PROJECTS})</span>
	</h1>
	<Button size="sm" variant="default" class="text-xs h-8">Upgrade</Button>
	<div class="ml-auto flex gap-2">
		<Button>Create a new project</Button>
		<Button variant="outline">Import a project</Button>
	</div>
</Header>

<RecentCloudProjects bind:projectCount />
