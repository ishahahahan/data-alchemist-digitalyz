'use client';

import { useState, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import useAppStore from '@/store/useAppStore';
import { Client, Worker, Task } from '@/types';
import '@/lib/agGridSetup'; // Ensure AG Grid modules are registered
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

type DataType = 'clients' | 'workers' | 'tasks';

interface DataGridProps {
  dataType: DataType;
  data: any[];
  onDataChange: (index: number, updatedData: any) => void;
}

function DataGrid({ dataType, data, onDataChange }: DataGridProps) {
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

  const onGridReady = (params: GridReadyEvent) => {
    setGridApi(params.api);
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

  return (
    <div className="ag-theme-alpine h-96">
      <AgGridReact
        rowData={data}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        onGridReady={onGridReady}
        onCellValueChanged={onCellValueChanged}
        pagination={true}
        paginationPageSize={10}
        suppressMenuHide={true}
        rowSelection="multiple"
        animateRows={true}
        theme="legacy"
      />
    </div>
  );
}

export default function DataGridSection() {
  const [activeDataType, setActiveDataType] = useState<DataType>('clients');
  const { 
    clients, 
    workers, 
    tasks, 
    updateClient, 
    updateWorker, 
    updateTask 
  } = useAppStore();

  const getCurrentData = () => {
    switch (activeDataType) {
      case 'clients': return clients.data;
      case 'workers': return workers.data;
      case 'tasks': return tasks.data;
    }
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
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="mr-2 text-xl">{getDataTypeIcon(activeDataType)}</span>
              <h3 className="text-lg font-semibold text-gray-900">
                {getDataTypeName(activeDataType)} Data
              </h3>
              <span className="ml-2 text-sm text-gray-500">
                ({currentData.length} records)
              </span>
            </div>
            <div className="flex space-x-2">
              <button className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100">
                Export CSV
              </button>
              <button className="px-3 py-1 text-sm bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100">
                Add Row
              </button>
            </div>
          </div>
        </div>

        <div className="p-4">
          {hasData ? (
            <DataGrid
              dataType={activeDataType}
              data={currentData}
              onDataChange={handleDataChange}
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
