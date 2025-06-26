# Data Alchemist

## AI-Powered Resource Allocation Configurator

Transform messy spreadsheet data into clean, validated datasets with AI-powered features. The application serves as a data preprocessing tool for resource allocation systems, designed for non-technical users who need to upload, validate, and configure business rules for client-worker-task management.

## Features

### ✨ Core Functionality
- **File Upload**: Drag-and-drop interface for CSV and XLSX files
- **Smart Data Processing**: Intelligent column mapping and data type detection
- **Real-time Validation**: 9 comprehensive validation rules
- **Inline Editing**: Edit data directly in interactive grids
- **Business Rules Builder**: Create custom allocation rules without coding
- **Priority Configuration**: Adjust allocation priorities with visual sliders
- **Export System**: Download cleaned data and rules configuration

### 🧠 AI-Powered Features
- **Intelligent Column Mapping**: Handles variations in column names
- **Natural Language Search**: Query data using plain English
- **Smart Error Detection**: Advanced validation with helpful suggestions
- **Rule Recommendations**: AI-suggested business rules based on data patterns

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Grid**: AG-Grid React
- **File Processing**: PapaParse (CSV) + xlsx (Excel)
- **File Upload**: react-dropzone

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd data-alchemist
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Data Schema

The application works with three main entity types:

### Clients
- `ClientID`: Unique identifier
- `ClientName`: Display name
- `PriorityLevel`: Integer 1-5 (higher = more important)
- `RequestedTaskIDs`: Comma-separated TaskIDs
- `GroupTag`: For grouping clients in rules
- `AttributesJSON`: JSON metadata as string

### Workers
- `WorkerID`: Unique identifier
- `WorkerName`: Display name
- `Skills`: Comma-separated skill tags
- `AvailableSlots`: Array notation like "[1,3,5]" for phases
- `MaxLoadPerPhase`: Maximum tasks per phase
- `WorkerGroup`: For grouping workers in rules
- `QualificationLevel`: Skill level indicator

### Tasks
- `TaskID`: Unique identifier
- `TaskName`: Display name
- `Category`: Task category/type
- `Duration`: Number of phases (minimum 1)
- `RequiredSkills`: Comma-separated required skills
- `PreferredPhases`: Range "1-3" or array "[2,4,5]"
- `MaxConcurrent`: Maximum parallel assignments

## Validation Rules

The system implements 9 comprehensive validation rules:

### ❌ **Critical Errors** (Block Processing)
1. **Missing Required Columns**: Ensures all essential columns exist
2. **Duplicate IDs**: Prevents duplicate identifiers within datasets
3. **Malformed Lists**: Validates array and list formats
4. **Out-of-Range Values**: Checks value boundaries (Priority 1-5, Duration ≥ 1)
5. **Broken JSON**: Validates JSON format in AttributesJSON fields
6. **Unknown References**: Ensures RequestedTaskIDs reference existing tasks

### ⚠️ **Warnings** (Advisory Issues)
7. **Overloaded Workers**: Validates worker capacity constraints
8. **Skill Coverage**: Ensures required skills are available
9. **Max-concurrency Feasibility**: Validates concurrent assignment limits

## Usage Guide

### 1. Upload Data Files
- Drag and drop CSV or Excel files for clients, workers, and tasks
- System automatically detects column headers and maps data
- Use "Load Sample Data" to test with example datasets

### 2. Review & Edit Data
- Switch between data types using tabs
- Edit cells directly in the data grid
- View real-time validation feedback

### 3. Create Business Rules
- Choose from rule types: Co-run, Load Limits, Slot Restrictions, Phase Windows
- Configure rule parameters using form interfaces
- Set rule priorities for conflict resolution

### 4. Configure Priorities
- Adjust allocation priority weights using sliders
- Choose from preset configurations or create custom weights
- Ensure total weights sum to 100%

### 5. Export Results
- Download cleaned CSV files for each data type
- Export business rules as JSON configuration
- Generate comprehensive validation reports

## File Formats

### Supported Input Formats
- CSV (.csv)
- Excel (.xlsx, .xls)

### Column Header Variations
The system intelligently maps common variations:
- `Client ID`, `ClientID`, `client_id` → `ClientID`
- `Worker Name`, `WorkerName`, `worker_name` → `WorkerName`
- And many more...

### Array Fields
Use JSON array format for list fields:
- ✅ `[1,2,3]` or `["skill1","skill2"]`
- ✅ Range format: `1-3`
- ❌ `1,2,3` (comma-separated without brackets)

## Sample Data

The `sample-data/` directory contains comprehensive test datasets for all three entity types:

### Available Files
- **Valid Data**: `clients-sample`, `workers-sample`, `tasks-sample` (CSV & XLSX)
- **Error Data**: `clients-with-errors`, `workers-with-errors`, `tasks-with-errors` (CSV & XLSX)

### Using Sample Data
1. **Quick Testing**: Use the "Load Sample Data" button in the UI
2. **Manual Upload**: Drag and drop files from `sample-data/` directory
3. **Validation Testing**: Upload error files to test validation rules
4. **Format Testing**: Alternate between CSV and XLSX versions

### Data Relationships
The sample datasets include realistic relationships:
- Clients reference valid TaskIDs
- Tasks require skills that workers possess
- Distributed priority levels and experience levels
- Cross-entity validation scenarios

See `sample-data/README.md` for detailed schema information and testing workflows.

## Development

### Project Structure
```
src/
├── app/                 # Next.js App Router pages
├── components/          # React components
├── lib/                 # Utility libraries
├── store/               # Zustand state management
└── types/               # TypeScript definitions
```

### Key Components
- `FileUploadSection`: Handles file upload and processing
- `DataGridSection`: Interactive data tables with editing
- `ValidationPanel`: Real-time validation results
- `RuleBuilderSection`: Business rules creation interface
- `PriorityConfiguration`: Priority weight adjustment
- `ExportSection`: Data and configuration export

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue on GitHub or contact the development team.
