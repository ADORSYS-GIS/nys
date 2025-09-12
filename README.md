# VS Code Coding Assistant (nys)

A Visual Studio Coding Assistant that connects to Model Context Protocol (MCP) servers and External data sources to provide maximum output to user's request. It provides an AI Chat panel, executes prompts, lists available tools, and supports both HTTP/WebSocket servers and local stdio binaries.
it also has special base prompts, debugging, coding and orchestration workflows build in and provide graph database connection to store relationship in codebase to generate documentations to better assist in daily task

<https://github.com/user-attachments/assets/55d831bc-c612-485d-9648-1612c3aa1c6f>

## Architecture worflow
![Architecture](/images/workflow.png)

https://drive.google.com/file/d/1PIz6mFjYTbwbW5r_Db3CTl7WIQBAVjfp/view?usp=sharing

## Key Features

- Connect to MCP servers
  - Standard HTTP/WebSocket servers
  - Stdio mode for local binaries (e.g., GitHub MCP server)
- AI Chat webview (View: MCP AI Chat → AI Chat)
- Commands: Connect, Execute Prompt, List Tools, Open Chat View, Disconnect
- Status bar integration (connection/processing state)
- Tool discovery cached on connect (no periodic 30‑min refresh)
- Leverages MCP protocol to perform elicitation reducing hallucination rate
- Format's user's prompt based on previous chat and project context improving result output
- Read and work with knowledge and Guidelines from specific directories and files
- Provide request/response cost
- Should be capable of rolling back to any code version
- Langchain Intergration for chat orchestration and memory management

## Mira Architecture Overview

The Mira extension is architected for modular, persistent, and orchestrated AI workflows in VS Code.

- **LangChain Orchestration:**
  Mira leverages LangChain for advanced prompt orchestration, memory management, and tool chaining. This enables context-aware, multi-step workflows and dynamic tool selection based on user intent.

- **Sidebar Workflows:**
  The extension provides a sidebar with interactive panels for chat, tool selection, and workflow management. Users can trigger, monitor, and manage AI-driven tasks directly from the sidebar.

- **Persistent State in `.nys/`:**
  All persistent state, including chat history, workflow state, and user preferences, is stored in the `.nys/` directory at the workspace root. This ensures session continuity and enables advanced features like context recall and workflow resumption.

- **Extensible Model Providers:**
  Mira supports multiple model providers (OpenAI, Gemini, Anthropic, etc.) and can orchestrate between them as needed.

## Requirements

- Visual Studio Code 1.60.0 or newer
- Access to an MCP server:
  - Standard HTTP/WebSocket endpoint, or
  - A local stdio-compatible binary (e.g., github-mcp-server), or
  - Optional demo Filesystem server (run-mcp-server.sh)
- Credentials:
  - API key for your MCP/LLM service, or
  - GitHub Personal Access Token when using github-mcp-server
- Optional for semantic tool selection:
  - Embedding MCP endpoint and Vector MCP endpoint, or
  - A reachable Milvus instance
- For building/packaging from source: Node.js and npm

## Build & Package

To build and package the extension (including all persistent state in `.nys/`):

```bash
npm run compile
npx vsce package
```

- The build/package scripts ensure `.nys/` is always included in the VSIX.
- You can also use `scripts/bundle-extension.js` or `scripts/generate-vsix.sh` for advanced packaging.
- After packaging, install the VSIX in VS Code via Extensions → ... → Install from VSIX.

## Quick Start

1.1) Installing from the VS Code Marketplace
- Search for "nys" in the Extensions view
- Click Install

1.2) Installing from source
- From VSIX: Build or download a .vsix, then in VS Code: Extensions → … → Install from VSIX…

2) Configure (Settings → “nys”)


3) Use
- Command Palette → MCP: Connect to Server
- Command Palette → MCP: Open Chat View (or MCP: Execute Prompt)
- Command Palette → MCP: List Available Tools

## Commands
- MCP: Connect to Server (vscode-mcp-client.connect)
- MCP: Disconnect (vscode-mcp-client.disconnect)
- MCP: Execute Prompt (vscode-mcp-client.executePrompt)
- MCP: List Available Tools (vscode-mcp-client.listTools)
- MCP: Open Chat View (vscode-mcp-client.openChatView)

## Configuration (summary)


## Security & Privacy
- No telemetry is collected by this extension.
- Network access is limited to the endpoints you configure (MCP server, optional Embedding MCP, Vector MCP, or Milvus).
- Credentials:
  - Standard HTTP/HTTPS: If provided, an Authorization: Bearer <token> header is used for MCP requests.
  - Stdio mode: Tokens are forwarded to the MCP binary via environment variables (GITHUB_PERSONAL_ACCESS_TOKEN, GITHUB_TOKEN, API_KEY) for compatibility.
  - Tokens are only persisted if you explicitly save them in VS Code settings.
- Tool discovery is cached in memory for the session after connecting; there is no periodic background refresh.
- Logs may include masked identifiers for debugging; avoid sharing logs that could contain sensitive project details.

## Troubleshooting
- Not connected? Ensure serverUrl is correct. For stdio, verify the binary path and that your token is valid.
- GitHub MCP stdio: In stdio mode the extension forwards the token via GITHUB_PERSONAL_ACCESS_TOKEN/GITHUB_TOKEN and API_KEY env vars.
- Tool list empty? Connect first; tools are fetched on connect and cached for the session.
- Semantic selection requires embedding/vector config (Vector MCP) or Milvus connectivity.

## Links
- Changelog: CHANGELOG.md
- Usage guide: USAGE_GUIDE.md
- Publish guide: publishGuide.md
- Issues & Support: https://github.com/Christiantyemele/mimie/issues

## License
MIT
