# Mira SPARC Workflow System - Complete Flow Diagram

## 🔄 **Complete User Journey**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Install         │ -> │ Create Issue    │ -> │ Switch to       │ -> │ Send First      │
│ Extension       │    │ Folder          │    │ Design Mode     │    │ Prompt          │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📂 **Issue Folder Structure**

```
User Creates Issue
        │
        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Issue Folder Structure Creation                                                │
│                                                                                 │
│ /issues/ISSUE-001/                                                             │
│ ├── requirements.md   # Generated in Design Mode                               │
│ ├── guidelines.md     # Generated in Design Mode                               │
│ ├── notes.md          # Updated in Debug Mode                                  │
│ ├── status.json       # Tracks mode, progress, state                           │                        │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 🎨 **Design Mode Workflow (SPARC: Specification)**

```
User Prompt: "Design a user authentication system"
     │
     ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Design Mode - SPARC Specification Phase                                        │
│                                                                                 │
│ ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐              │
│ │ Analysis        │ -> │ Requirements    │ -> │ Guidelines      │              │
│ │ Node            │    │ Generation      │    │ Generation      │              │
│ │                 │    │ Node            │    │ Node            │              │
│ │ - Parse user    │    │                 │    │                 │              │
│ │   prompt        │    │ - Extract       │    │ - Define        │              │
│ │ - Analyze       │    │   functional    │    │   coding        │              │
│ │   project       │    │   requirements  │    │   standards     │              │
│ │   structure     │    │ - Identify      │    │ - Specify       │              │
│ │ - Use available │    │   technical     │    │   technology    │              │
│ │   tools and     │    │   constraints   │    │   stack         │              │
│ │   data sources  │    │ - Define        │    │ - Set           │              │
│ │ - Assess        │    │   acceptance    │    │   architecture  │              │
│ │   complexity    │    │   criteria      │    │   patterns      │              │
│ │ - Determine     │    │ - Plan project  │    │ - Define        │              │
│ │   scope         │    │   structure     │    │   testing       │              │
│ │                 │    │                 │    │   requirements  │              │
│ └─────────────────┘    └─────────────────┘    └─────────────────┘              │
│                                                                                 │
│ ┌─────────────────┐    ┌─────────────────┐                                     │
│ │ File Write      │ <- │ Status Update   │                                     │
│ │ Node            │    │ Node            │                                     │
│ │                 │    │                 │                                     │
│ │ - Write         │    │ - Update        │                                     │
│ │   requirements  │    │   status.json   │                                     │
│ │   to            │    │ - Set mode      │                                     │
│ │   requirements.md│    │   progress      │                                     │
│ │ - Write         │    │ - Record        │                                     │
│ │   guidelines    │    │   completion    │                                     │
│ │   to            │    │   timestamp     │                                     │
│ │   guidelines.md │    │                 │                                     │
│ │                 │    │                 │                                     │
│ └─────────────────┘    └─────────────────┘                                     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 🔨 **Build Mode Workflow (SPARC: Pseudocode + Architecture)**

```
Switch to Build Mode
     │
     ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Build Mode - SPARC Pseudocode + Architecture Phase                             │
│                                                                                 │
│ ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐              │
│ │ Requirements    │ -> │ Architecture    │ -> │ Code            │              │
│ │ Reading         │    │ Planning        │    │ Generation      │              │
│ │ Node            │    │ Node            │    │ Node            │              │
│ │                 │    │                 │    │                 │              │
│ │ - Read          │    │ - Design        │    │ - Generate      │              │
│ │   requirements  │    │   project       │    │   source code   │              │
│ │   from          │    │   structure     │    │ - Create        │              │
│ │   requirements.md│    │ - Plan file     │    │   tests         │              │
│ │ - Parse         │    │   organization  │    │ - Generate      │              │
│ │   technical     │    │ - Define        │    │   configs       │              │
│ │   specs         │    │   dependencies  │    │ - Create        │              │
│ │ - Extract       │    │ - Plan          │    │   documentation │              │
│ │   features      │    │   integration   │    │ - Implement     │              │
│ │ - Load          │    │   points        │    │   features      │              │
│ │   guidelines    │    │ - Create        │    │                 │              │
│ │   from          │    │   pseudocode    │    │                 │              │
│ │   guidelines.md │    │   structure     │    │                 │              │
│ │                 │    │                 │    │                 │              │
│ └─────────────────┘    └─────────────────┘    └─────────────────┘              │
│                                                                                 │
│ ┌─────────────────┐    ┌─────────────────┐                                     │
│ │ Code Write      │ <- │ Status Update   │                                     │
│ │ Node            │    │ Node            │                                     │
│ │                 │    │                 │                                     │
│ │ - Write code    │    │ - Update        │                                     │
│ │   to project    │    │   status.json   │                                     │
│ │   files or      │    │ - Set mode      │                                     │
│ │   outputs/      │    │   progress      │                                     │
│ │ - Update        │    │ - Record        │                                     │
│ │   project       │    │   completion    │                                     │
│ │   structure     │    │   timestamp     │                                     │
│ │ - Create        │    │                 │                                     │
│ │   directories   │    │                 │                                     │
│ │                 │    │                 │                                     │
│ └─────────────────┘    └─────────────────┘                                     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 🐛 **Debug Mode Workflow (SPARC: Refinement + Completion)**

```
Switch to Debug Mode
     │
     ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Debug Mode - SPARC Refinement + Completion Phase                               │
│                                                                                 │
│ ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐              │
│ │ Issue           │ -> │ Analysis        │ -> │ Fix             │              │
│ │ Identification  │    │ Node            │    │ Generation      │              │
│ │ Node            │    │                 │    │ Node            │              │
│ │                 │    │                 │    │                 │              │
│ │ - Read current  │    │ - Analyze       │    │ - Generate      │              │
│ │   code          │    │   issues        │    │   fixes         │              │
│ │ - Identify      │    │ - Root cause    │    │ - Create        │              │
│ │   problems      │    │   analysis      │    │   improved      │              │
│ │ - Analyze       │    │ - Performance   │    │   code          │              │
│ │   errors        │    │   assessment    │    │ - Optimize      │              │
│ │ - Check         │    │ - Security      │    │   performance   │              │
│ │   performance   │    │   review        │    │ - Add error     │              │
│ │ - Review        │    │ - Code quality  │    │   handling      │              │
│ │   requirements  │    │   analysis      │    │ - Improve       │              │
│ │   compliance    │    │ - Identify      │    │   documentation │              │
│ │                 │    │   improvements  │    │                 │              │
│ └─────────────────┘    └─────────────────┘    └─────────────────┘              │
│                                                                                 │
│ ┌─────────────────┐    ┌─────────────────┐                                     │
│ │ Code Update     │ <- │ Documentation   │                                     │
│ │ Node            │    │ Node            │                                     │
│ │                 │    │                 │                                     │
│ │ - Write fixed   │    │ - Update        │                                     │
│ │   code to       │    │   notes.md      │                                     │
│ │   project       │    │ - Record debug  │                                     │
│ │ - Update        │    │   process       │                                     │
│ │   files         │    │ - Document      │                                     │
│ │ - Apply         │    │   solutions     │                                     │
│ │   improvements  │    │ - Update        │                                     │
│ │ - Test fixes    │    │   status.json   │                                     │
│ │                 │    │ - Record        │                                     │
│ │                 │    │   completion    │                                     │
│ └─────────────────┘    └─────────────────┘                                     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 🛠️ **Tool Integration Architecture**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Tool Integration Layer                                                          │
│                                                                                 │
│ ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐              │
│ │ Built-in Tools  │    │ MCP Servers     │    │ File System     │              │
│ │                 │    │                 │    │ Operations      │              │
│ │ - Calculator    │    │ - HTTP APIs     │    │                 │              │
│ │ - Web Search    │    │ - WebSocket     │    │ - Read files    │              │
│ │ - File Ops      │    │ - Stdio         │    │ - Write files   │              │
│ │ - Code Analysis │    │ - Custom        │    │ - Create dirs   │              │
│ │ - Parsing       │    │   servers       │    │ - Manage        │              │
│ │ - Validation    │    │ - GitHub        │    │   structure     │              │
│ │                 │    │ - Database      │    │ - Version       │              │
│ │                 │    │ - External APIs │    │   control       │              │
│ └─────────────────┘    └─────────────────┘    └─────────────────┘              │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 🧠 **State Management System**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ State Management Architecture                                                   │
│                                                                                 │
│ ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐              │
│ │ Workflow State  │    │ Issue State     │    │ Project State   │              │
│ │                 │    │                 │    │                 │              │
│ │ - Current mode  │    │ - Mode progress │    │ - File          │              │
│ │ - Step progress │    │ - Status        │    │   structure     │              │
│ │ - Tool usage    │    │ - Timestamps    │    │ - Dependencies  │              │
│ │ - Error states  │    │ - Next steps    │    │ - Generated     │              │
│ │ - Recovery      │    │ - Activity log  │    │   artifacts     │              │
│ │   information   │    │ - Metadata      │    │ - Integration   │              │
│ │                 │    │                 │    │   points        │              │
│ └─────────────────┘    └─────────────────┘    └─────────────────┘              │
│                                                                                 │
│ ┌─────────────────┐    ┌─────────────────┐                                     │
│ │ Mode Switching  │    │ Persistence     │                                     │
│ │                 │    │                 │                                     │
│ │ - State         │    │ - .nys/         │                                     │
│ │   preservation  │    │   directory     │                                     │
│ │ - Context       │    │ - Session       │                                     │
│ │   transfer      │    │   continuity    │                                     │
│ │ - Progress      │    │ - State         │                                     │
│ │   tracking      │    │   recovery      │                                     │
│ │ - Error         │    │ - Cross-session │                                     │
│ │   handling      │    │   persistence   │                                     │
│ │                 │    │                 │                                     │
│ └─────────────────┘    └─────────────────┘                                     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 🚀 **Complete End-to-End Flow**

```
1. User Creates Issue
   └── Creates /issues/ISSUE-001/ folder structure
   
2. Design Mode (SPARC: Specification)
   ├── Analyze user prompt
   ├── Generate requirements.md
   ├── Generate guidelines.md
   └── Update status.json (design: 100%)
   
3. Build Mode (SPARC: Pseudocode + Architecture)
   ├── Read requirements.md and guidelines.md
   ├── Plan project structure
   ├── Generate source code
   ├── Create tests and documentation
   └── Update status.json (build: 100%)
   
4. Debug Mode (SPARC: Refinement + Completion)
   ├── Analyze existing code
   ├── Identify issues and improvements
   ├── Generate fixes
   ├── Apply improvements
   ├── Update notes.md
   └── Update status.json (debug: 100%)
   
5. Workflow Complete
   └── Issue folder contains complete development trace
```

## 🎯 **Key Integration Points**

### **1. Issue Management Integration**
- **Issue Creation**: New issues trigger workflow initialization
- **Mode Switching**: Design → Build → Debug mode transitions
- **File Management**: Issue files store requirements and progress
- **State Tracking**: status.json maintains current state

### **2. SPARC Framework Integration**
- **Specification**: Design mode generates detailed requirements
- **Pseudocode**: Build mode creates architectural plans
- **Architecture**: Build mode implements project structure
- **Refinement**: Debug mode improves and optimizes
- **Completion**: Debug mode finalizes and documents

### **3. Tool & MCP Integration**
- **Built-in Tools**: Core utilities for common operations
- **MCP Servers**: External capabilities via HTTP/WebSocket/Stdio
- **File System**: Direct project file manipulation
- **State Management**: Persistent workflow state

### **4. File System Integration**
- **Issue Folders**: Structured organization for each task
- **Output Management**: Generated artifacts in outputs/
- **State Persistence**: All state stored in .nys/ directory
- **Version Control**: Integration with Git for change tracking

This creates a complete, integrated workflow system that seamlessly moves from design to implementation with full traceability and state management! 🎉
