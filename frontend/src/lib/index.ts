import { type Node, type Edge, type Viewport, type XYPosition } from '@xyflow/svelte';
import { writable } from 'svelte/store';
import type { ConnectWith } from './types';
import { nodeIOHandlers } from './utils';
import { debounce } from 'lodash-es';
import { browser } from '$app/environment';
import { handleProjectChange, handleProjectIdChange } from './project';

export const projectId = writable<string | undefined>(undefined);
export const projectName = writable<string>('');
export const nodes = writable<Node[]>([]);
export const edges = writable<Edge[]>([]);
export const viewport = writable<Viewport>({ x: 0, y: 0, zoom: 1 });
export const outputData = writable<Record<string, Record<string, any>>>({});
export const inputPlaceholderData = writable<Record<string, Record<string, any>>>({});
export const inputData = writable<Record<string, Record<string, any>>>({});
export const inputDataWithoutPlaceholder = writable<Record<string, Record<string, any>>>({});
export const optionalInputsEnabled = writable<Record<string, Record<string, boolean>>>({});
export const updatedAt = writable<number>(0);

export let handlers: Record<string, () => void> = {};

export const resetHandlers = () => {
	handlers = {};
};

if (browser) {
	projectName.subscribe(handleProjectChange);
	nodes.subscribe(handleProjectChange);
	edges.subscribe(handleProjectChange);
	viewport.subscribe(handleProjectChange);

	projectId.subscribe(handleProjectIdChange);
}

export const commandOpen = writable(false);
export const createNodeParams = writable<{
	position: XYPosition;
	node?: ConnectWith;
} | null>(null);

const debouncedHandleChanges = debounce(() => {
	Object.values(nodeIOHandlers).forEach((ioHandler) => {
		ioHandler.onOutputsChanged();
	});
}, 50);

outputData.subscribe(() => {
	debouncedHandleChanges();
});

edges.subscribe(() => {
	debouncedHandleChanges();
});
