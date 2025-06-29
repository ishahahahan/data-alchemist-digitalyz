import { Client, Worker, Task, ValidationError, BusinessRule } from '@/types';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Additional types for AI validation
interface ValidationPattern {
  type: string;
  field: string;
  rules: any;
  aiSuggestions: (value: any, context?: any) => AISuggestion[];
  contextualMessages: (value: any, context?: any) => string;
  confidence: number;
}

interface AISuggestion {
  type: string;
  field: string;
  currentValue: any;
  suggestedValue: any;
  confidence: number;
  reasoning: string;
}

interface DetectedPattern {
  id: string;
  type: string;
  description: string;
  affectedFields: string[];
  confidence: number;
  impact: 'low' | 'medium' | 'high';
}

interface ValidationInsight {
  type: string;
  message: string;
  actionable: boolean;
  priority: number;
}

interface AIValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  suggestions: AISuggestion[];
  patterns: DetectedPattern[];
  insights: ValidationInsight[];
  confidence: number;
  processingTime: number;
  learningApplied: boolean;
}

interface ValidationContext {
  dataSource: string;
  userPreferences: any;
  previousValidations: ValidationHistory[];
  domainKnowledge: any;
}

interface ValidationHistory {
  type: string;
  data: any;
  timestamp: Date;
}

interface ValidationFeedback {
  errorId: string;
  suggestionUsed: boolean;
  userCorrection?: string;
  effectiveness: number;
  timestamp: Date;
  context: any;
}

interface ItemValidationResult {
  errors: ValidationError[];
  suggestions: AISuggestion[];
  patterns: DetectedPattern[];
}

interface SemanticValidationResult {
  suggestions: AISuggestion[];
  patterns: DetectedPattern[];
}

interface PatternValidationResult {
  error?: ValidationError;
  suggestion?: AISuggestion;
  pattern?: DetectedPattern;
}

interface BusinessRuleContext {
  dataType: string;
  existingRules: BusinessRule[];
  domainKnowledge: any;
}

interface ExtractedEntity {
  type: string;
  value: string;
  confidence: number;
}

interface ExtractedConcept {
  concept: string;
  relevance: number;
}

interface ExtractedConstraint {
  type: string;
  operator: string;
  value: any;
  field?: string;
}

interface BusinessRuleTemplate {
  id: string;
  pattern: RegExp;
  type: string;
  confidence: number;
  generator: (entities: ExtractedEntity[], concepts: ExtractedConcept[], constraints: ExtractedConstraint[], context: BusinessRuleContext) => Promise<BusinessRule>;
}

interface ParsedBusinessRule {
  rule: BusinessRule | null;
  confidence: number;
  explanation: string;
  alternatives: BusinessRule[];
}

// Core AI Validation Engine
export class AIValidationEngine {
  private static instance: AIValidationEngine;
  private patterns: Map<string, ValidationPattern> = new Map();
  private businessRuleTemplates: BusinessRuleTemplate[] = [];
  private semanticMappings: Map<string, string[]> = new Map();
  private validationHistory: ValidationHistory[] = [];
  private genAI: GoogleGenerativeAI | null;
  private model: any;

  private constructor() {
    // Initialize Gemini AI
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY not found. AI validation will use fallback logic.');
      this.genAI = null;
      this.model = null;
    } else {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
    }
    
    this.initializeAIPatterns();
    this.loadSemanticMappings();
    this.initializeBusinessRuleTemplates();
  }

  static getInstance(): AIValidationEngine {
    if (!AIValidationEngine.instance) {
      AIValidationEngine.instance = new AIValidationEngine();
    }
    return AIValidationEngine.instance;
  }

  // Initialize AI patterns for validation
  private initializeAIPatterns() {
    // Priority Level Patterns
    this.patterns.set('priority_validation', {
      type: 'range_validation',
      field: 'PriorityLevel',
      rules: {
        min: 1,
        max: 5,
        type: 'integer'
      },
      aiSuggestions: this.generatePrioritySuggestions.bind(this),
      contextualMessages: this.generatePriorityMessages.bind(this),
      confidence: 0.95
    });

    // Email Validation Pattern
    this.patterns.set('email_validation', {
      type: 'format_validation',
      field: 'email',
      rules: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        required: true
      },
      aiSuggestions: this.generateEmailSuggestions.bind(this),
      contextualMessages: this.generateEmailMessages.bind(this),
      confidence: 0.90
    });

    // Skills Validation Pattern
    this.patterns.set('skills_validation', {
      type: 'semantic_validation',
      field: 'Skills',
      rules: {
        minSkills: 1,
        recognizedSkills: this.getRecognizedSkills(),
        fuzzyMatch: true
      },
      aiSuggestions: this.generateSkillsSuggestions.bind(this),
      contextualMessages: this.generateSkillsMessages.bind(this),
      confidence: 0.85
    });

    // JSON Validation Pattern
    this.patterns.set('json_validation', {
      type: 'structure_validation',
      field: 'AttributesJSON',
      rules: {
        validJSON: true,
        requiredFields: ['status'],
        allowedTypes: ['object']
      },
      aiSuggestions: this.generateJSONSuggestions.bind(this),
      contextualMessages: this.generateJSONMessages.bind(this),
      confidence: 0.92
    });
  }

  // Load semantic mappings for business concepts
  private loadSemanticMappings() {
    this.semanticMappings.set('priority_concepts', [
      'urgent', 'critical', 'high', 'important', 'rush',
      'normal', 'standard', 'medium', 'regular',
      'low', 'minor', 'basic', 'optional', 'deferred'
    ]);

    this.semanticMappings.set('skill_categories', [
      'programming', 'development', 'coding', 'software',
      'design', 'ui', 'ux', 'visual', 'creative',
      'management', 'leadership', 'coordination', 'planning',
      'analysis', 'data', 'research', 'investigation'
    ]);

    this.semanticMappings.set('business_domains', [
      'finance', 'healthcare', 'education', 'retail',
      'technology', 'manufacturing', 'consulting', 'marketing'
    ]);
  }

  // Initialize business rule templates
  private initializeBusinessRuleTemplates() {
    this.businessRuleTemplates = [
      {
        id: 'capacity_limit',
        pattern: /(?:limit|restrict|maximum|max|cap)\s+(?:capacity|load|tasks?|work)/i,
        type: 'loadLimit',
        confidence: 0.90,
        generator: this.generateCapacityRule.bind(this)
      },
      {
        id: 'co_execution',
        pattern: /(?:together|same\s+time|simultaneously|co-?run|parallel)/i,
        type: 'coRun',
        confidence: 0.85,
        generator: this.generateCoRunRule.bind(this)
      }
    ];
  }

  // Main AI validation method
  async validateWithAI(
    data: (Client | Worker | Task)[],
    dataType: 'clients' | 'workers' | 'tasks',
    context?: ValidationContext
  ): Promise<AIValidationResult> {
    const startTime = Date.now();
    const errors: ValidationError[] = [];
    const suggestions: AISuggestion[] = [];
    const patterns: DetectedPattern[] = [];

    try {
      if (this.model && data.length > 0) {
        // Use Gemini AI for intelligent validation
        const geminiResult = await this.validateWithGemini(data, dataType, context);
        errors.push(...geminiResult.errors);
        suggestions.push(...geminiResult.suggestions);
        patterns.push(...geminiResult.patterns);
      } else {
        // Fallback to local validation patterns
        for (let i = 0; i < data.length; i++) {
          const item = data[i];
          const itemValidation = await this.validateItem(item, dataType, i, context);
          
          errors.push(...itemValidation.errors);
          suggestions.push(...itemValidation.suggestions);
          patterns.push(...itemValidation.patterns);
        }
      }

      // Detect cross-item patterns
      const crossPatterns = await this.detectCrossItemPatterns(data, dataType);
      patterns.push(...crossPatterns);

      // Generate contextual insights
      const insights = await this.generateValidationInsights(errors, patterns, data);

      // Learn from validation results
      this.learnFromValidation(data, errors, suggestions, context);

      const processingTime = Date.now() - startTime;

      return {
        isValid: errors.length === 0,
        errors,
        suggestions,
        patterns,
        insights,
        confidence: this.calculateOverallConfidence(errors, suggestions),
        processingTime,
        learningApplied: true
      };
    } catch (error) {
      console.error('AI validation error:', error);
      
      // Fallback to basic validation on error
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        const itemValidation = await this.validateItem(item, dataType, i, context);
        
        errors.push(...itemValidation.errors);
        suggestions.push(...itemValidation.suggestions);
        patterns.push(...itemValidation.patterns);
      }

      const processingTime = Date.now() - startTime;

      return {
        isValid: errors.length === 0,
        errors,
        suggestions,
        patterns,
        insights: [],
        confidence: 0.5, // Lower confidence due to fallback
        processingTime,
        learningApplied: false
      };
    }
  }

  // Gemini-powered validation method
  private async validateWithGemini(
    data: (Client | Worker | Task)[],
    dataType: 'clients' | 'workers' | 'tasks',
    context?: ValidationContext
  ): Promise<{ errors: ValidationError[], suggestions: AISuggestion[], patterns: DetectedPattern[] }> {
    const errors: ValidationError[] = [];
    const suggestions: AISuggestion[] = [];
    const patterns: DetectedPattern[] = [];

    // Sample a subset of data for validation (to avoid token limits)
    const sampleSize = Math.min(data.length, 10);
    const sampleData = data.slice(0, sampleSize);

    const prompt = `
You are a data validation expert. Analyze this ${dataType} data for validation errors, inconsistencies, and improvement suggestions.

Data Type: ${dataType}
Sample Data (${sampleSize} of ${data.length} records):
${JSON.stringify(sampleData, null, 2)}

Context: ${context ? JSON.stringify(context) : 'None'}

Analyze for:
1. Data type mismatches
2. Missing required fields
3. Invalid formats (emails, dates, etc.)
4. Business logic violations
5. Inconsistent patterns across records
6. Semantic issues (e.g., skill name variations)

Return a JSON object with this structure:
{
  "errors": [
    {
      "id": "unique_id",
      "type": "error_type",
      "field": "field_name",
      "message": "error description",
      "row": row_index,
      "value": actual_value,
      "severity": "high|medium|low"
    }
  ],
  "suggestions": [
    {
      "type": "suggestion_type",
      "field": "field_name", 
      "currentValue": current_value,
      "suggestedValue": suggested_value,
      "confidence": 0.0-1.0,
      "reasoning": "explanation"
    }
  ],
  "patterns": [
    {
      "id": "pattern_id",
      "type": "pattern_type",
      "description": "pattern description",
      "affectedFields": ["field1", "field2"],
      "confidence": 0.0-1.0,
      "impact": "low|medium|high"
    }
  ]
}

Only return the JSON object, no other text.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      
      // Clean up the response - remove markdown code blocks if present
      text = text.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
      
      const parsed = JSON.parse(text);
      
      // Convert Gemini response to our internal format
      if (parsed.errors) {
        errors.push(...parsed.errors.map((error: any) => ({
          id: error.id || `error_${Date.now()}_${Math.random()}`,
          type: error.type || 'validation_error',
          field: error.field || 'unknown',
          message: error.message || 'Validation failed',
          row: error.row || 0,
          value: error.value,
          severity: error.severity || 'medium'
        })));
      }

      if (parsed.suggestions) {
        suggestions.push(...parsed.suggestions);
      }

      if (parsed.patterns) {
        patterns.push(...parsed.patterns);
      }

      return { errors, suggestions, patterns };
    } catch (error) {
      console.error('Gemini validation failed:', error);
      // Return empty results for fallback handling
      return { errors: [], suggestions: [], patterns: [] };
    }
  }

  // Validate individual item with AI
  private async validateItem(
    item: any,
    dataType: string,
    index: number,
    context?: ValidationContext
  ): Promise<ItemValidationResult> {
    const errors: ValidationError[] = [];
    const suggestions: AISuggestion[] = [];
    const patterns: DetectedPattern[] = [];

    // Apply relevant validation patterns
    for (const [patternId, pattern] of this.patterns) {
      if (this.isPatternApplicable(pattern, item, dataType)) {
        const result = await this.applyValidationPattern(pattern, item, index, context);
        
        if (result.error) {
          errors.push(result.error);
        }
        if (result.suggestion) {
          suggestions.push(result.suggestion);
        }
        if (result.pattern) {
          patterns.push(result.pattern);
        }
      }
    }

    // Apply semantic validation
    const semanticResults = await this.applySemanticValidation(item, dataType, index);
    suggestions.push(...semanticResults.suggestions);
    patterns.push(...semanticResults.patterns);

    return { errors, suggestions, patterns };
  }

  // Generate priority-related suggestions
  private generatePrioritySuggestions(value: any, context?: any): AISuggestion[] {
    const suggestions: AISuggestion[] = [];
    
    if (typeof value !== 'number' || value < 1 || value > 5) {
      const suggestedValue = typeof value === 'string' ? this.mapSemanticPriority(value) : 3;
      suggestions.push({
        type: 'priority_correction',
        field: 'PriorityLevel',
        currentValue: value,
        suggestedValue: suggestedValue || 3,
        confidence: 0.8,
        reasoning: 'Priority level should be between 1-5. Inferred from text content or set to default.'
      });
    }
    
    return suggestions;
  }

  // Generate contextual messages for priority validation
  private generatePriorityMessages(value: any, context?: any): string {
    if (typeof value !== 'number') {
      return `Priority "${value}" should be a number between 1-5 (1=lowest, 5=highest)`;
    }
    if (value < 1 || value > 5) {
      return `Priority ${value} is out of range. Use 1-5 scale (1=lowest, 5=highest)`;
    }
    return '';
  }

  // Generate email suggestions
  private generateEmailSuggestions(value: any, context?: any): AISuggestion[] {
    const suggestions: AISuggestion[] = [];
    const email = String(value);
    
    if (!email.includes('@')) {
      suggestions.push({
        type: 'email_correction',
        field: 'email',
        currentValue: value,
        suggestedValue: this.suggestEmailFormat(email),
        confidence: 0.7,
        reasoning: 'Email appears to be missing @ symbol'
      });
    }
    
    return suggestions;
  }

  // Generate email validation messages
  private generateEmailMessages(value: any, context?: any): string {
    const email = String(value);
    if (!email.includes('@')) {
      return 'Email must contain @ symbol';
    }
    if (!email.includes('.')) {
      return 'Email must contain a domain extension';
    }
    return 'Invalid email format';
  }

  // Generate skills suggestions
  private generateSkillsSuggestions(value: any, context?: any): AISuggestion[] {
    const suggestions: AISuggestion[] = [];
    const skills = String(value);
    
    if (!skills.trim()) {
      suggestions.push({
        type: 'skills_required',
        field: 'Skills',
        currentValue: value,
        suggestedValue: 'general',
        confidence: 0.6,
        reasoning: 'Skills field cannot be empty'
      });
    } else {
      // Check for skill corrections using fuzzy matching
      const skillArray = skills.split(',').map(s => s.trim());
      skillArray.forEach(skill => {
        const correctedSkill = this.findBestSkillMatch(skill);
        if (correctedSkill && correctedSkill !== skill) {
          suggestions.push({
            type: 'fuzzy_correction',
            field: 'Skills',
            currentValue: skill,
            suggestedValue: correctedSkill,
            confidence: 0.8,
            reasoning: `"${skill}" might be "${correctedSkill}" based on common skill patterns`
          });
        }
      });
    }
    
    return suggestions;
  }

  // Generate skills validation messages
  private generateSkillsMessages(value: any, context?: any): string {
    const skills = String(value);
    if (!skills.trim()) {
      return 'Skills field cannot be empty';
    }
    return 'Skills should be comma-separated values';
  }

  // Generate JSON suggestions
  private generateJSONSuggestions(value: any, context?: any): AISuggestion[] {
    const suggestions: AISuggestion[] = [];
    
    try {
      JSON.parse(String(value));
    } catch (error) {
      suggestions.push({
        type: 'json_correction',
        field: 'AttributesJSON',
        currentValue: value,
        suggestedValue: this.fixCommonJSONErrors(String(value)),
        confidence: 0.85,
        reasoning: 'JSON syntax error detected, attempting auto-fix'
      });
    }
    
    return suggestions;
  }

  // Generate JSON validation messages
  private generateJSONMessages(value: any, context?: any): string {
    try {
      JSON.parse(String(value));
      return '';
    } catch (error) {
      return `Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  // Apply semantic validation using NLP concepts
  private async applySemanticValidation(
    item: any,
    dataType: string,
    index: number
  ): Promise<SemanticValidationResult> {
    const suggestions: AISuggestion[] = [];
    const patterns: DetectedPattern[] = [];

    // Analyze text fields for semantic meaning
    if (dataType === 'clients' && item.GroupTag) {
      const semanticAnalysis = this.analyzeSemanticMeaning(item.GroupTag, 'business_domains');
      if (semanticAnalysis && semanticAnalysis.confidence > 0.7) {
        suggestions.push({
          type: 'semantic_enhancement',
          field: 'GroupTag',
          currentValue: item.GroupTag,
          suggestedValue: semanticAnalysis.suggestion,
          confidence: semanticAnalysis.confidence,
          reasoning: `Semantic analysis suggests "${semanticAnalysis.suggestion}" based on business domain patterns`
        });
      }
    }

    // Analyze skills for semantic clustering
    if (dataType === 'workers' && item.Skills) {
      const skillAnalysis = this.analyzeSkillSemantics(item.Skills);
      if (skillAnalysis.suggestions.length > 0) {
        suggestions.push(...skillAnalysis.suggestions);
      }
      patterns.push(...skillAnalysis.patterns);
    }

    return { suggestions, patterns };
  }

  // Natural Language Business Rule Parser
  async parseBusinessRule(description: string, context: BusinessRuleContext): Promise<ParsedBusinessRule> {
    try {
      if (this.model) {
        // Use Gemini AI for intelligent rule parsing
        return await this.parseBusinessRuleWithGemini(description, context);
      } else {
        // Fallback to local pattern matching
        return this.parseBusinessRuleLocally(description, context);
      }
    } catch (error) {
      console.error('Business rule parsing error:', error);
      return {
        rule: null,
        confidence: 0,
        explanation: "Unable to parse the business rule description. Please be more specific.",
        alternatives: []
      };
    }
  }

  // Gemini-powered business rule parsing
  private async parseBusinessRuleWithGemini(description: string, context: BusinessRuleContext): Promise<ParsedBusinessRule> {
    const prompt = `
You are a business rule creation expert. Parse this natural language description into a structured business rule:

Description: "${description}"

Context:
- Data Type: ${context.dataType}
- Existing Rules: ${context.existingRules.length} rules
- Domain: Data scheduling and validation system

Available Business Rule Types:
1. coRun - Tasks that must run together
2. loadLimit - Worker capacity limits per phase
3. slotRestriction - Client slot usage limitations
4. phaseWindow - Time-based task constraints
5. precedenceOverride - Priority-based rule overrides

Return a JSON object:
{
  "rule": {
    "id": "rule_[timestamp]",
    "type": "coRun|loadLimit|slotRestriction|phaseWindow|precedenceOverride",
    "name": "Descriptive Rule Name",
    "priority": 1-10,
    "description": "What this rule does",
    // Additional fields based on type:
    // For coRun: "taskIds": ["T1", "T2"]
    // For loadLimit: "maxLoad": number
    // For slotRestriction: "maxSlots": number
    // For phaseWindow: "startPhase": number, "endPhase": number
  } | null,
  "confidence": 0.0-1.0,
  "explanation": "Why this rule was created or why it failed",
  "alternatives": [
    // Alternative rule interpretations
  ]
}

Examples of natural language descriptions:
- "Tasks T1 and T2 must run together" → coRun rule
- "Workers can handle max 3 tasks" → loadLimit rule
- "Clients can only use 2 slots" → slotRestriction rule
- "Tasks must run in phases 1-3" → phaseWindow rule
- "High priority overrides normal rules" → precedenceOverride rule

Only return the JSON object, no other text.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      
      // Clean up the response - remove markdown code blocks if present
      text = text.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
      
      const parsed = JSON.parse(text);
      
      // Ensure the rule has a proper ID
      if (parsed.rule) {
        parsed.rule.id = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      
      return {
        rule: parsed.rule,
        confidence: parsed.confidence || 0,
        explanation: parsed.explanation || 'Rule created using Gemini AI',
        alternatives: parsed.alternatives || []
      };
    } catch (error) {
      console.error('Gemini business rule parsing failed:', error);
      return this.parseBusinessRuleLocally(description, context);
    }
  }

  // Local fallback business rule parsing
  private async parseBusinessRuleLocally(description: string, context: BusinessRuleContext): Promise<ParsedBusinessRule> {
    const normalizedDescription = description.toLowerCase().trim();
    
    // Extract entities and concepts
    const entities = this.extractEntities(normalizedDescription);
    const concepts = this.extractConcepts(normalizedDescription);
    const constraints = this.extractConstraints(normalizedDescription);

    // Match against rule templates
    let bestMatch: BusinessRuleTemplate | null = null;
    let bestConfidence = 0;

    for (const template of this.businessRuleTemplates) {
      const match = normalizedDescription.match(template.pattern);
      if (match && template.confidence > bestConfidence) {
        bestMatch = template;
        bestConfidence = template.confidence;
      }
    }

    if (bestMatch) {
      const rule = await bestMatch.generator(entities, concepts, constraints, context);
      return {
        rule,
        confidence: bestConfidence,
        explanation: this.generateRuleExplanation(rule, description),
        alternatives: []
      };
    }

    return {
      rule: null,
      confidence: 0,
      explanation: "Could not parse the business rule description. Try being more specific about the constraint type and affected entities.",
      alternatives: []
    };
  }

  // Helper methods for AI functionality
  private mapSemanticPriority(value: string): number | null {
    const priorityMappings: { [key: string]: number } = {
      'critical': 5, 'urgent': 5, 'high': 4, 'important': 4,
      'normal': 3, 'medium': 3, 'standard': 3,
      'low': 2, 'minor': 1, 'optional': 1
    };
    
    return priorityMappings[value.toLowerCase()] || null;
  }

  private suggestEmailFormat(text: string): string {
    // Simple email suggestion logic
    if (text.includes(' ')) {
      return text.replace(/\s+/g, '.') + '@example.com';
    }
    return text + '@example.com';
  }

  private fixCommonJSONErrors(jsonString: string): string {
    // Fix common JSON syntax errors
    return jsonString
      .replace(/'/g, '"') // Replace single quotes with double quotes
      .replace(/,\s*}/g, '}') // Remove trailing commas
      .replace(/,\s*]/g, ']'); // Remove trailing commas in arrays
  }

  private getRecognizedSkills(): string[] {
    return [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++',
      'React', 'Angular', 'Vue.js', 'Node.js', 'Express',
      'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis',
      'AWS', 'Azure', 'Docker', 'Kubernetes', 'Terraform',
      'Git', 'CI/CD', 'DevOps', 'Testing', 'Agile'
    ];
  }

  private findBestSkillMatch(skill: string): string | null {
    const recognizedSkills = this.getRecognizedSkills();
    let bestMatch = null;
    let bestScore = 0;

    for (const recognized of recognizedSkills) {
      const score = this.calculateStringSimilarity(skill.toLowerCase(), recognized.toLowerCase());
      if (score > bestScore && score > 0.7) {
        bestMatch = recognized;
        bestScore = score;
      }
    }

    return bestMatch;
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

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

  private calculateOverallConfidence(errors: ValidationError[], suggestions: AISuggestion[]): number {
    if (errors.length === 0) return 1.0;
    
    const avgSuggestionConfidence = suggestions.length > 0 
      ? suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length
      : 0.5;
    
    return Math.max(0.1, avgSuggestionConfidence - (errors.length * 0.1));
  }

  private isPatternApplicable(pattern: ValidationPattern, item: any, dataType: string): boolean {
    return item.hasOwnProperty(pattern.field);
  }

  private async applyValidationPattern(
    pattern: ValidationPattern,
    item: any,
    index: number,
    context?: ValidationContext
  ): Promise<PatternValidationResult> {
    const value = item[pattern.field];
    const result: PatternValidationResult = {};

    // Apply pattern-specific validation logic
    switch (pattern.type) {
      case 'range_validation':
        if (typeof value !== 'number' || value < pattern.rules.min || value > pattern.rules.max) {
          result.error = {
            type: 'range_error',
            message: pattern.contextualMessages(value, context),
            affectedRows: [index],
            affectedColumns: [pattern.field],
            severity: 'error'
          };
        }
        break;
      
      case 'format_validation':
        if (!pattern.rules.pattern.test(String(value))) {
          result.error = {
            type: 'format_error',
            message: pattern.contextualMessages(value, context),
            affectedRows: [index],
            affectedColumns: [pattern.field],
            severity: 'error'
          };
        }
        break;
      
      case 'structure_validation':
        try {
          JSON.parse(String(value));
        } catch (error) {
          result.error = {
            type: 'json_error',
            message: pattern.contextualMessages(value, context),
            affectedRows: [index],
            affectedColumns: [pattern.field],
            severity: 'error'
          };
        }
        break;
    }

    // Generate suggestions
    const suggestions = pattern.aiSuggestions(value, context);
    if (suggestions.length > 0) {
      result.suggestion = suggestions[0]; // Take the first suggestion
    }

    return result;
  }

  // Machine Learning Pattern Detection
  private async detectCrossItemPatterns(
    data: any[],
    dataType: string
  ): Promise<DetectedPattern[]> {
    const patterns: DetectedPattern[] = [];

    // Detect duplicate patterns
    const duplicatePattern = this.detectDuplicatePatterns(data);
    if (duplicatePattern) patterns.push(duplicatePattern);

    // Detect distribution patterns
    const distributionPatterns = this.detectDistributionPatterns(data, dataType);
    patterns.push(...distributionPatterns);

    return patterns;
  }

  // Business Rule Generators
  private async generateCapacityRule(
    entities: ExtractedEntity[],
    concepts: ExtractedConcept[],
    constraints: ExtractedConstraint[],
    context: BusinessRuleContext
  ): Promise<BusinessRule> {
    const capacityLimit = constraints.find(c => c.type === 'numeric')?.value || 3;
    const targetGroup = entities.find(e => e.type === 'worker_group')?.value || 'Default';

    return {
      id: `capacity_${Date.now()}`,
      type: 'loadLimit',
      name: `${targetGroup} Capacity Limit`,
      priority: 5,
      workerGroup: targetGroup,
      maxSlotsPerPhase: capacityLimit,
      description: `Limit ${targetGroup} workers to maximum ${capacityLimit} tasks per phase`
    };
  }

  private async generateCoRunRule(
    entities: ExtractedEntity[],
    concepts: ExtractedConcept[],
    constraints: ExtractedConstraint[],
    context: BusinessRuleContext
  ): Promise<BusinessRule> {
    const taskIds = entities.filter(e => e.type === 'task_id').map(e => e.value);

    return {
      id: `corun_${Date.now()}`,
      type: 'coRun',
      name: 'Co-execution Rule',
      priority: 7,
      tasks: taskIds,
      description: `Tasks ${taskIds.join(', ')} must execute together in the same phase`
    };
  }

  // Stub implementations for missing methods
  private async generateValidationInsights(errors: ValidationError[], patterns: DetectedPattern[], data: any[]): Promise<ValidationInsight[]> {
    const insights: ValidationInsight[] = [];
    
    if (errors.length > 0) {
      insights.push({
        type: 'error_summary',
        message: `Found ${errors.length} validation error(s) in the data`,
        actionable: true,
        priority: 1
      });
    }

    if (patterns.length > 0) {
      insights.push({
        type: 'pattern_detected',
        message: `Detected ${patterns.length} data pattern(s) that may need attention`,
        actionable: true,
        priority: 2
      });
    }

    return insights;
  }

  private learnFromValidation(data: any[], errors: ValidationError[], suggestions: AISuggestion[], context?: ValidationContext) {
    // Store validation results for future learning
    this.validationHistory.push({
      type: 'validation_complete',
      data: { dataCount: data.length, errorCount: errors.length, suggestionCount: suggestions.length },
      timestamp: new Date()
    });
  }

  private analyzeSemanticMeaning(value: string, category: string): { confidence: number; suggestion: string } | null {
    const mappings = this.semanticMappings.get(category);
    if (!mappings) return null;

    const lowerValue = value.toLowerCase();
    for (const mapping of mappings) {
      if (lowerValue.includes(mapping) || mapping.includes(lowerValue)) {
        return {
          confidence: 0.8,
          suggestion: mapping
        };
      }
    }

    return null;
  }

  private analyzeSkillSemantics(skills: string): { suggestions: AISuggestion[]; patterns: DetectedPattern[] } {
    return {
      suggestions: [],
      patterns: []
    };
  }

  private extractEntities(description: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    
    // Simple entity extraction - in a real implementation, this would use NLP
    const numberMatches = description.match(/\d+/g);
    if (numberMatches) {
      numberMatches.forEach(num => {
        entities.push({
          type: 'numeric',
          value: num,
          confidence: 0.9
        });
      });
    }

    return entities;
  }

  private extractConcepts(description: string): ExtractedConcept[] {
    const concepts: ExtractedConcept[] = [];
    
    // Simple concept extraction
    if (description.includes('capacity') || description.includes('limit')) {
      concepts.push({
        concept: 'capacity_management',
        relevance: 0.9
      });
    }

    return concepts;
  }

  private extractConstraints(description: string): ExtractedConstraint[] {
    const constraints: ExtractedConstraint[] = [];
    
    // Simple constraint extraction
    const numberMatches = description.match(/(\d+)/g);
    if (numberMatches) {
      constraints.push({
        type: 'numeric',
        operator: 'max',
        value: parseInt(numberMatches[0])
      });
    }

    return constraints;
  }

  private generateRuleExplanation(rule: BusinessRule, description: string): string {
    return `Generated rule "${rule.name}" from description: "${description}". This rule enforces ${rule.type} constraints.`;
  }

  private async generateAlternativeRules(description: string, context: BusinessRuleContext): Promise<BusinessRule[]> {
    // Return empty array for now - in a real implementation, this would generate alternatives
    return [];
  }

  private detectDuplicatePatterns(data: any[]): DetectedPattern | null {
    const duplicates = new Map<string, number>();
    
    data.forEach(item => {
      const key = JSON.stringify(item);
      duplicates.set(key, (duplicates.get(key) || 0) + 1);
    });

    const duplicateCount = Array.from(duplicates.values()).filter(count => count > 1).length;
    
    if (duplicateCount > 0) {
      return {
        id: 'duplicate_pattern',
        type: 'duplicate',
        description: `Found ${duplicateCount} potential duplicate entries`,
        affectedFields: ['*'],
        confidence: 0.9,
        impact: 'medium'
      };
    }

    return null;
  }

  private detectDistributionPatterns(data: any[], dataType: string): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];
    
    // Simple distribution analysis - in a real implementation, this would be more sophisticated
    const fieldDistributions: { [key: string]: { [value: string]: number } } = {};
    
    data.forEach(item => {
      Object.keys(item).forEach(field => {
        if (!fieldDistributions[field]) {
          fieldDistributions[field] = {};
        }
        const value = String(item[field]);
        fieldDistributions[field][value] = (fieldDistributions[field][value] || 0) + 1;
      });
    });

    Object.keys(fieldDistributions).forEach(field => {
      const values = Object.values(fieldDistributions[field]);
      const maxCount = Math.max(...values);
      const totalCount = values.reduce((sum, count) => sum + count, 0);
      
      if (maxCount / totalCount > 0.8) {
        patterns.push({
          id: `skewed_distribution_${field}`,
          type: 'distribution',
          description: `Field "${field}" has a highly skewed distribution`,
          affectedFields: [field],
          confidence: 0.8,
          impact: 'low'
        });
      }
    });

    return patterns;
  }

  // Record validation feedback
  recordValidationFeedback(
    errorId: string,
    suggestionUsed: boolean,
    userCorrection?: string,
    effectiveness?: number
  ) {
    const feedback: ValidationFeedback = {
      errorId,
      suggestionUsed,
      userCorrection,
      effectiveness: effectiveness || (suggestionUsed ? 1 : 0),
      timestamp: new Date(),
      context: this.getCurrentValidationContext()
    };

    this.validationHistory.push({
      type: 'feedback',
      data: feedback,
      timestamp: new Date()
    });
  }

  private getCurrentValidationContext(): any {
    return {
      timestamp: new Date(),
      validationCount: this.validationHistory.length
    };
  }
}

// Export the singleton instance
export const aiValidationEngine = AIValidationEngine.getInstance();
