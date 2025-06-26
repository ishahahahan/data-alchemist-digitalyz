# Sample Data Files for Data Alchemist

This directory contains comprehensive sample data files for testing the Data Alchemist application. Each entity type (clients, workers, tasks) has both "valid" and "with-errors" versions in both CSV and XLSX formats.

## File Structure

### Client Data Files
- `clients-sample.csv` / `clients-sample.xlsx` - Valid client data
- `clients-with-errors.csv` / `clients-with-errors.xlsx` - Client data with validation errors

### Worker Data Files
- `workers-sample.csv` / `workers-sample.xlsx` - Valid worker data
- `workers-with-errors.csv` / `workers-with-errors.xlsx` - Worker data with validation errors

### Task Data Files
- `tasks-sample.csv` / `tasks-sample.xlsx` - Valid task data
- `tasks-with-errors.csv` / `tasks-with-errors.xlsx` - Task data with validation errors

## Schema Definitions

### Client Schema
| Column | Type | Required | Description |
|--------|------|----------|-------------|
| ClientID | string | Yes | Unique identifier (format: C001) |
| ClientName | string | Yes | Client company name |
| PriorityLevel | number | Yes | Priority level (1-5) |
| RequestedTaskIDs | string | No | Comma-separated task IDs |
| GroupTag | string | No | Client category (VIP, Premium, Standard, Basic) |
| AttributesJSON | string | No | JSON string with additional attributes |

### Worker Schema
| Column | Type | Required | Description |
|--------|------|----------|-------------|
| WorkerID | string | Yes | Unique identifier (format: W001) |
| WorkerName | string | Yes | Worker full name |
| Skills | string | Yes | Comma-separated skill list |
| AvailableSlots | string | Yes | Array notation like "[1,3,5]" for phases |
| MaxLoadPerPhase | number | Yes | Maximum tasks per phase |
| WorkerGroup | string | Yes | For grouping workers in rules |
| QualificationLevel | number | Yes | Skill level indicator (1-5) |

### Task Schema
| Column | Type | Required | Description |
|--------|------|----------|-------------|
| TaskID | string | Yes | Unique identifier (format: T001) |
| TaskName | string | Yes | Task title |
| Category | string | Yes | Task category/type |
| Duration | number | Yes | Number of phases (minimum 1) |
| RequiredSkills | string | Yes | Comma-separated required skills |
| PreferredPhases | string | Yes | Range "1-3" or array "[2,4,5]" |
| MaxConcurrent | number | Yes | Maximum parallel assignments |

## Validation Errors in "with-errors" Files

The error files contain intentional validation issues to test the 9 implemented validation rules:

### ❌ **Critical Error Rules** (Block Processing)
1. **Missing Required Columns** - Missing essential columns for each entity type
2. **Duplicate IDs** - Non-unique identifier values within datasets
3. **Malformed Lists** - Invalid array formats in AvailableSlots and PreferredPhases
4. **Out of Range Values** - Priority levels outside 1-5 range, Duration < 1
5. **Broken JSON** - Malformed JSON in AttributesJSON fields
6. **Unknown References** - Client RequestedTaskIDs referencing non-existent tasks

### ⚠️ **Warning Rules** (Advisory Issues)
7. **Overloaded Workers** - MaxLoadPerPhase exceeds available time slots
8. **Skill Coverage** - Tasks requiring skills not available in any worker
9. **Max-Concurrency Feasibility** - MaxConcurrent exceeds qualified workers

### Specific Error Examples
- **Duplicate IDs**: Same ClientID, WorkerID, or TaskID appears multiple times
- **Invalid JSON**: Malformed JSON syntax in AttributesJSON fields
- **Array Format Issues**: Invalid AvailableSlots like "1,2,3" instead of "[1,2,3]"
- **Range Violations**: PriorityLevel values like 0, 6, or 10 (must be 1-5)
- **Missing Skills**: Tasks requiring skills like "Blockchain" when no worker has it
- **Capacity Issues**: Worker with MaxLoadPerPhase=5 but AvailableSlots="[1,2]" (only 2 slots)

## Usage for Testing

### Upload Testing
1. Use the valid files to test successful data upload and processing
2. Use the error files to test validation rules and error handling
3. Test both CSV and XLSX formats to ensure file processor compatibility

### Validation Testing
Each error file is designed to trigger specific validation rules:
- Upload `clients-with-errors.csv` to test client validation rules
- Upload `workers-with-errors.csv` to test worker validation rules  
- Upload `tasks-with-errors.csv` to test task validation rules

### Integration Testing
1. Upload valid client data first
2. Upload valid worker data second
3. Upload valid task data third
4. Test cross-references between entities (TaskIDs in clients, Skills matching, etc.)

### Rule Builder Testing
Use combinations of valid and error data to:
- Create custom validation rules
- Test priority configuration
- Validate business rule enforcement
- Test data transformation rules

## Data Relationships

The sample data includes realistic relationships:
- Clients reference TaskIDs that exist in the task data
- Tasks require skills that workers possess
- Priority levels are distributed across different client tiers
- Workers have varied skill sets and experience levels

## File Format Notes

- **CSV Files**: UTF-8 encoded, comma-separated
- **XLSX Files**: Standard Excel format, single worksheet
- **JSON Fields**: Properly escaped JSON strings in AttributesJSON columns
- **Date Fields**: ISO 8601 format (YYYY-MM-DD)
- **List Fields**: Comma-separated values (e.g., "skill1,skill2,skill3")

## Testing Workflow

1. **Start with Valid Data**: Upload valid files to ensure core functionality
2. **Test Error Handling**: Upload error files to verify validation rules
3. **Test Mixed Scenarios**: Combine valid and invalid data
4. **Test File Formats**: Alternate between CSV and XLSX uploads
5. **Test Relationships**: Verify cross-entity references work correctly

This comprehensive sample data set ensures thorough testing of all Data Alchemist features including file upload, validation, data grid display, rule building, and export functionality.
