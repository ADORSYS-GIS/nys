// Custom type definitions to augment standard types
// Custom type definitions to augment standard types

// Augment existing interfaces to allow for system messages
declare module 'vscode' {
  interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
  }
}

// Allow for looser type checking in cases where we need it
declare namespace ChatViewTypes {
  interface ChatView {
    addMessage(role: 'user' | 'assistant' | 'system', content: string): void;
    isUsingLlmParser?(): boolean;
    isContextAware?(): boolean;
    isCodeSearchEnabled?(): boolean;
  }
}
// Augment existing interfaces to allow for system messages
declare module 'vscode' {
  interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
  }
}

// Allow for looser type checking in cases where we need it
declare namespace ChatViewTypes {
  interface ChatView {
    addMessage(role: 'user' | 'assistant' | 'system', content: string): void;
    isUsingLlmParser?(): boolean;
  }
}
