import { Client, Worker, Task, BusinessRule } from '@/types';

// Local AI Service - No external dependencies or API keys required

export class AIService {
  private static instance: AIService;
  
  private constructor() {}
  
  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  // Natural Language Search Filtering using local pattern matching
  async searchData(
    query: string, 
    data: (Client | Worker | Task)[], 
    dataType: 'clients' | 'workers' | 'tasks'
  ): Promise<(Client | Worker | Task)[]> {
    if (!query.trim()) return data;
    
    try {
      // Extract search patterns from natural language query
      const patterns = this.extractSearchPatterns(query, dataType);
      
      // Apply pattern-based filters
      return this.applyPatternFilters(data, patterns, dataType);
    } catch (error) {
      console.error('Local AI search error:', error);
      // Fallback to simple text search
      return this.simpleTextSearch(data, query);
    }
  }

  // Error correction suggestions using predefined patterns
  async suggestErrorCorrection(
    errorType: string,
    rowData: any,
    fieldName: string,
    currentValue: any
  ): Promise<{ suggestions: string[], explanation: string }> {
    try {
      const suggestions = this.generateErrorSuggestions(errorType, fieldName, currentValue, rowData);
      const explanation = this.getErrorExplanation(errorType, fieldName);
      
      return { suggestions, explanation };
    } catch (error) {
      console.error('Error correction error:', error);
      return {
        suggestions: [],
        explanation: "Unable to generate suggestions at this time."
      };
    }
  }

  // Natural Language Rule Creation using pattern recognition
  async createRuleFromNaturalLanguage(
    description: string,
    availableData: { clients: Client[], workers: Worker[], tasks: Task[] }
  ): Promise<{ rule: BusinessRule | null, explanation: string }> {
    try {
      const rulePattern = this.analyzeRuleDescription(description);
      const rule = this.createRuleFromPattern(rulePattern, availableData);
      
      return {
        rule,
        explanation: rule 
          ? `Created ${rule.type} rule based on pattern recognition from: "${description}"`
          : "Could not identify a clear rule pattern. Try phrases like 'tasks must run together', 'limit worker capacity', or 'client priority override'."
      };
    } catch (error) {
      console.error('Rule creation error:', error);
      return {
        rule: null,
        explanation: "Unable to parse the rule description. Please be more specific."
      };
    }
  }

  // Smart Header Mapping using fuzzy matching
  async mapHeaders(
    detectedHeaders: string[],
    expectedHeaders: string[],
    dataType: 'clients' | 'workers' | 'tasks'
  ): Promise<{ [key: string]: string }> {
    try {
      // Use enhanced fuzzy matching with domain knowledge
      return this.intelligentHeaderMapping(detectedHeaders, expectedHeaders, dataType);
    } catch (error) {
      console.error('Header mapping error:', error);
      // Fallback to simple fuzzy matching
      return this.fuzzyHeaderMapping(detectedHeaders, expectedHeaders);
    }
  }

  // Private helper methods for local AI functionality

  // Extract search patterns from natural language query
  private extractSearchPatterns(query: string, dataType: string) {
    const lowercaseQuery = query.toLowerCase();
    
    return {
      priority: this.extractPriority(lowercaseQuery),
      skills: this.extractSkills(lowercaseQuery),
      numbers: this.extractNumbers(lowercaseQuery),
      keywords: this.extractKeywords(lowercaseQuery),
      duration: this.extractDuration(lowercaseQuery),
      capacity: this.extractCapacity(lowercaseQuery),
      status: this.extractStatus(lowercaseQuery)
    };
  }

  // Apply pattern-based filters to data
  private applyPatternFilters(data: any[], patterns: any, dataType: string): any[] {
    return data.filter(item => {
      // Priority filtering
      if (patterns.priority && dataType === 'clients') {
        const priority = item.PriorityLevel;
        if (patterns.priority.operator === 'greater' && priority <= patterns.priority.value) return false;
        if (patterns.priority.operator === 'less' && priority >= patterns.priority.value) return false;
        if (patterns.priority.operator === 'equals' && priority !== patterns.priority.value) return false;
      }

      // Skills filtering
      if (patterns.skills.length > 0 && (dataType === 'workers' || dataType === 'tasks')) {
        const itemSkills = dataType === 'workers' ? item.Skills : item.RequiredSkills;        const hasMatchingSkill = patterns.skills.some((skill: string) =>
          itemSkills.toLowerCase().includes(skill.toLowerCase())
        );
        if (!hasMatchingSkill) return false;
      }

      // Duration filtering
      if (patterns.duration && dataType === 'tasks') {
        const duration = item.Duration;
        if (patterns.duration.operator === 'greater' && duration <= patterns.duration.value) return false;
        if (patterns.duration.operator === 'less' && duration >= patterns.duration.value) return false;
      }

      // Keyword search across all fields
      if (patterns.keywords.length > 0) {
        const hasMatchingKeyword = patterns.keywords.some((keyword: string) =>
          Object.values(item).some(value =>
            String(value).toLowerCase().includes(keyword.toLowerCase())
          )
        );
        if (!hasMatchingKeyword) return false;
      }

      return true;
    });
  }

  // Extract priority patterns from query
  private extractPriority(query: string) {
    if (query.includes('high priority') || query.includes('urgent') || query.includes('critical')) {
      return { operator: 'greater', value: 3 };
    }
    if (query.includes('low priority') || query.includes('minor')) {
      return { operator: 'less', value: 3 };
    }
    if (query.includes('medium priority')) {
      return { operator: 'equals', value: 3 };
    }
    if (query.includes('priority 5') || query.includes('level 5')) {
      return { operator: 'equals', value: 5 };
    }
    if (query.includes('priority 4') || query.includes('level 4')) {
      return { operator: 'equals', value: 4 };
    }
    return null;
  }

  // Extract skills from query
  private extractSkills(query: string): string[] {
    const commonSkills = [
      'javascript', 'js', 'typescript', 'ts', 'python', 'react', 'nodejs', 'node', 
      'sql', 'design', 'marketing', 'django', 'postgresql', 'docker', 'aws', 
      'terraform', 'testing', 'qa', 'devops', 'analytics', 'native'
    ];
    
    return commonSkills.filter(skill => 
      query.includes(skill) || query.includes(skill.replace('js', 'javascript'))
    );
  }

  // Extract duration patterns
  private extractDuration(query: string) {
    if (query.includes('longer than') || query.includes('more than')) {
      const numbers = this.extractNumbers(query);
      if (numbers.length > 0) {
        return { operator: 'greater', value: numbers[0] };
      }
    }
    if (query.includes('shorter than') || query.includes('less than')) {
      const numbers = this.extractNumbers(query);
      if (numbers.length > 0) {
        return { operator: 'less', value: numbers[0] };
      }
    }
    return null;
  }

  // Extract capacity patterns
  private extractCapacity(query: string) {
    if (query.includes('capacity') || query.includes('load') || query.includes('slots')) {
      const numbers = this.extractNumbers(query);
      return numbers.length > 0 ? numbers[0] : null;
    }
    return null;
  }

  // Extract status patterns
  private extractStatus(query: string): string[] {
    const statuses = ['active', 'inactive', 'pending', 'completed', 'available', 'busy'];
    return statuses.filter(status => query.includes(status));
  }

  // Extract numbers from query
  private extractNumbers(query: string): number[] {
    const matches = query.match(/\d+/g);
    return matches ? matches.map(Number) : [];
  }

  // Extract meaningful keywords
  private extractKeywords(query: string): string[] {
    const stopWords = ['the', 'and', 'or', 'with', 'for', 'show', 'find', 'get', 'all', 'any', 'that', 'have', 'are', 'is'];
    return query.split(' ')
      .filter(word => word.length > 2)
      .filter(word => !stopWords.includes(word.toLowerCase()))
      .map(word => word.toLowerCase());
  }

  // Generate error correction suggestions
  private generateErrorSuggestions(errorType: string, fieldName: string, currentValue: any, rowData: any): string[] {
    switch (errorType) {
      case 'out_of_range':
        if (fieldName === 'PriorityLevel') {
          return ['1', '2', '3', '4', '5'];
        }
        if (fieldName === 'Duration') {
          return ['1', '2', '3', '4', '5'];
        }
        if (fieldName === 'MaxLoadPerPhase') {
          return ['1', '2', '3', '4'];
        }
        break;
      
      case 'malformed_list':
        if (fieldName === 'AvailableSlots') {
          return ['[1,2,3]', '[1,3,5]', '[2,4]', '[1,2,3,4,5]'];
        }
        if (fieldName === 'PreferredPhases') {
          return ['[1,2]', '[2,3,4]', '[1,2,3]', '1-3', '2-5'];
        }
        if (fieldName === 'RequestedTaskIDs') {
          return ['T001,T002', 'T001,T003,T004', 'T002'];
        }
        break;
      
      case 'broken_json':
        return [
          '{"status": "active"}', 
          '{"priority": "high", "category": "urgent"}', 
          '{"department": "IT", "location": "office"}',
          '{}'
        ];
      
      case 'missing_required':
        if (fieldName === 'ClientName' || fieldName === 'WorkerName' || fieldName === 'TaskName') {
          return ['Please enter a name', 'Enter descriptive name', 'Add identifier'];
        }
        break;

      case 'duplicate_ids':
        const prefix = fieldName.includes('Client') ? 'C' : fieldName.includes('Worker') ? 'W' : 'T';
        const timestamp = Date.now().toString().slice(-4);
        return [
          `${prefix}${timestamp}`,
          `${prefix}${Math.floor(Math.random() * 1000)}`,
          `${prefix}NEW_${timestamp}`
        ];
      
      default:
        return ['Please check the data format', 'Refer to the schema documentation', 'Contact support for help'];
    }
    
    return [];
  }

  // Get error explanation
  private getErrorExplanation(errorType: string, fieldName: string): string {
    switch (errorType) {
      case 'out_of_range':
        return `${fieldName} must be within the valid range. Check the field requirements.`;
      case 'malformed_list':
        return `${fieldName} should be formatted as an array like [1,2,3] or a range like 1-3.`;
      case 'broken_json':
        return `${fieldName} contains invalid JSON. Ensure proper formatting with quotes around strings.`;
      case 'missing_required':
        return `${fieldName} is required and cannot be empty.`;
      case 'duplicate_ids':
        return `${fieldName} must be unique. Consider adding a suffix or using a different identifier.`;
      default:
        return 'Please review the data format and ensure it meets the required specifications.';
    }
  }

  // Analyze rule description for patterns
  private analyzeRuleDescription(description: string) {
    const lower = description.toLowerCase();
    
    if (lower.includes('together') || lower.includes('same time') || lower.includes('co-run')) {
      return { type: 'coRun', keywords: ['together', 'same time'] };
    }
    
    if (lower.includes('capacity') || lower.includes('load') || lower.includes('limit')) {
      return { type: 'loadLimit', keywords: ['capacity', 'load', 'limit'] };
    }
    
    if (lower.includes('slot') || lower.includes('restriction') || lower.includes('availability')) {
      return { type: 'slotRestriction', keywords: ['slot', 'restriction'] };
    }
    
    if (lower.includes('phase') || lower.includes('time') || lower.includes('window')) {
      return { type: 'phaseWindow', keywords: ['phase', 'time', 'window'] };
    }
    
    if (lower.includes('priority') || lower.includes('override') || lower.includes('precedence')) {
      return { type: 'precedenceOverride', keywords: ['priority', 'override'] };
    }
    
    return { type: 'patternMatch', keywords: ['custom'] };
  }

  // Create rule from pattern
  private createRuleFromPattern(pattern: any, availableData: any): BusinessRule | null {
    const ruleId = `rule_${Date.now()}`;
    
    switch (pattern.type) {
      case 'coRun':
        return {
          id: ruleId,
          type: 'coRun',
          name: 'Co-running Tasks Rule',
          priority: 5,
          taskIds: [], // Would need to be specified
          description: 'Tasks that must run together'
        };
      
      case 'loadLimit':
        return {
          id: ruleId,
          type: 'loadLimit',
          name: 'Worker Load Limit Rule',
          priority: 7,
          maxLoad: 3, // Default value
          description: 'Limits worker capacity per phase'
        };
      
      case 'slotRestriction':
        return {
          id: ruleId,
          type: 'slotRestriction',
          name: 'Slot Restriction Rule',
          priority: 6,
          maxSlots: 2, // Default value
          description: 'Restricts client slot usage'
        };
      
      case 'phaseWindow':
        return {
          id: ruleId,
          type: 'phaseWindow',
          name: 'Phase Window Rule',
          priority: 4,
          startPhase: 1,
          endPhase: 3,
          description: 'Time-based task constraints'
        };
      
      case 'precedenceOverride':
        return {
          id: ruleId,
          type: 'precedenceOverride',
          name: 'Priority Override Rule',
          priority: 8,
          description: 'Priority-based rule override'
        };
      
      default:
        return null;
    }
  }

  // Enhanced header mapping with domain knowledge
  private intelligentHeaderMapping(
    detectedHeaders: string[],
    expectedHeaders: string[],
    dataType: string
  ): { [key: string]: string } {
    const mapping: { [key: string]: string } = {};
    
    // Domain-specific synonyms
    const synonyms: { [key: string]: string[] } = {
      'ClientID': ['client_id', 'clientid', 'client', 'id', 'client_identifier'],
      'ClientName': ['client_name', 'clientname', 'name', 'company', 'organization'],
      'PriorityLevel': ['priority', 'priority_level', 'level', 'importance', 'urgency'],
      'WorkerID': ['worker_id', 'workerid', 'worker', 'employee_id', 'emp_id'],
      'WorkerName': ['worker_name', 'workername', 'name', 'employee_name', 'emp_name'],
      'Skills': ['skills', 'skill', 'capabilities', 'expertise', 'competencies'],
      'TaskID': ['task_id', 'taskid', 'task', 'job_id', 'activity_id'],
      'TaskName': ['task_name', 'taskname', 'name', 'title', 'description'],
      'Duration': ['duration', 'time', 'length', 'period', 'hours', 'days']
    };
    
    detectedHeaders.forEach(detected => {
      let bestMatch = null;
      let bestScore = 0;
      
      expectedHeaders.forEach(expected => {
        // Check direct match
        if (detected.toLowerCase() === expected.toLowerCase()) {
          bestMatch = expected;
          bestScore = 1.0;
          return;
        }
        
        // Check synonym match
        const expectedSynonyms = synonyms[expected] || [];
        if (expectedSynonyms.some(syn => syn.toLowerCase() === detected.toLowerCase())) {
          bestMatch = expected;
          bestScore = 0.95;
          return;
        }
        
        // Check fuzzy similarity
        const score = this.calculateSimilarity(detected, expected);
        if (score > bestScore && score > 0.6) {
          bestMatch = expected;
          bestScore = score;
        }
      });
      
      mapping[detected] = bestMatch || detected;
    });
    
    return mapping;
  }

  // Simple text search fallback
  private simpleTextSearch(data: any[], query: string): any[] {
    const lowercaseQuery = query.toLowerCase();
    return data.filter(item =>
      Object.values(item).some(value =>
        String(value).toLowerCase().includes(lowercaseQuery)
      )
    );
  }

  // Fuzzy header mapping fallback
  private fuzzyHeaderMapping(
    detectedHeaders: string[],
    expectedHeaders: string[]
  ): { [key: string]: string } {
    const mapping: { [key: string]: string } = {};
    
    detectedHeaders.forEach(detected => {
      let bestMatch = null;
      let bestScore = 0;
      
      expectedHeaders.forEach(expected => {
        const score = this.calculateSimilarity(detected, expected);
        if (score > bestScore && score > 0.6) {
          bestMatch = expected;
          bestScore = score;
        }
      });
      
      mapping[detected] = bestMatch || detected;
    });
    
    return mapping;
  }

  // Calculate string similarity
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  // Levenshtein distance calculation
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}

export const aiService = AIService.getInstance();
