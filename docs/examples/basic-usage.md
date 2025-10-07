# Basic Usage Examples

Learn how to use the SPARC Workflow Engine with practical examples.

## 🚀 Getting Started Example

### Simple Authentication System

Let's create a complete user authentication system using the SPARC workflow.

#### Step 1: Create and Initialize

```typescript
// Initialize the SPARC Workflow Engine
const engine = new SPARCWorkflowEngine(workspaceRoot);

// Create a new issue
const issueId = 'auth-system-001';
```

#### Step 2: Design Phase - Specification

```typescript
// Start with specification phase
let state = await engine.processIssue(
  issueId, 
  'design', 
  'Create a user authentication system with secure login, registration, and JWT token management'
);

console.log(`Phase: ${state.currentPhase}`); // "pseudocode"
console.log(`Progress: ${state.progress}%`); // 25%
console.log(`Artifacts: ${Object.keys(state.artifacts)}`); // ["requirements"]
```

**Generated requirements.md:**
```markdown
# Requirements Specification

## User Input
Create a user authentication system with secure login, registration, and JWT token management

## Extracted Requirements
- Core functionality: User registration, login, logout, JWT token management
- Technical constraints: Secure password hashing, token expiration
- Performance requirements: < 200ms response time for authentication
- Integration points: REST API endpoints, database integration

## Acceptance Criteria
- [ ] User can register with email and password
- [ ] User can login and receive JWT token
- [ ] User can logout and invalidate token
- [ ] Password is securely hashed
- [ ] JWT tokens have proper expiration
```

#### Step 3: Design Phase - Pseudocode

```typescript
// Continue to pseudocode phase
state = await engine.processIssue(
  issueId, 
  'design', 
  'Add password hashing with bcrypt and JWT token generation'
);

console.log(`Phase: ${state.currentPhase}`); // "architecture"
console.log(`Progress: ${state.progress}%`); // 50%
console.log(`Artifacts: ${Object.keys(state.artifacts)}`); // ["requirements", "pseudocode"]
```

**Generated pseudocode.md:**
```markdown
# Pseudocode

## Algorithm Overview
Based on requirements analysis, here's the high-level algorithm:

```
BEGIN
  INITIALIZE auth service with bcrypt and JWT
  FOR each authentication request DO
    IF request type = "register" THEN
      VALIDATE email and password
      HASH password with bcrypt
      STORE user in database
      GENERATE JWT token
      RETURN success with token
    ELSE IF request type = "login" THEN
      VALIDATE credentials
      IF credentials valid THEN
        GENERATE JWT token
        RETURN success with token
      ELSE
        RETURN authentication error
      END IF
    ELSE IF request type = "logout" THEN
      INVALIDATE JWT token
      RETURN success
    END IF
  END FOR
END
```

## Key Functions
- validateCredentials(): Credential validation
- hashPassword(): Password hashing with bcrypt
- generateJWT(): JWT token generation
- invalidateToken(): Token invalidation
```

#### Step 4: Design Phase - Architecture

```typescript
// Continue to architecture phase
state = await engine.processIssue(
  issueId, 
  'design', 
  'Design Express.js API with TypeScript, PostgreSQL database, and Redis for session management'
);

console.log(`Phase: ${state.currentPhase}`); // "refinement"
console.log(`Progress: ${state.progress}%`); // 75%
console.log(`Artifacts: ${Object.keys(state.artifacts)}`); // ["requirements", "pseudocode", "architecture", "guidelines"]
```

**Generated architecture.md:**
```markdown
# System Architecture

## Overview
High-level system design for user authentication with Express.js, TypeScript, PostgreSQL, and Redis.

## Components
- **AuthController**: Handle HTTP requests for authentication
- **AuthService**: Business logic for authentication
- **UserRepository**: Data access layer for user operations
- **JWTService**: JWT token management
- **PasswordService**: Password hashing and validation
- **RedisService**: Session and token storage

## Dependencies
- Framework: Express.js with TypeScript
- Database: PostgreSQL for user data
- Cache: Redis for session management
- Security: bcrypt for password hashing, jsonwebtoken for JWT

## Data Flow
1. Request → AuthController
2. AuthController → AuthService
3. AuthService → UserRepository (database operations)
4. AuthService → PasswordService (password validation)
5. AuthService → JWTService (token generation)
6. AuthService → RedisService (session storage)
7. Response ← AuthController
```

#### Step 5: Design Phase - Refinement

```typescript
// Finalize the design
state = await engine.processIssue(
  issueId, 
  'design', 
  'Add rate limiting, input validation, and comprehensive error handling'
);

console.log(`Phase: ${state.currentPhase}`); // "completion"
console.log(`Progress: ${state.progress}%`); // 100%
console.log(`Design Complete: ${state.currentPhase === 'completion'}`); // true
```

#### Step 6: Build Phase - Implementation

```typescript
// Switch to build mode
state = await engine.processIssue(
  issueId, 
  'build', 
  'Generate complete Express.js implementation with TypeScript, including all controllers, services, and configuration files'
);

console.log(`Build Complete: ${state.artifacts.implementation ? 'Yes' : 'No'}`);
console.log(`Tests Generated: ${state.artifacts.tests ? 'Yes' : 'No'}`);
```

**Generated implementation.md:**
```markdown
# Implementation

## Generated Code Structure
Based on the design artifacts, here's the implementation:

```typescript
// auth.controller.ts
import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

export class AuthController {
  constructor(private authService: AuthService) {}

  async register(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await this.authService.register(email, password);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);
      res.json(result);
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  }

  async logout(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      await this.authService.logout(token);
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}
```

## Configuration Files
- package.json: Dependencies and scripts
- tsconfig.json: TypeScript configuration
- .env: Environment variables
- docker-compose.yml: Development environment
```

#### Step 7: Debug Phase - Analysis

```typescript
// Switch to debug mode
state = await engine.processIssue(
  issueId, 
  'debug', 
  'Analyze the authentication system for security vulnerabilities and performance issues'
);

console.log(`Debug Analysis: ${state.artifacts.notes ? 'Completed' : 'Not completed'}`);
```

**Generated notes.md:**
```markdown
# Debug Notes

[2024-01-15T10:30:00Z] Debug Analysis:
## Debug Analysis

**Issue**: Analyze the authentication system for security vulnerabilities and performance issues

**Analysis**:
- Code quality: Good separation of concerns, proper error handling
- Performance: Database queries could be optimized with indexing
- Error handling: Comprehensive error responses implemented
- Security: JWT implementation looks secure, password hashing with bcrypt

**Recommendations**:
- Add rate limiting middleware to prevent brute force attacks
- Implement input validation middleware
- Add database indexes for email and user_id fields
- Consider adding refresh token mechanism
- Add comprehensive logging for security events

**Status**: Ready for fixes
*Generated by SPARC Workflow Engine - Debug Phase*
```

## 🔄 Complete Workflow Example

### E-commerce API Development

Here's a complete example of developing an e-commerce API:

```typescript
async function developEcommerceAPI() {
  const engine = new SPARCWorkflowEngine(workspaceRoot);
  const issueId = 'ecommerce-api-001';

  // Design Phase
  console.log('=== DESIGN PHASE ===');
  
  // Specification
  let state = await engine.processIssue(
    issueId, 
    'design', 
    'Create a REST API for an e-commerce platform with user management, product catalog, shopping cart, and order processing'
  );
  console.log(`Specification complete: ${state.progress}%`);

  // Pseudocode
  state = await engine.processIssue(
    issueId, 
    'design', 
    'Include payment processing with Stripe, inventory management, and order tracking'
  );
  console.log(`Pseudocode complete: ${state.progress}%`);

  // Architecture
  state = await engine.processIssue(
    issueId, 
    'design', 
    'Use Node.js with Express, TypeScript, PostgreSQL, Redis, and microservices architecture'
  );
  console.log(`Architecture complete: ${state.progress}%`);

  // Refinement
  state = await engine.processIssue(
    issueId, 
    'design', 
    'Add comprehensive API documentation, rate limiting, and monitoring'
  );
  console.log(`Design complete: ${state.progress}%`);

  // Build Phase
  console.log('=== BUILD PHASE ===');
  state = await engine.processIssue(
    issueId, 
    'build', 
    'Generate complete microservices implementation with Docker containers, API Gateway, and database schemas'
  );
  console.log(`Implementation complete: ${state.artifacts.implementation ? 'Yes' : 'No'}`);

  // Debug Phase
  console.log('=== DEBUG PHASE ===');
  state = await engine.processIssue(
    issueId, 
    'debug', 
    'Review the implementation for scalability issues, security vulnerabilities, and performance bottlenecks'
  );
  console.log(`Debug analysis complete: ${state.artifacts.notes ? 'Yes' : 'No'}`);

  return state;
}
```

## 🎯 Mode-Specific Examples

### Design Mode Examples

#### Requirements Gathering
```typescript
// Start with high-level requirements
await engine.processIssue('project-001', 'design', 'Build a social media platform');

// Add specific features
await engine.processIssue('project-001', 'design', 'Include user profiles, posts, comments, and real-time messaging');

// Add technical constraints
await engine.processIssue('project-001', 'design', 'Use React frontend, Node.js backend, and WebSocket for real-time features');
```

#### Architecture Design
```typescript
// Define system architecture
await engine.processIssue('project-001', 'design', 'Design microservices architecture with API Gateway, User Service, Post Service, and Message Service');

// Add database design
await engine.processIssue('project-001', 'design', 'Use PostgreSQL for user data, MongoDB for posts, and Redis for caching');
```

### Build Mode Examples

#### Technology-Specific Implementation
```typescript
// React Frontend
await engine.processIssue('project-001', 'build', 'Generate React components with TypeScript, Redux for state management, and Material-UI for styling');

// Node.js Backend
await engine.processIssue('project-001', 'build', 'Create Express.js API with TypeScript, JWT authentication, and Swagger documentation');

// Database Setup
await engine.processIssue('project-001', 'build', 'Generate database schemas, migrations, and seed data for PostgreSQL and MongoDB');
```

### Debug Mode Examples

#### Security Analysis
```typescript
// Security review
await engine.processIssue('project-001', 'debug', 'Analyze the authentication system for security vulnerabilities');

// Performance analysis
await engine.processIssue('project-001', 'debug', 'Check for performance bottlenecks in the database queries and API endpoints');

// Code quality review
await engine.processIssue('project-001', 'debug', 'Review code quality, error handling, and best practices compliance');
```

## 🔧 Error Handling Examples

### Basic Error Handling
```typescript
async function safeProcessIssue(issueId: string, mode: string, input: string) {
  try {
    const state = await engine.processIssue(issueId, mode, input);
    console.log(`Success: ${state.currentPhase} - ${state.progress}%`);
    return state;
  } catch (error) {
    console.error(`Error processing issue ${issueId}:`, error.message);
    throw error;
  }
}
```

### Retry Logic
```typescript
async function processIssueWithRetry(issueId: string, mode: string, input: string, maxRetries: number = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const state = await engine.processIssue(issueId, mode, input);
      return state;
    } catch (error) {
      console.log(`Attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw new Error(`Failed after ${maxRetries} attempts: ${error.message}`);
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}
```

### Validation
```typescript
function validateInput(input: string): boolean {
  if (!input || input.trim().length === 0) {
    throw new Error('Input cannot be empty');
  }
  
  if (input.length > 2000) {
    throw new Error('Input too long (max 2000 characters)');
  }
  
  return true;
}

async function validatedProcessIssue(issueId: string, mode: string, input: string) {
  validateInput(input);
  return await engine.processIssue(issueId, mode, input);
}
```

## 📊 Progress Tracking Examples

### Monitor Progress
```typescript
async function trackProgress(issueId: string, inputs: string[]) {
  const progress = [];
  
  for (const input of inputs) {
    const state = await engine.processIssue(issueId, 'design', input);
    progress.push({
      input,
      phase: state.currentPhase,
      progress: state.progress,
      artifacts: Object.keys(state.artifacts)
    });
  }
  
  return progress;
}

// Usage
const inputs = [
  'Create a blog platform',
  'Add user authentication',
  'Include comment system',
  'Add admin dashboard'
];

const progress = await trackProgress('blog-platform', inputs);
console.table(progress);
```

### Batch Processing
```typescript
async function batchProcess(issues: Array<{id: string, mode: string, input: string}>) {
  const results = await Promise.allSettled(
    issues.map(issue => engine.processIssue(issue.id, issue.mode, issue.input))
  );
  
  return results.map((result, index) => ({
    issue: issues[index],
    success: result.status === 'fulfilled',
    data: result.status === 'fulfilled' ? result.value : null,
    error: result.status === 'rejected' ? result.reason : null
  }));
}
```

## 💡 Best Practices

### Input Quality
```typescript
// Good: Specific and detailed
await engine.processIssue('project-001', 'design', 'Create a REST API for user management with JWT authentication, password hashing using bcrypt, and rate limiting');

// Bad: Vague and unclear
await engine.processIssue('project-001', 'design', 'Make an API');
```

### Progressive Refinement
```typescript
// Start broad, then get specific
await engine.processIssue('project-001', 'design', 'Create a web application');
await engine.processIssue('project-001', 'design', 'Add user authentication system');
await engine.processIssue('project-001', 'design', 'Include JWT tokens and password hashing');
await engine.processIssue('project-001', 'design', 'Add rate limiting and input validation');
```

### Mode Transitions
```typescript
// Complete design before building
const designState = await engine.processIssue('project-001', 'design', 'Finalize requirements');
if (designState.currentPhase === 'completion') {
  const buildState = await engine.processIssue('project-001', 'build', 'Generate implementation');
}
```

---

*Ready for more advanced examples? Check out [Advanced Scenarios](./advanced-scenarios.md) for complex use cases.*
