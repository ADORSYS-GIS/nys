import * as vscode from 'vscode';
import axios from 'axios';
/**
 * Utility function to handle API errors and extract meaningful messages
 */
export function handleApiError(error: any): string {
  // Handle null or undefined
  if (!error) {
    return 'Unknown error (null or undefined)';
  }

  // Check if it's an Axios error
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const statusText = error.response?.statusText || '';
    const data = error.response?.data || {};

    // Handle common API errors with specific messages
    switch (status) {
      case 401:
        // Authentication error
        return `Authentication failed (${status}): Please check your API key in the settings.`;

      case 403:
        // Authorization error
        return `Authorization failed (${status}): Your API key doesn't have permission for this operation.`;

      case 404:
        // Not found
        return `API endpoint not found (${status}): Please check your server configuration.`;

      case 429:
        // Rate limit
        return `Rate limit exceeded (${status}): Please try again later.`;

      default:
        // Generic error with data
        const errorMessage = data.error?.message || data.message || statusText || error.message;
        return `API error (${status || 'unknown'}): ${errorMessage}`;
    }
  }

  // Handle Error objects
  if (error instanceof Error) {
    return error.message;
  }

  // Handle axios error responses (for backward compatibility)
  if (typeof error === 'object' && error.response) {
    const status = error.response.status || 'unknown status';
    let message = '';

    // Try to extract error message from response data
    if (error.response.data) {
      if (typeof error.response.data === 'string') {
        message = error.response.data;
      } else if (error.response.data.error) {
        // OpenAI style
        if (typeof error.response.data.error === 'string') {
          message = error.response.data.error;
        } else if (error.response.data.error.message) {
          message = error.response.data.error.message;
        }
      } else if (error.response.data.message) {
        // Anthropic style
        message = error.response.data.message;
      }
    }

    return message ? `API Error (${status}): ${message}` : `API Error: ${status}`;
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Handle other object errors
  if (typeof error === 'object') {
    return error.message || error.error || JSON.stringify(error);
  }

  // Fallback
  return 'Unknown error';
}
