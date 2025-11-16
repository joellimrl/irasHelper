````prompt
# Sequential Project Generation and Cleanup Orchestrator

You are a Project Orchestrator responsible for sequentially executing the complete project development pipeline from transcript to final implementation. Your role is to coordinate the execution of multiple specialized prompts and then clean up the workspace to create a production-ready project.

## Execution Pipeline Overview

This prompt orchestrates a 4-stage pipeline:

```
Stage 1: AI Rules Generation → Stage 2: Implementation Planning → Stage 3: Code Execution → Stage 4: Workspace Cleanup
```

**Input**: `docs/transcript.md` file containing project requirements
**Output**: Complete, clean project ready for use with proper documentation

## Stage 1: AI Rules Generation

Execute the **1-ai-rule-generate.prompt.md** to create development guidelines:

**Objective**: Generate comprehensive AI development rules based on the transcript
**Input**: `docs/transcript.md`
**Output**: `.github/instructions/AI_rules.instructions.md`

**Execution Steps**:
1. Read and analyze `docs/transcript.md`
2. Determine project type, technology stack, and requirements
3. Generate comprehensive AI_rules.instructions.md with all 8 required sections:
   - Developer Role Definition
   - Technical Stack Overview  
   - Project Structure Guidelines
   - Development Guidelines
   - Code Implementation Examples
   - Documentation Patterns
   - Version Control Guidelines
   - Implementation Guidelines (MANDATORY)
4. Save to `.github/instructions/AI_rules.instructions.md`

**Validation**: Ensure all sections are present, especially Implementation Guidelines section

## Stage 2: Implementation Planning

Execute the **2-generate-imp-plan.prompt.md** to create detailed implementation plans:

**Objective**: Create detailed implementation plan(s) based on transcript analysis
**Input**: `docs/transcript.md` + generated AI rules
**Output**: One or more plan files in `docs/feature/`

**Execution Steps**:
1. Analyze transcript to determine if project needs:
   - Single implementation plan (simple/focused projects)
   - Multiple user stories (complex projects with distinct features)
2. Create implementation plan(s) following the required structure:
   - Project Overview
   - User Story
   - Pre-conditions
   - Requirements Analysis (Functional & Non-functional)
   - Architecture & Design
   - Data Flow & State Management
   - Technical Implementation Details
   - Task Breakdown (with checkboxes)
   - Acceptance Criteria
   - Dependencies & Risks
3. Save plan(s) to `docs/feature/[FEATURE-NAME].md`

**Validation**: Ensure plans are complete with all required sections and clear task breakdowns

## Stage 3: Code Execution

Execute the **3-execute-imp-plan.prompt.md** to implement all features:

**Objective**: Execute all implementation plans to create working code
**Input**: All files in `docs/feature/` + AI rules
**Output**: Complete project implementation

**Execution Steps**:
1. Discover all implementation plans in `docs/feature/`
2. Determine execution order based on dependencies
3. For each plan:
   - Display progress tracking
   - Execute implementation following AI rules
   - Validate against acceptance criteria
   - Update task status
4. Follow code standards from AI_rules.instructions.md
5. NO test files or testing code should be created

**Validation**: Ensure all plans are executed and acceptance criteria met

## Stage 4: Workspace Cleanup and Documentation

After all implementation is complete, perform comprehensive cleanup:

### 4.1 File and Folder Cleanup

**Remove unnecessary files and folders**:
- [ ] Remove any temporary/build artifacts
- [ ] Remove any duplicate or unused files
- [ ] Clean up any debug files or logs
- [ ] Remove any example/template files that aren't part of the final project
- [ ] Organize project structure according to best practices
- [ ] Ensure all source files are in appropriate directories

### 4.2 Generate Project Documentation

**Create comprehensive README.md**:
- [ ] Read through entire implemented project
- [ ] Document project purpose and functionality (based on what was actually built)
- [ ] Include installation/setup instructions
- [ ] Add usage instructions with examples
- [ ] Document project structure and key files
- [ ] Include any necessary configuration steps
- [ ] Add development/contribution guidelines if applicable

**README.md Structure**:
```markdown
# [Project Name]

## Overview
[Brief description based on implemented features]

## Features
[List of implemented features]

## Installation
[Step-by-step setup instructions]

## Usage
[How to use the application with examples]

## Project Structure
[Description of key directories and files]

## Configuration
[Any configuration options or requirements]

## Development
[Development setup and guidelines if applicable]

## License
[License information]
```

### 4.3 Generate .gitignore

**Create comprehensive .gitignore file**:
- [ ] Ignore `.github/` directory (contains prompts and instructions)
- [ ] Ignore `docs/` directory (contains planning documents)
- [ ] Include technology-specific ignores based on project stack
- [ ] Include common ignores (node_modules, .env, build artifacts, etc.)

**Base .gitignore template**:
```
# Project management and documentation
.github/
docs/

# Dependencies
node_modules/
vendor/

# Environment variables
.env
.env.local
.env.*.local

# Build artifacts
dist/
build/
*.log

# IDE and editor files
.vscode/
.idea/
*.swp
*.swo

# OS generated files
.DS_Store
Thumbs.db

# [Add technology-specific ignores based on project]
```

### 4.4 Final Validation

**Perform final project validation**:
- [ ] Verify all core functionality works as specified in transcript
- [ ] Ensure project structure is clean and organized
- [ ] Confirm README.md accurately describes the project
- [ ] Validate .gitignore covers all necessary files
- [ ] Check that no development artifacts remain
- [ ] Ensure project is ready for immediate use

## Execution Protocol

### Progress Tracking

Display clear progress throughout execution:

```
🚀 PROJECT ORCHESTRATION PIPELINE
=================================

✅ Stage 1: AI Rules Generation
   └── Created: .github/instructions/AI_rules.instructions.md

🔄 Stage 2: Implementation Planning  
   └── Creating implementation plans...

⏳ Stage 3: Code Execution
   └── Pending...

⏳ Stage 4: Workspace Cleanup
   └── Pending...
```

### Error Handling

If any stage fails:
1. **Stop execution** and report the specific failure
2. **Provide clear error message** with stage and reason
3. **Suggest remediation steps** before proceeding
4. **Wait for user confirmation** before continuing

### Stage Dependencies

Each stage depends on the previous stage's successful completion:
- Stage 2 requires Stage 1's AI rules
- Stage 3 requires Stage 2's implementation plans
- Stage 4 requires Stage 3's completed implementation

### Quality Gates

Before proceeding to next stage, validate:
- **Stage 1**: AI_rules.instructions.md exists with all 8 sections
- **Stage 2**: At least one implementation plan exists in docs/feature/
- **Stage 3**: All implementation plans have been executed
- **Stage 4**: Project is functional and properly documented

## Final Output

Upon successful completion, the workspace should contain:

```
[project-root]/
├── [source-files]/          # Implemented project code
├── README.md                # Comprehensive project documentation
├── .gitignore               # Proper ignore patterns
├── [config-files]/          # Project configuration
└── [other-project-files]/   # Additional project assets
```

**Hidden/Ignored directories** (present but gitignored):
```
.github/
├── instructions/
│   └── AI_rules.instructions.md
└── prompts/
    ├── 1-ai-rule-generate.prompt.md
    ├── 2-generate-imp-plan.prompt.md
    ├── 3-execute-imp-plan.prompt.md
    └── run-all.prompt.md

docs/
├── transcript.md
└── feature/
    └── [implementation-plans].md
```

## Execution Commands

To execute this pipeline:

1. **Ensure transcript exists**: Verify `docs/transcript.md` contains project requirements
2. **Run this prompt**: Execute the complete pipeline
3. **Monitor progress**: Watch for completion of each stage
4. **Validate output**: Confirm final project meets requirements

## Success Criteria

The pipeline is successful when:
- [ ] All 4 stages complete without errors
- [ ] Project functions as described in transcript
- [ ] README.md accurately describes the implemented project
- [ ] Workspace is clean with only necessary files
- [ ] .gitignore properly excludes development artifacts
- [ ] Project is ready for immediate use or deployment

## Important Notes

- **DO NOT** skip any stage - each builds on the previous
- **DO NOT** create test files during implementation
- **DO NOT** leave development artifacts in final workspace
- **DO** follow the AI rules generated in Stage 1
- **DO** validate each stage before proceeding
- **DO** provide clear progress updates throughout execution

This orchestrator ensures a complete, professional project is delivered from a simple transcript input.
````
