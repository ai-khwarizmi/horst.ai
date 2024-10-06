<script lang="ts">
	import { page } from '$app/stores';
	import Header from '@/components/Header.svelte';
	import NewMain from '@/components/NewMain.svelte';
	import Button from '@/components/ui/button/button.svelte';
	import { PencilIcon, Save, Settings, Share } from 'lucide-svelte';
	import { beforeUpdate } from 'svelte';
	import * as Tabs from '@/components/ui/tabs';

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
	<Header>
		<Button variant="outline" class="mr-auto">
			{projectId}
			<PencilIcon class="w-4 h-4 ml-2" />
		</Button>
		<Tabs.Root value="editor">
			<Tabs.List>
				<Tabs.Trigger value="form">Interface</Tabs.Trigger>
				<Tabs.Trigger value="editor">Editor</Tabs.Trigger>
			</Tabs.List>
		</Tabs.Root>
		<div class="ml-auto flex items-center gap-2">
			<Button variant="secondary">
				Share
				<Share class="w-4 h-4 ml-2" />
			</Button>
			<Button variant="outline" size="icon">
				<Settings class="w-4 h-4" />
			</Button>
			<Button>
				Publish
				<Save class="w-4 h-4 ml-2" />
			</Button>
		</div>
	</Header>
	<NewMain {projectId} />
{/if}
