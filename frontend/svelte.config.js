import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			fallback: 'index.html'
		}),
		alias: {
			"@/*": "./src/lib/*",
		}
	},

	onwarn: (warning, handler) => {
		const fileToIgnore = '/src/lib/components/CustomNode.svelte';
		if (warning.code === 'unused-export-let' && warning.filename.includes(fileToIgnore)) {
			return;
		}
		handler(warning);
	}
};

export default config;
