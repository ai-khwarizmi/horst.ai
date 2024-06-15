import type { LayoutServerLoad } from './$types';

export const prerender = true;
// so that the /a/index.html file is generated instead of /a.html
export const trailingSlash = "always";

export const load = (async () => {
    return {};
}) satisfies LayoutServerLoad;