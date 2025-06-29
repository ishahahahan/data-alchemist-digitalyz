'use client';

import { useState } from 'react';
import useAppStore from '@/store/useAppStore';
import { BusinessRule, CoRunRule, LoadLimitRule, SlotRestrictionRule, PhaseWindowRule } from '@/types';
import { aiService } from '@/lib/aiService';

interface RuleFormProps {
  onSubmit: (rule: BusinessRule) => void;
  onCancel: () => void;
}

function CoRunRuleForm({ onSubmit, onCancel }: RuleFormProps) {
  const [ruleName, setRuleName] = useState('');
  const [tasks, setTasks] = useState('');
  const [priority, setPriority] = useState(1);
  const { tasks: taskData } = useAppStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rule: CoRunRule = {
      id: `rule_${Date.now()}`,
      type: 'coRun',
      name: ruleName,
      tasks: tasks.split(',').map(t => t.trim()),
      priority,
    };
    onSubmit(rule);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name</label>
        <input
          type="text"
          value={ruleName}
          onChange={(e) => setRuleName(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
          placeholder="e.g., Marketing Campaign Tasks"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tasks (comma-separated IDs)</label>
        <input
          type="text"
          value={tasks}
          onChange={(e) => setTasks(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
          placeholder="T001, T002, T003"
          required
        />
        <p className="text-xs text-gray-500 mt-1">Available tasks: {taskData.data.map(t => t.TaskID).join(', ')}</p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
        <select
          value={priority}
          onChange={(e) => setPriority(Number(e.target.value))}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
        >
          {[1, 2, 3, 4, 5].map(p => (
            <option key={p} value={p}>Priority {p}</option>
          ))}
        </select>
      </div>
      
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create Rule
        </button>
      </div>
    </form>
  );
}

function LoadLimitRuleForm({ onSubmit, onCancel }: RuleFormProps) {
  const [ruleName, setRuleName] = useState('');
  const [workerGroup, setWorkerGroup] = useState('');
  const [maxSlotsPerPhase, setMaxSlotsPerPhase] = useState(3);
  const [priority, setPriority] = useState(1);
  const { workers } = useAppStore();

  const availableGroups = [...new Set(workers.data.map(w => w.WorkerGroup))];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rule: LoadLimitRule = {
      id: `rule_${Date.now()}`,
      type: 'loadLimit',
      name: ruleName,
      workerGroup,
      maxSlotsPerPhase,
      priority,
    };
    onSubmit(rule);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name</label>
        <input
          type="text"
          value={ruleName}
          onChange={(e) => setRuleName(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Sales Team Load Limit"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Worker Group</label>
        <select
          value={workerGroup}
          onChange={(e) => setWorkerGroup(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Select worker group</option>
          {availableGroups.map(group => (
            <option key={group} value={group}>{group}</option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Max Slots Per Phase</label>
        <input
          type="number"
          value={maxSlotsPerPhase}
          onChange={(e) => setMaxSlotsPerPhase(Number(e.target.value))}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          min="1"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
        <select
          value={priority}
          onChange={(e) => setPriority(Number(e.target.value))}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {[1, 2, 3, 4, 5].map(p => (
            <option key={p} value={p}>Priority {p}</option>
          ))}
        </select>
      </div>
      
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create Rule
        </button>
      </div>
    </form>
  );
}

export default function RuleBuilderSection() {
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [selectedRuleType, setSelectedRuleType] = useState<string>('');
  const [showNLForm, setShowNLForm] = useState(false);
  const [nlDescription, setNlDescription] = useState('');
  const [isProcessingNL, setIsProcessingNL] = useState(false);
  const [nlResult, setNlResult] = useState<{ rule: BusinessRule | null, explanation: string } | null>(null);
  const { rules, addRule, removeRule, clients, workers, tasks } = useAppStore();

  const ruleTypes = [
    { id: 'coRun', name: 'Co-run Rules', description: 'Tasks that must execute together', icon: '🔗' },
    { id: 'loadLimit', name: 'Load Limits', description: 'Maximum tasks per worker group per phase', icon: '⚖️' },
    { id: 'slotRestriction', name: 'Slot Restrictions', description: 'Limits on client/worker group slot usage', icon: '🚫' },
    { id: 'phaseWindow', name: 'Phase Windows', description: 'Restrict tasks to specific phases', icon: '📅' },
  ];

  const handleCreateRule = (ruleType: string) => {
    setSelectedRuleType(ruleType);
    setShowRuleForm(true);
  };

  const handleNaturalLanguageRule = async () => {
    if (!nlDescription.trim()) return;
    
    setIsProcessingNL(true);
    try {
      const result = await aiService.createRuleFromNaturalLanguage(
        nlDescription,
        { clients: clients.data, workers: workers.data, tasks: tasks.data }
      );
      setNlResult(result);
    } catch (error) {
      console.error('Natural language rule creation failed:', error);
      setNlResult({
        rule: null,
        explanation: 'Failed to process the rule description. Please try again or use the manual rule builder.'
      });
    } finally {
      setIsProcessingNL(false);
    }
  };

  const handleAcceptNLRule = () => {
    if (nlResult?.rule) {
      addRule(nlResult.rule);
      setShowNLForm(false);
      setNlDescription('');
      setNlResult(null);
    }
  };

  const handleRejectNLRule = () => {
    setNlResult(null);
  };

  const handleRuleSubmit = (rule: BusinessRule) => {
    addRule(rule);
    setShowRuleForm(false);
    setSelectedRuleType('');
  };

  const handleRuleCancel = () => {
    setShowRuleForm(false);
    setSelectedRuleType('');
  };

  const getRuleTypeIcon = (type: string) => {
    const ruleType = ruleTypes.find(rt => rt.id === type);
    return ruleType?.icon || '⚙️';
  };

  const getRuleDescription = (rule: BusinessRule): string => {
    switch (rule.type) {
      case 'coRun':
        const coRunRule = rule as CoRunRule;
        return `Tasks: ${coRunRule.tasks.join(', ')}`;
      case 'loadLimit':
        const loadLimitRule = rule as LoadLimitRule;
        return `${loadLimitRule.workerGroup}: max ${loadLimitRule.maxSlotsPerPhase} slots/phase`;
      default:
        return 'Custom rule configuration';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Business Rules Builder</h2>
        <p className="text-gray-600">
          Create custom business rules to govern how resources are allocated. 
          Rules are applied in priority order during the allocation process.
        </p>
      </div>

      {/* Rule Creation */}
      {!showRuleForm && !showNLForm ? (
        <div className="space-y-6">
          {/* AI Natural Language Rule Creation */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm border border-blue-200 p-6">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">🤖</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">AI Rule Creator</h3>
                <p className="text-sm text-gray-600">Describe your rule in plain English and let AI create it for you</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rule Description
                </label>
                <textarea
                  value={nlDescription}
                  onChange={(e) => setNlDescription(e.target.value)}
                  className="w-full h-24 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-600"
                  placeholder="Example: 'Tasks T001 and T002 must run together in the same phase' or 'Marketing team can only handle 3 tasks per phase'"
                />
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  💡 Try: "High priority clients get first choice" | "No worker can have more than 5 tasks"
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowNLForm(false)}
                    className="px-4 py-2 text-gray-600 text-sm"
                  >
                    Use Manual Builder
                  </button>
                  <button
                    onClick={handleNaturalLanguageRule}
                    disabled={!nlDescription.trim() || isProcessingNL}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isProcessingNL ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating Rule...
                      </>
                    ) : (
                      '🤖 Create Rule'
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* AI Rule Result */}
            {nlResult && (
              <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-white">
                <h4 className="font-medium text-gray-900 mb-2">AI Analysis</h4>
                <p className="text-sm text-gray-600 mb-4">{nlResult.explanation}</p>
                
                {nlResult.rule ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                      <h5 className="font-medium text-green-900 mb-1">Generated Rule</h5>
                      <p className="text-sm text-green-800">
                        <strong>{nlResult.rule.name}</strong> (Type: {nlResult.rule.type}, Priority: {nlResult.rule.priority})
                      </p>
                    </div>
                    
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={handleRejectNLRule}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                      >
                        Try Again
                      </button>
                      <button
                        onClick={handleAcceptNLRule}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        ✓ Accept Rule
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                      Could not create a rule from this description. Please try being more specific or use the manual builder below.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Manual Rule Creation */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Manual Rule Builder</h3>
              <button
                onClick={() => setShowNLForm(true)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                🤖 Use AI Instead
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ruleTypes.map((ruleType) => (
                <div
                  key={ruleType.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer"
                  onClick={() => handleCreateRule(ruleType.id)}
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">{ruleType.icon}</span>
                    <h4 className="font-semibold text-gray-900">{ruleType.name}</h4>
                  </div>
                  <p className="text-sm text-gray-600">{ruleType.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : showNLForm ? (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm border border-blue-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🤖</span>
              <h3 className="text-lg font-semibold text-gray-900">AI Rule Creator</h3>
            </div>
            <button
              onClick={() => setShowNLForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Describe your business rule in plain English
              </label>
              <textarea
                value={nlDescription}
                onChange={(e) => setNlDescription(e.target.value)}
                className="w-full h-32 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-black"
                placeholder="Examples:&#10;• 'Tasks T001 and T002 must always run together'&#10;• 'Marketing team can only handle 3 tasks per phase'&#10;• 'High priority clients should get preference over low priority ones'&#10;• 'Worker W001 should never work on Category A tasks'"
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowNLForm(false);
                  setNlDescription('');
                  setNlResult(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleNaturalLanguageRule}
                disabled={!nlDescription.trim() || isProcessingNL}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isProcessingNL ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  '🤖 Generate Rule'
                )}
              </button>
            </div>
          </div>

          {/* AI Rule Result */}
          {nlResult && (
            <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-white">
              <h4 className="font-medium text-gray-900 mb-2">AI Analysis</h4>
              <p className="text-sm text-gray-600 mb-4">{nlResult.explanation}</p>
              
              {nlResult.rule ? (
                <div className="space-y-4">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <h5 className="font-medium text-green-900 mb-1">Generated Rule</h5>
                    <p className="text-sm text-green-800">
                      <strong>{nlResult.rule.name}</strong> (Type: {nlResult.rule.type}, Priority: {nlResult.rule.priority})
                    </p>
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={handleRejectNLRule}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={handleAcceptNLRule}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      ✓ Accept Rule
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    Could not create a rule from this description. Please try being more specific or use the manual builder.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Create {ruleTypes.find(rt => rt.id === selectedRuleType)?.name}
          </h3>
          {selectedRuleType === 'coRun' && (
            <CoRunRuleForm onSubmit={handleRuleSubmit} onCancel={handleRuleCancel} />
          )}
          {selectedRuleType === 'loadLimit' && (
            <LoadLimitRuleForm onSubmit={handleRuleSubmit} onCancel={handleRuleCancel} />
          )}
          {!['coRun', 'loadLimit'].includes(selectedRuleType) && (
            <div className="text-center py-8">
              <p className="text-gray-500">Rule form for {selectedRuleType} coming soon...</p>
              <button
                onClick={handleRuleCancel}
                className="mt-4 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Back
              </button>
            </div>
          )}
        </div>
      )}

      {/* Existing Rules */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Active Rules ({rules.length})</h3>
        </div>
        
        {rules.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">⚙️</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Rules Created</h4>
            <p className="text-gray-600">
              Create your first business rule to start configuring resource allocation logic.
            </p>
          </div>
        ) : (
          <div className="p-6">
            <div className="space-y-4">
              {rules
                .sort((a, b) => a.priority - b.priority)
                .map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center">
                      <span className="text-xl mr-3">{getRuleTypeIcon(rule.type)}</span>
                      <div>
                        <h4 className="font-medium text-gray-900">{rule.name}</h4>
                        <p className="text-sm text-gray-600">{getRuleDescription(rule)}</p>
                        <div className="flex items-center mt-1">
                          <span className="text-xs text-gray-500">Priority: {rule.priority}</span>
                          <span className="mx-2 text-gray-300">•</span>
                          <span className="text-xs text-gray-500 capitalize">{rule.type}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md">
                        Edit
                      </button>
                      <button
                        onClick={() => removeRule(rule.id)}
                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
