<script>
	import SvelteMarkdown from 'svelte-markdown';
	import { onMount } from 'svelte';

	const PRIVACY_URL = 'https://static.horst.ai/PRIVACY.md';
	let source = '';
	onMount(async () => {
		const response = await fetch(PRIVACY_URL);
		source = await response.text();
	});
</script>

<div class="markdown-content">
	{#if source}
		<SvelteMarkdown {source} />
	{:else}
		<p class="text-center">
			Loading... If the content is not loading, please <a target="_blank" href={PRIVACY_URL}
				>click here</a
			>.
		</p>
	{/if}
</div>

<svelte:head>
	<style lang="postcss">
		.markdown-content {
			padding: 1.5rem;
			max-width: 1100px;
			margin-left: auto;
			margin-right: auto;
			color: rgb(31, 41, 55); /* text-gray-800 */
		}

		.markdown-content h1 {
			font-size: 2.25rem; /* text-4xl */
			font-weight: 700; /* font-bold */
			margin-bottom: 1rem; /* mb-4 */
			color: rgb(17, 24, 39); /* text-gray-900 */
		}

		.markdown-content h2 {
			font-size: 1.875rem; /* text-3xl */
			font-weight: 600; /* font-semibold */
			margin-bottom: 0.75rem; /* mb-3 */
			color: rgb(31, 41, 55); /* text-gray-800 */
		}

		.markdown-content h3 {
			font-size: 1.5rem; /* text-2xl */
			font-weight: 600; /* font-semibold */
			margin-bottom: 0.5rem; /* mb-2 */
			color: rgb(55, 65, 81); /* text-gray-700 */
		}

		.markdown-content p {
			margin-bottom: 1rem; /* mb-4 */
			line-height: 1.625; /* leading-relaxed */
		}

		.markdown-content ul {
			list-style-type: disc; /* list-disc */
			padding-left: 1.5rem; /* pl-6 */
			margin-bottom: 1rem; /* mb-4 */
		}

		.markdown-content li {
			margin-bottom: 0.5rem; /* mb-2 */
		}

		.markdown-content ol {
			list-style-type: decimal; /* list-decimal */
			padding-left: 1.5rem; /* pl-6 */
			margin-bottom: 1rem; /* mb-4 */
		}

		.markdown-content code {
			background-color: rgb(243, 244, 246); /* bg-gray-100 */
			color: rgb(220, 38, 38); /* text-red-600 */
			padding: 0.25rem; /* p-1 */
			border-radius: 0.25rem; /* rounded */
		}

		.markdown-content strong {
			font-weight: 700; /* font-bold */
		}

		.markdown-content img {
			border-radius: 0.25rem; /* rounded */
			margin-top: 1rem; /* mt-4 */
			margin-bottom: 1rem; /* mb-4 */
		}
	</style>
</svelte:head>
