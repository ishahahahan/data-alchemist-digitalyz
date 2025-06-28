'use client';

import { useState, useMemo } from 'react';
import useAppStore from '@/store/useAppStore';
import { aiService } from '@/lib/aiService';
import { GroupedValidationError } from '@/types';

export default function ValidationPanel() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [aiSuggestions, setAiSuggestions] = useState<{ [key: string]: any }>({});
  const [loadingSuggestions, setLoadingSuggestions] = useState<Set<string>>(new Set());
  const { clients, workers, tasks, getValidationErrors } = useAppStore();

  const validationResult = useMemo(() => getValidationErrors(), [
    clients.uploadState.validationResult, 
    workers.uploadState.validationResult, 
    tasks.uploadState.validationResult
  ]);
  const hasData = clients.data.length > 0 || workers.data.length > 0 || tasks.data.length > 0;

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleGetAISuggestions = async (errorType: string, errorId: string) => {
    setLoadingSuggestions(prev => new Set([...prev, errorId]));
    
    try {
      // This would need more context about the specific error to provide meaningful suggestions
      const suggestions = await aiService.suggestErrorCorrection(
        errorType,
        {}, // Would need the actual row data
        '', // Would need the specific field
        null // Would need the current value
      );
      
      setAiSuggestions(prev => ({
        ...prev,
        [errorId]: suggestions
      }));
    } catch (error) {
      console.error('Failed to get AI suggestions:', error);
      setAiSuggestions(prev => ({
        ...prev,
        [errorId]: {
          suggestions: [],
          explanation: 'Unable to generate suggestions at this time.'
        }
      }));
    } finally {
      setLoadingSuggestions(prev => {
        const newSet = new Set(prev);
        newSet.delete(errorId);
        return newSet;
      });
    }
  };

  const getStatusColor = (isValid: boolean, errorCount: number) => {
    if (isValid) return 'text-green-600 bg-green-50 border-green-200';
    if (errorCount > 0) return 'text-red-600 bg-red-50 border-red-200';
    return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  };

  const getStatusIcon = (isValid: boolean, errorCount: number) => {
    if (isValid) return '✅';
    if (errorCount > 0) return '❌';
    return '⚠️';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Validation Summary</h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(validationResult.isValid, (validationResult.groupedErrors || []).length)}`}>
          <span className="mr-2">{getStatusIcon(validationResult.isValid, (validationResult.groupedErrors || []).length)}</span>
          {validationResult.isValid ? 'All Valid' : `${(validationResult.groupedErrors || []).length} Error Types`}
        </div>
      </div>

      {!hasData ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-gray-500">Upload data files to see validation results</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Data Overview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Data Overview</h4>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Clients:</span>
                <span className="font-medium">{clients.data.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Workers:</span>
                <span className="font-medium">{workers.data.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tasks:</span>
                <span className="font-medium">{tasks.data.length}</span>
              </div>
            </div>
          </div>

          {/* Errors Section */}
          {(validationResult.groupedErrors || []).length > 0 && (
            <div className="border border-red-200 rounded-lg">
              <button
                onClick={() => toggleSection('errors')}
                className="w-full px-4 py-3 text-left bg-red-50 hover:bg-red-100 transition-colors rounded-t-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-red-600 mr-2">❌</span>
                    <span className="font-medium text-red-900">
                      Errors ({(validationResult.groupedErrors || []).length} types, {validationResult.errors.length} total)
                    </span>
                  </div>
                  <span className="text-red-600">
                    {expandedSections.has('errors') ? '−' : '+'}
                  </span>
                </div>
              </button>
              {expandedSections.has('errors') && (
                <div className="p-4 space-y-3">
                  {(validationResult.groupedErrors || []).map((error: GroupedValidationError, index: number) => (
                    <div key={index} className="bg-white border border-red-200 rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-red-900">{error.message}</p>
                          <div className="mt-1 text-xs text-red-700">
                            <span className="font-medium">Type:</span> {error.type}
                            <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded-full">
                              {error.count} {error.count === 1 ? 'occurrence' : 'occurrences'}
                            </span>
                          </div>
                          <div className="mt-2 text-xs text-red-700">
                            {error.affectedColumns.length > 0 && (
                              <div>
                                <span className="font-medium">Columns:</span> {error.affectedColumns.join(', ')}
                              </div>
                            )}
                            {error.affectedRows.length > 0 && (
                              <div className="mt-1">
                                <span className="font-medium">Affected Rows:</span> {error.affectedRows.slice(0, 10).join(', ')}
                                {error.affectedRows.length > 10 && (
                                  <span className="text-red-500"> ... and {error.affectedRows.length - 10} more</span>
                                )}
                              </div>
                            )}
                            {error.examples.length > 0 && (
                              <div className="mt-2 p-2 bg-red-50 rounded text-xs">
                                <span className="font-medium">Examples:</span>
                                <ul className="list-disc list-inside mt-1 space-y-1">
                                  {error.examples.slice(0, 3).map((example: string, idx: number) => (
                                    <li key={idx} className="text-red-600">{example}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          <button
                            onClick={() => handleGetAISuggestions(error.type, `error-${index}`)}
                            className="px-3 py-1 text-xs font-medium rounded-full transition-all flex items-center justify-center
                            bg-blue-50 text-blue-700 hover:bg-blue-100"
                          >
                            {loadingSuggestions.has(`error-${index}`) ? 'Loading...' : 'AI Suggestions'}
                          </button>
                        </div>
                      </div>
                      {aiSuggestions[`error-${index}`] && (
                        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                          <p className="font-medium text-blue-900">AI Suggestions:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {aiSuggestions[`error-${index}`].suggestions.map((suggestion: string, idx: number) => (
                              <li key={idx} className="text-blue-800">{suggestion}</li>
                            ))}
                          </ul>
                          {aiSuggestions[`error-${index}`].explanation && (
                            <p className="text-blue-700 italic mt-1">
                              {aiSuggestions[`error-${index}`].explanation}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Warnings Section */}
          {(validationResult.groupedWarnings || []).length > 0 && (
            <div className="border border-yellow-200 rounded-lg">
              <button
                onClick={() => toggleSection('warnings')}
                className="w-full px-4 py-3 text-left bg-yellow-50 hover:bg-yellow-100 transition-colors rounded-t-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-yellow-600 mr-2">⚠️</span>
                    <span className="font-medium text-yellow-900">
                      Warnings ({(validationResult.groupedWarnings || []).length} types, {validationResult.warnings.length} total)
                    </span>
                  </div>
                  <span className="text-yellow-600">
                    {expandedSections.has('warnings') ? '−' : '+'}
                  </span>
                </div>
              </button>
              {expandedSections.has('warnings') && (
                <div className="p-4 space-y-3">
                  {(validationResult.groupedWarnings || []).map((warning: GroupedValidationError, index: number) => (
                    <div key={index} className="bg-white border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-yellow-900">{warning.message}</p>
                          <div className="mt-1 text-xs text-yellow-700">
                            <span className="font-medium">Type:</span> {warning.type}
                            <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                              {warning.count} {warning.count === 1 ? 'occurrence' : 'occurrences'}
                            </span>
                          </div>
                          <div className="mt-2 text-xs text-yellow-700">
                            {warning.affectedColumns.length > 0 && (
                              <div>
                                <span className="font-medium">Columns:</span> {warning.affectedColumns.join(', ')}
                              </div>
                            )}
                            {warning.affectedRows.length > 0 && (
                              <div className="mt-1">
                                <span className="font-medium">Affected Rows:</span> {warning.affectedRows.slice(0, 10).join(', ')}
                                {warning.affectedRows.length > 10 && (
                                  <span className="text-yellow-500"> ... and {warning.affectedRows.length - 10} more</span>
                                )}
                              </div>
                            )}
                            {warning.examples.length > 0 && (
                              <div className="mt-2 p-2 bg-yellow-50 rounded text-xs">
                                <span className="font-medium">Examples:</span>
                                <ul className="list-disc list-inside mt-1 space-y-1">
                                  {warning.examples.slice(0, 3).map((example: string, idx: number) => (
                                    <li key={idx} className="text-yellow-600">{example}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Success Message */}
          {validationResult.isValid && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <span className="text-green-600 mr-2">✅</span>
                <span className="font-medium text-green-900">All validation checks passed!</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Your data is ready for processing and rule configuration.
              </p>
            </div>
          )}

          {/* Validation Rules Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Validation Rules Applied</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Missing required columns</li>
              <li>• Duplicate IDs</li>
              <li>• Malformed lists and arrays</li>
              <li>• Out-of-range values</li>
              <li>• Invalid JSON format</li>
              <li>• Unknown task references</li>
              <li>• Worker overload checks</li>
              <li>• Skill coverage analysis</li>
              <li>• Concurrency feasibility</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
