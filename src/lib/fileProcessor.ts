import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Client, Worker, Task, FileType } from '@/types';

interface ParsedData<T = any> {
  data: T[];
  errors: string[];
}

export class FileProcessor {
  // Main file processing method
  static async processFile<T = any>(
    file: File,
    fileType: FileType
  ): Promise<ParsedData<T>> {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (fileExtension === 'csv') {
      return this.processCSV<T>(file, fileType);
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      return this.processExcel<T>(file, fileType);
    } else {
      throw new Error('Unsupported file format. Please use CSV or Excel files.');
    }
  }

  // CSV processing
  private static processCSV<T>(file: File, fileType: FileType): Promise<ParsedData<T>> {
    return new Promise((resolve) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => this.normalizeColumnName(header, fileType),
        complete: (result) => {
          const errors: string[] = [];
          
          // Collect parsing errors
          if (result.errors.length > 0) {
            result.errors.forEach((error) => {
              errors.push(`Row ${error.row}: ${error.message}`);
            });
          }

          // Transform and validate data
          const transformedData = this.transformData(result.data, fileType);
          
          resolve({
            data: transformedData as T[],
            errors,
          });
        },
        error: (error) => {
          resolve({
            data: [],
            errors: [error.message],
          });
        },
      });
    });
  }

  // Excel processing
  private static async processExcel<T>(file: File, fileType: FileType): Promise<ParsedData<T>> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Use first worksheet
      const worksheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[worksheetName];
      
      // Convert to JSON
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (rawData.length === 0) {
        return { data: [], errors: ['File appears to be empty'] };
      }

      // Extract headers and normalize them
      const headers = (rawData[0] as string[]).map(header => 
        this.normalizeColumnName(header, fileType)
      );
      
      // Convert rows to objects
      const data = rawData.slice(1).map((row: any) => {
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = row[index] || '';
        });
        return obj;
      }).filter(row => Object.values(row).some(value => value !== ''));

      // Transform data
      const transformedData = this.transformData(data, fileType);

      return {
        data: transformedData as T[],
        errors: [],
      };
    } catch (error) {
      return {
        data: [],
        errors: [`Failed to process Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  // Intelligent column name mapping
  private static normalizeColumnName(header: string, fileType: FileType): string {
    const normalized = header.trim().replace(/\s+/g, '');
    
    // Common variations mapping
    const mappings: Record<FileType, Record<string, string>> = {
      clients: {
        'clientid': 'ClientID',
        'client_id': 'ClientID',
        'id': 'ClientID',
        'clientname': 'ClientName',
        'client_name': 'ClientName',
        'name': 'ClientName',
        'prioritylevel': 'PriorityLevel',
        'priority_level': 'PriorityLevel',
        'priority': 'PriorityLevel',
        'requestedtaskids': 'RequestedTaskIDs',
        'requested_task_ids': 'RequestedTaskIDs',
        'requestedtasks': 'RequestedTaskIDs',
        'tasks': 'RequestedTaskIDs',
        'grouptag': 'GroupTag',
        'group_tag': 'GroupTag',
        'group': 'GroupTag',
        'attributesjson': 'AttributesJSON',
        'attributes_json': 'AttributesJSON',
        'attributes': 'AttributesJSON',
        'metadata': 'AttributesJSON',
      },
      workers: {
        'workerid': 'WorkerID',
        'worker_id': 'WorkerID',
        'id': 'WorkerID',
        'workername': 'WorkerName',
        'worker_name': 'WorkerName',
        'name': 'WorkerName',
        'skills': 'Skills',
        'skill': 'Skills',
        'availableslots': 'AvailableSlots',
        'available_slots': 'AvailableSlots',
        'slots': 'AvailableSlots',
        'maxloadperphase': 'MaxLoadPerPhase',
        'max_load_per_phase': 'MaxLoadPerPhase',
        'maxload': 'MaxLoadPerPhase',
        'workergroup': 'WorkerGroup',
        'worker_group': 'WorkerGroup',
        'group': 'WorkerGroup',
        'qualificationlevel': 'QualificationLevel',
        'qualification_level': 'QualificationLevel',
        'qualification': 'QualificationLevel',
        'level': 'QualificationLevel',
      },
      tasks: {
        'taskid': 'TaskID',
        'task_id': 'TaskID',
        'id': 'TaskID',
        'taskname': 'TaskName',
        'task_name': 'TaskName',
        'name': 'TaskName',
        'category': 'Category',
        'type': 'Category',
        'duration': 'Duration',
        'requiredskills': 'RequiredSkills',
        'required_skills': 'RequiredSkills',
        'skills': 'RequiredSkills',
        'preferredphases': 'PreferredPhases',
        'preferred_phases': 'PreferredPhases',
        'phases': 'PreferredPhases',
        'maxconcurrent': 'MaxConcurrent',
        'max_concurrent': 'MaxConcurrent',
        'concurrent': 'MaxConcurrent',
      },
    };

    const fileTypeMappings = mappings[fileType];
    const lowerNormalized = normalized.toLowerCase();
    
    return fileTypeMappings[lowerNormalized] || header;
  }

  // Transform raw data to proper types
  private static transformData(data: any[], fileType: FileType): any[] {
    return data.map(row => {
      switch (fileType) {
        case 'clients':
          return this.transformClient(row);
        case 'workers':
          return this.transformWorker(row);
        case 'tasks':
          return this.transformTask(row);
        default:
          return row;
      }
    });
  }

  private static transformClient(row: any): Client {
    return {
      ClientID: String(row.ClientID || ''),
      ClientName: String(row.ClientName || ''),
      PriorityLevel: this.parseNumber(row.PriorityLevel, 1),
      RequestedTaskIDs: String(row.RequestedTaskIDs || ''),
      GroupTag: String(row.GroupTag || ''),
      AttributesJSON: String(row.AttributesJSON || '{}'),
    };
  }

  private static transformWorker(row: any): Worker {
    return {
      WorkerID: String(row.WorkerID || ''),
      WorkerName: String(row.WorkerName || ''),
      Skills: String(row.Skills || ''),
      AvailableSlots: String(row.AvailableSlots || '[]'),
      MaxLoadPerPhase: this.parseNumber(row.MaxLoadPerPhase, 1),
      WorkerGroup: String(row.WorkerGroup || ''),
      QualificationLevel: this.parseNumber(row.QualificationLevel, 1),
    };
  }

  private static transformTask(row: any): Task {
    return {
      TaskID: String(row.TaskID || ''),
      TaskName: String(row.TaskName || ''),
      Category: String(row.Category || ''),
      Duration: this.parseNumber(row.Duration, 1),
      RequiredSkills: String(row.RequiredSkills || ''),
      PreferredPhases: String(row.PreferredPhases || '[]'),
      MaxConcurrent: this.parseNumber(row.MaxConcurrent, 1),
    };
  }

  private static parseNumber(value: any, defaultValue: number): number {
    const parsed = Number(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  // Generate sample data for testing
  static generateSampleData(fileType: FileType): any[] {
    switch (fileType) {
      case 'clients':
        return [
          {
            ClientID: 'C001',
            ClientName: 'Acme Corp',
            PriorityLevel: 5,
            RequestedTaskIDs: 'T001,T002',
            GroupTag: 'VIP',
            AttributesJSON: '{"industry":"tech","size":"large"}',
          },
          {
            ClientID: 'C002',
            ClientName: 'Beta LLC',
            PriorityLevel: 3,
            RequestedTaskIDs: 'T002,T003',
            GroupTag: 'Standard',
            AttributesJSON: '{"industry":"finance","size":"medium"}',
          },
          {
            ClientID: 'C003',
            ClientName: 'Gamma Inc',
            PriorityLevel: 2,
            RequestedTaskIDs: 'T004',
            GroupTag: 'Standard',
            AttributesJSON: '{"industry":"retail","size":"small"}',
          },
        ];
      
      case 'workers':
        return [
          {
            WorkerID: 'W001',
            WorkerName: 'Alice Johnson',
            Skills: 'JavaScript,React,Node.js',
            AvailableSlots: '[1,2,3]',
            MaxLoadPerPhase: 2,
            WorkerGroup: 'Frontend',
            QualificationLevel: 4,
          },
          {
            WorkerID: 'W002',
            WorkerName: 'Bob Smith',
            Skills: 'Python,Django,PostgreSQL',
            AvailableSlots: '[2,3,4]',
            MaxLoadPerPhase: 3,
            WorkerGroup: 'Backend',
            QualificationLevel: 5,
          },
          {
            WorkerID: 'W003',
            WorkerName: 'Carol Davis',
            Skills: 'JavaScript,Python,SQL',
            AvailableSlots: '[1,3,5]',
            MaxLoadPerPhase: 2,
            WorkerGroup: 'Fullstack',
            QualificationLevel: 3,
          },
        ];
      
      case 'tasks':
        return [
          {
            TaskID: 'T001',
            TaskName: 'Frontend Development',
            Category: 'Development',
            Duration: 3,
            RequiredSkills: 'JavaScript,React',
            PreferredPhases: '[1,2]',
            MaxConcurrent: 2,
          },
          {
            TaskID: 'T002',
            TaskName: 'Backend API',
            Category: 'Development',
            Duration: 4,
            RequiredSkills: 'Python,Django',
            PreferredPhases: '[2,3,4]',
            MaxConcurrent: 1,
          },
          {
            TaskID: 'T003',
            TaskName: 'Database Design',
            Category: 'Architecture',
            Duration: 2,
            RequiredSkills: 'SQL,PostgreSQL',
            PreferredPhases: '[1,2]',
            MaxConcurrent: 1,
          },
          {
            TaskID: 'T004',
            TaskName: 'Quality Assurance',
            Category: 'Testing',
            Duration: 2,
            RequiredSkills: 'JavaScript,Python',
            PreferredPhases: '[4,5]',
            MaxConcurrent: 2,
          },
        ];
      
      default:
        return [];
    }
  }

  // Get expected headers for a file type
  static getExpectedHeaders(fileType: FileType): string[] {
    const schema = this.getFileTypeSchema(fileType);
    return Object.keys(schema);
  }

  // Get mapped headers using intelligent mapping
  static getMappedHeaders(detectedHeaders: string[], fileType: FileType): { [key: string]: string } {
    const expectedHeaders = this.getExpectedHeaders(fileType);
    const mapping: { [key: string]: string } = {};
    
    detectedHeaders.forEach(detected => {
      const normalized = this.normalizeColumnName(detected, fileType);
      if (expectedHeaders.includes(normalized)) {
        mapping[detected] = normalized;
      } else {
        // Find best match using similarity
        let bestMatch = detected;
        let bestScore = 0;
        
        expectedHeaders.forEach(expected => {
          const score = this.calculateSimilarity(detected.toLowerCase(), expected.toLowerCase());
          if (score > bestScore && score > 0.6) {
            bestMatch = expected;
            bestScore = score;
          }
        });
        
        mapping[detected] = bestMatch;
      }
    });
    
    return mapping;
  }

  // Get file type schema
  static getFileTypeSchema(fileType: FileType): Record<string, string> {
    switch (fileType) {
      case 'clients':
        return {
          ClientID: 'string',
          ClientName: 'string',
          PriorityLevel: 'number',
          RequestedTaskIDs: 'string',
          GroupTag: 'string',
          AttributesJSON: 'string'
        };
      case 'workers':
        return {
          WorkerID: 'string',
          WorkerName: 'string',
          Skills: 'string',
          AvailableSlots: 'string',
          MaxLoadPerPhase: 'number',
          WorkerGroup: 'string',
          QualificationLevel: 'number'
        };
      case 'tasks':
        return {
          TaskID: 'string',
          TaskName: 'string',
          Category: 'string',
          Duration: 'number',
          RequiredSkills: 'string',
          PreferredPhases: 'string',
          MaxConcurrent: 'number'
        };
      default:
        return {};
    }
  }

  // Calculate string similarity (simple implementation)
  private static calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  // Levenshtein distance calculation
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}
