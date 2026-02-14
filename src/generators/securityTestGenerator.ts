/**
 * Security Test Generator
 * Main orchestrator for security test case generation
 * Integrates intent classification, instruction parsing, and code generation
 */

import { SecurityIntentClassifier, ClassificationResult } from './securityIntentClassifier';
import { SecurityInstructionParser, SecurityTestData } from './securityInstructionParser';
import { SecurityPlaywrightCodeGenerator, GeneratedSecurityTest } from './securityPlaywrightCodeGenerator';
import { InstructionSpecificSecurityGenerator, InstructionSpecificTest } from './instructionSpecificSecurityGenerator';

export interface SecurityTestRequest {
  url: string;
  instruction: string;
  method?: string;
  additionalContext?: {
    expectedBehavior?: string;
    riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    compliance?: string[];
  };
}

export interface SecurityTestResult {
  success: boolean;
  classification: ClassificationResult;
  testData: SecurityTestData;
  generatedTest: GeneratedSecurityTest;
  validationResults: {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  };
  metadata: {
    generatedAt: string;
    processingTime: number;
    confidence: number;
  };
}

export class SecurityTestGenerator {
  private classifier: SecurityIntentClassifier;
  private parser: SecurityInstructionParser;
  private codeGenerator: SecurityPlaywrightCodeGenerator;
  private instructionSpecificGenerator: InstructionSpecificSecurityGenerator;

  constructor() {
    this.classifier = new SecurityIntentClassifier();
    this.parser = new SecurityInstructionParser();
    this.codeGenerator = new SecurityPlaywrightCodeGenerator();
    this.instructionSpecificGenerator = new InstructionSpecificSecurityGenerator();
  }

  /**
   * Generates complete security test from natural language instruction
   */
  public async generateSecurityTest(request: SecurityTestRequest): Promise<SecurityTestResult> {
    const startTime = Date.now();

    try {
      // Step 1: Validate input
      this.validateRequest(request);

      // Step 2: Validate security context
      const validationResults = this.classifier.validateSecurityContext(request.instruction);
      
      if (!validationResults.isValid) {
        console.warn('Security context validation issues:', validationResults.issues);
      }

      // Step 3: Classify security intent
      console.log('🔍 Classifying security intent...');
      const classification = this.classifier.classifyIntent(request.instruction);
      
      console.log(`✅ Classified as: ${classification.intent} (confidence: ${(classification.confidence * 100).toFixed(1)}%)`);
      console.log(`📝 Reasoning: ${classification.reasoning}`);

      // Step 4: Use instruction-specific generation for better accuracy
      console.log('🎯 Using instruction-specific security test generation...');
      const parsedInstruction = this.instructionSpecificGenerator.parseSecurityInstruction(
        request.instruction,
        request.url
      );
      
      const instructionSpecificTest = this.instructionSpecificGenerator.generateInstructionSpecificTest(parsedInstruction);
      
      // Step 5: Convert to standard format for compatibility
      const generatedTest: GeneratedSecurityTest = {
        testCode: instructionSpecificTest.testCode,
        testName: instructionSpecificTest.testName,
        description: instructionSpecificTest.description,
        assertions: parsedInstruction.validations,
        metadata: {
          intent: classification.intent,
          securityType: this.getSecurityTypeFromIntent(classification.intent),
          riskLevel: this.determineRiskLevel(classification.intent, request.instruction)
        }
      };

      // Step 6: Create test data for compatibility
      const testData: SecurityTestData = {
        testType: 'security',
        intent: classification.intent,
        url: request.url,
        method: parsedInstruction.method,
        instruction: request.instruction,
        inputData: parsedInstruction.data,
        expectedBehavior: {
          statusCode: this.extractExpectedStatusCodes(parsedInstruction.validations)
        },
        testSteps: parsedInstruction.steps.map(step => `${step.action}: ${step.target}${step.value ? ` = ${step.value}` : ''}`),
        assertions: parsedInstruction.validations
      };

      // Step 7: Enhance with additional context
      if (request.additionalContext) {
        this.enhanceWithContext(generatedTest, request.additionalContext);
      }

      const processingTime = Date.now() - startTime;

      console.log(`✅ Instruction-specific security test generated successfully`);
      console.log(`   Test Name: ${generatedTest.testName}`);
      console.log(`   Steps: ${parsedInstruction.steps.length}`);
      console.log(`   Validations: ${parsedInstruction.validations.length}`);
      console.log(`   Confidence: ${(instructionSpecificTest.confidence * 100).toFixed(1)}%`);

      return {
        success: true,
        classification,
        testData,
        generatedTest,
        validationResults,
        metadata: {
          generatedAt: new Date().toISOString(),
          processingTime,
          confidence: instructionSpecificTest.confidence
        }
      };

    } catch (error) {
      console.error('❌ Security test generation failed:', error);
      
      return {
        success: false,
        classification: { intent: 'UNKNOWN', confidence: 0, matchedKeywords: [], reasoning: 'Generation failed' },
        testData: {} as SecurityTestData,
        generatedTest: {} as GeneratedSecurityTest,
        validationResults: {
          isValid: false,
          issues: [`Generation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
          suggestions: ['Please check your instruction format and try again']
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          confidence: 0
        }
      };
    }
  }

  /**
   * Generates multiple security tests for comprehensive coverage
   */
  public async generateSecurityTestSuite(
    url: string,
    instructions: string[],
    method: string = 'POST'
  ): Promise<SecurityTestResult[]> {
    console.log(`🔒 Generating security test suite for ${url}`);
    console.log(`📝 Processing ${instructions.length} security instructions`);

    const results: SecurityTestResult[] = [];

    for (let i = 0; i < instructions.length; i++) {
      console.log(`\n--- Processing instruction ${i + 1}/${instructions.length} ---`);
      
      const result = await this.generateSecurityTest({
        url,
        instruction: instructions[i],
        method
      });

      results.push(result);

      if (result.success) {
        console.log(`✅ Generated: ${result.generatedTest.testName}`);
      } else {
        console.log(`❌ Failed to generate test for: ${instructions[i]}`);
      }
    }

    // Generate summary
    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;
    
    console.log(`\n📊 Security Test Suite Generation Summary:`);
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((successful / results.length) * 100).toFixed(1)}%`);

    return results;
  }

  /**
   * Analyzes security coverage for a given URL
   */
  public analyzeSecurityCoverage(results: SecurityTestResult[]): {
    coverage: Record<string, number>;
    gaps: string[];
    recommendations: string[];
    riskAssessment: {
      overall: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      details: Record<string, string>;
    };
  } {
    const intentCounts: Record<string, number> = {};
    const allIntents = this.classifier.getAllIntents();

    // Count generated tests by intent
    results.forEach(result => {
      if (result.success) {
        const intent = result.classification.intent;
        intentCounts[intent] = (intentCounts[intent] || 0) + 1;
      }
    });

    // Calculate coverage percentages
    const coverage: Record<string, number> = {};
    allIntents.forEach(intent => {
      coverage[intent.id] = intentCounts[intent.id] || 0;
    });

    // Identify gaps
    const gaps = allIntents
      .filter(intent => !intentCounts[intent.id])
      .map(intent => intent.type);

    // Generate recommendations
    const recommendations: string[] = [];
    if (gaps.length > 0) {
      recommendations.push(`Add tests for: ${gaps.join(', ')}`);
    }
    if (!intentCounts['SEC_INJ']) {
      recommendations.push('Critical: Add injection prevention tests');
    }
    if (!intentCounts['SEC_AUTH']) {
      recommendations.push('Important: Add authentication security tests');
    }

    // Risk assessment
    const riskDetails: Record<string, string> = {};
    let overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';

    if (!intentCounts['SEC_INJ']) {
      riskDetails['Injection'] = 'CRITICAL - No injection tests';
      overallRisk = 'CRITICAL';
    }
    if (!intentCounts['SEC_AUTH']) {
      riskDetails['Authentication'] = 'HIGH - No auth tests';
      if (overallRisk !== 'CRITICAL') overallRisk = 'HIGH';
    }
    if (!intentCounts['SEC_AUTHZ']) {
      riskDetails['Authorization'] = 'HIGH - No authz tests';
      if (overallRisk === 'LOW') overallRisk = 'MEDIUM';
    }

    return {
      coverage,
      gaps,
      recommendations,
      riskAssessment: {
        overall: overallRisk,
        details: riskDetails
      }
    };
  }

  /**
   * Exports security test to file
   */
  public async exportSecurityTest(
    result: SecurityTestResult,
    outputPath: string
  ): Promise<void> {
    if (!result.success) {
      throw new Error('Cannot export failed test generation result');
    }

    const testContent = this.generateTestFileContent(result);
    
    // Write to file (implementation depends on environment)
    console.log(`📁 Exporting security test to: ${outputPath}`);
    console.log('Test content generated successfully');
    
    // In a real implementation, you would write to file system here
    // For now, we'll just log the content
    console.log('Generated test content:');
    console.log(testContent);
  }

  /**
   * Helper method to get security type from intent
   */
  private getSecurityTypeFromIntent(intent: string): string {
    const typeMap: Record<string, string> = {
      'SEC_INJ': 'Injection Prevention',
      'SEC_AUTH': 'Authentication Security',
      'SEC_AUTHZ': 'Authorization Control',
      'SEC_DATA': 'Data Protection',
      'SEC_HEADER': 'Security Headers',
      'SEC_METHOD': 'Method Security',
      'SEC_RATE': 'Rate Limiting'
    };
    return typeMap[intent] || 'General Security';
  }

  /**
   * Helper method to determine risk level
   */
  private determineRiskLevel(intent: string, instruction: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (intent === 'SEC_INJ' || instruction.toLowerCase().includes('injection')) {
      return 'CRITICAL';
    }
    if (intent === 'SEC_AUTH' || intent === 'SEC_AUTHZ') {
      return 'HIGH';
    }
    if (intent === 'SEC_HEADER' || intent === 'SEC_METHOD') {
      return 'MEDIUM';
    }
    return 'LOW';
  }

  /**
   * Helper method to extract expected status codes from validations
   */
  private extractExpectedStatusCodes(validations: string[]): number[] {
    const statusCodes: number[] = [];
    
    for (const validation of validations) {
      if (validation.includes('401') || validation.includes('403')) {
        statusCodes.push(401, 403);
      } else if (validation.includes('400')) {
        statusCodes.push(400);
      } else if (validation.includes('422')) {
        statusCodes.push(422);
      } else if (validation.includes('FAIL') || validation.includes('REJECT')) {
        statusCodes.push(400, 401, 403, 422);
      }
    }
    
    return statusCodes.length > 0 ? statusCodes : [400, 401, 403];
  }

  /**
   * Validates security test request
   */
  private validateRequest(request: SecurityTestRequest): void {
    if (!request.url) {
      throw new Error('URL is required for security test generation');
    }

    if (!request.instruction) {
      throw new Error('Security testing instruction is required');
    }

    // Validate URL format
    try {
      new URL(request.url);
    } catch {
      throw new Error('Invalid URL format provided');
    }

    // Validate instruction length
    if (request.instruction.length < 10) {
      throw new Error('Security instruction too short - provide more detailed requirements');
    }

    if (request.instruction.length > 1000) {
      throw new Error('Security instruction too long - please be more concise');
    }
  }

  /**
   * Enhances generated test with additional context
   */
  private enhanceWithContext(
    generatedTest: GeneratedSecurityTest,
    context: NonNullable<SecurityTestRequest['additionalContext']>
  ): void {
    if (context.riskLevel) {
      generatedTest.metadata.riskLevel = context.riskLevel;
    }

    if (context.compliance) {
      generatedTest.metadata.wcagCompliance = context.compliance;
    }

    if (context.expectedBehavior) {
      generatedTest.description += ` Expected: ${context.expectedBehavior}`;
    }
  }

  /**
   * Generates complete test file content
   */
  private generateTestFileContent(result: SecurityTestResult): string {
    const { generatedTest, classification, testData, metadata } = result;

    return `/**
 * Generated Security Test
 * 
 * Intent: ${classification.intent}
 * Security Type: ${generatedTest.metadata.securityType}
 * Risk Level: ${generatedTest.metadata.riskLevel}
 * Generated: ${metadata.generatedAt}
 * Confidence: ${(classification.confidence * 100).toFixed(1)}%
 * 
 * Original Instruction: ${testData.instruction}
 * 
 * Test Steps:
${testData.testSteps.map((step, i) => ` * ${i + 1}. ${step}`).join('\n')}
 * 
 * Assertions:
${generatedTest.assertions.map(assertion => ` * - ${assertion}`).join('\n')}
 */

${generatedTest.testCode}
`;
  }

  /**
   * Gets available security intents for reference
   */
  public getAvailableSecurityIntents() {
    return this.classifier.getAllIntents();
  }
}