import type { LayoutServerLoad } from './$types';

export const prerender = false;
export const ssr = false;

// so that the /a/index.html file is generated instead of /a.html
export const trailingSlash = 'always';

export const load = (async () => {
	return {};
}) satisfies LayoutServerLoad;
