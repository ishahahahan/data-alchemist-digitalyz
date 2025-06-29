# Data Alchemist

## AI-Powered Resource Allocation Configurator

Transform messy spreadsheet data into clean, validated datasets with AI-powered features. This Next.js application helps you upload, validate, edit, and configure business rules for client-worker-task resource allocation systems.

## ✨ Key Features

### 📊 **Data Management**
- **File Upload**: Drag-and-drop CSV/XLSX files with automatic column mapping
- **Real-time Editing**: Edit data directly in interactive tables with immediate validation
- **Bulk Operations**: Select and delete multiple rows with confirmation dialogs
- **Unsaved Changes Tracking**: Visual indicators for modified data with batch save functionality

### 🔍 **AI-Powered Search**
- **Natural Language Search**: Query data using plain English (powered by Google Gemini AI)
- **Smart Filtering**: Filter by errors, search results, or data type
- **Fallback Search**: Works without API key using local pattern matching

### ✅ **Validation Engine**
- **Real-time Validation**: 12+ validation rules with cross-file relationship checking
- **Visual Error Indicators**: Color-coded rows (red=errors, orange=unsaved changes)
- **Detailed Error Reporting**: Grouped validation results with affected row tracking

### 🛠️ **Business Rules & Export**
- **Rule Builder**: Create allocation rules without coding
- **Priority Configuration**: Adjust allocation weights with interactive sliders
- **Export System**: Download cleaned CSV files and JSON rule configurations

## 🛠️ Technology Stack

- **Framework**: Next.js 15 with App Router and TypeScript
- **Styling**: Tailwind CSS with responsive design
- **State Management**: Zustand for application state
- **Data Grid**: AG-Grid React for interactive tables
- **File Processing**: PapaParse (CSV) + xlsx (Excel)
- **AI Service**: Google Gemini AI for natural language search
- **Deployment**: Optimized for Vercel deployment

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

The application implements 12+ validation rules with real-time feedback:

### ❌ **Critical Errors** (Must Fix)
1. **Missing Required Columns** - Essential columns must exist
2. **Duplicate IDs** - IDs must be unique within each dataset
3. **Malformed Data** - Invalid JSON, arrays, or data formats
4. **Out-of-Range Values** - Priority (1-5), Duration (≥1), etc.
5. **Unknown References** - RequestedTaskIDs must reference existing tasks
6. **Invalid Skills Format** - Skills must be properly formatted

### ⚠️ **Warnings** (Advisory)
7. **Worker Overload** - Worker capacity vs task assignments
8. **Skill Coverage** - Required skills availability in worker pool
9. **Concurrency Conflicts** - Max concurrent assignment validation
10. **Cross-file Dependencies** - Relationship validation between data types

## 📖 Usage Guide

### 1. **Upload Data Files**
- Drag CSV or Excel files to the upload area
- System automatically detects columns and maps data
- Use "Load Sample Data" button for quick testing

### 2. **Edit and Validate Data**
- Switch between Clients, Workers, and Tasks tabs
- Double-click cells to edit values
- Save changes to trigger comprehensive validation
- Red rows = validation errors, Orange rows = unsaved changes

### 3. **Search and Filter**
- Use AI search: "high priority clients" or "workers with JavaScript skills"
- Toggle "Errors Only" to focus on problematic data
- Search works without API key using local pattern matching

### 4. **Configure Business Rules**
- Create allocation rules using the visual rule builder
- Set priority weights with interactive sliders
- Export rules as JSON configuration files

### 5. **Export Clean Data**
- Download validated CSV files for each data type
- Export business rules and validation reports

## File Formats & Sample Data

### Supported Formats
- CSV (.csv) and Excel (.xlsx, .xls)
- Automatic column header mapping (handles variations like `Client ID`, `ClientID`, `client_id`)
- JSON array format for lists: `[1,2,3]` or `["skill1","skill2"]`

### Sample Data
Use files in `sample-data/` directory:
- **Valid data**: `clients-sample`, `workers-sample`, `tasks-sample`
- **Error data**: `*-with-errors` files for testing validation

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
git clone https://github.com/ishahahahan/data-alchemist-digitalyz.git
cd data-alchemist
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the application.

### Environment Variables (Optional)
For enhanced AI search features, add to `.env.local`:
```bash
GEMINI_API_KEY=your-google-gemini-api-key
```
*Note: The app works without API key using fallback search.*

### Deployment
Optimized for Vercel:
```bash
npm run build  # Builds successfully with warnings
```
Deploy to Vercel by connecting your GitHub repository.

## Development

### Available Scripts
```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint checking
```

### Project Structure
```
src/
├── app/                    # Next.js App Router
├── components/             # React components
│   ├── DataGridSection.tsx       # Main data editing interface
│   ├── FileUploadSection.tsx     # File upload and processing
│   ├── ValidationPanel.tsx       # Validation results display
│   └── ...
├── lib/                    # Core logic and services
│   ├── aiService.ts              # Gemini AI integration
│   ├── validation.ts             # Validation engine
│   └── fileProcessor.ts          # File parsing
├── store/                  # Zustand state management
└── types/                  # TypeScript definitions
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/name`
3. Make your changes and test with `npm run build`
4. Commit: `git commit -m 'feat: description'`
5. Push and create a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Transform your spreadsheet data into clean, validated datasets with AI-powered assistance.**
