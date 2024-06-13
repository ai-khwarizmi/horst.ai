import { type Node, type Edge } from "@xyflow/svelte";
import { writable } from "svelte/store";

export const nodes = writable<Node[]>([{
    id: '123',
    type: "custom",
    data: {},
    position: { x: 150, y: 150 },
}]);
export const edges = writable<Edge[]>([]);

export const customNodes: Record<string, any> = {};
