# Data Alchemist 🧪

**AI-Powered Resource Allocation Configurator**

Data Alchemist is a sophisticated web application designed to transform spreadsheet data into actionable resource allocation strategies. Built for non-technical users, it combines intuitive interfaces with powerful AI capabilities to make data preprocessing and business rule configuration accessible to everyone.

## ✨ Key Features

### 🤖 AI-Enhanced Data Processing
- **Smart Header Mapping**: AI automatically detects and maps CSV/Excel columns even when headers are misnamed or missing
- **Natural Language Search**: Search your data using plain English queries like "show high priority clients" or "tasks longer than 2 phases"
- **Intelligent Error Correction**: AI suggests specific fixes for data validation errors with contextual explanations
- **Natural Language Rule Creation**: Describe business rules in plain English and let AI convert them to structured rules

### 📊 Comprehensive Data Management
- **File Upload Support**: CSV, XLSX, and XLS file formats
- **Real-time Validation**: 9+ validation rules including duplicate detection, reference checking, and business logic validation
- **Interactive Data Grid**: Excel-like editing with real-time validation feedback
- **Error Highlighting**: Visual indicators for problematic data with contextual tooltips

### ⚙️ Advanced Business Rules Engine
- **Multiple Rule Types**: Co-run rules, load limits, slot restrictions, phase windows, pattern matching, and precedence overrides
- **AI Rule Builder**: Convert natural language descriptions into structured business rules
- **Manual Rule Builder**: Traditional form-based rule creation for precise control
- **Priority Management**: Assign importance levels to rules for conflict resolution

### 🎯 Flexible Prioritization System
- **Slider Controls**: Fine-tune priority weights with intuitive sliders
- **Drag-and-Drop Ranking**: Visually rank factors by importance
- **Pairwise Comparison**: Make direct comparisons between priority factors
- **Smart Presets**: Quick-start configurations for common scenarios

### 📤 Robust Export Capabilities
- **Cleaned Data Export**: Download validated and corrected CSV files
- **Rules Configuration**: Export complete rules.json with all business logic
- **Validation Reports**: Detailed error and warning summaries

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager
- OpenAI API key (for AI features)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd data-alchemist
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
Create a `.env.local` file with your OpenAI API key:
```bash
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
```

4. **Start development server**
```bash
npm run dev
```

5. **Open in browser**
Navigate to `http://localhost:3000`

## 🧠 AI Features Deep Dive

### Smart Header Mapping
The AI system analyzes uploaded file headers and uses semantic understanding to map them to expected columns:

```typescript
// Example: "Client Name" → "ClientName", "Worker ID" → "WorkerID"
const mapping = await aiService.mapHeaders(detectedHeaders, expectedHeaders, fileType);
```

### Natural Language Search
Transform natural language queries into structured data filters:

```typescript
// Query: "high priority clients in marketing group"
// Result: Filters for PriorityLevel >= 4 AND GroupTag contains "marketing"
const results = await aiService.searchData(query, data, dataType);
```

### AI Rule Creation
Convert business descriptions into executable rules:

```typescript
// Input: "Marketing team can only handle 3 tasks per phase"
// Output: LoadLimitRule with workerGroup="Marketing", maxSlotsPerPhase=3
const rule = await aiService.createRuleFromNaturalLanguage(description, data);
```

### Error Correction Suggestions
Get contextual suggestions for fixing data errors:

```typescript
// Suggests specific corrections for validation errors
const suggestions = await aiService.suggestErrorCorrection(errorType, rowData, field, value);
```

## 📋 Validation Rules

Data Alchemist implements comprehensive validation to ensure data quality:

### Critical Validations (Errors)
1. **Missing Required Columns**: Ensures all essential fields are present
2. **Duplicate IDs**: Detects duplicate ClientID, WorkerID, or TaskID values
3. **Malformed Lists**: Validates array-like fields (e.g., AvailableSlots format)
4. **Out-of-Range Values**: Checks PriorityLevel (1-5), Duration (≥1), etc.
5. **Broken JSON**: Validates JSON structure in AttributesJSON fields
6. **Unknown References**: Verifies RequestedTaskIDs exist in tasks data

### Business Logic Warnings
7. **Overloaded Workers**: Flags workers with excessive task assignments
8. **Skill Coverage**: Identifies tasks without qualified workers
9. **Concurrency Feasibility**: Checks if MaxConcurrent limits are realistic

## 🔧 Business Rules System

### Rule Types

#### Co-run Rules
Tasks that must execute together in the same phase:
```json
{
  "type": "coRun",
  "name": "Marketing Campaign Tasks",
  "tasks": ["T001", "T002", "T003"],
  "priority": 1
}
```

#### Load Limit Rules
Maximum task capacity per worker group:
```json
{
  "type": "loadLimit",
  "name": "Sales Team Capacity",
  "workerGroup": "Sales",
  "maxSlotsPerPhase": 5,
  "priority": 2
}
```

#### Slot Restriction Rules
Client-specific resource limitations:
```json
{
  "type": "slotRestriction",
  "name": "VIP Client Priority",
  "clientGroup": "VIP",
  "maxSlots": 10,
  "priority": 1
}
```

#### Phase Window Rules
Time-based task constraints:
```json
{
  "type": "phaseWindow",
  "name": "Quarterly Tasks",
  "taskIDs": ["T005", "T006"],
  "allowedPhases": [1, 2, 3],
  "priority": 3
}
```

## 🎨 User Interface Guide

### File Upload Tab
1. **Drag & Drop Interface**: Upload CSV/XLSX files with visual feedback
2. **AI Header Mapping**: Automatic column detection and mapping
3. **Manual Mapping Override**: Fine-tune mappings with dropdown selectors
4. **Upload Progress**: Real-time processing status with error handling

### Data Review Tab
1. **Interactive Grid**: Excel-like editing with keyboard navigation
2. **AI Search Bar**: Natural language data filtering
3. **Sorting & Filtering**: Standard grid operations
4. **Real-time Validation**: Immediate feedback on data changes

### Business Rules Tab
1. **AI Rule Creator**: Natural language rule input with suggestions
2. **Manual Rule Builder**: Traditional form-based rule creation
3. **Rule Management**: Edit, delete, and prioritize existing rules
4. **Rule Validation**: Ensure rules don't conflict with data

### Priority Configuration
1. **Slider Mode**: Percentage-based weight assignment
2. **Ranking Mode**: Drag-and-drop priority ordering
3. **Comparison Mode**: Pairwise factor comparison
4. **Preset Configurations**: Quick-start templates

### Export Tab
1. **Data Export**: Download cleaned CSV files
2. **Rules Export**: Generate complete rules.json
3. **Validation Report**: Detailed error and warning summaries

## 🛠️ Technical Architecture

### Frontend Stack
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **AG Grid**: Professional data grid component
- **Zustand**: Lightweight state management

### AI Integration
- **OpenAI GPT-3.5**: Natural language processing
- **Custom AI Service**: Encapsulated AI functionality
- **Fallback Logic**: Graceful degradation when AI unavailable

### Data Processing
- **Papa Parse**: CSV file processing
- **SheetJS**: Excel file handling
- **Custom Validation Engine**: Business logic validation
- **Fuzzy Matching**: Header mapping algorithms

## 🔍 Sample Data

The `/sample-data` directory contains example files for testing:

### Client Data (`clients-sample.csv`)
- ClientID, ClientName, PriorityLevel, RequestedTaskIDs, GroupTag, AttributesJSON
- Example: High-priority marketing clients with specific task requirements

### Worker Data (`workers-sample.csv`) 
- WorkerID, WorkerName, Skills, AvailableSlots, MaxLoadPerPhase, WorkerGroup, QualificationLevel
- Example: Multi-skilled workers with varying availability and capacity

### Task Data (`tasks-sample.csv`)
- TaskID, TaskName, Category, Duration, RequiredSkills, PreferredPhases, MaxConcurrent
- Example: Diverse tasks with skill requirements and timing constraints

### Error Testing
Each data type includes `*-with-errors.csv` files containing intentional validation errors for testing the error detection and AI correction features.

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Environment Variables
```bash
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key
NODE_ENV=production
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **AG Grid** for the professional data grid component
- **OpenAI** for powering the AI features
- **Vercel** for Next.js framework and deployment platform
- **Tailwind CSS** for the utility-first CSS framework

---

**Data Alchemist** - Transform your data into gold with AI-powered intelligence! ✨
