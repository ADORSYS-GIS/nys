## Security & Privacy
- No telemetry is collected by this extension.
- Network access is limited to the endpoints you configure (MCP server, optional Embedding MCP, Vector MCP, or Milvus).
- Credentials:
  - Standard HTTP/HTTPS: If provided, an Authorization: Bearer <token> header is used for MCP requests.
  - Stdio mode: Tokens are forwarded to the MCP binary via environment variables (GITHUB_PERSONAL_ACCESS_TOKEN, GITHUB_TOKEN, API_KEY) for compatibility.
  - Tokens are only persisted if you explicitly save them in VS Code settings.
- Tool discovery is cached in memory for the session after connecting; there is no periodic background refresh.
- Logs may include masked identifiers for debugging; avoid sharing logs that could contain sensitive project details.
