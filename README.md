# VS Code MCP Client Extension

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
