# Horst.ai
![Project Logo](./frontend/static/logo64.png)

Horst.ai is a visual workflow editor that lets you build AI-driven workflows with ease. Connect services like ChatGPT and DALL-E to generate content, images, and PDFs without the need to write code.

![example-workflow.webp](https://static.horst.ai/example-workflow.webp)

## Live Demo
Try the live demo at [horst.ai](http://horst.ai)

## Key Features

- **Drag-and-Drop Interface**: Easily create workflows by dragging and dropping nodes.
- **API Integration**: Seamlessly connect to AI services like ChatGPT and DALL-E using your API keys.
- **No Coding Required**: Build complex workflows without writing a single line of code.
- **Data Privacy**: Your data and API keys are only sent to the respective service providers, not to our servers.
- **Save and Share**: Save your workflows and share them via URLs with embedded data.

## How to Build and Run Locally

### Prerequisites
- Node.js (LTS version recommended)
- npm (comes with Node.js)
- Git

### Clone the Repository
```bash
git clone https://github.com/ai-khwarizmi/horst.ai.git
cd horst.ai/frontend
```

### Install Dependencies
```bash
npm install
```

### Start the Development Server
```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

### Building for Production
To create a production build of the app:
```bash
npm run build
```
You can preview the production build with:
```bash
npm run preview
```

> To deploy the app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.

## License

This project is licensed under the MIT License with an additional Commons Clause License Condition. See the [LICENSE](./LICENSE) file for more details.

The Commons Clause restricts the right to "Sell" the software. This includes providing the software to third parties for a fee, or incorporating it into a paid service or product.

For licensing that includes monetization or any commercial usage not covered by the Commons Clause, please contact us at [support@horst.ai](mailto:support@horst.ai).

### Credits and Third-Party Licenses

This project uses several third-party libraries that are licensed under various open-source licenses. Notably:

- **SwiftLaTeX**: Licensed under the [AGPL-3.0 license](https://www.gnu.org/licenses/agpl-3.0.html). The source code can be accessed [here](https://github.com/swiftlatex/swiftlatex).
- **@internationalized/date**: Licensed under the [Apache License 2.0](https://github.com/adobe/react-spectrum/blob/main/LICENSE).
- **Svelte**: Licensed under the [MIT License](https://github.com/sveltejs/svelte/blob/master/LICENSE.md).
- **SvelteFlow**: Licensed under the [MIT License](https://github.com/xyflow/xyflow/blob/main/LICENSE).
- **shadcn**: Licensed under the [MIT License](https://github.com/huntabyte/shadcn-svelte).

For a complete list of libraries and their respective licenses, please visit the [Credits](https://horst.ai/credits) page on our website.
