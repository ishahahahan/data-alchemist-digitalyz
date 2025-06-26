'use client';

import { useState } from 'react';
import useAppStore from '@/store/useAppStore';
import { BusinessRule, CoRunRule, LoadLimitRule, SlotRestrictionRule, PhaseWindowRule } from '@/types';

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
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
  const { rules, addRule, removeRule } = useAppStore();

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
      {!showRuleForm ? (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Rule</h3>
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
