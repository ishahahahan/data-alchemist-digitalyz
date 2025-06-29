# Data Alchemist

## AI-Powered Resource Allocation Configurator

Transform messy spreadsheet data into clean, validated datasets with advanced AI-powered features. This production-ready application serves as a comprehensive data preprocessing tool for resource allocation systems, designed for both technical and non-technical users who need to upload, validate, clean, and configure business rules for client-worker-task management.

## ✨ Key Features

### 📊 **Advanced Data Management**
- **Intelligent File Upload**: Drag-and-drop interface supporting CSV and XLSX files with automatic format detection
- **Smart Column Mapping**: AI-powered column detection that handles variations in naming conventions
- **Real-time Inline Editing**: Edit data directly in interactive AG-Grid tables with immediate validation feedback
- **Multi-row Operations**: Bulk selection, deletion with confirmation dialogs, and batch operations
- **Unsaved Changes Tracking**: Visual indicators for modified rows with smart save management
- **Data Type Switching**: Seamless navigation between Clients, Workers, and Tasks datasets

### 🔍 **AI-Powered Search & Filtering**
- **Natural Language Search**: Query data using plain English (e.g., "high priority clients", "tasks longer than 2 phases")
- **Smart Filtering**: Error-only view, combined search results, and context-aware filtering
- **Semantic Understanding**: AI interprets search intent and returns relevant results across all data types

### ✅ **Comprehensive Validation Engine**
- **Real-time Validation**: 12+ validation rules running on every data change
- **Cross-file Validation**: Validates relationships between clients, workers, and tasks
- **Visual Error Indicators**: Color-coded row highlighting (red for errors, orange for unsaved changes)
- **Detailed Error Reporting**: Grouped validation results with affected row tracking
- **Warning vs Error Classification**: Critical errors vs advisory warnings for better UX

### 🛠️ **Advanced Editing Features**
- **In-line Cell Editing**: Double-click to edit with Tab/Enter navigation support
- **Dropdown Editors**: Priority levels and other constrained fields with dropdown selection
- **Add Row Functionality**: Dynamic row creation with auto-generated IDs
- **Delete Selected**: Multi-row deletion with confirmation and selection count feedback
- **Save Changes System**: Batch save operations with comprehensive validation re-runs

### 📋 **Business Rules & Configuration**
- **Visual Rule Builder**: Create complex allocation rules without coding
- **Priority Configuration**: Interactive sliders for weight adjustment with real-time validation
- **Rule Templates**: Pre-built rule patterns for common scenarios
- **Export/Import Rules**: Save and load rule configurations as JSON

### 🎨 **Enhanced User Experience**
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **Loading States**: Smooth transitions with loading indicators and progress feedback
- **Status Messages**: Real-time feedback for save operations, validation results, and system status
- **Help Documentation**: Contextual tips and comprehensive usage guides
- **Visual Data Indicators**: Color-coded cells based on values (priority levels, qualification levels)

### 🔧 **Developer Features**
- **Production Ready**: Optimized build process with ESLint warnings instead of errors
- **TypeScript Support**: Full type safety with comprehensive type definitions
- **Error Handling**: Graceful error handling with user-friendly messages
- **Performance Optimized**: Memoized components, debounced search, and efficient re-renders

## 🛠️ Technology Stack

- **Framework**: Next.js 15 with App Router and TypeScript
- **Styling**: Tailwind CSS with custom components and responsive design
- **State Management**: Zustand with persistent stores and optimistic updates
- **Data Grid**: AG-Grid React with custom cell renderers and editors
- **File Processing**: PapaParse (CSV) + xlsx (Excel) with error handling
- **File Upload**: react-dropzone with drag-and-drop and progress tracking
- **AI Integration**: OpenAI API integration for search and validation (configurable)
- **Build Tools**: ESLint, TypeScript, PostCSS with production optimizations
- **Deployment**: Vercel-ready with automatic deployments and environment config

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

## Validation System

The application implements a comprehensive 12+ rule validation engine with both critical errors and advisory warnings:

### ❌ **Critical Errors** (Block Processing)
1. **Missing Required Columns**: Ensures all essential columns exist in uploaded data
2. **Duplicate IDs**: Prevents duplicate identifiers within and across datasets
3. **Malformed Data Formats**: Validates array notation, JSON strings, and data types
4. **Out-of-Range Values**: Checks value boundaries (Priority 1-5, Duration ≥ 1, etc.)
5. **Broken JSON**: Validates JSON format in AttributesJSON fields
6. **Unknown Task References**: Ensures RequestedTaskIDs reference existing tasks
7. **Invalid Skills Format**: Validates skill list formatting and structure

### ⚠️ **Warnings** (Advisory Issues)
8. **Worker Capacity Overload**: Validates worker availability against task assignments
9. **Skill Coverage Gaps**: Ensures required skills are available in worker pool
10. **Concurrency Conflicts**: Validates max concurrent assignment feasibility
11. **Phase Window Conflicts**: Detects scheduling conflicts in preferred phases
12. **Resource Utilization**: Identifies potential over/under-utilization patterns

### 🔍 **Cross-File Validation**
- **Referential Integrity**: Validates relationships between clients, workers, and tasks
- **Dependency Checking**: Ensures task prerequisites and skill requirements are met
- **Capacity Planning**: Validates total workload against available resources
- **Conflict Detection**: Identifies scheduling and resource allocation conflicts

## 📖 Usage Guide

### 1. **Upload and Process Data Files**
- **Drag & Drop**: Simply drag CSV or Excel files onto the upload area
- **Auto-Detection**: System automatically detects file type and column structure
- **Smart Mapping**: AI-powered column mapping handles naming variations
- **Sample Data**: Use "Load Sample Data" for quick testing and demos
- **Error Handling**: Clear feedback for file format issues or upload problems

### 2. **Review & Edit Data**
- **Data Type Switching**: Use tabs to navigate between Clients, Workers, and Tasks
- **Inline Editing**: Double-click any cell to edit values directly
- **Real-time Validation**: See validation errors immediately as you edit
- **Visual Indicators**: 
  - 🔴 Red-highlighted rows have validation errors
  - 🟠 Orange-highlighted rows have unsaved changes
- **Bulk Operations**: Select multiple rows for deletion with confirmation dialogs

### 3. **Advanced Search & Filtering**
- **AI Search**: Use natural language queries like "high priority clients" or "workers with JavaScript skills"
- **Error Filtering**: Toggle "Errors Only" to focus on problematic data
- **Real-time Results**: Search results update as you type with debounced queries
- **Clear Results**: Easy search clearing and result management

### 4. **Save and Validate Changes**
- **Smart Save System**: "Save Changes" button tracks unsaved modifications
- **Batch Processing**: Save multiple changes at once with comprehensive validation
- **Status Feedback**: Real-time status messages show save results and validation outcomes
- **Cross-file Validation**: System validates relationships between all data types

### 5. **Create Business Rules**
- **Visual Rule Builder**: Choose from rule types: Co-run, Load Limits, Slot Restrictions, Phase Windows
- **Form-based Configuration**: Use intuitive forms to set rule parameters
- **Priority Management**: Set rule priorities for conflict resolution
- **Template System**: Start with common rule patterns and customize as needed

### 6. **Configure Allocation Priorities**
- **Interactive Sliders**: Adjust allocation priority weights with visual controls
- **Preset Configurations**: Choose from common priority schemes
- **Custom Weights**: Create custom weighting with automatic validation
- **Real-time Validation**: Ensure weights sum to 100% with instant feedback

### 7. **Export and Deploy**
- **Multiple Formats**: Download cleaned CSV files for each data type
- **Rule Export**: Export business rules as JSON configuration files
- **Validation Reports**: Generate comprehensive validation and error reports
- **Production Ready**: Cleaned data ready for production resource allocation systems

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
npm run dev          # Start development server with hot reload
npm run build        # Build for production (Vercel-ready)
npm run start        # Start production server
npm run preview      # Preview production build locally

# Code Quality
npm run lint         # Run ESLint with auto-fix
npm run type-check   # Run TypeScript type checking
npm run format       # Format code with Prettier

# Testing & Validation
npm run test         # Run test suite (if implemented)
npm run validate     # Validate data schemas and configurations
```

## 🚀 Deployment

### Vercel Deployment (Recommended)
This project is optimized for Vercel deployment:

1. **Automatic Deployment**: Connect your GitHub repository to Vercel
2. **Environment Variables**: Configure any required environment variables in Vercel dashboard
3. **Build Optimization**: Project builds successfully with optimized production bundle
4. **Zero Config**: No additional configuration needed for deployment

### Manual Deployment
```bash
# Build the project
npm run build

# The built files will be in the `.next` directory
# Deploy to your preferred hosting platform
```

### Environment Variables
Create a `.env.local` file for local development:
```bash
# Optional: OpenAI API key for enhanced AI features
OPENAI_API_KEY=your-api-key-here

# Optional: Other configuration variables
NEXT_PUBLIC_APP_ENV=development
```

## 🔧 Development & Architecture

### Project Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── globals.css        # Global styles and Tailwind imports
│   ├── layout.tsx         # Root layout with providers
│   └── page.tsx           # Main application page
├── components/             # React components
│   ├── DataGridSection.tsx       # Main data grid with editing
│   ├── FileUploadSection.tsx     # File upload and processing
│   ├── ValidationPanel.tsx       # Validation results display
│   ├── RuleBuilderSection.tsx    # Business rules interface
│   ├── PriorityConfiguration.tsx # Priority weight management
│   └── ExportSection.tsx         # Data export functionality
├── lib/                    # Utility libraries and services
│   ├── fileProcessor.ts           # File parsing and processing
│   ├── validation.ts             # Core validation engine
│   ├── crossFileValidation.ts    # Cross-entity validation
│   ├── aiValidationEngine.ts     # AI-powered validation
│   ├── aiService.ts              # AI integration service
│   └── agGridSetup.ts            # AG-Grid configuration
├── store/                  # Zustand state management
│   └── useAppStore.ts            # Main application store
├── styles/                 # Additional styling
│   └── datagrid.css             # AG-Grid custom styles
└── types/                  # TypeScript definitions
    └── index.ts                  # Core type definitions
```

### Key Design Patterns
- **Component Composition**: Modular components with clear responsibilities
- **State Management**: Centralized Zustand store with computed selectors
- **Error Boundaries**: Graceful error handling throughout the application
- **Performance Optimization**: Memoized components and efficient re-renders
- **Accessibility**: ARIA labels, keyboard navigation, and screen reader support

### Code Quality Standards
- **TypeScript**: Strict type checking with comprehensive type definitions
- **ESLint**: Configured for React, TypeScript, and Next.js best practices
- **Code Formatting**: Consistent formatting with Prettier integration
- **Production Ready**: Optimized builds with warnings instead of blocking errors

## 🤝 Contributing

We welcome contributions to Data Alchemist! Here's how you can help:

### Getting Started
1. **Fork the repository** on GitHub
2. **Clone your fork**: `git clone https://github.com/your-username/data-alchemist.git`
3. **Install dependencies**: `npm install`
4. **Create a feature branch**: `git checkout -b feature/amazing-feature`
5. **Make your changes** and test thoroughly
6. **Commit your changes**: `git commit -m 'feat: add amazing feature'`
7. **Push to your branch**: `git push origin feature/amazing-feature`
8. **Open a Pull Request** with a clear description

### Development Guidelines
- Follow the existing code style and TypeScript patterns
- Add appropriate comments and documentation
- Test your changes with sample data
- Ensure the build passes without errors: `npm run build`
- Update README if adding new features

### Areas for Contribution
- 🐛 **Bug Fixes**: Report and fix issues
- ✨ **New Features**: Enhance functionality and user experience
- 📝 **Documentation**: Improve guides and code comments
- 🎨 **UI/UX**: Enhance the user interface and experience
- ⚡ **Performance**: Optimize performance and bundle size
- 🧪 **Testing**: Add test coverage and validation scenarios

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & Help

### Getting Help
- **GitHub Issues**: [Report bugs or request features](https://github.com/ishahahahan/data-alchemist-digitalyz/issues)
- **Documentation**: Check this README and inline help text
- **Sample Data**: Use provided sample files in `sample-data/` directory

### Common Issues
- **Build Errors**: Ensure you're using Node.js 18+ and all dependencies are installed
- **File Upload Issues**: Check file format (CSV/XLSX) and column headers
- **Validation Errors**: Review the validation panel for detailed error descriptions
- **Performance**: For large datasets, consider filtering or processing in smaller batches

### Feature Requests
We're actively developing Data Alchemist! Feel free to suggest new features or improvements through GitHub Issues.

---

**Made with ❤️ for resource allocation management**

*Transform your messy spreadsheet data into clean, validated datasets with the power of AI.*
