import { v4 as uuidv4 } from 'uuid';

type Prefix = 'local' | undefined;

/*
 * Generate a short UUID with a base36 timestamp and encode it in base58.
 * The generated ID will be prefixed with either local or an empty string, depending on
 * whether it was generated on the client or server.
 */
export function generateProjectId(prefix: Prefix): string {
	if (prefix !== 'local' && prefix !== undefined) {
		throw new Error('Invalid prefix');
	}
	if (prefix) {
		return `${prefix}-${uuidv4()}`
	} else {
		return uuidv4();
	}
}

type ProjectId = {
	prefix: Prefix,
	uuid: string
}

export function parseProjectId(id: string): ProjectId | null {
	const parts = id.split('-');
	if (parts.length !== 6) {
		console.error('Invalid project ID:', id, parts.length);
		return null;
	}
	return {
		prefix: parts[0] as Prefix,
		uuid: parts.slice(1).join('-')
	};
}
