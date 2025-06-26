// Core data type definitions for the Data Alchemist application

export interface Client {
  ClientID: string;           // Unique identifier
  ClientName: string;         // Display name
  PriorityLevel: number;      // Integer 1-5, higher = more important
  RequestedTaskIDs: string;   // Comma-separated TaskIDs
  GroupTag: string;           // For grouping clients in rules
  AttributesJSON: string;     // JSON metadata as string
}

export interface Worker {
  WorkerID: string;           // Unique identifier
  WorkerName: string;         // Display name
  Skills: string;             // Comma-separated skill tags
  AvailableSlots: string;     // Array notation like "[1,3,5]" for phases
  MaxLoadPerPhase: number;    // Maximum tasks per phase
  WorkerGroup: string;        // For grouping workers in rules
  QualificationLevel: number; // Skill level indicator
}

export interface Task {
  TaskID: string;             // Unique identifier
  TaskName: string;           // Display name
  Category: string;           // Task category/type
  Duration: number;           // Number of phases (minimum 1)
  RequiredSkills: string;     // Comma-separated required skills
  PreferredPhases: string;    // Range "1-3" or array "[2,4,5]"
  MaxConcurrent: number;      // Maximum parallel assignments
}

// Validation system types
export interface ValidationError {
  type: string;
  message: string;
  affectedRows: number[];
  affectedColumns: string[];
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// Business rules types
export interface BusinessRule {
  id: string;
  type: 'coRun' | 'loadLimit' | 'slotRestriction' | 'phaseWindow' | 'patternMatch' | 'precedenceOverride';
  name: string;
  priority: number;
  [key: string]: any; // Allow additional properties based on rule type
}

export interface CoRunRule extends BusinessRule {
  type: 'coRun';
  tasks: string[];
}

export interface LoadLimitRule extends BusinessRule {
  type: 'loadLimit';
  workerGroup: string;
  maxSlotsPerPhase: number;
}

export interface SlotRestrictionRule extends BusinessRule {
  type: 'slotRestriction';
  clientGroup: string;
  maxSlots: number;
  phase?: number;
}

export interface PhaseWindowRule extends BusinessRule {
  type: 'phaseWindow';
  taskIDs: string[];
  allowedPhases: number[];
}

export interface RulesConfiguration {
  rules: BusinessRule[];
  priorities: {
    clientPriority: number;
    workerFairness: number;
    taskUrgency: number;
    resourceEfficiency: number;
  };
}

// File upload types
export type FileType = 'clients' | 'workers' | 'tasks';

export interface FileUploadState {
  file: File | null;
  data: any[] | null;
  isProcessing: boolean;
  error: string | null;
  validationResult: ValidationResult | null;
}

// Application state types
export interface AppState {
  clients: {
    data: Client[];
    uploadState: FileUploadState;
  };
  workers: {
    data: Worker[];
    uploadState: FileUploadState;
  };
  tasks: {
    data: Task[];
    uploadState: FileUploadState;
  };
  rules: BusinessRule[];
  priorities: {
    clientPriority: number;
    workerFairness: number;
    taskUrgency: number;
    resourceEfficiency: number;
  };
}
