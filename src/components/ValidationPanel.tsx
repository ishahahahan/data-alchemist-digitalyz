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
        tasks.uploadState.validationResult,
        clients.data,
        workers.data,
        tasks.data
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

    const handleGetAISuggestions = async (error: GroupedValidationError, errorId: string) => {
        setLoadingSuggestions(prev => new Set([...prev, errorId]));

        try {
            // Determine which data set contains the error based on affected rows and available data
            const getDataSetForError = (error: GroupedValidationError) => {
                // Get the first affected row to sample data structure
                const firstRow = error.affectedRows[0];
                
                // Check which dataset this row index belongs to
                if (firstRow < clients.data.length) {
                    return { data: clients.data, type: 'clients' as const };
                } else if (firstRow < clients.data.length + workers.data.length) {
                    return { 
                        data: workers.data, 
                        type: 'workers' as const,
                        rowOffset: clients.data.length 
                    };
                } else {
                    return { 
                        data: tasks.data, 
                        type: 'tasks' as const,
                        rowOffset: clients.data.length + workers.data.length 
                    };
                }
            };

            const { data, type, rowOffset = 0 } = getDataSetForError(error);
            
            // Get the actual row data for the first affected row
            const adjustedRowIndex = error.affectedRows[0] - rowOffset;
            const rowData = data[adjustedRowIndex];
            
            // Get the field name from affected columns (use first column)
            const fieldName = error.affectedColumns[0] || '';
            
            // Get current value from the row data
            const currentValue = rowData ? rowData[fieldName as keyof typeof rowData] : null;
            
            // Call AI service with proper context
            const suggestions = await aiService.suggestErrorCorrection(
                error.type,           // Error type (e.g., 'missing_field', 'invalid_format', etc.)
                rowData,             // The actual row data object
                fieldName,           // The specific field name that has the error
                currentValue         // The current (invalid) value
            );

            setAiSuggestions(prev => ({
                ...prev,
                [errorId]: {
                    ...suggestions,
                    // Add additional context for UI display
                    errorContext: {
                        dataType: type,
                        fieldName,
                        currentValue,
                        rowIndex: adjustedRowIndex,
                        totalAffected: error.count
                    }
                }
            }));
        } catch (error) {
            console.error('Failed to get AI suggestions:', error);
            setAiSuggestions(prev => ({
                ...prev,
                [errorId]: {
                    suggestions: [],
                    explanation: 'Unable to generate suggestions at this time. Please check the error details manually.'
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
                                <span className="font-medium text-black">{clients.data.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Workers:</span>
                                <span className="font-medium text-black">{workers.data.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Tasks:</span>
                                <span className="font-medium text-black">{tasks.data.length}</span>
                            </div>
                        </div>
                    </div>

                    {/* Error Summary with Real-time Counts */}
                    <div className="space-y-3">
                        {/* Basic Validation Errors */}
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-red-900 mb-3">🚨 Current Validation Status</h4>
                            <div className="space-y-2 text-sm">
                                {(validationResult.groupedErrors || []).length > 0 ? (
                                    <>
                                        <div className="flex justify-between items-center">
                                            <span className="text-red-700">Critical Error Types:</span>
                                            <span className="font-bold text-red-900">{(validationResult.groupedErrors || []).length}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-red-700">Affected Rows:</span>
                                            <span className="font-bold text-red-900">
                                                {(() => {
                                                    const affectedRows = new Set<number>();
                                                    (validationResult.groupedErrors || []).forEach(error => {
                                                        error.affectedRows.forEach(row => affectedRows.add(row));
                                                    });
                                                    return affectedRows.size;
                                                })()}
                                            </span>
                                        </div>
                                        
                                        {/* Cross-file Error Breakdown */}
                                        {(() => {
                                            const crossFileErrors = (validationResult.groupedErrors || []).filter(error => 
                                                ['unknown_reference', 'invalid_phase_reference', 'circular_corun_dependency'].includes(error.type)
                                            );
                                            
                                            if (crossFileErrors.length > 0) {
                                                return (
                                                    <div className="mt-2 p-2 bg-red-100 rounded border-l-4 border-red-400">
                                                        <div className="text-xs font-semibold text-red-800 mb-1">🔗 Cross-File Issues:</div>
                                                        <div className="flex justify-between text-xs text-red-700">
                                                            <span>Reference/Dependency Errors:</span>
                                                            <span className="font-bold">{crossFileErrors.length}</span>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                        
                                        <div className="text-xs text-red-600 mt-2 p-2 bg-red-100 rounded">
                                            💡 Edit cells in the Data Review tab and click "Save Changes" to resolve errors
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-green-700 font-medium">
                                        ✅ No critical validation errors found!
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Warnings and Capacity Issues */}
                        {(validationResult.groupedWarnings || []).length > 0 && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <h4 className="text-sm font-semibold text-yellow-900 mb-3">⚠️ Performance & Capacity Warnings</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-yellow-700">Warning Types:</span>
                                        <span className="font-bold text-yellow-900">{(validationResult.groupedWarnings || []).length}</span>
                                    </div>
                                    
                                    {/* Capacity Warning Breakdown */}
                                    {(() => {
                                        const capacityWarnings = (validationResult.groupedWarnings || []).filter(warning => 
                                            ['skill_coverage_gap', 'max_concurrency_violation', 'overloaded_worker', 'phase_slot_saturation'].includes(warning.type)
                                        );
                                        
                                        if (capacityWarnings.length > 0) {
                                            return (
                                                <div className="mt-2 p-2 bg-yellow-100 rounded border-l-4 border-yellow-400">
                                                    <div className="text-xs font-semibold text-yellow-800 mb-1">📊 Capacity Issues:</div>
                                                    <div className="space-y-1 text-xs text-yellow-700">
                                                        {capacityWarnings.map((warning, idx) => (
                                                            <div key={`capacity-${warning.type}-${idx}`} className="flex justify-between">
                                                                <span>{warning.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</span>
                                                                <span className="font-semibold">{warning.count}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}
                                    
                                    <div className="text-xs text-yellow-600 mt-2 p-2 bg-yellow-100 rounded">
                                        💡 These warnings indicate potential scheduling or capacity issues but don't prevent data processing
                                    </div>
                                </div>
                            </div>
                        )}
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
                                        <div key={`error-${error.type}-${index}`} className="bg-white border border-red-200 rounded-lg p-3">
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
                                                        onClick={() => handleGetAISuggestions(error, `error-${error.type}-${index}`)}
                                                        className="px-3 py-1 text-xs font-medium rounded-full transition-all flex items-center justify-center
                            bg-blue-50 text-blue-700 hover:bg-blue-100"
                                                    >
                                                        {loadingSuggestions.has(`error-${error.type}-${index}`) ? 'Loading...' : 'AI Suggestions'}
                                                    </button>
                                                </div>
                                            </div>
                                            {aiSuggestions[`error-${error.type}-${index}`] && (
                                                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                                                    <p className="font-medium text-blue-900">AI Suggestions:</p>
                                                    {aiSuggestions[`error-${error.type}-${index}`].errorContext && (
                                                        <div className="mb-2 text-xs text-blue-700 bg-blue-100 p-2 rounded">
                                                            <strong>Context:</strong> {aiSuggestions[`error-${error.type}-${index}`].errorContext.dataType} data, 
                                                            field "{aiSuggestions[`error-${error.type}-${index}`].errorContext.fieldName}", 
                                                            row {aiSuggestions[`error-${error.type}-${index}`].errorContext.rowIndex + 1}
                                                            {aiSuggestions[`error-${error.type}-${index}`].errorContext.currentValue !== null && (
                                                                <span> (current: "{String(aiSuggestions[`error-${error.type}-${index}`].errorContext.currentValue)}")</span>
                                                            )}
                                                        </div>
                                                    )}
                                                    {aiSuggestions[`error-${error.type}-${index}`].suggestions.length > 0 ? (
                                                        <ul className="list-disc list-inside space-y-1">
                                                            {aiSuggestions[`error-${error.type}-${index}`].suggestions.map((suggestion: string, idx: number) => (
                                                                <li key={idx} className="text-blue-800">{suggestion}</li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <p className="text-blue-700 italic">No specific suggestions available for this error type.</p>
                                                    )}
                                                    {aiSuggestions[`error-${error.type}-${index}`].explanation && (
                                                        <p className="text-blue-700 italic mt-2 border-t border-blue-200 pt-2">
                                                            <strong>Explanation:</strong> {aiSuggestions[`error-${error.type}-${index}`].explanation}
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
                                        <div key={`warning-${warning.type}-${index}`} className="bg-white border border-yellow-200 rounded-lg p-3">
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
