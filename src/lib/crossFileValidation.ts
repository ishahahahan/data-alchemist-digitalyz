import { Client, Worker, Task, ValidationError, BusinessRule } from '@/types';

export interface CrossFileValidationResult {
  errors: ValidationError[];
  warnings: ValidationError[];
  businessRuleViolations: ValidationError[];
}

/**
 * Advanced Cross-File Validation Engine
 * Validates relationships and dependencies between clients, workers, and tasks
 */
export class CrossFileValidationEngine {
  private clients: Client[] = [];
  private workers: Worker[] = [];
  private tasks: Task[] = [];
  private businessRules: BusinessRule[] = [];

  constructor(
    clients: Client[] = [], 
    workers: Worker[] = [], 
    tasks: Task[] = [],
    businessRules: BusinessRule[] = []
  ) {
    this.clients = clients;
    this.workers = workers;
    this.tasks = tasks;
    this.businessRules = businessRules;
  }

  /**
   * Main validation method that runs all cross-file checks
   */
  validateAll(): CrossFileValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const businessRuleViolations: ValidationError[] = [];

    // Only run cross-file validation if we have data from multiple files
    if (this.hasMultipleDataSources()) {
      // Critical errors
      errors.push(...this.validateUnknownReferences());
      errors.push(...this.validateInvalidPhaseReferences());
      
      // Performance and capacity warnings
      warnings.push(...this.validateSkillCoverageGaps());
      warnings.push(...this.validateMaxConcurrencyViolations());
      warnings.push(...this.validateOverloadedWorkers());
      warnings.push(...this.validatePhaseSlotSaturation());
      
      // Business rule violations
      businessRuleViolations.push(...this.validateCircularCoRunDependencies());
      businessRuleViolations.push(...this.validateSlotRestrictionRules());
    }

    return {
      errors,
      warnings,
      businessRuleViolations
    };
  }

  /**
   * 1. Unknown References - Check if task IDs in clients exist in tasks
   */
  private validateUnknownReferences(): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (this.clients.length === 0 || this.tasks.length === 0) return errors;

    const taskIds = new Set(this.tasks.map(task => task.TaskID));
    
    this.clients.forEach((client, clientIndex) => {
      if (!client.RequestedTaskIDs) return;
      
      // Parse requested task IDs (handle both comma-separated and array formats)
      let requestedTasks: string[] = [];
      try {
        if (typeof client.RequestedTaskIDs === 'string') {
          if (client.RequestedTaskIDs.startsWith('[')) {
            // Array format: ["T1", "T2", "T3"]
            requestedTasks = JSON.parse(client.RequestedTaskIDs);
          } else {
            // Comma-separated format: "T1,T2,T3"
            requestedTasks = client.RequestedTaskIDs.split(',').map(id => id.trim());
          }
        } else if (Array.isArray(client.RequestedTaskIDs)) {
          requestedTasks = client.RequestedTaskIDs;
        }
      } catch (e) {
        // If parsing fails, treat as comma-separated string
        requestedTasks = String(client.RequestedTaskIDs).split(',').map(id => id.trim());
      }

      const unknownTasks = requestedTasks.filter(taskId => taskId && !taskIds.has(taskId));
      
      if (unknownTasks.length > 0) {
        errors.push({
          type: 'unknown_reference',
          message: `Client ${client.ClientID} (${client.ClientName}) references unknown task(s): ${unknownTasks.join(', ')}`,
          affectedRows: [clientIndex],
          affectedColumns: ['RequestedTaskIDs'],
          severity: 'error',
          details: `Unknown tasks: ${unknownTasks.join(', ')}. Available tasks: ${Array.from(taskIds).join(', ')}`
        });
      }
    });

    return errors;
  }

  /**
   * 2. Skill Coverage Gap - Check if task skills are covered by workers
   */
  private validateSkillCoverageGaps(): ValidationError[] {
    const warnings: ValidationError[] = [];
    
    if (this.tasks.length === 0 || this.workers.length === 0) return warnings;

    // Collect all worker skills
    const workerSkills = new Set<string>();
    this.workers.forEach(worker => {
      if (worker.Skills) {
        const skills = worker.Skills.toLowerCase().split(/[,;]/).map(s => s.trim());
        skills.forEach(skill => workerSkills.add(skill));
      }
    });

    this.tasks.forEach((task, taskIndex) => {
      if (!task.RequiredSkills) return;
      
      const requiredSkills = task.RequiredSkills.toLowerCase().split(/[,;]/).map(s => s.trim());
      const uncoveredSkills = requiredSkills.filter(skill => skill && !workerSkills.has(skill));
      
      if (uncoveredSkills.length > 0) {
        warnings.push({
          type: 'skill_coverage_gap',
          message: `Task ${task.TaskID} (${task.TaskName}) requires skill(s) not covered by any worker: ${uncoveredSkills.join(', ')}`,
          affectedRows: [taskIndex],
          affectedColumns: ['RequiredSkills'],
          severity: 'warning',
          details: `Uncovered skills: ${uncoveredSkills.join(', ')}. Available skills: ${Array.from(workerSkills).join(', ')}`
        });
      }
    });

    return warnings;
  }

  /**
   * 3. Max-Concurrency Violation - Check if enough qualified workers exist
   */
  private validateMaxConcurrencyViolations(): ValidationError[] {
    const warnings: ValidationError[] = [];
    
    if (this.tasks.length === 0 || this.workers.length === 0) return warnings;

    this.tasks.forEach((task, taskIndex) => {
      if (!task.MaxConcurrent || !task.RequiredSkills || !task.PreferredPhases) return;

      const requiredSkills = task.RequiredSkills.toLowerCase().split(/[,;]/).map(s => s.trim());
      const preferredPhases = this.parsePhases(task.PreferredPhases);
      
      // Find qualified workers (have required skills and available in preferred phases)
      const qualifiedWorkers = this.workers.filter(worker => {
        // Check skills
        const workerSkills = worker.Skills ? worker.Skills.toLowerCase().split(/[,;]/).map(s => s.trim()) : [];
        const hasRequiredSkills = requiredSkills.every(skill => 
          workerSkills.some(workerSkill => workerSkill.includes(skill) || skill.includes(workerSkill))
        );
        
        if (!hasRequiredSkills) return false;
        
        // Check availability in preferred phases
        const workerSlots = this.parseSlots(worker.AvailableSlots);
        const hasOverlappingPhases = preferredPhases.some(phase => workerSlots.includes(phase));
        
        return hasOverlappingPhases;
      });

      if (qualifiedWorkers.length < task.MaxConcurrent) {
        warnings.push({
          type: 'max_concurrency_violation',
          message: `Task ${task.TaskID} requests MaxConcurrent = ${task.MaxConcurrent}, but only ${qualifiedWorkers.length} qualified workers available in phases ${preferredPhases.join(',')}`,
          affectedRows: [taskIndex],
          affectedColumns: ['MaxConcurrent', 'RequiredSkills', 'PreferredPhases'],
          severity: 'warning',
          details: `Qualified workers: ${qualifiedWorkers.map(w => w.WorkerID).join(', ')}`
        });
      }
    });

    return warnings;
  }

  /**
   * 4. Overloaded Workers - Check worker capacity vs potential task assignments
   */
  private validateOverloadedWorkers(): ValidationError[] {
    const warnings: ValidationError[] = [];
    
    if (this.workers.length === 0 || this.tasks.length === 0) return warnings;

    this.workers.forEach((worker, workerIndex) => {
      if (!worker.MaxLoadPerPhase || !worker.AvailableSlots) return;

      const workerSkills = worker.Skills ? worker.Skills.toLowerCase().split(/[,;]/).map(s => s.trim()) : [];
      const availableSlots = this.parseSlots(worker.AvailableSlots);
      
      // Group by phase
      availableSlots.forEach(phase => {
        const eligibleTasks = this.tasks.filter(task => {
          // Check if worker has required skills
          const requiredSkills = task.RequiredSkills ? task.RequiredSkills.toLowerCase().split(/[,;]/).map(s => s.trim()) : [];
          const hasRequiredSkills = requiredSkills.length === 0 || requiredSkills.every(skill => 
            workerSkills.some(workerSkill => workerSkill.includes(skill) || skill.includes(workerSkill))
          );
          
          if (!hasRequiredSkills) return false;
          
          // Check if task prefers this phase
          const taskPhases = this.parsePhases(task.PreferredPhases);
          return taskPhases.includes(phase);
        });

        if (eligibleTasks.length > worker.MaxLoadPerPhase) {
          warnings.push({
            type: 'overloaded_worker',
            message: `Worker ${worker.WorkerID} has MaxLoadPerPhase: ${worker.MaxLoadPerPhase}, but is eligible for ${eligibleTasks.length} tasks in phase ${phase}`,
            affectedRows: [workerIndex],
            affectedColumns: ['MaxLoadPerPhase', 'AvailableSlots'],
            severity: 'warning',
            details: `Eligible tasks in phase ${phase}: ${eligibleTasks.map(t => t.TaskID).join(', ')}`
          });
        }
      });
    });

    return warnings;
  }

  /**
   * 5. Phase-Slot Saturation - Check if phase capacity can handle all tasks
   */
  private validatePhaseSlotSaturation(): ValidationError[] {
    const warnings: ValidationError[] = [];
    
    if (this.tasks.length === 0 || this.workers.length === 0) return warnings;

    // Calculate available slots per phase
    const phaseCapacity = new Map<number, number>();
    this.workers.forEach(worker => {
      const slots = this.parseSlots(worker.AvailableSlots);
      slots.forEach(phase => {
        phaseCapacity.set(phase, (phaseCapacity.get(phase) || 0) + 1);
      });
    });

    // Calculate required capacity per phase
    const phaseRequirement = new Map<number, number>();
    this.tasks.forEach(task => {
      const phases = this.parsePhases(task.PreferredPhases);
      const duration = task.Duration || 1;
      
      phases.forEach(phase => {
        phaseRequirement.set(phase, (phaseRequirement.get(phase) || 0) + duration);
      });
    });

    // Check for oversaturation
    phaseRequirement.forEach((required, phase) => {
      const available = phaseCapacity.get(phase) || 0;
      
      if (required > available) {
        warnings.push({
          type: 'phase_slot_saturation',
          message: `Phase ${phase} has ${required} task-duration units required, but only ${available} available worker slots`,
          affectedRows: [],
          affectedColumns: ['PreferredPhases', 'Duration', 'AvailableSlots'],
          severity: 'warning',
          details: `Phase ${phase}: Required=${required}, Available=${available}, Deficit=${required - available}`
        });
      }
    });

    return warnings;
  }

  /**
   * 6. Circular Co-Run Dependencies - Check for circular references in business rules
   */
  private validateCircularCoRunDependencies(): ValidationError[] {
    const violations: ValidationError[] = [];
    
    const coRunRules = this.businessRules.filter(rule => rule.type === 'coRun');
    if (coRunRules.length === 0) return violations;

    // Build dependency graph
    const graph = new Map<string, Set<string>>();
    
    coRunRules.forEach(rule => {
      if ('taskIds' in rule && Array.isArray(rule.taskIds)) {
        const taskIds = rule.taskIds as string[];
        taskIds.forEach(taskId => {
          if (!graph.has(taskId)) {
            graph.set(taskId, new Set());
          }
          // Each task depends on all other tasks in the co-run group
          taskIds.forEach(otherTaskId => {
            if (taskId !== otherTaskId) {
              graph.get(taskId)!.add(otherTaskId);
            }
          });
        });
      }
    });

    // Detect cycles using DFS
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const hasCycle = (node: string): boolean => {
      if (recursionStack.has(node)) return true;
      if (visited.has(node)) return false;
      
      visited.add(node);
      recursionStack.add(node);
      
      const neighbors = graph.get(node) || new Set();
      for (const neighbor of neighbors) {
        if (hasCycle(neighbor)) return true;
      }
      
      recursionStack.delete(node);
      return false;
    };

    for (const node of graph.keys()) {
      if (!visited.has(node) && hasCycle(node)) {
        violations.push({
          type: 'circular_corun_dependency',
          message: `Circular co-run dependency detected involving task ${node}`,
          affectedRows: [],
          affectedColumns: [],
          severity: 'error',
          details: `Circular dependency in co-run rules involving task ${node}`
        });
        break; // Only report first cycle found
      }
    }

    return violations;
  }

  /**
   * 7. Invalid Phase References in Tasks
   */
  private validateInvalidPhaseReferences(): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (this.tasks.length === 0 || this.workers.length === 0) return errors;

    // Collect all available phases from workers
    const availablePhases = new Set<number>();
    this.workers.forEach(worker => {
      const slots = this.parseSlots(worker.AvailableSlots);
      slots.forEach(phase => availablePhases.add(phase));
    });

    this.tasks.forEach((task, taskIndex) => {
      if (!task.PreferredPhases) return;
      
      const preferredPhases = this.parsePhases(task.PreferredPhases);
      const invalidPhases = preferredPhases.filter(phase => !availablePhases.has(phase));
      
      if (invalidPhases.length > 0) {
        errors.push({
          type: 'invalid_phase_reference',
          message: `Task ${task.TaskID} prefers phases ${invalidPhases.join(',')}, but no worker is available in those phases`,
          affectedRows: [taskIndex],
          affectedColumns: ['PreferredPhases'],
          severity: 'error',
          details: `Invalid phases: ${invalidPhases.join(', ')}. Available phases: ${Array.from(availablePhases).join(', ')}`
        });
      }
    });

    return errors;
  }

  /**
   * 8. Slot Restriction Rule Violations
   */
  private validateSlotRestrictionRules(): ValidationError[] {
    const violations: ValidationError[] = [];
    
    const slotRestrictionRules = this.businessRules.filter(rule => rule.type === 'slotRestriction');
    if (slotRestrictionRules.length === 0) return violations;

    slotRestrictionRules.forEach(rule => {
      // Example rule: "only assign clients in Group A to workers with at least 2 overlapping slots"
      // This is a simplified implementation - would need more specific rule structure
      
      violations.push({
        type: 'slot_restriction_violation',
        message: `Slot restriction rule "${rule.name}" validation not yet implemented`,
        affectedRows: [],
        affectedColumns: [],
        severity: 'warning',
        details: `Rule: ${rule.description}`
      });
    });

    return violations;
  }

  /**
   * Helper method to check if we have data from multiple sources
   */
  private hasMultipleDataSources(): boolean {
    const sources = [
      this.clients.length > 0,
      this.workers.length > 0,
      this.tasks.length > 0
    ];
    return sources.filter(Boolean).length >= 2;
  }

  /**
   * Helper method to parse phase strings into numbers
   */
  private parsePhases(phasesStr: string | undefined): number[] {
    if (!phasesStr) return [];
    
    try {
      // Handle array format: [1,2,3] or "[1,2,3]"
      if (phasesStr.includes('[')) {
        const parsed = JSON.parse(phasesStr);
        return Array.isArray(parsed) ? parsed.map(Number) : [Number(parsed)];
      }
      
      // Handle range format: "1-3" or "2-5"
      if (phasesStr.includes('-')) {
        const [start, end] = phasesStr.split('-').map(Number);
        const phases = [];
        for (let i = start; i <= end; i++) {
          phases.push(i);
        }
        return phases;
      }
      
      // Handle comma-separated format: "1,2,3"
      return phasesStr.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
    } catch (e) {
      console.warn('Failed to parse phases:', phasesStr);
      return [];
    }
  }

  /**
   * Helper method to parse slot strings into numbers
   */
  private parseSlots(slotsStr: string | undefined): number[] {
    if (!slotsStr) return [];
    
    try {
      // Handle array format: [1,2,3] or "[1,2,3]"
      if (slotsStr.includes('[')) {
        const parsed = JSON.parse(slotsStr);
        return Array.isArray(parsed) ? parsed.map(Number) : [Number(parsed)];
      }
      
      // Handle comma-separated format: "1,2,3"
      return slotsStr.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
    } catch (e) {
      console.warn('Failed to parse slots:', slotsStr);
      return [];
    }
  }
}
