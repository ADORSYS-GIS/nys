import * as vscode from 'vscode';
import axios from 'axios';
import { getMergedConfig, hasExternalOverride } from '../config/configLoader';
import { ModelProviderFactory } from '../modelProviders/modelProviderFactory';
import { getCachedTools } from '../mcp/toolsetCache';
import { getSemanticToolsetExternal } from '../mcp/toolsetProvider';
import { ensureSemanticIndex, semanticSearch } from '../mcp/semanticIndexer';

interface LlmParserOptions {
  endpoint?: string;
  apiKey?: string;
  model?: string;
  maxRetries?: number;
}

export interface ToolCommand {
  name: string;
  params: Record<string, any>;
}

/**
 * An LLM-based parser that uses an API to convert natural language to structured tool commands
 */
export class LlmParser {
  private options: LlmParserOptions;
  private availableTools: any[] = [];

  constructor(options: LlmParserOptions = {}) {
    this.options = {
      maxRetries: 2,
      ...options
    };
  }

  /**
   * Deprecated: No longer used; LLM is always expected to look up live tool lists via web.
   */
  public setAvailableTools(_tools: any[]) {
    // No-op: live web lookup always used.
  }

  /**
   * Parse natural language into a structured tool command using an LLM
   * @param input The user input to parse
   */
  public async parseInput(input: string, context?: any): Promise<ToolCommand[] | string> {
    // Quick pass - if it's already in the correct format, just return it as an array
    if (input.startsWith('tool:')) {
      const [toolPrefix, ...paramParts] = input.split(' ');
      const toolName = toolPrefix.substring(5); // Remove 'tool:' prefix

      // Parse parameters
      const params: Record<string, any> = {};
      for (const part of paramParts) {
        const [key, value] = part.split('=');
        if (key && value) {
          // Try to convert numbers and booleans
          if (value === 'true') params[key] = true;
          else if (value === 'false') params[key] = false;
          else if (!isNaN(Number(value))) params[key] = Number(value);
          else params[key] = value;
        }
      }
      // Wrap in array for consistency
      return [{ name: toolName, params }];
    }

    // Check if we have the API key
    const settingsCfg = !hasExternalOverride() ? vscode.workspace.getConfiguration('mcpClient') : undefined;
    const merged = (getMergedConfig('mcpClient') || {}) as any;
    const apiKey = this.options.apiKey
      || (merged.llmApiKey as string) || (merged.apiKey as string)
      || (settingsCfg ? settingsCfg.get<string>('llmApiKey', '') : '')
      || (settingsCfg ? settingsCfg.get<string>('apiKey', '') : '');

    if (!apiKey) {
      throw new Error('LLM API Key not configured. Please set mcpClient.apiKey in settings.');
    }

    // Use context-aware toggle: only read .nys if a non-empty context was passed in
    let nysContext = '';
    try {
      if (typeof context === 'string' && context.trim().length > 0) {
        nysContext = await this.readNysContext();
      }
    } catch {}

    let _topHitToolName: string | null = null;

    // Prefer external semantic selection via Milvus; otherwise fall back to dynamic + cache with lexical selection
    let selectedTools: any[] = [];

    if (!Array.isArray(selectedTools) || selectedTools.length === 0) {
      // Try external semantic selection via embedding/vector MCP servers
      try {
        const ext = await getSemanticToolsetExternal(input, nysContext, 30);
        if (Array.isArray(ext) && ext.length > 0) {
          selectedTools = this.packToolsWithinBudget(ext, 30, 4000);
        }
      } catch {
        // ignore and fallback further
      }
    }

    if (!Array.isArray(selectedTools) || selectedTools.length === 0) {
      // If semantic selection returns nothing, fallback to cached tools (packed within budget)
      try {
        const cachedTools = await getCachedTools().catch(() => []);
        if (Array.isArray(cachedTools) && cachedTools.length > 0) {
          selectedTools = this.packToolsWithinBudget(cachedTools as any, 30, 4000);
          console.log(`[ToolSelect] Semantic hit=0; fell back to cached tools (count=${selectedTools.length})`);
        } else {
          selectedTools = [];
          console.log('[ToolSelect] No cached tools available to fallback');
        }
      } catch {
        selectedTools = [];
        console.log('[ToolSelect] Fallback to cached tools failed');
      }
    }

    // Build semantic grounding from vector DB (Milvus or external embedding server)
    let combinedContext = nysContext;
    try {
      const cachedTools = await getCachedTools().catch(() => []);
      if (Array.isArray(cachedTools) && cachedTools.length > 0) {
        try { await ensureSemanticIndex(cachedTools as any); } catch {}
        try {
          const hits = await semanticSearch(input, nysContext, 20);
          if (Array.isArray(hits) && hits.length > 0) {
            const norm = (s: any) => (typeof s === 'string' ? s : '')
              .replace(/^github\./, '')
              .replace(/^_+|_+$/g, '')
              .toLowerCase();
            const byName = new Map<string, any>();
            for (const t of cachedTools as any[]) {
              const n = norm(t?.name);
              if (n) byName.set(n, t);
            }
            const lines: string[] = [];
            for (const h of hits) {
              const id = norm((h as any)?.id || (h as any)?.metadata?.name || '');
              const tool = byName.get(id);
              if (tool) {
                const name = typeof tool.name === 'string' ? tool.name : id;
                const desc = typeof tool.description === 'string' ? tool.description : '';
                lines.push(`- ${name}${desc ? `: ${desc}` : ''}`);
              }
              if (lines.length >= 20) break;
            }
            if (lines.length > 0) {
              const semanticSection = `Semantic grounding from tool index (top ${lines.length}):\n${lines.join('\n')}`;
              combinedContext = [nysContext, semanticSection].filter(Boolean).join('\n\n');
            }
            console.log(`[SemanticGrounding] hits=${hits.length}, included=${lines.length}, combinedContextChars=${combinedContext.length}`);
          } else {
            console.log('[SemanticGrounding] No hits from semanticSearch');
          }
        } catch (e) {
          console.log('[SemanticGrounding] semanticSearch failed:', e);
        }
      } else {
        console.log('[SemanticGrounding] No cached tools available for grounding');
      }
    } catch (e) {
      console.log('[SemanticGrounding] Grounding setup failed:', e);
    }

    const prompt = this.buildPrompt(
      combinedContext,
      selectedTools
    );

    try {
      // Only real LLM calls from here
      // Get the appropriate model provider based on configuration
      const modelProvider = ModelProviderFactory.getProvider();
      // Get current model name from merged configuration (fallback to settings)
      const mergedCfg = (getMergedConfig('mcpClient') || {}) as any;
      const configuredModel = (mergedCfg.modelName as string) ?? ((typeof settingsCfg !== 'undefined') ? settingsCfg.get<string>('modelName', '') : '');
      console.log(`Using ${modelProvider.name} for LLM parsing with model: ${configuredModel || 'default'}`);

      // Create request body based on the provider, first arg is system prompt with context
      const requestBody = modelProvider.createRequestBody(prompt, input);
      // Log the actual model being used in the request
      if (requestBody.model) {
        console.log(`Model being used in request: ${requestBody.model}`);
      }

      // Get appropriate headers
      const headers = modelProvider.getHeaders(apiKey);

      // Log request details for debugging (masked API key)
      console.log(`Calling ${modelProvider.name} API with endpoint: ${modelProvider.getEndpoint()}`);
      console.log(`Request headers: ${JSON.stringify({...headers, 'x-api-key': '***MASKED***', 'Authorization': '***MASKED***'}, null, 2)}`);
      console.log(`Request body preview: ${JSON.stringify(requestBody, null, 2).substring(0, 500)}...`);

      // Try using SDK for specific providers if available
      if (modelProvider.name === 'Anthropic Claude' && typeof (modelProvider as any).sendMessage === 'function') {
        console.log('Using Anthropic SDK direct method');
        try {
          // Use the SDK method directly
          const response = await (modelProvider as any).sendMessage(apiKey, prompt, input);
          console.log('Received response from Anthropic SDK');

          // Extract content using the provider's extraction method
          const content = modelProvider.extractContent(response);
          if (!content) {
            console.warn('No content extracted from Anthropic SDK response');
            return "NO_TOOL_MATCH";
          }

          console.log('Extracted content from Anthropic SDK response:', content.substring(0, 100) + '...');
          const parsed = this.parseToolCallFromLlm(content);
          if (parsed === null) return "NO_TOOL_MATCH";
          return [parsed];
        } catch (sdkError) {
          console.error('Error using Anthropic SDK:', sdkError);
          // Fall through to standard HTTP request as fallback
        }
      }

      // Make the standard API call via HTTP
      console.log('Making standard HTTP API call');
      const response = await axios.post(
        modelProvider.getEndpoint(),
        requestBody,
        { headers }
      );

      // Log the response status
      console.log(`API response status: ${response.status}`);

      // Log response data structure (without sensitive data)
      const responseKeys = Object.keys(response.data || {});
      console.log(`Response data structure keys: ${responseKeys.join(', ')}`);

      // Extract content using the provider's extraction method
      const content = modelProvider.extractContent(response.data);

      // Log content extraction result
      if (!content) {
        console.warn('No content extracted from API response');
        return "NO_TOOL_MATCH";
      }

      console.log('Extracted content from API response:', content.substring(0, 100) + '...');

      // Extract the tool call(s): handle multi-line, NO_TOOL_MATCH, or a single tool
      // If empty/invalid, return NO_TOOL_MATCH as string
      if (typeof content === 'string') {
        const normalized = content.trim();
        if (!normalized) {
          return "NO_TOOL_MATCH";
        }
        if (normalized === 'NO_TOOL_MATCH') {
          return "NO_TOOL_MATCH";
        }
        // Support multi-command LLM responses (one per line)
        const lines = normalized.split('\n').map(l => l.trim()).filter(Boolean);
        const toolCommands: ToolCommand[] = [];
        for (const line of lines) {
          const toolObj = this.parseToolCallFromLlm(line);
          if (toolObj !== null) toolCommands.push(toolObj);
        }
        if (toolCommands.length > 0) {
          return toolCommands;
        }
        // If nothing parsed, propagate raw text as reason
        return "NO_TOOL_MATCH";
      }
      // If LLM returned a tool object directly (should not happen, but for compatibility)
      if (typeof content === 'object' && content !== null) {
        if (Array.isArray(content)) {
          return content as ToolCommand[];
        } else {
          return [content as ToolCommand];
        }
      }
      // If nothing at all, return "NO_TOOL_MATCH" string
      return "NO_TOOL_MATCH";
    } catch (error) {
      console.error('Error calling LLM API:', error);

      // Log specific error details if available
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }

      if (typeof error === 'object' && error !== null) {
        const errorObj = error as any;
        if (errorObj.response) {
          console.error('API response status:', errorObj.response.status);
          console.error('API response data:', JSON.stringify(errorObj.response.data || {}, null, 2));
        }
      }

      // Import error handler dynamically to avoid circular dependencies
      const errorHandler = await import('../modelProviders/handleApiError');
      const errorMessage = errorHandler.handleApiError(error);

      // Log detailed error information
      console.error(`LLM API error details: ${errorMessage}`);

      throw new Error(`Failed to parse input using LLM: ${errorMessage}`);
    }
  }

  // (Mock implementation removed)

  /**
   * Read and concatenate all files under the workspace .nys directory.
   * Returns a single context string with file headers and contents.
   * Applies a total size cap to avoid oversized prompts.
   */
  private async readNysContext(): Promise<string> {
    try {
      const folders = vscode.workspace.workspaceFolders;
      if (!folders || folders.length === 0) return '';

      // Find all files under .nys
      const uris = await vscode.workspace.findFiles('**/.nys/**');
      if (!uris || uris.length === 0) return '';

      // Sort deterministically
      uris.sort((a, b) => a.fsPath.localeCompare(b.fsPath));

      const MAX_BYTES = 200 * 1024; // 200KB total cap
      let used = 0;
      const parts: string[] = [];

      for (const uri of uris) {
        try {
          const data = await vscode.workspace.fs.readFile(uri);
          const text = Buffer.from(data).toString('utf8');

          // Skip empty files
          if (!text || text.trim().length === 0) continue;

          const header = `>>> ${uri.fsPath}\n`;
          const footer = `\n<<<\n`;
          const remaining = Math.max(0, MAX_BYTES - used - header.length - footer.length);

          if (remaining <= 0) break;

          // Trim file content if necessary to respect the cap
          const slice = text.length > remaining ? text.slice(0, remaining) : text;

          parts.push(header, slice, footer);
          used += header.length + slice.length + footer.length;

          if (used >= MAX_BYTES) break;
        } catch {
          // Continue with next file
          continue;
        }
      }

      return parts.join('');
    } catch {
      return '';
    }
  }

  /**
   * Merge tools from README and server cache by name, preserving descriptions and parameter lists.
   */
  private mergeToolsByName(readmeTools: any[], serverTools: any[]): any[] {
    const byName = new Map<string, any>();

    const normName = (n: any) => {
      const raw = typeof n === 'string' ? n : '';
      return raw.replace(/^github\./, '').replace(/^_+|_+$/g, '').toLowerCase();
    };

    const normalizeParams = (params: any): any[] => {
      if (Array.isArray(params)) return params;
      // Try JSON Schema shape: { type: 'object', properties: { p: { type, description } }, required: [] }
      if (params && typeof params === 'object') {
        const props = (params as any).properties || (params as any).schema?.properties;
        const requiredArr: string[] = (params as any).required || (params as any).schema?.required || [];
        if (props && typeof props === 'object') {
          return Object.keys(props).map((k) => {
            const sch = props[k] || {};
            const type = sch.type || (Array.isArray(sch.type) ? sch.type.join('|') : undefined);
            return {
              name: k,
              type: typeof type === 'string' ? type : undefined,
              required: Array.isArray(requiredArr) ? requiredArr.includes(k) : undefined,
              description: sch.description || sch.summary || undefined
            };
          });
        }
      }
      return [];
    };

    const addOrMerge = (src: any, sourceTag: 'readme' | 'server') => {
      if (!src || typeof src !== 'object') return;
      const name = normName(src.name);
      if (!name) return;

      const existing = byName.get(name) || { name };
      const descA = existing.description;
      const descB = src.description;

      // Prefer server description when available; else keep existing; else use readme
      const mergedDesc = sourceTag === 'server'
        ? (descB || descA)
        : (descA || descB);

      const paramsA = normalizeParams(existing.parameters || existing.args || existing.inputs);
      const paramsB = normalizeParams(src.parameters || src.args || src.inputs);

      // Merge params by name with preference to server for richer info
      const paramMap = new Map<string, any>();
      const put = (p: any, isServer: boolean) => {
        if (!p || typeof p !== 'object') return;
        const pn = typeof p.name === 'string' ? p.name : undefined;
        if (!pn) return;
        const key = pn.toLowerCase();
        const cur = paramMap.get(key) || { name: pn };
        const merged = {
          name: pn,
          type: (isServer ? (p.type || cur.type) : (cur.type || p.type)) || undefined,
          required: (typeof (isServer ? p.required : cur.required) === 'boolean')
            ? (isServer ? p.required : cur.required)
            : (typeof (isServer ? cur.required : p.required) === 'boolean'
                ? (isServer ? cur.required : p.required)
                : undefined),
          description: (isServer ? (p.description || cur.description) : (cur.description || p.description)) || undefined
        };
        paramMap.set(key, merged);
      };

      // Server first to prefer its fields, then readme
      for (const p of paramsB) put(p, sourceTag === 'server');
      for (const p of paramsA) put(p, false);

      byName.set(name, {
        ...existing,
        name,
        description: mergedDesc,
        parameters: Array.from(paramMap.values())
      });
    };

    for (const t of Array.isArray(readmeTools) ? readmeTools : []) addOrMerge(t, 'readme');
    for (const t of Array.isArray(serverTools) ? serverTools : []) addOrMerge(t, 'server');

    return Array.from(byName.values());
  }

  /**
   * Select a small relevant subset of tools within a size budget to reduce tokens.
   */
  private selectToolsForPrompt(tools: any[], prompt: string, maxTools: number = 30, charBudget: number = 4000): any[] {
    try {
      if (!Array.isArray(tools) || tools.length === 0) return [];

      const textToTokens = (txt: any): string[] => {
        if (typeof txt !== 'string') return [];
        return txt.toLowerCase().split(/[^a-z0-9_]+/).filter(t => t && t.length >= 3);
      };

      const promptTokens = new Set(textToTokens(prompt));

      const paramNames = (t: any): string[] => {
        const p = (t && (t.parameters || t.args || t.inputs)) || [];
        if (Array.isArray(p)) {
          return p.map((x: any) => (x && typeof x.name === 'string' ? x.name : ''))
                  .filter(Boolean)
                  .map(s => s.toLowerCase());
        }
        if (p && typeof p === 'object') {
          const props = (p as any).properties || (p as any).schema?.properties || {};
          return Object.keys(props).map(k => k.toLowerCase());
        }
        return [];
      };

      const scoreTool = (t: any): number => {
        const name = typeof t?.name === 'string' ? t.name.toLowerCase() : '';
        const desc = typeof t?.description === 'string' ? t.description.toLowerCase() : '';
        const pnames = paramNames(t);
        let s = 0;
        // name token overlap (3x)
        for (const tok of name.split(/[^a-z0-9_]+/)) {
          if (tok && tok.length >= 3 && promptTokens.has(tok)) s += 3;
        }
        // exact substring boosts
        for (const pt of promptTokens) {
          if (name.includes(pt)) s += 2;
        }
        // param name overlap (2x)
        for (const pn of pnames) {
          if (promptTokens.has(pn)) s += 2;
        }
        // description token overlap (1x)
        for (const tok of desc.split(/[^a-z0-9_]+/)) {
          if (tok && tok.length >= 4 && promptTokens.has(tok)) s += 1;
        }
        // slight bonus if tool has params
        if (pnames.length > 0) s += 0.5;
        return s;
      };

      // Rank tools
      const ranked = tools.map((t, idx) => ({ t, idx, s: scoreTool(t) }))
                          .sort((a, b) => b.s - a.s || a.idx - b.idx);

      // Approximate line string like buildPrompt for budget packing
      const lineFor = (t: any): string => {
        const name = typeof t?.name === 'string' ? t.name : '';
        const p = (t && (t.parameters || t.args || t.inputs)) || [];
        const keys: string[] = Array.isArray(p)
          ? p.map((x: any) => (x && typeof x.name === 'string' ? x.name : '')).filter(Boolean)
          : (p && typeof p === 'object'
              ? Object.keys((p as any).properties || (p as any).schema?.properties || {})
              : []);
        const paramsList = keys.length > 0 ? ` params=[${keys.join(', ')}]` : '';
        const descStr = typeof t?.description === 'string' ? ` desc="${t.description.replace(/"/g, '\'')}"` : '';
        return `- ${name}${paramsList}${descStr}`;
      };

      const selected: any[] = [];
      let used = 0;
      for (const { t } of ranked) {
        if (selected.length >= maxTools) break;
        const lineLen = lineFor(t).length + 1; // include newline
        if (used + lineLen > charBudget && selected.length > 0) break;
        selected.push(t);
        used += lineLen;
      }

      if (selected.length === 0) return tools.slice(0, Math.min(maxTools, tools.length));
      return selected;
    } catch {
      return tools.slice(0, Math.min(maxTools, tools.length));
    }
  }

  /**
   * Pack tools within a size budget preserving original order (used for semantic results)
   */
  private packToolsWithinBudget(tools: any[], maxTools: number = 30, charBudget: number = 4000): any[] {
    try {
      if (!Array.isArray(tools) || tools.length === 0) return [];

      const lineFor = (t: any): string => {
        const name = typeof t?.name === 'string' ? t.name : '';
        const p = (t && (t.parameters || t.args || t.inputs)) || [];
        const keys: string[] = Array.isArray(p)
          ? p.map((x: any) => (x && typeof x.name === 'string' ? x.name : '')).filter(Boolean)
          : (p && typeof p === 'object'
              ? Object.keys((p as any).properties || (p as any).schema?.properties || {})
              : []);
        const paramsList = keys.length > 0 ? ` params=[${keys.join(', ')}]` : '';
        const descStr = typeof t?.description === 'string' ? ` desc="${t.description.replace(/"/g, '\'')}"` : '';
        return `- ${name}${paramsList}${descStr}`;
      };

      const selected: any[] = [];
      let used = 0;
      for (const t of tools) {
        if (selected.length >= maxTools) break;
        const lineLen = lineFor(t).length + 1;
        if (used + lineLen > charBudget && selected.length > 0) break;
        selected.push(t);
        used += lineLen;
      }

      if (selected.length === 0) return tools.slice(0, Math.min(maxTools, tools.length));
      return selected;
    } catch {
      return tools.slice(0, Math.min(maxTools, tools.length));
    }
  }

  /**
   * Expand selected tools with intent-based matches (e.g., delete+repository) to avoid NO_TOOL_MATCH.
   * Keeps order, avoids duplicates, caps to maxAdd, and re-packs within budget.
   */
  private expandSelectionForAction(input: string, selected: any[], allTools: any[], maxAdd: number = 10): any[] {
    try {
      const text = (input || '').toLowerCase();
      const hasDelete = /(\bdelete\b|\bremove\b|\bdestroy\b|\barchive\b|\berase\b)/.test(text);
      const repoLike = /(\brepo\b|\brepository\b|\brepositories\b)/.test(text);
      if (!hasDelete && !repoLike) return selected;

      const norm = (s: any) => (typeof s === 'string' ? s : '')
        .replace(/^github\./, '')
        .replace(/^_+|_+$/g, '')
        .toLowerCase();

      const selectedNames = new Set<string>((Array.isArray(selected) ? selected : []).map(t => norm(t?.name)));

      const matches: any[] = [];
      for (const t of Array.isArray(allTools) ? allTools : []) {
        const name = norm(t?.name);
        const desc = (typeof t?.description === 'string' ? t.description : '').toLowerCase();
        if (!name) continue;
        // Strong match: name contains delete/remove and repo/repository
        const nameHasDelete = name.includes('delete') || name.includes('remove') || name.includes('destroy');
        const nameHasRepo = name.includes('repo') || name.includes('repository');
        const descHasDelete = desc.includes('delete') || desc.includes('remove') || desc.includes('destroy');
        const descHasRepo = desc.includes('repo') || desc.includes('repository');
        const strong = (nameHasDelete && nameHasRepo) || (descHasDelete && descHasRepo);
        const weak = (nameHasDelete || descHasDelete) && repoLike;
        if ((strong || weak) && !selectedNames.has(name)) {
          matches.push(t);
        }
      }

      const additions = matches.slice(0, Math.max(0, maxAdd));
      if (additions.length === 0) return selected;

      const merged = [...(Array.isArray(selected) ? selected : []), ...additions];
      const packed = this.packToolsWithinBudget(merged, 30, 4000);
      console.log(`[ToolSelect] Expanded selection by intent: added=${additions.length}, total=${packed.length}`);
      return packed;
    } catch (e) {
      console.log('[ToolSelect] expandSelectionForAction failed:', e);
      return selected;
    }
  }

  /**
   * Build the prompt for the LLM with available tools
   */
  private buildPrompt(context: string, tools: any[] = []): string {
    const extraContext = (typeof context === 'string' && context.trim()) ? context : '[No additional context provided]';

    // Render a concise, machine-parsable tools catalog
    let toolsSection = 'No tools found in server cache.\n';
    if (Array.isArray(tools) && tools.length > 0) {
      const lines: string[] = [];
      for (const t of tools) {
        const name = typeof t?.name === 'string' ? t.name : '';
        const desc = typeof t?.description === 'string' ? t.description : '';
        // Parameters as simple key list if present
        let paramsList = '';
        const params = (t && (t.parameters || t.args || t.inputs)) || [];
        if (Array.isArray(params) && params.length > 0) {
          const keys: string[] = [];
          for (const p of params) {
            if (p && typeof p === 'object' && typeof p.name === 'string') {
              keys.push(p.name);
            }
          }
          if (keys.length > 0) {
            paramsList = ` params=[${keys.join(', ')}]`;
          }
        }
        lines.push(`- ${name}${paramsList}${desc ? ` desc="${desc.replace(/"/g, '\'')}"` : ''}`);
      }
      toolsSection = lines.join('\n');
    }

    return `You are a tool command parser for developer automation.
Your main job is to convert natural language into structured tool commands for the GitHub MCP Server (https://github.com/github/github-mcp-server).

Context (.nys directory content from the current project):
${extraContext ? `-----\n${extraContext}\n-----\n` : '[No additional context provided]\n'}

Available Tools (selected for this prompt):
${toolsSection}

Instructions:
- Use ONLY the tools listed in "Available Tools" above. Do not invent tool names or parameters.
- If none of the available tools match the user's request, reply with "NO_TOOL_MATCH".
- TOOL NAMES are ALWAYS in snake_case (use underscores between words, do not use dots or camelCase), e.g., use "create_repository" not "createRepository".
- Example: tool:create_repository owner=someuser name=demo_repo
- If the context describes a GitHub repo/project and the user's request is to "spin up" or setup infrastructure, figure out which tools (and in what sequence) are needed; output one tool call per line, in order.
- Parameter names and value shapes must match the tools listed above. Prefer booleans (true/false) and numbers where appropriate. Use exact branch/owner/repo strings when specified.
- If you optionally consult official docs (https://github.com/github/github-mcp-server) to clarify semantics, do NOT introduce tools or params not present in "Available Tools" unless a follow-up discovery step enables them.

When you process a user request:
- Analyze the prompt (and the context if provided).
- Respond ONLY with the sequence of structured tool commands, in this format, one command per line:
  tool:tool_name param1=value1 param2=value2

If the input doesn't specify a valid tool/usage you can find among the available tools, reply with "NO_TOOL_MATCH" and nothing else.

Output rules:
- Output must only be the formatted tool command(s) (one per line) or NO_TOOL_MATCH, nothing else.
- Do not include explanations, extra text, or chat summaries.`;
  }

  /**
   * Parse the LLM response to extract the tool call
   */
  public parseToolCallFromLlm(content: string | null): ToolCommand | null {
    // Handle null or undefined content
    if (!content) {
      console.error('LLM returned null or empty content');
      return null;
    }

    // Clean up the response
    const cleaned = content.trim();

    // Check if content is empty after trimming
    if (!cleaned) {
      console.error('LLM returned empty content after trimming');
      return null;
    }

    // Check if no tool match
    if (cleaned === 'NO_TOOL_MATCH') {
      return null;
    }

    // Check for tool: format
    if (cleaned.startsWith('tool:')) {
      const [toolPrefix, ...paramParts] = cleaned.split(' ');
      // Remove 'tool:' prefix and sanitize 'github.' or leading/trailing underscores
      let toolName = toolPrefix.substring(5);
      if (toolName.startsWith('github.')) {
        toolName = toolName.substring('github.'.length);
      }
      toolName = toolName.replace(/^_+|_+$/g, '');

      // Parse parameters
      const params: Record<string, any> = {};
      for (const part of paramParts) {
        const [key, value] = part.split('=');
        if (key && value) {
          // Try to convert numbers and booleans
          if (value === 'true') params[key] = true;
          else if (value === 'false') params[key] = false;
          else if (!isNaN(Number(value))) params[key] = Number(value);
          else params[key] = value;
        }
      }
      return { name: toolName, params };
    }

    // Log the unexpected content format
    console.warn('LLM response not in expected format:', cleaned);

    // Couldn't parse the response
    return null;
  }
}
