<script lang="ts">
	import { Play, Square, RotateCcw } from 'lucide-svelte';
	import Button from './ui/button/button.svelte';
	import { writable } from 'svelte/store';
	import { cn } from '$lib/utils.js';

	const isPlaying = writable(false);
	const autoPlay = writable(false);

	function startPlay() {
		isPlaying.set(true);
	}

	function stopPlay() {
		isPlaying.set(false);
	}

	function restart() {
		isPlaying.set(false);
		setTimeout(startPlay, 0);
	}

	$: if ($autoPlay) {
		console.log('Auto-play enabled');
	} else {
		console.log('Auto-play disabled');
	}
</script>

<div class="flex items-center gap-2">
	<label
		class="inline-flex items-center cursor-pointer mr-2 px-3 py-2 rounded-md bg-background hover:bg-accent transition-colors border border-input"
	>
		<input type="checkbox" class="sr-only peer" bind:checked={$autoPlay} />
		<div
			class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"
		></div>
		<span class="ml-3 text-sm font-medium text-foreground">Auto</span>
	</label>

	<div class="relative">
		<Button
			variant="outline"
			size="icon"
			on:click={startPlay}
			disabled={$isPlaying}
			class={cn(
				'bg-background hover:bg-accent hover:text-accent-foreground',
				$isPlaying ? 'text-muted-foreground' : 'text-primary'
			)}
		>
			<Play class={cn('h-4 w-4', !$isPlaying && 'text-green-500')} />
		</Button>
		{#if $isPlaying}
			<div class="absolute inset-0 border-2 border-primary animate-spin-border rounded-md"></div>
		{/if}
	</div>

	<Button
		variant="outline"
		size="icon"
		on:click={stopPlay}
		disabled={!$isPlaying}
		class={cn(
			'bg-background hover:bg-accent hover:text-accent-foreground',
			!$isPlaying ? 'text-muted-foreground' : 'text-primary'
		)}
	>
		<Square class={cn('h-4 w-4', $isPlaying && 'text-red-500')} />
	</Button>

	<Button
		variant="outline"
		size="icon"
		on:click={restart}
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

	.animate-spin-border {
		animation: spin-border 1.5s linear infinite;
	}
</style>
