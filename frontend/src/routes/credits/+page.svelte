<script lang="ts">
	import type { PageData } from './$types';
	import PackageJson from '../../../package.json';

	export let data: PageData;
</script>

<div class="p-4">
	<div class="text-2xl font-bold">Credits</div>
	{#each Object.entries(PackageJson.dependencies) as [dependency, version]}
		<div class="">
			<a
				target="_blank"
				href="https://www.npmjs.com/package/{dependency}"
				class="hover:underline hover:"
			>
				{dependency}
			</a>
			<a
				target="_blank"
				href="https://www.npmjs.com/package/{dependency}/v/{version.replace('^', '')}"
				class="text-sm text-gray-500 hover:underline hover:"
			>
				{version}
			</a>
		</div>
	{/each}
</div>
