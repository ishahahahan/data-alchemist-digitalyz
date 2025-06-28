import { create } from 'zustand';
import { Client, Worker, Task, BusinessRule, AppState, FileUploadState, ValidationResult } from '@/types';

interface AppStore extends AppState {
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

  updateClient: (index: number, client: Client) =>
    set((state) => {
      const newData = [...state.clients.data];
      newData[index] = client;
      return {
        clients: { ...state.clients, data: newData },
      };
    }),

  addClient: (client: Client) =>
    set((state) => ({
      clients: { ...state.clients, data: [...state.clients.data, client] },
    })),

  deleteClients: (clientIds: string[]) =>
    set((state) => ({
      clients: { ...state.clients, data: state.clients.data.filter(c => !clientIds.includes(c.ClientID)) },
    })),

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

  updateWorker: (index: number, worker: Worker) =>
    set((state) => {
      const newData = [...state.workers.data];
      newData[index] = worker;
      return {
        workers: { ...state.workers, data: newData },
      };
    }),

  addWorker: (worker: Worker) =>
    set((state) => ({
      workers: { ...state.workers, data: [...state.workers.data, worker] },
    })),

  deleteWorkers: (workerIds: string[]) =>
    set((state) => ({
      workers: { ...state.workers, data: state.workers.data.filter(w => !workerIds.includes(w.WorkerID)) },
    })),

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

  updateTask: (index: number, task: Task) =>
    set((state) => {
      const newData = [...state.tasks.data];
      newData[index] = task;
      return {
        tasks: { ...state.tasks, data: newData },
      };
    }),

  addTask: (task: Task) =>
    set((state) => ({
      tasks: { ...state.tasks, data: [...state.tasks.data, task] },
    })),

  deleteTasks: (taskIds: string[]) =>
    set((state) => ({
      tasks: { ...state.tasks, data: state.tasks.data.filter(t => !taskIds.includes(t.TaskID)) },
    })),

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
