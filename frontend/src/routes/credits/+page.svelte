<script lang="ts">
	import PackageJson from '../../../package.json';

	const githubMap: any = {
		'@sveltejs/kit': {
			name: 'SvelteKit',
			url: 'https://github.com/sveltejs/kit',
			branch: 'main',
			license: 'MIT'
		},
		'@langchain/core': {
			name: 'LangChain',
			url: 'https://github.com/langchain-ai/langchainjs',
			branch: 'master',
			license: 'MIT'
		},
		'@langchain/openai': {
			name: 'LangChain',
			url: 'https://github.com/langchain-ai/langchain',
			branch: 'master',
			license: 'MIT'
		},
		'@sveltejs/adapter-static': {
			name: 'SvelteKit',
			url: 'https://github.com/sveltejs/kit',
			branch: 'main',
			license: 'MIT'
		},
		'@xyflow/svelte': {
			name: 'XYFlow',
			url: 'https://github.com/xyflow/xyflow',
			branch: 'main',
			license: 'MIT'
		},
		'bits-ui': {
			name: 'Bits UI',
			url: 'https://github.com/huntabyte/bits-ui',
			branch: 'main',
			license: 'MIT'
		},
		'cmdk-sv': {
			name: 'cmdk-sv',
			url: 'https://github.com/huntabyte/cmdk-sv',
			branch: 'main',
			license: 'MIT'
		},
		langchain: {
			name: 'LangChain',
			url: 'https://github.com/langchain-ai/langchain',
			branch: 'master',
			license: 'MIT'
		},
		'lucide-svelte': {
			name: 'Lucide Svelte',
			url: 'https://github.com/shinokada/svelte-lucide',
			branch: 'main',
			license: 'ISC'
		},
		'lz-string': {
			name: 'lz-string',
			url: 'https://github.com/pieroxy/lz-string',
			branch: 'master',
			licenseFile: 'LICENSE.md',
			license: 'MIT'
		},
		'svelte-sonner': {
			name: 'Svelte Sonner',
			url: 'https://github.com/wobsoriano/svelte-sonner',
			branch: 'master',
			license: 'MIT'
		},
		tailwindcss: {
			name: 'Tailwind CSS',
			url: 'https://github.com/tailwindlabs/tailwindcss',
			branch: 'main',
			license: 'MIT'
		},
		'tailwind-merge': {
			name: 'tailwind-merge',
			url: 'https://github.com/dcastil/tailwind-merge',
			branch: 'master',
			licenseFile: 'LICENSE.md',
			license: 'MIT'
		},
		'tailwind-variants': {
			name: 'tailwind-variants',
			url: 'https://github.com/nextui-org/tailwind-variants',
			branch: 'main',
			license: 'MIT'
		},
		swiftlatex: {
			name: 'SwiftLaTeX',
			url: 'https://github.com/swiftlatex/swiftlatex',
			branch: 'master',
			license: 'AGPL-3.0'
		},
		'@internationalized/date': {
			name: '@internationalized/date',
			url: 'https://github.com/adobe/react-spectrum',
			branch: 'main',
			license: 'Apache License 2.0'
		},
		'svelte-markdown': {
			name: 'Svelte Markdown',
			url: 'https://github.com/pablo-abc/svelte-markdown',
			branch: 'main',
			license: 'MIT'
		},
		'bs58': {
			name: 'bs58',
			url: 'https://github.com/cryptocoinjs/bs58',
			branch: 'master',
			license: 'MIT'
		},
		'buffer': {
			name: 'buffer',
			url: 'https://github.com/feross/buffer',
			branch: 'master',
			license: 'MIT'
		},
		'uuid': {
			name: 'uuid',
			url: 'https://github.com/uuidjs/uuid',
			branch: 'main',
			license: 'MIT'
		}
	};

	const contributors = ['metjm', 'overiit'];

	const manuallyAddedPackages = {
		swiftlatex: '20/02/2022'
	};

	//sorted alphabetically by written name
	const allDependencies = [
		...Object.keys(manuallyAddedPackages),
		...Object.keys(PackageJson.dependencies)
	].sort((a, b) => {
		if (a < b) return -1;
		if (a > b) return 1;
		return 0;
	});

	// Run through all packages and make sure they have a GitHub link and branch info
	Object.keys(PackageJson.dependencies).forEach((dependency) => {
		if (!githubMap[dependency]) {
			throw new Error(`No GitHub link for ${dependency}`);
		}
	});
</script>

<div class="p-4">
	<div class="text-2xl font-bold">Contributors</div>
	<div class="flex space-x-1">
		{#each contributors as contributor}
			<a href={`https://github.com/${contributor}`} target="_blank" rel="noopener noreferrer">
				<img src={`https://github.com/${contributor}.png`} alt={contributor} class="round-photo" />
			</a>
		{/each}
	</div>

	<div class="text-2xl font-bold mt-8">Credits</div>
	<table class="table-auto w-full">
		<thead>
			<tr>
				<th class="px-4 py-2 text-left border">Name</th>
				<th class="px-4 py-2 text-left border">License</th>
				<th class="px-4 py-2 text-left border">Source Code</th>
			</tr>
		</thead>
		<tbody>
			{#each allDependencies as dependency}
				<tr>
					<td class="border px-4 py-2">{dependency}</td>
					<td class="border px-4 py-2">
						<a
							class="text-blue-500"
							href={`${githubMap[dependency].url}/blob/${githubMap[dependency].branch}/${githubMap[dependency].licenseFile || 'LICENSE'}`}
							target="_blank"
							rel="noopener noreferrer"
						>
							{githubMap[dependency].license}
						</a>
					</td>
					<td class="border px-4 py-2">
						<a
							class="text-blue-500"
							href={githubMap[dependency].url}
							target="_blank"
							rel="noopener noreferrer"
						>
							Link
						</a>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>

	<!-- Disclaimer Section -->
	<div class="mt-4">
		<h2 class="text-xl font-bold">License Information</h2>
		<p>
			This project uses libraries that are licensed under various licenses. Specifically, the
			SwiftLaTeX library is licensed under the
			<a
				href="https://www.gnu.org/licenses/agpl-3.0.html"
				class="text-blue-500"
				target="_blank"
				rel="noopener noreferrer">AGPL-3.0 license</a
			>. By using this project, you are entitled to obtain the complete source code of SwiftLaTeX.
			The source code can be accessed
			<a
				href="https://github.com/swiftlatex/swiftlatex"
				class="text-blue-500"
				target="_blank"
				rel="noopener noreferrer">here</a
			>.
		</p>
		<p>
			The use of the SwiftLaTeX library within this project does not imply that the entire project
			is released under AGPL-3.0.
		</p>
	</div>
</div>

<style>
	.round-photo {
		border-radius: 50%;
		width: 32px;
		height: 32px;
		object-fit: cover;
		border: 1px solid black;
	}
</style>
