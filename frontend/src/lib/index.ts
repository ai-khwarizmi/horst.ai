import { type Node, type Edge, type Viewport, type XYPosition } from "@xyflow/svelte";
import { writable } from "svelte/store";
import { saveToLocalStorage } from "./utils/file";
import type { ConnectWith } from "./types";
import { goto } from "$app/navigation";
import { get } from "svelte/store";
import { generateProjectId, parseProjectId } from "./utils/projectId";
import { nodeIOHandlers } from "./utils";
import { debounce } from 'lodash-es';

export const projectId = writable<string>('');
export const projectName = writable<string>('');
export const nodes = writable<Node[]>([]);
export const edges = writable<Edge[]>([]);
export const viewport = writable<Viewport>({ x: 0, y: 0, zoom: 1 });
export const outputData = writable<Record<string, Record<string, any>>>({});
export const inputPlaceholderData = writable<Record<string, Record<string, any>>>({});
export const inputData = writable<Record<string, Record<string, any>>>({});
export const inputDataWithoutPlaceholder = writable<Record<string, Record<string, any>>>({});
export let handlers: Record<string, () => void> = {};

export function resetProject() {
    window.location.hash = '';
    projectId.set(generateProjectId('local'));
    projectName.set('');
    viewport.set({ x: 0, y: 0, zoom: 1 });
    outputData.set({});
    inputPlaceholderData.set({});
    inputData.set({});
    inputDataWithoutPlaceholder.set({});
    nodes.set([]);
    edges.set([]);
    handlers = {};
}


export const commandOpen = writable(false);
export const createNodeParams = writable<{
    position: XYPosition; node?: ConnectWith
} | null>(null);

const setProjectUrl = () => {
    if (typeof history === 'undefined') return;
    if (typeof window === 'undefined') return;
    const _projectId = get(projectId);
    if (!_projectId || _projectId.length < 3) return;
    const parsed = parseProjectId(_projectId);

    const _nodes = get(nodes);
    const _edges = get(edges);
    if (_nodes.length === 0 && _edges.length === 0) return;

    if (parsed && parsed.uuid) {
        const hashValue = window.location.hash;

        let targetPath = `/project/${_projectId}/`;
        if (hashValue && hashValue.length > 2) {
            targetPath = `/project/${_projectId}${hashValue}`;
        }

        const currentPath = window.location.pathname + window.location.hash;
        if (currentPath === targetPath) return;

        goto(targetPath, { replaceState: true });
    }
}

const saveToLocalStorageAndSetProjectUrl = () => {
    saveToLocalStorage();
    setProjectUrl();
}

nodes.subscribe(saveToLocalStorageAndSetProjectUrl);
edges.subscribe(saveToLocalStorageAndSetProjectUrl);
viewport.subscribe(saveToLocalStorageAndSetProjectUrl);
projectId.subscribe(setProjectUrl)

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
