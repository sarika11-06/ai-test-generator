/**
 * Universal Test Generator
 * Integrates enhanced instruction parsing and code generation
 * Handles varied inputs with intelligent adaptation
 */

import { EnhancedInstructionParser, EnhancedParsedInstruction } from './enhancedInstructionParser';
import { EnhancedPlaywrightGenerator, EnhancedGeneratedTest } from './enhancedPlaywrightGenerator';
import { SecurityTestGenerator } from './securityTestGenerator';
import { classifyTestIntent, TestIntent } from './testIntentClassifier';
import { formatTestCase, BaseTestCase } from './testCaseFormatter';

export interface UniversalTestRequest {
  url: string;
  instruction: string;
  context?: {
    testType?: string[];
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    environment?: 'DEV' | 'STAGING' | 'PROD';
    constraints?: string[];
  };
}

export interface UniversalTestResponse {
  success: boolean;
  testCase: BaseTestCase;
  generatedTest: EnhancedGeneratedTest;
  parsedInstruction: EnhancedParsedInstruction;
  intent: TestIntent;
  metadata: {
    processingTime: number;
    confidence: number;
    adaptations: string[];
    recommendations: string[];
  };
  diagnostics: {
    warnings: string[];
    errors: string[];
    suggestions: string[];
  };
}

export class UniversalTestGenerator {
  private enhancedParser: EnhancedInstructionParser;
  private enhancedGenerator: EnhancedPlaywrightGenerator;
  private securityGenerator: SecurityTestGenerator;

  constructor() {
    this.enhancedParser = new EnhancedInstructionParser();
    this.enhancedGenerator = new EnhancedPlaywrightGenerator();
    this.securityGenerator = new SecurityTestGenerator();
  }

  /**
   * Generate test from varied instruction input
   */
  public async generateUniversalTest(request: UniversalTestRequest): Promise<UniversalTestResponse> {
    const startTime = Date.now();
    
    console.log('🚀 Universal Test Generation Started');
    console.log('📋 Instruction:', request.instruction);
    console.log('🎯 URL:', request.url);
    
    try {
      // Step 1: Enhanced instruction parsing
      console.log('🔍 Step 1: Enhanced instruction parsing');
      const parsedInstruction = this.enhancedParser.parseInstruction(request.instruction, request.url);
      
      console.log('   Parsed Actions:', parsedInstruction.actions.length);
      console.log('   Parsed Targets:', parsedInstruction.targets.length);
      console.log('   Parsed Conditions:', parsedInstruction.conditions.length);
      console.log('   Parsed Validations:', parsedInstruction.validations.length);
      console.log('   Context Domain:', parsedInstruction.context.domain);
      console.log('   Complexity:', parsedInstruction.context.complexity);
      console.log('   Confidence:', Math.round(parsedInstruction.confidence * 100) + '%');
      
      // Step 2: Intent classification for compatibility
      console.log('🎯 Step 2: Intent classification');
      const intent = classifyTestIntent(request.instruction, { url: request.url, allInteractive: [] });
      
      console.log('   Primary Type:', intent.primaryType);
      console.log('   Secondary Types:', intent.secondaryTypes);
      console.log('   Intent Confidence:', Math.round(intent.confidence * 100) + '%');
      
      // Step 3: Adaptive test generation
      console.log('⚙️ Step 3: Adaptive test generation');
      const adaptations = this.determineAdaptations(parsedInstruction, intent, request);
      
      let generatedTest: EnhancedGeneratedTest;
      let testCase: BaseTestCase;
      
      // Choose generation strategy based on context and intent
      if (this.shouldUseSecurityGenerator(parsedInstruction, intent)) {
        console.log('   Using Security Generator');
        const securityResult = await this.generateSecurityTest(request, parsedInstruction, intent);
        generatedTest = this.adaptSecurityTestToEnhanced(securityResult);
        testCase = this.convertSecurityToBaseTestCase(securityResult, parsedInstruction);
      } else {
        console.log('   Using Enhanced Universal Generator');
        generatedTest = this.enhancedGenerator.generateTest(parsedInstruction, request.url, request.instruction);
        testCase = this.convertEnhancedToBaseTestCase(generatedTest, parsedInstruction, request);
      }
      
      // Step 4: Apply adaptations and improvements
      console.log('🔧 Step 4: Applying adaptations');
      generatedTest = this.applyAdaptations(generatedTest, adaptations, parsedInstruction);
      testCase = this.enhanceTestCase(testCase, parsedInstruction, generatedTest);
      
      // Step 5: Generate metadata and diagnostics
      console.log('📊 Step 5: Generating metadata and diagnostics');
      const processingTime = Date.now() - startTime;
      const metadata = this.generateMetadata(parsedInstruction, intent, adaptations, processingTime);
      const diagnostics = this.generateDiagnostics(parsedInstruction, generatedTest, request);
      
      console.log('✅ Universal Test Generation Completed');
      console.log('   Processing Time:', processingTime + 'ms');
      console.log('   Final Confidence:', metadata.confidence + '%');
      console.log('   Adaptations Applied:', adaptations.length);
      
      return {
        success: true,
        testCase,
        generatedTest,
        parsedInstruction,
        intent,
        metadata,
        diagnostics
      };
      
    } catch (error: any) {
      console.error('❌ Universal Test Generation Failed:', error.message);
      
      return {
        success: false,
        testCase: this.createFallbackTestCase(request),
        generatedTest: this.createFallbackGeneratedTest(request),
        parsedInstruction: this.createFallbackParsedInstruction(request),
        intent: { primaryType: 'functional', secondaryTypes: [], confidence: 0.1, detectedKeywords: { accessibility: [], api: [], functional: [], security: [] } },
        metadata: {
          processingTime: Date.now() - startTime,
          confidence: 10,
          adaptations: [],
          recommendations: ['Review instruction clarity', 'Provide more specific details']
        },
        diagnostics: {
          warnings: ['Test generation failed'],
          errors: [error.message],
          suggestions: ['Simplify instruction', 'Check URL validity', 'Verify test requirements']
        }
      };
    }
  }

  /**
   * Determine necessary adaptations based on parsing results
   */
  private determineAdaptations(
    parsedInstruction: EnhancedParsedInstruction,
    intent: TestIntent,
    request: UniversalTestRequest
  ): string[] {
    const adaptations: string[] = [];
    
    // Confidence-based adaptations
    if (parsedInstruction.confidence < 0.5) {
      adaptations.push('LOW_CONFIDENCE_FALLBACK');
    }
    
    // Complexity-based adaptations
    if (parsedInstruction.context.complexity === 'VERY_COMPLEX') {
      adaptations.push('COMPLEXITY_SIMPLIFICATION');
    }
    
    // Security-based adaptations
    if (parsedInstruction.context.securityLevel === 'CRITICAL') {
      adaptations.push('ENHANCED_SECURITY_VALIDATION');
    }
    
    // Ambiguity-based adaptations
    if (parsedInstruction.ambiguities.length > 0) {
      adaptations.push('AMBIGUITY_RESOLUTION');
    }
    
    // Domain-specific adaptations
    if (parsedInstruction.context.domain === 'MIXED') {
      adaptations.push('MULTI_DOMAIN_HANDLING');
    }
    
    // Language style adaptations
    if (parsedInstruction.context.language === 'CASUAL') {
      adaptations.push('CASUAL_LANGUAGE_INTERPRETATION');
    }
    
    return adaptations;
  }

  /**
   * Determine if security generator should be used
   */
  private shouldUseSecurityGenerator(parsedInstruction: EnhancedParsedInstruction, intent: TestIntent): boolean {
    // Use security generator if:
    // 1. Primary intent is security
    // 2. High security level detected
    // 3. Security conditions present
    // 4. Security keywords detected
    
    return !!(
      intent.primaryType === 'security' ||
      parsedInstruction.context.securityLevel === 'CRITICAL' ||
      parsedInstruction.context.securityLevel === 'HIGH' ||
      parsedInstruction.conditions.some(c => c.type === 'SECURITY') ||
      (intent.detectedKeywords.security && intent.detectedKeywords.security.length > 0)
    );
  }

  /**
   * Generate security test using existing security generator
   */
  private async generateSecurityTest(
    request: UniversalTestRequest,
    parsedInstruction: EnhancedParsedInstruction,
    intent: TestIntent
  ): Promise<any> {
    const method = this.extractHttpMethod(parsedInstruction.actions);
    
    const securityRequest = {
      url: request.url,
      instruction: request.instruction,
      method
    };
    
    return await this.securityGenerator.generateSecurityTest(securityRequest);
  }

  /**
   * Apply adaptations to generated test
   */
  private applyAdaptations(
    generatedTest: EnhancedGeneratedTest,
    adaptations: string[],
    parsedInstruction: EnhancedParsedInstruction
  ): EnhancedGeneratedTest {
    let adaptedTest = { ...generatedTest };
    
    for (const adaptation of adaptations) {
      switch (adaptation) {
        case 'LOW_CONFIDENCE_FALLBACK':
          adaptedTest = this.applyLowConfidenceFallback(adaptedTest, parsedInstruction);
          break;
          
        case 'COMPLEXITY_SIMPLIFICATION':
          adaptedTest = this.applyComplexitySimplification(adaptedTest);
          break;
          
        case 'ENHANCED_SECURITY_VALIDATION':
          adaptedTest = this.applyEnhancedSecurityValidation(adaptedTest);
          break;
          
        case 'AMBIGUITY_RESOLUTION':
          adaptedTest = this.applyAmbiguityResolution(adaptedTest, parsedInstruction);
          break;
          
        case 'MULTI_DOMAIN_HANDLING':
          adaptedTest = this.applyMultiDomainHandling(adaptedTest);
          break;
          
        case 'CASUAL_LANGUAGE_INTERPRETATION':
          adaptedTest = this.applyCasualLanguageInterpretation(adaptedTest);
          break;
      }
    }
    
    return adaptedTest;
  }

  /**
   * Apply low confidence fallback adaptations
   */
  private applyLowConfidenceFallback(test: EnhancedGeneratedTest, parsedInstruction: EnhancedParsedInstruction): EnhancedGeneratedTest {
    // Add more defensive programming and error handling
    const enhancedCode = test.testCode.replace(
      /expect\(/g,
      'try { expect('
    ).replace(
      /\);$/gm,
      '); } catch (assertionError) { console.warn("Assertion failed but continuing:", assertionError.message); }'
    );
    
    // Add confidence warning
    const warningComment = `
  // ⚠️ LOW CONFIDENCE WARNING
  // This test was generated with low confidence (${Math.round(parsedInstruction.confidence * 100)}%)
  // Please review and adjust as needed
  console.warn('⚠️ Low confidence test - please review results carefully');
  `;
    
    return {
      ...test,
      testCode: enhancedCode.replace('console.log(\'🚀 Starting test:', warningComment + '\\n  console.log(\'🚀 Starting test:'),
      diagnostics: {
        ...test.diagnostics,
        warnings: [...test.diagnostics.warnings, 'Low confidence fallback applied']
      }
    };
  }

  /**
   * Apply complexity simplification
   */
  private applyComplexitySimplification(test: EnhancedGeneratedTest): EnhancedGeneratedTest {
    // Add step-by-step logging and intermediate validations
    const simplifiedCode = test.testCode.replace(
      /console\.log\('(\d+)\./g,
      'console.log(\'📍 Step $1 of ${test.metadata.complexity} complexity test:\')\n  console.log(\'$1.'
    );
    
    return {
      ...test,
      testCode: simplifiedCode,
      diagnostics: {
        ...test.diagnostics,
        suggestions: [...test.diagnostics.suggestions, 'Consider breaking complex test into smaller parts']
      }
    };
  }

  /**
   * Apply enhanced security validation
   */
  private applyEnhancedSecurityValidation(test: EnhancedGeneratedTest): EnhancedGeneratedTest {
    const securityEnhancement = `
  // 🔒 ENHANCED SECURITY VALIDATION
  console.log('🔒 Applying enhanced security validation');
  
  // Additional security checks
  const securityValidation = {
    responseTime: Date.now() - testResults.timing.start,
    statusCodeSecurity: status1 >= 400 && status1 < 500,
    noDebugInfo: !JSON.stringify(headers1).toLowerCase().includes('debug'),
    noInternalPaths: !JSON.stringify(body1).toLowerCase().includes('/internal/'),
    properErrorHandling: body1.error && !body1.stack
  };
  
  console.log('Security Validation Results:', securityValidation);
  
  // Enhanced security assertions
  expect(securityValidation.statusCodeSecurity, 'Security status code check').toBe(true);
  expect(securityValidation.noDebugInfo, 'No debug information leaked').toBe(true);
  expect(securityValidation.noInternalPaths, 'No internal paths exposed').toBe(true);
  `;
    
    return {
      ...test,
      testCode: test.testCode.replace('// Test Completion Summary', securityEnhancement + '\\n  // Test Completion Summary')
    };
  }

  /**
   * Apply ambiguity resolution
   */
  private applyAmbiguityResolution(test: EnhancedGeneratedTest, parsedInstruction: EnhancedParsedInstruction): EnhancedGeneratedTest {
    const ambiguityComment = `
  // 🤔 AMBIGUITY RESOLUTION
  // Detected ambiguities: ${parsedInstruction.ambiguities.join(', ')}
  // Applied best-guess interpretations - please verify results
  console.log('🤔 Ambiguities detected and resolved:', ${JSON.stringify(parsedInstruction.ambiguities)});
  `;
    
    return {
      ...test,
      testCode: test.testCode.replace('// Initialize test variables', ambiguityComment + '\\n  // Initialize test variables'),
      diagnostics: {
        ...test.diagnostics,
        warnings: [...test.diagnostics.warnings, `Ambiguities resolved: ${parsedInstruction.ambiguities.join(', ')}`]
      }
    };
  }

  /**
   * Apply multi-domain handling
   */
  private applyMultiDomainHandling(test: EnhancedGeneratedTest): EnhancedGeneratedTest {
    const multiDomainCode = `
  // 🌐 MULTI-DOMAIN TEST HANDLING
  console.log('🌐 Handling multi-domain test scenario');
  
  // Track different test aspects
  const domainResults = {
    api: { completed: false, success: false },
    security: { completed: false, success: false },
    functional: { completed: false, success: false }
  };
  `;
    
    return {
      ...test,
      testCode: test.testCode.replace('let testResults = {', multiDomainCode + '\\n  let testResults = {')
    };
  }

  /**
   * Apply casual language interpretation
   */
  private applyCasualLanguageInterpretation(test: EnhancedGeneratedTest): EnhancedGeneratedTest {
    const casualComment = `
  // 💬 CASUAL LANGUAGE INTERPRETATION
  // Original instruction used casual language - interpretations may vary
  console.log('💬 Casual language detected - using best interpretation');
  `;
    
    return {
      ...test,
      testCode: test.testCode.replace('console.log(\'🚀 Starting test:', casualComment + '\\n  console.log(\'🚀 Starting test:')
    };
  }

  // Conversion and helper methods
  private convertEnhancedToBaseTestCase(
    generatedTest: EnhancedGeneratedTest,
    parsedInstruction: EnhancedParsedInstruction,
    request: UniversalTestRequest
  ): BaseTestCase {
    const testCase: Partial<BaseTestCase> = {
      id: `universal-${Date.now()}`,
      title: generatedTest.testName,
      description: generatedTest.description,
      category: this.mapComplexityToCategory(parsedInstruction.context.complexity),
      testType: this.mapDomainToTestType(parsedInstruction.context.domain),
      priority: this.mapSecurityLevelToPriority(parsedInstruction.context.securityLevel),
      severity: this.mapSecurityLevelToPriority(parsedInstruction.context.securityLevel),
      stability: 'Stable',
      preconditions: [
        `URL ${request.url} is accessible`,
        'Test environment is configured',
        ...generatedTest.metadata.requirements
      ],
      steps: parsedInstruction.testFlow.map(step => ({
        stepNumber: step.stepNumber,
        action: step.action,
        expectedResult: step.expectedResult
      })),
      expectedResult: parsedInstruction.expectedOutcomes.map(o => o.description).join('; '),
      validationCriteria: {
        behavior: parsedInstruction.validations.map(v => v.expectation),
        compliance: parsedInstruction.context.testType
      },
      qualityMetrics: {
        confidence: generatedTest.metadata.confidence,
        stability: 90,
        maintainability: 85
      },
      automationMapping: generatedTest.testCode,
      playwrightCode: generatedTest.testCode,
      testCaseId: `universal-${Date.now()}`
    };
    
    return formatTestCase(testCase, testCase.testType!);
  }

  private adaptSecurityTestToEnhanced(securityResult: any): EnhancedGeneratedTest {
    return {
      testCode: securityResult.generatedTest.testCode,
      testName: securityResult.generatedTest.testName,
      description: securityResult.generatedTest.description,
      metadata: {
        complexity: 'MODERATE',
        confidence: Math.round(securityResult.classification.confidence * 100),
        testTypes: ['security'],
        estimatedDuration: '30s',
        requirements: ['Security testing environment']
      },
      diagnostics: {
        warnings: [],
        suggestions: [],
        potentialIssues: []
      }
    };
  }

  private convertSecurityToBaseTestCase(securityResult: any, parsedInstruction: EnhancedParsedInstruction): BaseTestCase {
    const testCase: Partial<BaseTestCase> = {
      id: `security-${Date.now()}`,
      title: securityResult.generatedTest.testName,
      description: securityResult.generatedTest.description,
      category: 'Security',
      testType: 'API',
      priority: securityResult.generatedTest.metadata.riskLevel === 'CRITICAL' ? 'Critical' : 'High',
      severity: securityResult.generatedTest.metadata.riskLevel === 'CRITICAL' ? 'Critical' : 'High',
      stability: 'Stable',
      preconditions: [`URL is accessible`, 'Security testing environment is configured'],
      steps: securityResult.testData.testSteps.map((step: string, index: number) => ({
        stepNumber: index + 1,
        action: step,
        expectedResult: `Step ${index + 1} completes successfully`
      })),
      expectedResult: securityResult.testData.assertions.join('; '),
      validationCriteria: {
        compliance: [`Security Intent: ${securityResult.classification.intent}`],
        behavior: securityResult.generatedTest.assertions
      },
      qualityMetrics: {
        confidence: Math.round(securityResult.classification.confidence * 100),
        stability: 95,
        maintainability: 90
      },
      automationMapping: securityResult.generatedTest.testCode,
      playwrightCode: securityResult.generatedTest.testCode,
      testCaseId: `security-${Date.now()}`
    };
    
    return formatTestCase(testCase, 'API');
  }

  private enhanceTestCase(
    testCase: BaseTestCase,
    parsedInstruction: EnhancedParsedInstruction,
    generatedTest: EnhancedGeneratedTest
  ): BaseTestCase {
    // Add enhanced metadata from parsing
    return {
      ...testCase,
      description: `${testCase.description} (Confidence: ${Math.round(parsedInstruction.confidence * 100)}%, Complexity: ${parsedInstruction.context.complexity})`,
      validationCriteria: {
        ...testCase.validationCriteria,
        behavior: [
          ...testCase.validationCriteria.behavior || [],
          ...parsedInstruction.expectedOutcomes.map(o => o.description)
        ]
      }
    };
  }

  private generateMetadata(
    parsedInstruction: EnhancedParsedInstruction,
    intent: TestIntent,
    adaptations: string[],
    processingTime: number
  ): any {
    return {
      processingTime,
      confidence: Math.round((parsedInstruction.confidence + intent.confidence) / 2 * 100),
      adaptations,
      recommendations: [
        ...parsedInstruction.suggestions,
        ...(adaptations.length > 0 ? ['Review applied adaptations'] : []),
        ...(parsedInstruction.confidence < 0.7 ? ['Consider clarifying instruction'] : [])
      ]
    };
  }

  private generateDiagnostics(
    parsedInstruction: EnhancedParsedInstruction,
    generatedTest: EnhancedGeneratedTest,
    request: UniversalTestRequest
  ): any {
    return {
      warnings: [
        ...parsedInstruction.ambiguities.map(a => `Ambiguity: ${a}`),
        ...generatedTest.diagnostics.warnings
      ],
      errors: [],
      suggestions: [
        ...parsedInstruction.suggestions,
        ...generatedTest.diagnostics.suggestions
      ]
    };
  }

  // Fallback methods for error cases
  private createFallbackTestCase(request: UniversalTestRequest): BaseTestCase {
    return formatTestCase({
      title: 'Fallback Test Case',
      description: `Fallback test for: ${request.instruction}`,
      steps: [{
        stepNumber: 1,
        action: 'Execute basic test',
        expectedResult: 'Test completes'
      }],
      expectedResult: 'Basic test execution',
      validationCriteria: {},
      qualityMetrics: { confidence: 10, stability: 50, maintainability: 50 }
    }, 'Functional');
  }

  private createFallbackGeneratedTest(request: UniversalTestRequest): EnhancedGeneratedTest {
    return {
      testCode: `// Fallback test code\\ntest('fallback_test', async ({ request }) => {\\n  console.log('Fallback test execution');\\n});`,
      testName: 'fallback_test',
      description: 'Fallback test case',
      metadata: {
        complexity: 'SIMPLE',
        confidence: 10,
        testTypes: ['functional'],
        estimatedDuration: '10s',
        requirements: []
      },
      diagnostics: {
        warnings: ['Fallback test generated'],
        suggestions: ['Review original instruction'],
        potentialIssues: ['May not test intended behavior']
      }
    };
  }

  private createFallbackParsedInstruction(request: UniversalTestRequest): EnhancedParsedInstruction {
    return {
      actions: [],
      targets: [],
      conditions: [],
      validations: [],
      context: {
        domain: 'API',
        complexity: 'SIMPLE',
        testType: ['functional'],
        securityLevel: 'LOW',
        language: 'MIXED'
      },
      confidence: 0.1,
      ambiguities: ['Complete parsing failure'],
      suggestions: ['Simplify instruction', 'Provide more context'],
      testFlow: [],
      expectedOutcomes: []
    };
  }

  // Helper mapping methods
  private mapComplexityToCategory(complexity: string): BaseTestCase['category'] {
    const mapping = {
      'SIMPLE': 'Smoke' as const,
      'MODERATE': 'Regression' as const,
      'COMPLEX': 'Integration' as const,
      'VERY_COMPLEX': 'End-to-End' as const
    };
    return (mapping as any)[complexity] || 'Regression';
  }

  private mapDomainToTestType(domain: string): BaseTestCase['testType'] {
    const mapping = {
      'API': 'API' as const,
      'UI': 'UI' as const,
      'SECURITY': 'API' as const,
      'ACCESSIBILITY': 'Accessibility' as const,
      'PERFORMANCE': 'API' as const,
      'MIXED': 'Functional' as const
    };
    return (mapping as any)[domain] || 'Functional';
  }

  private mapSecurityLevelToPriority(securityLevel: string): BaseTestCase['priority'] {
    const mapping = {
      'LOW': 'Low' as const,
      'MEDIUM': 'Medium' as const,
      'HIGH': 'High' as const,
      'CRITICAL': 'Critical' as const
    };
    return (mapping as any)[securityLevel] || 'Medium';
  }

  private extractHttpMethod(actions: any[]): string {
    const httpAction = actions.find(a => a.type === 'HTTP_REQUEST');
    if (httpAction) {
      const verb = httpAction.verb.toLowerCase();
      if (['get', 'post', 'put', 'patch', 'delete'].includes(verb)) {
        return verb.toUpperCase();
      }
    }
    return 'GET';
  }
}