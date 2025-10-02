# LLM Setup Guide for Mira Workflow System

This guide explains how to configure your LLM API key for the Mira workflow system.

## 🚀 **Quick Setup**

### **Method 1: Interactive Configuration (Recommended)**

1. **Open Command Palette** (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. **Run**: `Mira LLM: Configure API Key`
3. **Follow the prompts**:
   - Select your LLM provider (OpenAI, Anthropic, Google, Azure, or Local)
   - Enter your model name (e.g., `gpt-4`, `claude-3-sonnet-20240229`)
   - Enter your API key
   - Configure optional settings (base URL, temperature, max tokens)

### **Method 2: VSCode Settings**

1. **Open Settings** (`Ctrl+,` or `Cmd+,`)
2. **Search for**: `mira.llm`
3. **Configure the following**:
   - `mira.llm.provider`: Your LLM provider
   - `mira.llm.model`: Model name
   - `mira.llm.apiKey`: Your API key
   - `mira.llm.baseUrl`: Custom base URL (optional)
   - `mira.llm.temperature`: Response creativity (0-2)
   - `mira.llm.maxTokens`: Maximum response length

## 🔑 **API Key Setup by Provider**

### **OpenAI**
```json
{
  "mira.llm.provider": "openai",
  "mira.llm.model": "gpt-4",
  "mira.llm.apiKey": "sk-your-openai-api-key-here"
}
```
- **Get API Key**: https://platform.openai.com/api-keys
- **Models**: `gpt-4`, `gpt-4-turbo`, `gpt-3.5-turbo`

### **Anthropic (Claude)**
```json
{
  "mira.llm.provider": "anthropic",
  "mira.llm.model": "claude-3-sonnet-20240229",
  "mira.llm.apiKey": "sk-ant-your-anthropic-api-key-here"
}
```
- **Get API Key**: https://console.anthropic.com/
- **Models**: `claude-3-opus-20240229`, `claude-3-sonnet-20240229`, `claude-3-haiku-20240307`

### **Google (Gemini)**
```json
{
  "mira.llm.provider": "google",
  "mira.llm.model": "gemini-pro",
  "mira.llm.apiKey": "your-google-api-key-here"
}
```
- **Get API Key**: https://makersuite.google.com/app/apikey
- **Models**: `gemini-pro`, `gemini-pro-vision`

### **Azure OpenAI**
```json
{
  "mira.llm.provider": "azure",
  "mira.llm.model": "gpt-4",
  "mira.llm.apiKey": "your-azure-api-key-here",
  "mira.llm.baseUrl": "https://your-resource.openai.azure.com/openai/deployments/your-deployment/chat/completions?api-version=2023-12-01-preview"
}
```
- **Get API Key**: Azure Portal → Your OpenAI Resource → Keys and Endpoint
- **Models**: Depends on your Azure deployment

### **Local LLM**
```json
{
  "mira.llm.provider": "local",
  "mira.llm.model": "local-model"
}
```
- **No API key required**
- **Note**: Local LLM integration is a placeholder - you'll need to implement the actual local LLM client

## 🛠️ **Configuration Options**

### **Provider Options**
- `openai`: OpenAI GPT models
- `anthropic`: Anthropic Claude models
- `google`: Google Gemini models
- `azure`: Azure OpenAI Service
- `local`: Local LLM (placeholder)

### **Model Examples**
- **OpenAI**: `gpt-4`, `gpt-4-turbo`, `gpt-3.5-turbo`
- **Anthropic**: `claude-3-opus-20240229`, `claude-3-sonnet-20240229`
- **Google**: `gemini-pro`, `gemini-pro-vision`
- **Azure**: Depends on your deployment name

### **Advanced Settings**
- **Temperature** (0-2): Controls response creativity
  - `0.0`: Very focused and deterministic
  - `0.7`: Balanced (recommended)
  - `2.0`: Very creative and random
- **Max Tokens** (1-100000): Maximum response length
  - `1000`: Short responses
  - `4000`: Medium responses (recommended)
  - `8000`: Long responses
- **Timeout** (1000-300000ms): API call timeout
  - `30000`: 30 seconds (recommended)

## 🔍 **Verification**

### **Check Configuration Status**
1. **Command Palette**: `Mira LLM: Show Status`
2. **Look for**: ✅ Configured or ❌ Not Configured

### **Test the Integration**
1. **Create an issue** in Mira
2. **Switch to Design mode**
3. **Send a message** like "create a website"
4. **Check if you get real AI responses** instead of placeholder messages

## 🚨 **Troubleshooting**

### **Common Issues**

#### **"LLM not configured" Error**
- **Solution**: Run `Mira LLM: Configure API Key` and enter your API key

#### **"API call failed" Error**
- **Check**: API key is correct and has sufficient credits
- **Check**: Model name is valid for your provider
- **Check**: Base URL is correct (for Azure/custom endpoints)

#### **"Timeout" Error**
- **Solution**: Increase `mira.llm.timeout` setting
- **Check**: Internet connection and API service status

#### **"Rate limit" Error**
- **Solution**: Wait a moment and try again
- **Check**: Your API plan limits

### **Fallback Behavior**
If LLM configuration fails, Mira will:
- Show a warning message
- Fall back to simulated responses
- Continue working with basic functionality

## 📝 **Example Configurations**

### **Development Setup (OpenAI)**
```json
{
  "mira.llm.provider": "openai",
  "mira.llm.model": "gpt-3.5-turbo",
  "mira.llm.apiKey": "sk-your-key",
  "mira.llm.temperature": 0.7,
  "mira.llm.maxTokens": 2000
}
```

### **Production Setup (Claude)**
```json
{
  "mira.llm.provider": "anthropic",
  "mira.llm.model": "claude-3-sonnet-20240229",
  "mira.llm.apiKey": "sk-ant-your-key",
  "mira.llm.temperature": 0.5,
  "mira.llm.maxTokens": 4000
}
```

### **Azure Enterprise Setup**
```json
{
  "mira.llm.provider": "azure",
  "mira.llm.model": "gpt-4",
  "mira.llm.apiKey": "your-azure-key",
  "mira.llm.baseUrl": "https://your-resource.openai.azure.com/openai/deployments/gpt-4/chat/completions?api-version=2023-12-01-preview",
  "mira.llm.temperature": 0.3,
  "mira.llm.maxTokens": 8000
}
```

## 🎯 **Next Steps**

1. **Configure your LLM** using one of the methods above
2. **Test the integration** by creating an issue and sending a message
3. **Customize settings** based on your needs
4. **Start building** with Mira's AI-powered workflow system!

## 🔒 **Security Notes**

- **API keys are stored** in VSCode's secure settings
- **Never commit** API keys to version control
- **Use environment variables** for production deployments
- **Rotate API keys** regularly for security

---

**Need help?** Check the Mira workflow system documentation or open an issue in the repository.
