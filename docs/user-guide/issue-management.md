# Issue Management Guide

Learn how to create, manage, and organize issues in the SPARC Workflow Engine.

## 📋 Understanding Issues

An **issue** in the SPARC Workflow Engine represents a development task or problem that needs to be solved. Each issue goes through the complete SPARC workflow (Design → Build → Debug) and maintains its own state, artifacts, and progress.

### Issue Structure
```
Issue
├── Metadata
│   ├── ID (unique identifier)
│   ├── Title
│   ├── Description
│   ├── Created Date
│   └── Updated Date
├── Workflow State
│   ├── Current Mode (Design/Build/Debug)
│   ├── Current Phase (Specification/Pseudocode/Architecture/Refinement/Completion)
│   ├── Progress (0-100%)
│   └── Status (Open/In-Progress/Completed/Blocked)
└── Artifacts
    ├── requirements.md
    ├── guidelines.md
    ├── pseudocode.md
    ├── architecture.md
    ├── implementation.md
    ├── tests.md
    └── notes.md
```

## 🆕 Creating Issues

### Method 1: Using the Webview Interface
1. **Open Mira Sidebar**: Click the Mira icon in the VS Code activity bar
2. **Click "+ New Issue"**: Located in the issues panel header
3. **Fill in Details**:
   - **Title**: Brief, descriptive title (e.g., "User Authentication System")
   - **Description**: Detailed description of the task (optional but recommended)
4. **Click "Create Issue"**: The issue will be created and automatically selected

### Method 2: Using VS Code Commands
1. **Open Command Palette**: `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
2. **Type**: `Mira: Create New Issue`
3. **Enter Details**: Follow the prompts for title and description

### Method 3: Programmatically (for developers)
```typescript
// Create issue programmatically
const issueProvider = new IssueViewProvider(extensionUri);
await issueProvider.createIssue(
  "API Rate Limiting Implementation",
  "Implement rate limiting for API endpoints to prevent abuse"
);
```

## 📝 Issue Naming Best Practices

### Good Issue Titles
- ✅ "User Authentication System with JWT"
- ✅ "Database Migration Script for User Schema"
- ✅ "API Rate Limiting Implementation"
- ✅ "Frontend Component Library Setup"

### Poor Issue Titles
- ❌ "Fix bug"
- ❌ "Update code"
- ❌ "New feature"
- ❌ "Authentication"

### Good Descriptions
```
Create a comprehensive user authentication system that includes:

- User registration with email verification
- Secure login with JWT tokens
- Password reset functionality
- Role-based access control
- Rate limiting for login attempts

Technical Requirements:
- Use bcrypt for password hashing
- JWT tokens with 24-hour expiration
- Refresh token mechanism
- Express.js with TypeScript
- PostgreSQL database
```

## 🔍 Managing Issues

### Issue List View
The issues panel shows all your issues with:
- **Title**: Issue name
- **Mode Badge**: Current workflow mode (Design/Build/Debug)
- **Status Badge**: Current status (Open/In-Progress/Completed/Blocked)
- **Last Updated**: When the issue was last modified

### Selecting Issues
- **Click on an issue** in the list to select it
- **Active issue** is highlighted in blue
- **Chat context** switches to the selected issue
- **Mode and progress** are displayed in the header

### Issue Status Management

#### Open Status
- **When**: Newly created issues
- **Meaning**: Ready to start working
- **Action**: Begin with Design mode

#### In-Progress Status
- **When**: Actively working on the issue
- **Meaning**: Currently being processed
- **Action**: Continue with current workflow

#### Completed Status
- **When**: Issue is fully resolved
- **Meaning**: All phases complete, implementation done
- **Action**: Issue can be archived or closed

#### Blocked Status
- **When**: Issue cannot proceed due to dependencies
- **Meaning**: Waiting for external factors
- **Action**: Resolve blockers before continuing

## 📁 File Organization

### Issue Folder Structure
Each issue creates a dedicated folder in the `.nys/` directory:

```
.nys/
└── issue-1234567890/                    # Issue-specific folder
    ├── requirements.md                  # Requirements specification
    ├── guidelines.md                    # Development guidelines
    ├── pseudocode.md                    # Algorithm pseudocode
    ├── architecture.md                  # System architecture
    ├── implementation.md                # Generated implementation
    ├── tests.md                         # Test suite
    └── notes.md                         # Debug notes and iterations
└── issue-1234567890-workflow.json       # Workflow state file
```

### Artifact Files
Each artifact is saved as a separate Markdown file:

| Artifact | File Name | Purpose |
|----------|-----------|---------|
| Requirements | `requirements.md` | Technical specifications and acceptance criteria |
| Guidelines | `guidelines.md` | Coding standards and development guidelines |
| Pseudocode | `pseudocode.md` | Algorithm design and logic flow |
| Architecture | `architecture.md` | System design and component structure |
| Implementation | `implementation.md` | Generated source code and configuration |
| Tests | `tests.md` | Test suites and validation code |
| Notes | `notes.md` | Debug analysis and iteration notes |

## 🔄 Issue Lifecycle

### 1. Creation
- Issue is created with initial metadata
- Status: Open
- Mode: Design (default)
- Progress: 0%

### 2. Design Phase
- User provides requirements and specifications
- System generates design artifacts
- Progress: 0% → 25% → 50% → 75% → 100%
- Status: In-Progress

### 3. Build Phase
- Design must be complete (100%)
- User requests implementation
- System generates code and tests
- Progress: 100% (implementation complete)
- Status: In-Progress

### 4. Debug Phase
- User identifies issues or requests analysis
- System analyzes and provides recommendations
- Debug notes are updated
- Status: In-Progress

### 5. Completion
- All phases are complete
- Implementation is working
- Status: Completed

## 🏷️ Issue Organization Strategies

### By Project
```
Authentication System
├── User Registration
├── Login Implementation
├── Password Reset
└── JWT Token Management

API Development
├── Rate Limiting
├── Error Handling
├── Documentation
└── Testing
```

### By Priority
```
High Priority
├── Security Vulnerabilities
├── Critical Bugs
└── Performance Issues

Medium Priority
├── Feature Requests
├── Code Improvements
└── Documentation Updates

Low Priority
├── Nice-to-have Features
├── Code Refactoring
└── UI Improvements
```

### By Status
```
Active Issues
├── Currently Working On
├── In Review
└── Testing

Backlog
├── Planned Features
├── Future Improvements
└── Research Items

Completed
├── Recently Finished
├── Archived
└── Closed
```

## 🔍 Issue Search and Filtering

### Current Limitations
The current implementation shows all issues in a single list. Future versions will include:
- Search by title or description
- Filter by status, mode, or date
- Sort by various criteria
- Tag-based organization

### Workarounds
- Use descriptive titles for easy identification
- Include keywords in descriptions
- Use consistent naming conventions
- Organize by creation date (newest first)

## 📊 Issue Analytics

### Progress Tracking
- **Visual Progress**: Progress bar shows completion percentage
- **Phase Indicators**: Current SPARC phase is displayed
- **Mode Status**: Current workflow mode is shown
- **Last Updated**: Timestamp of last modification

### Artifact Status
- **Generated Artifacts**: Shows which documents have been created
- **File Sizes**: Indicates the amount of content generated
- **Update History**: Tracks when artifacts were last modified

## 🚨 Troubleshooting Issues

### Common Problems

**Issue not appearing in list**
- Check if the `.nys/` folder exists
- Verify file permissions
- Restart VS Code
- Check the Output panel for errors

**Issue state not updating**
- Ensure you're working in the correct mode
- Check if the issue is selected
- Verify file system permissions
- Look for error messages in the console

**Artifacts not generating**
- Ensure you're providing input in the chat
- Check if the current phase allows artifact generation
- Verify the workflow state is valid
- Check for file system errors

### Recovery Procedures

**Corrupted Issue State**
1. Check the workflow JSON file for syntax errors
2. Delete the corrupted state file
3. Recreate the issue with the same title
4. The system will start fresh

**Missing Artifacts**
1. Check if artifact files exist in the issue folder
2. Regenerate artifacts by providing input in the appropriate mode
3. The system will recreate missing files

**Lost Progress**
1. Check the workflow state file for progress information
2. Review artifact files for completed work
3. Continue from the last known good state
4. The system will resume from the current phase

## 💡 Best Practices

### Issue Creation
- **Be Specific**: Use clear, descriptive titles and detailed descriptions
- **Include Context**: Provide background information and constraints
- **Set Expectations**: Define what success looks like
- **Consider Dependencies**: Mention any prerequisites or related issues

### Issue Management
- **Regular Updates**: Keep issues current with your progress
- **Clear Status**: Update status to reflect current state
- **Document Decisions**: Use the notes to track important decisions
- **Archive Completed**: Move finished issues to completed status

### Organization
- **Consistent Naming**: Use a consistent naming convention
- **Logical Grouping**: Group related issues together
- **Priority Management**: Focus on high-priority issues first
- **Regular Cleanup**: Archive or delete old, irrelevant issues

---

*Ready to dive deeper? Check out the [Complete User Guide](./SPARC_WORKFLOW_ENGINE_DOCUMENTATION.md) for comprehensive documentation.*
