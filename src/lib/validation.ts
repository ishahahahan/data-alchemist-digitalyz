import { Client, Worker, Task, ValidationResult, ValidationError, GroupedValidationError } from '@/types';

export class ValidationEngine {
  private clients: Client[] = [];
  private workers: Worker[] = [];
  private tasks: Task[] = [];

  constructor(clients: Client[] = [], workers: Worker[] = [], tasks: Task[] = []) {
    this.clients = clients;
    this.workers = workers;
    this.tasks = tasks;
  }

  // Main validation method
  validateAll(): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Run all validation rules
    errors.push(...this.validateMissingRequiredColumns());
    errors.push(...this.validateDuplicateIDs());
    errors.push(...this.validateMalformedLists());
    errors.push(...this.validateOutOfRange());
    errors.push(...this.validateBrokenJSON());
    errors.push(...this.validateUnknownReferences());
    warnings.push(...this.validateOverloadedWorkers());
    warnings.push(...this.validateSkillCoverage());
    warnings.push(...this.validateMaxConcurrencyFeasibility());

    // Group errors by type
    const groupedErrors = this.groupValidationErrors(errors);
    const groupedWarnings = this.groupValidationErrors(warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      groupedErrors,
      groupedWarnings,
    };
  }

  // Group validation errors by type
  private groupValidationErrors(validationErrors: ValidationError[]): GroupedValidationError[] {
    const groupMap = new Map<string, GroupedValidationError>();

    validationErrors.forEach(error => {
      const key = error.type;
      
      if (groupMap.has(key)) {
        const existing = groupMap.get(key)!;
        existing.count += 1;
        existing.affectedRows.push(...error.affectedRows);
        existing.affectedColumns.push(...error.affectedColumns);
        
        // Add example details (limit to 3 examples)
        if (existing.examples.length < 3 && error.details) {
          existing.examples.push(error.details);
        }
      } else {
        groupMap.set(key, {
          type: error.type,
          message: error.message,
          severity: error.severity,
          count: 1,
          affectedRows: [...error.affectedRows],
          affectedColumns: [...error.affectedColumns],
          examples: error.details ? [error.details] : []
        });
      }
    });

    // Remove duplicates and sort arrays
    groupMap.forEach(group => {
      group.affectedRows = [...new Set(group.affectedRows)].sort((a, b) => a - b);
      group.affectedColumns = [...new Set(group.affectedColumns)];
    });

    return Array.from(groupMap.values()).sort((a, b) => b.count - a.count);
  }

  // Validation Rule 1: Missing Required Columns
  private validateMissingRequiredColumns(): ValidationError[] {
    const errors: ValidationError[] = [];
    
    const requiredClientColumns = ['ClientID', 'ClientName', 'PriorityLevel', 'RequestedTaskIDs', 'GroupTag', 'AttributesJSON'];
    const requiredWorkerColumns = ['WorkerID', 'WorkerName', 'Skills', 'AvailableSlots', 'MaxLoadPerPhase', 'WorkerGroup', 'QualificationLevel'];
    const requiredTaskColumns = ['TaskID', 'TaskName', 'Category', 'Duration', 'RequiredSkills', 'PreferredPhases', 'MaxConcurrent'];

    // Check clients
    if (this.clients.length > 0) {
      const clientKeys = Object.keys(this.clients[0]);
      const missingClientCols = requiredClientColumns.filter(col => !clientKeys.includes(col));
      if (missingClientCols.length > 0) {
        errors.push({
          type: 'missing_columns',
          message: `Missing required client columns: ${missingClientCols.join(', ')}`,
          affectedRows: [],
          affectedColumns: missingClientCols,
          severity: 'error',
        });
      }
    }

    // Check workers
    if (this.workers.length > 0) {
      const workerKeys = Object.keys(this.workers[0]);
      const missingWorkerCols = requiredWorkerColumns.filter(col => !workerKeys.includes(col));
      if (missingWorkerCols.length > 0) {
        errors.push({
          type: 'missing_columns',
          message: `Missing required worker columns: ${missingWorkerCols.join(', ')}`,
          affectedRows: [],
          affectedColumns: missingWorkerCols,
          severity: 'error',
        });
      }
    }

    // Check tasks
    if (this.tasks.length > 0) {
      const taskKeys = Object.keys(this.tasks[0]);
      const missingTaskCols = requiredTaskColumns.filter(col => !taskKeys.includes(col));
      if (missingTaskCols.length > 0) {
        errors.push({
          type: 'missing_columns',
          message: `Missing required task columns: ${missingTaskCols.join(', ')}`,
          affectedRows: [],
          affectedColumns: missingTaskCols,
          severity: 'error',
        });
      }
    }

    return errors;
  }

  // Validation Rule 2: Duplicate IDs
  private validateDuplicateIDs(): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check duplicate ClientIDs
    const clientIDs = this.clients.map(c => c.ClientID);
    const duplicateClientIDs = this.findDuplicates(clientIDs);
    if (duplicateClientIDs.length > 0) {
      const affectedRows = this.clients
        .map((client, index) => duplicateClientIDs.includes(client.ClientID) ? index : -1)
        .filter(index => index !== -1);
      
      errors.push({
        type: 'duplicate_ids',
        message: `Duplicate Client IDs found: ${duplicateClientIDs.join(', ')}`,
        affectedRows,
        affectedColumns: ['ClientID'],
        severity: 'error',
        details: `Found ${duplicateClientIDs.length} duplicate Client IDs. Each client must have a unique identifier.`
      });
    }

    // Check duplicate WorkerIDs
    const workerIDs = this.workers.map(w => w.WorkerID);
    const duplicateWorkerIDs = this.findDuplicates(workerIDs);
    if (duplicateWorkerIDs.length > 0) {
      const affectedRows = this.workers
        .map((worker, index) => duplicateWorkerIDs.includes(worker.WorkerID) ? index : -1)
        .filter(index => index !== -1);
      
      errors.push({
        type: 'duplicate_ids',
        message: `Duplicate Worker IDs found: ${duplicateWorkerIDs.join(', ')}`,
        affectedRows,
        affectedColumns: ['WorkerID'],
        severity: 'error',
      });
    }

    // Check duplicate TaskIDs
    const taskIDs = this.tasks.map(t => t.TaskID);
    const duplicateTaskIDs = this.findDuplicates(taskIDs);
    if (duplicateTaskIDs.length > 0) {
      const affectedRows = this.tasks
        .map((task, index) => duplicateTaskIDs.includes(task.TaskID) ? index : -1)
        .filter(index => index !== -1);
      
      errors.push({
        type: 'duplicate_ids',
        message: `Duplicate Task IDs found: ${duplicateTaskIDs.join(', ')}`,
        affectedRows,
        affectedColumns: ['TaskID'],
        severity: 'error',
      });
    }

    return errors;
  }

  // Validation Rule 3: Malformed Lists
  private validateMalformedLists(): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check AvailableSlots format
    this.workers.forEach((worker, index) => {
      if (!this.isValidArrayString(worker.AvailableSlots)) {
        errors.push({
          type: 'malformed_list',
          message: `Invalid AvailableSlots format for worker ${worker.WorkerID}. Expected array format like "[1,2,3]"`,
          affectedRows: [index],
          affectedColumns: ['AvailableSlots'],
          severity: 'error',
        });
      }
    });

    // Check PreferredPhases format
    this.tasks.forEach((task, index) => {
      if (!this.isValidArrayString(task.PreferredPhases) && !this.isValidRangeString(task.PreferredPhases)) {
        errors.push({
          type: 'malformed_list',
          message: `Invalid PreferredPhases format for task ${task.TaskID}. Expected array "[1,2,3]" or range "1-3" format`,
          affectedRows: [index],
          affectedColumns: ['PreferredPhases'],
          severity: 'error',
        });
      }
    });

    return errors;
  }

  // Validation Rule 4: Out-of-Range Values
  private validateOutOfRange(): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check PriorityLevel (1-5)
    this.clients.forEach((client, index) => {
      if (client.PriorityLevel < 1 || client.PriorityLevel > 5) {
        errors.push({
          type: 'out_of_range',
          message: `PriorityLevel must be between 1-5 for client ${client.ClientID}`,
          affectedRows: [index],
          affectedColumns: ['PriorityLevel'],
          severity: 'error',
        });
      }
    });

    // Check Duration (>= 1)
    this.tasks.forEach((task, index) => {
      if (task.Duration < 1) {
        errors.push({
          type: 'out_of_range',
          message: `Duration must be >= 1 for task ${task.TaskID}`,
          affectedRows: [index],
          affectedColumns: ['Duration'],
          severity: 'error',
        });
      }
    });

    return errors;
  }

  // Validation Rule 5: Broken JSON
  private validateBrokenJSON(): ValidationError[] {
    const errors: ValidationError[] = [];

    this.clients.forEach((client, index) => {
      try {
        JSON.parse(client.AttributesJSON);
      } catch (e) {
        errors.push({
          type: 'broken_json',
          message: `Invalid JSON in AttributesJSON for client ${client.ClientID}`,
          affectedRows: [index],
          affectedColumns: ['AttributesJSON'],
          severity: 'error',
        });
      }
    });

    return errors;
  }

  // Validation Rule 6: Unknown References
  private validateUnknownReferences(): ValidationError[] {
    const errors: ValidationError[] = [];
    const taskIDs = new Set(this.tasks.map(t => t.TaskID));

    this.clients.forEach((client, index) => {
      const requestedTasks = client.RequestedTaskIDs.split(',').map(id => id.trim());
      const unknownTasks = requestedTasks.filter(taskId => taskId && !taskIDs.has(taskId));
      
      if (unknownTasks.length > 0) {
        errors.push({
          type: 'unknown_reference',
          message: `Client ${client.ClientID} references unknown tasks: ${unknownTasks.join(', ')}`,
          affectedRows: [index],
          affectedColumns: ['RequestedTaskIDs'],
          severity: 'error',
        });
      }
    });

    return errors;
  }

  // Validation Rule 9: Overloaded Workers
  private validateOverloadedWorkers(): ValidationError[] {
    const warnings: ValidationError[] = [];

    this.workers.forEach((worker, index) => {
      try {
        const availableSlots = JSON.parse(worker.AvailableSlots);
        if (Array.isArray(availableSlots) && availableSlots.length < worker.MaxLoadPerPhase) {
          warnings.push({
            type: 'overloaded_worker',
            message: `Worker ${worker.WorkerID} has MaxLoadPerPhase (${worker.MaxLoadPerPhase}) greater than available slots (${availableSlots.length})`,
            affectedRows: [index],
            affectedColumns: ['MaxLoadPerPhase', 'AvailableSlots'],
            severity: 'warning',
          });
        }
      } catch (e) {
        // Skip if AvailableSlots is malformed (will be caught by other validation)
      }
    });

    return warnings;
  }

  // Validation Rule 11: Skill Coverage
  private validateSkillCoverage(): ValidationError[] {
    const warnings: ValidationError[] = [];
    
    // Get all worker skills
    const workerSkills = new Set<string>();
    this.workers.forEach(worker => {
      const skills = worker.Skills.split(',').map(s => s.trim());
      skills.forEach(skill => workerSkills.add(skill));
    });

    // Check if all required skills are covered
    this.tasks.forEach((task, index) => {
      const requiredSkills = task.RequiredSkills.split(',').map(s => s.trim());
      const uncoveredSkills = requiredSkills.filter(skill => skill && !workerSkills.has(skill));
      
      if (uncoveredSkills.length > 0) {
        warnings.push({
          type: 'skill_coverage',
          message: `Task ${task.TaskID} requires skills not available in any worker: ${uncoveredSkills.join(', ')}`,
          affectedRows: [index],
          affectedColumns: ['RequiredSkills'],
          severity: 'warning',
        });
      }
    });

    return warnings;
  }

  // Validation Rule 12: Max-concurrency Feasibility
  private validateMaxConcurrencyFeasibility(): ValidationError[] {
    const warnings: ValidationError[] = [];

    this.tasks.forEach((task, index) => {
      // Count workers with required skills
      const requiredSkills = task.RequiredSkills.split(',').map(s => s.trim());
      const qualifiedWorkers = this.workers.filter(worker => {
        const workerSkills = worker.Skills.split(',').map(s => s.trim());
        return requiredSkills.every(skill => workerSkills.includes(skill));
      });

      if (task.MaxConcurrent > qualifiedWorkers.length) {
        warnings.push({
          type: 'max_concurrency_feasibility',
          message: `Task ${task.TaskID} MaxConcurrent (${task.MaxConcurrent}) exceeds qualified workers (${qualifiedWorkers.length})`,
          affectedRows: [index],
          affectedColumns: ['MaxConcurrent'],
          severity: 'warning',
        });
      }
    });

    return warnings;
  }

  // Helper methods
  private findDuplicates<T>(array: T[]): T[] {
    const seen = new Set<T>();
    const duplicates = new Set<T>();
    
    array.forEach(item => {
      if (seen.has(item)) {
        duplicates.add(item);
      } else {
        seen.add(item);
      }
    });
    
    return Array.from(duplicates);
  }

  private isValidArrayString(str: string): boolean {
    try {
      const parsed = JSON.parse(str);
      return Array.isArray(parsed) && parsed.every(item => typeof item === 'number');
    } catch {
      return false;
    }
  }

  private isValidRangeString(str: string): boolean {
    const rangePattern = /^\d+-\d+$/;
    return rangePattern.test(str.trim());
  }
}
