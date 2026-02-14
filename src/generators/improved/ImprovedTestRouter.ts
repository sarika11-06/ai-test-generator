/**
 * Improved Test Router
 * Simplified, focused router that replaces the monolithic integratedTestRouter
 */

import { ParserRegistry } from '../core/UnifiedInstructionParser';
import { ImprovedAccessibilityGenerator, AccessibilityTestRequest } from './ImprovedAccessibilityGenerator';
import { ImprovedSecurityGenerator, SecurityTestRequest } from './ImprovedSecurityGenerator';
import { TestGenerationRequest, TestGenerationResult } from '../core/BaseTestGenerator';

export interface RouterTestRequest extends TestGenerationRequest {
  testType?: 'accessibility' | 'security' | 'api' | 'functional' | 'auto';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface RouterTestResult extends TestGenerationResult {
  routingDecision: {
    selectedGenerator: string;
    confidence: number;
    reasoning: string;
    alternativeGenerators: string[];
  };
  generatorSpecificData?: any;
}

/**
 * Test Intent Classifier
 * Determines which generator should handle a test request
 */
class TestIntentClassifier {
  private readonly intentKeywords = {
    accessibility: [
      'accessibility', 'a11y', 'wcag', 'screen reader', 'keyboard', 'aria',
      'focus', 'tab navigation', 'contrast', 'semantic', 'assistive',
      'press tab', 'tab key', 'aria label', 'role attribute', 'alt text'
    ],
    security: [
      'security', 'auth', 'authorization', 'authentication', 'token', 'bearer',
      'invalid', 'unauthorized', 'forbidden', 'inject', 'injection', 'sql',
      'xss', 'script', 'malicious', 'payload', 'exploit', 'vulnerability',
      'header', 'x-admin', 'admin', 'privilege', 'escalation', 'bypass'
    ],
    api: [
      'api', 'endpoint', 'request', 'response', 'get', 'post', 'put', 'patch',
      'delete', 'json', 'rest', 'graphql', 'status code', 'header', 'body'
    ],
    functional: [
      'click', 'type', 'fill', 'select', 'navigate', 'button', 'link', 'form',
      'input', 'submit', 'page', 'element', 'user', 'interaction'
    ]
  };

  public classifyIntent(instruction: string): {
    primaryType: string;
    confidence: number;
    scores: Record<string, number>;
    reasoning: string;
  } {
    const instructionLower = instruction.toLowerCase();
    const scores: Record<string, number> = {};

    // Calculate scores for each test type
    Object.entries(this.intentKeywords).forEach(([type, keywords]) => {
      const matchedKeywords = keywords.filter(keyword => 
        instructionLower.includes(keyword.toLowerCase())
      );
      scores[type] = matchedKeywords.length / keywords.length;
    });

    // Find the highest scoring type
    const sortedScores = Object.entries(scores).sort(([,a], [,b]) => b - a);
    const [primaryType, confidence] = sortedScores[0];

    // Generate reasoning
    const reasoning = this.generateReasoning(instructionLower, primaryType, scores);

    return {
      primaryType,
      confidence,
      scores,
      reasoning
    };
  }

  private generateReasoning(instruction: string, primaryType: string, scores: Record<string, number>): string {
    const matchedKeywords = this.intentKeywords[primaryType as keyof typeof this.intentKeywords]
      .filter(keyword => instruction.includes(keyword.toLowerCase()));

    let reasoning = `Classified as ${primaryType} based on keywords: ${matchedKeywords.slice(0, 3).join(', ')}`;
    
    if (matchedKeywords.length > 3) {
      reasoning += ` and ${matchedKeywords.length - 3} more`;
    }

    // Add confidence context
    if (scores[primaryType] > 0.7) {
      reasoning += '. High confidence classification.';
    } else if (scores[primaryType] > 0.4) {
      reasoning += '. Moderate confidence classification.';
    } else {
      reasoning += '. Low confidence classification - consider manual review.';
    }

    return reasoning;
  }
}

/**
 * Improved Test Router
 * Simplified router with clear separation of concerns
 */
export class ImprovedTestRouter {
  private parserRegistry: ParserRegistry;
  private intentClassifier: TestIntentClassifier;
  private accessibilityGenerator: ImprovedAccessibilityGenerator;
  private securityGenerator: ImprovedSecurityGenerator;

  constructor() {
    this.parserRegistry = new ParserRegistry();
    this.intentClassifier = new TestIntentClassifier();
    this.accessibilityGenerator = new ImprovedAccessibilityGenerator();
    this.securityGenerator = new ImprovedSecurityGenerator();
  }

  /**
   * Route test generation request to appropriate generator
   */
  public async routeTestGeneration(request: RouterTestRequest): Promise<RouterTestResult> {
    const startTime = Date.now();

    try {
      console.log('🚦 Routing test generation request...');
      console.log(`📋 Instruction: ${request.instruction}`);
      console.log(`🎯 URL: ${request.url}`);
      console.log(`🔧 Requested Type: ${request.testType || 'auto'}`);

      // Step 1: Classify intent (unless explicitly specified)
      let routingDecision;
      if (request.testType && request.testType !== 'auto') {
        routingDecision = {
          selectedGenerator: request.testType,
          confidence: 1.0,
          reasoning: `Explicitly requested ${request.testType} test type`,
          alternativeGenerators: []
        };
      } else {
        const classification = this.intentClassifier.classifyIntent(request.instruction);
        routingDecision = {
          selectedGenerator: classification.primaryType,
          confidence: classification.confidence,
          reasoning: classification.reasoning,
          alternativeGenerators: Object.keys(classification.scores)
            .filter(type => type !== classification.primaryType && classification.scores[type] > 0.2)
            .sort((a, b) => classification.scores[b] - classification.scores[a])
        };
      }

      console.log(`🎯 Routing Decision: ${routingDecision.selectedGenerator} (${Math.round(routingDecision.confidence * 100)}% confidence)`);
      console.log(`💭 Reasoning: ${routingDecision.reasoning}`);

      // Step 2: Route to appropriate generator
      let result: TestGenerationResult;
      let generatorSpecificData: any = {};

      switch (routingDecision.selectedGenerator) {
        case 'accessibility':
          const accessibilityRequest: AccessibilityTestRequest = {
            ...request,
            wcagLevel: this.extractWcagLevel(request.instruction),
            assistiveTechnology: this.extractAssistiveTechnology(request.instruction),
            focusAreas: this.extractAccessibilityFocusAreas(request.instruction)
          };
          const accessibilityResult = await this.accessibilityGenerator.generateTest(accessibilityRequest);
          result = accessibilityResult;
          generatorSpecificData = {
            wcagCriteria: accessibilityResult.wcagCriteria,
            accessibilityFeatures: accessibilityResult.accessibilityFeatures,
            keyboardTestSteps: accessibilityResult.keyboardTestSteps,
            ariaValidations: accessibilityResult.ariaValidations
          };
          break;

        case 'security':
          const securityRequest: SecurityTestRequest = {
            ...request,
            securityLevel: this.extractSecurityLevel(request.instruction),
            testTypes: this.extractSecurityTestTypes(request.instruction),
            compliance: this.extractComplianceRequirements(request.instruction)
          };
          const securityResult = await this.securityGenerator.generateTest(securityRequest);
          result = securityResult;
          generatorSpecificData = {
            securityCategories: securityResult.securityCategories,
            vulnerabilityTests: securityResult.vulnerabilityTests,
            complianceChecks: securityResult.complianceChecks,
            riskLevel: securityResult.riskLevel
          };
          break;

        case 'api':
          // TODO: Implement API generator
          result = await this.generateFallbackTest(request, 'API generator not yet implemented');
          break;

        case 'functional':
          // TODO: Implement functional generator
          result = await this.generateFallbackTest(request, 'Functional generator not yet implemented');
          break;

        default:
          result = await this.generateFallbackTest(request, `Unknown test type: ${routingDecision.selectedGenerator}`);
          break;
      }

      // Step 3: Add routing metadata
      const routerResult: RouterTestResult = {
        ...result,
        routingDecision,
        generatorSpecificData
      };

      // Update metadata with routing information
      routerResult.metadata = {
        ...result.metadata
      };

      console.log(`✅ Test generation completed via ${routingDecision.selectedGenerator} generator`);
      console.log(`⏱️ Total routing time: ${Date.now() - startTime}ms`);

      return routerResult;

    } catch (error: any) {
      console.error('❌ Test routing failed:', error.message);

      return {
        success: false,
        testCode: this.generateErrorTestCode(request, error.message),
        testName: 'Error Test',
        description: `Test generation failed: ${error.message}`,
        metadata: {
          generatedAt: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          confidence: 0,
          testType: 'error'
        },
        diagnostics: {
          warnings: [],
          errors: [error.message],
          suggestions: ['Check instruction format', 'Verify URL validity', 'Simplify test requirements']
        },
        routingDecision: {
          selectedGenerator: 'error',
          confidence: 0,
          reasoning: `Error during routing: ${error.message}`,
          alternativeGenerators: []
        }
      };
    }
  }

  /**
   * Get routing recommendations for an instruction
   */
  public getRoutingRecommendations(instruction: string): {
    recommendations: Array<{
      generator: string;
      confidence: number;
      reasoning: string;
    }>;
    primaryRecommendation: string;
  } {
    const classification = this.intentClassifier.classifyIntent(instruction);
    
    const recommendations = Object.entries(classification.scores)
      .filter(([, score]) => score > 0.1)
      .sort(([, a], [, b]) => b - a)
      .map(([generator, confidence]) => ({
        generator,
        confidence,
        reasoning: this.generateRecommendationReasoning(instruction, generator, confidence)
      }));

    return {
      recommendations,
      primaryRecommendation: classification.primaryType
    };
  }

  // Helper methods for extracting request-specific parameters
  private extractWcagLevel(instruction: string): 'A' | 'AA' | 'AAA' {
    const instructionLower = instruction.toLowerCase();
    if (instructionLower.includes('aaa') || instructionLower.includes('level aaa')) return 'AAA';
    if (instructionLower.includes('aa') || instructionLower.includes('level aa')) return 'AA';
    return 'AA'; // Default to AA
  }

  private extractAssistiveTechnology(instruction: string): ('NVDA' | 'JAWS' | 'VoiceOver' | 'TalkBack' | 'Keyboard')[] {
    const instructionLower = instruction.toLowerCase();
    const technologies: ('NVDA' | 'JAWS' | 'VoiceOver' | 'TalkBack' | 'Keyboard')[] = [];
    
    if (instructionLower.includes('nvda')) technologies.push('NVDA');
    if (instructionLower.includes('jaws')) technologies.push('JAWS');
    if (instructionLower.includes('voiceover')) technologies.push('VoiceOver');
    if (instructionLower.includes('talkback')) technologies.push('TalkBack');
    if (instructionLower.includes('keyboard')) technologies.push('Keyboard');
    
    return technologies.length > 0 ? technologies : ['Keyboard', 'NVDA'];
  }

  private extractAccessibilityFocusAreas(instruction: string): ('keyboard' | 'screen-reader' | 'contrast' | 'forms' | 'navigation')[] {
    const instructionLower = instruction.toLowerCase();
    const areas: ('keyboard' | 'screen-reader' | 'contrast' | 'forms' | 'navigation')[] = [];
    
    if (instructionLower.includes('keyboard') || instructionLower.includes('tab')) areas.push('keyboard');
    if (instructionLower.includes('screen reader') || instructionLower.includes('aria')) areas.push('screen-reader');
    if (instructionLower.includes('contrast') || instructionLower.includes('color')) areas.push('contrast');
    if (instructionLower.includes('form') || instructionLower.includes('input')) areas.push('forms');
    if (instructionLower.includes('navigation') || instructionLower.includes('menu')) areas.push('navigation');
    
    return areas;
  }

  private extractSecurityLevel(instruction: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const instructionLower = instruction.toLowerCase();
    if (instructionLower.includes('critical') || instructionLower.includes('high risk')) return 'CRITICAL';
    if (instructionLower.includes('high') || instructionLower.includes('important')) return 'HIGH';
    if (instructionLower.includes('medium') || instructionLower.includes('moderate')) return 'MEDIUM';
    return 'MEDIUM'; // Default to medium
  }

  private extractSecurityTestTypes(instruction: string): ('injection' | 'auth' | 'authorization' | 'data-exposure' | 'headers' | 'csrf' | 'xss')[] {
    const instructionLower = instruction.toLowerCase();
    const types: ('injection' | 'auth' | 'authorization' | 'data-exposure' | 'headers' | 'csrf' | 'xss')[] = [];
    
    if (instructionLower.includes('injection') || instructionLower.includes('sql')) types.push('injection');
    if (instructionLower.includes('auth') || instructionLower.includes('login')) types.push('auth');
    if (instructionLower.includes('authorization') || instructionLower.includes('access')) types.push('authorization');
    if (instructionLower.includes('data') || instructionLower.includes('sensitive')) types.push('data-exposure');
    if (instructionLower.includes('header') || instructionLower.includes('csp')) types.push('headers');
    if (instructionLower.includes('csrf') || instructionLower.includes('cross-site')) types.push('csrf');
    if (instructionLower.includes('xss') || instructionLower.includes('script')) types.push('xss');
    
    return types;
  }

  private extractComplianceRequirements(instruction: string): ('OWASP' | 'PCI-DSS' | 'GDPR' | 'SOX')[] {
    const instructionLower = instruction.toLowerCase();
    const compliance: ('OWASP' | 'PCI-DSS' | 'GDPR' | 'SOX')[] = [];
    
    if (instructionLower.includes('owasp')) compliance.push('OWASP');
    if (instructionLower.includes('pci')) compliance.push('PCI-DSS');
    if (instructionLower.includes('gdpr')) compliance.push('GDPR');
    if (instructionLower.includes('sox')) compliance.push('SOX');
    
    return compliance;
  }

  private generateRecommendationReasoning(instruction: string, generator: string, confidence: number): string {
    const intentKeywords = this.intentClassifier['intentKeywords'] as Record<string, string[]>;
    const keywordMatches = intentKeywords[generator as keyof typeof intentKeywords]
      ?.filter((keyword: string) => instruction.toLowerCase().includes(keyword.toLowerCase())) || [];
    
    return `${Math.round(confidence * 100)}% match based on keywords: ${keywordMatches.slice(0, 3).join(', ')}`;
  }

  private async generateFallbackTest(request: RouterTestRequest, reason: string): Promise<TestGenerationResult> {
    return {
      success: false,
      testCode: this.generateFallbackTestCode(request),
      testName: 'Fallback Test',
      description: `Fallback test generated: ${reason}`,
      metadata: {
        generatedAt: new Date().toISOString(),
        processingTime: 0,
        confidence: 0.1,
        testType: 'fallback'
      },
      diagnostics: {
        warnings: [reason],
        errors: [],
        suggestions: ['Specify test type explicitly', 'Use supported test types: accessibility, security']
      }
    };
  }

  private generateFallbackTestCode(request: RouterTestRequest): string {
    return `import { test, expect } from '@playwright/test';

test('Fallback Test', async ({ page }) => {
  // Basic test - generator not implemented
  await page.goto('${request.url}');
  await expect(page).toHaveTitle(/.*/);
  
  // TODO: Implement specific test logic
  console.log('Instruction: ${request.instruction}');
});`;
  }

  private generateErrorTestCode(request: RouterTestRequest, error: string): string {
    return `import { test, expect } from '@playwright/test';

test('Error Test', async ({ page }) => {
  // Test generation failed with error: ${error}
  await page.goto('${request.url}');
  
  // Basic validation to ensure page loads
  await expect(page).toHaveTitle(/.*/);
  
  // Log the original instruction for debugging
  console.log('Original instruction: ${request.instruction}');
  console.log('Error: ${error}');
});`;
  }
}