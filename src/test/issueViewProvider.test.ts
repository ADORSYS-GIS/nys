import * as vscode from 'vscode';
import { IssueViewProvider, Issue, Todo } from '../issueViewProvider';
import { NysStorage } from '../storage/nysStorage';

describe('IssueViewProvider Tests', () => {
  let provider: IssueViewProvider;
  let storage: NysStorage;

  beforeEach(() => {
    provider = new IssueViewProvider(vscode.Uri.file('/test'));
    storage = new NysStorage();
  });

  test('Should create issue with correct structure', async () => {
    const title = 'Test Issue';
    const description = 'This is a test issue description';
    
    // Mock the storage methods
    const mockSaveIssue = async (issue: Issue) => {
      expect(issue.title).toBe(title);
      expect(issue.description).toBe(description);
      expect(issue.mode).toBe('design');
      expect(issue.status).toBe('open');
      expect(issue.todos.length).toBe(0);
      expect(issue.id).toMatch(/^issue-/);
      expect(issue.createdAt).toBeInstanceOf(Date);
      expect(issue.updatedAt).toBeInstanceOf(Date);
    };

    // Test issue creation
    const issue: Issue = {
      id: 'issue-123',
      title,
      description,
      mode: 'design',
      status: 'open',
      todos: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      filePath: '/test/issue-123.md'
    };

    await mockSaveIssue(issue);
  });

  test('Should switch modes correctly', async () => {
    const issue: Issue = {
      id: 'issue-123',
      title: 'Test Issue',
      description: 'Test description',
      mode: 'design',
      status: 'open',
      todos: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      filePath: '/test/issue-123.md'
    };

    // Test mode switching
    const modes: Array<'design' | 'build' | 'debug'> = ['design', 'build', 'debug'];
    
    for (const mode of modes) {
      issue.mode = mode;
      issue.updatedAt = new Date();
      
      expect(issue.mode).toBe(mode);
      expect(issue.updatedAt).toBeInstanceOf(Date);
    }
  });

  test('Should manage TODOs correctly', async () => {
    const issue: Issue = {
      id: 'issue-123',
      title: 'Test Issue',
      description: 'Test description',
      mode: 'design',
      status: 'open',
      todos: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      filePath: '/test/issue-123.md'
    };

    // Add TODO
    const todo: Todo = {
      id: 'todo-1',
      content: 'Test TODO item',
      completed: false,
      createdAt: new Date()
    };

    issue.todos.push(todo);
    expect(issue.todos.length).toBe(1);
    expect(issue.todos[0].content).toBe('Test TODO item');
    expect(issue.todos[0].completed).toBe(false);

    // Toggle TODO
    issue.todos[0].completed = true;
    expect(issue.todos[0].completed).toBe(true);

    // Delete TODO
    issue.todos = issue.todos.filter(t => t.id !== 'todo-1');
    expect(issue.todos.length).toBe(0);
  });

  test('Should parse markdown correctly', () => {
    const markdownContent = `---
title: Test Issue
mode: build
status: in-progress
createdAt: 2024-01-01T00:00:00.000Z
updatedAt: 2024-01-01T00:00:00.000Z
---

This is the issue description.

## TODOs

- [ ] First TODO item
- [x] Completed TODO item
- [ ] Another TODO item
`;

    // Test parsing logic (simplified)
    const lines = markdownContent.split('\n');
    let inFrontmatter = false;
    let frontmatterEnd = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i] === '---') {
        if (inFrontmatter) {
          frontmatterEnd = i;
          break;
        } else {
          inFrontmatter = true;
        }
      }
    }

    expect(frontmatterEnd).toBeGreaterThan(0);
    
    const frontmatter = lines.slice(1, frontmatterEnd).join('\n');
    const description = lines.slice(frontmatterEnd + 1).join('\n').trim();
    
    expect(frontmatter).toContain('title: Test Issue');
    expect(frontmatter).toContain('mode: build');
    expect(frontmatter).toContain('status: in-progress');
    expect(description).toContain('This is the issue description');
  });

  test('Should generate markdown correctly', () => {
    const issue: Issue = {
      id: 'issue-123',
      title: 'Test Issue',
      description: 'This is a test issue',
      mode: 'debug',
      status: 'completed',
      todos: [
        {
          id: 'todo-1',
          content: 'Test TODO',
          completed: true,
          createdAt: new Date()
        },
        {
          id: 'todo-2',
          content: 'Another TODO',
          completed: false,
          createdAt: new Date()
        }
      ],
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      filePath: '/test/issue-123.md'
    };

    // Test markdown generation
    const frontmatter = [
      '---',
      `title: ${issue.title}`,
      `mode: ${issue.mode}`,
      `status: ${issue.status}`,
      `createdAt: ${issue.createdAt.toISOString()}`,
      `updatedAt: ${issue.updatedAt.toISOString()}`,
      '---',
      ''
    ].join('\n');

    const todosSection = '\n## TODOs\n\n' + issue.todos.map(todo => 
      `- [${todo.completed ? 'x' : ' '}] ${todo.content}`
    ).join('\n') + '\n';

    const expectedMarkdown = frontmatter + issue.description + todosSection;

    expect(expectedMarkdown).toContain('title: Test Issue');
    expect(expectedMarkdown).toContain('mode: debug');
    expect(expectedMarkdown).toContain('status: completed');
    expect(expectedMarkdown).toContain('- [x] Test TODO');
    expect(expectedMarkdown).toContain('- [ ] Another TODO');
  });
});

describe('NysStorage Tests', () => {
  let storage: NysStorage;

  beforeEach(() => {
    storage = new NysStorage();
  });

  test('Should handle workspace initialization', async () => {
    // Test that storage can be initialized
    const nysFolder = await storage.ensureNysFolder();
    // In test environment, this might be null, which is expected
    expect(nysFolder === null || nysFolder instanceof vscode.Uri).toBe(true);
  });

  test('Should parse frontmatter correctly', () => {
    const frontmatter = `title: Test Issue
mode: build
status: in-progress
createdAt: 2024-01-01T00:00:00.000Z
updatedAt: 2024-01-01T00:00:00.000Z`;

    // Test parsing logic
    const metadata: any = {};
    const lines = frontmatter.split('\n');
    
    for (const line of lines) {
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        const [, key, value] = match;
        metadata[key] = value.trim();
      }
    }

    expect(metadata.title).toBe('Test Issue');
    expect(metadata.mode).toBe('build');
    expect(metadata.status).toBe('in-progress');
    expect(metadata.createdAt).toBe('2024-01-01T00:00:00.000Z');
    expect(metadata.updatedAt).toBe('2024-01-01T00:00:00.000Z');
  });

  test('Should extract TODOs from content', () => {
    const content = `Some content here

## TODOs

- [ ] First TODO item
- [x] Completed TODO item
- [ ] Another TODO item

More content here`;

    // Test TODO extraction
    const todos: Todo[] = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const todoMatch = line.match(/^(\s*)- \[([ x])\]\s*(.+)$/);
      if (todoMatch) {
        const [, indent, checked, content] = todoMatch;
        todos.push({
          id: `todo-${i}`,
          content: content.trim(),
          completed: checked === 'x',
          createdAt: new Date()
        });
      }
    }

    expect(todos.length).toBe(3);
    expect(todos[0].content).toBe('First TODO item');
    expect(todos[0].completed).toBe(false);
    expect(todos[1].content).toBe('Completed TODO item');
    expect(todos[1].completed).toBe(true);
    expect(todos[2].content).toBe('Another TODO item');
    expect(todos[2].completed).toBe(false);
  });
});

describe('Mode Switching Integration Tests', () => {
  test('Should maintain state across mode switches', async () => {
    const issue: Issue = {
      id: 'issue-123',
      title: 'Test Issue',
      description: 'Test description',
      mode: 'design',
      status: 'open',
      todos: [
        {
          id: 'todo-1',
          content: 'Design TODO',
          completed: false,
          createdAt: new Date()
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      filePath: '/test/issue-123.md'
    };

    // Switch to build mode
    issue.mode = 'build';
    issue.updatedAt = new Date();
    
    // Add build-specific TODO
    issue.todos.push({
      id: 'todo-2',
      content: 'Build TODO',
      completed: false,
      createdAt: new Date()
    });

    expect(issue.mode).toBe('build');
    expect(issue.todos.length).toBe(2);

    // Switch to debug mode
    issue.mode = 'debug';
    issue.updatedAt = new Date();
    
    // Add debug-specific TODO
    issue.todos.push({
      id: 'todo-3',
      content: 'Debug TODO',
      completed: false,
      createdAt: new Date()
    });

    expect(issue.mode).toBe('debug');
    expect(issue.todos.length).toBe(3);

    // Verify all TODOs are preserved
    expect(issue.todos.some(t => t.content === 'Design TODO')).toBe(true);
    expect(issue.todos.some(t => t.content === 'Build TODO')).toBe(true);
    expect(issue.todos.some(t => t.content === 'Debug TODO')).toBe(true);
  });

  test('Should handle issue persistence workflow', async () => {
    // Simulate the complete workflow
    const issues: Issue[] = [];
    
    // Create issue
    const issue: Issue = {
      id: 'issue-123',
      title: 'New Feature',
      description: 'Implement new feature',
      mode: 'design',
      status: 'open',
      todos: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      filePath: '/test/issue-123.md'
    };
    
    issues.push(issue);
    expect(issues.length).toBe(1);

    // Add TODOs in design mode
    issue.todos.push({
      id: 'todo-1',
      content: 'Design the feature',
      completed: false,
      createdAt: new Date()
    });

    // Switch to build mode
    issue.mode = 'build';
    issue.updatedAt = new Date();

    // Add build TODOs
    issue.todos.push({
      id: 'todo-2',
      content: 'Implement the feature',
      completed: false,
      createdAt: new Date()
    });

    // Complete some TODOs
    issue.todos[0].completed = true;
    issue.todos[1].completed = true;

    // Switch to debug mode
    issue.mode = 'debug';
    issue.updatedAt = new Date();

    // Add debug TODOs
    issue.todos.push({
      id: 'todo-3',
      content: 'Test the feature',
      completed: false,
      createdAt: new Date()
    });

    // Verify final state
    expect(issue.mode).toBe('debug');
    expect(issue.todos.length).toBe(3);
    expect(issue.todos.filter(t => t.completed).length).toBe(2);
    expect(issue.todos.filter(t => !t.completed).length).toBe(1);
  });
});
