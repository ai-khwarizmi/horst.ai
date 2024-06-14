import CurrentTime from "./components/nodes/CurrentTime.svelte";
import NumberToString from "./components/nodes/NumberToString.svelte";
import TextDisplay from "./components/nodes/TextDisplay.svelte";
import TextInput from "./components/nodes/TextInput.svelte";

const nodes = {
    // Generics
    currentTime: CurrentTime,

    // String Tools
    textInput: TextInput as any,
    textDisplay: TextDisplay as any,

    // Number Tools
    num2str: NumberToString as any,


    // GPT
    // etc.
}


export type CustomNodeName = keyof typeof nodeTypes;

export const nodeTypes = nodes as Record<string, any>