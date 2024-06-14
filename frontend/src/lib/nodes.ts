import CurrentTime from "./components/nodes/CurrentTime.svelte";
import NumberToString from "./components/nodes/NumberToString.svelte";
import TextDisplay from "./components/nodes/TextDisplay.svelte";
import TextInput from "./components/nodes/TextInput.svelte";

export const nodeTypes = {
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