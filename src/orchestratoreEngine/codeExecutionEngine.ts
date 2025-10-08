import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';

/**
 * Code Execution Engine for SPARC Workflow
 * 
 * This engine handles:
 * - Writing actual code files to the project root
 * - Executing build/run commands
 * - Observing output and iterating based on results
 * - Managing the full coding assistant workflow
 */

export interface CodeFile {
  path: string;
  content: string;
  language: string;
}

export interface CommandResult {
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  success: boolean;
  duration: number;
}

export interface ExecutionContext {
  projectRoot: string;
  language: string;
  framework?: string;
  buildTool?: string;
  testFramework?: string;
  dependencies: string[];
}

export interface BuildResult {
  success: boolean;
  filesCreated: CodeFile[];
  commandsExecuted: CommandResult[];
  errors: string[];
  warnings: string[];
  nextSteps: string[];
}

export class CodeExecutionEngine {
  private projectRoot: string;
  private context: ExecutionContext | null = null;
  
  constructor(workspaceRoot: vscode.Uri) {
    this.projectRoot = workspaceRoot.fsPath;
  }
  
  /**
   * Analyze user request to determine execution context
   */
  analyzeRequest(userInput: string, issueDescription: string): ExecutionContext {
    const input = (userInput + ' ' + issueDescription).toLowerCase();
    
    // Detect programming language
    let language = 'typescript'; // default
    let framework = undefined;
    let buildTool = undefined;
    let testFramework = undefined;
    let dependencies: string[] = [];
    
    if (input.includes('rust') || input.includes('cargo')) {
      language = 'rust';
      buildTool = 'cargo';
      testFramework = 'cargo test';
    } else if (input.includes('python') || input.includes('pip')) {
      language = 'python';
      buildTool = 'pip';
      testFramework = 'pytest';
      if (input.includes('django')) {
        framework = 'django';
        dependencies = ['django'];
      } else if (input.includes('flask')) {
        framework = 'flask';
        dependencies = ['flask'];
      } else if (input.includes('fastapi')) {
        framework = 'fastapi';
        dependencies = ['fastapi', 'uvicorn'];
      }
    } else if (input.includes('javascript') || input.includes('node') || input.includes('npm')) {
      language = 'javascript';
      buildTool = 'npm';
      testFramework = 'jest';
      if (input.includes('react')) {
        framework = 'react';
        dependencies = ['react', 'react-dom'];
      } else if (input.includes('express')) {
        framework = 'express';
        dependencies = ['express'];
      }
    } else if (input.includes('typescript') || input.includes('ts')) {
      language = 'typescript';
      buildTool = 'npm';
      testFramework = 'jest';
      dependencies = ['typescript', '@types/node'];
    } else if (input.includes('go') || input.includes('golang')) {
      language = 'go';
      buildTool = 'go';
      testFramework = 'go test';
    } else if (input.includes('java') || input.includes('maven') || input.includes('gradle')) {
      language = 'java';
      buildTool = input.includes('gradle') ? 'gradle' : 'maven';
      testFramework = 'junit';
    }
    
    // Extract additional dependencies from input
    const dependencyMatches = input.match(/(?:install|add|require|import)\s+([a-zA-Z0-9-_]+)/g);
    if (dependencyMatches) {
      const additionalDeps = dependencyMatches.map(match => 
        match.replace(/(?:install|add|require|import)\s+/, '')
      );
      dependencies.push(...additionalDeps);
    }
    
    return {
      projectRoot: this.projectRoot,
      language,
      framework,
      buildTool,
      testFramework,
      dependencies: [...new Set(dependencies)] // remove duplicates
    };
  }
  
  /**
   * Execute a command and return the result
   */
  async executeCommand(command: string, args: string[] = [], cwd?: string): Promise<CommandResult> {
    const startTime = Date.now();
    const workingDir = cwd || this.projectRoot;
    
    console.log(`[CodeExecution] Executing: ${command} ${args.join(' ')} in ${workingDir}`);
    
    return new Promise((resolve) => {
      const child = spawn(command, args, {
        cwd: workingDir,
        shell: true,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout?.on('data', (data) => {
        stdout += data.toString();
        console.log(`[CodeExecution] stdout: ${data.toString()}`);
      });
      
      child.stderr?.on('data', (data) => {
        stderr += data.toString();
        console.log(`[CodeExecution] stderr: ${data.toString()}`);
      });
      
      child.on('close', (code) => {
        const duration = Date.now() - startTime;
        const result: CommandResult = {
          command: `${command} ${args.join(' ')}`,
          exitCode: code || 0,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          success: code === 0,
          duration
        };
        
        console.log(`[CodeExecution] Command completed:`, result);
        resolve(result);
      });
      
      child.on('error', (error) => {
        const duration = Date.now() - startTime;
        const result: CommandResult = {
          command: `${command} ${args.join(' ')}`,
          exitCode: 1,
          stdout: '',
          stderr: error.message,
          success: false,
          duration
        };
        
        console.log(`[CodeExecution] Command failed:`, result);
        resolve(result);
      });
    });
  }
  
  /**
   * Write code files to the project
   */
  async writeCodeFiles(files: CodeFile[]): Promise<void> {
    console.log(`[CodeExecution] Writing ${files.length} code files to project`);
    
    for (const file of files) {
      const fullPath = path.join(this.projectRoot, file.path);
      const dir = path.dirname(fullPath);
      
      // Ensure directory exists
      await fs.promises.mkdir(dir, { recursive: true });
      
      // Write file
      await fs.promises.writeFile(fullPath, file.content, 'utf8');
      console.log(`[CodeExecution] Created file: ${file.path}`);
    }
  }
  
  /**
   * Initialize project structure based on language and framework
   */
  async initializeProject(context: ExecutionContext): Promise<CommandResult[]> {
    console.log(`[CodeExecution] Initializing ${context.language} project`);
    const results: CommandResult[] = [];
    
    switch (context.language) {
      case 'rust':
        if (context.buildTool === 'cargo') {
          const result = await this.executeCommand('cargo', ['init', '--name', 'sparc-project']);
          results.push(result);
        }
        break;
        
      case 'python':
        if (context.buildTool === 'pip') {
          // Create requirements.txt
          const requirementsContent = context.dependencies.join('\n');
          await this.writeCodeFiles([{
            path: 'requirements.txt',
            content: requirementsContent,
            language: 'text'
          }]);
          
          if (context.dependencies.length > 0) {
            const result = await this.executeCommand('pip', ['install', '-r', 'requirements.txt']);
            results.push(result);
          }
        }
        break;
        
      case 'javascript':
      case 'typescript':
        if (context.buildTool === 'npm') {
          const result = await this.executeCommand('npm', ['init', '-y']);
          results.push(result);
          
          if (context.dependencies.length > 0) {
            const installResult = await this.executeCommand('npm', ['install', ...context.dependencies]);
            results.push(installResult);
          }
        }
        break;
        
      case 'go':
        if (context.buildTool === 'go') {
          const result = await this.executeCommand('go', ['mod', 'init', 'sparc-project']);
          results.push(result);
        }
        break;
    }
    
    return results;
  }
  
  /**
   * Build the project
   */
  async buildProject(context: ExecutionContext): Promise<CommandResult[]> {
    console.log(`[CodeExecution] Building ${context.language} project`);
    const results: CommandResult[] = [];
    
    switch (context.language) {
      case 'rust':
        if (context.buildTool === 'cargo') {
          const result = await this.executeCommand('cargo', ['build']);
          results.push(result);
        }
        break;
        
      case 'python':
        // Python doesn't need explicit build, but we can check syntax
        const syntaxResult = await this.executeCommand('python', ['-m', 'py_compile', '*.py']);
        results.push(syntaxResult);
        break;
        
      case 'javascript':
      case 'typescript':
        if (context.buildTool === 'npm') {
          // Check if there's a build script
          const packageJsonPath = path.join(this.projectRoot, 'package.json');
          try {
            const packageJson = JSON.parse(await fs.promises.readFile(packageJsonPath, 'utf8'));
            if (packageJson.scripts && packageJson.scripts.build) {
              const result = await this.executeCommand('npm', ['run', 'build']);
              results.push(result);
            }
          } catch (error) {
            console.log('[CodeExecution] No package.json or build script found');
          }
        }
        break;
        
      case 'go':
        if (context.buildTool === 'go') {
          const result = await this.executeCommand('go', ['build', './...']);
          results.push(result);
        }
        break;
    }
    
    return results;
  }
  
  /**
   * Run the project
   */
  async runProject(context: ExecutionContext): Promise<CommandResult[]> {
    console.log(`[CodeExecution] Running ${context.language} project`);
    const results: CommandResult[] = [];
    
    switch (context.language) {
      case 'rust':
        if (context.buildTool === 'cargo') {
          const result = await this.executeCommand('cargo', ['run']);
          results.push(result);
        }
        break;
        
      case 'python':
        // Find main Python file
        const pythonFiles = await this.findFiles('*.py');
        if (pythonFiles.length > 0) {
          const mainFile = pythonFiles.find(f => f.includes('main') || f.includes('app')) || pythonFiles[0];
          const result = await this.executeCommand('python', [mainFile]);
          results.push(result);
        }
        break;
        
      case 'javascript':
      case 'typescript':
        if (context.buildTool === 'npm') {
          // Check for start script
          const packageJsonPath = path.join(this.projectRoot, 'package.json');
          try {
            const packageJson = JSON.parse(await fs.promises.readFile(packageJsonPath, 'utf8'));
            if (packageJson.scripts && packageJson.scripts.start) {
              const result = await this.executeCommand('npm', ['start']);
              results.push(result);
            } else {
              // Try to run main file
              const jsFiles = await this.findFiles('*.js');
              const tsFiles = await this.findFiles('*.ts');
              const mainFile = [...jsFiles, ...tsFiles].find(f => f.includes('main') || f.includes('index')) || [...jsFiles, ...tsFiles][0];
              if (mainFile) {
                const result = await this.executeCommand('node', [mainFile]);
                results.push(result);
              }
            }
          } catch (error) {
            console.log('[CodeExecution] No package.json found, trying to run main file');
          }
        }
        break;
        
      case 'go':
        if (context.buildTool === 'go') {
          const result = await this.executeCommand('go', ['run', '*.go']);
          results.push(result);
        }
        break;
    }
    
    return results;
  }
  
  /**
   * Run tests
   */
  async runTests(context: ExecutionContext): Promise<CommandResult[]> {
    console.log(`[CodeExecution] Running tests for ${context.language} project`);
    const results: CommandResult[] = [];
    
    if (context.testFramework) {
      const testCommand = context.testFramework.split(' ');
      const result = await this.executeCommand(testCommand[0], testCommand.slice(1));
      results.push(result);
    }
    
    return results;
  }
  
  /**
   * Find files matching a pattern
   */
  private async findFiles(pattern: string): Promise<string[]> {
    try {
      const files = await fs.promises.readdir(this.projectRoot);
      return files.filter(file => {
        if (pattern.includes('*')) {
          const regex = new RegExp(pattern.replace(/\*/g, '.*'));
          return regex.test(file);
        }
        return file === pattern;
      });
    } catch (error) {
      console.log(`[CodeExecution] Error finding files: ${error}`);
      return [];
    }
  }
  
  /**
   * Analyze command results and determine next steps
   */
  analyzeResults(results: CommandResult[]): { success: boolean; errors: string[]; warnings: string[]; nextSteps: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const nextSteps: string[] = [];
    
    for (const result of results) {
      if (!result.success) {
        errors.push(`${result.command}: ${result.stderr || result.stdout}`);
      } else if (result.stderr) {
        warnings.push(`${result.command}: ${result.stderr}`);
      }
    }
    
    const success = errors.length === 0;
    
    if (!success) {
      nextSteps.push('Fix compilation errors');
      nextSteps.push('Check dependencies');
      nextSteps.push('Verify file paths');
    } else {
      nextSteps.push('Run tests');
      nextSteps.push('Deploy or package');
    }
    
    return { success, errors, warnings, nextSteps };
  }
  
  /**
   * Full build workflow: analyze, initialize, write files, build, run, test
   */
  async executeBuildWorkflow(
    userInput: string,
    issueDescription: string,
    generatedCode: string
  ): Promise<BuildResult> {
    console.log('[CodeExecution] Starting full build workflow');
    
    // Analyze the request
    this.context = this.analyzeRequest(userInput, issueDescription);
    console.log('[CodeExecution] Context:', this.context);
    
    const filesCreated: CodeFile[] = [];
    const commandsExecuted: CommandResult[] = [];
    
    try {
      // Parse generated code to extract files
      const codeFiles = this.parseGeneratedCode(generatedCode, this.context);
      filesCreated.push(...codeFiles);
      
      // Write code files
      await this.writeCodeFiles(codeFiles);
      
      // Initialize project
      const initResults = await this.initializeProject(this.context);
      commandsExecuted.push(...initResults);
      
      // Build project
      const buildResults = await this.buildProject(this.context);
      commandsExecuted.push(...buildResults);
      
      // Run project
      const runResults = await this.runProject(this.context);
      commandsExecuted.push(...runResults);
      
      // Run tests
      const testResults = await this.runTests(this.context);
      commandsExecuted.push(...testResults);
      
      // Analyze results
      const analysis = this.analyzeResults(commandsExecuted);
      
      return {
        success: analysis.success,
        filesCreated,
        commandsExecuted,
        errors: analysis.errors,
        warnings: analysis.warnings,
        nextSteps: analysis.nextSteps
      };
      
    } catch (error) {
      console.error('[CodeExecution] Build workflow failed:', error);
      return {
        success: false,
        filesCreated,
        commandsExecuted,
        errors: [`Build workflow failed: ${error instanceof Error ? error.message : String(error)}`],
        warnings: [],
        nextSteps: ['Check error logs', 'Verify project structure', 'Retry build']
      };
    }
  }
  
  /**
   * Parse generated code to extract individual files
   */
  private parseGeneratedCode(code: string, context: ExecutionContext): CodeFile[] {
    const files: CodeFile[] = [];
    
    // Look for code blocks with file paths
    const codeBlockRegex = /```(\w+)?\s*([^\n]+)?\n([\s\S]*?)```/g;
    let match;
    
    while ((match = codeBlockRegex.exec(code)) !== null) {
      const language = match[1] || context.language;
      const filePath = match[2] || this.getDefaultFilePath(language, context);
      const content = match[3].trim();
      
      files.push({
        path: filePath,
        content,
        language
      });
    }
    
    // If no code blocks found, treat the entire content as a single file
    if (files.length === 0) {
      files.push({
        path: this.getDefaultFilePath(context.language, context),
        content: code,
        language: context.language
      });
    }
    
    return files;
  }
  
  /**
   * Get default file path based on language and context
   */
  private getDefaultFilePath(language: string, context: ExecutionContext): string {
    switch (language) {
      case 'rust':
        return 'src/main.rs';
      case 'python':
        return context.framework === 'django' ? 'manage.py' : 'main.py';
      case 'javascript':
        return 'index.js';
      case 'typescript':
        return 'index.ts';
      case 'go':
        return 'main.go';
      case 'java':
        return 'src/main/java/Main.java';
      default:
        return 'main.' + language;
    }
  }
}
