<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { toast } from 'svelte-sonner';
	import Button from '../ui/button/button.svelte';

	import { loadFromGraph, graphToImport } from '@/project';

	const importGraph = () => {
		if (!$graphToImport) {
			toast.error('No graph to import');
			return;
		}
		loadFromGraph($graphToImport);
	};
</script>

<Dialog.Root
	open={$graphToImport !== null}
	on:close={() => ($graphToImport = null)}
	closeOnOutsideClick={false}
>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Important Notice</Dialog.Title>
			<Dialog.Description>
				When importing graphs, prompts, or applications created by other users, please be aware of
				the following risks:
			</Dialog.Description>
		</Dialog.Header>
		<div class="flex flex-col gap-2 text-sm">
			<p>Project Details:</p>
			<ul class="list-disc pl-4">
				<li>Project Name: {$graphToImport?.projectName || 'N/A'}</li>
				<li>Number of Nodes: {$graphToImport?.nodes.length || 0}</li>
				<li>Number of Connections: {$graphToImport?.edges.length || 0}</li>
			</ul>
			<p class="mt-2">Please be aware of the following risks when importing:</p>
			<ul class="list-disc pl-4">
				<li>Security vulnerabilities</li>
				<li>Data privacy concerns</li>
				<li>Performance issues</li>
				<li>Compatibility problems</li>
				<li>Intellectual property considerations</li>
			</ul>
			<p>Review and test imported content carefully before use.</p>
		</div>
		<Dialog.Footer class="flex gap-2">
			<Dialog.Close asChild>
				<Button variant="outline" on:click={() => ($graphToImport = null)}>Cancel</Button>
				<Button on:click={importGraph}>Import</Button>
			</Dialog.Close>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
