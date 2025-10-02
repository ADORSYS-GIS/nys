/**
 * Code Generation Node
 * 
 * This node generates code based on requirements in build mode.
 */

import { BaseNode } from './baseNode';
import { WorkflowState, WorkflowStatus, NodeType } from '../types';

export class CodeGenerationNode extends BaseNode {
    constructor(nodeId: string = 'code_generation') {
        super(nodeId, NodeType.ASSISTANT, 'Generate code from requirements');
    }

    async execute(state: WorkflowState): Promise<WorkflowState> {
        const startTime = Date.now();

        try {
            // Update state
            state.currentNode = this.nodeId;
            state.executionPath.push(this.nodeId);
            state.updatedAt = new Date();

            // Get requirements from context
            const requirements = state.context.requirements;
            
            if (!requirements) {
                throw new Error('No requirements found for code generation');
            }

            // Generate code based on requirements
            const generatedCode = await this.generateCodeFromRequirements(requirements);
            
            // Update state with generated code
            state.context.generatedCode = generatedCode;
            state.context.nextAction = 'write_code';

            // Add assistant response
            state.messages.push({
                role: 'assistant',
                content: `I've generated the code for your project. Created ${Object.keys(generatedCode).length} files including the main application structure, components, and configuration files.`
            });

            const result = this.createNodeResult(
                true,
                {
                    generatedCode: generatedCode,
                    nextAction: 'write_code'
                },
                undefined,
                Date.now() - startTime
            );

            state.intermediateResults[this.nodeId] = result;

            return state;

        } catch (error) {
            state.error = error instanceof Error ? error.message : String(error);
            state.status = WorkflowStatus.FAILED;

            const result = this.createNodeResult(
                false,
                {},
                state.error,
                Date.now() - startTime
            );

            state.intermediateResults[this.nodeId] = result;
            return state;
        }
    }

    private async generateCodeFromRequirements(requirements: any): Promise<Record<string, string>> {
        // Simulate code generation - in a real implementation, this would use LLM
        await new Promise(resolve => setTimeout(resolve, 200));

        const generatedCode: Record<string, string> = {};

        // Generate package.json
        generatedCode['package.json'] = this.generatePackageJson(requirements);

        // Generate main application file
        generatedCode['src/index.ts'] = this.generateMainFile(requirements);

        // Generate configuration files
        generatedCode['tsconfig.json'] = this.generateTsConfig();
        generatedCode['README.md'] = this.generateReadme(requirements);

        // Generate additional files based on requirements
        if (requirements.features.includes('User interface')) {
            generatedCode['src/components/App.tsx'] = this.generateAppComponent(requirements);
        }

        if (requirements.features.includes('API endpoints')) {
            generatedCode['src/routes/api.ts'] = this.generateApiRoutes(requirements);
        }

        if (requirements.features.includes('Database integration')) {
            generatedCode['src/database/connection.ts'] = this.generateDatabaseConnection(requirements);
        }

        return generatedCode;
    }

    private generatePackageJson(requirements: any): string {
        const dependencies = ['express', 'cors', 'helmet'];
        const devDependencies = ['typescript', '@types/node', '@types/express', 'ts-node', 'nodemon'];

        if (requirements.features.includes('User interface')) {
            dependencies.push('react', 'react-dom');
            devDependencies.push('@types/react', '@types/react-dom', 'webpack', 'webpack-cli');
        }

        if (requirements.features.includes('Database integration')) {
            dependencies.push('sqlite3');
            devDependencies.push('@types/sqlite3');
        }

        return JSON.stringify({
            name: requirements.projectName.toLowerCase().replace(/\s+/g, '-'),
            version: '1.0.0',
            description: requirements.description,
            main: 'dist/index.js',
            scripts: {
                build: 'tsc',
                start: 'node dist/index.js',
                dev: 'nodemon src/index.ts',
                test: 'echo "Error: no test specified" && exit 1'
            },
            dependencies: dependencies.reduce((acc, dep) => ({ ...acc, [dep]: 'latest' }), {}),
            devDependencies: devDependencies.reduce((acc, dep) => ({ ...acc, [dep]: 'latest' }), {}),
            keywords: requirements.technologies,
            author: 'Generated by Nys Workflow',
            license: 'MIT'
        }, null, 2);
    }

    private generateMainFile(requirements: any): string {
        return `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to ${requirements.projectName}',
        version: '1.0.0',
        status: 'running'
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(\`🚀 ${requirements.projectName} server running on port \${PORT}\`);
    console.log(\`📝 Environment: \${process.env.NODE_ENV || 'development'}\`);
});

export default app;`;
    }

    private generateTsConfig(): string {
        return JSON.stringify({
            compilerOptions: {
                target: 'ES2020',
                module: 'commonjs',
                lib: ['ES2020'],
                outDir: './dist',
                rootDir: './src',
                strict: true,
                esModuleInterop: true,
                skipLibCheck: true,
                forceConsistentCasingInFileNames: true,
                resolveJsonModule: true,
                declaration: true,
                declarationMap: true,
                sourceMap: true
            },
            include: ['src/**/*'],
            exclude: ['node_modules', 'dist']
        }, null, 2);
    }

    private generateReadme(requirements: any): string {
        return `# ${requirements.projectName}

${requirements.description}

## Features

${requirements.features.map((feature: string) => `- ${feature}`).join('\n')}

## Technology Stack

${requirements.technologies.map((tech: string) => `- ${tech}`).join('\n')}

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

\`\`\`bash
npm install
\`\`\`

### Development

\`\`\`bash
npm run dev
\`\`\`

### Production

\`\`\`bash
npm run build
npm start
\`\`\`

## Project Structure

\`\`\`
src/
├── index.ts          # Main application entry point
├── components/       # React components (if applicable)
├── routes/          # API routes
├── database/        # Database connection and models
└── utils/           # Utility functions
\`\`\`

## API Endpoints

- \`GET /\` - Welcome message
- \`GET /health\` - Health check

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License

---

*Generated by Nys Workflow System*`;
    }

    private generateAppComponent(requirements: any): string {
        return `import React from 'react';

interface AppProps {
    title?: string;
}

const App: React.FC<AppProps> = ({ title = '${requirements.projectName}' }) => {
    return (
        <div className="app">
            <header className="app-header">
                <h1>{title}</h1>
                <p>Welcome to your ${requirements.description.toLowerCase()}</p>
            </header>
            
            <main className="app-main">
                <div className="features">
                    <h2>Features</h2>
                    <ul>
                        ${requirements.features.map((feature: string) => `<li key="${feature}">${feature}</li>`).join('\n                        ')}
                    </ul>
                </div>
                
                <div className="tech-stack">
                    <h2>Technology Stack</h2>
                    <ul>
                        ${requirements.technologies.map((tech: string) => `<li key="${tech}">${tech}</li>`).join('\n                        ')}
                    </ul>
                </div>
            </main>
        </div>
    );
};

export default App;`;
    }

    private generateApiRoutes(requirements: any): string {
        return `import { Router, Request, Response } from 'express';

const router = Router();

// API routes for ${requirements.projectName}

router.get('/status', (req: Request, res: Response) => {
    res.json({
        status: 'active',
        service: '${requirements.projectName}',
        timestamp: new Date().toISOString()
    });
});

// Add more API routes based on requirements
${requirements.features.map((feature: string) => {
    const routeName = feature.toLowerCase().replace(/\s+/g, '-');
    return `
router.get('/${routeName}', (req: Request, res: Response) => {
    res.json({
        message: '${feature} endpoint',
        data: []
    });
});`;
}).join('')}

export default router;`;
    }

    private generateDatabaseConnection(_requirements: any): string {
        return `import sqlite3 from 'sqlite3';
import { promisify } from 'util';

class DatabaseConnection {
    private db: sqlite3.Database;

    constructor(dbPath: string = './database.sqlite') {
        this.db = new sqlite3.Database(dbPath);
    }

    // Promisify database methods
    private run = promisify(this.db.run.bind(this.db));
    private get = promisify(this.db.get.bind(this.db));
    private all = promisify(this.db.all.bind(this.db));

    async initialize(): Promise<void> {
        // Create tables based on requirements
        await this.createTables();
        console.log('✅ Database initialized successfully');
    }

    private async createTables(): Promise<void> {
        // Example table creation - customize based on requirements
        const createUsersTable = \`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        \`;

        await this.run(createUsersTable);
    }

    async close(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
}

export default DatabaseConnection;`;
    }
}
