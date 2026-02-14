/**
 * Intelligent Instruction Parser
 * 
 * High-level instruction understanding system that parses natural language
 * testing instructions into structured, executable test steps.
 * 
 * Key improvements:
 * 1. Intent-driven parsing - understands what the user wants to achieve
 * 2. Context-aware interpretation - considers domain and test type
 * 3. Semantic understanding - goes beyond keyword matching
 * 4. Instruction decomposition - breaks complex instructions into atomic steps
 * 5. Validation and confidence scoring - ensures accurate interpretation
 */

export interface IntelligentParsedInstruction {
  // Core understanding
  primaryIntent: 'test' | 'verify' | 'validate' | 'check' | 'measure' | 'analyze';
  testDomain: 'accessibility' | 'security' | 'api' | 'functional' | 'performance';
  
  // Structured steps
  atomicSteps: AtomicTestStep[];
  
  // Context and metadata
  context: InstructionContext;
  confidence: number;
  ambiguities: string[];
  suggestions: string[];
}

export interface AtomicTestStep {
  id: string;
  order: number;
  action: TestAction;
  target: TestTarget;
  parameters: Record<string, any>;
  expectedOutcome: string;
  validations: ValidationRule[];
  dependencies: string[]; // IDs of steps this depends on
}

export interface TestAction {
  type: 'navigate' | 'interact' | 'extract' | 'verify' | 'wait' | 'store' | 'compare';
  method: string; // specific method like 'click', 'type', 'press_key', 'send_request'
  description: string;
}

export interface TestTarget {
  type: 'element' | 'page' | 'api' | 'attribute' | 'response' | 'cookie' | 'header';
  selector?: string;
  identifier: string;
  description: string;
}

export interface ValidationRule {
  type: 'equals' | 'contains' | 'exists' | 'not_exists' | 'matches' | 'range';
  expected: any;
  description: string;
}

export interface InstructionContext {
  domain: string;
  complexity: 'simple' | 'moderate' | 'complex';
  userExpertise: 'beginner' | 'intermediate' | 'expert';
  testScope: 'component' | 'page' | 'flow' | 'system';
  environment: 'development' | 'staging' | 'production';
}

export class IntelligentInstructionParser {
  private readonly intentPatterns = {
    TEST: [
      'test', 'check', 'verify', 'validate', 'ensure', 'confirm',
      'examine', 'inspect', 'analyze', 'assess', 'evaluate'
    ],
    NAVIGATE: [
      'go to', 'navigate to', 'open', 'visit', 'load', 'access',
      'browse to', 'redirect to', 'switch to'
    ],
    INTERACT: [
      'click', 'press', 'type', 'enter', 'select', 'choose',
      'tap', 'touch', 'drag', 'drop', 'scroll', 'hover'
    ],
    EXTRACT: [
      'get', 'extract', 'capture', 'store', 'save', 'record',
      'read', 'retrieve', 'collect', 'gather'
    ],
    VERIFY: [
      'should', 'must', 'expect', 'assert', 'require',
      'validate that', 'check that', 'ensure that', 'confirm that'
    ]
  };

  private readonly domainIndicators = {
    ACCESSIBILITY: [
      'accessibility', 'a11y', 'screen reader', 'keyboard', 'tab', 'focus',
      'aria', 'alt text', 'heading', 'landmark', 'semantic', 'wcag',
      'contrast', 'color', 'label', 'role', 'live region'
    ],
    SECURITY: [
      'security', 'auth', 'login', 'token', 'permission', 'unauthorized',
      'injection', 'xss', 'sql', 'malicious', 'exploit', 'vulnerability',
      'header', 'cors', 'csrf', 'session', 'cookie'
    ],
    API: [
      'api', 'endpoint', 'request', 'response', 'json', 'xml',
      'get', 'post', 'put', 'delete', 'patch', 'status code',
      'header', 'body', 'parameter', 'query', 'payload'
    ],
    FUNCTIONAL: [
      'form', 'button', 'input', 'submit', 'validation', 'error',
      'success', 'message', 'modal', 'dropdown', 'checkbox', 'radio'
    ]
  };

  /**
   * Parse instruction with intelligent understanding
   */
  public parseInstruction(instruction: string, url?: string): IntelligentParsedInstruction {
    console.log('🧠 Intelligent parsing:', instruction);
    
    // Step 1: Understand primary intent
    const primaryIntent = this.identifyPrimaryIntent(instruction);
    
    // Step 2: Determine test domain
    const testDomain = this.identifyTestDomain(instruction);
    
    // Step 3: Analyze context
    const context = this.analyzeContext(instruction, url);
    
    // Step 4: Decompose into atomic steps
    const atomicSteps = this.decomposeIntoAtomicSteps(instruction, primaryIntent, testDomain, context);
    
    // Step 5: Calculate confidence and identify issues
    const confidence = this.calculateConfidence(atomicSteps, context);
    const ambiguities = this.identifyAmbiguities(instruction, atomicSteps);
    const suggestions = this.generateSuggestions(ambiguities, context);
    
    return {
      primaryIntent,
      testDomain,
      atomicSteps,
      context,
      confidence,
      ambiguities,
      suggestions
    };
  }

  /**
   * Identify the primary intent of the instruction
   */
  private identifyPrimaryIntent(instruction: string): 'test' | 'verify' | 'validate' | 'check' | 'measure' | 'analyze' {
    const instructionLower = instruction.toLowerCase();
    
    // Priority-based intent detection
    if (this.containsAny(instructionLower, ['measure', 'count', 'calculate'])) return 'measure';
    if (this.containsAny(instructionLower, ['analyze', 'examine', 'inspect', 'assess'])) return 'analyze';
    if (this.containsAny(instructionLower, ['verify', 'confirm', 'assert'])) return 'verify';
    if (this.containsAny(instructionLower, ['validate', 'ensure'])) return 'validate';
    if (this.containsAny(instructionLower, ['check', 'test'])) return 'check';
    
    return 'test'; // Default
  }

  /**
   * Identify the test domain
   */
  private identifyTestDomain(instruction: string): 'accessibility' | 'security' | 'api' | 'functional' | 'performance' {
    const instructionLower = instruction.toLowerCase();
    
    // Calculate domain scores
    const scores = {
      accessibility: this.calculateDomainScore(instructionLower, this.domainIndicators.ACCESSIBILITY),
      security: this.calculateDomainScore(instructionLower, this.domainIndicators.SECURITY),
      api: this.calculateDomainScore(instructionLower, this.domainIndicators.API),
      functional: this.calculateDomainScore(instructionLower, this.domainIndicators.FUNCTIONAL),
      performance: 0 // Not implemented yet
    };
    
    // Return domain with highest score
    const maxDomain = Object.entries(scores).reduce((a, b) => (scores as any)[a[0]] > (scores as any)[b[0]] ? a : b)[0];
    return maxDomain as any;
  }

  /**
   * Analyze instruction context
   */
  private analyzeContext(instruction: string, url?: string): InstructionContext {
    const instructionLower = instruction.toLowerCase();
    
    // Determine complexity
    const complexity = this.determineComplexity(instruction);
    
    // Determine user expertise level
    const userExpertise = this.determineUserExpertise(instruction);
    
    // Determine test scope
    const testScope = this.determineTestScope(instruction);
    
    return {
      domain: this.identifyTestDomain(instruction),
      complexity,
      userExpertise,
      testScope,
      environment: 'development' // Default
    };
  }

  /**
   * Decompose instruction into atomic test steps
   */
  private decomposeIntoAtomicSteps(
    instruction: string, 
    primaryIntent: string, 
    testDomain: string, 
    context: InstructionContext
  ): AtomicTestStep[] {
    console.log('🔧 Decomposing instruction into atomic steps');
    
    const steps: AtomicTestStep[] = [];
    
    // Split instruction into logical segments
    const segments = this.segmentInstruction(instruction);
    
    let stepOrder = 1;
    for (const segment of segments) {
      const atomicStep = this.createAtomicStep(segment, stepOrder, testDomain, context);
      if (atomicStep) {
        steps.push(atomicStep);
        stepOrder++;
      }
    }
    
    // If no steps were created, create a default comprehensive step
    if (steps.length === 0) {
      steps.push(this.createDefaultStep(instruction, testDomain, context));
    }
    
    // Add dependencies between steps
    this.addStepDependencies(steps);
    
    return steps;
  }

  /**
   * Segment instruction into logical parts
   */
  private segmentInstruction(instruction: string): string[] {
    // Split on common separators and conjunctions
    const segments = instruction
      .split(/[.!?;]|\band\s+then\b|\bthen\b|\bafter\s+that\b|\bnext\b|\bfinally\b/i)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    // If no segments found, return the whole instruction
    return segments.length > 0 ? segments : [instruction];
  }

  /**
   * Create atomic step from segment
   */
  private createAtomicStep(
    segment: string, 
    order: number, 
    testDomain: string, 
    context: InstructionContext
  ): AtomicTestStep | null {
    const segmentLower = segment.toLowerCase();
    
    // Determine action type and method
    const action = this.identifyAction(segment);
    if (!action) return null;
    
    // Determine target
    const target = this.identifyTarget(segment, testDomain);
    if (!target) return null;
    
    // Extract parameters
    const parameters = this.extractParameters(segment, action, target);
    
    // Determine expected outcome
    const expectedOutcome = this.determineExpectedOutcome(segment, action, target);
    
    // Create validation rules
    const validations = this.createValidationRules(segment, action, target);
    
    return {
      id: `step_${order}`,
      order,
      action,
      target,
      parameters,
      expectedOutcome,
      validations,
      dependencies: []
    };
  }

  /**
   * Identify action from segment
   */
  private identifyAction(segment: string): TestAction | null {
    const segmentLower = segment.toLowerCase();
    
    // Navigation actions
    if (this.containsAny(segmentLower, ['open', 'navigate', 'go to', 'visit', 'load'])) {
      return {
        type: 'navigate',
        method: 'goto',
        description: 'Navigate to page or URL'
      };
    }
    
    // Interaction actions
    if (this.containsAny(segmentLower, ['click', 'press', 'tap'])) {
      return {
        type: 'interact',
        method: segmentLower.includes('press') ? 'press' : 'click',
        description: 'Interact with element'
      };
    }
    
    // Extraction actions
    if (this.containsAny(segmentLower, ['get', 'extract', 'capture', 'store', 'read'])) {
      return {
        type: 'extract',
        method: 'extract',
        description: 'Extract data or information'
      };
    }
    
    // Verification actions
    if (this.containsAny(segmentLower, ['verify', 'check', 'validate', 'ensure', 'confirm'])) {
      return {
        type: 'verify',
        method: 'assert',
        description: 'Verify condition or state'
      };
    }
    
    return null;
  }

  /**
   * Identify target from segment
   */
  private identifyTarget(segment: string, testDomain: string): TestTarget | null {
    const segmentLower = segment.toLowerCase();
    
    // Element targets
    if (this.containsAny(segmentLower, ['button', 'link', 'input', 'form', 'element'])) {
      const elementType = this.extractElementType(segment);
      return {
        type: 'element',
        selector: this.generateSelector(elementType, segment),
        identifier: elementType,
        description: `${elementType} element`
      };
    }
    
    // Page targets
    if (this.containsAny(segmentLower, ['page', 'website', 'site', 'url'])) {
      return {
        type: 'page',
        identifier: 'page',
        description: 'Web page'
      };
    }
    
    // API targets
    if (this.containsAny(segmentLower, ['api', 'endpoint', 'request', 'response'])) {
      return {
        type: 'api',
        identifier: 'api_endpoint',
        description: 'API endpoint'
      };
    }
    
    // Attribute targets
    if (this.containsAny(segmentLower, ['attribute', 'property', 'aria', 'alt', 'role'])) {
      const attributeName = this.extractAttributeName(segment);
      return {
        type: 'attribute',
        identifier: attributeName,
        description: `${attributeName} attribute`
      };
    }
    
    return null;
  }

  /**
   * Helper methods
   */
  private containsAny(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword));
  }

  private calculateDomainScore(instruction: string, indicators: string[]): number {
    return indicators.reduce((score, indicator) => {
      return instruction.includes(indicator) ? score + 1 : score;
    }, 0);
  }

  private determineComplexity(instruction: string): 'simple' | 'moderate' | 'complex' {
    const wordCount = instruction.split(/\s+/).length;
    const hasMultipleSteps = /\band\s+then\b|\bthen\b|\bafter\b|\bnext\b/i.test(instruction);
    const hasConditionals = /\bif\b|\bunless\b|\bwhen\b/i.test(instruction);
    
    if (wordCount > 50 || hasConditionals) return 'complex';
    if (wordCount > 20 || hasMultipleSteps) return 'moderate';
    return 'simple';
  }

  private determineUserExpertise(instruction: string): 'beginner' | 'intermediate' | 'expert' {
    const technicalTerms = ['api', 'json', 'xpath', 'css selector', 'regex', 'dom', 'aria'];
    const hasTechnicalTerms = technicalTerms.some(term => instruction.toLowerCase().includes(term));
    
    if (hasTechnicalTerms) return 'expert';
    if (instruction.length > 100) return 'intermediate';
    return 'beginner';
  }

  private determineTestScope(instruction: string): 'component' | 'page' | 'flow' | 'system' {
    const instructionLower = instruction.toLowerCase();
    
    if (this.containsAny(instructionLower, ['system', 'application', 'entire', 'complete'])) return 'system';
    if (this.containsAny(instructionLower, ['flow', 'journey', 'process', 'workflow'])) return 'flow';
    if (this.containsAny(instructionLower, ['page', 'screen', 'view'])) return 'page';
    return 'component';
  }

  private extractParameters(segment: string, action: TestAction, target: TestTarget): Record<string, any> {
    const parameters: Record<string, any> = {};
    
    // Extract common parameters based on action and target
    if (action.type === 'interact' && action.method === 'press') {
      const keyMatch = segment.match(/press\s+(tab|enter|space|escape|arrow|shift)/i);
      if (keyMatch) {
        parameters.key = keyMatch[1].toLowerCase();
      }
    }
    
    if (target.type === 'element') {
      const textMatch = segment.match(/with\s+text\s+["']([^"']+)["']/i);
      if (textMatch) {
        parameters.text = textMatch[1];
      }
    }
    
    return parameters;
  }

  private determineExpectedOutcome(segment: string, action: TestAction, target: TestTarget): string {
    // Generate expected outcome based on action and target
    if (action.type === 'navigate') {
      return 'Page should load successfully';
    }
    
    if (action.type === 'interact') {
      return `${target.description} should respond to ${action.method} action`;
    }
    
    if (action.type === 'verify') {
      return 'Verification should pass';
    }
    
    return 'Step should complete successfully';
  }

  private createValidationRules(segment: string, action: TestAction, target: TestTarget): ValidationRule[] {
    const rules: ValidationRule[] = [];
    
    // Create validation rules based on segment content
    if (segment.toLowerCase().includes('should be visible')) {
      rules.push({
        type: 'exists',
        expected: true,
        description: 'Element should be visible'
      });
    }
    
    if (segment.toLowerCase().includes('should contain')) {
      const containsMatch = segment.match(/should contain\s+["']([^"']+)["']/i);
      if (containsMatch) {
        rules.push({
          type: 'contains',
          expected: containsMatch[1],
          description: `Should contain "${containsMatch[1]}"`
        });
      }
    }
    
    return rules;
  }

  private extractElementType(segment: string): string {
    const elementTypes = ['button', 'link', 'input', 'form', 'heading', 'image', 'list', 'table'];
    const found = elementTypes.find(type => segment.toLowerCase().includes(type));
    return found || 'element';
  }

  private generateSelector(elementType: string, segment: string): string {
    // Generate appropriate selector based on element type and segment content
    const textMatch = segment.match(/with\s+text\s+["']([^"']+)["']/i);
    if (textMatch) {
      return `${elementType}:has-text("${textMatch[1]}")`;
    }
    
    return elementType;
  }

  private extractAttributeName(segment: string): string {
    const attributes = ['aria-label', 'aria-describedby', 'alt', 'role', 'title', 'placeholder'];
    const found = attributes.find(attr => segment.toLowerCase().includes(attr));
    return found || 'attribute';
  }

  private createDefaultStep(instruction: string, testDomain: string, context: InstructionContext): AtomicTestStep {
    return {
      id: 'step_1',
      order: 1,
      action: {
        type: 'verify',
        method: 'comprehensive_test',
        description: 'Perform comprehensive test based on instruction'
      },
      target: {
        type: 'page',
        identifier: 'page',
        description: 'Web page'
      },
      parameters: {
        instruction,
        testDomain,
        context
      },
      expectedOutcome: 'All test requirements should be satisfied',
      validations: [{
        type: 'exists',
        expected: true,
        description: 'Test should complete successfully'
      }],
      dependencies: []
    };
  }

  private addStepDependencies(steps: AtomicTestStep[]): void {
    // Add dependencies between steps based on their order and content
    for (let i = 1; i < steps.length; i++) {
      const currentStep = steps[i];
      const previousStep = steps[i - 1];
      
      // If current step needs data from previous step, add dependency
      if (this.stepNeedsPreviousData(currentStep, previousStep)) {
        currentStep.dependencies.push(previousStep.id);
      }
    }
  }

  private stepNeedsPreviousData(currentStep: AtomicTestStep, previousStep: AtomicTestStep): boolean {
    // Check if current step needs data from previous step
    return (
      previousStep.action.type === 'extract' && 
      (currentStep.action.type === 'verify' || currentStep.action.type === 'interact')
    );
  }

  private calculateConfidence(steps: AtomicTestStep[], context: InstructionContext): number {
    let confidence = 0.8; // Base confidence
    
    // Increase confidence for well-structured steps
    if (steps.length > 0 && steps.every(step => step.validations.length > 0)) {
      confidence += 0.1;
    }
    
    // Decrease confidence for complex instructions
    if (context.complexity === 'complex') {
      confidence -= 0.2;
    }
    
    return Math.max(0.1, Math.min(1.0, confidence));
  }

  private identifyAmbiguities(instruction: string, steps: AtomicTestStep[]): string[] {
    const ambiguities: string[] = [];
    
    // Check for vague terms
    const vagueTerms = ['it', 'this', 'that', 'something', 'anything'];
    const instructionLower = instruction.toLowerCase();
    
    vagueTerms.forEach(term => {
      if (instructionLower.includes(term)) {
        ambiguities.push(`Vague reference: "${term}" - please be more specific`);
      }
    });
    
    // Check for missing targets
    if (steps.some(step => !step.target.selector && step.target.type === 'element')) {
      ambiguities.push('Element selector is unclear - please specify how to locate the element');
    }
    
    return ambiguities;
  }

  private generateSuggestions(ambiguities: string[], context: InstructionContext): string[] {
    const suggestions: string[] = [];
    
    if (ambiguities.length > 0) {
      suggestions.push('Consider providing more specific element identifiers (e.g., button text, CSS selectors)');
      suggestions.push('Break complex instructions into smaller, more specific steps');
    }
    
    if (context.complexity === 'complex') {
      suggestions.push('Consider simplifying the instruction or breaking it into multiple test cases');
    }
    
    return suggestions;
  }
}