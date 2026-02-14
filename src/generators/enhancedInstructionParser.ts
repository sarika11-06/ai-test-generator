/**
 * Enhanced Instruction Parser
 * Advanced natural language processing for varied testing instructions
 * Handles complex, ambiguous, and diverse input patterns
 */

export interface EnhancedParsedInstruction {
  // Core components
  actions: ParsedAction[];
  targets: ParsedTarget[];
  conditions: ParsedCondition[];
  validations: ParsedValidation[];
  
  // Context and metadata
  context: InstructionContext;
  confidence: number;
  ambiguities: string[];
  suggestions: string[];
  
  // Generated test structure
  testFlow: TestStep[];
  expectedOutcomes: ExpectedOutcome[];
}

export interface ParsedAction {
  type: 'HTTP_REQUEST' | 'VALIDATION' | 'DATA_MANIPULATION' | 'NAVIGATION' | 'INTERACTION' | 'ASSERTION';
  verb: string;
  object: string;
  modifiers: string[];
  confidence: number;
}

export interface ParsedTarget {
  type: 'URL' | 'ENDPOINT' | 'ELEMENT' | 'DATA_FIELD' | 'HEADER' | 'RESPONSE';
  value: string;
  properties: Record<string, any>;
  confidence: number;
}

export interface ParsedCondition {
  type: 'SECURITY' | 'VALIDATION' | 'STATE' | 'TIMING' | 'DATA';
  description: string;
  parameters: Record<string, any>;
  confidence: number;
}

export interface ParsedValidation {
  type: 'STATUS_CODE' | 'RESPONSE_CONTENT' | 'HEADERS' | 'BEHAVIOR' | 'SECURITY';
  expectation: string;
  criteria: string[];
  confidence: number;
}

export interface InstructionContext {
  domain: 'API' | 'UI' | 'SECURITY' | 'ACCESSIBILITY' | 'PERFORMANCE' | 'MIXED';
  complexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX' | 'VERY_COMPLEX';
  testType: string[];
  securityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  language: 'FORMAL' | 'CASUAL' | 'TECHNICAL' | 'MIXED';
}

export interface TestStep {
  stepNumber: number;
  action: string;
  details: string;
  expectedResult: string;
  validations: string[];
  code?: string;
}

export interface ExpectedOutcome {
  type: 'SUCCESS' | 'FAILURE' | 'ERROR' | 'SECURITY_BLOCK' | 'VALIDATION_ERROR';
  description: string;
  criteria: string[];
}

export class EnhancedInstructionParser {
  private readonly actionPatterns = {
    HTTP_REQUEST: {
      patterns: [
        // Direct HTTP verbs
        /\b(send|make|perform|execute|call|invoke)\s+(a\s+)?(get|post|put|patch|delete|head|options)\s+(request|call)/i,
        // Implicit HTTP actions
        /\b(login|authenticate|register|submit|upload|download|fetch|retrieve)/i,
        // API-specific actions
        /\b(call|invoke|access|hit)\s+(the\s+)?(api|endpoint|service)/i,
        // RESTful actions
        /\b(create|read|update|delete|list|search)\s+(a\s+)?(user|resource|item|record)/i
      ],
      extractors: [
        (text: string) => this.extractHttpMethod(text),
        (text: string) => this.extractApiAction(text)
      ]
    },
    VALIDATION: {
      patterns: [
        /\b(verify|check|validate|ensure|confirm|assert|test)\s+/i,
        /\b(should|must|expect|require)\s+/i,
        /\b(response|result|output|status)\s+(contains|includes|has|shows)/i
      ],
      extractors: [
        (text: string) => this.extractValidationType(text),
        (text: string) => this.extractExpectation(text)
      ]
    },
    DATA_MANIPULATION: {
      patterns: [
        /\b(set|add|include|attach|insert|inject|provide)\s+/i,
        /\b(with|using|containing|having)\s+/i,
        /\b(header|parameter|field|data|payload|body)\s+/i
      ],
      extractors: [
        (text: string) => this.extractDataOperation(text),
        (text: string) => this.extractDataTarget(text)
      ]
    },
    ASSERTION: {
      patterns: [
        /\b(store|capture|save|record|log|extract)\s+/i,
        /\b(measure|count|calculate|analyze)\s+/i,
        /\b(compare|match|equal|different)\s+/i
      ],
      extractors: [
        (text: string) => this.extractAssertionType(text)
      ]
    }
  };

  private readonly securityPatterns = {
    INJECTION: [
      /\b(sql|xss|script|injection|inject|malicious|payload)\b/i,
      /'.*or.*1.*=.*1|<script|javascript:|union\s+select/i
    ],
    AUTHENTICATION: [
      /\b(auth|login|password|token|credential|session)\b/i,
      /\b(invalid|wrong|expired|missing|unauthorized)\b/i
    ],
    AUTHORIZATION: [
      /\b(access|permission|role|privilege|admin|unauthorized)\b/i,
      /\b(forbidden|denied|restricted|elevated)\b/i
    ],
    DATA_EXPOSURE: [
      /\b(sensitive|private|confidential|personal|password|credit.*card|ssn)\b/i,
      /\b(leak|expose|reveal|show|display)\b/i
    ],
    HEADERS: [
      /\b(header|x-.*|content-type|authorization|bearer)\b/i,
      /\b(security.*header|cors|csp|frame.*options)\b/i
    ]
  };

  private readonly contextClues = {
    COMPLEXITY_INDICATORS: {
      SIMPLE: [/\b(just|only|simply|basic|single)\b/i],
      MODERATE: [/\b(also|then|after|before|while)\b/i],
      COMPLEX: [/\b(multiple|various|different|several|complex)\b/i],
      VERY_COMPLEX: [/\b(comprehensive|thorough|extensive|advanced|sophisticated)\b/i]
    },
    LANGUAGE_STYLE: {
      FORMAL: [/\b(shall|must|should|require|ensure|validate)\b/i],
      CASUAL: [/\b(just|maybe|kinda|sorta|like|you know)\b/i],
      TECHNICAL: [/\b(api|endpoint|json|http|status|response|request)\b/i]
    }
  };

  /**
   * Enhanced instruction parsing with advanced NLP
   */
  public parseInstruction(instruction: string, url?: string): EnhancedParsedInstruction {
    console.log('🔍 Enhanced parsing instruction:', instruction);
    
    // Normalize and preprocess
    const normalized = this.normalizeInstruction(instruction);
    const sentences = this.splitIntoSentences(normalized);
    
    // Extract core components
    const actions = this.extractActions(sentences);
    const targets = this.extractTargets(sentences, url);
    const conditions = this.extractConditions(sentences);
    const validations = this.extractValidations(sentences);
    
    // Analyze context
    const context = this.analyzeContext(instruction, actions, targets);
    
    // Calculate confidence and identify ambiguities
    const confidence = this.calculateConfidence(actions, targets, conditions, validations);
    const ambiguities = this.identifyAmbiguities(instruction, actions, targets);
    const suggestions = this.generateSuggestions(ambiguities, context);
    
    // Generate test flow
    const testFlow = this.generateTestFlow(actions, targets, conditions, validations);
    const expectedOutcomes = this.generateExpectedOutcomes(validations, context);
    
    return {
      actions,
      targets,
      conditions,
      validations,
      context,
      confidence,
      ambiguities,
      suggestions,
      testFlow,
      expectedOutcomes
    };
  }

  /**
   * Advanced instruction normalization
   */
  private normalizeInstruction(instruction: string): string {
    return instruction
      // Fix common typos and variations
      .replace(/\b(recieve|recive)\b/gi, 'receive')
      .replace(/\b(seperate)\b/gi, 'separate')
      .replace(/\b(occured)\b/gi, 'occurred')
      // Standardize quotes
      .replace(/[""'']/g, '"')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Split instruction into logical sentences
   */
  private splitIntoSentences(instruction: string): string[] {
    // Split on sentence boundaries, considering common test instruction patterns
    return instruction
      .split(/[.!?;]|\.\s+|\band\s+then\b|\bthen\b|\bafter\s+that\b|\bnext\b/i)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  /**
   * Extract actions with advanced pattern matching
   */
  private extractActions(sentences: string[]): ParsedAction[] {
    const actions: ParsedAction[] = [];
    
    for (const sentence of sentences) {
      for (const [actionType, config] of Object.entries(this.actionPatterns)) {
        for (const pattern of config.patterns) {
          const match = sentence.match(pattern);
          if (match) {
            const action: ParsedAction = {
              type: actionType as any,
              verb: this.extractVerb(sentence, match),
              object: this.extractObject(sentence, match),
              modifiers: this.extractModifiers(sentence),
              confidence: this.calculateActionConfidence(sentence, pattern)
            };
            actions.push(action);
          }
        }
      }
    }
    
    return this.deduplicateActions(actions);
  }

  /**
   * Extract targets with context awareness
   */
  private extractTargets(sentences: string[], url?: string): ParsedTarget[] {
    const targets: ParsedTarget[] = [];
    
    // Add URL as primary target if provided
    if (url) {
      targets.push({
        type: 'URL',
        value: url,
        properties: this.analyzeUrl(url),
        confidence: 1.0
      });
    }
    
    for (const sentence of sentences) {
      // Extract endpoints
      const endpointMatch = sentence.match(/\b(\/\w+(?:\/\w+)*|\w+\s+(?:api|endpoint))\b/i);
      if (endpointMatch) {
        targets.push({
          type: 'ENDPOINT',
          value: endpointMatch[1],
          properties: {},
          confidence: 0.8
        });
      }
      
      // Extract headers
      const headerMatch = sentence.match(/\b(x-[\w-]+|authorization|content-type|accept|user-agent)\b/i);
      if (headerMatch) {
        targets.push({
          type: 'HEADER',
          value: headerMatch[1],
          properties: this.analyzeHeader(headerMatch[1]),
          confidence: 0.9
        });
      }
      
      // Extract data fields
      const fieldMatches = sentence.match(/\b(username|email|password|name|id|token|data|payload)\b/gi);
      if (fieldMatches) {
        fieldMatches.forEach(field => {
          targets.push({
            type: 'DATA_FIELD',
            value: field.toLowerCase(),
            properties: { sensitive: this.isSensitiveField(field) },
            confidence: 0.7
          });
        });
      }
    }
    
    return targets;
  }

  /**
   * Extract conditions with security awareness
   */
  private extractConditions(sentences: string[]): ParsedCondition[] {
    const conditions: ParsedCondition[] = [];
    
    for (const sentence of sentences) {
      // Security conditions
      for (const [secType, patterns] of Object.entries(this.securityPatterns)) {
        for (const pattern of patterns) {
          if (pattern.test(sentence)) {
            conditions.push({
              type: 'SECURITY',
              description: `${secType.toLowerCase()} security test condition`,
              parameters: { securityType: secType, pattern: pattern.source },
              confidence: 0.8
            });
          }
        }
      }
      
      // Validation conditions
      if (/\b(invalid|wrong|missing|empty|null|undefined)\b/i.test(sentence)) {
        conditions.push({
          type: 'VALIDATION',
          description: 'Invalid input condition',
          parameters: { inputType: 'invalid' },
          confidence: 0.7
        });
      }
      
      // State conditions
      if (/\b(without|before|after|during|while)\b/i.test(sentence)) {
        conditions.push({
          type: 'STATE',
          description: 'State-dependent condition',
          parameters: { stateType: 'temporal' },
          confidence: 0.6
        });
      }
    }
    
    return conditions;
  }

  /**
   * Extract validations with expectation analysis
   */
  private extractValidations(sentences: string[]): ParsedValidation[] {
    const validations: ParsedValidation[] = [];
    
    for (const sentence of sentences) {
      // Status code validations
      const statusMatch = sentence.match(/\b(status|code|response)\s+(?:is|should\s+be|equals?)\s+(\d{3})\b/i);
      if (statusMatch) {
        validations.push({
          type: 'STATUS_CODE',
          expectation: `Status code should be ${statusMatch[2]}`,
          criteria: [`status === ${statusMatch[2]}`],
          confidence: 0.9
        });
      }
      
      // Response content validations
      if (/\b(contains|includes|has|shows|displays)\b/i.test(sentence)) {
        const contentMatch = sentence.match(/\b(?:contains|includes|has|shows|displays)\s+["']([^"']+)["']/i);
        if (contentMatch) {
          validations.push({
            type: 'RESPONSE_CONTENT',
            expectation: `Response should contain "${contentMatch[1]}"`,
            criteria: [`response.includes("${contentMatch[1]}")`],
            confidence: 0.8
          });
        }
      }
      
      // Security validations
      if (/\b(fail|reject|block|deny|prevent)\b/i.test(sentence)) {
        validations.push({
          type: 'SECURITY',
          expectation: 'Request should be rejected for security reasons',
          criteria: ['status !== 200', 'error message present'],
          confidence: 0.7
        });
      }
      
      // Behavior validations
      if (/\b(store|capture|save|record)\b/i.test(sentence)) {
        validations.push({
          type: 'BEHAVIOR',
          expectation: 'Data should be captured and stored',
          criteria: ['response data captured', 'storage successful'],
          confidence: 0.6
        });
      }
    }
    
    return validations;
  }

  /**
   * Analyze instruction context
   */
  private analyzeContext(instruction: string, actions: ParsedAction[], targets: ParsedTarget[]): InstructionContext {
    // Determine domain
    let domain: InstructionContext['domain'] = 'API';
    if (actions.some(a => a.type === 'HTTP_REQUEST') || targets.some(t => t.type === 'URL')) {
      domain = 'API';
    }
    if (this.hasSecurityIndicators(instruction)) {
      domain = 'SECURITY';
    }
    
    // Determine complexity
    let complexity: InstructionContext['complexity'] = 'SIMPLE';
    const actionCount = actions.length;
    const targetCount = targets.length;
    
    if (actionCount <= 2 && targetCount <= 2) complexity = 'SIMPLE';
    else if (actionCount <= 4 && targetCount <= 4) complexity = 'MODERATE';
    else if (actionCount <= 6 && targetCount <= 6) complexity = 'COMPLEX';
    else complexity = 'VERY_COMPLEX';
    
    // Determine test types
    const testType: string[] = [];
    if (this.hasSecurityIndicators(instruction)) testType.push('security');
    if (actions.some(a => a.type === 'HTTP_REQUEST')) testType.push('api');
    if (actions.some(a => a.type === 'VALIDATION')) testType.push('functional');
    
    // Determine security level
    let securityLevel: InstructionContext['securityLevel'] = 'LOW';
    if (/\b(injection|xss|sql)\b/i.test(instruction)) securityLevel = 'CRITICAL';
    else if (/\b(auth|password|token)\b/i.test(instruction)) securityLevel = 'HIGH';
    else if (/\b(header|security)\b/i.test(instruction)) securityLevel = 'MEDIUM';
    
    // Determine language style
    let language: InstructionContext['language'] = 'TECHNICAL';
    if (/\b(shall|must|require)\b/i.test(instruction)) language = 'FORMAL';
    else if (/\b(just|maybe|kinda)\b/i.test(instruction)) language = 'CASUAL';
    else if (/\b(api|http|json)\b/i.test(instruction)) language = 'TECHNICAL';
    else language = 'MIXED';
    
    return {
      domain,
      complexity,
      testType,
      securityLevel,
      language
    };
  }

  /**
   * Generate comprehensive test flow
   */
  private generateTestFlow(
    actions: ParsedAction[],
    targets: ParsedTarget[],
    conditions: ParsedCondition[],
    validations: ParsedValidation[]
  ): TestStep[] {
    const steps: TestStep[] = [];
    let stepNumber = 1;
    
    // Setup steps
    if (targets.some(t => t.type === 'URL')) {
      steps.push({
        stepNumber: stepNumber++,
        action: 'Setup test environment',
        details: 'Initialize test context and prepare test data',
        expectedResult: 'Test environment ready',
        validations: ['Environment initialized', 'Test data prepared']
      });
    }
    
    // Action steps
    for (const action of actions) {
      let stepAction = '';
      let stepDetails = '';
      let expectedResult = '';
      const stepValidations: string[] = [];
      
      switch (action.type) {
        case 'HTTP_REQUEST':
          stepAction = `Send ${action.verb} request`;
          stepDetails = `Execute ${action.verb} ${action.object} with specified parameters`;
          expectedResult = 'Request sent successfully';
          stepValidations.push('Request executed', 'Response received');
          break;
          
        case 'DATA_MANIPULATION':
          stepAction = `${action.verb} ${action.object}`;
          stepDetails = `Manipulate data: ${action.verb} ${action.object}`;
          expectedResult = 'Data manipulation completed';
          stepValidations.push('Data modified', 'Changes applied');
          break;
          
        case 'VALIDATION':
          stepAction = `Validate ${action.object}`;
          stepDetails = `Perform validation: ${action.verb} ${action.object}`;
          expectedResult = 'Validation completed';
          stepValidations.push('Validation executed', 'Results captured');
          break;
      }
      
      steps.push({
        stepNumber: stepNumber++,
        action: stepAction,
        details: stepDetails,
        expectedResult,
        validations: stepValidations
      });
    }
    
    // Validation steps
    for (const validation of validations) {
      steps.push({
        stepNumber: stepNumber++,
        action: `Verify ${validation.type.toLowerCase().replace('_', ' ')}`,
        details: validation.expectation,
        expectedResult: 'Validation passes',
        validations: validation.criteria
      });
    }
    
    return steps;
  }

  /**
   * Generate expected outcomes
   */
  private generateExpectedOutcomes(validations: ParsedValidation[], context: InstructionContext): ExpectedOutcome[] {
    const outcomes: ExpectedOutcome[] = [];
    
    // Security outcomes
    if (context.securityLevel === 'CRITICAL' || context.securityLevel === 'HIGH') {
      outcomes.push({
        type: 'SECURITY_BLOCK',
        description: 'Security threat should be blocked',
        criteria: ['Request rejected', 'Error message present', 'No sensitive data exposed']
      });
    }
    
    // Validation outcomes
    for (const validation of validations) {
      if (validation.type === 'SECURITY') {
        outcomes.push({
          type: 'FAILURE',
          description: validation.expectation,
          criteria: validation.criteria
        });
      } else {
        outcomes.push({
          type: 'SUCCESS',
          description: validation.expectation,
          criteria: validation.criteria
        });
      }
    }
    
    return outcomes;
  }

  // Helper methods
  private extractVerb(sentence: string, match: RegExpMatchArray): string {
    const verbPatterns = /\b(send|make|get|post|put|delete|verify|check|set|add)\b/i;
    const verbMatch = sentence.match(verbPatterns);
    return verbMatch ? verbMatch[1].toLowerCase() : 'execute';
  }

  private extractObject(sentence: string, match: RegExpMatchArray): string {
    const objectPatterns = /\b(request|response|data|header|token|user|api|endpoint)\b/i;
    const objectMatch = sentence.match(objectPatterns);
    return objectMatch ? objectMatch[1].toLowerCase() : 'target';
  }

  private extractModifiers(sentence: string): string[] {
    const modifierPatterns = /\b(invalid|malicious|unauthorized|missing|empty|large|small)\b/gi;
    return sentence.match(modifierPatterns) || [];
  }

  private calculateActionConfidence(sentence: string, pattern: RegExp): number {
    const match = sentence.match(pattern);
    if (!match) return 0;
    
    // Higher confidence for exact matches, specific verbs, clear objects
    let confidence = 0.5;
    if (/\b(send|make|post|get)\b/i.test(sentence)) confidence += 0.2;
    if (/\b(request|api|endpoint)\b/i.test(sentence)) confidence += 0.2;
    if (/\b(to|with|using)\b/i.test(sentence)) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  private deduplicateActions(actions: ParsedAction[]): ParsedAction[] {
    const seen = new Set<string>();
    return actions.filter(action => {
      const key = `${action.type}-${action.verb}-${action.object}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private analyzeUrl(url: string): Record<string, any> {
    return {
      protocol: url.startsWith('https') ? 'https' : 'http',
      hasPath: url.includes('/', 8),
      hasQuery: url.includes('?'),
      domain: url.match(/https?:\/\/([^\/]+)/)?.[1] || ''
    };
  }

  private analyzeHeader(header: string): Record<string, any> {
    return {
      isSecurityHeader: /^x-/i.test(header),
      isAuthHeader: /authorization|bearer/i.test(header),
      isContentHeader: /content-type|accept/i.test(header)
    };
  }

  private isSensitiveField(field: string): boolean {
    return /password|token|secret|key|ssn|credit|card/i.test(field);
  }

  private hasSecurityIndicators(instruction: string): boolean {
    return /\b(security|auth|inject|xss|sql|malicious|unauthorized|hack|exploit)\b/i.test(instruction);
  }

  private calculateConfidence(
    actions: ParsedAction[],
    targets: ParsedTarget[],
    conditions: ParsedCondition[],
    validations: ParsedValidation[]
  ): number {
    const actionConfidence = actions.reduce((sum, a) => sum + a.confidence, 0) / Math.max(actions.length, 1);
    const targetConfidence = targets.reduce((sum, t) => sum + t.confidence, 0) / Math.max(targets.length, 1);
    const conditionConfidence = conditions.reduce((sum, c) => sum + c.confidence, 0) / Math.max(conditions.length, 1);
    const validationConfidence = validations.reduce((sum, v) => sum + v.confidence, 0) / Math.max(validations.length, 1);
    
    return (actionConfidence + targetConfidence + conditionConfidence + validationConfidence) / 4;
  }

  private identifyAmbiguities(instruction: string, actions: ParsedAction[], targets: ParsedTarget[]): string[] {
    const ambiguities: string[] = [];
    
    if (actions.length === 0) {
      ambiguities.push('No clear action identified');
    }
    
    if (targets.length === 0) {
      ambiguities.push('No clear target identified');
    }
    
    if (/\b(it|this|that|something|anything)\b/i.test(instruction)) {
      ambiguities.push('Vague references detected');
    }
    
    if (actions.some(a => a.confidence < 0.5)) {
      ambiguities.push('Low confidence in action interpretation');
    }
    
    return ambiguities;
  }

  private generateSuggestions(ambiguities: string[], context: InstructionContext): string[] {
    const suggestions: string[] = [];
    
    if (ambiguities.includes('No clear action identified')) {
      suggestions.push('Consider specifying the HTTP method (GET, POST, etc.)');
    }
    
    if (ambiguities.includes('No clear target identified')) {
      suggestions.push('Consider providing the full URL or endpoint path');
    }
    
    if (ambiguities.includes('Vague references detected')) {
      suggestions.push('Replace pronouns with specific nouns for clarity');
    }
    
    if (context.complexity === 'VERY_COMPLEX') {
      suggestions.push('Consider breaking down into multiple simpler instructions');
    }
    
    return suggestions;
  }

  private extractHttpMethod(text: string): string {
    const methodMatch = text.match(/\b(get|post|put|patch|delete|head|options)\b/i);
    return methodMatch ? methodMatch[1].toUpperCase() : 'GET';
  }

  private extractApiAction(text: string): string {
    const actionMatch = text.match(/\b(create|read|update|delete|list|search|login|register)\b/i);
    return actionMatch ? actionMatch[1].toLowerCase() : 'call';
  }

  private extractValidationType(text: string): string {
    if (/status|code/i.test(text)) return 'status_code';
    if (/response|content|body/i.test(text)) return 'response_content';
    if (/header/i.test(text)) return 'headers';
    if (/security|auth/i.test(text)) return 'security';
    return 'behavior';
  }

  private extractExpectation(text: string): string {
    if (/fail|error|reject/i.test(text)) return 'failure';
    if (/success|pass|accept/i.test(text)) return 'success';
    if (/contain|include|have/i.test(text)) return 'contains';
    return 'equals';
  }

  private extractDataOperation(text: string): string {
    const opMatch = text.match(/\b(set|add|include|attach|insert|inject|provide|with|using)\b/i);
    return opMatch ? opMatch[1].toLowerCase() : 'set';
  }

  private extractDataTarget(text: string): string {
    const targetMatch = text.match(/\b(header|parameter|field|data|payload|body|token|auth)\b/i);
    return targetMatch ? targetMatch[1].toLowerCase() : 'data';
  }

  private extractAssertionType(text: string): string {
    if (/store|capture|save|record/i.test(text)) return 'capture';
    if (/measure|count|calculate/i.test(text)) return 'measure';
    if (/compare|match|equal/i.test(text)) return 'compare';
    return 'assert';
  }
}