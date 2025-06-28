'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import useAppStore from '@/store/useAppStore';
import { FileProcessor } from '@/lib/fileProcessor';
import { ValidationEngine } from '@/lib/validation';
import { aiService } from '@/lib/aiService';
import { FileType, Client, Worker, Task } from '@/types';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface FileUploadZoneProps {
  fileType: FileType;
  title: string;
  description: string;
  icon: string;
}

function FileUploadZone({ fileType, title, description, icon }: FileUploadZoneProps) {
  const [mappedHeaders, setMappedHeaders] = useState<Record<string, string> | null>(null);
  const [isAIMapping, setIsAIMapping] = useState(false);
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);
  const {
    clients,
    workers,
    tasks,
    setClientsData,
    setWorkersData,
    setTasksData,
    updateClientUploadState,
    updateWorkerUploadState,
    updateTaskUploadState,
  } = useAppStore();

  const getUploadState = () => {
    switch (fileType) {
      case 'clients': return clients.uploadState;
      case 'workers': return workers.uploadState;
      case 'tasks': return tasks.uploadState;
    }
  };

  const getUpdateFunction = () => {
    switch (fileType) {
      case 'clients': return updateClientUploadState;
      case 'workers': return updateWorkerUploadState;
      case 'tasks': return updateTaskUploadState;
    }
  };

  const getSetDataFunction = () => {
    switch (fileType) {
      case 'clients': return setClientsData;
      case 'workers': return setWorkersData;
      case 'tasks': return setTasksData;
    }
  };

  const uploadState = getUploadState();
  const updateUploadState = getUpdateFunction();
  const setData = getSetDataFunction();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    updateUploadState({
      file,
      isProcessing: true,
      error: null,
      validationResult: null,
    });

    try {
      // Process file to get headers
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      let headers: string[] = [];

      if (fileExtension === 'csv') {
        const result = await new Promise<{ meta: { fields: string[] } }>((resolve) => {
          Papa.parse(file, {
            header: true,
            preview: 1,
            complete: (result) => {
              resolve(result as any);
            },
          });
        });
        headers = result.meta.fields;
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const worksheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[worksheetName];
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (rawData.length > 0) {
          headers = rawData[0] as string[];
        }
      }

      const mapped = FileProcessor.getMappedHeaders(headers, fileType);
      setDetectedHeaders(headers);
      setMappedHeaders(mapped);

      // Try AI-enhanced mapping if basic mapping has issues
      const unmappedCount = Object.values(mapped).filter(v => v === null || v === '').length;
      if (unmappedCount > 0) {
        setIsAIMapping(true);
        try {
          const expectedHeaders = FileProcessor.getExpectedHeaders(fileType);
          const aiMapping = await aiService.mapHeaders(headers, expectedHeaders, fileType);
          
          // Merge AI mapping with basic mapping, preferring AI where it provides better matches
          const enhancedMapping = { ...mapped };
          Object.keys(aiMapping).forEach(detectedHeader => {
            if (aiMapping[detectedHeader] && aiMapping[detectedHeader] !== detectedHeader) {
              enhancedMapping[detectedHeader] = aiMapping[detectedHeader];
            }
          });
          
          setMappedHeaders(enhancedMapping);
        } catch (aiError) {
          console.warn('AI header mapping failed, using basic mapping:', aiError);
        } finally {
          setIsAIMapping(false);
        }
      }

    } catch (error) {
      updateUploadState({
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }, [fileType, updateUploadState]);

  const onConfirmMapping = async () => {
    if (!uploadState.file || !mappedHeaders) return;

    updateUploadState({ isProcessing: true });

    try {
      // Process file with confirmed mapping
      const result = await FileProcessor.processFile(
        uploadState.file,
        fileType
      );

      if (result.errors.length > 0) {
        updateUploadState({
          isProcessing: false,
          error: result.errors.join('; '),
        });
        return;
      }

      // Set data in store
      setData(result.data);

      // Run validation
      const currentState = useAppStore.getState();
      const validator = new ValidationEngine(
        fileType === 'clients' ? result.data as Client[] : currentState.clients.data,
        fileType === 'workers' ? result.data as Worker[] : currentState.workers.data,
        fileType === 'tasks' ? result.data as Task[] : currentState.tasks.data
      );

      const validationResult = validator.validateAll();

      updateUploadState({
        data: result.data,
        isProcessing: false,
        validationResult,
      });

      setMappedHeaders(null); // Clear mapped headers after processing

    } catch (error) {
      updateUploadState({
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    multiple: false,
  });

  const loadSampleData = () => {
    const sampleData = FileProcessor.generateSampleData(fileType);
    setData(sampleData);
    
    updateUploadState({
      file: null,
      data: sampleData,
      isProcessing: false,
      error: null,
      validationResult: { 
        isValid: true, 
        errors: [], 
        warnings: [], 
        groupedErrors: [], 
        groupedWarnings: [] 
      },
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 p-6">
      <div className="text-center mb-4">
        <div className="text-4xl mb-2">{icon}</div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          isDragActive
            ? 'border-blue-400 bg-blue-50'
            : uploadState.isProcessing
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} disabled={uploadState.isProcessing} />
        
        {uploadState.isProcessing ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Processing...</span>
          </div>
        ) : (
          <div>
            <div className="text-gray-400 mb-2">
              📁
            </div>
            <p className="text-sm text-gray-600">
              {isDragActive ? 'Drop the file here' : 'Drag & drop a CSV or Excel file here, or click to select'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Supports CSV, XLSX, and XLS formats
            </p>
          </div>
        )}
      </div>

      {mappedHeaders && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-md font-semibold text-gray-900 mb-2">Confirm Column Mapping</h4>
          <div className="space-y-2">
            {Object.entries(mappedHeaders).map(([original, mapped]) => (
              <div key={original} className="grid grid-cols-2 gap-2 items-center">
                <p className="text-sm font-medium text-gray-700">{original}</p>
                <select
                  value={mapped}
                  onChange={(e) => {
                    const newMappedHeaders = { ...mappedHeaders };
                    newMappedHeaders[original] = e.target.value;
                    setMappedHeaders(newMappedHeaders);
                  }}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  {Object.keys(FileProcessor.getFileTypeSchema(fileType)).map((key) => (
                    <option key={key} value={key}>{key}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={() => setMappedHeaders(null)}
              className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={onConfirmMapping}
              className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      {uploadState.file && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{uploadState.file.name}</p>
              <p className="text-xs text-gray-500">{(uploadState.file.size / 1024).toFixed(1)} KB</p>
            </div>
            {uploadState.data && (
              <span className="text-xs text-green-600 font-medium">
                {uploadState.data.length} rows loaded
              </span>
            )}
          </div>
        </div>
      )}

      {uploadState.error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{uploadState.error}</p>
        </div>
      )}

      <div className="mt-4 flex justify-center">
        <button
          onClick={loadSampleData}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Load Sample Data
        </button>
      </div>
    </div>
  );
}

export default function FileUploadSection() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Data Files</h2>
        <p className="text-gray-600">
          Upload your CSV or Excel files for clients, workers, and tasks. The system will automatically
          detect column headers and validate the data structure.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FileUploadZone
          fileType="clients"
          title="Clients Data"
          description="Client information with priorities and task requests"
          icon="👥"
        />
        <FileUploadZone
          fileType="workers"
          title="Workers Data"
          description="Worker profiles with skills and availability"
          icon="👷"
        />
        <FileUploadZone
          fileType="tasks"
          title="Tasks Data"
          description="Task definitions with requirements and constraints"
          icon="📋"
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 Tips for Best Results</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Ensure column headers match expected names (or close variations)</li>
          <li>• Use consistent data formats across all files</li>
          <li>• Array fields should use JSON format like [1,2,3] or range format like "1-3"</li>
          <li>• JSON fields should contain valid JSON strings</li>
        </ul>
      </div>
    </div>
  );
}
