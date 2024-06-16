import NumberToString from "./components/nodes/number/NumberToString.svelte";
import TextDisplay from "./components/nodes/text/TextDisplay.svelte";
import TextInput from "./components/nodes/text/TextInput.svelte";
import ChatGpt from "./components/nodes/ai/ChatGPT.svelte";
import Dalle3 from "./components/nodes/ai/Dalle3.svelte";
import LatexToPdf from "./components/nodes/LatexToPdf.svelte";
import { AlignLeft, Bot, CalendarCog, Clock, FileText, ImagePlus, PencilRuler, TextCursorInput } from "lucide-svelte";
import { NodeType } from "./types";
import DatePicker from "./components/nodes/date/DatePicker.svelte";

export enum NodeCategory {
    String = "String",
    Number = "Number",
    AI = "AI",
    Documents = "Documents",
    Misc = "Misc",
}

const nodes = {
    // String Tools
    textInput: registerNode(TextInput, {
        name: "Text Input",
        nodeType: NodeType.INPUT,
        Icon: TextCursorInput,
        category: NodeCategory.String,
    }),
    textDisplay: registerNode(TextDisplay, {
        name: "Text Display",
        nodeType: NodeType.VIEWER,
        Icon: AlignLeft,
        category: NodeCategory.String,
    }),

    // Number Tools
    num2str: registerNode(NumberToString, {
        name: "Number to String",
        nodeType: NodeType.TRANSFORM,
        Icon: PencilRuler,
        category: NodeCategory.Number,
    }),

    // ai
    chatGpt: registerNode(ChatGpt, {
        name: "ChatGPT",
        nodeType: NodeType.FUNCTION,
        Icon: Bot,
        category: NodeCategory.AI,
    }),
    dalle3: registerNode(Dalle3, {
        name: "DALL-E 3",
        nodeType: NodeType.FUNCTION,
        Icon: ImagePlus,
        category: NodeCategory.AI,
    }),

    // documents
    latex2pdf: registerNode(LatexToPdf, {
        name: "LaTeX to PDF",
        nodeType: NodeType.TRANSFORM,
        Icon: FileText,
        category: NodeCategory.Documents,
    }),

    // Generics

    datePicker: registerNode(DatePicker, {
        name: "Date Picker",
        nodeType: NodeType.INPUT,
        Icon: CalendarCog,
        category: NodeCategory.Misc,
    })

    // etc.
} as const

export const registeredNodes: Record<string, RegisteredNode> = nodes;

export type CustomNodeName = keyof typeof nodes;

export const nodeTypes = (Object.keys(nodes) as (keyof typeof nodes)[]).reduce<Record<string, any>>((acc, key: keyof typeof nodes) => {
    acc[key] = nodes[key].component;
    return acc;
}, {});

export type NodeDetails = {
    name?: string
    nodeType?: NodeType
    Icon?: any
    description?: string
    category?: NodeCategory
}

export type RegisteredNode = NodeDetails & {
    component: any
}

function registerNode(component: any, details: NodeDetails = {}): RegisteredNode {
    return {
        ...details,
        component
    }
}