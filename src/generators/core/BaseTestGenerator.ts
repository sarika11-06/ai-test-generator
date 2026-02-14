/**
 * Base Test Generator
 * Abstract base class for all test generators to ensure consistency
 */

export interface TestGenerationRequest {
  url: string;
  instruction: string;
  context?: {
    testType?: string[];
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    environment?: 'DEV' | 'STAGING' | 'PROD';
    constraints?: string[];
  };
}

export interface TestGenerationResult {
  success: boolean;
  testCode: string;
  testName: string;
  description: string;
  metadata: {
    generatedAt: string;
    processingTime: number;
    confidence: number;
    testType: string;
  };
  diagnostics: {
    warnings: string[];
    errors: string[];
    suggestions: string[];
  };
}

export abstract class BaseTestGenerator {
  protected abstract generatorType: string;

  /**
   * Generate test based on request
   */
  public abstract generateTest(request: TestGenerationRequest): Promise<TestGenerationResult>;

  /**
   * Validate request before processing
   */
  protected validateRequest(request: TestGenerationRequest): void {
    if (!request.url) {
      throw new Error('URL is required for test generation');
    }
    if (!request.instruction) {
      throw new Error('Instruction is required for test generation');
    }
  }

  /**
   * Create base metadata for test results
   */
  protected createBaseMetadata(startTime: number, confidence: number): any {
    return {
      generatedAt: new Date().toISOString(),
      processingTime: Date.now() - startTime,
      confidence,
      testType: this.generatorType
    };
  }

  /**
   * Create base diagnostics structure
   */
  protected createBaseDiagnostics(): any {
    return {
      warnings: [],
      errors: [],
      suggestions: []
    };
  }
}