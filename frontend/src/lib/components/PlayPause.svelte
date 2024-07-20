<script lang="ts">
	import { Play, Square, RotateCcw } from 'lucide-svelte';
	import Button from './ui/button/button.svelte';
	import { cn } from '$lib/utils.js';
	import { resetDynamicState, state, projectId } from '$lib';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { get } from 'svelte/store';

	const AUTO_PLAY_KEY_PREFIX = 'horst.ai.auto.play.enabled_';

	$: isPlaying = $state.isPlaying;
	$: autoPlay = $state.autoPlay;

	function saveAutoPlayState(projectId: string, value: boolean) {
		if (browser) {
			localStorage.setItem(`${AUTO_PLAY_KEY_PREFIX}${projectId}`, JSON.stringify(value));
		}
	}

	function getAutoPlayState(projectId: string): boolean {
		if (browser) {
			const savedState = localStorage.getItem(`${AUTO_PLAY_KEY_PREFIX}${projectId}`);
			return savedState ? JSON.parse(savedState) : false;
		}
		return false;
	}

	onMount(() => {
		return projectId.subscribe((currentProjectId) => {
			state.update((s) => {
				s.autoPlay.set(getAutoPlayState(currentProjectId));
				if (get(s.autoPlay)) s.isPlaying.set(false);
				return s;
			});
		});
	});

	$: if (browser && $autoPlay !== undefined) {
		saveAutoPlayState($projectId, $autoPlay);
		if ($autoPlay) $state.isPlaying.set(false);
	}
</script>

<div class="play-pause-component flex items-center gap-2 play-pause-no-select">
	<label
		class="relative inline-flex items-center cursor-pointer mr-2 px-3 py-2 rounded-md bg-background hover:bg-accent transition-colors border border-input"
	>
		<input type="checkbox" class="sr-only peer" bind:checked={$autoPlay} />
		<div
			class="relative w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"
		></div>
		<span class="ml-3 text-sm font-medium text-foreground {$autoPlay ? 'pl-5 pr-7' : ''}">
			Auto
			{#if $autoPlay}
				<div
					class="absolute inset-0 border-2 border-green-500 animate-glow-border rounded-md"
				></div>
			{/if}
		</span>
	</label>

	{#if !$autoPlay}
		<div class="relative">
			<Button
				variant="outline"
				size="icon"
				on:click={() => $state.isPlaying.set(true)}
				disabled={$isPlaying}
				class={cn(
					'bg-background hover:bg-accent hover:text-accent-foreground',
					$isPlaying ? 'text-muted-foreground' : 'text-primary'
				)}
			>
				<Play class={cn('h-4 w-4', !$isPlaying && 'text-green-500')} />
			</Button>
			{#if $isPlaying}
				<div
					class="absolute inset-0 border-2 border-green-500 animate-spin-border rounded-md"
				></div>
			{/if}
		</div>
	{/if}

	<Button
		variant="outline"
		size="icon"
		on:click={() => {
			$state.isPlaying.set(false);
			$state.autoPlay.set(false);
		}}
		disabled={!$isPlaying && !$autoPlay}
		class={cn(
			'bg-background hover:bg-accent hover:text-accent-foreground',
			!$isPlaying && !$autoPlay ? 'text-muted-foreground' : 'text-primary'
		)}
	>
		<Square class={cn('h-4 w-4', ($isPlaying || $autoPlay) && 'text-red-500')} />
	</Button>

	<Button
		variant="outline"
		size="icon"
		on:click={resetDynamicState}
		class="bg-background hover:bg-accent hover:text-accent-foreground text-primary"
	>
		<RotateCcw class="h-4 w-4" />
	</Button>
</div>

<style>
	@keyframes spin-border {
		0% {
			clip-path: inset(0 0 95% 0);
		}
		25% {
			clip-path: inset(0 0 0 95%);
		}
		50% {
			clip-path: inset(95% 0 0 0);
		}
		75% {
			clip-path: inset(0 95% 0 0);
		}
		100% {
			clip-path: inset(0 0 95% 0);
		}
	}

	@keyframes glow-border {
		0%,
		100% {
			box-shadow: 0 0 2px 1px rgba(34, 197, 94, 0.2);
		}
		25% {
			box-shadow: 0 0 4px 2px rgba(34, 197, 94, 0.4);
		}
		50% {
			box-shadow: 0 0 6px 3px rgba(34, 197, 94, 0.6);
		}
		75% {
			box-shadow: 0 0 4px 2px rgba(34, 197, 94, 0.4);
		}
	}

	.play-pause-component :global(.animate-spin-border) {
		animation: spin-border 1.5s linear infinite;
	}

	.play-pause-component :global(.animate-glow-border) {
		animation: glow-border 3s ease-in-out infinite;
	}

	.play-pause-no-select {
		user-select: none;
	}

	.play-pause-component :global(input[type='checkbox']:focus) {
		outline: none;
	}
</style>
