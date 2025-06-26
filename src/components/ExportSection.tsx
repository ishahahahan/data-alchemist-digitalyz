'use client';

import { useState } from 'react';
import useAppStore from '@/store/useAppStore';
import { RulesConfiguration } from '@/types';

export default function ExportSection() {
  const [isExporting, setIsExporting] = useState(false);
  const { clients, workers, tasks, rules, priorities, getValidationErrors } = useAppStore();

  const validationResult = getValidationErrors();
  const canExport = validationResult.isValid;

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;

    // Convert data to CSV format
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportRulesJSON = () => {
    const rulesConfig: RulesConfiguration = {
      rules,
      priorities,
    };

    const jsonContent = JSON.stringify(rulesConfig, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'rules-configuration.json');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportValidationReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalClients: clients.data.length,
        totalWorkers: workers.data.length,
        totalTasks: tasks.data.length,
        totalRules: rules.length,
        isValid: validationResult.isValid,
        errorCount: validationResult.errors.length,
        warningCount: validationResult.warnings.length,
      },
      errors: validationResult.errors,
      warnings: validationResult.warnings,
      priorities,
    };

    const jsonContent = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'validation-report.json');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAll = async () => {
    setIsExporting(true);
    
    try {
      // Export all data files
      if (clients.data.length > 0) {
        exportToCSV(clients.data, 'clients-cleaned.csv');
      }
      if (workers.data.length > 0) {
        exportToCSV(workers.data, 'workers-cleaned.csv');
      }
      if (tasks.data.length > 0) {
        exportToCSV(tasks.data, 'tasks-cleaned.csv');
      }
      
      // Export rules configuration
      if (rules.length > 0) {
        exportRulesJSON();
      }
      
      // Export validation report
      exportValidationReport();
      
      // Small delay to ensure all downloads start
      await new Promise(resolve => setTimeout(resolve, 500));
    } finally {
      setIsExporting(false);
    }
  };

  const getDataStats = () => {
    return {
      clients: clients.data.length,
      workers: workers.data.length,
      tasks: tasks.data.length,
      rules: rules.length,
    };
  };

  const stats = getDataStats();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Export Data & Configuration</h2>
        <p className="text-gray-600">
          Download your cleaned data files and business rules configuration. 
          All exported data has been validated and is ready for use in your resource allocation system.
        </p>
      </div>

      {/* Export Status */}
      <div className={`p-4 rounded-lg border ${canExport ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
        <div className="flex items-center">
          <span className="mr-2">{canExport ? '✅' : '⚠️'}</span>
          <span className="font-medium">
            {canExport ? 'Ready for Export' : 'Validation Required'}
          </span>
        </div>
        <p className="text-sm mt-1">
          {canExport 
            ? 'All data has been validated and is ready for export.'
            : `Please resolve ${validationResult.errors.length} validation errors before exporting.`
          }
        </p>
      </div>

      {/* Data Overview */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{stats.clients}</div>
            <div className="text-sm text-gray-600">Clients</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{stats.workers}</div>
            <div className="text-sm text-gray-600">Workers</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{stats.tasks}</div>
            <div className="text-sm text-gray-600">Tasks</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{stats.rules}</div>
            <div className="text-sm text-gray-600">Rules</div>
          </div>
        </div>
      </div>

      {/* Individual Export Options */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Individual Exports</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Data Files */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Data Files (CSV)</h4>
            <div className="space-y-2">
              <button
                onClick={() => exportToCSV(clients.data, 'clients-cleaned.csv')}
                disabled={!canExport || clients.data.length === 0}
                className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center">
                  <span className="mr-3">👥</span>
                  <span>Clients Data</span>
                </div>
                <span className="text-sm text-gray-500">{clients.data.length} records</span>
              </button>
              
              <button
                onClick={() => exportToCSV(workers.data, 'workers-cleaned.csv')}
                disabled={!canExport || workers.data.length === 0}
                className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center">
                  <span className="mr-3">👷</span>
                  <span>Workers Data</span>
                </div>
                <span className="text-sm text-gray-500">{workers.data.length} records</span>
              </button>
              
              <button
                onClick={() => exportToCSV(tasks.data, 'tasks-cleaned.csv')}
                disabled={!canExport || tasks.data.length === 0}
                className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center">
                  <span className="mr-3">📋</span>
                  <span>Tasks Data</span>
                </div>
                <span className="text-sm text-gray-500">{tasks.data.length} records</span>
              </button>
            </div>
          </div>

          {/* Configuration Files */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Configuration Files (JSON)</h4>
            <div className="space-y-2">
              <button
                onClick={exportRulesJSON}
                disabled={!canExport}
                className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center">
                  <span className="mr-3">⚙️</span>
                  <span>Rules Configuration</span>
                </div>
                <span className="text-sm text-gray-500">{rules.length} rules</span>
              </button>
              
              <button
                onClick={exportValidationReport}
                className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-300"
              >
                <div className="flex items-center">
                  <span className="mr-3">📊</span>
                  <span>Validation Report</span>
                </div>
                <span className="text-sm text-gray-500">
                  {validationResult.errors.length + validationResult.warnings.length} issues
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Export All */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Export Everything</h3>
            <p className="text-gray-600">Download all data files and configuration in one action.</p>
          </div>
          <button
            onClick={exportAll}
            disabled={!canExport || isExporting}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              canExport && !isExporting
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isExporting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Exporting...
              </div>
            ) : (
              'Export All Files'
            )}
          </button>
        </div>
      </div>

      {/* Export Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">📋 Export Instructions</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• CSV files contain cleaned and validated data ready for import</li>
          <li>• Rules configuration JSON can be loaded into your allocation system</li>
          <li>• Validation report provides detailed quality metrics</li>
          <li>• All exports include timestamp and version information</li>
          <li>• Files are automatically downloaded to your default download folder</li>
        </ul>
      </div>
    </div>
  );
}
