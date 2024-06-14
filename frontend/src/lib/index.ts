import { type Node, type Edge, type NodeTypes } from "@xyflow/svelte";
import { writable } from "svelte/store";
import CurrentTime from "./components/nodes/CurrentTime.svelte";
import TextDisplay from "./components/nodes/TextDisplay.svelte";
import NumberToString from "./components/nodes/NumberToString.svelte";
import TextInput from "./components/nodes/TextInput.svelte";

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

export const nodeTypes = {
    currentTime: CurrentTime as any,
    textDisplay: TextDisplay as any,
    num2str: NumberToString as any,
    textInput: TextInput as any,
} as const

export type CustomNodeType = keyof typeof nodeTypes;