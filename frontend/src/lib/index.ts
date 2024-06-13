import { type Node, type Edge } from "@xyflow/svelte";
import { writable } from "svelte/store";

export const nodes = writable<Node[]>([{
    id: '123',
    type: "custom",
    data: {},
    position: { x: 0, y: 0 },
}, {
    id: '234',
    type: "custom",
    data: {},
    position: { x: 0, y: 0 },
}, {
    id: '345',
    type: "custom",
    data: {},
    position: { x: 0, y: 0 },
}]);
export const edges = writable<Edge[]>([]);

export const customNodes: Record<string, any> = {};
