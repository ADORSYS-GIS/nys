import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as YAML from 'yaml';

export type AnyRecord = Record<string, any>;

function readIfExists(p: string): AnyRecord | null {
  try {
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, 'utf8');
      if (!raw.trim()) return {};
      if (p.endsWith('.json')) {
        return JSON.parse(raw);
      }
      return YAML.parse(raw) || {};
    }
  } catch (e: any) {
    try { console.warn(`[Config] Failed to parse config file: ${p} -> ${e?.message || e}`); } catch {}
  }
  return null;
}

function firstWorkspaceFolder(): string | null {
  try {
    const folders = vscode.workspace.workspaceFolders;
    if (folders && folders.length > 0) {
      return folders[0].uri.fsPath;
    }
  } catch {}
  return null;
}

function loadExternalConfig(): AnyRecord {
  // Load from explicit env var
  const envPath = process.env.MIMIE_CONFIG;
  if (envPath) {
    const conf = readIfExists(envPath);
    if (conf) return conf;
  }

  // Candidate locations
  const ws = firstWorkspaceFolder();
  const home = os.homedir();
  const candidates: string[] = [];
  // Prefer user home config first (secrets), then workspace-level files
  candidates.push(
    path.join(home, '.mimie', 'config.yaml'),
    path.join(home, '.mimie', 'config.yml'),
    path.join(home, '.mimie', 'config.json')
  );
  if (ws) {
    candidates.push(
      // Workspace-local hidden folder
      path.join(ws, '.mimie', 'config.yaml'),
      path.join(ws, '.mimie', 'config.yml'),
      path.join(ws, '.mimie', 'config.json'),
      // Workspace root
      path.join(ws, 'mimie.config.yaml'),
      path.join(ws, 'mimie.config.yml'),
      path.join(ws, 'mimie.config.json'),
      // Common repo layout: configs/mimie.config.*
      path.join(ws, 'configs', 'mimie.config.yaml'),
      path.join(ws, 'configs', 'mimie.config.yml'),
      path.join(ws, 'configs', 'mimie.config.json'),
    );
  }

  for (const p of candidates) {
    const conf = readIfExists(p);
    if (conf) {
      try { console.log(`[Config] Loaded external config: ${p}`); } catch {}
      return conf;
    }
  }
  return {};
}

function deepMerge(target: AnyRecord, source: AnyRecord): AnyRecord {
  const out: AnyRecord = Array.isArray(target) ? [...target] : { ...target };
  for (const [k, v] of Object.entries(source || {})) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = deepMerge(out[k] && typeof out[k] === 'object' ? out[k] : {}, v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

let _cachedConfig: AnyRecord | null = null;
let _hasExternalOverride = false;
export function getMergedConfig(section?: string): AnyRecord {
  if (_cachedConfig === null) {
    const external = loadExternalConfig();
    const externalRoot = (external && (external.mcpClient || external)) || {};
    const hasExternal = externalRoot && Object.keys(externalRoot).length > 0;

    if (hasExternal) {
      try { console.log('[Config] External config detected; overriding VS Code settings entirely'); } catch {}
      _hasExternalOverride = true;
      _cachedConfig = { mcpClient: externalRoot };
    } else {
      _hasExternalOverride = false;
      const vscodeConfig = vscode.workspace.getConfiguration();
      const mcpClientSettings = (vscodeConfig.get('mcpClient') as AnyRecord) || {};
      _cachedConfig = { mcpClient: mcpClientSettings };
    }
  }
  if (section) {
    return (_cachedConfig?.[section] as AnyRecord) || {};
  }
  return _cachedConfig;
}


export function hasExternalOverride(): boolean {
  return _hasExternalOverride;
}
