import TextDisplay from "./components/nodes/text/TextDisplay.svelte";
import TextInput from "./components/nodes/text/TextInput.svelte";
import ChatGpt from "./components/nodes/ai/ChatGPT.svelte";
import Dalle3 from "./components/nodes/ai/Dalle3.svelte";
import LatexToPdf from "./components/nodes/display/LatexToPdf.svelte";
import { AlignLeft, CalendarCog, FileDigit, FileText, TextCursorInput } from "lucide-svelte";
import { NodeType } from "./types";
import DatePicker from "./components/nodes/date/DatePicker.svelte";
import TextConcatenate from "./components/nodes/text/TextConcatenate.svelte";
import TextCompare from "./components/nodes/text/TextCompare.svelte";
import TextContains from "./components/nodes/text/TextContains.svelte";
import TextEncode from "./components/nodes/text/TextEncode.svelte";
import TextDecode from "./components/nodes/text/TextDecode.svelte";
import HtmlDisplay from "./components/nodes/display/HtmlDisplay.svelte";
import Claude from "./components/nodes/ai/Claude.svelte";
import LeonardoAi from "./components/nodes/ai/LeonardoAi/LeonardoAi.svelte";
import TextAndFileInput from "./components/nodes/text/TextAndFileInput.svelte";
import { SvelteComponent, type ComponentType } from 'svelte';
import IconComponent from './components/ui/icon/IconComponent.svelte';
import Groq from './components/nodes/ai/Groq.svelte';

interface IconProps {
    url: string;
    size?: number;
    className?: string;
}

function createIconComponent(defaultUrl: string): ComponentType<SvelteComponent<IconProps>> {
    return function (options: any) {
        const { props = {}, ...rest } = options;
        return new IconComponent({
            ...rest,
            props: {
                url: defaultUrl,
                ...props
            }
        });
    } as unknown as ComponentType<SvelteComponent<IconProps>>;
}
const LeonardoIcon = createIconComponent("https://static.horst.ai/leonardoai-icon.webp");
const OpenAiIcon = createIconComponent("https://static.horst.ai/openai-logomark.png");
const Dalle3Icon = createIconComponent("https://static.horst.ai/openai-logomark.png");
const ClaudeIcon = createIconComponent("https://static.horst.ai/claude-icon.png");
const GroqIcon = createIconComponent("https://static.horst.ai/groq-logo.png");

export enum NodeCategory {
    String = "String",
    Number = "Number",
    AI = "AI",
    Documents = "Documents",
    Misc = "Misc",
}

export type NodeDetails = {
    name?: string
    nodeType?: NodeType
    Icon?: ComponentType<SvelteComponent>
    description?: string
    category?: NodeCategory
}

const nodes = {
    // String Tools
    textInput: registerNode(TextInput, {
        name: "Text Input",
        nodeType: NodeType.INPUT,
        Icon: TextCursorInput,
        category: NodeCategory.String,
    }),
    textAndFileInput: registerNode(TextAndFileInput, {
        name: "Text and File Input",
        nodeType: NodeType.INPUT,
        Icon: FileText,
        category: NodeCategory.String,
    }),
    textDisplay: registerNode(TextDisplay, {
        name: "Text Display",
        nodeType: NodeType.VIEWER,
        Icon: AlignLeft,
        category: NodeCategory.String,
    }),
    textConcatenate: registerNode(TextConcatenate, {
        name: "Text Concatenate",
        nodeType: NodeType.TRANSFORM,
        Icon: AlignLeft,
        category: NodeCategory.String,
    }),
    textCompare: registerNode(TextCompare, {
        name: "Text Compare",
        nodeType: NodeType.TRANSFORM,
        Icon: AlignLeft,
        category: NodeCategory.String,
    }),
    textContains: registerNode(TextContains, {
        name: "Text Contains",
        nodeType: NodeType.TRANSFORM,
        Icon: AlignLeft,
        category: NodeCategory.String,
    }),
    textEncode: registerNode(TextEncode, {
        name: "Text Encode",
        nodeType: NodeType.TRANSFORM,
        Icon: FileDigit,
        category: NodeCategory.String,
    }),
    textDecode: registerNode(TextDecode, {
        name: "Text Decode",
        nodeType: NodeType.TRANSFORM,
        Icon: FileDigit,
        category: NodeCategory.String,
    }),

    // Number Tools
    // num2str: registerNode(NumberToString, {
    //     name: "Number to String",
    //     nodeType: NodeType.TRANSFORM,
    //     Icon: PencilRuler,
    //     category: NodeCategory.Number,
    // }),

    // ai
    chatGpt: registerNode(ChatGpt, {
        name: "ChatGPT",
        nodeType: NodeType.FUNCTION,
        Icon: OpenAiIcon,
        category: NodeCategory.AI,
    }),
    dalle3: registerNode(Dalle3, {
        name: "DALL-E 3",
        nodeType: NodeType.FUNCTION,
        Icon: Dalle3Icon,
        category: NodeCategory.AI,
    }),
    claude: registerNode(Claude, {
        name: "Claude",
        nodeType: NodeType.FUNCTION,
        Icon: ClaudeIcon,
        category: NodeCategory.AI,
    }),
    leonardoAi: registerNode(LeonardoAi, {
        name: "Leonardo.ai",
        nodeType: NodeType.FUNCTION,
        Icon: LeonardoIcon,
        category: NodeCategory.AI,
    }),
    groq: registerNode(Groq, {
        name: "Groq",
        nodeType: NodeType.FUNCTION,
        Icon: GroqIcon,
        category: NodeCategory.AI,
    }),

    // display
    latex2pdf: registerNode(LatexToPdf, {
        name: "LaTeX to PDF",
        nodeType: NodeType.TRANSFORM,
        Icon: FileText,
        category: NodeCategory.Documents,
    }),
    htmlDisplay: registerNode(HtmlDisplay, {
        name: "HTML Viewer",
        nodeType: NodeType.VIEWER,
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

export type RegisteredNode = NodeDetails & {
    component: any
}

function registerNode(component: any, details: NodeDetails = {}): RegisteredNode {
    return {
        ...details,
        component
    }
}