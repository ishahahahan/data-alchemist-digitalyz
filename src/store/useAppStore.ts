import { create } from 'zustand';
import { Client, Worker, Task, BusinessRule, AppState, FileUploadState, ValidationResult } from '@/types';
import { ValidationEngine } from '@/lib/validation';

interface AppStore extends AppState {
  // Helper function to trigger validation
  _updateValidation: () => void;
  
  // Actions for clients
  setClientsData: (data: Client[]) => void;
  updateClientUploadState: (state: Partial<FileUploadState>) => void;
  updateClient: (index: number, client: Client) => void;
  addClient: (client: Client) => void;
  deleteClients: (clientIds: string[]) => void;
  
  // Actions for workers
  setWorkersData: (data: Worker[]) => void;
  updateWorkerUploadState: (state: Partial<FileUploadState>) => void;
  updateWorker: (index: number, worker: Worker) => void;
  addWorker: (worker: Worker) => void;
  deleteWorkers: (workerIds: string[]) => void;
  
  // Actions for tasks
  setTasksData: (data: Task[]) => void;
  updateTaskUploadState: (state: Partial<FileUploadState>) => void;
  updateTask: (index: number, task: Task) => void;
  addTask: (task: Task) => void;
  deleteTasks: (taskIds: string[]) => void;
  
  // Actions for rules
  addRule: (rule: BusinessRule) => void;
  updateRule: (id: string, rule: BusinessRule) => void;
  removeRule: (id: string) => void;
  
  // Actions for priorities
  updatePriorities: (priorities: Partial<AppState['priorities']>) => void;
  
  // Utility actions
  resetAll: () => void;
  getValidationErrors: () => ValidationResult;
}

const initialFileUploadState: FileUploadState = {
  file: null,
  data: null,
  isProcessing: false,
  error: null,
  validationResult: null,
};

const useAppStore = create<AppStore>((set, get) => ({
  // Initial state
  clients: {
    data: [],
    uploadState: initialFileUploadState,
  },
  workers: {
    data: [],
    uploadState: initialFileUploadState,
  },
  tasks: {
    data: [],
    uploadState: initialFileUploadState,
  },
  rules: [],
  priorities: {
    clientPriority: 0.4,
    workerFairness: 0.3,
    taskUrgency: 0.2,
    resourceEfficiency: 0.1,
  },

  // Helper function to trigger validation after data changes
  _updateValidation: () => {
    const state = get();
    const validationEngine = new ValidationEngine(
      state.clients.data,
      state.workers.data,
      state.tasks.data
    );
    const validationResult = validationEngine.validateAll();

    // Update validation results for all datasets
    set((state) => ({
      clients: {
        ...state.clients,
        uploadState: {
          ...state.clients.uploadState,
          validationResult
        }
      },
      workers: {
        ...state.workers,
        uploadState: {
          ...state.workers.uploadState,
          validationResult
        }
      },
      tasks: {
        ...state.tasks,
        uploadState: {
          ...state.tasks.uploadState,
          validationResult
        }
      }
    }));
  },

  // Client actions
  setClientsData: (data: Client[]) =>
    set((state) => ({
      clients: { ...state.clients, data },
    })),

  updateClientUploadState: (uploadState: Partial<FileUploadState>) =>
    set((state) => ({
      clients: {
        ...state.clients,
        uploadState: { ...state.clients.uploadState, ...uploadState },
      },
    })),

  updateClient: (index: number, client: Client) => {
    set((state) => {
      const newData = [...state.clients.data];
      newData[index] = client;
      return {
        clients: { ...state.clients, data: newData },
      };
    });
    // Trigger validation after updating data
    get()._updateValidation();
  },

  addClient: (client: Client) => {
    set((state) => ({
      clients: { ...state.clients, data: [...state.clients.data, client] },
    }));
    // Trigger validation after adding data
    get()._updateValidation();
  },

  deleteClients: (clientIds: string[]) => {
    set((state) => ({
      clients: { ...state.clients, data: state.clients.data.filter(c => !clientIds.includes(c.ClientID)) },
    }));
    // Trigger validation after deleting data
    get()._updateValidation();
  },

  // Worker actions
  setWorkersData: (data: Worker[]) =>
    set((state) => ({
      workers: { ...state.workers, data },
    })),

  updateWorkerUploadState: (uploadState: Partial<FileUploadState>) =>
    set((state) => ({
      workers: {
        ...state.workers,
        uploadState: { ...state.workers.uploadState, ...uploadState },
      },
    })),

  updateWorker: (index: number, worker: Worker) => {
    set((state) => {
      const newData = [...state.workers.data];
      newData[index] = worker;
      return {
        workers: { ...state.workers, data: newData },
      };
    });
    // Trigger validation after updating data
    get()._updateValidation();
  },

  addWorker: (worker: Worker) => {
    set((state) => ({
      workers: { ...state.workers, data: [...state.workers.data, worker] },
    }));
    // Trigger validation after adding data
    get()._updateValidation();
  },

  deleteWorkers: (workerIds: string[]) => {
    set((state) => ({
      workers: { ...state.workers, data: state.workers.data.filter(w => !workerIds.includes(w.WorkerID)) },
    }));
    // Trigger validation after deleting data
    get()._updateValidation();
  },

  // Task actions
  setTasksData: (data: Task[]) =>
    set((state) => ({
      tasks: { ...state.tasks, data },
    })),

  updateTaskUploadState: (uploadState: Partial<FileUploadState>) =>
    set((state) => ({
      tasks: {
        ...state.tasks,
        uploadState: { ...state.tasks.uploadState, ...uploadState },
      },
    })),

  updateTask: (index: number, task: Task) => {
    set((state) => {
      const newData = [...state.tasks.data];
      newData[index] = task;
      return {
        tasks: { ...state.tasks, data: newData },
      };
    });
    // Trigger validation after updating data
    get()._updateValidation();
  },

  addTask: (task: Task) => {
    set((state) => ({
      tasks: { ...state.tasks, data: [...state.tasks.data, task] },
    }));
    // Trigger validation after adding data
    get()._updateValidation();
  },

  deleteTasks: (taskIds: string[]) => {
    set((state) => ({
      tasks: { ...state.tasks, data: state.tasks.data.filter(t => !taskIds.includes(t.TaskID)) },
    }));
    // Trigger validation after deleting data
    get()._updateValidation();
  },

  // Rule actions
  addRule: (rule: BusinessRule) =>
    set((state) => ({
      rules: [...state.rules, rule],
    })),

  updateRule: (id: string, rule: BusinessRule) =>
    set((state) => ({
      rules: state.rules.map((r) => (r.id === id ? rule : r)),
    })),

  removeRule: (id: string) =>
    set((state) => ({
      rules: state.rules.filter((r) => r.id !== id),
    })),

  // Priority actions
  updatePriorities: (priorities: Partial<AppState['priorities']>) =>
    set((state) => ({
      priorities: { ...state.priorities, ...priorities },
    })),

  // Utility actions
  resetAll: () =>
    set({
      clients: { data: [], uploadState: initialFileUploadState },
      workers: { data: [], uploadState: initialFileUploadState },
      tasks: { data: [], uploadState: initialFileUploadState },
      rules: [],
      priorities: {
        clientPriority: 0.4,
        workerFairness: 0.3,
        taskUrgency: 0.2,
        resourceEfficiency: 0.1,
      },
    }),

  getValidationErrors: (): ValidationResult => {
    const state = get();
    const errors: any[] = [];
    const warnings: any[] = [];
    const groupedErrors: any[] = [];
    const groupedWarnings: any[] = [];

    // Combine all validation results
    if (state.clients.uploadState.validationResult) {
      errors.push(...state.clients.uploadState.validationResult.errors);
      warnings.push(...state.clients.uploadState.validationResult.warnings);
      if (state.clients.uploadState.validationResult.groupedErrors) {
        groupedErrors.push(...state.clients.uploadState.validationResult.groupedErrors);
      }
      if (state.clients.uploadState.validationResult.groupedWarnings) {
        groupedWarnings.push(...state.clients.uploadState.validationResult.groupedWarnings);
      }
    }
    if (state.workers.uploadState.validationResult) {
      errors.push(...state.workers.uploadState.validationResult.errors);
      warnings.push(...state.workers.uploadState.validationResult.warnings);
      if (state.workers.uploadState.validationResult.groupedErrors) {
        groupedErrors.push(...state.workers.uploadState.validationResult.groupedErrors);
      }
      if (state.workers.uploadState.validationResult.groupedWarnings) {
        groupedWarnings.push(...state.workers.uploadState.validationResult.groupedWarnings);
      }
    }
    if (state.tasks.uploadState.validationResult) {
      errors.push(...state.tasks.uploadState.validationResult.errors);
      warnings.push(...state.tasks.uploadState.validationResult.warnings);
      if (state.tasks.uploadState.validationResult.groupedErrors) {
        groupedErrors.push(...state.tasks.uploadState.validationResult.groupedErrors);
      }
      if (state.tasks.uploadState.validationResult.groupedWarnings) {
        groupedWarnings.push(...state.tasks.uploadState.validationResult.groupedWarnings);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      groupedErrors,
      groupedWarnings,
    };
  },
}));

export default useAppStore;
