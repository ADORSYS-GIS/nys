# NYS Design System for Mira

## Overview

The NYS (New York System) Design Architecture is a structured approach to development that focuses on issue-driven development with three distinct modes: Design, Build, and Debug. This system has been implemented in the Mira VS Code extension to provide a professional, JetBrains-like interface for managing development workflows.

## Core Principles

### Issue-Driven Development
- All features and code must be built only when there is a corresponding issue (`#id.md`)
- Issues are stored in the `.nys/` folder as markdown files
- Each issue contains frontmatter metadata and structured content
- Issues guide the entire development process from conception to completion

### Three Working Modes

#### 1. Design Mode
- **Purpose**: Explore issues, edit `#id.md`, plan solutions
- **Features**:
  - Editable markdown editor for issue descriptions
  - Requirements gathering and design considerations
  - Technical stack planning
  - Architecture decisions

#### 2. Build Mode
- **Purpose**: Generate code, run tests, verify outputs, attach results
- **Features**:
  - TODO list management with inline implementation tasks
  - Build and test execution buttons
  - Code generation and verification
  - Progress tracking

#### 3. Debug Mode
- **Purpose**: Reproduce errors, collect logs, propose fixes, and link back to issue
- **Features**:
  - Log collection and analysis
  - Error reproduction tools
  - Bug report generation
  - Fix proposal workflow

## UI Architecture

### JetBrains-Inspired Layout

The interface follows a professional IDE layout with:

- **Left Panel**: Issues list with status and mode indicators
- **Main Panel**: Active issue view with tabbed interface (Design | Build | Debug)
- **Bottom Panel**: Integrated terminal/log view
- **Right Panel**: Task checklist and generated TODOs

### Visual Design

- **Color Scheme**: Professional dark theme with JetBrains color palette
- **Typography**: JetBrains Mono font family for code, system fonts for UI
- **Components**: Clean, minimal UI components with smooth transitions
- **Responsive**: Adapts to different screen sizes and panel configurations

## File Structure

```
.nys/
├── issue-123.md          # Issue files with frontmatter
├── issue-123.state.json  # Issue-specific state
├── global-state.json     # Global application state
└── example-issue.md      # Example issue template
```

## Issue File Format

Each issue is stored as a markdown file with YAML frontmatter:

```markdown
---
title: Issue Title
mode: design|build|debug
status: open|in-progress|completed|blocked
createdAt: 2024-01-15T10:00:00.000Z
updatedAt: 2024-01-15T10:00:00.000Z
---

# Issue Description

## Problem Statement
...

## Requirements
...

## Design Considerations
...

## TODOs

- [ ] First TODO item
- [x] Completed TODO item
- [ ] Another TODO item
```

## Commands

### Issue Management
- `Mira: Create New Issue` - Create a new issue
- `Mira: Open Issue Manager` - Open the main issue panel

### Mode Switching
- `Mira: Switch to Design Mode` - Switch current issue to design mode
- `Mira: Switch to Build Mode` - Switch current issue to build mode
- `Mira: Switch to Debug Mode` - Switch current issue to debug mode

### Development Actions
- `Mira: Run Build` - Execute build commands
- `Mira: Run Tests` - Execute test suite
- `Mira: Collect Logs` - Gather error logs and diagnostics

## Usage Workflow

### 1. Creating an Issue
1. Use the "Create New Issue" command or click the "+ New" button
2. Enter a descriptive title and initial description
3. The issue is automatically created in the `.nys/` folder

### 2. Design Phase
1. Switch to Design mode
2. Edit the issue description with requirements and design considerations
3. Plan the technical approach and architecture
4. Add initial TODOs for the implementation

### 3. Build Phase
1. Switch to Build mode
2. Review and update TODOs based on design decisions
3. Use "Run Build" to execute build commands
4. Use "Run Tests" to verify implementation
5. Mark TODOs as completed as work progresses

### 4. Debug Phase
1. Switch to Debug mode when issues arise
2. Use "Collect Logs" to gather error information
3. Analyze logs and add debug-specific TODOs
4. Link fixes back to the original issue

## Storage and Persistence

### Issue Storage
- Issues are stored as markdown files in the `.nys/` folder
- Frontmatter contains metadata (title, mode, status, timestamps)
- Content includes description and TODO lists
- Auto-save functionality preserves changes

### State Management
- Issue-specific state stored in `.state.json` files
- Global application state in `global-state.json`
- Automatic cleanup of old state files (30+ days)

### Integration
- Seamless integration with VS Code workspace
- Terminal integration for build/test commands
- Output panel integration for log collection

## Testing

The system includes comprehensive test coverage:

- **Unit Tests**: Issue creation, mode switching, TODO management
- **Integration Tests**: Complete workflow testing
- **Storage Tests**: File persistence and state management
- **UI Tests**: Component behavior and user interactions

## Benefits

### For Developers
- **Structured Workflow**: Clear phases from design to implementation
- **Issue Tracking**: Built-in issue management without external tools
- **Progress Visibility**: Clear TODO lists and status tracking
- **Professional Interface**: JetBrains-like experience in VS Code

### For Teams
- **Consistent Process**: Standardized issue-driven development
- **Documentation**: Self-documenting issues with requirements and decisions
- **Collaboration**: Shared issue files and state management
- **Quality Assurance**: Built-in testing and debugging workflows

## Future Enhancements

- **Git Integration**: Automatic issue linking to commits and PRs
- **Team Collaboration**: Multi-user issue editing and commenting
- **Templates**: Predefined issue templates for common scenarios
- **Analytics**: Progress tracking and productivity metrics
- **Export/Import**: Issue migration between projects

## Getting Started

1. Open a VS Code workspace
2. Install the Mira extension
3. Open the Mira sidebar (Issues panel)
4. Create your first issue using "Create New Issue"
5. Follow the Design → Build → Debug workflow

The `.nys/` folder will be automatically created in your workspace root, and you can start managing your development process with the structured, issue-driven approach.
