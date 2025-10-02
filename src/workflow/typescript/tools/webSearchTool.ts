/**
 * TypeScript Web Search Tool
 * 
 * A web search tool for the TypeScript workflow system.
 */

import { BaseTool } from '../baseTool';
import { ToolInput, ToolOutput } from '../types';
import * as https from 'https';
import * as http from 'http';

export class WebSearchTool extends BaseTool {
    constructor() {
        super(
            'web_search',
            'Search the web for information',
            {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: 'Search query to execute'
                    },
                    maxResults: {
                        type: 'integer',
                        description: 'Maximum number of results to return (default: 5)',
                        default: 5,
                        minimum: 1,
                        maximum: 20
                    }
                },
                required: ['query']
            },
            {
                category: 'search',
                tags: ['web', 'search', 'information']
            }
        );
    }

    async execute(input: ToolInput): Promise<ToolOutput> {
        try {
            const query = input.query as string;
            const maxResults = (input.maxResults as number) || 5;
            
            if (!query || typeof query !== 'string') {
                return {
                    success: false,
                    result: null,
                    error: 'Query must be a non-empty string',
                    metadata: {}
                };
            }

            if (!Number.isInteger(maxResults) || maxResults < 1 || maxResults > 20) {
                return {
                    success: false,
                    result: null,
                    error: 'maxResults must be an integer between 1 and 20',
                    metadata: {}
                };
            }

            // Perform the search
            const results = await this.performSearch(query, maxResults);
            
            return {
                success: true,
                result: results,
                metadata: {
                    query: query,
                    maxResults: maxResults,
                    resultCount: results.length
                }
            };
            
        } catch (error) {
            return {
                success: false,
                result: null,
                error: `Search failed: ${error instanceof Error ? error.message : String(error)}`,
                metadata: {}
            };
        }
    }

    private async performSearch(query: string, maxResults: number): Promise<any[]> {
        // Mock search results for demonstration
        // In production, you would integrate with a real search API
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const mockResults = [
            {
                title: `Search Result 1 for "${query}"`,
                url: 'https://example.com/result1',
                snippet: `This is a mock search result for the query "${query}". In a real implementation, this would contain actual search results from a search engine API.`,
                rank: 1
            },
            {
                title: `Search Result 2 for "${query}"`,
                url: 'https://example.com/result2',
                snippet: `Another mock result for "${query}". This demonstrates how search results would be structured in the actual implementation.`,
                rank: 2
            },
            {
                title: `Search Result 3 for "${query}"`,
                url: 'https://example.com/result3',
                snippet: `Third mock result for "${query}". Real search APIs would provide more detailed and relevant results.`,
                rank: 3
            }
        ];
        
        // Return only the requested number of results
        return mockResults.slice(0, maxResults);
    }

    private async makeHttpRequest(url: string, options: any): Promise<string> {
        return new Promise((resolve, reject) => {
            const protocol = url.startsWith('https:') ? https : http;
            
            const req = protocol.request(url, options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    resolve(data);
                });
            });
            
            req.on('error', (error) => {
                reject(error);
            });
            
            req.end();
        });
    }

    getExamples(): Record<string, string> {
        return {
            general_search: 'latest AI developments 2024',
            technical_search: 'Python async programming best practices',
            news_search: 'recent developments in machine learning',
            tutorial_search: 'how to use LangGraph for workflow automation',
            comparison_search: 'LangChain vs LangGraph comparison'
        };
    }
}
