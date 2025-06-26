# Data Alchemist - AI-Powered Resource Allocation Configurator

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a Next.js TypeScript application that transforms messy spreadsheet data into clean, validated datasets with AI-powered features. The application serves as a data preprocessing tool for resource allocation systems.

## Key Technologies
- **Framework**: Next.js 15 with App Router and TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Grid**: AG-Grid React
- **File Processing**: PapaParse (CSV), xlsx (Excel)
- **File Upload**: react-dropzone
- **AI Integration**: OpenAI API (when implemented)

## Data Schemas
The application works with three main entity types:
1. **Clients**: ClientID, ClientName, PriorityLevel (1-5), RequestedTaskIDs, GroupTag, AttributesJSON
2. **Workers**: WorkerID, WorkerName, Skills, AvailableSlots, MaxLoadPerPhase, WorkerGroup, QualificationLevel
3. **Tasks**: TaskID, TaskName, Category, Duration, RequiredSkills, PreferredPhases, MaxConcurrent

## Core Features to Implement
1. Drag-and-drop file upload interface
2. Editable data grids with real-time validation
3. Comprehensive validation engine (12+ validation rules)
4. Business rules builder interface
5. Priority configuration system
6. Export functionality for cleaned data and rules

## Coding Guidelines
- Use TypeScript strictly with proper type definitions
- Follow Next.js App Router patterns
- Implement responsive design with Tailwind CSS
- Use Zustand for state management with proper store separation
- Implement proper error handling and user feedback
- Create reusable components with clear interfaces
- Follow accessibility best practices
