/**
 * Simple cache for MCP dynamic toolsets discovered at connect time.
 */

export type DiscoveredTool = {
  name: string;
  description?: string;
  parameters?: Array<{ name?: string; type?: string; required?: boolean; [k: string]: any }>;
  [k: string]: any;
};

let cachedTools: DiscoveredTool[] = [];
let lastUpdated = 0;

/**
 * Update the cached toolset.
 */
export function setCachedTools(tools: DiscoveredTool[] | any) {
  try {
    if (Array.isArray(tools)) {
      cachedTools = tools as DiscoveredTool[];
      lastUpdated = Date.now();
      return;
    }
    // Common shapes: { tools: [...] } or { toolset: [...] }
    if (tools && typeof tools === 'object') {
      const maybe =
        (tools as any).tools ||
        (tools as any).toolset ||
        (tools as any).items ||
        [];
      if (Array.isArray(maybe)) {
        cachedTools = maybe as DiscoveredTool[];
        lastUpdated = Date.now();
      }
    }
  } catch {
    // keep previous cache
  }
}

/**
 * Get the cached toolset.
 */
export async function getCachedTools(): Promise<DiscoveredTool[]> {
  return Array.isArray(cachedTools) ? cachedTools : [];
}

/**
 * Return the cache timestamp.
 */
export function getCacheTimestamp(): number {
  return lastUpdated;
}
