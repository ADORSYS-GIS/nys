# Quick Start Guide

Get up and running with the SPARC Workflow Engine in minutes.

## 🚀 Installation & Setup

### Prerequisites
- Visual Studio Code 1.60.0 or newer
- Node.js and npm (for development)
- Git (for version control)

### Installation
1. **Install the Mira Extension**:
   ```bash
   # From VS Code Marketplace
   # Search for "Mira" in Extensions view and install
   
   # Or install from VSIX
   npx vsce package
   # Then install the generated .vsix file
   ```

2. **Open a Workspace**:
   ```bash
   # Open your project in VS Code
   code /path/to/your/project
   ```

## 🎯 Your First Issue

### Step 1: Create an Issue
1. Open the **Mira sidebar** (look for the Mira icon in the activity bar)
2. Click **"+ New Issue"**
3. Enter a title: `"Create user authentication system"`
4. Add description: `"Build a secure login system with JWT tokens"`
5. Click **"Create Issue"**

### Step 2: Start in Design Mode
1. Select your newly created issue from the issues list
2. Ensure **Design mode** is selected (🎨 Design button should be active)
3. Type in the chat: `"I need a complete authentication system with user registration, login, and JWT token management"`
4. Press **Enter** or click **Send**

### Step 3: Progress Through Phases
The system will automatically progress through the SPARC phases:

1. **Specification Phase (25%)**: Requirements are extracted and formalized
2. **Pseudocode Phase (50%)**: Algorithm design is created
3. **Architecture Phase (75%)**: System architecture is designed
4. **Refinement Phase (100%)**: Requirements are finalized

Continue providing input to progress through each phase:
- `"Add password hashing with bcrypt"`
- `"Include refresh token mechanism"`
- `"Add rate limiting for login attempts"`

### Step 4: Switch to Build Mode
1. Once design is complete (100%), click **🔨 Build** mode
2. Type: `"Generate Express.js implementation with TypeScript"`
3. The system will generate:
   - Implementation code
   - Test suites
   - Configuration files

### Step 5: Debug and Refine
1. Switch to **🐛 Debug** mode
2. Type: `"Check for security vulnerabilities in the authentication flow"`
3. The system will analyze and provide recommendations

## 📁 Generated Files

Your issue will create files in the `.nys/` directory:

```
.nys/
└── issue-1234567890/
    ├── requirements.md      # Technical specifications
    ├── guidelines.md        # Development guidelines
    ├── pseudocode.md        # Algorithm design
    ├── architecture.md      # System architecture
    ├── implementation.md    # Generated code
    ├── tests.md            # Test suites
    └── notes.md            # Debug notes
```

## 🎨 Understanding the Interface

### Issues Panel
- **Issues List**: Shows all your issues with status indicators
- **Mode Badges**: Color-coded indicators (Design=Blue, Build=Orange, Debug=Red)
- **Status Indicators**: Open, In-Progress, Completed, Blocked

### Chat Interface
- **Mode Selector**: Switch between Design, Build, and Debug modes
- **Chat History**: All conversations are saved with timestamps
- **Context Awareness**: Responses are tailored to your current mode and issue

### Progress Tracking
- **Phase Indicators**: Shows current SPARC phase
- **Progress Bar**: Visual progress through the workflow
- **Artifact Status**: Shows which documents have been generated

## 🔄 Common Workflows

### New Feature Development
1. Create issue → Design mode → Build mode → Debug mode
2. Each mode builds upon the previous work
3. All artifacts are automatically generated and stored

### Bug Fixing
1. Create issue describing the bug
2. Use Debug mode to analyze the problem
3. Switch to Build mode to implement fixes
4. Use Design mode to update documentation if needed

### Code Review
1. Create issue for code review
2. Use Debug mode to analyze code quality
3. Generate recommendations and improvements
4. Use Build mode to implement suggested changes

## 🚨 Troubleshooting

### Common Issues

**"No active issue found"**
- Make sure you've created and selected an issue
- Check that the issue is visible in the issues panel

**"Build requested but design incomplete"**
- Complete the design phase first (reach 100% progress)
- Ensure all SPARC phases are finished

**"Extension not responding"**
- Restart VS Code
- Check the Output panel for error messages
- Ensure you have a workspace folder open

### Getting Help
- Check the [User Guide](./SPARC_WORKFLOW_ENGINE_DOCUMENTATION.md) for detailed information
- Review [Examples](../examples/basic-usage.md) for common use cases
- Open an [Issue](https://github.com/Christiantyemele/mimie/issues) for bugs or feature requests

## 🎉 Next Steps

Now that you're up and running:

1. **Explore the User Guide**: Learn about advanced features and customization
2. **Try Examples**: Work through the example scenarios
3. **Customize**: Learn how to extend the engine for your specific needs
4. **Contribute**: Help improve Mira by contributing to the project

---

*Ready to dive deeper? Check out the [Complete User Guide](./SPARC_WORKFLOW_ENGINE_DOCUMENTATION.md) for comprehensive documentation.*
