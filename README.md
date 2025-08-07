# VS Code MCP Client Extension
# MCP Client for VS Code

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

Run the tests with:

```bash
npm test
```

Or launch the Extension Development Host by pressing F5 in VS Code.

## License

[MIT](LICENSE)
A VS Code extension that implements a Model Control Protocol (MCP) client, similar to Cursor. This extension allows you to connect to MCP servers running in Docker containers and use LLMs through your own API keys.

> **Note:** For detailed installation and usage instructions, please see the [USAGE_GUIDE.md](USAGE_GUIDE.md) file.

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
