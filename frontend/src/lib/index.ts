import { type Node, type Edge, type Viewport, type XYPosition } from "@xyflow/svelte";
import { writable } from "svelte/store";
import { saveToLocalStorage } from "./utils/file";
import { browser } from "$app/environment";
import type { ConnectWith } from "./types";
import { goto } from "$app/navigation";
import { get } from "svelte/store";
import { parseProjectId } from "./utils/projectId";

export const openai_key = writable(browser ? localStorage.getItem('openai_api_key') : '');

openai_key.subscribe((key) => {
    if (browser) {
        if (key && key.length > 0) {
            localStorage.setItem('openai_api_key', key);
        } else {
            localStorage.removeItem('openai_api_key');
        }
    }
});

export const projectId = writable<string>('');
export const projectName = writable<string>('');
export const nodes = writable<Node[]>([]);
export const edges = writable<Edge[]>([]);
export const viewport = writable<Viewport>({ x: 0, y: 0, zoom: 1 });

export const commandOpen = writable(false);
export const createNodeParams = writable<{
    position: XYPosition; node?: ConnectWith
} | null>(null);

//watch node and edge changes, save to local storage
nodes.subscribe(saveToLocalStorage);
edges.subscribe(saveToLocalStorage);
viewport.subscribe(saveToLocalStorage);

projectId.subscribe(() => {
    if (typeof history === 'undefined') return;
    if (typeof window === 'undefined') return;
    const _projectId = get(projectId);
    if (!_projectId || _projectId.length < 3) return;
    const parsed = parseProjectId(_projectId);
    if (parsed && parsed.prefix) {
        const hashValue = window.location.hash;
        if (hashValue && hashValue.length > 2) {
            goto(`/project/${_projectId}${hashValue}`, { replaceState: true });
        } else {
            goto(`/project/${_projectId}`, { replaceState: true });
        }
    }
})