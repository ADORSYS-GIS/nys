# VS Code MCP Client Usage Guide

This guide provides detailed instructions for setting up and using the VS Code MCP Client extension with Docker-based MCP servers.

## Prerequisites

- Docker installed on your system
- VS Code 1.60.0 or higher
- The VS Code MCP Client extension installed

## Setup Instructions

### 1. Start the MCP Filesystem Server

The easiest way to get started is with the MCP Filesystem server from Docker Hub:

```bash
# Option 1: Using docker run
docker run -p 8080:8080 -v $(pwd):/workspace mcp/filesystem /workspace

# Option 2: Using docker-compose
docker-compose up -d
```

### 2. Configure VS Code Extension

1. Open VS Code settings (File > Preferences > Settings)
2. Search for "MCP Client"
3. Set the following settings:
   - **Server URL**: `http://localhost:8080` or `ws://localhost:8080` (depending on your server)
   - **API Key**: If your server requires an API key, enter it here

### 3. Connect to the Server

1. Press `Ctrl+Shift+P` to open the command palette
2. Type "MCP: Connect to Server" and press Enter
3. You should see a notification that you're connected to the server

## Usage

### Executing Prompts

1. Open a file you want to work with
2. Press `Ctrl+Shift+P` and select "MCP: Execute Prompt"
3. Enter your prompt in the input box
4. The AI response will appear in a new panel

### Disconnecting

1. Press `Ctrl+Shift+P` and select "MCP: Disconnect"

## Troubleshooting

### Connection Issues

If you see "Command 'MCP: Connect to Server' resulted in an error":

1. Check that your Docker container is running:
   ```bash
   docker ps | grep mcp-filesystem
   ```

2. Verify the server URL in VS Code settings matches your Docker port mapping

3. If using WebSocket (ws://) protocol, ensure the MCP server supports WebSocket connections

4. Try restarting VS Code and the Docker container

### Docker Volume Mapping

Make sure your Docker volume mapping is correct. The path you mount in the container must match the path you specify in the command.

Example:
```bash
docker run -p 8080:8080 -v $(pwd):/workspace mcp/filesystem /workspace
```

Here `/workspace` appears twice:
1. As the container path in the volume mapping
2. As the allowed directory parameter to the MCP server

## Advanced Configuration

### Using Environment Variables

Some MCP servers support additional configuration via environment variables:

```bash
docker run -p 8080:8080 \
  -e DEBUG=true \
  -e LOG_LEVEL=debug \
  -v $(pwd):/workspace \
  mcp/filesystem /workspace
```

### Multiple Allowed Directories

To allow the MCP server to access multiple directories:

```bash
docker run -p 8080:8080 \
  -v $(pwd):/workspace \
  -v /tmp:/tmp \
  mcp/filesystem /workspace /tmp
```

## Available MCP Servers

- **mcp/filesystem**: Provides file system access
- **mongodb/mongodb-mcp-server**: MongoDB integration
- Other MCP servers are available on Docker Hub

## Support

If you encounter issues, please report them on our [GitHub repository](https://github.com/yourusername/vscode-mcp-client/issues).
