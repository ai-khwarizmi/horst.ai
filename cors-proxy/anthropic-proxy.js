/*
	Cloudflare Worker
	Anthropic API proxy for the frontend to bypass CORS issues with the backend. Allows streaming responses.
*/

const ALLOWED_ORIGINS = ['http://localhost:5173', 'https://horst.ai', 'https://develop.horst-ai.pages.dev'];
const apiUrl = 'https://api.anthropic.com'

addEventListener('fetch', event => {
	event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
	const origin = request.headers.get('Origin');

	if (!ALLOWED_ORIGINS.includes(origin)) {
		return new Response('Forbidden', { status: 403 });
	}

	const url = new URL(request.url)
	const path = url.pathname
	const fullApiUrl = `${apiUrl}${path}`

	const modifiedRequest = new Request(fullApiUrl, {
		method: request.method,
		headers: request.headers,
		body: request.body
	})

	const response = await fetch(modifiedRequest)

	const newHeaders = new Headers(response.headers)
	newHeaders.set('Access-Control-Allow-Origin', '*')
	newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
	newHeaders.set('Access-Control-Allow-Headers', '*')

	if (request.method === 'OPTIONS') {
		return new Response(null, {
			status: 204,
			headers: newHeaders
		})
	}

	const { readable, writable } = new TransformStream()

	response.body.pipeTo(writable)

	return new Response(readable, {
		status: response.status,
		statusText: response.statusText,
		headers: newHeaders
	})
}
