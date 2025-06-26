'use client';

import { useState } from 'react';
import FileUploadSection from '@/components/FileUploadSection';
import DataGridSection from '@/components/DataGridSection';
import ValidationPanel from '@/components/ValidationPanel';
import RuleBuilderSection from '@/components/RuleBuilderSection';
import PriorityConfiguration from '@/components/PriorityConfiguration';
import ExportSection from '@/components/ExportSection';
import useAppStore from '@/store/useAppStore';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'upload' | 'data' | 'rules' | 'export'>('upload');
  const { clients, workers, tasks, getValidationErrors } = useAppStore();

  const validationResult = getValidationErrors();
  const hasData = clients.data.length > 0 || workers.data.length > 0 || tasks.data.length > 0;

  const tabs = [
    { id: 'upload', label: 'File Upload', icon: '📁' },
    { id: 'data', label: 'Data Review', icon: '📊', disabled: !hasData },
    { id: 'rules', label: 'Business Rules', icon: '⚙️', disabled: !hasData },
    { id: 'export', label: 'Export', icon: '📤', disabled: !hasData || !validationResult.isValid },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Data Alchemist</h1>
              <p className="text-gray-600 mt-1">AI-Powered Resource Allocation Configurator</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${validationResult.isValid ? 'bg-green-500' : validationResult.errors.length > 0 ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {validationResult.isValid ? 'All Valid' : `${validationResult.errors.length} Errors`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && setActiveTab(tab.id as any)}
                disabled={tab.disabled}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : tab.disabled
                    ? 'border-transparent text-gray-400 cursor-not-allowed'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {activeTab === 'upload' && <FileUploadSection />}
            {activeTab === 'data' && <DataGridSection />}
            {activeTab === 'rules' && (
              <div className="space-y-8">
                <RuleBuilderSection />
                <PriorityConfiguration />
              </div>
            )}
            {activeTab === 'export' && <ExportSection />}
          </div>

          {/* Sidebar - Validation Panel */}
          <div className="lg:col-span-1">
            <ValidationPanel />
          </div>
        </div>
      </main>
    </div>
  );
}
