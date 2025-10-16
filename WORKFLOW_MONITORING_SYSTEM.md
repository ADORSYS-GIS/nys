# Workflow Monitoring System Documentation

## Overview

The Workflow Monitoring System provides comprehensive real-time visibility into all SPARC workflows running in the Mira extension. Users can see internal processing, expand/collapse workflow components, and monitor execution progress with persistent state management.

## Key Features

### 🔍 **Real-Time Monitoring**
- Live updates of workflow execution steps
- Real-time status tracking (pending, running, completed, failed)
- Automatic refresh every second
- Session-based organization

### 📊 **Expandable/Collapsible Views**
- Hierarchical step visualization
- Parent-child step relationships
- Expandable session details
- Collapsible step content

### 🏷️ **Issue Identification**
- Automatic extraction of issue titles from `.nys` folder
- Session naming based on issue titles
- Easy identification of workflow context

### 💾 **Persistent State Management**
- Sessions persist across VSCode restarts
- Export/import session data
- Clear individual or all sessions
- Comprehensive logging

## Architecture

### Core Components

#### 1. **WorkflowMonitor** (`workflowMonitor.ts`)
- Central monitoring service
- Session management
- Real-time updates
- Webview panel management

#### 2. **MonitoredWorkflowExecutor** (`monitoredWorkflowExecutor.ts`)
- Wrapper for workflow execution
- Automatic step tracking
- Error handling and logging
- Child step management

#### 3. **WorkflowMonitorCommands** (`workflowMonitorCommands.ts`)
- VSCode command registration
- Integration with extension lifecycle
- Command palette integration

#### 4. **MonitoredDesignWorkflow** (`monitoredDesignWorkflow.ts`)
- Example implementation
- Demonstrates monitoring integration
- Complete workflow lifecycle

## Usage

### Starting a Monitored Workflow

```typescript
import { MonitoredWorkflowExecutor } from './debug/monitoredWorkflowExecutor';

const executor = new MonitoredWorkflowExecutor(context);

// Start workflow session
const sessionId = await executor.startWorkflow('design_orchestration', issuePath);

// Execute monitored steps
const result = await executor.executeStep(
    'Analyze User Input',
    'llm',
    async () => analyzeInput(userInput),
    { userInput },
    { step: 1, totalSteps: 4 }
);
```

### Using the Monitor Panel

1. **Open Monitor**: `Ctrl+Shift+P` → "Mira: Show Workflow Monitor"
2. **View Sessions**: All active and completed sessions are displayed
3. **Expand/Collapse**: Click on session headers or step headers
4. **Export Data**: Click "Export Session" to save session data
5. **Clear Sessions**: Click "Clear Session" or "Clear All"

### Demo Commands

- **`mimie.runMonitoredDesignDemo`**: Run a complete monitored design workflow
- **`mimie.showWorkflowMonitorDemo`**: Open the workflow monitor panel

## Session Structure

### WorkflowSession
```typescript
interface WorkflowSession {
    id: string;                    // Unique session identifier
    issueTitle: string;            // Extracted from .nys folder
    issuePath: string;             // Path to issue folder
    workflowType: string;          // Type of workflow (design_orchestration, etc.)
    status: 'running' | 'completed' | 'failed' | 'paused';
    startTime: number;             // Session start timestamp
    endTime?: number;              // Session end timestamp
    steps: WorkflowExecutionStep[]; // Execution steps
    currentStep?: string;          // Currently executing step ID
    logs: string[];               // Session log entries
    expanded?: boolean;           // UI expansion state
}
```

### WorkflowExecutionStep
```typescript
interface WorkflowExecutionStep {
    id: string;                   // Unique step identifier
    name: string;                 // Human-readable step name
    type: 'start' | 'node' | 'tool' | 'llm' | 'end' | 'error';
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    startTime?: number;           // Step start timestamp
    endTime?: number;             // Step end timestamp
    duration?: number;            // Step duration in milliseconds
    input?: any;                  // Step input data
    output?: any;                 // Step output data
    error?: string;               // Error message if failed
    children?: WorkflowExecutionStep[]; // Child steps
    expanded?: boolean;           // UI expansion state
    metadata?: Record<string, any>; // Additional metadata
}
```

## Integration Guide

### Adding Monitoring to Existing Workflows

1. **Import the executor**:
   ```typescript
   import { MonitoredWorkflowExecutor } from './debug/monitoredWorkflowExecutor';
   ```

2. **Initialize in constructor**:
   ```typescript
   constructor(context: vscode.ExtensionContext) {
       this.executor = new MonitoredWorkflowExecutor(context);
   }
   ```

3. **Start session**:
   ```typescript
   const sessionId = await this.executor.startWorkflow('your_workflow_type', issuePath);
   ```

4. **Wrap steps**:
   ```typescript
   const result = await this.executor.executeStep(
       'Step Name',
       'step_type',
       async () => yourStepFunction(),
       inputData,
       metadata
   );
   ```

5. **Complete session**:
   ```typescript
   this.executor.completeWorkflow('completed');
   ```

### Creating Child Steps

```typescript
const childResult = await this.executor.executeChildStep(
    parentStepId,
    'Child Step Name',
    'step_type',
    async () => childStepFunction(),
    inputData,
    metadata
);
```

### Adding Logs

```typescript
this.executor.addLog('Step completed successfully', 'info');
this.executor.addLog('Warning: API rate limit approaching', 'warn');
this.executor.addLog('Error: Connection failed', 'error');
```

## Issue Title Extraction

The system automatically extracts issue titles from `.nys` folders:

1. **Primary Method**: Looks for markdown files with `# Title` format
2. **Fallback**: Uses folder name as title
3. **Error Handling**: Graceful fallback to "Untitled Issue"

### Supported Formats
- `# Issue Title` in any `.md` file
- Folder name as fallback
- Custom extraction can be added

## Webview Panel Features

### Real-Time Updates
- Auto-refresh every second
- Live status updates
- Progress tracking
- Error highlighting

### Interactive Elements
- Expandable/collapsible sessions
- Expandable/collapsible steps
- Export functionality
- Clear operations

### Visual Indicators
- Status badges (running, completed, failed)
- Duration display
- Progress indicators
- Error highlighting

## Commands Reference

| Command | Description |
|---------|-------------|
| `mimie.showWorkflowMonitor` | Open the workflow monitor panel |
| `mimie.startWorkflowSession` | Start a new workflow session |
| `mimie.addWorkflowStep` | Add a step to a session |
| `mimie.updateWorkflowStep` | Update step status/output |
| `mimie.completeWorkflowSession` | Complete a workflow session |
| `mimie.addWorkflowLog` | Add log entry to session |
| `mimie.addWorkflowChildStep` | Add child step to parent step |
| `mimie.runMonitoredDesignDemo` | Run monitored design workflow demo |
| `mimie.showWorkflowMonitorDemo` | Open monitor panel (demo) |

## Error Handling

### Graceful Degradation
- Missing API keys → Informative fallback messages
- Network timeouts → Retry with exponential backoff
- Step failures → Continue with remaining steps
- Session errors → Preserve partial data

### Error Display
- Red status badges for failed steps
- Error messages in step content
- Detailed error logs
- Stack trace preservation

## Performance Considerations

### Memory Management
- Sessions auto-cleanup after completion
- Configurable session retention
- Efficient data structures
- Minimal memory footprint

### Update Frequency
- 1-second refresh interval
- Debounced updates
- Efficient diff algorithms
- Minimal DOM updates

## Future Enhancements

### Planned Features
- [ ] Workflow templates
- [ ] Custom step types
- [ ] Performance metrics
- [ ] Workflow comparison
- [ ] Team collaboration features
- [ ] Advanced filtering and search
- [ ] Workflow replay functionality
- [ ] Integration with external monitoring tools

### Extension Points
- Custom step renderers
- Custom log formatters
- Custom export formats
- Custom session storage backends

## Troubleshooting

### Common Issues

1. **Monitor panel not updating**
   - Check if session is active
   - Verify command registration
   - Check console for errors

2. **Steps not appearing**
   - Ensure `executeStep` is called
   - Check session ID validity
   - Verify step data format

3. **Export not working**
   - Check file permissions
   - Verify workspace folder
   - Check disk space

### Debug Commands
- `mimie.showWorkflowMonitor` - Open monitor panel
- Check VSCode Developer Console for errors
- Use `console.log` in workflow steps for debugging

## Conclusion

The Workflow Monitoring System provides comprehensive visibility into Mira's SPARC workflows, enabling users to understand, debug, and optimize their development processes. With real-time monitoring, expandable views, and persistent state management, developers can track every aspect of their workflow execution and identify areas for improvement.
