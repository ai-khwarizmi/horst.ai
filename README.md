# Horst.ai

![Project Logo](./frontend/static/logo64.png)

> This project is in its early stages and is evolving fast. Expect frequent breaking changes.

Horst.ai is a visual playground for testing and building AI workflows. It lets you quickly connect AI tools like ChatGPT and DALL-E to create, test, and share your ideas without writing code.

![example-workflow.webp](https://static.horst.ai/example-workflow.webp)

## Live Demo

Try the live demo at [horst.ai](http://horst.ai)

## Key Features

- **Visual Editor**: Create workflows by connecting blocks on a canvas.
- **Quick Testing**: Easily try out different AI services using your own API keys.
- **No Coding Needed**: Build and test ideas without programming knowledge.
- **Save and Share**: Keep your workflows and share them with others using simple URLs.
- **Local First**: Your data and API keys are processed locally wherever possible. Some services like Anthropic don't set CORS headers so we're using a proxy. If you self-host you can find the code to it in the functions folder to deploy your own!

## How to Build and Run Locally

### Prerequisites

- Node.js (LTS version recommended)
- npm / pnpm / yarn
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

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0). See the [LICENSE](./LICENSE) file for more details.

The AGPL-3.0 is a copyleft license that requires anyone who distributes your code or a derivative work to make the source available under the same terms. It also requires that if you run a modified program on a server and let other users communicate with it there, your server must also allow them to download the source code corresponding to the modified version running there.

### Credits and Third-Party Licenses

This project uses several third-party libraries that are licensed under various open-source licenses. Notably:

- **SwiftLaTeX**: Licensed under the [AGPL-3.0 license](https://www.gnu.org/licenses/agpl-3.0.html). The source code can be accessed [here](https://github.com/swiftlatex/swiftlatex).
- **@internationalized/date**: Licensed under the [Apache License 2.0](https://github.com/adobe/react-spectrum/blob/main/LICENSE).
- **Svelte**: Licensed under the [MIT License](https://github.com/sveltejs/svelte/blob/master/LICENSE.md).
- **SvelteFlow**: Licensed under the [MIT License](https://github.com/xyflow/xyflow/blob/main/LICENSE).
- **shadcn**: Licensed under the [MIT License](https://github.com/huntabyte/shadcn-svelte).

For a complete list of libraries and their respective licenses, please visit the [Credits](https://horst.ai/credits) page on our website.
