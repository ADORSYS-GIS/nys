# VS Code MCP Client (nys)

A Visual Studio Code extension that connects to Model Context Protocol (MCP) servers. It provides an AI Chat panel, executes prompts, lists available tools, and supports both HTTP/WebSocket servers and local stdio binaries.

<https://github.com/user-attachments/assets/55d831bc-c612-485d-9648-1612c3aa1c6f>

## Key Features

- Connect to MCP servers
  - Standard HTTP/WebSocket servers (default)
  - Stdio mode for local binaries (e.g., GitHub MCP server)
- AI Chat webview (View: MCP AI Chat → AI Chat)
- Commands: Connect, Execute Prompt, List Tools, Open Chat View, Disconnect
- Status bar integration (connection/processing state)
- Tool discovery cached on connect (no periodic 30‑min refresh)
- Optional semantic tool selection using external embedding/vector backends (Vector MCP or Milvus)

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

## Quick Start

1) Install
- From VSIX: Build or download a .vsix, then in VS Code: Extensions → … → Install from VSIX…

2) Configure (Settings → “MCP Client”)
- mcpClient.serverUrl
  - Standard HTTP/WS example: http://localhost:8080
  - Stdio example: /path/to/github-mcp-server (you may pass args; the extension appends "stdio" if missing)
- mcpClient.apiKey or mcpClient.githubToken
  - For stdio GitHub MCP server, prefer githubToken. In stdio mode, the extension passes it to GITHUB_PERSONAL_ACCESS_TOKEN/GITHUB_TOKEN.
- mcpClient.modelProvider and mcpClient.modelName (openai | anthropic | gemini)
- Optional semantic settings (see Configuration)

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
The extension contributes settings under mcpClient. Common keys:
- serverUrl: string — URL of MCP server, or path to stdio binary
- apiKey: string — API key (LLM/MCP token). In stdio mode for GitHub MCP, githubToken is preferred
- githubToken: string — GitHub Personal Access Token for github-mcp-server
- modelProvider: openai | anthropic | gemini — provider for LLM-assisted parsing/presentation
- modelName: string — model identifier (optional)

Semantic selection (optional, for tool ranking):
- embeddingUrl: string — Embedding MCP endpoint
- vectorUrl: string — Vector MCP endpoint
- namespace: string — Namespace for vectors
- topK: number — Default hits to return

Milvus (optional alternative to Vector MCP):
- milvusAddress: string — Host (e.g., localhost)
- milvusPort: number — Port
- milvusUseSSL: boolean — Use TLS
- milvusUser/milvusPassword: string — Auth (if enabled)
- milvusCollectionPrefix: string — Prefix for collections (default tools_)

Behavior notes:
- Tool catalog is requested and cached on connection; no scheduled refresh. Semantic index rebuilds only when the toolset changes.

## Examples

Standard HTTP/WebSocket server (default mode):

```json
{
  "mcpClient.serverUrl": "http://localhost:8080",
  "mcpClient.apiKey": "YOUR_API_KEY"
}
```

Stdio GitHub MCP server (binary or Docker):

```json
{
  "mcpClient.serverUrl": "/path/to/github-mcp-server",
  "mcpClient.githubToken": "YOUR_GITHUB_PAT"
}
```

Docker example via stdio:

```json
{
  "mcpClient.serverUrl": "docker run --rm -i ghcr.io/github/github-mcp-server",
  "mcpClient.githubToken": "YOUR_GITHUB_PAT"
}
```

## Packaging (build a VSIX)

Prerequisites: Node.js, npm

```bash
npm install
# Standard package (no node_modules included)
npm run package
# Package without dependencies (explicit)
npm run package-no-deps
# Webpack bundle (single-file bundle prior to packaging)
npm run webpack-bundle
# Create a full VSIX including dependencies
npm run create-full-vsix
# One-step install to VS Code (local) if available on your system
npm run direct-install
```

You can also use scripts/simple-build.sh or bundle-and-install.sh if present in your environment.

## Optional: Filesystem Server Helper
A helper script is provided to run a demo Filesystem MCP server in WebSocket mode:

```bash
chmod +x ./run-mcp-server.sh
./run-mcp-server.sh --port 8080 --mode websocket --dir /path/to/project
```

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
