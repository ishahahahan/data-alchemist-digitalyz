'use client';

import { useState } from 'react';
import useAppStore from '@/store/useAppStore';

export default function PriorityConfiguration() {
  const { priorities, updatePriorities } = useAppStore();
  const [localPriorities, setLocalPriorities] = useState(priorities);
  const [configMode, setConfigMode] = useState<'sliders' | 'ranking' | 'comparison'>('sliders');
  const [rankingOrder, setRankingOrder] = useState<string[]>(['clientPriority', 'workerFairness', 'taskUrgency', 'resourceEfficiency']);

  const priorityConfigs = [
    {
      key: 'clientPriority' as keyof typeof priorities,
      label: 'Client Priority',
      description: 'Weight given to client priority levels in allocation decisions',
      icon: '👥',
      color: 'blue',
    },
    {
      key: 'workerFairness' as keyof typeof priorities,
      label: 'Worker Fairness',
      description: 'Emphasis on distributing work evenly among workers',
      icon: '⚖️',
      color: 'green',
    },
    {
      key: 'taskUrgency' as keyof typeof priorities,
      label: 'Task Urgency',
      description: 'Priority given to tasks based on deadlines and urgency',
      icon: '⏰',
      color: 'yellow',
    },
    {
      key: 'resourceEfficiency' as keyof typeof priorities,
      label: 'Resource Efficiency',
      description: 'Optimization for maximum resource utilization',
      icon: '📈',
      color: 'purple',
    },
  ];

  const handleSliderChange = (key: keyof typeof priorities, value: number) => {
    const newValue = value / 100;
    setLocalPriorities(prev => ({ ...prev, [key]: newValue }));
  };

  const handleRankingChange = (newOrder: string[]) => {
    setRankingOrder(newOrder);
    // Convert ranking to priority weights (highest rank = highest weight)
    const totalItems = newOrder.length;
    const newPriorities = { ...localPriorities };
    
    newOrder.forEach((key, index) => {
      // Higher rank (lower index) gets higher weight
      const weight = (totalItems - index) / (totalItems * (totalItems + 1) / 2);
      newPriorities[key as keyof typeof priorities] = weight;
    });
    
    setLocalPriorities(newPriorities);
  };

  const moveRankingItem = (fromIndex: number, toIndex: number) => {
    const newOrder = [...rankingOrder];
    const item = newOrder.splice(fromIndex, 1)[0];
    newOrder.splice(toIndex, 0, item);
    handleRankingChange(newOrder);
  };

  const handleSave = () => {
    // Normalize values to ensure they sum to 1
    const total = Object.values(localPriorities).reduce((sum, val) => sum + val, 0);
    const normalized = Object.fromEntries(
      Object.entries(localPriorities).map(([key, value]) => [key, value / total])
    ) as typeof priorities;
    
    updatePriorities(normalized);
    setLocalPriorities(normalized);
  };

  const handleReset = () => {
    const defaultPriorities = {
      clientPriority: 0.4,
      workerFairness: 0.3,
      taskUrgency: 0.2,
      resourceEfficiency: 0.1,
    };
    setLocalPriorities(defaultPriorities);
    updatePriorities(defaultPriorities);
  };

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      purple: 'bg-purple-500',
    };
    return colorMap[color as keyof typeof colorMap] || 'bg-gray-500';
  };

  const currentTotal = Object.values(localPriorities).reduce((sum, val) => sum + val, 0);
  const isBalanced = Math.abs(currentTotal - 1) < 0.01;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Priority Configuration</h3>
        <p className="text-gray-600 mb-4">
          Adjust the relative importance of different factors in the resource allocation algorithm.
          Values should sum to 100% for optimal results.
        </p>
        
        {/* Configuration Mode Selector */}
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => setConfigMode('sliders')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              configMode === 'sliders'
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🎚️ Sliders
          </button>
          <button
            onClick={() => setConfigMode('ranking')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              configMode === 'ranking'
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📊 Ranking
          </button>
          <button
            onClick={() => setConfigMode('comparison')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              configMode === 'comparison'
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ⚖️ Comparison
          </button>
        </div>
      </div>

      {/* Priority Total Indicator */}
      <div className={`mb-6 p-4 rounded-lg ${isBalanced ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="mr-2">{isBalanced ? '✅' : '⚠️'}</span>
            <span className="font-medium text-black">
              Total Weight: {(currentTotal * 100).toFixed(1)}%
            </span>
          </div>
          {!isBalanced && (
            <span className="text-sm text-yellow-700">
              Adjust values to sum to 100%
            </span>
          )}
        </div>
      </div>

      {/* Priority Sliders */}
      {configMode === 'sliders' && (
        <div className="space-y-6">
          {priorityConfigs.map((config) => (
            <div key={config.key} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-xl mr-3">{config.icon}</span>
                  <div>
                    <h4 className="font-medium text-gray-900">{config.label}</h4>
                    <p className="text-sm text-gray-600">{config.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-semibold text-gray-900">
                    {(localPriorities[config.key] * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            
            <div className="relative">
              <input
                type="range"
                min="0"
                max="100"
                value={localPriorities[config.key] * 100}
                onChange={(e) => handleSliderChange(config.key, Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, ${getColorClasses(config.color).replace('bg-', '')} 0%, ${getColorClasses(config.color).replace('bg-', '')} ${localPriorities[config.key] * 100}%, #e5e7eb ${localPriorities[config.key] * 100}%, #e5e7eb 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}
      
      {/* Priority Ranking Interface */}
      {configMode === 'ranking' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Drag to Rank</h4>
            <p className="text-sm text-blue-800">
              Drag items to reorder them by importance. Higher position = higher priority weight.
            </p>
          </div>
          
          <div className="space-y-3">
            {rankingOrder.map((key, index) => {
              const config = priorityConfigs.find(c => c.key === key)!;
              return (
                <div
                  key={key}
                  className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-move"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', index.toString());
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                    moveRankingItem(fromIndex, index);
                  }}
                >
                  <div className="flex items-center">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full font-semibold mr-4">
                      {index + 1}
                    </div>
                    <span className="text-xl mr-3">{config.icon}</span>
                    <div>
                      <h4 className="font-medium text-gray-900">{config.label}</h4>
                      <p className="text-sm text-gray-600">{config.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-lg font-semibold text-gray-900 mr-3">
                      {(localPriorities[config.key] * 100).toFixed(1)}%
                    </span>
                    <span className="text-gray-400">⋮⋮</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Pairwise Comparison Interface */}
      {configMode === 'comparison' && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">Pairwise Comparison</h4>
            <p className="text-sm text-green-800">
              Compare each pair of factors. Click the more important factor in each comparison.
            </p>
          </div>
          
          <div className="space-y-4">
            {priorityConfigs.map((configA, indexA) => 
              priorityConfigs.slice(indexA + 1).map((configB, indexB) => (
                <div key={`${configA.key}-${configB.key}`} className="border border-gray-200 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-gray-900 mb-3 text-center">
                    Which is more important for resource allocation?
                  </h5>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => {
                        // Simple approach: increase the weight of the selected factor
                        const increment = 0.1;
                        const newPriorities = { ...localPriorities };
                        newPriorities[configA.key] = Math.min(1, newPriorities[configA.key] + increment);
                        newPriorities[configB.key] = Math.max(0, newPriorities[configB.key] - increment);
                        setLocalPriorities(newPriorities);
                      }}
                      className="p-4 border border-gray-300 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                    >
                      <div className="flex items-center mb-2">
                        <span className="text-xl mr-2">{configA.icon}</span>
                        <span className="font-medium">{configA.label}</span>
                      </div>
                      <p className="text-sm text-gray-600">{configA.description}</p>
                    </button>
                    
                    <button
                      onClick={() => {
                        // Simple approach: increase the weight of the selected factor
                        const increment = 0.1;
                        const newPriorities = { ...localPriorities };
                        newPriorities[configB.key] = Math.min(1, newPriorities[configB.key] + increment);
                        newPriorities[configA.key] = Math.max(0, newPriorities[configA.key] - increment);
                        setLocalPriorities(newPriorities);
                      }}
                      className="p-4 border border-gray-300 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                    >
                      <div className="flex items-center mb-2">
                        <span className="text-xl mr-2">{configB.icon}</span>
                        <span className="font-medium">{configB.label}</span>
                      </div>
                      <p className="text-sm text-gray-600">{configB.description}</p>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Preset Configurations */}
      <div className="mt-8 pt-6 border-t">
        <h4 className="font-medium text-gray-900 mb-4">Quick Presets</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => setLocalPriorities({
              clientPriority: 0.6,
              workerFairness: 0.2,
              taskUrgency: 0.15,
              resourceEfficiency: 0.05,
            })}
            className="p-3 text-left border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
          >
            <div className="font-medium text-sm">Client-Focused</div>
            <div className="text-xs text-gray-600">Prioritize client satisfaction</div>
          </button>
          
          <button
            onClick={() => setLocalPriorities({
              clientPriority: 0.25,
              workerFairness: 0.45,
              taskUrgency: 0.2,
              resourceEfficiency: 0.1,
            })}
            className="p-3 text-left border border-gray-200 rounded-lg hover:border-green-300 transition-colors"
          >
            <div className="font-medium text-sm">Worker-Balanced</div>
            <div className="text-xs text-gray-600">Emphasize fair distribution</div>
          </button>
          
          <button
            onClick={() => setLocalPriorities({
              clientPriority: 0.2,
              workerFairness: 0.2,
              taskUrgency: 0.4,
              resourceEfficiency: 0.2,
            })}
            className="p-3 text-left border border-gray-200 rounded-lg hover:border-yellow-300 transition-colors"
          >
            <div className="font-medium text-sm">Deadline-Driven</div>
            <div className="text-xs text-gray-600">Focus on urgent tasks</div>
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex justify-end space-x-3">
        <button
          onClick={handleReset}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          Reset to Default
        </button>
        <button
          onClick={handleSave}
          disabled={!isBalanced}
          className={`px-4 py-2 rounded-md transition-colors ${
            isBalanced
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Save Configuration
        </button>
      </div>

      {/* Visual Representation */}
      <div className="mt-6 pt-6 border-t">
        <h4 className="font-medium text-gray-900 mb-3">Current Distribution</h4>
        <div className="h-4 bg-gray-200 rounded-full overflow-hidden flex">
          {priorityConfigs.map((config, index) => (
            <div
              key={config.key}
              className={`${getColorClasses(config.color)} flex items-center justify-center text-xs text-white font-medium`}
              style={{ width: `${localPriorities[config.key] * 100}%` }}
              title={`${config.label}: ${(localPriorities[config.key] * 100).toFixed(1)}%`}
            >
              {localPriorities[config.key] > 0.1 && (
                <span>{(localPriorities[config.key] * 100).toFixed(0)}%</span>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-600">
          {priorityConfigs.map((config) => (
            <div key={config.key} className="flex items-center">
              <div className={`w-3 h-3 ${getColorClasses(config.color)} rounded-full mr-1`}></div>
              <span>{config.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
