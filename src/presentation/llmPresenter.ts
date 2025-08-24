import axios from 'axios';
import * as vscode from 'vscode';
import { ModelProviderFactory } from '../modelProviders/modelProviderFactory';
import { getMergedConfig, hasExternalOverride } from '../config/configLoader';

/**
 * LLM-based response presenter.
 * Converts arbitrary tool responses to user-friendly plain text.
 * Returns formatted plain text (no HTML).
 */
export class LlmPresenter {
  /**
   * Present a tool response as plain text using the configured LLM provider.
   * @param toolName Tool name (snake_case if known), e.g., 'list_issues'
   * @param response Raw response object/string from server
   * @param userPrompt Original user prompt (optional for context)
   * @returns Formatted plain text representation of the response
   */
  public static async present(toolName: string, response: any, userPrompt?: string): Promise<string> {
    const settingsCfg = !hasExternalOverride() ? vscode.workspace.getConfiguration('mcpClient') : undefined;
    const merged = (getMergedConfig('mcpClient') || {}) as any;
    const apiKey = (merged.apiKey as string) || (merged.llmApiKey as string)
      || (settingsCfg ? settingsCfg.get<string>('apiKey', '') : '')
      || (settingsCfg ? settingsCfg.get<string>('llmApiKey', '') : '');

    const useMock = (typeof merged.useMockLlm === 'boolean') ? !!merged.useMockLlm : (settingsCfg ? settingsCfg.get<boolean>('useMockLlm', false) : false);
    const provider = ModelProviderFactory.getProvider();

    // Prepare JSON sample (truncate to avoid huge payloads)
    const sample = LlmPresenter.buildSampleJson(response);

    const system = LlmPresenter.buildSystemPrompt(toolName);
    const user = LlmPresenter.buildUserPrompt(toolName, sample, userPrompt);

    try {
      if (useMock) {
        // Simple mock plain text fallback in dev
        const mock = `Preview:\n\n${JSON.stringify(sample, null, 2)}`;
        return mock;
      }

      // Build provider request
      const body = provider.createRequestBody(system, user);
      const headers = provider.getHeaders(apiKey || '');

      // Prefer SDK if provider exposes a direct send method compatible with (apiKey, system, user)
      const maybeSendMessage: any = (provider as any).sendMessage;
      if (typeof maybeSendMessage === 'function') {
        try {
          const sdkResp = await (provider as any).sendMessage?.(apiKey || '', system, user);
          const content = provider.extractContent(sdkResp);
          if (content) {
            return LlmPresenter.sanitizeToPlainText(content);
          }
        } catch (e) {
          // fall back to HTTP
        }
      }

      const resp = await axios.post(provider.getEndpoint(), body, { headers });
      const content = provider.extractContent(resp.data);
      if (!content) {
        return LlmPresenter.defaultTextFallback(sample);
      }
      return LlmPresenter.sanitizeToPlainText(content);
    } catch (err) {
      console.error('LLM Presenter error:', err);
      return LlmPresenter.defaultTextFallback(sample);
    }
  }

  private static buildSystemPrompt(toolName: string): string {
    // Base rules for ALL tools: produce readable, structured PLAIN TEXT (no HTML/tables)
    let rules = `You are a response presenter for a developer tool.
Your task is to read the provided raw response and return a concise, well‑structured PLAIN TEXT summary optimized for readability in a chat UI.

Requirements:
- Output MUST be plain text only (no HTML, no markdown tables, no code blocks unless the response itself is code).
- If the response indicates an error, return:
  1) A clear one‑line error title
  2) A short explanation of the likely cause(s)
  3) 2‑5 bullet suggestions to resolve the problem (permissions, auth, rate limits, wrong model/tool name, invalid params, network issues, etc.)
- If the response is valid data, return a readable summary with key fields and short bullet points when helpful.
- Remove unnecessary or noisy fields (internal URLs, repeated metadata, binary blobs, huge arrays). Keep only what helps the user understand the answer quickly.
- Prefer stable identifiers (e.g., numbers, titles, dates, statuses) and short links (if any) in plain text.
- Keep lines short and wrap long text.
- Do NOT include HTML or tables.
- If nothing meaningful is present, say "No relevant results."
- If you have access to a web/search tool and are uncertain about field semantics or tool usage, you MAY consult the official GitHub MCP server repository at https://github.com/github/github-mcp-server for brief clarification. Do not include raw content from the web; return only your concise plain‑text summary. Keep latency low.`;

    // Tool-specific hints (optional) to help structure
    if (toolName === 'list_issues') {
      rules += `
If the content represents GitHub issues, include for each issue:
- Issue Number
- Title
- Short description/summary
- Created At (YYYY-MM-DD HH:MM:SS)
- Status
- Author (login)
Use a compact bullet list per issue.`;
    }

    return rules;
  }

  private static buildUserPrompt(toolName: string, sample: any, userPrompt?: string): string {
    const sampleStr = typeof sample === 'string' ? sample : JSON.stringify(sample, null, 2);
    return `Tool Name: ${toolName || 'unknown'}
User Prompt (optional): ${userPrompt || ''}

JSON Result (sample/truncated):
${sampleStr}`;
  }

  private static buildSampleJson(response: any): any {
    try {
      let data = response;
      if (typeof response === 'string') {
        try {
          data = JSON.parse(response);
        } catch {
          // keep as string
        }
      }
      // If Anthropic/GitHub style wrapper: {content:[{type:'text',text:'[...]'}]}
      if (data && data.content && Array.isArray(data.content)) {
        const first = data.content[0];
        if (first && first.type === 'text' && typeof first.text === 'string') {
          try {
            const parsed = JSON.parse(first.text);
            data = parsed;
          } catch { /* keep */ }
        }
      }

      // Trim large arrays/objects
      if (Array.isArray(data)) {
        const trimmed = data.slice(0, 30);
        return trimmed;
      }
      if (data && typeof data === 'object') {
        // Keep first ~30 keys shallowly
        const keys = Object.keys(data).slice(0, 30);
        const out: Record<string, any> = {};
        for (const k of keys) out[k] = data[k];
        return out;
      }
      return data;
    } catch {
      return response;
    }
  }

  private static defaultTextFallback(sample: any): string {
    const asStr =
      typeof sample === 'string' ? sample : JSON.stringify(sample, null, 2);
    return `Preview:\n\n${asStr}`;
  }

  /**
   * Sanitizes HTML content, allowing only safe tags and attributes.
   * Used for testing and HTML processing.
   * @param html The HTML content to sanitize
   * @returns Sanitized HTML with only allowed tags and attributes
   */
  public static sanitizeHtml(html: string): string {
    if (!html || typeof html !== 'string') return '';

    // First decode any HTML entities that might be in the content
    let out = html.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    
    // Remove scripts entirely
    out = out.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');

    // Allow list of tags that can pass through
    const allowedTags = new Set([
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'a', 'b', 'strong', 'br', 'span', 'div'
    ]);

    // Replace tags while stripping dangerous attributes; escape disallowed tags
    out = out.replace(/<(\/?)([a-z0-9:-]+)(\s[^>]*)?>/gi, (_, closingSlash, tagName, attrs) => {
      const name = String(tagName || '').toLowerCase();

      if (allowedTags.has(name)) {
        let safeAttrs = attrs || '';

        // Remove event handlers (on*) and javascript: URLs
        safeAttrs = safeAttrs
          .replace(/\s+on\w+="[^"]*"/gi, '')
          .replace(/\s+on\w+='[^']*'/gi, '')
          .replace(/\s+href\s*=\s*(['"])\s*javascript:[^'"]*\1/gi, ' href="#"')
          .replace(/\s+style\s*=\s*(['"])[\s\S]*?\1/gi, (m: string) => m); // keep inline styles

        return `<${closingSlash || ''}${name}${safeAttrs || ''}>`;
      }

      // Not allowed: escape it so it shows as text
      const raw = `<${closingSlash || ''}${name}${attrs || ''}>`;
      return raw.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    });

    return out;
  }

  private static escape(text: string): string {
    if (typeof text !== 'string') text = String(text ?? '');
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /**
   * Sanitizes HTML content to plain text, removing all HTML tags.
   * @param content The HTML content to sanitize
   * @returns Plain text with HTML tags removed
   */
  private static sanitizeToPlainText(content: string): string {
    if (!content || typeof content !== 'string') return '';
    
    // Remove all HTML tags
    return content.replace(/<\/?[^>]+(>|$)/g, '');
  }
}
