import { createApp } from 'vue'
import App from './App.vue'
import './index.css'
import 'litegraph.js/css/litegraph.css';
import { LiteGraph } from 'litegraph.js';

import PromptToTextChatGpt from './nodes/PromptToText';
import PromptToImageDalle3 from './nodes/PromptToImageDalle3';
import Prompt from './nodes/Prompt';

LiteGraph.clearRegisteredTypes();
LiteGraph.registerNodeType("basic/Prompt", Prompt);
LiteGraph.registerNodeType("openai/ChatGPT", PromptToTextChatGpt);
LiteGraph.registerNodeType("openai/Dalle3", PromptToImageDalle3);

createApp(App).mount('#app')


createApp(App).mount('#app')

