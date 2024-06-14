import { type Node, type Edge, type NodeTypes } from "@xyflow/svelte";
import { writable } from "svelte/store";

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
export const commandOpen = writable(false);