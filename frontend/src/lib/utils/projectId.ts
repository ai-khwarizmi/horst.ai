import { v4 as uuidv4 } from 'uuid';
import bs58 from 'bs58';
import { Buffer } from 'buffer';

function getBase36Timestamp(): string {
	const timestamp = Math.floor(Date.now() / 1000);
	return timestamp.toString(36);
}

type Prefix = 'svr' | 'clt';

/*
 * Generate a short UUID with a base36 timestamp and encode it in base58.
 * The generated ID will be prefixed with either 'svr' or 'clt' to indicate
 * whether it was generated on the server or the client.
 */
export function generateProjectId(prefix: Prefix): string {
	const apiUrl = import.meta.env.VITE_PUBLIC_API_URL;
	if (!apiUrl) {
		throw new Error('VITE_PUBLIC_API_URL is not set');
	}
	const { hostname, port } = new URL(apiUrl);
	const domain = port ? `${hostname}:${port}` : hostname;
	const timestamp = getBase36Timestamp();
	const shortUUID = uuidv4().substring(0, 8);
	const id = `${prefix}:${domain}:${timestamp}:${shortUUID}`;
	return bs58.encode(Buffer.from(id));
}

export function parseProjectId(base58ID: string): { prefix: Prefix, domain: string, timestamp: string, uuid: string } {
	const decoded = Buffer.from(bs58.decode(base58ID)).toString();
	const parts = decoded.split(':');

	let prefix, domain, port, timestamp, uuid;
	if (parts.length === 4) {
		[prefix, domain, timestamp, uuid] = parts;
	} else if (parts.length === 5) {
		[prefix, domain, port, timestamp, uuid] = parts;
		domain = `${domain}:${port}`;
	}

	console.log('Decoded:', { prefix, domain, timestamp, uuid });
	if (prefix !== 'svr' && prefix !== 'clt') {
		throw new Error('Invalid project ID prefix');
	}

	if (!domain || !timestamp || !uuid) {
		throw new Error('Invalid project ID');
	}

	return { prefix, domain, timestamp, uuid };
}
