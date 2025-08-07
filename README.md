# VS Code MCP Client Extension
# MCP Client for VS Code

## Quick Start

To quickly start the MCP Filesystem server:

```bash
# Make the helper script executable
chmod +x run-mcp-server.sh

# Run with default settings (port 8080, websocket mode)
./run-mcp-server.sh

# Or with custom settings
./run-mcp-server.sh --port 9090 --mode websocket --dir /path/to/project
```

A Visual Studio Code extension that connects to MCP (Model Control Protocol) servers via WebSocket, allowing you to execute prompts and receive responses directly from your editor.

## Features

- Connect to MCP servers via WebSocket
- Execute prompts and receive responses
- Integrate with VS Code's status bar for easy access
- Configurable server URLs and authentication

## Installation

### From VS Code Marketplace

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "MCP Client"
4. Click "Install"

### Manual Installation

1. Download the `.vsix` file from the [release page](https://github.com/yourusername/vscode-mcp-client/releases)
2. Open VS Code
3. Go to the Extensions view (Ctrl+Shift+X)
4. Click on the "..." menu in the top-right corner of the Extensions view
5. Select "Install from VSIX..."
6. Navigate to and select the `.vsix` file
7. Click "Install"

### Generating a VSIX File

To generate a VSIX file from source:

```bash
# Install dependencies if you haven't already
npm install

# Use our direct packaging method that bypasses all dependency validation
npm run direct-package
```

This will create a `.vsix` file in the project root directory that you can share or install manually, regardless of dependency issues.

Alternatively, you can run one of these commands directly in your terminal:

```bash
# Option 1: Direct npx command
npx vsce package --no-dependencies --no-yarn

# Option 2: Ultimate fallback if nothing else works
npx vsce package --no-dependencies --no-yarn --skip-license
```

> **Note:** See [PACKAGING_HELP.md](PACKAGING_HELP.md) for troubleshooting packaging issues.

## Usage

### Configuration

You can configure the extension in VS Code settings:

```json
{
  "mcpClient.serverUrl": "ws://localhost:8080",
  "mcpClient.apiKey": "your-api-key"
}
```

### Commands

This extension provides the following commands:

- `MCP Client: Connect to Server`: Connect to the configured MCP server
- `MCP Client: Execute Prompt`: Send a prompt to the MCP server
- `MCP Client: Disconnect`: Disconnect from the MCP server

### Status Bar

The extension adds an icon to the status bar that shows the connection status:
- 🔴 Disconnected
- 🟡 Connecting
- 🟢 Connected

Clicking on the status bar icon provides quick access to common commands.

## Development

### Building from Source

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/vscode-mcp-client.git
   cd vscode-mcp-client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Compile the extension:
   ```bash
   npm run compile
   ```

4. Package the extension:
   ```bash
   npx vsce package
   ```

### Testing
# VS Code MCP Client Extension

A VS Code extension for connecting to Model Control Protocol (MCP) servers, enabling AI-powered code assistance in your editor.

## Features

- Connect to MCP servers using multiple transport methods:
  - **Standard Mode**: HTTP + WebSocket for standard MCP servers
  - **Filesystem Mode**: Direct WebSocket connection for filesystem MCP servers
  - **Stdio Mode**: Process stdio communication for local MCP server binaries
- Execute prompts against connected MCP servers
- Configurable server URL and API key

## Usage

### Connection Types

#### 1. Standard HTTP/WebSocket Mode

For MCP servers exposing an HTTP API and WebSocket endpoint:

```json
{
  "mcpClient.serverUrl": "http://localhost:3000",
  "mcpClient.apiKey": "your-api-key",
  "mcpClient.serverType": "standard"
}
```

#### 2. Filesystem (Direct WebSocket) Mode

For MCP servers that only expose a WebSocket endpoint:

```json
{
  "mcpClient.serverUrl": "ws://localhost:3000", 
  "mcpClient.serverType": "filesystem"
}
```

#### 3. Stdio Mode (NEW)

For directly communicating with an MCP server binary via standard input/output:

```json
{
  "mcpClient.serverUrl": "/path/to/github-mcp-server",
  "mcpClient.apiKey": "your-github-token",
  "mcpClient.serverType": "stdio"
}
```

The `serverUrl` should contain the path to the MCP server binary. You can include arguments, and the extension will automatically add the `stdio` argument if not present.

Example with Docker:

```json
{
  "mcpClient.serverUrl": "docker run --rm -i ghcr.io/github/github-mcp-server",
  "mcpClient.apiKey": "your-github-token",
  "mcpClient.serverType": "stdio"
}
```

## Commands

- **MCP: Connect to Server**: Connect to the configured MCP server
- **MCP: Disconnect**: Disconnect from the current MCP server
- **MCP: Execute Prompt**: Send a prompt to the connected MCP server

## Configuration

The extension provides the following settings:

- `mcpClient.serverUrl`: URL of the MCP server or path to MCP server binary for stdio mode
- `mcpClient.apiKey`: API Key for the LLM service
- `mcpClient.githubToken`: GitHub Personal Access Token required for github-mcp-server
- `mcpClient.serverType`: Type of MCP server connection (standard, filesystem, or stdio)

### GitHub MCP Server Configuration

To use with the GitHub MCP server:

1. Set `mcpClient.serverUrl` to the path of your github-mcp-server binary (e.g., `/home/user/mcp/github-mcp-server`)
2. Set `mcpClient.githubToken` to your GitHub Personal Access Token
3. Set `mcpClient.serverType` to `stdio`

See [GITHUB_TOKEN_GUIDE.md](GITHUB_TOKEN_GUIDE.md) for detailed instructions on setting up your GitHub token.

## Development

```bash
# Install dependencies
npm install

# Build extension
npm run compile

# Package extension
npm run package
```

## License

MIT
Run the tests with:

```bash
npm test
```

Or launch the Extension Development Host by pressing F5 in VS Code.

## License

[MIT](LICENSE)
A VS Code extension that implements a Model Control Protocol (MCP) client, similar to Cursor. This extension allows you to connect to MCP servers running in Docker containers and use LLMs through your own API keys.

> **Note:** For detailed installation and usage instructions, please see the [USAGE_GUIDE.md](USAGE_GUIDE.md) file.
# VS Code MCP Client Extension

This extension provides Model Context Protocol (MCP) client integration for VS Code.

## Configuration

The extension supports two types of MCP servers:

### 1. Standard MCP Servers

These servers use HTTP for session establishment and WebSockets for communication.

### 2. MCP Filesystem Servers

These servers use direct WebSocket communication without HTTP. To use with the MCP Filesystem server:

```bash
# Start the Docker container
docker-compose up -d
```
# VS Code MCP Client Extension
# MCP Client Extension for VS Code

This extension provides MCP Client functionality for VS Code.

## Packaging Options

There are several ways to package this extension:

### 1. Webpack Bundle (Recommended)

This creates a VSIX with a single bundled JavaScript file containing all dependencies:

```bash
npm run webpack-bundle
```

This is the most reliable approach as it bundles all code into a single file, avoiding dependency issues.

### 2. Full Package with All Dependencies

This creates a VSIX that includes all node_modules dependencies:

```bash
npm run create-full-vsix
```

This approach ensures all dependencies are included in the VSIX package.

### 3. Bundle with Required Dependencies Only

This creates a smaller VSIX that includes only the essential dependencies:

```bash
npm run bundle
```

This approach modifies the .vscodeignore file temporarily to include only specified dependencies.

### 4. Standard Package (No Dependencies)

This creates a VSIX that excludes node_modules, relying on dependencies being installed separately:

```bash
npm run package-no-deps
```

## Installation

To install the extension in VS Code:

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Click the "..." menu in the top-right corner
4. Select "Install from VSIX..."
5. Navigate to and select the generated VSIX file

## Development

- `npm run compile` - Compile TypeScript
- `npm run watch` - Watch for changes
- `npm run lint` - Lint code
- `npm test` - Run tests
A VS Code extension that connects to MCP (Machine Coding Protocol) servers to provide AI-assisted coding capabilities.

## Features

- Connect to MCP servers via WebSocket or stdio protocol
- Execute AI prompts directly from VS Code
- Built-in support for the GitHub MCP server
- Status bar integration to show connection state

## Installation

### Automatic Installation

The easiest way to install this extension is by running the provided installation script:

```bash
./bundle-and-install.sh
```

This script will:
1. Compile the TypeScript code
2. Package the extension into a VSIX file
3. Install the extension in VS Code
4. Start the MCP server Docker container if available

### Manual Installation

If you prefer to install manually:

1. Package the extension:
```bash
npm run bundle
```

2. Install the generated VSIX file:
```bash
code --install-extension nys-1.2.2.vsix
```

## Setup

1. Install and start the extension
2. Open VS Code settings and configure the MCP client:
   - `mcpClient.serverUrl`: URL of the MCP server (default: `http://localhost:8080`)
   - `mcpClient.apiKey`: Your API key for the LLM service
   - `mcpClient.serverType`: Select `stdio` for the GitHub MCP server

3. Connect to the server using the command palette: `MCP: Connect to Server`

## Using Docker for MCP Server

This extension works with the GitHub MCP server Docker container. To start it:

```bash
docker-compose up -d
```

The Docker configuration is already set up in the `docker-compose.yml` file.

## Usage

1. Connect to the MCP server: `Ctrl+Shift+P` → `MCP: Connect to Server`
2. Execute a prompt: `Ctrl+Shift+P` → `MCP: Execute Prompt`
3. Enter your prompt and view the AI response in the results panel

For more detailed instructions, see [USAGE_GUIDE.md](USAGE_GUIDE.md).

## Development

### Prerequisites

- Node.js and npm
- VS Code
- Docker (for running the MCP server)

### Building from Source

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Package the extension
npm run bundle
```

## Publishing

See [publishGuide.md](publishGuide.md) for detailed publishing instructions.

## License

See the [LICENSE](LICENSE) file for license rights and limitations.
Make sure your docker-compose.yml has the correct command to start the server in WebSocket mode:

```yaml
command: ["--mode", "websocket", "--port", "8080", "/workspace"]
```

## Usage

```typescript
import { McpClient, McpServerType } from './mcp/mcpClient';

// For standard MCP servers
const client = new McpClient();
await client.connect('https://your-mcp-server.com', 'your-api-key');

// For MCP Filesystem servers
const filesystemClient = new McpClient();
await filesystemClient.connect('ws://localhost:8080', '', McpServerType.FileSystem);

// Execute a prompt
const response = await client.executePrompt('Hello, world!');
console.log(response);
```

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for details on updates and changes.
## Features

- Connect to MCP servers
- Execute AI prompts with current file context
- View AI responses in a dedicated panel
- Status bar indicators for connection and processing status

## Requirements

- VS Code 1.60.0 or higher
- Access to an MCP server (can be run locally in Docker)
- LLM API key (e.g., OpenAI, Anthropic, etc.)

## Setup

1. Install the extension in VS Code
2. Configure the extension settings:
   - `mcpClient.serverUrl`: URL of your MCP server
   - `mcpClient.apiKey`: Your LLM API key
3. Connect to the server using the command palette (`MCP: Connect to Server`)

## Usage

1. Connect to an MCP server using the command palette or by clicking the connection status in the status bar
2. Execute a prompt using the command palette (`MCP: Execute Prompt`)
3. View the AI response in the dedicated panel

## Extension Settings

This extension contributes the following settings:

* `mcpClient.serverUrl`: URL of the MCP server (default: http://localhost:8080)
* `mcpClient.apiKey`: API Key for the LLM service

## Setting Up Your Own MCP Server

You'll need to set up your own MCP server to use with this extension. The server should be compatible with the Model Control Protocol.

### Running with Docker

```bash
docker run -p 8080:8080 -e API_KEY=your_api_key your-mcp-server-image
```

## Development

### Building the Extension

1. Clone the repository
2. Run `npm install` to install dependencies
3. Run `npm run compile` to compile the TypeScript code
4. Press F5 to run the extension in debug mode

## Next Steps

- Implement the MCP server component that can be run in a Docker container
- Add support for different LLM providers
- Implement streaming responses
- Add code completion features

## License

MIT
