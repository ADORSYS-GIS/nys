# Mira Workflow System

A pure TypeScript workflow system integrated directly into the VSCode extension, providing AI-powered task automation without external dependencies.

## 🚀 Features

- **Pure TypeScript**: No external processes or Python dependencies
- **Integrated**: Runs directly within the VSCode extension
- **Extensible**: Easy to add new tools and workflows
- **Type Safe**: Full TypeScript integration
- **Fast**: Direct function calls, no serialization overhead

## 📁 Structure

```
src/workflow/typescript/
├── types.ts                           # Core type definitions
├── baseTool.ts                        # Base tool interface
├── toolRegistry.ts                    # Tool management
├── workflowEngine.ts                  # Workflow execution engine
├── typescriptWorkflowManager.ts       # Main workflow manager
├── typescriptWorkflowCommands.ts      # VSCode commands
├── tools/
│   ├── calculatorTool.ts              # Calculator implementation
│   └── webSearchTool.ts               # Web search implementation
└── nodes/
    ├── baseNode.ts                    # Base node interface
    ├── startNode.ts                   # Start node
    ├── assistantNode.ts               # Assistant node
    ├── toolNode.ts                    # Tool execution node
    └── endNode.ts                     # End node
```

## 🎮 Available Commands

- `Mira Workflow: Calculator` - Execute calculator workflow
- `Mira Workflow: Multi-Tool` - Execute multi-tool workflow  
- `Mira Workflow: Custom Workflow` - Execute custom workflow
- `Mira Workflow: Show Status` - Show system status
- `Mira Workflow: Show Output` - Show output channel

## 🔧 Usage

### 1. Calculator Workflow
```typescript
// Execute: Nys Workflow: Calculator
// Input: 2 + 3 * 4
// Output: 14
```

### 2. Multi-Tool Workflow
```typescript
// Execute: Nys Workflow: Multi-Tool
// Input: Calculate 5 * 7 and search for Python tutorials
// Output: Uses multiple tools to accomplish the task
```

### 3. Custom Workflow
```typescript
// Execute: Nys Workflow: Custom Workflow
// Input: Any custom request
// Output: Processes through the workflow engine
```

## 🛠️ Development

### Adding New Tools

1. Create a new tool class extending `BaseTool`:
```typescript
export class MyTool extends BaseTool {
    constructor() {
        super('my_tool', 'Description of my tool');
    }

    async execute(input: ToolInput): Promise<ToolOutput> {
        // Tool implementation
        return { success: true, result: 'output' };
    }
}
```

2. Register the tool in `TypeScriptWorkflowManager`:
```typescript
this.toolRegistry.registerTool(new MyTool());
```

### Adding New Workflows

1. Create workflow configuration:
```typescript
const config: WorkflowConfig = {
    workflowName: 'my_workflow',
    modelProvider: 'typescript',
    modelName: 'built-in',
    maxIterations: 10,
    timeoutSeconds: 300,
    enableParallelExecution: false,
    enableRetry: true,
    logLevel: 'INFO',
    metadata: {}
};
```

2. Initialize workflow in `TypeScriptWorkflowManager`:
```typescript
const workflow = new WorkflowEngine(config, this.toolRegistry);
this.workflows.set('my_workflow', workflow);
```

## 🧪 Testing

1. Compile the extension:
```bash
npm run compile
```

2. Run in debug mode (F5)

3. Test commands via Command Palette (Ctrl+Shift+P)

## 📊 Architecture

The workflow system follows a node-based architecture:

```
Start → Assistant → Tool → End
  ↓        ↓        ↓
Input   Process   Execute
```

- **Start Node**: Initializes workflow state
- **Assistant Node**: Processes user input and determines actions
- **Tool Node**: Executes registered tools
- **End Node**: Finalizes workflow and returns results

## 🔮 Future Enhancements

- [ ] Add more built-in tools (file operations, web search, etc.)
- [ ] Implement conditional and parallel node support
- [ ] Add MCP client implementation in TypeScript
- [ ] Create plugin system for custom tools
- [ ] Add workflow visualization
- [ ] Implement workflow persistence

## 📝 Notes

This system replaces the previous Python-based approach, providing better integration, performance, and user experience while maintaining extensibility for future enhancements.
