## Troubleshooting
- Not connected? Ensure serverUrl is correct. For stdio, verify the binary path and that your token is valid.
- GitHub MCP stdio: In stdio mode the extension forwards the token via GITHUB_PERSONAL_ACCESS_TOKEN/GITHUB_TOKEN and API_KEY env vars.
- Tool list empty? Connect first; tools are fetched on connect and cached for the session.
- Semantic selection requires embedding/vector config (Vector MCP) or Milvus connectivity.
