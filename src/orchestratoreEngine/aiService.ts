import OpenAI from 'openai';
import * as vscode from 'vscode';

/**
 * AI Service for SPARC Workflow Engine
 * 
 * This service handles all AI/LLM interactions for the SPARC workflow,
 * providing intelligent responses based on user requests and current workflow mode.
 */

export interface AIRequest {
  userInput: string;
  mode: 'design' | 'build' | 'debug';
  phase: string;
  context?: {
    issueTitle?: string;
    issueDescription?: string;
    existingArtifacts?: any;
    previousDecisions?: any[];
  };
}

export interface AIResponse {
  content: string;
  confidence: number;
  reasoning?: string;
  nextSteps?: string[];
  artifacts?: any;
}

export class AIService {
  private openai: OpenAI | null = null;
  private isInitialized: boolean = false;
  
  constructor() {
    this.initializeOpenAI();
  }
  
  private initializeOpenAI(): void {
    try {
      // Get API key from VS Code settings first, then environment variables
      const config = vscode.workspace.getConfiguration('mira');
      const vscodeApiKey = config.get<string>('openaiApiKey');
      const envApiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY;
      
      // Debug logging
      console.log('[AIService] Debug - VS Code config:', {
        hasConfig: !!config,
        vscodeApiKey: vscodeApiKey ? `${vscodeApiKey.substring(0, 8)}...` : 'null',
        vscodeApiKeyLength: vscodeApiKey ? vscodeApiKey.length : 0,
        envApiKey: envApiKey ? `${envApiKey.substring(0, 8)}...` : 'null',
        envApiKeyLength: envApiKey ? envApiKey.length : 0
      });
      
      const apiKey = vscodeApiKey || envApiKey;
      
      if (apiKey && apiKey.trim() !== '') {
        this.openai = new OpenAI({
          apiKey: apiKey,
        });
        this.isInitialized = true;
        console.log('[AIService] OpenAI initialized successfully with VS Code configuration');
        console.log('[AIService] Debug - Using API key from:', vscodeApiKey ? 'VS Code Settings' : 'Environment Variable');
      } else {
        console.warn('[AIService] OpenAI API key not found in VS Code settings or environment variables');
        console.warn('[AIService] Please set "mira.openaiApiKey" in VS Code settings or set OPENAI_API_KEY environment variable');
        console.warn('[AIService] Debug - VS Code key empty:', !vscodeApiKey || vscodeApiKey.trim() === '');
        console.warn('[AIService] Debug - Environment key empty:', !envApiKey || envApiKey.trim() === '');
        this.isInitialized = false;
      }
    } catch (error) {
      console.error('[AIService] Failed to initialize OpenAI:', error);
      this.isInitialized = false;
    }
  }
  
  /**
   * Process a request using AI based on the current mode and phase
   */
  async processRequest(request: AIRequest): Promise<AIResponse> {
    console.log('[AIService] Debug - processRequest called with:', {
      isInitialized: this.isInitialized,
      hasOpenAI: !!this.openai,
      mode: request.mode,
      phase: request.phase
    });
    
    if (!this.isInitialized || !this.openai) {
      console.log('[AIService] Debug - Using mock response because AI not initialized');
      return this.getMockResponse(request);
    }
    
    try {
      const prompt = this.buildPrompt(request);
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(request.mode, request.phase)
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0,
        max_tokens: 2000
      });
      
      const content = response.choices[0]?.message?.content || '';
      return this.parseAIResponse(content, request);
    } catch (error) {
      console.error('[AIService] AI request failed:', error);
      return this.getMockResponse(request);
    }
  }
  
  /**
   * Build the prompt for the AI request
   */
  private buildPrompt(request: AIRequest): string {
    const { userInput, mode, phase, context } = request;
    
    let prompt = `User Request: "${userInput}"\n\n`;
    prompt += `Current Mode: ${mode}\n`;
    prompt += `Current Phase: ${phase}\n\n`;
    
    if (context?.issueTitle) {
      prompt += `Issue Title: ${context.issueTitle}\n`;
    }
    
    if (context?.issueDescription) {
      prompt += `Issue Description: ${context.issueDescription}\n\n`;
    }
    
    if (context?.existingArtifacts) {
      prompt += `Existing Artifacts:\n`;
      for (const [key, value] of Object.entries(context.existingArtifacts)) {
        if (value) {
          prompt += `- ${key}: ${(value as string).substring(0, 200)}...\n`;
        }
      }
      prompt += '\n';
    }
    
    return prompt;
  }
  
  /**
   * Get system prompt based on mode and phase
   */
  private getSystemPrompt(_mode: 'design' | 'build' | 'debug', phase: string): string {
    const basePrompt = `You are an expert software development assistant working within the SPARC workflow framework. 
    SPARC stands for Specification → Pseudocode → Architecture → Refinement → Completion.
    
    You must provide accurate, specific responses based on the user's actual request.
    Always consider the programming language, framework, and specific requirements mentioned by the user.`;
    
    switch (_mode) {
      case 'design':
        return this.getDesignSystemPrompt(basePrompt, phase);
      case 'build':
        return this.getBuildSystemPrompt(basePrompt, phase);
      case 'debug':
        return this.getDebugSystemPrompt(basePrompt, phase);
      default:
        return basePrompt;
    }
  }
  
  private getDesignSystemPrompt(basePrompt: string, phase: string): string {
    switch (phase) {
      case 'specification':
        return `${basePrompt}
        
        You are in DESIGN mode, SPECIFICATION phase. Your task is to:
        1. Analyze the user's request carefully
        2. Extract specific requirements based on what they actually asked for
        3. Create a detailed requirements specification
        4. Focus on the exact programming language, framework, and functionality requested
        5. be specific to the user's request
        
        Respond with a comprehensive requirements specification that matches the user's actual request.`;
        
      case 'pseudocode':
        return `${basePrompt}
        
        You are in DESIGN mode, PSEUDOCODE phase. Your task is to:
        1. Create pseudocode based on the requirements and user's specific request
        2. Use the programming language and approach the user mentioned
        3. Break down the logic into clear, implementable steps
        4. Be specific to the user's request, not generic
        
        Respond with detailed pseudocode that matches the user's actual requirements.`;
        
      case 'architecture':
        return `${basePrompt}
        
        You are in DESIGN mode, ARCHITECTURE phase. Your task is to:
        1. Design system architecture based on the user's specific request
        2. Consider the programming language, framework, and tools mentioned
        3. Create appropriate architectural patterns for the specific use case
        4. Provide implementation guidelines specific to the user's request
        
        Respond with architecture design and guidelines tailored to the user's actual needs.`;
        
      case 'refinement':
        return `${basePrompt}
        
        You are in DESIGN mode, REFINEMENT phase. Your task is to:
        1. Refine the requirements based on architectural decisions
        2. Add technical details specific to the user's request
        3. Clarify implementation specifics
        4. Ensure the design is ready for implementation
        
        Respond with refined requirements that are specific to the user's actual request.`;
        
      case 'completion':
        return `${basePrompt}
        
        You are in DESIGN mode, COMPLETION phase. Your task is to:
        1. Summarize the completed design phase
        2. Highlight key decisions made for the user's specific request
        3. Provide clear next steps for implementation
        4. Ensure the design is complete and ready for build phase
        
        Respond with a completion summary specific to the user's request.`;
        
      default:
        return basePrompt;
    }
  }
  
  private getBuildSystemPrompt(basePrompt: string, phase: string): string {
    switch (phase) {
      case 'implementation':
        return `${basePrompt}
        
        You are in BUILD mode, IMPLEMENTATION phase. Your task is to:
        1. Generate actual code based on the user's specific request
        2. Use the exact programming language, framework, and approach the user mentioned
        3. Create working, runnable code that matches their requirements
        4. Include proper imports, dependencies, and setup instructions
        5. Do NOT use generic templates - write code for their specific request
        
        Respond with complete, working code that implements exactly what the user requested.`;
        
      case 'testing':
        return `${basePrompt}
        
        You are in BUILD mode, TESTING phase. Your task is to:
        1. Create appropriate tests for the user's specific implementation
        2. Use testing frameworks suitable for their programming language
        3. Write comprehensive test cases that cover the functionality they requested
        4. Include setup instructions for running the tests
        
        Respond with test code and instructions specific to the user's implementation.`;
        
      default:
        return basePrompt;
    }
  }
  
  private getDebugSystemPrompt(basePrompt: string, phase: string): string {
    switch (phase) {
      case 'analysis':
        return `${basePrompt}
        
        You are in DEBUG mode, ANALYSIS phase. Your task is to:
        1. Analyze the user's code or issue description
        2. Identify specific problems related to their request
        3. Provide detailed analysis of issues found
        4. Focus on the programming language and framework they're using
        
        Respond with a detailed analysis of issues specific to the user's code.`;
        
      case 'fix_generation':
        return `${basePrompt}
        
        You are in DEBUG mode, FIX GENERATION phase. Your task is to:
        1. Generate specific fixes for the issues identified
        2. Provide corrected code that addresses the problems
        3. Explain the changes and why they fix the issues
        4. Ensure the fixes are appropriate for their programming language and framework
        
        Respond with specific fixes and explanations for the user's code issues.`;
        
      default:
        return basePrompt;
    }
  }
  
  /**
   * Parse AI response and extract structured information
   */
  private parseAIResponse(content: string, request: AIRequest): AIResponse {
    return {
      content: content,
      confidence: 0.9,
      reasoning: `Generated response for ${request.mode} mode, ${request.phase} phase`,
      nextSteps: this.generateNextSteps(request.mode, request.phase),
      artifacts: this.extractArtifacts(content, request)
    };
  }
  
  /**
   * Generate next steps based on current mode and phase
   */
  private generateNextSteps(_mode: 'design' | 'build' | 'debug', phase: string): string[] {
    const steps: { [key: string]: string[] } = {
      'specification': ['Generate pseudocode', 'Design architecture', 'Refine requirements'],
      'pseudocode': ['Design architecture', 'Refine requirements', 'Complete design'],
      'architecture': ['Refine requirements', 'Complete design', 'Start implementation'],
      'refinement': ['Complete design', 'Start implementation', 'Generate code'],
      'completion': ['Start implementation', 'Generate code', 'Create tests'],
      'implementation': ['Create tests', 'Generate documentation', 'Debug issues'],
      'testing': ['Generate documentation', 'Debug issues', 'Optimize performance'],
      'analysis': ['Generate fixes', 'Apply corrections', 'Test fixes'],
      'fix_generation': ['Apply corrections', 'Test fixes', 'Optimize code']
    };
    
    return steps[phase] || ['Continue workflow'];
  }
  
  /**
   * Extract artifacts from AI response
   */
  private extractArtifacts(content: string, request: AIRequest): any {
    const artifacts: any = {};
    
    // Extract code blocks
    const codeBlocks = content.match(/```[\s\S]*?```/g);
    if (codeBlocks) {
      artifacts.codeBlocks = codeBlocks.map(block => 
        block.replace(/```\w*\n?/, '').replace(/```$/, '').trim()
      );
    }
    
    // Extract specific sections based on mode and phase
    switch (request.mode) {
      case 'design':
        if (request.phase === 'specification') {
          artifacts.requirements = content;
        } else if (request.phase === 'pseudocode') {
          artifacts.pseudocode = content;
        } else if (request.phase === 'architecture') {
          artifacts.architecture = content;
        } else if (request.phase === 'refinement') {
          artifacts.guidelines = content;
        } else if (request.phase === 'completion') {
          artifacts.notes = content;
        }
        break;
        
      case 'build':
        if (request.phase === 'implementation') {
          artifacts.implementation = content;
        } else if (request.phase === 'testing') {
          artifacts.tests = content;
        }
        break;
        
      case 'debug':
        if (request.phase === 'analysis') {
          artifacts.notes = content;
        } else if (request.phase === 'fix_generation') {
          artifacts.notes = content;
        }
        break;
    }
    
    return artifacts;
  }
  
  /**
   * Get mock response when AI is not available
   */
  private getMockResponse(request: AIRequest): AIResponse {
    const { userInput, mode, phase } = request;
    
    let mockContent = '';
    
    switch (mode) {
      case 'design':
        if (phase === 'specification') {
          mockContent = `# Requirements Specification\n\nBased on your request: "${userInput}"\n\n## Functional Requirements\n- Implement the specific functionality you requested\n- Use appropriate programming language and framework\n- Follow best practices for the technology stack\n\n## Non-Functional Requirements\n- Code should be maintainable and well-documented\n- Performance should meet typical standards\n- Security considerations should be addressed\n\n*Note: This is a mock response. Configure OpenAI API key for AI-generated content.*`;
        } else if (phase === 'pseudocode') {
          mockContent = `# Pseudocode\n\nBased on your request: "${userInput}"\n\n\`\`\`\nBEGIN\n  INITIALIZE environment\n  IMPLEMENT requested functionality\n  HANDLE edge cases\n  RETURN results\nEND\n\`\`\`\n\n*Note: This is a mock response. Configure OpenAI API key for AI-generated content.*`;
        } else if (phase === 'architecture') {
          mockContent = `# System Architecture\n\nBased on your request: "${userInput}"\n\n## Architecture Overview\n- Design appropriate for your specific use case\n- Use recommended patterns for your technology stack\n- Consider scalability and maintainability\n\n## Implementation Guidelines\n- Follow language-specific best practices\n- Use appropriate design patterns\n- Ensure proper error handling\n\n*Note: This is a mock response. Configure OpenAI API key for AI-generated content.*`;
        } else {
          mockContent = `# ${phase.charAt(0).toUpperCase() + phase.slice(1)} Phase\n\nBased on your request: "${userInput}"\n\nThis phase will be completed with AI assistance once the OpenAI API key is configured.\n\n*Note: This is a mock response. Configure OpenAI API key for AI-generated content.*`;
        }
        break;
        
      case 'build':
        if (phase === 'implementation') {
          mockContent = `# Implementation\n\nBased on your request: "${userInput}"\n\n\`\`\`\n// Your implementation will be generated here\n// This is a placeholder - configure OpenAI API key for actual code generation\n\`\`\`\n\n*Note: This is a mock response. Configure OpenAI API key for AI-generated content.*`;
        } else if (phase === 'testing') {
          mockContent = `# Test Suite\n\nBased on your request: "${userInput}"\n\n\`\`\`\n// Your tests will be generated here\n// This is a placeholder - configure OpenAI API key for actual test generation\n\`\`\`\n\n*Note: This is a mock response. Configure OpenAI API key for AI-generated content.*`;
        } else {
          mockContent = `# ${phase.charAt(0).toUpperCase() + phase.slice(1)} Phase\n\nBased on your request: "${userInput}"\n\nThis phase will be completed with AI assistance once the OpenAI API key is configured.\n\n*Note: This is a mock response. Configure OpenAI API key for AI-generated content.*`;
        }
        break;
        
      case 'debug':
        mockContent = `# Debug Analysis\n\nBased on your request: "${userInput}"\n\n## Issues Found\n- Analysis will be performed with AI assistance\n- Specific fixes will be generated\n- Code improvements will be suggested\n\n*Note: This is a mock response. Configure OpenAI API key for AI-generated content.*`;
        break;
        
      default:
        mockContent = `# Response\n\nBased on your request: "${userInput}"\n\nThis response will be generated with AI assistance once the OpenAI API key is configured.\n\n*Note: This is a mock response. Configure OpenAI API key for AI-generated content.*`;
    }
    
    return {
      content: mockContent,
      confidence: 0.5,
      reasoning: 'Mock response - OpenAI API key not configured',
      nextSteps: this.generateNextSteps(mode, phase),
      artifacts: this.extractArtifacts(mockContent, request)
    };
  }
  
  /**
   * Refresh API key from VS Code settings
   */
  refreshApiKey(): void {
    console.log('[AIService] Refreshing API key from VS Code settings...');
    console.log('[AIService] Debug - Current status before refresh:', this.getStatus());
    this.initializeOpenAI();
    console.log('[AIService] Debug - Status after refresh:', this.getStatus());
  }
  
  /**
   * Check if AI service is properly initialized
   */
  isAvailable(): boolean {
    return this.isInitialized;
  }
  
  /**
   * Get service status
   */
  getStatus(): { initialized: boolean; hasApiKey: boolean; source: string } {
    const config = vscode.workspace.getConfiguration('mira');
    const vscodeApiKey = config.get<string>('openaiApiKey');
    const envApiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY;
    
    const hasVSCodeKey = !!(vscodeApiKey && vscodeApiKey.trim() !== '');
    const hasEnvKey = !!envApiKey;
    
    return {
      initialized: this.isInitialized,
      hasApiKey: hasVSCodeKey || hasEnvKey,
      source: hasVSCodeKey ? 'VS Code Settings' : hasEnvKey ? 'Environment Variable' : 'None'
    };
  }
}
