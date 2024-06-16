import { type Node, type Edge, type NodeTypes, type Viewport } from "@xyflow/svelte";
import { writable } from "svelte/store";
import { loadFromHash, loadFromLocalStorage, saveToLocalStorage } from "./utils";

export const openai_key = writable('');

openai_key.subscribe((key) => {
    if (key && key.indexOf('sk-') === 0) {
        if (typeof window !== 'undefined') {
            window.localStorage.setItem('openai_api_key', key);
        }
    }
});

export const nodes = writable<Node[]>([]);
export const edges = writable<Edge[]>([]);
export const viewport = writable<Viewport>({ x: 0, y: 0, zoom: 1 });

export const commandOpen = writable(false);

// default to localstorage for now, later we'll add multiple projects at once
loadFromLocalStorage();

//watch node and edge changes, save to local storage
nodes.subscribe(saveToLocalStorage);
edges.subscribe(saveToLocalStorage);
viewport.subscribe(saveToLocalStorage);