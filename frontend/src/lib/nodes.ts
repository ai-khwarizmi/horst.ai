import CurrentTime from "./components/nodes/CurrentTime.svelte";
import NumberToString from "./components/nodes/number/NumberToString.svelte";
import TextDisplay from "./components/nodes/TextDisplay.svelte";
import TextInput from "./components/nodes/TextInput.svelte";
import ChatGpt from "./components/nodes/ai/ChatGPT.svelte";
import Dalle3 from "./components/nodes/ai/Dalle3.svelte";
import NumberToDate from "./components/nodes/number/NumberToDate.svelte";

const nodes = {
    // Generics
    currentTime: CurrentTime,

    // String Tools
    textInput: TextInput as any,
    textDisplay: TextDisplay as any,

    // Number Tools
    num2str: NumberToString as any,
    num2date: NumberToDate as any,

    // ai
    chatGpt: ChatGpt as any,
    dalle3: Dalle3 as any,

    // GPT
    // etc.
} as const

export type CustomNodeName = keyof typeof nodes;

export const nodeTypes = nodes as Record<string, any>