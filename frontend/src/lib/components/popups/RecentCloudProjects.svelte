<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { writable } from 'svelte/store';
	import Button from '../ui/button/button.svelte';
	import type { CloudSaveFileFormat } from '@/types';
	import { onMount } from 'svelte';
	import { createNewProject } from '@/project';

	let recentProjectsOpen = writable(false);

	export const openRecentProjectsPopup = () => {
		recentProjectsOpen.set(true);
	};

	let recentProjects: CloudSaveFileFormat[] = [];

	onMount(() => {
		// Add 5-10 test projects
		const testProjectCount = Math.floor(Math.random() * 6) + 5; // 5 to 10 projects
		for (let i = 0; i < testProjectCount; i++) {
			recentProjects.push({
				projectType: 'CLOUD',
				projectId: `test-${i}`,
				projectName: `Test Project ${i + 1}`,
				edges: [],
				nodes: [],
				viewport: { x: 0, y: 0, zoom: 1 },
				inputDataPlaceholder: { inputs: [], outputs: [] },
				nonce: 123,
				optionalInputsEnabled: {},
				outputDataPlaceholder: { inputs: [], outputs: [] },
				version: '1'
			});
		}
		recentProjects = recentProjects;
	});

	function openProject(_projectId: string) {
		throw new Error('Not implemented');
	}

	function _createNewProject() {
		recentProjectsOpen.set(false);
		createNewProject();
	}
</script>

<Dialog.Root bind:open={$recentProjectsOpen}>
	<Dialog.Content class="w-full max-w-3xl max-h-[95vh] flex flex-col">
		<Dialog.Header>
			<Dialog.Title>Recent Projects</Dialog.Title>
		</Dialog.Header>
		<div class="flex-grow overflow-y-auto">
			<div class="grid grid-cols-3 gap-4 p-4">
				<button
					class="project-item text-left cursor-pointer hover:bg-gray-200 rounded-lg p-2 bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50"
					on:click={_createNewProject}
				>
					<div class="aspect-video bg-blue-200 rounded-md mb-2 flex items-center justify-center">
						<span class="text-4xl text-blue-500">+</span>
					</div>
					<p class="text-sm font-medium truncate">New Project</p>
					<p class="text-xs text-gray-500">Create a new project</p>
				</button>
				{#each recentProjects as project}
					<button
						class="project-item text-left cursor-pointer hover:bg-gray-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50"
						on:click={() => openProject(project.projectId)}
					>
						<div class="aspect-video bg-gray-200 rounded-md mb-2">
							<!-- Placeholder for project image -->
						</div>
						<p class="text-sm font-medium truncate">{project.projectName}</p>
						<p class="text-xs text-gray-500">Edited 2 days ago</p>
					</button>
				{/each}
			</div>
		</div>
		<Dialog.Footer>
			<Button on:click={() => recentProjectsOpen.set(false)}>Close</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
