# Mira - SPARC Workflow-Driven Development Assistant

A Visual Studio Code extension that implements a **workflow-driven assistant** based on the **SPARC framework** (Specification → Pseudocode → Architecture → Refinement → Completion). The assistant is **issue-driven**: every new task is stored as an *issue folder*, and each issue goes through **Design → Build → Debug** modes for systematic development.

## 🎯 **Core Philosophy**

Mira transforms development from ad-hoc coding to structured, traceable workflows. Every development task becomes an issue that progresses through three distinct phases:

- **🎨 Design Mode**: Analyze requirements, generate specifications, and create technical guidelines
- **🔨 Build Mode**: Generate code, create project structure, and implement features  
- **🐛 Debug Mode**: Identify issues, apply fixes, and optimize performance

This ensures every piece of code has clear requirements, documented decisions, and traceable evolution.

## 🚀 **Key Features**

### **Issue-Driven Workflow System**
- **Issue Folder Structure**: Each task gets a dedicated folder with requirements, guidelines, notes, and outputs
- **Three-Mode Progression**: Design → Build → Debug workflow for systematic development
- **Persistent State Management**: All workflow state stored in `.nys/` directory for session continuity
- **Traceable Development**: Every code change linked to specific requirements and decisions

### **SPARC Framework Integration**
- **Specification**: Automated requirements extraction and technical specification generation
- **Pseudocode**: Architecture planning and design documentation
- **Architecture**: Project structure planning and dependency management
- **Refinement**: Iterative improvement and optimization
- **Completion**: Final implementation and testing

### **Advanced Tool Integration**
- **MCP Server Support**: Connect to HTTP/WebSocket servers and local stdio binaries
- **Built-in Tools**: Computation, search, parsing, and file operations
- **External Data Sources**: GitHub, web APIs, and custom data integrations
- **AI Chat Interface**: Context-aware conversations with project understanding

### **Development Workflow Features**
- **Mode-Specific Processing**: Tailored workflows for design, build, and debug phases
- **File System Integration**: Direct project file manipulation and structure management
- **State Persistence**: Workflow progress saved across sessions
- **Rollback Capability**: Version control integration for code state management

## 📂 **Issue Folder Structure**

Each development task is organized in a dedicated issue folder for complete traceability:

```
/issues/ISSUE-001/
   ├── requirements.md   # Generated requirements & technical specs
   ├── guidelines.md     # Style guides, dependencies, coding constraints  
   ├── notes.md          # Iterations, debug notes, brainstorming
   ├── status.json       # Tracks mode (design/build/debug), progress, state
```

## 🔄 **Workflow Modes**

### **🎨 Design Mode**
- **Input**: User prompt (problem statement)
- **Process**: 
  - Analyze user input & project state
  - Extract features and constraints
  - Generate `requirements.md` and `guidelines.md`
- **Output**: Structured documents inside issue folder

### **🔨 Build Mode**  
- **Input**: `requirements.md` + `guidelines.md`
- **Process**:
  - Parse requirements and technical specifications
  - Propose project structure (if needed)
  - Generate source code, configs, tests
  - Update `status.json` with progress
- **Output**: Code written to project files or `outputs/`

### **🐛 Debug Mode**
- **Input**: Existing code + requirements/guidelines
- **Process**:
  - Identify bugs, errors, or performance issues
  - Generate fixes and improvements
  - Apply fixes to project files
  - Record debug notes in `notes.md`
- **Output**: Updated project files and documentation

## 🏗️ **Architecture Overview**

Mira is architected for modular, persistent, and orchestrated AI workflows:

- **SPARC Workflow Engine**: Core orchestration system managing Design → Build → Debug transitions
- **Issue Management System**: Persistent issue folders with structured metadata and state tracking
- **Tool Integration Layer**: Built-in tools + MCP server support for external capabilities
- **File System Integration**: Direct project manipulation with version control awareness
- **State Persistence**: All workflow state stored in `.nys/` directory for session continuity

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

## 🚀 **Quick Start**

### **Installation**
1. **From VS Code Marketplace**: Search for "Mira" in Extensions view and install
2. **From Source**: Build VSIX package and install via Extensions → Install from VSIX

### **Getting Started**
1. **Create Your First Issue**: 
   - Open Command Palette → `Mira: Create New Issue`
   - Enter a descriptive title and problem statement

2. **Start in Design Mode**:
   - Select your issue in the Mira sidebar
   - Switch to Design mode using the dropdown
   - Describe your requirements in the chat

3. **Progress Through Workflow**:
   - **Design**: Generate requirements and guidelines
   - **Build**: Generate code and project structure  
   - **Debug**: Fix issues and optimize performance

### **Key Commands**
- `Mira: Create New Issue` - Start a new development task
- `Mira: Switch to Design Mode` - Enter requirements analysis phase
- `Mira: Switch to Build Mode` - Enter code generation phase
- `Mira: Switch to Debug Mode` - Enter issue fixing phase
- `Mira: Open Issue Manager` - Access the main interface

## 📋 **Complete Command Reference**

### **Issue Management**
- `Mira: Create New Issue` - Start a new development task with issue folder
- `Mira: Open Issue Manager` - Access the main Mira interface
- `Mira: Run Build` - Execute build process for current issue
- `Mira: Run Tests` - Execute test suite for current issue  
- `Mira: Collect Logs` - Gather and analyze error logs

### **Workflow Mode Control**
- `Mira: Switch to Design Mode` - Enter requirements analysis phase
- `Mira: Switch to Build Mode` - Enter code generation phase
- `Mira: Switch to Debug Mode` - Enter issue fixing phase

### **MCP Integration** 
- `MCP: Connect to Server` - Connect to external MCP servers
- `MCP: Disconnect` - Disconnect from MCP servers
- `MCP: Execute Prompt` - Send prompt to connected MCP server
- `MCP: List Available Tools` - Show available MCP tools
- `MCP: Open Chat View` - Open dedicated MCP chat interface

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

## 📚 Documentation

Comprehensive documentation is available in the `docs/` folder:

- **[📖 Complete Documentation](./docs/README.md)** - Main documentation index
- **[📋 Documentation Summary](./docs/SUMMARY.md)** - Overview of all documentation
- **[🚀 Quick Start Guide](./docs/user-guide/quick-start.md)** - Get up and running quickly
- **[🎯 User Guide](./docs/user-guide/SPARC_WORKFLOW_ENGINE_DOCUMENTATION.md)** - Complete user documentation
- **[🏗️ Graph Architecture](./docs/technical/SPARC_GRAPH_ARCHITECTURE.md)** - AI-assisted workflow orchestration
- **[🔧 API Reference](./docs/api-reference/core-api.md)** - Developer API documentation
- **[🔄 Graph API Reference](./docs/api-reference/graph-api.md)** - AI agents, LangGraph, and MCP servers
- **[📊 Technical Specification](./docs/technical/SPARC_TECHNICAL_SPECIFICATION.md)** - Deep technical details
- **[💡 Examples](./docs/examples/basic-usage.md)** - Practical usage examples
- **[📈 Workflow Diagrams](./docs/diagrams/SPARC_WORKFLOW_DIAGRAM.md)** - Visual workflow representation
- **[🔄 Graph Diagrams](./docs/diagrams/SPARC_GRAPH_DIAGRAM.md)** - AI agent and graph architecture visuals

## Links
- Changelog: CHANGELOG.md
- Usage guide: USAGE_GUIDE.md
- Publish guide: publishGuide.md
- Issues & Support: https://github.com/Christiantyemele/mimie/issues

## License
MIT
