import { sveltekit } from '@sveltejs/kit/vite';
import pluginChecker from 'vite-plugin-checker';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit(),
		pluginChecker({
			typescript: true
		})
	],
	server: {
		fs: {
			allow: ['./package.json']
		}
	}
});
