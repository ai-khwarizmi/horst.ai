<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import Button from '../ui/button/button.svelte';
	import { onMount } from 'svelte';
	import { createNewProject, loadCloudProject } from '@/project';
	import { recentProjectsOpen } from '@/index';
	import { fetchRecentProjects, previewImageFileNameToUrl } from '@/project/cloud';

	let recentProjects: {
		projectId: string;
		projectName: string;
		updatedAt: number;
		createdAt: number;
		previewImage: string;
	}[] = [];
	let loaded = false;

	onMount(async () => {
		recentProjectsOpen.subscribe(async (value) => {
			loaded = false;
			recentProjects = [];
			if (value) {
				try {
					const fetchedProjects = (await fetchRecentProjects()).filter((project: any) => {
						return project.projectId !== undefined;
					});
					fetchedProjects.sort((a: any, b: any) => b.updatedAt - a.updatedAt);
					recentProjects = fetchedProjects;
					loaded = true;
				} catch (error) {
					console.error('Failed to fetch recent projects:', error);
					// Optionally, set an error state here
				}
			}
		});
	});

	async function openProject(_projectId: string) {
		try {
			await loadCloudProject(_projectId, true);
			recentProjectsOpen.set(false);
		} catch (error) {
			console.error('Failed to load project:', error);
		}
	}

	function _createNewProject() {
		recentProjectsOpen.set(false);
		createNewProject();
	}

	function formatRelativeTime(timestamp: number): string {
		const now = Date.now();
		const diff = now - timestamp;
		const seconds = Math.floor(diff / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);
		const weeks = Math.floor(days / 7);
		const months = Math.floor(days / 30);

		if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
		if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
		if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
		if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
		if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
		return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
	}
</script>

{#if loaded}
	<Dialog.Root bind:open={$recentProjectsOpen}>
		<Dialog.Portal>
			<Dialog.Overlay />
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
							<div
								class="aspect-video bg-blue-200 rounded-md mb-2 flex items-center justify-center"
							>
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
									{#if project.previewImage}
										<img
											src={previewImageFileNameToUrl(project.previewImage)}
											alt="Project Preview"
										/>
									{/if}
								</div>
								<p class="text-sm font-medium truncate">{project.projectName}</p>
								<p class="text-xs text-gray-500">{formatRelativeTime(project.updatedAt)}</p>
							</button>
						{/each}
					</div>
				</div>
				<Dialog.Footer>
					<Button on:click={() => recentProjectsOpen.set(false)}>Close</Button>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Portal>
	</Dialog.Root>
{/if}
