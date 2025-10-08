# SPARC Workflow Engine - Visual Diagrams

## Complete SPARC Workflow Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                SPARC WORKFLOW ENGINE                                    │
│                           (Specification → Pseudocode → Architecture → Refinement → Completion) │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    USER INPUT                                           │
│                              "Create a user authentication system"                      │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                 MODE SELECTION                                          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                                │
│  │   DESIGN    │    │    BUILD    │    │    DEBUG    │                                │
│  │    MODE     │    │    MODE     │    │    MODE     │                                │
│  └─────────────┘    └─────────────┘    └─────────────┘                                │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              DESIGN MODE PROCESSING                                     │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              PHASE PROGRESSION (0% → 100%)                             │
│                                                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────┐ │
│  │SPECIFICATION│───▶│ PSEUDOCODE  │───▶│ARCHITECTURE │───▶│ REFINEMENT  │───▶│COMPLETION│ │
│  │   (0-25%)   │    │  (25-50%)   │    │  (50-75%)   │    │  (75-100%)  │    │  (100%)  │ │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘    └─────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              ARTIFACT GENERATION                                        │
│                                                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐              │
│  │requirements │    │ pseudocode  │    │architecture │    │guidelines   │              │
│  │    .md      │    │    .md      │    │    .md      │    │    .md      │              │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘              │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              BUILD MODE PROCESSING                                      │
│                              (Requires Design Complete)                                 │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              IMPLEMENTATION GENERATION                                  │
│                                                                                         │
│  ┌─────────────┐    ┌─────────────┐                                                    │
│  │implementation│    │   tests     │                                                    │
│  │    .md      │    │    .md      │                                                    │
│  └─────────────┘    └─────────────┘                                                    │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              DEBUG MODE PROCESSING                                      │
│                              (Can work with any artifacts)                              │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              DEBUG ANALYSIS & NOTES                                     │
│                                                                                         │
│  ┌─────────────┐                                                                        │
│  │   notes     │                                                                        │
│  │    .md      │                                                                        │
│  └─────────────┘                                                                        │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              FILE SYSTEM STORAGE                                        │
│                                                                                         │
│  .nys/                                                                                  │
│  ├── issue-1234567890/                                                                  │
│  │   ├── requirements.md                                                                │
│  │   ├── guidelines.md                                                                  │
│  │   ├── pseudocode.md                                                                  │
│  │   ├── architecture.md                                                                │
│  │   ├── implementation.md                                                              │
│  │   ├── tests.md                                                                       │
│  │   └── notes.md                                                                       │
│  ├── issue-1234567890-workflow.json                                                     │
│  └── ...                                                                                │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

## Detailed Phase Breakdown

### Design Mode - Phase Progression

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              DESIGN MODE PHASES                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  PHASE 1: SPECIFICATION (0% → 25%)                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │ Input: "Create a user authentication system"                                    │   │
│  │                                                                                 │   │
│  │ Process:                                                                        │   │
│  │ • Extract core functionality requirements                                       │   │
│  │ • Identify technical constraints                                                │   │
│  │ • Define performance requirements                                               │   │
│  │ • Map integration points                                                        │   │
│  │                                                                                 │   │
│  │ Output: requirements.md                                                         │   │
│  │ ┌─────────────────────────────────────────────────────────────────────────┐   │   │
│  │ │ # Requirements Specification                                            │   │   │
│  │ │ ## User Input                                                           │   │   │
│  │ │ Create a user authentication system                                     │   │   │
│  │ │ ## Extracted Requirements                                               │   │   │
│  │ │ - Core functionality: User login/logout                                 │   │   │
│  │ │ - Technical constraints: JWT tokens                                     │   │   │
│  │ │ - Performance: < 200ms response time                                    │   │   │
│  │ │ - Integration: REST API endpoints                                       │   │   │
│  │ │ ## Acceptance Criteria                                                  │   │   │
│  │ │ - [ ] User can register with email/password                             │   │   │
│  │ │ - [ ] User can login and receive JWT token                              │   │   │
│  │ │ - [ ] User can logout and invalidate token                              │   │   │
│  │ └─────────────────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  PHASE 2: PSEUDOCODE (25% → 50%)                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │ Input: "Add JWT token support" + requirements.md                               │   │
│  │                                                                                 │   │
│  │ Process:                                                                        │   │
│  │ • Analyze requirements for algorithmic structure                               │   │
│  │ • Design high-level algorithm flow                                             │   │
│  │ • Define key functions and data structures                                     │   │
│  │                                                                                 │   │
│  │ Output: pseudocode.md                                                           │   │
│  │ ┌─────────────────────────────────────────────────────────────────────────┐   │   │
│  │ │ # Pseudocode                                                            │   │   │
│  │ │ ## Algorithm Overview                                                   │   │   │
│  │ │ ```                                                                     │   │   │
│  │ │ BEGIN                                                                   │   │   │
│  │ │   INITIALIZE auth service                                               │   │   │
│  │ │   FOR each login request DO                                             │   │   │
│  │ │     VALIDATE credentials                                                │   │   │
│  │ │     IF valid THEN                                                       │   │   │
│  │ │       GENERATE JWT token                                                │   │   │
│  │ │       RETURN token                                                      │   │   │
│  │ │     ELSE                                                                │   │   │
│  │ │       RETURN error                                                      │   │   │
│  │ │     END IF                                                              │   │   │
│  │ │   END FOR                                                               │   │   │
│  │ │ END                                                                     │   │   │
│  │ │ ```                                                                     │   │   │
│  │ │ ## Key Functions                                                        │   │   │
│  │ │ - validateCredentials(): Credential validation                         │   │   │
│  │ │ - generateJWT(): Token generation                                      │   │   │
│  │ │ - hashPassword(): Password hashing                                     │   │   │
│  │ └─────────────────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  PHASE 3: ARCHITECTURE (50% → 75%)                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │ Input: "Include password hashing with bcrypt" + all previous artifacts          │   │
│  │                                                                                 │   │
│  │ Process:                                                                        │   │
│  │ • Design system components and layers                                          │   │
│  │ • Define component interactions                                                 │   │
│  │ • Specify dependencies and interfaces                                          │   │
│  │ • Create development guidelines                                                │   │
│  │                                                                                 │   │
│  │ Output: architecture.md + guidelines.md                                        │   │
│  │ ┌─────────────────────────────────────────────────────────────────────────┐   │   │
│  │ │ # System Architecture                                                   │   │   │
│  │ │ ## Components                                                            │   │   │
│  │ │ - AuthController: Handle HTTP requests                                   │   │   │
│  │ │ - AuthService: Business logic                                            │   │   │
│  │ │ - UserRepository: Data access                                            │   │   │
│  │ │ - JWTService: Token management                                           │   │   │
│  │ │ - PasswordService: Password hashing                                      │   │   │
│  │ │ ## Data Flow                                                             │   │   │
│  │ │ 1. Request → AuthController                                              │   │   │
│  │ │ 2. AuthController → AuthService                                          │   │   │
│  │ │ 3. AuthService → UserRepository                                          │   │   │
│  │ │ 4. AuthService → PasswordService                                         │   │   │
│  │ │ 5. AuthService → JWTService                                              │   │   │
│  │ │ 6. Response ← AuthController                                             │   │   │
│  │ └─────────────────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  PHASE 4: REFINEMENT (75% → 100%)                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │ Input: "Finalize requirements" + requirements.md                               │   │
│  │                                                                                 │   │
│  │ Process:                                                                        │   │
│  │ • Refine requirements based on architecture                                    │   │
│  │ • Add missing details and clarifications                                       │   │
│  │ • Finalize acceptance criteria                                                 │   │
│  │                                                                                 │   │
│  │ Output: Updated requirements.md                                                │   │
│  │ ┌─────────────────────────────────────────────────────────────────────────┐   │   │
│  │ │ # Requirements Specification                                            │   │   │
│  │ │ [Previous content...]                                                   │   │   │
│  │ │                                                                         │   │   │
│  │ │ ## Refinements                                                          │   │   │
│  │ │ [2024-01-15T10:30:00Z] Finalize requirements                            │   │   │
│  │ │                                                                         │   │   │
│  │ │ Additional requirements:                                                │   │   │
│  │ │ - Password must be hashed using bcrypt with salt rounds 12              │   │   │
│  │ │ - JWT tokens must expire after 24 hours                                 │   │   │
│  │ │ - API must support refresh token mechanism                               │   │   │
│  │ │                                                                         │   │   │
│  │ │ *Refined based on user feedback*                                        │   │   │
│  │ └─────────────────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  PHASE 5: COMPLETION (100%)                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │ Status: Design phase complete                                                   │   │
│  │ Ready for Build mode                                                            │   │
│  │                                                                                 │   │
│  │ Generated Artifacts:                                                            │   │
│  │ ✅ requirements.md                                                              │   │
│  │ ✅ pseudocode.md                                                                │   │
│  │ ✅ architecture.md                                                              │   │
│  │ ✅ guidelines.md                                                                │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### Build Mode Processing

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              BUILD MODE PROCESSING                                      │
│                              (Requires Design Complete)                                 │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  PREREQUISITE CHECK                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │ if (currentPhase !== 'completion') {                                           │   │
│  │   // Add note about incomplete design                                           │   │
│  │   state.artifacts.notes += "Build requested but design incomplete"             │   │
│  │   return                                                                       │   │
│  │ }                                                                              │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  IMPLEMENTATION GENERATION                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │ Input: "Generate Express.js authentication middleware" + all design artifacts  │   │
│  │                                                                                 │   │
│  │ Process:                                                                        │   │
│  │ • Generate source code based on architecture                                   │   │
│  │ • Create configuration files                                                   │   │
│  │ • Generate test suites                                                         │   │
│  │                                                                                 │   │
│  │ Output: implementation.md + tests.md                                           │   │
│  │ ┌─────────────────────────────────────────────────────────────────────────┐   │   │
│  │ │ # Implementation                                                        │   │   │
│  │ │ ## Generated Code Structure                                             │   │   │
│  │ │ ```typescript                                                           │   │   │
│  │ │ // auth.controller.ts                                                   │   │   │
│  │ │ export class AuthController {                                           │   │   │
│  │ │   constructor(private authService: AuthService) {}                      │   │   │
│  │ │                                                                         │   │   │
│  │ │   async login(req: Request, res: Response) {                           │   │   │
│  │ │     const { email, password } = req.body;                              │   │   │
│  │ │     const result = await this.authService.login(email, password);      │   │   │
│  │ │     res.json(result);                                                  │   │   │
│  │ │   }                                                                    │   │   │
│  │ │ }                                                                      │   │   │
│  │ │ ```                                                                     │   │   │
│  │ │ ## Configuration Files                                                  │   │   │
│  │ │ - package.json: Dependencies                                            │   │   │
│  │ │ - .env: Environment variables                                           │   │   │
│  │ │ - tsconfig.json: TypeScript configuration                               │   │   │
│  │ └─────────────────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### Debug Mode Processing

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              DEBUG MODE PROCESSING                                      │
│                              (Can work with any artifacts)                              │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  DEBUG ANALYSIS                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │ Input: "Fix JWT token expiration issue" + any existing artifacts               │   │
│  │                                                                                 │   │
│  │ Process:                                                                        │   │
│  │ • Analyze existing code for issues                                             │   │
│  │ • Identify performance bottlenecks                                             │   │
│  │ • Check for security vulnerabilities                                           │   │
│  │ • Provide recommendations                                                      │   │
│  │                                                                                 │   │
│  │ Output: Updated notes.md                                                       │   │
│  │ ┌─────────────────────────────────────────────────────────────────────────┐   │   │
│  │ │ # Debug Notes                                                           │   │   │
│  │ │ [Previous notes...]                                                     │   │   │
│  │ │                                                                         │   │   │
│  │ │ [2024-01-15T11:00:00Z] Debug Analysis:                                  │   │   │
│  │ │ ## Debug Analysis                                                        │   │   │
│  │ │ **Issue**: Fix JWT token expiration issue                               │   │   │
│  │ │                                                                         │   │   │
│  │ │ **Analysis**:                                                           │   │   │
│  │ │ - Code quality: JWT expiration not properly handled                     │   │   │
│  │ │ - Performance: Token validation happens on every request               │   │   │
│  │ │ - Error handling: No graceful handling of expired tokens               │   │   │
│  │ │ - Security: Tokens don't have proper expiration validation             │   │   │
│  │ │                                                                         │   │   │
│  │ │ **Recommendations**:                                                    │   │   │
│  │ │ - Add token expiration check in middleware                              │   │   │
│  │ │ - Implement refresh token mechanism                                     │   │   │
│  │ │ - Add proper error responses for expired tokens                         │   │   │
│  │ │ - Update JWT service to handle expiration gracefully                    │   │   │
│  │ │                                                                         │   │   │
│  │ │ **Status**: Ready for fixes                                             │   │   │
│  │ │ *Generated by SPARC Workflow Engine - Debug Phase*                     │   │   │
│  │ └─────────────────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

## State Management Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              STATE MANAGEMENT FLOW                                      │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  WORKFLOW STATE STRUCTURE                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │ {                                                                               │   │
│  │   "issueId": "issue-1234567890",                                               │   │
│  │   "currentPhase": "completion",                                                 │   │
│  │   "mode": "design",                                                             │   │
│  │   "progress": 100,                                                              │   │
│  │   "artifacts": {                                                                │   │
│  │     "requirements": "# Requirements Specification...",                          │   │
│  │     "pseudocode": "# Pseudocode...",                                            │   │
│  │     "architecture": "# System Architecture...",                                 │   │
│  │     "guidelines": "# Development Guidelines...",                                │   │
│  │     "implementation": "# Implementation...",                                    │   │
│  │     "tests": "# Test Suite...",                                                 │   │
│  │     "notes": "# Debug Notes..."                                                 │   │
│  │   },                                                                            │   │
│  │   "createdAt": "2024-01-15T09:00:00Z",                                         │   │
│  │   "updatedAt": "2024-01-15T11:30:00Z"                                          │   │
│  │ }                                                                               │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  DUAL PERSISTENCE MODEL                                                                 │
│                                                                                         │
│  ┌─────────────────────────────────┐    ┌─────────────────────────────────────────┐     │
│  │        JSON STATE FILE          │    │         MARKDOWN ARTIFACTS              │     │
│  │                                 │    │                                         │     │
│  │ issue-1234567890-workflow.json  │    │ .nys/issue-1234567890/                 │     │
│  │                                 │    │ ├── requirements.md                     │     │
│  │ • Complete workflow state       │    │ ├── guidelines.md                       │     │
│  │ • Metadata and progress         │    │ ├── pseudocode.md                       │     │
│  │ • Artifact references           │    │ ├── architecture.md                     │     │
│  │ • Timestamps                    │    │ ├── implementation.md                   │     │
│  │                                 │    │ ├── tests.md                            │     │
│  │ Machine-readable                │    │ └── notes.md                            │     │
│  │ Fast loading                    │    │                                         │     │
│  │ State management                │    │ Human-readable                           │     │
│  │                                 │    │ Version control friendly                │     │
│  │                                 │    │ Direct editing capability               │     │
│  └─────────────────────────────────┘    └─────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

## Integration Points

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              INTEGRATION POINTS                                        │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  VS CODE EXTENSION INTEGRATION                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │ IssueViewProvider                                                               │   │
│  │ ├── SPARCWorkflowEngine integration                                            │   │
│  │ ├── Webview communication                                                      │   │
│  │ ├── Command handling                                                           │   │
│  │ └── State synchronization                                                      │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  WEBVIEW INTERFACE                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │ User Interface Components                                                       │   │
│  │ ├── Issue creation and management                                               │   │
│  │ ├── Mode switching (Design/Build/Debug)                                        │   │
│  │ ├── Chat interface with mode-aware responses                                   │   │
│  │ ├── Progress tracking and visual indicators                                    │   │
│  │ └── Artifact display and navigation                                            │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  FILE SYSTEM INTEGRATION                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │ .nys/ Directory Structure                                                       │   │
│  │ ├── Issue-specific folders                                                      │   │
│  │ ├── Workflow state files                                                        │   │
│  │ ├── Artifact markdown files                                                     │   │
│  │ └── Version control integration                                                 │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

This comprehensive visual documentation illustrates the complete SPARC Workflow Engine architecture, showing how user input flows through the system, how different modes process information, and how artifacts are generated and stored. The diagrams provide both high-level overview and detailed phase-by-phase breakdowns to help understand the complete workflow process.