import axios from 'axios';
import * as vscode from 'vscode';
import { ModelProviderFactory } from '../modelProviders/modelProviderFactory';
import { getMergedConfig, hasExternalOverride } from '../config/configLoader';

export class PromptRewriter {
  /**
   * Rewrites the user's raw prompt into a concise, server-friendly plain text prompt.
   * If rewrite fails, returns the original input.
   */
  public static async rewrite(userInput: string, context?: string): Promise<string> {
    try {
      const settingsCfg = !hasExternalOverride() ? vscode.workspace.getConfiguration('mcpClient') : undefined;
      const merged = (getMergedConfig('mcpClient') || {}) as any;
      const apiKey = (merged.apiKey as string) || (merged.llmApiKey as string)
        || (settingsCfg ? settingsCfg.get<string>('apiKey', '') : '')
        || (settingsCfg ? settingsCfg.get<string>('llmApiKey', '') : '');
      const useMock = (typeof merged.useMockLlm === 'boolean') ? !!merged.useMockLlm : (settingsCfg ? settingsCfg.get<boolean>('useMockLlm', false) : false);

      const provider = ModelProviderFactory.getProvider();

      const system = `You are a prompt rewriter. Rewrite the user's request into a concise, unambiguous plain-text prompt suitable for a code assistant server.
Requirements:
- Output PLAIN TEXT only (no markdown formatting).
- Preserve the user's intent precisely.
- Remove filler words and ambiguity.
- If context is provided, incorporate only the most relevant details in one or two short lines.
- Keep it brief and directly actionable.`;

      const user = `User Request:
${userInput}

${context ? `Context (optional, summarize only what helps):\n${context}` : ''}`;

      if (useMock) {
        // Return trimmed input as a mock rewrite
        return userInput.trim();
      }

      // Prefer SDK via provider if offered; otherwise use HTTP
      const maybeSendMessage: any = (provider as any).sendMessage;
      if (typeof maybeSendMessage === 'function') {
        const sdkResp = await (provider as any).sendMessage?.(apiKey || '', system, user);
        const content = provider.extractContent(sdkResp);
        return (content && typeof content === 'string') ? content.trim() : userInput;
      }

      const body = provider.createRequestBody(system, user);
      const headers = provider.getHeaders(apiKey || '');
      const resp = await axios.post(provider.getEndpoint(), body, { headers });
      const content = provider.extractContent(resp.data);
      return (content && typeof content === 'string') ? content.trim() : userInput;
    } catch (e) {
      console.warn('[PromptRewriter] rewrite failed:', (e as any)?.message || String(e));
      return userInput;
    }
  }
}
