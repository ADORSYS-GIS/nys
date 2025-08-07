import WebSocket from 'ws';
import axios from 'axios';
import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import { 
  buildJsonRpcRequest, 
  buildJsonRpcNotification, 
  buildToolCallRequest, 
  buildPromptRequest 
} from './jsonRpc';

// MCP server types
export enum McpServerType {
  Standard = 'standard', // Regular MCP server with HTTP + WebSocket
  FileSystem = 'filesystem', // MCP Filesystem server (direct WebSocket only)
  Stdio = 'stdio' // MCP server communicating over standard input/output
}

/**
 * Model Control Protocol (MCP) Client
 */
export class McpClient extends EventEmitter {
  private connection: WebSocket | null = null;
  private childProcess: ChildProcess | null = null;
  private serverUrl: string | null = null;
  private apiKey: string | null = null;
  private sessionId: string | null = null;
  private serverType: McpServerType = McpServerType.Standard;
  private buffer: string = '';

  constructor() {
    super();
  }

  /**
   * Connect to the MCP server
   * @param serverUrl URL of the MCP server
   * @param apiKey API key for authentication (optional for filesystem server)
   * @param serverType Type of MCP server to connect to (standard or filesystem)
   */
  public async connect(serverUrl: string, apiKey: string = '', serverType: McpServerType = McpServerType.Standard): Promise<void> {
    this.serverUrl = serverUrl;
    this.apiKey = apiKey;
    this.serverType = serverType;

    try {
      // If using stdio mode, start child process for MCP server
   if (this.serverType === McpServerType.Stdio) {
        console.log('Connecting to MCP server via stdio...');
        return this.connectViaStdio(serverUrl);
      }
      // If using a standard MCP server, establish session via HTTP first
      else if (this.serverType === McpServerType.Standard) {
        console.log('Connecting to standard MCP server...');
        const sessionResponse = await axios.post(
          `${this.serverUrl}/api/session`,
          { apiKey: this.apiKey },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        if (sessionResponse.status !== 200) {
          throw new Error(`Failed to create session: ${sessionResponse.statusText}`);
        }

        this.sessionId = sessionResponse.data.sessionId;

        // Now connect to the WebSocket with session
        const wsScheme = this.serverUrl.startsWith('https') ? 'wss' : 'ws';
        const baseUrl = this.serverUrl.replace(/^https?:\/\//, '');
        const wsUrl = `${wsScheme}://${baseUrl}/api/ws/${this.sessionId}`;
        this.connection = new WebSocket(wsUrl);
      }
      // If using filesystem MCP server, connect directly via WebSocket
      else if (this.serverType === McpServerType.FileSystem) {
        console.log('Connecting to MCP Filesystem server...');
        // No session needed, connect directly to WebSocket
        // Ensure URL starts with ws:// or wss://
        let wsUrl = this.serverUrl;
        if (!wsUrl.startsWith('ws://') && !wsUrl.startsWith('wss://')) {
          const wsScheme = wsUrl.startsWith('https') ? 'wss' : 'ws';
          wsUrl = `${wsScheme}://${wsUrl.replace(/^https?:\/\//, '')}`;
        }
        console.log(`Connecting to filesystem WebSocket at: ${wsUrl}`);
        this.connection = new WebSocket(wsUrl);
      }

      return new Promise((resolve, reject) => {
        if (this.serverType === McpServerType.Stdio) {
          // Already handled by connectViaStdio
          return;
        }

        if (!this.connection) {
          reject(new Error('WebSocket connection not initialized'));
          return;
        }

        this.connection.on('open', () => {
          console.log('Connected to MCP server');
          this.setupEventListeners();
          resolve();
        });

        this.connection.on('error', (err) => {
          console.error('WebSocket connection error:', err);
          reject(err);
        });
      });
    } catch (error) {
      console.error('Failed to connect to MCP server:', error);
      throw error;
    }
  }

  /**
   * Connect to MCP server via stdio
   * @param serverPath Path to the MCP server binary or command
   */
  private connectViaStdio(serverPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Parse the server path to handle command and arguments
        // Format could be: /path/to/binary [args...]
        const parts = serverPath.split(' ');
        const command = parts[0];
        const args = parts.slice(1);

        // Add stdio argument if not already present
        if (!args.includes('stdio')) {
          args.push('stdio');
        }

        console.log(`Spawning process: ${command} ${args.join(' ')}`);

        // Set up environment variables including GitHub token and API key
        const env = { ...process.env };

        // For the GitHub MCP server, we need to set GITHUB_PERSONAL_ACCESS_TOKEN
        // regardless of its format (it doesn't need to start with github_ or ghp_)
        if (command.includes('github-mcp-server') || command.includes('mcp/github-mcp-server')) {
          console.log('GitHub MCP server detected, setting GITHUB_PERSONAL_ACCESS_TOKEN');

          if (this.apiKey) {
            env['GITHUB_PERSONAL_ACCESS_TOKEN'] = this.apiKey;
            console.log('Using provided token for GitHub MCP server');
          } else {
            console.log('WARNING: No GitHub token provided');
          }
        }
        // For other API-based services
        else if (this.apiKey) {
          // Check if it looks like a GitHub token
          if (this.apiKey.startsWith('github_') || this.apiKey.startsWith('ghp_')) {
            env['GITHUB_PERSONAL_ACCESS_TOKEN'] = this.apiKey;
            console.log('Using provided API key as GitHub Personal Access Token');
          }

          // Always set API_KEY anyway
          env['API_KEY'] = this.apiKey;

          // Try to get GitHub token from env var if not already set
          if (!env['GITHUB_PERSONAL_ACCESS_TOKEN'] && process.env.GITHUB_PERSONAL_ACCESS_TOKEN) {
            env['GITHUB_PERSONAL_ACCESS_TOKEN'] = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
            console.log('Using GITHUB_PERSONAL_ACCESS_TOKEN from environment');
          }
        }

        // Spawn the child process
        this.childProcess = spawn(command, args, {
          env,
          stdio: ['pipe', 'pipe', 'pipe']
        });

        if (!this.childProcess || !this.childProcess.stdin || !this.childProcess.stdout) {
          throw new Error('Failed to start MCP server process');
        }

        // Set up stdout handler to process responses
        this.childProcess.stdout.on('data', (data: Buffer) => {
          this.handleStdioData(data);
        });

        // Handle process errors
        this.childProcess.on('error', (err: Error) => {
          console.error('MCP server process error:', err);
          reject(err);
        });

        // Handle process exit
        this.childProcess.on('exit', (code: number | null, signal: string | null) => {
          console.log(`MCP server process exited with code ${code} and signal ${signal}`);
          this.emit('disconnected');
        });

        // Handle stderr for debugging
        if (this.childProcess.stderr) {
          this.childProcess.stderr.on('data', (data: Buffer) => {
            console.log(`MCP server stderr: ${data.toString()}`);
          });
        }

        // Initialize the GitHub MCP server with JSON-RPC 2.0
        this.initializeJsonRpcServer().then(() => {
          console.log('JSON-RPC initialization complete');
          resolve();
        }).catch(error => {
          console.error('JSON-RPC initialization failed:', error);
          reject(error);
        });
      } catch (error) {
        console.error('Failed to connect via stdio:', error);
        reject(error);
      }
    });
  }

  /**
   * Handle data received from the stdio process
   * @param data Buffer data from the process stdout
   */
  private handleStdioData(data: Buffer): void {
    try {
      // Add incoming data to buffer (might receive partial JSON)
      this.buffer += data.toString();

      // Process all complete JSON objects in the buffer
      let jsonEndIndex;
      while ((jsonEndIndex = this.findJsonEnd()) !== -1) {
        const jsonStr = this.buffer.substring(0, jsonEndIndex + 1);
        this.buffer = this.buffer.substring(jsonEndIndex + 1);

        try {
          const message = JSON.parse(jsonStr);
          console.log('Received message from stdio:', JSON.stringify(message).substring(0, 200) + '...');

          // Process JSON-RPC 2.0 responses
          if (message.jsonrpc === '2.0') {
            if (message.id) {
              // This is a response to a request (has an id)
              if (message.error) {
                // Error response
                this.emit(`response:${message.id}`, { 
                  error: message.error.message || message.error.code || 'Unknown error' 
                });
              } else if (message.result !== undefined) {
                // Success response - extract the result
                let responseContent = message.result;

                // Handle different result formats based on method type
                if (typeof responseContent === 'object' && responseContent !== null) {
                  // If the response has a specific structure, extract the relevant part
                  if (responseContent.response) {
                    responseContent = responseContent.response;
                  } else if (responseContent.content) {
                    responseContent = responseContent.content;
                  }
                }

                this.emit(`response:${message.id}`, { response: responseContent });
              }
            } else {
              // This is a notification (no id) - we generally don't need to handle these
              console.log('Received notification from server:', message.method);
            }
          } else if (message.type === 'response' && message.messageId) {
            // Legacy standard MCP protocol response (non-JSON-RPC)
            this.emit(`response:${message.messageId}`, message.content);
          } else if (message.type === 'error') {
            // Legacy error format
            this.emit('error', new Error(message.content?.error || 'Unknown error'));
          }
        } catch (error) {
          console.error('Error parsing JSON from stdio:', error);
        }
      }
    } catch (error) {
      console.error('Error processing stdio data:', error);
    }
  }

  /**
   * Find the end index of a complete JSON object in the buffer
   * This handles nested JSON objects and ensures we only process complete JSON
   * @returns The end index of a complete JSON object, or -1 if no complete object exists
   */
  private findJsonEnd(): number {
    let braceCount = 0;
    let inString = false;
    let escaped = false;

    for (let i = 0; i < this.buffer.length; i++) {
      const char = this.buffer[i];

      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (char === '\\') {
          escaped = true;
        } else if (char === '"') {
          inString = false;
        }
      } else if (char === '"') {
        inString = true;
      } else if (char === '{') {
        braceCount++;
      } else if (char === '}') {
        braceCount--;
        if (braceCount === 0) {
          return i; // Found the end of a complete JSON object
        }
      }
    }

    return -1; // No complete JSON object found
  }

  /**
   * Initialize the JSON-RPC 2.0 server connection
   * Follows the GitHub MCP server initialization protocol
   */
  private async initializeJsonRpcServer(): Promise<void> {
    if (!this.childProcess || !this.childProcess.stdin) {
      throw new Error('Child process not initialized');
    }

    return new Promise((resolve, reject) => {
      // Set up a one-time listener for the initialize response
      const initId = 1; // Use a fixed ID for initialization
      this.once(`response:${initId}`, (data) => {
        if (data.error) {
          reject(new Error(data.error));
        } else {
          // Send initialized notification (no response expected)
          const notification = buildJsonRpcNotification('notifications/initialized');
          if (!this.childProcess || !this.childProcess.stdin) {
            const err = new Error('Child process or stdin is not available');
            console.error(err);
            return reject(err);
          }
          this.childProcess.stdin.write(JSON.stringify(notification) + '\n', (error) => {
            if (error) {
              console.error('Error sending initialized notification:', error);
              reject(error);
            } else {
              console.log('MCP Server initialized successfully');
              resolve();
            }
          });
        }
      });

      // Step 1: Send initialize request
      const initializeRequest = {
        jsonrpc: "2.0",
        method: "initialize",
        params: {
          protocolVersion: "2025-03-26",
          capabilities: { roots: {}, sampling: {} },
          clientInfo: { name: "vscode-mcp-client", version: "1.0.0" }
        },
        id: initId
      };

      console.log('Sending initialize request to MCP server');
      if (!this.childProcess || !this.childProcess.stdin) {
        const err = new Error('Child process or stdin is not available');
        console.error(err);
        return reject(err);
      }
      this.childProcess.stdin.write(JSON.stringify(initializeRequest) + '\n', (error) => {
        if (error) {
          console.error('Error sending initialize request:', error);
          reject(error);
        }
      });
    });
  }

  /**
   * Disconnect from the MCP server
   */
  public disconnect(): void {
    if (this.connection) {
      this.connection.close();
      this.connection = null;
    }

    if (this.childProcess) {
      // Kill the child process for stdio connection
      this.childProcess.kill();
      this.childProcess = null;
      this.buffer = '';
    }

    this.sessionId = null;
  }

  /**
   * Send a JSON-RPC request to the MCP server
   * @param request The JSON-RPC request object
   * @returns Promise resolving to the response
   */
  public async sendJsonRpcRequest(request: any): Promise<any> {
    if (!this.isConnected()) {
      throw new Error('Not connected to MCP server');
    }

    return new Promise((resolve, reject) => {
      try {
        const messageId = request.id;

        // Set up a one-time listener for this specific message ID
        this.once(`response:${messageId}`, (data) => {
          if (data.error) {
                // Return complete error information including status and message for better debugging
                const errorObject = {
                  status: data.error.code || 500,
                  message: data.error.message || data.error,
                  details: data.error.data || null
                };
                reject(errorObject);
          } else {
            resolve(data.response);
          }
        });

        // Handle stdio server type
        if (this.serverType === McpServerType.Stdio && this.childProcess && this.childProcess.stdin) {
          console.log("Sending JSON-RPC request via stdio:", request);
          const jsonString = JSON.stringify(request) + '\n';
          this.childProcess.stdin.write(jsonString, (error) => {
            if (error) {
              console.error('Error writing to stdin:', error);
              reject(error);
            }
          });
          return; // Return early, we've sent the request via stdio
        }

        // Handle WebSocket-based server types
        if (!this.connection) {
          reject(new Error('WebSocket connection not established'));
          return;
        }

        console.log("Sending WebSocket request:", request);
        this.connection.send(JSON.stringify(request));
      } catch (error) {
        console.error('Error sending JSON-RPC request:', error);
        reject(error);
      }
    });
  }

  /**
   * Check if connected to the MCP server
   */
  public isConnected(): boolean {
    if (this.serverType === McpServerType.Stdio) {
      return this.childProcess !== null && !this.childProcess.killed;
    }
    return this.connection !== null && this.connection.readyState === WebSocket.OPEN;
  }

  /**
   * Execute a prompt against the MCP server
   */
  public async executePrompt(userPrompt: string, context: string = ''): Promise<string> {
    if (!this.isConnected()) {
      throw new Error('Not connected to MCP server');
    }

    return new Promise((resolve, reject) => {
      try {
        // Create a message ID for this request
        const messageId = `msg_${Date.now()}`;

        // Set up a one-time listener for this specific message ID
        this.once(`response:${messageId}`, (data) => {
          if (data.error) {
            reject(new Error(data.error));
          } else {
            resolve(data.response);
          }
        });

        // Handle stdio server type
        if (this.serverType === McpServerType.Stdio && this.childProcess && this.childProcess.stdin) {
          // Create a JSON-RPC 2.0 prompt request
          const promptRequest = buildPromptRequest(userPrompt, context);

          // Override the ID to use our custom messageId for tracking
          promptRequest.id = messageId;

          console.log("Sending JSON-RPC prompt request via stdio:", promptRequest);
          const jsonString = JSON.stringify(promptRequest) + '\n';
          this.childProcess.stdin.write(jsonString, (error) => {
            if (error) {
              console.error('Error writing to stdin:', error);
              reject(error);
            }
          });
          return; // Return early, we've sent the request via stdio
        }

        // Handle WebSocket-based server types
        if (!this.connection) {
          reject(new Error('WebSocket connection not established'));
          return;
        }

        let message;
        if (this.serverType === McpServerType.FileSystem) {
          // Filesystem MCP format - use JSON-RPC 2.0
          message = {
            jsonrpc: "2.0",
            id: messageId,
            method: 'generate',
            params: {
              prompt: userPrompt,
              context: context || undefined
            }
          };
        } else {
          // Standard MCP format
          message = {
            type: 'prompt',
            messageId,
            content: {
              prompt: userPrompt,
              context
            }
          };
        }

        console.log("Sending WebSocket request:", message);
        this.connection.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error executing prompt:', error);
        reject(error);
      }
    });
  }

  /**
   * Set up WebSocket event listeners
   */
  private setupEventListeners(): void {
    if (!this.connection) return;

    this.connection.on('message', (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('Received message:', JSON.stringify(message).substring(0, 200) + '...');

        if (this.serverType === McpServerType.FileSystem || message.jsonrpc === '2.0') {
          // Handle JSON-RPC 2.0 responses (both filesystem and github MCP servers)
          if (message.id) {
            if (message.error) {
              // Error response
              this.emit(`response:${message.id}`, { 
                error: message.error.message || message.error.code || 'Unknown error' 
              });
            } else if (message.result !== undefined) {
              // Success response - extract the result
              let responseContent = message.result;

              // Handle different result formats based on method type
              if (typeof responseContent === 'object' && responseContent !== null) {
                // If the response has a specific structure, extract the relevant part
                if (responseContent.response) {
                  responseContent = responseContent.response;
                } else if (responseContent.content) {
                  responseContent = responseContent.content;
                }
              }

              this.emit(`response:${message.id}`, { response: responseContent });
            }
          }
        } else {
          // Handle standard MCP protocol responses (legacy format)
          if (message.type === 'response' && message.messageId) {
            this.emit(`response:${message.messageId}`, message.content);
          } else if (message.type === 'error') {
            this.emit('error', new Error(message.content.error));
          }
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });

    this.connection.on('close', () => {
      console.log('Disconnected from MCP server');
      this.emit('disconnected');
    });
  }
}
