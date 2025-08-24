/**
 * Pretty formatter for the MCP assistant's JSON responses (production view).
 * Detects common GitHub/MCP structures and renders readable HTML.
 * Note: All assistant rendering should come from LlmPresenter.present(...).
 */
export class JsonPretty {
  /**
   * Escape HTML special characters
   */
  private static escape(text: string): string {
    if (typeof text !== 'string') text = String(text ?? '');
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Format a date and time from a string
   */
  private static formatDateTime(value: any): { date: string; time: string } {
    if (!value) return { date: '', time: '' };
    const d = new Date(value);
    if (isNaN(d.getTime())) return { date: String(value), time: '' };
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return { date: `${yyyy}-${mm}-${dd}`, time: `${hh}:${mi}:${ss}` };
  }

  /**
   * Capitalize the first letter of a string
   */
  private static capFirst(s: string): string {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  /**
   * Format a date from a string
   */
  private static formatDate(value: any): string {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  /**
   * Create a summary of a text (first paragraph or first 200 chars)
   */
  private static summary(text: string): string {
    if (!text) return '';
    // Get first paragraph or first 200 chars
    const paragraphs = text.split(/\n+/);
    const firstPara = paragraphs.find(p => p.trim().length > 0) || '';
    if (firstPara.length <= 200) return firstPara;
    return firstPara.substring(0, 197) + '...';
  }

  /**
   * Generate a short preview of a value
   */
  private static valuePreview(v: any): string {
    if (v === null || v === undefined) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    if (Array.isArray(v)) {
      if (v.length === 0) return '[]';
      return `[${v.map(x => JsonPretty.valuePreview(x)).join(', ')}]`;
    }
    if (typeof v === 'object') return JSON.stringify(v).substring(0, 100);
    return String(v);
  }

  /**
   * Format a value for display, handling arrays and objects
   */
  private static formatValue(val: any): string {
    if (Array.isArray(val)) {
      return `<ul>${val.map(x => `<li>${JsonPretty.formatValue(x)}</li>`).join('')}</ul>`;
    }
    if (typeof val === 'object' && val !== null) {
      // Collapse objects with only an html_url or url
      if ('html_url' in val && typeof val.html_url === 'string') {
        return `<a href="${JsonPretty.escape(val.html_url)}" target="_blank">${JsonPretty.escape(val.html_url)}</a>`;
      }
      if ('url' in val && typeof val.url === 'string') {
        return `<a href="${JsonPretty.escape(val.url)}" target="_blank">${JsonPretty.escape(val.url)}</a>`;
      }
      // Shallow object node
      const short = Object.entries(val).slice(0, 5)
        .map(([k, v]) => `<b>${JsonPretty.escape(k)}</b>: ${JsonPretty.escape(String(v ?? '')).slice(0, 80)}`)
        .join(', ');
      return `<span class="json-short">{ ${short}${Object.keys(val).length > 5 ? ', ...' : ''} }</span>`;
    }
    return JsonPretty.escape(String(val));
  }

  /**
   * Render an object as a tree view
   */
  private static objectTree(obj: Record<string, any>): string {
    const entries = Object.entries(obj)
      .map(([k, v]) => `<div class="obj-row"><b>${JsonPretty.escape(k)}:</b> ${JsonPretty.formatValue(v)}</div>`)
      .join('');
    return `<div class="json-tree">${entries}</div>`;
  }

  /**
   * Try to parse a string as JSON multiple times (for nested JSON strings)
   */
  private static tryDeepParse(s: string, maxDepth: number): any {
    let out: any = s;
    for (let i = 0; i < maxDepth; i++) {
      if (typeof out !== 'string') break;
      try {
        out = JSON.parse(out);
      } catch {
        break;
      }
    }
    return out;
  }

  /**
   * Pretty-print and format MCP server JSON objects (especially issue/result lists).
   * Accepts a JSON string/object, including double-encoded JSON strings.
   */
  public static format(json: string | object): string {
    let data: any = json;

    // If it's a string, try to parse it up to 3 times (handles double-encoded strings)
    if (typeof data === 'string') {
      data = JsonPretty.tryDeepParse(data, 3);
    }

    // If still not an object/array, show as preformatted text
    if (!data || typeof data !== 'object') {
      return `<pre>${JsonPretty.escape(typeof json === 'string' ? json : String(json ?? ''))}</pre>`;
    }

    // If array of issues/objects, render a table
    if (Array.isArray(data)) {
      return JsonPretty.tableForArray(data);
    }

    // MCP/GitHub style { type: 'text', text: '...json...' }
    if (data.type === 'text' && typeof data.text === 'string') {
      const parsed = JsonPretty.tryDeepParse(data.text, 3);
      if (Array.isArray(parsed)) return JsonPretty.tableForArray(parsed);
      if (parsed && typeof parsed === 'object') return JsonPretty.objectTree(parsed);
      return `<pre>${JsonPretty.escape(data.text)}</pre>`;
    }

    // Default object view
    return JsonPretty.objectTree(data);
  }

  /**
   * Render an array of objects as a table
   */
  private static tableForArray(items: any[]): string {
    if (items.length === 0) {
      return '<div style="opacity:.7; font-style:italic;">No results.</div>';
    }

    const first = items[0] ?? {};
    const isIssues =
      typeof first === 'object' &&
      first !== null &&
      'number' in first &&
      'title' in first;

    if (isIssues) {
      return JsonPretty.issuesTable(items);
    }

    // Generic table fallback
    const commonPreferred = ['number', 'title', 'state', 'created_at', 'updated_at', 'html_url'];
    const keys = Array.from(new Set([...commonPreferred, ...Object.keys(first)])).slice(0, 8);

    const thStyle = 'style="text-align:left; padding:8px; border-bottom:1px solid var(--vscode-panel-border, #333);"';
    const tdStyle = 'style="padding:8px; border-bottom:1px solid var(--vscode-panel-border, #333); vertical-align:top;"';
    const tableStyle = 'style="width:100%; border-collapse:collapse; background:var(--vscode-sideBar-background); border:1px solid var(--vscode-panel-border, #333); border-radius:6px; overflow:hidden;"';

    const head = keys.map(k => `<th ${thStyle}>${JsonPretty.escape(k)}</th>`).join('');
    const rows = items.map(row => {
      return `<tr>${keys.map(k => {
        const v = (row as any)[k];
        if (k === 'html_url' && typeof v === 'string') {
          const url = JsonPretty.escape(v);
          return `<td ${tdStyle}><a href="${url}" target="_blank">${url}</a></td>`;
        }
        return `<td ${tdStyle}>${JsonPretty.escape(JsonPretty.valuePreview(v))}</td>`;
      }).join('')}</tr>`;
    }).join('');

    return `<div style="overflow:auto; border-radius:6px;">
      <table ${tableStyle}>
        <thead style="background:var(--vscode-editor-background, #1e1e1e);"><tr>${head}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  }

  /**
   * Render a table specifically for GitHub issues
   */
  public static issuesTable(issues: any[]): string {
    const thStyle = 'style="text-align:left; padding:10px 12px; border-bottom:1px solid var(--vscode-panel-border, #333); font-weight:600;"';
    const tdStyle = 'style="padding:10px 12px; border-bottom:1px solid var(--vscode-panel-border, #333); vertical-align:top;"';
    const tableStyle = 'style="width:100%; border-collapse:collapse; background:var(--vscode-sideBar-background); border:1px solid var(--vscode-panel-border, #333); border-radius:6px; overflow:hidden;"';

    const head = `
      <th ${thStyle} style="width:110px;">Issue<br/>Number</th>
      <th ${thStyle}>Title</th>
      <th ${thStyle}>Description</th>
      <th ${thStyle} style="width:160px;">Created At</th>
      <th ${thStyle} style="width:90px;">Status</th>
      <th ${thStyle} style="width:140px;">Author</th>
      <th ${thStyle} style="width:110px;">URL</th>
    `;

    const rows = issues.map((it) => {
      const number = it.number ?? '';
      const title = it.title ?? '';
      const body = it.body ?? it.body_text ?? '';
      const createdRaw = it.created_at ?? it.createdAt ?? '';
      const { date: createdDate, time: createdTime } = JsonPretty.formatDateTime(createdRaw);
      const status = JsonPretty.capFirst((it.state ?? it.status ?? '').toString());
      const author = (it.user && it.user.login) ? it.user.login : (it.author && it.author.login) ? it.author.login : '';
      const url = it.html_url ?? it.url ?? '';
      const titleHtml = `<div style="font-weight:600; white-space:normal;">${JsonPretty.escape(title)}</div>`;
      const bodyHtml = `<div style="white-space:normal;">${JsonPretty.escape(JsonPretty.summary(body))}</div>`;
      const createdHtml = `${JsonPretty.escape(createdDate)}${createdTime ? '<br/>' + JsonPretty.escape(createdTime) : ''}`;
      const linkHtml = url ? `<a href="${JsonPretty.escape(url)}" target="_blank">View<br/>Issue</a>` : '';

      return `<tr>
        <td ${tdStyle}>${JsonPretty.escape(String(number))}</td>
        <td ${tdStyle}>${titleHtml}</td>
        <td ${tdStyle}>${bodyHtml}</td>
        <td ${tdStyle}>${createdHtml}</td>
        <td ${tdStyle}>${JsonPretty.escape(status)}</td>
        <td ${tdStyle}>${JsonPretty.escape(String(author))}</td>
        <td ${tdStyle}>${linkHtml}</td>
      </tr>`;
    }).join('');

    return `<div style="overflow:auto; border-radius:6px;">
      <table ${tableStyle}>
        <thead style="background:var(--vscode-editor-background, #1e1e1e);"><tr>${head}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  }
}