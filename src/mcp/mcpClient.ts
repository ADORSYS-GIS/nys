import * as WebSocket from 'ws';
import axios from 'axios';
import { EventEmitter } from 'events';
import * as vscode from 'vscode';

/**
 * Model Control Protocol (MCP) Client
 */
export class McpClient extends EventEmitter {
  private connection: WebSocket | null = null;
  private serverUrl: string | null = null;
  private apiKey: string | null = null;
  private sessionId: string | null = null;

  constructor() {
    super();
  }

  /**
   * Connect to the MCP server
   */
  public async connect(serverUrl: string, apiKey: string): Promise<void> {
    this.serverUrl = serverUrl;
    this.apiKey = apiKey;

    try {
      // First, establish a session with the MCP server
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

      // Now connect to the WebSocket
      const wsUrl = `${this.serverUrl.replace('http', 'ws')}/api/ws/${this.sessionId}`;
      this.connection = new WebSocket(wsUrl);

      return new Promise((resolve, reject) => {
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
   * Disconnect from the MCP server
   */
  public disconnect(): void {
    if (this.connection) {
      this.connection.close();
      this.connection = null;
    }
    this.sessionId = null;
  }

  /**
   * Check if connected to the MCP server
   */
  public isConnected(): boolean {
    return this.connection !== null && this.connection.readyState === WebSocket.OPEN;
  }

  /**
   * Execute a prompt against the MCP server
   */
  public async executePrompt(prompt: string, context: string = ''): Promise<string> {
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

        // Send the prompt to the server
        const message = {
          type: 'prompt',
          messageId,
          content: {
            prompt,
            context
          }
        };

        if (this.connection) {
          this.connection.send(JSON.stringify(message));
        } else {
          reject(new Error('Connection not established'));
        }
      } catch (error) {
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

        if (message.type === 'response' && message.messageId) {
          this.emit(`response:${message.messageId}`, message.content);
        } else if (message.type === 'error') {
          this.emit('error', new Error(message.content.error));
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
