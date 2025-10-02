# Nys Workflow System - Complete Flow Diagram

## 🔄 **Complete User Journey**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Install         │ -> │ Create Issue    │ -> │ Switch to       │ -> │ Send First      │
│ Extension       │    │                 │    │ Design Mode     │    │ Prompt          │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🎨 **Design Mode Workflow**

```
User Prompt
     │
     ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Design Orchestration Workflow                                                  │
│                                                                                 │
│ ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐              │
│ │ Start Node      │ -> │ Design          │ -> │ Requirements    │              │
│ │                 │    │ Orchestration   │    │ Generation      │              │
│ │ - Initialize    │    │ Node            │    │ Node            │              │
│ │   workflow      │    │                 │    │                 │              │
│ │   state         │    │ - Analyze user  │    │ - Generate      │              │
│ │                 │    │   prompt        │    │   detailed      │              │
│ │                 │    │ - Extract       │    │   requirements  │              │
│ │                 │    │   features      │    │ - Create        │              │
| |                 |    | - use availale  |    |                 |              |
| |                 |    |   tools         |    |                 |              |
| |                 |    |   and datasource|    |                 |              |
| |                 |    |  to read to read|    |                 |              |
| |                 |    |      the current|    |                 |              |
| |                 |    |      project    |    |                 |              |
| |                 |    |      structure  |    |                 |              |
| |                 |    | - build from    |    |                 |              |
| |                 |    | scratch or      |    |                 |              |
| |                 |    | continue editing|    |                 |              |
| |                 |    | requirement depe|    |                 |              |
| |                 |    | ding on prompt  |    |                 |              |
│ │                 │    │ - Assess        │    │   technical     │              │
│ │                 │    │   complexity    │    │   specs         │              │
│ │                 │    │ - Determine     │    │                 │
│ └─────────────────┘    └─────────────────┘    └─────────────────┘              │
│                                                                                │
│ ┌─────────────────┐    ┌─────────────────┐                                     │
│ │ File Write      │ <- │ End Node        │                                     │
│ │ Node            │    │                 │                                     │
│ │                 │    │ - Finalize      │                                     │
│ │ - Write         │    │   workflow      │                                     │
│ │   requirements  │    │ - Return        │                                     │
│ │   to issue      │    │   results       │                                     │
│ │   file          │    │                 │                                     │
│ │                 │    │                 │                                     │
│ │                 │    │                 │                                     │
│ │                 │    │                 │                                     │
│ └─────────────────┘    └─────────────────┘                                     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 🔨 **Build Mode Workflow**

```
Switch to Build Mode
     │
     ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Build Generation Workflow                                                       │
│                                                                                 │
│ ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐              │
│ │ Start Node      │ -> │ Requirements    │ -> │ Code            │              │
│ │                 │    │ Reading Node    │    │ Generation      │              │
│ │ - Initialize    │    │                 │    │ Node            │              │
│ │   workflow      │    │ - Read          │    │                 │              │
│ │   state         │    │   requirements  │    │ - Analyze       │              │
│ │                 │    │   from issue    │    │   requirements  │              │
│ │                 │    │   file          │    │ - Generate      │              │
│ │                 │    │ - Parse         │    │   code          │              │
│ │                 │    │   technical     │    │ - Create        │              │
│ │                 │    │   specs         │    │   project       │              │
│ │                 │    │ - Extract       │    │   structure(if neccessary)     │              │
│ │                 │    │   features      │    │ - Implement     │              │
│ │                 │    │                 │    │   features      │              │
│ └─────────────────┘    └─────────────────┘    └─────────────────┘              │
│                                                                                 │
│ ┌─────────────────┐    ┌─────────────────┐                                     │
│ │ End Node        │ <- │ Code Write      │                                     │
│ │                 │    │ Node            │                                     │
│ │ - Finalize      │    │                 │                                     │
│ │   workflow      │    │ - Write code    │                                     │
│ │ - Return        │    │   to project    │                                     │
│ │   results       │    │   files         │                                     │
│ │                 │    │ - Update        │                                     │
│ │                 │    │   project       │                                     │
│ │                 │    │   structure     │                                     │
│ └─────────────────┘    └─────────────────┘                                     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 🐛 **Debug Mode Workflow**

```
Switch to Debug Mode
     │
     ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Debug Fix Workflow                                                              │
│                                                                                 │
│ ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐              │
│ │ Start Node      │ -> │ Issue           │ -> │ Code Fix        │              │
│ │                 │    │ Identification  │    │ Generation      │              │
│ │ - Initialize    │    │ Node            │    │ Node            │              │
│ │   workflow      │    │                 │    │                 │              │
│ │   state         │    │ - Read current  │    │ - Analyze       │              │
│ │                 │    │   code          │    │   issues        │              │
│ │                 │    │ - Identify      │    │ - Generate      │              │
│ │                 │    │   problems      │    │   fixes         │              │
│ │                 │    │ - Analyze       │    │ - Create        │              │
│ │                 │    │   errors        │    │   improved      │              │
│ │                 │    │ - Check         │    │   code          │              │
│ │                 │    │   performance   │    │ - summarized fixes      │              │
| |                 |    |                 |    | and next steps  |              |         
│ └─────────────────┘    └─────────────────┘    └─────────────────┘              │
│                                                                                 │
│ ┌─────────────────┐    ┌─────────────────┐                                     │
│ │ End Node        │ <- │ Code Write      │                                     │
│ │                 │    │ Node            │                                     │
│ │ - Finalize      │    │                 │                                     │
│ │   workflow      │    │ - Write fixed   │                                     │
│ │ - Return        │    │   code to       │                                     │
│ │   results       │    │   project       │                                     │
│ │                 │    │ - Update        │                                     │
│ │                 │    │   files         │                                     │
│ └─────────────────┘    └─────────────────┘                                     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 🔧 **Tool Integration**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Available Tools & MCP Servers                                                   │
│                                                                                 │
│ ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐              │
│ │ Tools           │    │ MCP Servers     │    │ File System     │              │
│ │                 │    │                 │    │ Operations      │              │
│ │ - Calculator    │    │ - HTTP APIs     │    │                 │              │
│ │ - Web Search    │    │ - WebSocket     │    │ - Read files    │              │
│ │ - File Ops      │    │ - Stdio         │    │ - Write files   │              │
│ │ - Custom Tools  │    │ - Custom        │    │ - Create dirs   │              │
│ │                 │    │   servers       │    │ - Manage        │              │
│ │                 │    │                 │    │   structure     │              │
│ └─────────────────┘    └─────────────────┘    └─────────────────┘              │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 📁 **File System Integration**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ File System Operations                                                          │
│                                                                                 │
│ Design Mode:                                                                    │
│ ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐              │
│ │ Issue File      │ -> │ Requirements    │ -> │ Project         │              │
│ │ Creation        │    │ Document        │    │ Structure       │              │
│ │                 │    │ Generation      │    │ Planning        │              │
│ │ - Create issue  │    │                 │    │                 │              │
│ │   file          │    │ - Write         │    │ - Plan file     │              │
│ │ - Initialize    │    │   requirements  │    │   structure     │              │
│ │   structure     │    │ - Add technical │    │ - Define        │              │
│ │ - Set metadata  │    │   specs         │    │   directories   │              │
│ │                 │    │ - Include       │    │ - Plan          │              │
│ │                 │    │   timeline      │    │   dependencies  │              │
│ └─────────────────┘    └─────────────────┘    └─────────────────┘              │
│                                                                                 │
│ Build Mode:                                                                     │
│ ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐              │
│ │ Read            │ -> │ Generate        │ -> │ Write Code      │              │
│ │ Requirements    │    │ Code            │    │ to Project      │              │
│ │                 │    │                 │    │                 │              │
│ │ - Parse issue   │    │ - Create        │    │ - Create        │              │
│ │   file          │    │   source files  │    │   directories   │              │
│ │ - Extract       │    │ - Implement     │    │ - Write         │              │
│ │   specs         │    │   features      │    │   source code   │              │
│ │ - Load          │    │ - Add           │    │ - Create        │              │
│ │   features      │    │   dependencies  │    │   config files  │              │
│ │                 │    │ - Generate      │    │ - Update        │              │
│ │                 │    │   tests         │    │   project       │              │
│ └─────────────────┘    └─────────────────┘    └─────────────────┘              │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 🎯 **Key Integration Points**

### **1. Issue Management Integration**
- **Issue Creation**: New issues trigger workflow initialization
- **Mode Switching**: Design → Build → Debug mode transitions
- **File Management**: Issue files store requirements and progress

### **2. Workflow Orchestration**
- **Design Mode**: User prompt → Requirements generation → File writing
- **Build Mode**: Requirements reading → Code generation → Project writing
- **Debug Mode**: Issue identification → Code fixing → Project updating

### **3. Tool & MCP Integration**
- **Built-in Tools**: Calculator, web search, file operations
- **MCP Servers**: External capabilities via HTTP/WebSocket/Stdio
- **File System**: Direct project file manipulation

### **4. State Management**
- **Workflow State**: Tracks execution progress and results
- **Issue State**: Maintains issue status and metadata
- **Project State**: Manages generated code and structure

## 🚀 **Execution Flow Summary**

1. **User creates issue** → Issue file created
2. **User switches to Design mode** → Design workflow initialized
3. **User sends first prompt** → Design orchestration begins
4. **LLM processes prompt** → Requirements generated
5. **Requirements written to file** → Issue file updated
6. **User switches to Build mode** → Build workflow initialized
7. **Requirements read from file** → Code generation begins
8. **Code generated and written** → Project files created
9. **User switches to Debug mode** → Debug workflow initialized
10. **Issues identified and fixed** → Project updated

This creates a complete, integrated workflow system that seamlessly moves from design to implementation! 🎉
