import { type Node, type Edge, type Viewport } from "@xyflow/svelte";
import { writable } from "svelte/store";
import { loadFromLocalStorage, saveToLocalStorage } from "./utils/file";
import { browser } from "$app/environment";

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

export const projectName = writable<string>('');
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