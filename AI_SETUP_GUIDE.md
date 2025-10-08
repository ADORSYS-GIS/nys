# AI Setup Guide for SPARC Workflow Engine

## Overview

The SPARC Workflow Engine now includes AI-powered graph orchestration that can intelligently interpret user requests and generate appropriate responses based on the current workflow mode and phase.

## Features

- **Intelligent Request Interpretation**: AI analyzes user input and generates contextually appropriate responses
- **Mode-Specific Processing**: Different AI prompts for Design, Build, and Debug modes
- **Phase-Aware Generation**: Tailored responses for each SPARC phase (Specification, Pseudocode, Architecture, etc.)
- **Fallback Support**: Mock responses when AI is not configured

## Setup Instructions

### 1. Get OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Navigate to "API Keys" section
4. Click "Create new secret key"
5. Copy the generated API key

### 2. Configure API Key in VS Code Settings (Recommended)

#### Method 1: VS Code Settings UI
1. Open VS Code Settings (Ctrl/Cmd + ,)
2. Search for "mira"
3. Find "Mira: Openai Api Key" setting
4. Paste your API key in the text field
5. VS Code will securely store the key

#### Method 2: VS Code Settings JSON
1. Open VS Code Settings (Ctrl/Cmd + ,)
2. Click the "Open Settings (JSON)" icon in the top right
3. Add the following to your settings:
```json
{
  "mira.openaiApiKey": "your_api_key_here"
}
```

#### Method 3: Environment Variable (Fallback)
```bash
export OPENAI_API_KEY="your_api_key_here"
```

### 3. Refresh AI Service

After setting the API key, you can either:
- **Restart VS Code** (recommended for first-time setup)
- **Use the refresh command**: Press `Ctrl/Cmd + Shift + P` and run "Mira: Refresh OpenAI API Key"

## How It Works

### AI-Powered Graph Nodes

Each graph node now uses the AI service to:

1. **Analyze User Input**: Understand what the user actually wants
2. **Generate Contextual Responses**: Create appropriate content for the current mode and phase
3. **Maintain Consistency**: Ensure responses align with the user's specific request

### Example Workflow

When a user requests "build simple rust hello world function":

1. **Specification Phase**: AI generates Rust-specific requirements
2. **Pseudocode Phase**: AI creates pseudocode for Rust implementation
3. **Architecture Phase**: AI designs Rust project structure
4. **Implementation Phase**: AI generates actual Rust code
5. **Testing Phase**: AI creates Rust-specific tests

### Mode-Specific AI Prompts

#### Design Mode
- **Specification**: Analyzes requirements and creates detailed specifications
- **Pseudocode**: Generates language-specific pseudocode
- **Architecture**: Designs appropriate system architecture
- **Refinement**: Refines requirements based on architectural decisions
- **Completion**: Summarizes design phase completion

#### Build Mode
- **Implementation**: Generates working code in the requested language/framework
- **Testing**: Creates appropriate test suites

#### Debug Mode
- **Analysis**: Analyzes code issues and problems
- **Fix Generation**: Provides specific fixes and improvements

## Troubleshooting

### Mock Responses

If you see messages like "This is a mock response. Configure OpenAI API key for AI-generated content", it means:

1. The API key is not configured
2. The API key is invalid
3. There's a network connectivity issue

### Check Configuration

You can verify your AI service status by checking the console logs:
- `[AIService] OpenAI initialized successfully with VS Code configuration` - AI is ready
- `[AIService] OpenAI API key not found in VS Code settings or environment variables` - AI not configured

You can also use the refresh command to check status:
1. Press `Ctrl/Cmd + Shift + P`
2. Run "Mira: Refresh OpenAI API Key"
3. Check the notification message for status

### Common Issues

1. **Invalid API Key**: Ensure the key starts with `sk-` and is correctly copied
2. **Network Issues**: Check your internet connection and firewall settings
3. **Rate Limits**: OpenAI has usage limits; check your account status
4. **Environment Variables**: Ensure variables are set in the correct shell session

## Benefits

### Before (Hardcoded Templates)
- Generic TypeScript/Node.js responses regardless of user request
- No understanding of user intent
- Limited flexibility

### After (AI-Powered)
- Specific responses based on user's actual request
- Language and framework awareness
- Intelligent interpretation of requirements
- Contextual generation for each workflow phase

## Example Outputs

### User Request: "build simple rust hello world function"

**Before**: Generic TypeScript authentication middleware
**After**: Actual Rust hello world implementation with proper project structure

### User Request: "create a Python web scraper"

**Before**: Generic TypeScript authentication middleware  
**After**: Python-specific web scraping code with appropriate libraries

## Next Steps

1. Set up your OpenAI API key
2. Test the system with various requests
3. Monitor the console logs for AI service status
4. Enjoy intelligent, context-aware workflow orchestration!

## Configuration Options

### VS Code Settings (Recommended)
```json
{
  "mira.openaiApiKey": "your_api_key_here"
}
```

### Environment Variable (Fallback)
```bash
export OPENAI_API_KEY="your_api_key_here"
```

### Refresh Command
- **Command**: "Mira: Refresh OpenAI API Key"
- **Shortcut**: `Ctrl/Cmd + Shift + P` → "Mira: Refresh OpenAI API Key"

## Support

If you encounter issues:
1. Check the console logs for error messages
2. Verify your API key configuration
3. Use the refresh command to check AI service status
4. Ensure you have an active OpenAI account with credits
5. Check the [OpenAI API Documentation](https://platform.openai.com/docs) for any service issues
