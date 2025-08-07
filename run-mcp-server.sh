#!/bin/bash
#!/bin/bash

# This script runs the GitHub MCP server in Docker

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "⚠️ docker-compose not found. Falling back to docker run command."
    USE_COMPOSE=0
else
    USE_COMPOSE=1
fi

# Check if the MCP server is already running
if docker ps | grep -q "github-mcp-server"; then
    echo "⚠️ MCP server is already running. Stopping current instance..."
    if [ $USE_COMPOSE -eq 1 ] && [ -f "docker-compose.yml" ]; then
        docker-compose down
    else
        docker stop github-mcp-server
        docker rm github-mcp-server
    fi
fi

# Start the MCP server
echo "🚀 Starting GitHub MCP server..."

if [ $USE_COMPOSE -eq 1 ] && [ -f "docker-compose.yml" ]; then
    echo "Using docker-compose to start the server"
    docker-compose up -d
else
    echo "Using docker run to start the server"
    docker run -d --name github-mcp-server \
        --stdin_open \
        --tty \
        ghcr.io/github/github-mcp-server:latest stdio
fi

# Check if the server started successfully
if docker ps | grep -q "github-mcp-server"; then
    echo "✅ MCP server started successfully"
    echo ""    
    echo "📋 To connect to the server:"    
    echo "1. Open VS Code"    
    echo "2. Use the command palette (Ctrl+Shift+P)"    
    echo "3. Run 'MCP: Connect to Server'"    
    echo ""    
    echo "🔌 Server connection settings:"    
    echo "- Server Type: stdio"    
    echo "- Server Path: Use docker-compose.yml configuration"    
    echo ""    
    echo "📝 See USAGE_GUIDE.md for more details"
else
    echo "❌ Failed to start MCP server"
fi
# Helper script to run MCP Filesystem server

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed or not in PATH"
    exit 1
fi

# Default values
PORT=8080
MODE="websocket"
DIR=$(pwd)

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --port)
      PORT="$2"
      shift 2
      ;;
    --mode)
      MODE="$2"
      shift 2
      ;;
    --dir)
      DIR="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Run the Docker container
echo "Starting MCP Filesystem server on port $PORT in $MODE mode"
echo "Allowed directory: $DIR"

docker run -p "${PORT}:${PORT}" \
  -v "${DIR}:/workspace" \
  mcp/filesystem \
  --mode "${MODE}" \
  --port "${PORT}" \
  /workspace
