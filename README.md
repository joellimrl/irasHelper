# Default Template

## Overview

This is a default template for generating projects from scratch using AI assistance. The template provides a structured approach to project creation by requiring only a simple transcript file that describes the project concept, then automating the entire development process.

## Purpose

This template serves as a starting point for creating any type of project by:
- Providing a standardized project structure
- Automating the project generation process
- Ensuring consistent documentation and organization
- Streamlining the development workflow from concept to implementation

## How It Works

The template uses a simple two-step process:

1. **Define the Project**: Create a `transcript.md` file describing your project idea
2. **Generate the Project**: Run the automated generation process to create the full project

## Requirements

To use this template, you only need:

- A `docs/transcript.md` file containing your project description
- All 4 prompt files in `.github/prompts/` (included in this template):
  - `run-all.prompt.md` - Main orchestration prompt
  - `1-ai-rule-generate.prompt.md` - AI rule generation
  - `2-generate-imp-plan.prompt.md` - Implementation plan generation
  - `3-execute-imp-plan.prompt.md` - Implementation execution

## Usage Instructions

### Step 1: Create Your Project Transcript

Create a file at `docs/transcript.md` with a description of your project. This should include:

- Project overview and goals
- Key features and functionality
- Technical requirements or preferences
- Any specific technologies or frameworks to use
- Target audience or use cases

Example `transcript.md` content:
```markdown
# My Project Idea

I want to create a web application that helps users track their daily habits.
The app should have a clean, modern interface and allow users to:
- Add custom habits to track
- Mark habits as completed each day
- View progress over time with charts
- Set reminders for habits

I prefer using React for the frontend and Node.js for the backend.
The app should be responsive and work well on mobile devices.
```

### Step 2: Generate Your Project

Once you have created your `transcript.md` file, run the project generation process:

1. Ensure your `docs/transcript.md` file is complete and descriptive
2. Verify all 4 prompt files are available in `.github/prompts/`
3. Execute the generation process by running `run-all.prompt.md` with your AI assistant
4. The system will orchestrate the other 3 prompts to create a complete project structure

### What Gets Generated

The generation process will create:
- Complete project structure with appropriate files and folders
- Source code implementing your described functionality
- Documentation (README, setup instructions, etc.)
- Configuration files (package.json, build scripts, etc.)
- Development environment setup
- Testing framework (if applicable)

## Project Structure

```
defaultTemplate/
├── README.md              # This template documentation
├── .github/
│   └── prompts/
│       ├── run-all.prompt.md              # Main orchestration prompt
│       ├── 1-ai-rule-generate.prompt.md   # AI rule generation
│       ├── 2-generate-imp-plan.prompt.md  # Implementation planning
│       └── 3-execute-imp-plan.prompt.md   # Implementation execution
├── docs/
│   ├── transcript.md      # Your project description (you create this)
│   └── feature/           # Additional feature documentation
```

## Next Steps

1. **Create your transcript**: Write a clear description of your project in `docs/transcript.md`
2. **Run generation**: Execute the generation process using `run-all.prompt.md` from `.github/prompts/`
3. **Review and refine**: The generated project will be complete but can be customized further
4. **Start developing**: Begin working on your project with the generated foundation

## How the Generation Process Works

The template uses a 4-stage automated process:

1. **`run-all.prompt.md`**: Orchestrates the entire generation process
2. **`1-ai-rule-generate.prompt.md`**: Generates AI rules and guidelines for the project
3. **`2-generate-imp-plan.prompt.md`**: Creates a detailed implementation plan
4. **`3-execute-imp-plan.prompt.md`**: Executes the plan to generate the actual project code

## Tips for Better Results

- Be specific about your requirements in the transcript
- Include examples or references if helpful
- Mention any constraints or preferences (technologies, design style, etc.)
- Describe the user experience you want to create
- Include any integration requirements or external services needed

## Template Maintenance

This template is designed to be:
- Technology-agnostic (works for any type of project)
- Easily customizable for different project types
- Continuously improvable based on generation results
- Minimal but comprehensive in its approach