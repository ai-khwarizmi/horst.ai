import { createApp } from 'vue'
import App from './App.vue'
import './index.css'
import 'litegraph.js/css/litegraph.css';
import { LiteGraph } from 'litegraph.js';

import PromptToTextChatGpt from './nodes/PromptToText';
import PromptToImageDalle3 from './nodes/PromptToImageDalle3';
import Prompt from './nodes/Prompt';
import ResizableDivNode from './nodes/base/ResizableDivNode';
import LatexToPdf from './nodes/LatexToPdf';

//LiteGraph.clearRegisteredTypes();
LiteGraph.registerNodeType("basic/Prompt", Prompt);
LiteGraph.registerNodeType("openai/ChatGPT", PromptToTextChatGpt);
LiteGraph.registerNodeType("openai/Dalle3", PromptToImageDalle3);
LiteGraph.registerNodeType("basic/ResizableDiv", ResizableDivNode);
LiteGraph.registerNodeType("latex/ToPdf", LatexToPdf);

createApp(App).mount('#app')
