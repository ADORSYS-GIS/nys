# 🚀 Mira User Guide - Getting Started with SPARC Workflows

## 📖 **Welcome to Mira**

Mira is a workflow-driven development assistant that transforms your coding process from chaotic to structured. Every development task becomes an issue that progresses through three phases: **Design → Build → Debug**.

## 🎯 **Quick Start (5 Minutes)**

### **Step 1: Create Your First Issue**
1. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Type `Mira: Create New Issue`
3. Enter a title: "User Authentication System"
4. Enter description: "I need to add user login and registration to my web app"

### **Step 2: Start in Design Mode**
1. In the Mira sidebar, select your new issue
2. Use the mode dropdown to select "🎨 Design"
3. In the chat, type: "Design a complete user authentication system with JWT tokens"

### **Step 3: Progress Through Workflow**
1. **Design Mode**: Mira generates requirements and guidelines
2. Switch to "🔨 Build" mode and ask: "Build the authentication system"
3. Switch to "🐛 Debug" mode and ask: "Review and fix any issues"

## 📂 **Understanding Issue Folders**

Each issue creates a dedicated folder with these files:

```
/issues/USER-AUTH-001/
   ├── requirements.md   # What to build (generated in Design mode)
   ├── guidelines.md     # How to build it (generated in Design mode)
   ├── notes.md          # Development process (updated in Debug mode)
   ├── status.json       # Current progress and state
```

### **What Each File Contains**

- **requirements.md**: Complete technical specification
- **guidelines.md**: Coding standards and technology choices
- **notes.md**: Your development journey and decisions
- **status.json**: Current mode, progress, and next steps
- **outputs/**: All generated code, tests, and documentation

## 🔄 **The Three Workflow Modes**

### **🎨 Design Mode - "What Should We Build?"**

**When to use**: Starting a new feature or project

**What it does**:
- Analyzes your requirements
- Generates detailed technical specifications
- Creates development guidelines
- Plans the project structure

**Example prompts**:
- "Design a REST API for managing blog posts"
- "Create requirements for a user dashboard with charts"
- "Plan a microservices architecture for an e-commerce app"

**Output**: `requirements.md` and `guidelines.md` files

### **🔨 Build Mode - "Let's Build It!"**

**When to use**: After Design mode is complete

**What it does**:
- Reads the requirements and guidelines
- Generates source code and project structure
- Creates tests and documentation
- Updates the project files

**Example prompts**:
- "Build the blog post API based on the requirements"
- "Implement the user dashboard with React components"
- "Create the microservices with Docker containers"

**Output**: Source code, tests, configs in `outputs/` folder

### **🐛 Debug Mode - "Let's Fix It!"**

**When to use**: When you have issues or want to improve existing code

**What it does**:
- Analyzes existing code for problems
- Identifies bugs and performance issues
- Generates fixes and improvements
- Updates code and documentation

**Example prompts**:
- "Fix the authentication bug - users can't log in"
- "Optimize the database queries for better performance"
- "Add error handling to the API endpoints"

**Output**: Fixed code and updated `notes.md`

## 💡 **Pro Tips for Better Results**

### **Writing Effective Prompts**

**✅ Good Prompts**:
- "Design a user authentication system with JWT tokens, password hashing, and role-based access control"
- "Build a REST API for a todo app with CRUD operations, user authentication, and data validation"
- "Fix the memory leak in the image processing service and optimize performance"

**❌ Vague Prompts**:
- "Make a login system"
- "Build an API"
- "Fix the bug"

### **Mode-Specific Best Practices**

#### **Design Mode**
- Be specific about requirements and constraints
- Mention your technology stack preferences
- Consider edge cases and error scenarios
- Define what success looks like

#### **Build Mode**
- Reference the generated requirements
- Ask for specific features or components
- Request tests and documentation
- Specify where to place generated code

#### **Debug Mode**
- Describe the specific problem you're seeing
- Include error messages or symptoms
- Mention what you've already tried
- Ask for both fixes and explanations

### **Managing Multiple Issues**

- **Create focused issues**: Break large features into smaller, manageable tasks
- **Use descriptive titles**: Make it easy to identify issues later
- **Link related issues**: Reference other issues in descriptions
- **Track progress**: Check `status.json` to see current state

## 🛠️ **Advanced Features**

### **MCP Server Integration**

Connect to external tools and services:

1. **Connect to MCP Server**:
   - Command Palette → `MCP: Connect to Server`
   - Configure server endpoint and authentication

2. **Use External Tools**:
   - GitHub integration for repository operations
   - Database tools for schema management
   - API testing tools for endpoint validation

### **Custom Tool Configuration**

Configure built-in tools for your workflow:

- **File Operations**: Set default directories and naming conventions
- **Code Generation**: Configure templates and style preferences
- **Testing**: Set up test frameworks and coverage requirements

### **State Management**

Your workflow state is automatically saved:

- **Session Continuity**: Resume where you left off
- **Progress Tracking**: See completion status for each mode
- **History**: Review previous decisions and iterations
- **Rollback**: Revert to previous states if needed

## 🚨 **Troubleshooting**

### **Common Issues**

#### **"No active issue found"**
- Create a new issue or select an existing one
- Make sure you're in the Mira sidebar

#### **"Mode switching not working"**
- Ensure you have an active issue selected
- Check that the issue folder exists in `.nys/`

#### **"Generated code not appearing"**
- Check the `outputs/` folder in your issue directory
- Verify you're in Build mode when generating code
- Look for error messages in the chat

#### **"Requirements not being generated"**
- Make sure you're in Design mode
- Provide more specific requirements in your prompt
- Check that the issue folder was created properly

### **Getting Help**

1. **Check the Documentation**: Review `SPARC_WORKFLOW_GUIDE.md` for detailed information
2. **Review Issue Files**: Look at `requirements.md`, `guidelines.md`, and `notes.md`
3. **Check Status**: Review `status.json` for current state and next steps
4. **Restart Workflow**: Create a new issue if the current one is stuck

## 📚 **Example Workflows**

### **Example 1: Building a Todo API**

```
1. Create Issue: "Todo API with CRUD operations"
2. Design Mode: "Design a REST API for managing todos with user authentication"
   → Generates requirements.md and guidelines.md
3. Build Mode: "Build the todo API based on the requirements"
   → Generates source code, tests, and documentation
4. Debug Mode: "Add input validation and error handling"
   → Fixes and improves the generated code
```

### **Example 2: Creating a React Dashboard**

```
1. Create Issue: "User Dashboard with Charts"
2. Design Mode: "Design a React dashboard with user statistics and charts"
   → Generates requirements for components, data flow, and styling
3. Build Mode: "Build the dashboard with React components and Chart.js"
   → Generates components, services, and styling
4. Debug Mode: "Optimize performance and fix responsive design issues"
   → Improves performance and fixes layout problems
```

### **Example 3: Setting up Microservices**

```
1. Create Issue: "E-commerce Microservices Architecture"
2. Design Mode: "Design a microservices architecture for an e-commerce platform"
   → Generates service definitions, API contracts, and deployment plans
3. Build Mode: "Build the microservices with Docker and API gateways"
   → Generates service code, Docker files, and configuration
4. Debug Mode: "Fix service communication and add monitoring"
   → Resolves inter-service communication issues
```

## 🎉 **You're Ready to Go!**

You now have everything you need to start using Mira's SPARC workflow system. Remember:

1. **Start with Design Mode** to define what you want to build
2. **Move to Build Mode** to generate the implementation
3. **Use Debug Mode** to fix issues and improve code
4. **Keep your prompts specific** for better results
5. **Check the issue folder** to see all generated files

Happy coding with Mira! 🚀
