import { type Node, type Edge, type NodeTypes } from "@xyflow/svelte";
import { writable } from "svelte/store";

export const nodes = writable<Node[]>([
    {
        id: '123',
        type: "currentTime",
        data: {
            0: writable(''),
        },
        position: { x: 150, y: 150 },
    }, {
        id: '256',
        type: "textDisplay",
        data: {
        },
        position: { x: 150, y: 150 },
    }, {
        id: '415441',
        type: "textDisplay",
        data: {
        },
        position: { x: 150, y: 150 },
    },
    {
        id: '789',
        type: "num2str",
        data: {},
        position: { x: 150, y: 150 },
    },
    {
        id: '1461614614614',
        type: "textInput",
        data: {},
        position: { x: 150, y: 150 },
    }
]);
export const edges = writable<Edge[]>([]);
