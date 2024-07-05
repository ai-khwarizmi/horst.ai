/*
	Cloudflare Worker
	General purpose CORS proxy for the frontend to bypass CORS issues with API providers that don't support it
*/

const ALLOWED_DOMAINS = {
	//leonardo.ai image upload
	'https://image-flex-213441772509-prod-images.s3-accelerate.amazonaws.com': true
};

const ALLOWED_ORIGINS = ['http://localhost:5173', 'https://horst.ai', 'https://develop.horst-ai.pages.dev'];

addEventListener('fetch', event => {
	event.respondWith(handleRequest(event.request))
});

async function handleRequest(request) {
	const origin = request.headers.get('Origin');

	if (!ALLOWED_ORIGINS.includes(origin)) {
		return new Response('Forbidden', { status: 403 });
	}

	if (request.method === 'OPTIONS') {
		return handleCORS(request, {
			status: 204,
			headers: {
				'Access-Control-Allow-Origin': origin,
				'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type, X-Target-Domain, X-Amz-*',
				'Access-Control-Max-Age': '86400',
			}
		});
	}

	const targetDomain = request.headers.get('X-Target-Domain');
	if (!targetDomain || !ALLOWED_DOMAINS[targetDomain]) {
		return new Response('Invalid or missing X-Target-Domain header', { status: 400 });
	}

	const url = new URL(request.url);
	const path = url.pathname;
	let fullApiUrl = `${targetDomain}${path}`;

	const newHeaders = new Headers(request.headers);
	newHeaders.delete('X-Target-Domain');

	if (request.method === 'PUT' && targetDomain.includes('s3')) {
		const searchParams = new URLSearchParams();
		for (const [key, value] of newHeaders.entries()) {
			if (key.startsWith('x-amz-')) {
				searchParams.append(key.slice(5), value);
				newHeaders.delete(key);
			}
		}
		fullApiUrl += '?' + searchParams.toString();
	}

	const modifiedRequest = new Request(fullApiUrl, {
		method: request.method,
		headers: newHeaders,
		body: request.body,
		redirect: request.redirect,
	});

	let response = await fetch(modifiedRequest);

	response = new Response(response.body, response);
	response.headers.set('Access-Control-Allow-Origin', origin);

	return response;
}

function handleCORS(request, responseInit) {
	const origin = request.headers.get('Origin');

	const headers = new Headers(responseInit.headers);
	headers.set('Access-Control-Allow-Origin', origin);

	return new Response(null, {
		...responseInit,
		headers,
	});
}
