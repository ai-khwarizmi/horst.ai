import type { ProjectType } from '@/types';
import { v4 as uuidv4 } from 'uuid';

type Prefix = 'local' | undefined;

/*
 * Generate a short UUID with a base36 timestamp and encode it in base58.
 * The generated ID will be prefixed with either local or an empty string, depending on
 * whether it was generated on the client or server.
 */
export function generateProjectId(projectType: ProjectType): string {
	if (projectType !== 'LOCAL' && projectType !== 'CLOUD') {
		return '';
	}
	if (projectType === 'LOCAL') {
		return `local-${uuidv4()}`;
	} else {
		//will be replaced with the actual cloud project ID generated in backend
		return `temporary`;
	}
}

type ProjectId = {
	prefix: Prefix;
	uuid: string;
};

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
