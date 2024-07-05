import { CORS_PROXY_URL } from "@/config";

export function corsProxyFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
	const request = new Request(input, init);
	const originalUrl = new URL(request.url);
	const proxyUrl = new URL(originalUrl.pathname + originalUrl.search, CORS_PROXY_URL);

	const proxyInit = {
		method: request.method,
		headers: request.headers,
		redirect: request.redirect,
		signal: request.signal,
	} as RequestInit;

	if (request.body) {
		proxyInit.body = request.body;
		(proxyInit as any).duplex = 'half';
	}

	const proxyRequest = new Request(proxyUrl, proxyInit);
	proxyRequest.headers.set('X-Target-Domain', originalUrl.origin);

	return fetch(proxyRequest);
}
