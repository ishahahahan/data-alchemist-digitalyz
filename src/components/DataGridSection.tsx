'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridApi, GridReadyEvent, RowClassParams, RowStyle, RowEvent } from 'ag-grid-community';
import useAppStore from '@/store/useAppStore';
import { Client, Worker, Task } from '@/types';
import { aiService } from '@/lib/aiService';
import '@/lib/agGridSetup'; // Ensure AG Grid modules are registered
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

type DataType = 'clients' | 'workers' | 'tasks';

interface DataGridProps {
  dataType: DataType;
  data: any[];
  onDataChange: (index: number, updatedData: any) => void;
  onGridReady?: (params: GridReadyEvent) => void;
  aiSuggestions?: { [key: string]: any };
  onRequestAICorrection?: (rowIndex: number, fieldName: string, currentValue: any, errorType: string) => Promise<void>;
  errorRows?: Set<number>;
  getRowErrorDetails?: (rowIndex: number) => { errors: string[], warnings: string[] };
}

function DataGrid({ 
  dataType, 
  data, 
  onDataChange, 
  onGridReady, 
  aiSuggestions, 
  onRequestAICorrection,
  errorRows = new Set(),
  getRowErrorDetails
}: DataGridProps) {
  const [gridApi, setGridApi] = useState<GridApi | null>(null);

  const columnDefs = useMemo(() => {
    const getColumnDefs = (): ColDef[] => {
      switch (dataType) {
        case 'clients':
          return [
            { field: 'ClientID', headerName: 'Client ID', width: 120, pinned: 'left' },
            { field: 'ClientName', headerName: 'Client Name', width: 200, editable: true },
            { 
              field: 'PriorityLevel', 
              headerName: 'Priority', 
              width: 100, 
              editable: true,
              cellEditor: 'agSelectCellEditor',
              cellEditorParams: { values: [1, 2, 3, 4, 5] },
              cellStyle: (params) => {
                const value = params.value;
                if (value >= 4) return { backgroundColor: '#fef3c7', color: '#92400e' };
                if (value <= 2) return { backgroundColor: '#f3f4f6', color: '#6b7280' };
                return null;
              }
            },
            { field: 'RequestedTaskIDs', headerName: 'Requested Tasks', width: 200, editable: true },
            { field: 'GroupTag', headerName: 'Group', width: 120, editable: true },
            { field: 'AttributesJSON', headerName: 'Attributes', width: 200, editable: true },
          ];
        
        case 'workers':
          return [
            { field: 'WorkerID', headerName: 'Worker ID', width: 120, pinned: 'left' },
            { field: 'WorkerName', headerName: 'Worker Name', width: 200, editable: true },
            { field: 'Skills', headerName: 'Skills', width: 250, editable: true },
            { field: 'AvailableSlots', headerName: 'Available Slots', width: 150, editable: true },
            { field: 'MaxLoadPerPhase', headerName: 'Max Load', width: 120, editable: true },
            { field: 'WorkerGroup', headerName: 'Group', width: 120, editable: true },
            { 
              field: 'QualificationLevel', 
              headerName: 'Qualification', 
              width: 130, 
              editable: true,
              cellStyle: (params) => {
                const value = params.value;
                if (value >= 4) return { backgroundColor: '#dcfce7', color: '#166534' };
                if (value <= 2) return { backgroundColor: '#fee2e2', color: '#991b1b' };
                return null;
              }
            },
          ];
        
        case 'tasks':
          return [
            { field: 'TaskID', headerName: 'Task ID', width: 120, pinned: 'left' },
            { field: 'TaskName', headerName: 'Task Name', width: 200, editable: true },
            { field: 'Category', headerName: 'Category', width: 150, editable: true },
            { field: 'Duration', headerName: 'Duration', width: 100, editable: true },
            { field: 'RequiredSkills', headerName: 'Required Skills', width: 200, editable: true },
            { field: 'PreferredPhases', headerName: 'Preferred Phases', width: 150, editable: true },
            { field: 'MaxConcurrent', headerName: 'Max Concurrent', width: 130, editable: true },
          ];
        
        default:
          return [];
      }
    };

    return getColumnDefs();
  }, [dataType]);

  const handleGridReady = (params: GridReadyEvent) => {
    setGridApi(params.api);
    if (onGridReady) {
      onGridReady(params);
    }
  };

  const onCellValueChanged = (params: any) => {
    const rowIndex = params.node.rowIndex;
    const updatedData = { ...params.data };
    onDataChange(rowIndex, updatedData);
  };

  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    editable: false,
  }), []);

  // Row styling based on validation errors
  const getRowStyle = (params: RowClassParams): RowStyle | undefined => {
    const rowIndex = params.node.rowIndex;
    if (rowIndex !== null && errorRows.has(rowIndex)) {
      return { 
        backgroundColor: '#fef2f2', 
        borderLeft: '3px solid #ef4444' 
      };
    }
    return undefined;
  };

  // Row class styling
  const getRowClass = (params: RowClassParams): string => {
    const rowIndex = params.node.rowIndex;
    if (rowIndex !== null && errorRows.has(rowIndex)) {
      return 'error-row';
    }
    return '';
  };

  return (
    <div className="relative">
      <div className="ag-theme-alpine h-96">
        <AgGridReact
          rowData={data}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onGridReady={handleGridReady}
          onCellValueChanged={onCellValueChanged}
          pagination={true}
          paginationPageSize={10}
          suppressMenuHide={true}
          rowSelection="multiple"
          animateRows={true}
          theme="legacy"
          getRowStyle={getRowStyle}
          getRowClass={getRowClass}
        />
      </div>
    </div>
  );
}

export default function DataGridSection() {
  const [activeDataType, setActiveDataType] = useState<DataType>('clients');
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<{ [key: string]: any }>({});
  const [showErrorsOnly, setShowErrorsOnly] = useState(false);
  const [errorRows, setErrorRows] = useState<Set<number>>(new Set());
  
  const { 
    clients, 
    workers, 
    tasks, 
    updateClient, 
    updateWorker, 
    updateTask,
    addClient,
    addWorker,
    addTask,
    deleteClients,
    deleteWorkers,
    deleteTasks,
    getValidationErrors,
  } = useAppStore();

  // AI-powered search functionality
  const handleAISearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setFilteredData([]);
      return;
    }

    setIsSearching(true);
    try {
      const currentData = getCurrentData();
      const results = await aiService.searchData(query, currentData, activeDataType);
      setFilteredData(results);
    } catch (error) {
      console.error('AI search error:', error);
      // Fallback to simple search
      const currentData = getCurrentData();
      const results = currentData.filter(item =>
        Object.values(item).some(value =>
          String(value).toLowerCase().includes(query.toLowerCase())
        )
      );
      setFilteredData(results);
    } finally {
      setIsSearching(false);
    }
  }, [activeDataType]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        handleAISearch(searchQuery);
      } else {
        setFilteredData([]);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, handleAISearch]);

  // AI Error Correction
  const handleAIErrorCorrection = useCallback(async (
    rowIndex: number,
    fieldName: string,
    currentValue: any,
    errorType: string
  ) => {
    try {
      const currentData = getCurrentData();
      const rowData = currentData[rowIndex];
      const suggestions = await aiService.suggestErrorCorrection(
        errorType,
        rowData,
        fieldName,
        currentValue
      );
      
      setAiSuggestions(prev => ({
        ...prev,
        [`${rowIndex}_${fieldName}`]: suggestions
      }));
    } catch (error) {
      console.error('AI error correction failed:', error);
    }
  }, [activeDataType]);

  const onGridReady = (params: GridReadyEvent) => {
    setGridApi(params.api);
  };

  const getCurrentData = () => {
    let baseData: any[];
    switch (activeDataType) {
      case 'clients': 
        baseData = clients.data;
        break;
      case 'workers': 
        baseData = workers.data;
        break;
      case 'tasks': 
        baseData = tasks.data;
        break;
      default:
        baseData = [];
    }
    
    // Apply error filtering if enabled
    if (showErrorsOnly) {
      return baseData.filter((_, index) => errorRows.has(index));
    }
    
    return baseData;
  };

  const onAddRow = () => {
    switch (activeDataType) {
      case 'clients':
        addClient({ ClientID: `C${Date.now()}`, ClientName: '', PriorityLevel: 1, RequestedTaskIDs: '', GroupTag: '', AttributesJSON: '' });
        break;
      case 'workers':
        addWorker({ WorkerID: `W${Date.now()}`, WorkerName: '', Skills: '', AvailableSlots: '', MaxLoadPerPhase: 1, WorkerGroup: '', QualificationLevel: 1 });
        break;
      case 'tasks':
        addTask({ TaskID: `T${Date.now()}`, TaskName: '', Category: '', Duration: 1, RequiredSkills: '', PreferredPhases: '', MaxConcurrent: 1 });
        break;
    }
  };

  const onDeleteSelected = () => {
    const selectedNodes = gridApi?.getSelectedNodes();
    if (!selectedNodes || selectedNodes.length === 0) return;

    const selectedIds = selectedNodes.map(node => node.data.id);

    switch (activeDataType) {
      case 'clients':
        deleteClients(selectedIds);
        break;
      case 'workers':
        deleteWorkers(selectedIds);
        break;
      case 'tasks':
        deleteTasks(selectedIds);
        break;
    }
  };

  const onExport = () => {
    gridApi?.exportDataAsCsv();
  };

  const handleDataChange = (index: number, updatedData: any) => {
    switch (activeDataType) {
      case 'clients':
        updateClient(index, updatedData as Client);
        break;
      case 'workers':
        updateWorker(index, updatedData as Worker);
        break;
      case 'tasks':
        updateTask(index, updatedData as Task);
        break;
    }
  };

  const getDataTypeName = (type: DataType) => {
    switch (type) {
      case 'clients': return 'Clients';
      case 'workers': return 'Workers';
      case 'tasks': return 'Tasks';
    }
  };

  const getDataTypeIcon = (type: DataType) => {
    switch (type) {
      case 'clients': return '👥';
      case 'workers': return '👷';
      case 'tasks': return '📋';
    }
  };

  // Get validation errors for current data type (memoized to prevent infinite re-renders)
  const validationResult = useMemo(() => getValidationErrors(), [
    clients.uploadState.validationResult, 
    workers.uploadState.validationResult, 
    tasks.uploadState.validationResult
  ]);
  
  // Update error rows when validation changes or data type changes
  useEffect(() => {
    const newErrorRows = new Set<number>();
    
    // Add error rows from grouped errors
    (validationResult.groupedErrors || []).forEach(error => {
      error.affectedRows.forEach(rowIndex => {
        newErrorRows.add(rowIndex);
      });
    });
    
    // Add warning rows from grouped warnings  
    (validationResult.groupedWarnings || []).forEach(warning => {
      warning.affectedRows.forEach(rowIndex => {
        newErrorRows.add(rowIndex);
      });
    });
    
    setErrorRows(newErrorRows);
  }, [validationResult, activeDataType]);

  // Get error details for a specific row
  const getRowErrorDetails = (rowIndex: number): { errors: string[], warnings: string[] } => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    (validationResult.groupedErrors || []).forEach(error => {
      if (error.affectedRows.includes(rowIndex)) {
        errors.push(error.message);
      }
    });
    
    (validationResult.groupedWarnings || []).forEach(warning => {
      if (warning.affectedRows.includes(rowIndex)) {
        warnings.push(warning.message);
      }
    });
    
    return { errors, warnings };
  };

  const currentData = getCurrentData();
  const hasData = currentData.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Data Review & Editing</h2>
        <p className="text-gray-600">
          Review and edit your uploaded data. Click on any cell to make inline edits. 
          Changes are automatically saved and validated.
        </p>
      </div>

      {/* Data Type Selector */}
      <div className="flex space-x-4">
        {(['clients', 'workers', 'tasks'] as DataType[]).map((type) => {
          const data = type === 'clients' ? clients.data : type === 'workers' ? workers.data : tasks.data;
          const count = data.length;
          
          return (
            <button
              key={type}
              onClick={() => setActiveDataType(type)}
              className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
                activeDataType === type
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2">{getDataTypeIcon(type)}</span>
              <span className="font-medium">{getDataTypeName(type)}</span>
              <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Data Grid */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b space-y-4">
          {/* Header with title and actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="mr-2 text-xl">{getDataTypeIcon(activeDataType)}</span>
              <h3 className="text-lg font-semibold text-gray-900">
                {getDataTypeName(activeDataType)} Data
              </h3>
              <span className="ml-2 text-sm text-gray-500">
                ({(searchQuery ? filteredData : currentData).length} records)
              </span>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={onExport}
                className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100"
              >
                Export CSV
              </button>
              <button 
                onClick={onAddRow}
                className="px-3 py-1 text-sm bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100"
              >
                Add Row
              </button>
              <button 
                onClick={onDeleteSelected}
                className="px-3 py-1 text-sm bg-red-50 text-red-700 rounded-md hover:bg-red-100"
              >
                Delete Selected
              </button>
            </div>
          </div>

          {/* AI-Powered Search and Filters */}
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">🔍</span>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="🤖 AI Search: Try 'high priority clients' or 'tasks longer than 2 phases'"
              />
              {isSearching && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>
            
            {/* Error Filter Toggle */}
            {errorRows.size > 0 && (
              <button
                onClick={() => setShowErrorsOnly(!showErrorsOnly)}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center space-x-2 ${
                  showErrorsOnly
                    ? 'bg-red-100 text-red-700 border border-red-300'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span>{showErrorsOnly ? '❌' : '🔍'}</span>
                <span>{showErrorsOnly ? 'Show All' : 'Errors Only'}</span>
                <span className="px-2 py-1 text-xs bg-red-500 text-white rounded-full">
                  {errorRows.size}
                </span>
              </button>
            )}
            
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            )}
          </div>

          {/* Search Results Info */}
          {searchQuery && (
            <div className="flex items-center justify-between text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-md">
              <span>
                🤖 AI found {filteredData.length} results for "{searchQuery}"
              </span>
              <span className="text-xs">
                Powered by natural language understanding
              </span>
            </div>
          )}
        </div>

        <div className="p-4">
          {hasData ? (
            <DataGrid
              dataType={activeDataType}
              data={searchQuery ? filteredData : currentData}
              onDataChange={handleDataChange}
              onGridReady={onGridReady}
              aiSuggestions={aiSuggestions}
              onRequestAICorrection={handleAIErrorCorrection}
              errorRows={errorRows}
              getRowErrorDetails={getRowErrorDetails}
            />
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">{getDataTypeIcon(activeDataType)}</div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                No {getDataTypeName(activeDataType)} Data
              </h4>
              <p className="text-gray-600">
                Upload a file in the File Upload section to see data here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 Editing Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Double-click any cell to edit its value</li>
          <li>• Use Tab or Enter to move between cells</li>
          <li>• Right-click for context menu options</li>
          <li>• Changes are automatically validated in real-time</li>
          <li>• Invalid data will be highlighted in the validation panel</li>
        </ul>
      </div>
    </div>
  );
}
