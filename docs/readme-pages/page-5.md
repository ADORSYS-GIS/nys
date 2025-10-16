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
