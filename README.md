# PlayCanvas Editor

[![Github Release](https://img.shields.io/github/v/release/playcanvas/editor)](https://github.com/playcanvas/editor/releases)
[![License](https://img.shields.io/github/license/playcanvas/editor)](https://github.com/playcanvas/editor/blob/main/LICENSE)
[![Discord](https://img.shields.io/badge/Discord-5865F2?style=flat&logo=discord&logoColor=white&color=black)](https://discord.gg/RSaMRzg)
[![Reddit](https://img.shields.io/badge/Reddit-FF4500?style=flat&logo=reddit&logoColor=white&color=black)](https://www.reddit.com/r/PlayCanvas)
[![X](https://img.shields.io/badge/X-000000?style=flat&logo=x&logoColor=white&color=black)](https://x.com/intent/follow?screen_name=playcanvas)

| [User Manual](https://developer.playcanvas.com/user-manual/editor) | [API Reference](https://api.playcanvas.com/editor) | [Blog](https://blog.playcanvas.com) | [Forum](https://forum.playcanvas.com) |

The PlayCanvas Editor is a visual editing environment for building WebGL/WebGPU/WebXR apps. It can be accessed at https://playcanvas.com.

![Editor](https://raw.githubusercontent.com/playcanvas/editor/refs/heads/main/images/editor.png)

You can see more projects build using the Editor on the [PlayCanvas website](https://playcanvas.com/explore).

## Local Development

To initialize a local development environment for the Editor Frontend, ensure you have [Node.js](https://nodejs.org/) 18 or later installed. Follow these steps:

1. Clone the repository:

   ```sh
   git clone https://github.com/playcanvas/editor.git
   cd editor
   ```

2. Install dependencies:

   ```sh
   npm install
   ```

3. Build Editor and start a local web server on port 51000:

   ```sh
   npm run develop
   ```

4. Append the query parameter `use_local_frontend` to load the development build:

    ```
    https://playcanvas.com/editor/project/2535?use_local_frontend
    ```

> [!NOTE]
> This query parameter is also supported in the code editor and launch page

## Library integration testing

The Editor is built on the following open source libraries:

| Library                                                       | Details                                     |
| ------------------------------------------------------------- | ------------------------------------------- |
| [PlayCanvas Engine](https://github.com/playcanvas/engine)     | Powers the Editor's 3D View and Launch Page |
| [Observer](https://github.com/playcanvas/playcanvas-observer) | Data binding and history                    |
| [PCUI](https://github.com/playcanvas/pcui)                    | Front-end component library                 |
| [PCUI-Graph](https://github.com/playcanvas/pcui-graph)        | PCUI plugin for rendering node-based graphs |
| [Editor API](https://github.com/playcanvas/editor-api)        | Public API for Editor automation            |

To test the integration of these libraries use [npm link](https://docs.npmjs.com/cli/v9/commands/npm-link). Follow these steps:

1. Create a global link from source

    ```sh
    cd <library>
    npm run link
    ```

2. Create a link to the global link

    ```sh
    cd editor
    npm run link <library>
    ```
