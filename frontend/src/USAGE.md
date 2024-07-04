# horst.ai - AI Workflow Editor Usage Guide

Create AI workflows with an easy-to-use visual editor. Connect ChatGPT, DALL-E, and other AI services to generate content, images, and PDFs. No coding required.

## Getting Started

This is what the editor looks like when you first open it:

![Starting Screen](https://static.horst.ai/screenshot-empty.webp)

To get started follow these steps:

### 1. Set Your API Key

- Click on `Set API Key` and paste your API key.
- **Note**: Your API key is not sent to our servers; it goes directly to the API provider.

### 2. Add a Node

- Press `Space` to open the node selection menu, or click the button at the bottom of the screen.
- Select the node type you need. Some examples:
  - **Input**: `Text Input`
  - **Viewer**: `Text Display`
  - **Transform**: `ChatGPT`, `DALL-E 3`
  - **Function**: `LaTeX to PDF`

### 3. Create a Workflow

- **Drag and Drop**: Arrange nodes in the desired order.
- **Connect Nodes**: Click and drag from one node's output to another node's input to connect them.
- When all required inputs for a node are connected, it will immediately start executing and pass the output to the next node once done.

### 4. Save and Share

- Use the `Save` button to download a backup of your current graph. You can upload this file to restore your workflow. Nothing is stored on our servers.
- Click `Share` to get a URL containing your workflow data. These URLs are long because all data is embedded within them.

## Example Workflow

Here’s an example of a workflow to create a greeting card image:

1. **Text Input**: Create a prompt describing the image you want.
2. **ChatGPT**: Refine the prompt text.
3. **DALL-E 3**: Generate the image from the refined prompt.
4. **Text Display**: Display the prompt and image URLs.

![Example Workflow](https://static.horst.ai/screenshot-with-workflow.webp)

## Important Notes

- **Data Privacy**: Your API keys are only sent to the respective service providers like OpenAI.
- **Shared URLs**: All workflow data is stored in the URL, which can make them long.
