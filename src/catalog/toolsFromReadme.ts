import axios from 'axios';
import * as vscode from 'vscode';
import { getMergedConfig, hasExternalOverride } from '../config/configLoader';

export interface ReadmeToolParam {
  name: string;
  type?: string;
  required?: boolean;
  description?: string;
}

export interface ReadmeTool {
  name: string;
  description?: string;
  parameters?: ReadmeToolParam[];
}

/**
 * Cache for parsed tools from README
 */
let cachedTools: ReadmeTool[] = [];
let lastFetch = 0;
const TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

/**
 * Fetch and parse the Tools section from:
 * https://github.com/github/github-mcp-server/blob/main/README.md#tools
 * We read the raw README and extract:
 * - Tool entries like: "- **tool_name** - Description"
 * - Following parameter bullets:
 *     "  - `param`: Details (type, required)"
 */
export async function getToolsFromReadme(): Promise<ReadmeTool[]> {
  const now = Date.now();
  if (cachedTools.length > 0 && now - lastFetch < TTL_MS) {
    return cachedTools;
  }

  // Optional GitHub token to increase rate limits
  const settingsCfg = !hasExternalOverride() ? vscode.workspace.getConfiguration('mcpClient') : undefined;
  const merged = (getMergedConfig('mcpClient') || {}) as any;
  const ghToken =
    (merged.githubToken as string) || (merged.apiKey as string) ||
    (settingsCfg ? settingsCfg.get<string>('githubToken', '') : '') ||
    (settingsCfg ? settingsCfg.get<string>('apiKey', '') : '') ||
    '';

  const headers: Record<string, string> = { 'Accept': 'application/vnd.github.v3.raw' };
  if (ghToken) headers['Authorization'] = `Bearer ${ghToken}`;

  const readmeUrl = 'https://raw.githubusercontent.com/github/github-mcp-server/main/README.md';
  let md = '';
  try {
    const resp = await axios.get(readmeUrl, { headers, timeout: 15000 });
    md = typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data ?? '');
  } catch {
    return cachedTools; // return previous cache if any
  }

  const tools = parseToolsSection(md);
  cachedTools = tools;
  lastFetch = Date.now();
  return cachedTools;
}

function parseToolsSection(md: string): ReadmeTool[] {
  const lines = md.split(/\r?\n/);

  // Prefer explicit automated tools markers
  const startMarker = '<!-- START AUTOMATED TOOLS -->';
  const endMarker = '<!-- END AUTOMATED TOOLS -->';

  let start = lines.findIndex(l => typeof l === 'string' && l.includes(startMarker));
  let end = -1;
  if (start !== -1) {
    end = lines.findIndex((l, idx) => idx > start && typeof l === 'string' && l.includes(endMarker));
  }

  let section: string[];
  if (start !== -1 && end !== -1 && end > start) {
    // Use only the content between the markers (exclude marker lines)
    section = lines.slice(start + 1, end);
  } else {
    // Fallback: Locate "## Tools" section and continue until the next "## " heading
    let toolsStart = -1;
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i].trim();
      if (/^##\s+tools\s*$/i.test(l)) {
        toolsStart = i + 1;
        break;
      }
    }
    if (toolsStart === -1) return [];

    let toolsEnd = lines.length;
    for (let i = toolsStart; i < lines.length; i++) {
      if (/^##\s+/.test(lines[i])) {
        toolsEnd = i;
        break;
      }
    }
    section = lines.slice(toolsStart, toolsEnd);
  }

  const tools: ReadmeTool[] = [];

  // Parse tools inside the selected section
  // Tool entry pattern: "- **tool_name** - Description"
  // Followed by params:
  // "  - `param`: Text (type, required)"
  let i = 0;
  while (i < section.length) {
    const line = section[i];

    // Match a tool bullet with bold name
    const toolMatch = /^\s*[-*+]\s+\*\*([a-z0-9_]{3,})\*\*\s*[-—–:]\s*(.+)?\s*$/i.exec(line);
    if (toolMatch) {
      const name = (toolMatch[1] || '').trim();
      const desc = (toolMatch[2] || '').trim() || undefined;

      const params: ReadmeToolParam[] = [];
      let j = i + 1;
      while (j < section.length) {
        const pLine = section[j];

        // Stop when a new top-level bullet or heading/group begins
        if (/^\s*[-*+]\s+/.test(pLine)) break;
        if (/^###\s+/.test(pLine)) break;
        if (/^<details>/i.test(pLine)) break;
        if (/^<\/details>/i.test(pLine)) { j++; continue; }
        if (/^<summary>/i.test(pLine)) { j++; continue; }

        // Param bullet: two spaces then "- `param`: ..."
        const paramMatch = /^\s{2,}[-*+]\s+`([a-z][a-z0-9_]*)`\s*:\s*(.+)$/.exec(pLine);
        if (paramMatch) {
          const pName = paramMatch[1];
          const details = paramMatch[2].trim();

          // Extract type/required flags if present in parentheses
          let type: string | undefined;
          let required: boolean | undefined;
          const parenMatch = /\(([^)]+)\)/.exec(details);
          if (parenMatch) {
            const parts = parenMatch[1].split(',').map(s => s.trim().toLowerCase());
            const typeToken = parts.find(x => /^[a-z][a-z0-9]+$/.test(x));
            if (typeToken) type = typeToken;
            if (parts.includes('required')) required = true;
            if (parts.includes('optional')) required = false;
          }

          params.push({
            name: pName,
            type,
            required,
            description: details
          });

          j++;
          continue;
        }

        // Allow blank lines within a tool block
        if (/^\s*$/.test(pLine)) { j++; continue; }

        // Other content lines are skipped but do not break grouping
        j++;
      }

      tools.push({ name, description: desc, parameters: params.length ? params : undefined });
      i = j;
      continue;
    }

    i++;
  }

  return tools;
}
