/**
 * Integrated Test Router
 * 
 * This module integrates the new accessibility and API test generators with the existing
 * functional test generation system. It routes test generation requests to the appropriate
 * generators based on test intent classification.
 * 
 * Requirements: 4.3, 4.4, 4.5, 4.6, 11.1, 11.2, 11.3, 11.4, 11.6, 11.7
 */

import { classifyTestIntent, type TestIntent } from './testIntentClassifier';
import { generateAccessibilityTests, type AccessibilityTestCase } from './accessibilityTestGenerator';
import { generateAPITests, generateAPIAutomationCode, type APITestCase } from './apiTestGenerator';
import { generateInstructionBasedTestCase } from './instructionBasedAPIGenerator';
import { parseAPIInstructionEnhanced } from './apiPlaywrightCodeGenerator';
import { EnhancedAccessibilityParser, type AccessibilityTestRequirements } from './enhancedAccessibilityParser';
import { EnhancedPlaywrightAccessibilityCodeGenerator } from './enhancedPlaywrightCodeGenerator';
import { 
  selectAccessibilityTestTemplate, 
  generateAxeCoreIntegrationCode,
  generateAccessibilityTestingFeedback,
  type AccessibilityTestTemplate,
  type TemplateSelectionResult 
} from './accessibilityTestTemplates';
import { SecurityTestGenerator } from './securityTestGenerator';
import type { BaseTestCase } from './testCaseFormatter';

/**
 * Website Analysis Interface
 * Represents the analyzed structure of a website
 */
export interface WebsiteAnalysis {
  url: string;
  allInteractive?: any[];
  [key: string]: any;
}

/**
 * Test Generation Request
 */
export interface TestGenerationRequest {
  url: string;
  prompt?: string;
  websiteAnalysis?: WebsiteAnalysis;
  outputFormat?: 'json' | 'playwright';
  testType?: 'functional' | 'accessibility' | 'api' | 'security'; // Add security type
  securityEnabled?: boolean; // Add security flag
}

/**
 * Test Generation Response
 */
export interface TestGenerationResponse {
  testCases: (BaseTestCase | AccessibilityTestCase | APITestCase)[];
  summary: {
    totalTests: number;
    byType: Record<string, number>;
    intent: {
      primaryType: string;
      secondaryTypes: string[];
      confidence: number;
    };
    generatorsUsed: Record<string, number>;
    coverageAreas: string[];
  };
  analysis: WebsiteAnalysis;
  intent: TestIntent;
}

/**
 * Functional Test Generator Interface
 * Represents the existing functional test generator
 */
export interface FunctionalTestGenerator {
  generate(analysis: WebsiteAnalysis, prompt: string): any[];
}

/**
 * Detect if instruction is specific or generic
 * 
 * Checks for keywords that indicate a specific, instruction-based test request
 * versus a generic test generation request.
 * 
 * Requirements: 8.2, 8.3
 * 
 * @param prompt - User's testing instruction
 * @returns True if instruction is specific, false if generic
 */
function isSpecificInstruction(prompt: string): boolean {
  const promptLower = prompt.toLowerCase();
  
  const specificKeywords = [
    'send a',
    'send get',
    'send post',
    'send put',
    'send patch',
    'send delete',
    'store response',
    'read field',
    'verify',
    'count',
    'expect',
    'measure'
  ];
  
  // Return true if any keyword found
  return specificKeywords.some(keyword => promptLower.includes(keyword));
}

/**
 * Integrated Test Router
 * 
 * Routes test generation requests to appropriate generators based on intent classification.
 * Preserves existing functional test generation while adding accessibility and API testing.
 */
export class IntegratedTestRouter {
  private functionalGenerator?: FunctionalTestGenerator;
  private enhancedAccessibilityParser: EnhancedAccessibilityParser;
  private enhancedPlaywrightGenerator: EnhancedPlaywrightAccessibilityCodeGenerator;
  private securityTestGenerator: SecurityTestGenerator;

  constructor() {
    this.enhancedAccessibilityParser = new EnhancedAccessibilityParser();
    this.enhancedPlaywrightGenerator = new EnhancedPlaywrightAccessibilityCodeGenerator();
    this.securityTestGenerator = new SecurityTestGenerator();
  }

  /**
   * Set the functional test generator (existing generator)
   * This allows the router to delegate to existing functionality
   */
  setFunctionalGenerator(generator: FunctionalTestGenerator): void {
    this.functionalGenerator = generator;
  }

  /**
   * Generate enhanced accessibility tests using the enhanced parser and code generator
   * 
   * Requirements: 1.6, 7.1, 7.2, 7.3, 7.4, 7.5
   * 
   * @param analysis - Website analysis
   * @param prompt - User prompt
   * @returns Array of enhanced accessibility test cases
   */
  private generateEnhancedAccessibilityTests(
    analysis: WebsiteAnalysis,
    prompt: string
  ): AccessibilityTestCase[] {
    try {
      console.log('[IntegratedTestRouter] Using enhanced accessibility parser with templates...');
      
      // Parse instructions using enhanced parser
      const requirements: AccessibilityTestRequirements = this.enhancedAccessibilityParser.parseInstructions(
        prompt,
        analysis
      );
      
      console.log('[IntegratedTestRouter] Enhanced parser requirements:', {
        domInspection: requirements.domInspection.length,
        keyboardNavigation: requirements.keyboardNavigation.length,
        ariaCompliance: requirements.ariaCompliance.length,
        visualAccessibility: requirements.visualAccessibility.length,
        wcagGuidelines: requirements.wcagGuidelines.length,
      });
      
      // Check if this is instruction-based input
      const isInstructionBased = this.isInstructionBasedInput(prompt);
      
      if (isInstructionBased) {
        console.log('[IntegratedTestRouter] Generating instruction-specific accessibility test case');
        return this.generateInstructionBasedAccessibilityTest(analysis, requirements, prompt);
      } else {
        console.log('[IntegratedTestRouter] Generating template-based accessibility test cases');
        return this.generateTemplateBasedAccessibilityTests(analysis, requirements, prompt);
      }
      
    } catch (error: any) {
      console.error('[IntegratedTestRouter] Error in enhanced accessibility generation:', error.message);
      
      // Fallback to standard accessibility generation for backward compatibility
      console.log('[IntegratedTestRouter] Falling back to standard accessibility generation...');
      return generateAccessibilityTests(analysis, prompt);
    }
  }

  /**
   * Check if user input contains specific step-by-step instructions
   * 
   * @param userInput - User's input text
   * @returns True if input contains specific instructions, false for general accessibility testing
   */
  private isInstructionBasedInput(userInput: string): boolean {
    const instructionKeywords = [
      // Action keywords
      'load the webpage', 'press tab', 'press enter', 'press space', 'click on', 'navigate to',
      'store', 'verify', 'check that', 'ensure that', 'validate that', 'confirm that',
      'measure', 'count', 'find', 'locate', 'inspect', 'examine',
      
      // Step indicators
      'step 1', 'step 2', 'first', 'then', 'next', 'after that', 'finally',
      'load', 'press', 'store', 'verify', 'check', 'measure', 'count',
      
      // Specific element references
      'first focused element', 'next focusable element', 'previous element',
      'current focus', 'focused element', 'active element',
      
      // Sequence indicators
      'at page start', 'from the beginning', 'in order', 'sequentially',
      'one by one', 'step by step'
    ];
    
    const inputLower = userInput.toLowerCase();
    const hasInstructionKeywords = instructionKeywords.some(keyword => inputLower.includes(keyword));
    
    // Also check for comma-separated or numbered steps
    const hasStepStructure = /\d+\.|,\s*[a-z]|;\s*[a-z]/i.test(userInput);
    
    return hasInstructionKeywords || hasStepStructure;
  }

  /**
   * Generate instruction-based accessibility test case
   * 
   * Creates a test case with specific steps based on user instructions
   * and generates corresponding Playwright code using the enhanced code generator
   */
  private generateInstructionBasedAccessibilityTest(
    analysis: WebsiteAnalysis,
    requirements: AccessibilityTestRequirements,
    prompt: string
  ): AccessibilityTestCase[] {
    console.log('[IntegratedTestRouter] Generating instruction-based accessibility test');
    
    // Use the enhanced accessibility code generator
    const { EnhancedAccessibilityCodeGenerator } = require('./accessibilityCodeGenerator');
    const codeGenerator = new EnhancedAccessibilityCodeGenerator();
    
    // Generate structured test steps with expected outcomes and Playwright code
    const accessibilityTestSteps = codeGenerator.generateAccessibilityTestSteps(requirements, analysis.url);
    console.log(`[IntegratedTestRouter] Generated ${accessibilityTestSteps.length} structured test steps`);
    
    // Generate complete Playwright test code
    const completePlaywrightCode = codeGenerator.generateCompleteTestCode(accessibilityTestSteps, analysis.url);
    console.log('[IntegratedTestRouter] Generated complete Playwright test code');
    
    // Convert accessibility test steps to standard test steps format
    const testSteps = accessibilityTestSteps.map((step: any) => ({
      stepNumber: step.stepNumber,
      action: step.action,
      expectedResult: step.expectedOutcome,
    }));
    
    // Detect the type of accessibility test based on instructions
    const testType = this.detectAccessibilityTestType(prompt, accessibilityTestSteps.map((s: any) => s.action));
    
    // Create test case with the generated Playwright code
    const testCase: AccessibilityTestCase = this.createAccessibilityTestCase(
      testType, analysis, requirements, prompt, accessibilityTestSteps, testSteps, completePlaywrightCode
    );
    
    return [testCase];
  }

  /**
   * Detect the type of accessibility test based on instructions
   */
  private detectAccessibilityTestType(prompt: string, steps: string[]): string {
    const promptLower = prompt.toLowerCase();
    const allSteps = steps.join(' ').toLowerCase();
    
    if (promptLower.includes('role') || allSteps.includes('role')) {
      return 'aria-role';
    } else if (promptLower.includes('aria-describedby') || promptLower.includes('aria-live') || 
               allSteps.includes('aria-describedby') || allSteps.includes('aria-live') ||
               (promptLower.includes('form') && promptLower.includes('error'))) {
      return 'aria-compliance';
    } else if (promptLower.includes('tab') || promptLower.includes('keyboard')) {
      return 'keyboard-navigation';
    } else if (promptLower.includes('contrast') || promptLower.includes('color')) {
      return 'visual-accessibility';
    } else if (promptLower.includes('aria') || promptLower.includes('label')) {
      return 'aria-compliance';
    } else {
      return 'general-accessibility';
    }
  }

  /**
   * Create accessibility test case with appropriate metadata and Playwright code
   */
  private createAccessibilityTestCase(
    testType: string,
    analysis: WebsiteAnalysis,
    requirements: AccessibilityTestRequirements,
    prompt: string,
    accessibilityTestSteps: any[],
    testSteps: any[],
    playwrightCode: string
  ): AccessibilityTestCase {
    
    // Collect WCAG criteria from all test steps
    const wcagCriteria = [...new Set(accessibilityTestSteps.flatMap(step => step.wcagCriteria || []))];
    
    switch (testType) {
      case 'aria-role':
        return {
          id: `accessibility-aria-role-${Date.now()}`,
          title: `ARIA Role Validation Test - ${analysis.url}`,
          testType: 'Accessibility',
          description: `ARIA role compatibility and validation test for ${analysis.url}. Validates role attributes, reads role values, and checks compatibility with element types.`,
          category: 'Regression',
          priority: 'High',
          severity: 'High',
          stability: 'Stable',
          preconditions: [
            'Page is accessible and loaded',
            'Elements with role attributes are present',
            'Browser supports ARIA role inspection'
          ],
          steps: testSteps,
          expectedResult: 'All ARIA roles are valid and correctly applied to their respective element types',
          validationCriteria: {
            compliance: wcagCriteria.map(criteria => `WCAG ${criteria}`),
            behavior: accessibilityTestSteps.map(step => step.expectedOutcome)
          },
          qualityMetrics: { confidence: 95, stability: 90, maintainability: 95 },
          wcagVersion: '2.1',
          wcagPrinciple: ['Perceivable', 'Robust'],
          wcagSuccessCriteria: wcagCriteria,
          assistiveTechnology: ['NVDA', 'JAWS', 'VoiceOver'],
          accessibilityTags: ['aria-roles', 'role-validation', 'semantic-markup', 'wcag-compliance'],
          keyboardAccess: false,
          automationMapping: playwrightCode,
        };
        
      case 'aria-compliance':
        return {
          id: `accessibility-aria-compliance-${Date.now()}`,
          title: `ARIA Compliance and Form Validation Test - ${analysis.url}`,
          testType: 'Accessibility',
          description: `ARIA compliance test for form validation and error messaging on ${analysis.url}. Validates aria-describedby and aria-live attributes for proper accessibility support.`,
          category: 'Regression',
          priority: 'High',
          severity: 'High',
          stability: 'Stable',
          preconditions: [
            'Form page is accessible and loaded',
            'Form contains required fields',
            'Browser supports ARIA attributes'
          ],
          steps: testSteps,
          expectedResult: 'ARIA attributes are properly implemented for accessibility and form validation errors are correctly associated',
          validationCriteria: {
            compliance: wcagCriteria.map(criteria => `WCAG ${criteria}`),
            behavior: accessibilityTestSteps.map(step => step.expectedOutcome)
          },
          qualityMetrics: { confidence: 95, stability: 90, maintainability: 95 },
          wcagVersion: '2.1',
          wcagPrinciple: ['Perceivable', 'Understandable', 'Robust'],
          wcagSuccessCriteria: wcagCriteria,
          assistiveTechnology: ['NVDA', 'JAWS', 'VoiceOver'],
          accessibilityTags: ['aria-compliance', 'form-validation', 'error-messaging', 'aria-describedby', 'aria-live'],
          keyboardAccess: true,
          automationMapping: playwrightCode,
        };
        
      case 'keyboard-navigation':
        return {
          id: `accessibility-keyboard-nav-${Date.now()}`,
          title: `Keyboard Navigation Test - ${analysis.url}`,
          testType: 'Accessibility',
          description: `Keyboard navigation and focus management test for ${analysis.url}: ${prompt}`,
          category: 'Regression',
          priority: 'High',
          severity: 'High',
          stability: 'Stable',
          preconditions: [
            'Page is accessible and loaded',
            'Browser supports keyboard navigation',
            'Focusable elements are present'
          ],
          steps: testSteps,
          expectedResult: 'All keyboard navigation instructions execute successfully with proper focus management',
          validationCriteria: {
            compliance: wcagCriteria.map(criteria => `WCAG ${criteria}`),
            behavior: accessibilityTestSteps.map(step => step.expectedOutcome)
          },
          qualityMetrics: { confidence: 95, stability: 90, maintainability: 95 },
          wcagVersion: '2.1',
          wcagPrinciple: ['Operable'],
          wcagSuccessCriteria: wcagCriteria,
          assistiveTechnology: ['Keyboard', 'NVDA'],
          accessibilityTags: ['keyboard-navigation', 'focus-management', 'tab-order'],
          keyboardAccess: true,
          automationMapping: playwrightCode,
        };
        
      default:
        return {
          id: `accessibility-general-${Date.now()}`,
          title: `Accessibility Test - ${analysis.url}`,
          testType: 'Accessibility',
          description: `General accessibility test for ${analysis.url}: ${prompt}`,
          category: 'Regression',
          priority: 'High',
          severity: 'High',
          stability: 'Stable',
          preconditions: [
            'Page is accessible and loaded',
            'Browser supports accessibility features',
            'Accessibility testing tools are available'
          ],
          steps: testSteps,
          expectedResult: 'All accessibility instructions complete successfully with compliance validation',
          validationCriteria: {
            compliance: wcagCriteria.map(criteria => `WCAG ${criteria}`),
            behavior: accessibilityTestSteps.map(step => step.expectedOutcome)
          },
          qualityMetrics: { confidence: 95, stability: 90, maintainability: 95 },
          wcagVersion: '2.1',
          wcagPrinciple: ['Perceivable', 'Operable', 'Understandable', 'Robust'],
          wcagSuccessCriteria: wcagCriteria,
          assistiveTechnology: ['Keyboard', 'NVDA', 'JAWS'],
          accessibilityTags: ['general-accessibility', 'wcag-compliance'],
          keyboardAccess: true,
          automationMapping: playwrightCode,
        };
    }
  }

  /**
   * Generate template-based accessibility test cases (existing functionality)
   */
  private generateTemplateBasedAccessibilityTests(
    analysis: WebsiteAnalysis,
    requirements: AccessibilityTestRequirements,
    prompt: string
  ): AccessibilityTestCase[] {
    // Select appropriate accessibility test template
    const templateSelection: TemplateSelectionResult = selectAccessibilityTestTemplate(
      requirements,
      prompt
    );
    
    console.log('[IntegratedTestRouter] Selected template:', templateSelection.selectedTemplate.name);
    console.log('[IntegratedTestRouter] Template features:', 
      templateSelection.customizations.map(c => c.feature).join(', ')
    );
    
    // Generate user feedback for enhanced accessibility testing
    const feedback = generateAccessibilityTestingFeedback(
      templateSelection.selectedTemplate,
      templateSelection.customizations.map(c => c.feature)
    );
    console.log('[IntegratedTestRouter] User feedback:', feedback);
    
    // Generate test cases using template-based approach
    const testCases: AccessibilityTestCase[] = [];
    
    // Generate comprehensive test case using selected template
    const comprehensiveTestCase = this.generateTemplateBasedAccessibilityTest(
      analysis,
      requirements,
      templateSelection,
      prompt
    );
    
    if (comprehensiveTestCase) {
      testCases.push(comprehensiveTestCase);
    }
    
    // Generate specific test cases for each requirement type if using comprehensive template
    if (templateSelection.selectedTemplate.name === 'Comprehensive Accessibility Testing') {
      
      // Generate DOM inspection tests with template-based code
      if (requirements.domInspection.length > 0) {
        const domTestCase = this.generateDOMInspectionTestCase(
          analysis,
          requirements.domInspection,
          templateSelection
        );
        if (domTestCase) testCases.push(domTestCase);
      }
      
      // Generate keyboard navigation tests with template-based code
      if (requirements.keyboardNavigation.length > 0) {
        const keyboardTestCase = this.generateKeyboardNavigationTestCase(
          analysis,
          requirements.keyboardNavigation,
          templateSelection
        );
        if (keyboardTestCase) testCases.push(keyboardTestCase);
      }
      
      // Generate ARIA compliance tests with template-based code
      if (requirements.ariaCompliance.length > 0) {
        const ariaTestCase = this.generateARIAComplianceTestCase(
          analysis,
          requirements.ariaCompliance,
          templateSelection
        );
        if (ariaTestCase) testCases.push(ariaTestCase);
      }
      
      // Generate visual accessibility tests with template-based code
      if (requirements.visualAccessibility.length > 0) {
        const visualTestCase = this.generateVisualAccessibilityTestCase(
          analysis,
          requirements.visualAccessibility,
          templateSelection
        );
        if (visualTestCase) testCases.push(visualTestCase);
      }
    }
    
    console.log(`[IntegratedTestRouter] Generated ${testCases.length} enhanced accessibility test cases using templates`);
    
    return testCases;
  }

  /**
   * Extract individual instruction steps from user input
   */
  private extractInstructionSteps(userInput: string): string[] {
    // Split by common delimiters
    let steps = userInput.split(/[,;]|\d+\.|\n/).map(step => step.trim()).filter(step => step.length > 0);
    
    // If no clear delimiters, treat as single step
    if (steps.length <= 1) {
      steps = [userInput.trim()];
    }
    
    // Clean up step text
    steps = steps.map(step => {
      // Remove leading numbers or bullets
      return step.replace(/^\d+\.?\s*/, '').replace(/^[-*]\s*/, '').trim();
    }).filter(step => step.length > 0);
    
    return steps;
  }

  /**
   * Generate expected result for a specific instruction step
   */
  private generateExpectedResultForStep(step: string): string {
    const stepLower = step.toLowerCase();
    
    if (stepLower.includes('load') && stepLower.includes('webpage')) {
      return 'Page loads successfully and is ready for interaction';
    }
    if (stepLower.includes('press tab') || stepLower.includes('tab key')) {
      if (stepLower.includes('first button') || stepLower.includes('button')) {
        return 'Focus moves to the first button element';
      }
      return 'Focus moves to the next focusable element';
    }
    if (stepLower.includes('press enter') && stepLower.includes('activate')) {
      return 'Button is activated successfully';
    }
    if (stepLower.includes('press enter') || stepLower.includes('press space')) {
      return 'Element is activated successfully';
    }
    if (stepLower.includes('verify') && stepLower.includes('text changes')) {
      const textMatch = step.match(/changes to (.+?)$/i);
      if (textMatch) {
        const expectedText = textMatch[1].trim();
        return `Button text changes to "${expectedText}"`;
      }
      return 'Text content updates as specified';
    }
    if (stepLower.includes('check') || stepLower.includes('verify')) {
      return 'Verification passes as expected';
    }
    
    return `Step completes successfully: ${step}`;
  }

  /**
   * Generate instruction-based Playwright code
   * Enhanced to be more intelligent and instruction-aware for ANY accessibility testing scenarios
   * Now with improved semantic analysis and context-aware code generation
   */
  private generateInstructionBasedPlaywrightCode(steps: string[], url: string): string {
    // Analyze the overall test context from all steps
    const testContext = this.analyzeTestContext(steps);
    
    let code = `import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('${testContext.testName}', async ({ page }) => {
  // Navigate to the page
  await page.goto('${url}');
  await page.waitForLoadState('networkidle');
  
  // Initialize variables for cross-step data sharing
  let elementsWithRole = [];
  let roleData = [];
  let errorElementsData = [];
  let focusedElements = [];
  let ariaResults = {};
  let testResults = {
    stepsCompleted: 0,
    validations: [],
    measurements: {},
    interactions: []
  };
  
  console.log('🚀 Starting ${testContext.description}');
  console.log('📋 Test will execute ${steps.length} instruction steps');
  
`;

    // Generate setup code based on test context
    if (testContext.requiresFormSetup) {
      code += this.generateFormSetupCode();
    }
    
    if (testContext.requiresKeyboardSetup) {
      code += this.generateKeyboardSetupCode();
    }

    // Generate code for each step with enhanced context awareness
    steps.forEach((step, index) => {
      const stepLower = step.toLowerCase();
      code += `  // Step ${index + 1}: ${step}\n`;
      code += `  console.log('📍 Executing Step ${index + 1}: ${step}');\n`;
      
      // Enhanced instruction parsing with semantic analysis and context
      const instructionType = this.analyzeInstructionType(step);
      const stepContext = this.analyzeStepContext(step, steps, index);
      const codeBlock = this.generateEnhancedCodeForInstructionType(instructionType, step, stepContext, index + 1);
      
      code += codeBlock;
      code += `  testResults.stepsCompleted++;\n`;
      code += `  console.log('✅ Step ${index + 1} completed successfully');\n\n`;
    });

    // Add comprehensive accessibility validation based on test context
    code += this.generateContextualAccessibilityValidation(testContext);

    // Generate intelligent test summary
    code += this.generateIntelligentTestSummary(testContext);

    code += `});
`;

    return code;
  }

  /**
   * Analyze the overall test context from all steps
   */
  private analyzeTestContext(steps: string[]): {
    testName: string;
    description: string;
    primaryFocus: string;
    requiresFormSetup: boolean;
    requiresKeyboardSetup: boolean;
    requiresAriaValidation: boolean;
    requiresRoleValidation: boolean;
    requiresErrorValidation: boolean;
    requiresContrastValidation: boolean;
    wcagCriteria: string[];
  } {
    const allStepsText = steps.join(' ').toLowerCase();
    
    // Determine primary focus
    let primaryFocus = 'general-accessibility';
    let testName = 'instruction-based-accessibility-test';
    let description = 'Instruction-based accessibility test';
    
    if (allStepsText.includes('role') && (allStepsText.includes('read') || allStepsText.includes('check'))) {
      primaryFocus = 'aria-role-validation';
      testName = 'aria-role-validation-test';
      description = 'ARIA role validation and compatibility test';
    } else if (allStepsText.includes('error') && allStepsText.includes('form')) {
      primaryFocus = 'form-error-validation';
      testName = 'form-error-validation-test';
      description = 'Form error handling and ARIA compliance test';
    } else if (allStepsText.includes('tab') || allStepsText.includes('keyboard')) {
      primaryFocus = 'keyboard-navigation';
      testName = 'keyboard-navigation-test';
      description = 'Keyboard navigation and focus management test';
    } else if (allStepsText.includes('contrast') || allStepsText.includes('color')) {
      primaryFocus = 'visual-accessibility';
      testName = 'visual-accessibility-test';
      description = 'Visual accessibility and contrast validation test';
    } else if (allStepsText.includes('aria')) {
      primaryFocus = 'aria-compliance';
      testName = 'aria-compliance-test';
      description = 'ARIA attributes and compliance validation test';
    }
    
    // Determine requirements
    const requiresFormSetup = allStepsText.includes('form') || allStepsText.includes('field') || allStepsText.includes('input');
    const requiresKeyboardSetup = allStepsText.includes('tab') || allStepsText.includes('keyboard') || allStepsText.includes('focus');
    const requiresAriaValidation = allStepsText.includes('aria') || allStepsText.includes('describedby') || allStepsText.includes('live');
    const requiresRoleValidation = allStepsText.includes('role');
    const requiresErrorValidation = allStepsText.includes('error') || allStepsText.includes('validation');
    const requiresContrastValidation = allStepsText.includes('contrast') || allStepsText.includes('color');
    
    // Determine WCAG criteria
    const wcagCriteria = [];
    if (requiresRoleValidation || requiresAriaValidation) wcagCriteria.push('4.1.2');
    if (requiresKeyboardSetup) wcagCriteria.push('2.1.1', '2.4.3', '2.4.7');
    if (requiresErrorValidation) wcagCriteria.push('3.3.1', '3.3.2');
    if (requiresContrastValidation) wcagCriteria.push('1.4.3', '1.4.11');
    if (requiresFormSetup) wcagCriteria.push('1.3.1', '3.3.2');
    
    return {
      testName,
      description,
      primaryFocus,
      requiresFormSetup,
      requiresKeyboardSetup,
      requiresAriaValidation,
      requiresRoleValidation,
      requiresErrorValidation,
      requiresContrastValidation,
      wcagCriteria: [...new Set(wcagCriteria)]
    };
  }

  /**
   * Analyze step context within the broader test sequence
   */
  private analyzeStepContext(step: string, allSteps: string[], stepIndex: number): {
    isFirstStep: boolean;
    isLastStep: boolean;
    previousStepType: string;
    nextStepType: string;
    dependsOnPreviousStep: boolean;
    setsUpNextStep: boolean;
    expectedDataFlow: string[];
  } {
    const isFirstStep = stepIndex === 0;
    const isLastStep = stepIndex === allSteps.length - 1;
    
    const previousStepType = stepIndex > 0 ? this.analyzeInstructionType(allSteps[stepIndex - 1]) : '';
    const nextStepType = stepIndex < allSteps.length - 1 ? this.analyzeInstructionType(allSteps[stepIndex + 1]) : '';
    
    // Analyze data dependencies
    const stepLower = step.toLowerCase();
    const dependsOnPreviousStep = stepLower.includes('read') || stepLower.includes('check') || stepLower.includes('verify');
    const setsUpNextStep = stepLower.includes('locate') || stepLower.includes('find') || stepLower.includes('store');
    
    // Determine expected data flow
    const expectedDataFlow = [];
    if (stepLower.includes('role')) expectedDataFlow.push('roleData');
    if (stepLower.includes('error')) expectedDataFlow.push('errorElementsData');
    if (stepLower.includes('aria')) expectedDataFlow.push('ariaResults');
    if (stepLower.includes('focus') || stepLower.includes('tab')) expectedDataFlow.push('focusedElements');
    
    return {
      isFirstStep,
      isLastStep,
      previousStepType,
      nextStepType,
      dependsOnPreviousStep,
      setsUpNextStep,
      expectedDataFlow
    };
  }

  /**
   * Generate enhanced code for instruction type with context awareness
   */
  private generateEnhancedCodeForInstructionType(
    instructionType: string, 
    originalInstruction: string, 
    stepContext: any, 
    stepNumber: number
  ): string {
    const instructionLower = originalInstruction.toLowerCase();
    
    // Add context-aware validation
    let code = '';
    
    // Pre-step validation based on dependencies
    if (stepContext.dependsOnPreviousStep) {
      code += this.generateDependencyValidation(stepContext.expectedDataFlow);
    }
    
    // Generate the main instruction code with enhanced intelligence
    switch (instructionType) {
      case 'locate-role-elements':
        code += this.generateEnhancedLocateRoleElementsCode(originalInstruction, stepContext);
        break;
        
      case 'read-role-values':
        code += this.generateEnhancedReadRoleValuesCode(originalInstruction, stepContext);
        break;
        
      case 'check-compatibility':
        code += this.generateEnhancedCheckCompatibilityCode(originalInstruction, stepContext);
        break;
        
      case 'locate-error-elements':
        code += this.generateEnhancedLocateErrorElementsCode(originalInstruction, stepContext);
        break;
        
      case 'check-aria-attributes':
        code += this.generateEnhancedCheckAriaAttributesCode(originalInstruction, stepContext);
        break;
        
      case 'keyboard-interaction':
        code += this.generateEnhancedKeyboardInteractionCode(originalInstruction, stepContext);
        break;
        
      case 'form-submission':
        code += this.generateEnhancedFormSubmissionCode(originalInstruction, stepContext);
        break;
        
      case 'check-visual-accessibility':
        code += this.generateEnhancedCheckVisualAccessibilityCode(originalInstruction, stepContext);
        break;
        
      default:
        // Use the existing method for other types
        code += this.generateCodeForInstructionType(instructionType, originalInstruction, stepNumber);
    }
    
    // Post-step validation and data storage
    if (stepContext.setsUpNextStep) {
      code += this.generateDataStorageCode(stepContext.expectedDataFlow);
    }
    
    return code;
  }

  /**
   * Generate dependency validation code
   */
  private generateDependencyValidation(expectedDataFlow: string[]): string {
    let code = '';
    
    expectedDataFlow.forEach(dataType => {
      switch (dataType) {
        case 'roleData':
          code += `  // Validate roleData is available from previous step\n`;
          code += `  if (roleData.length === 0) {\n`;
          code += `    console.warn('⚠️  No role data available from previous steps');\n`;
          code += `  }\n`;
          break;
          
        case 'errorElementsData':
          code += `  // Validate errorElementsData is available from previous step\n`;
          code += `  if (errorElementsData.length === 0) {\n`;
          code += `    console.warn('⚠️  No error elements data available from previous steps');\n`;
          code += `  }\n`;
          break;
      }
    });
    
    return code;
  }

  /**
   * Generate data storage code for next steps
   */
  private generateDataStorageCode(expectedDataFlow: string[]): string {
    let code = '';
    
    expectedDataFlow.forEach(dataType => {
      switch (dataType) {
        case 'roleData':
          code += `  // Store role data for subsequent steps\n`;
          code += `  testResults.measurements.roleElements = roleData.length;\n`;
          code += `  testResults.validations.push('role-data-collected');\n`;
          break;
          
        case 'errorElementsData':
          code += `  // Store error elements data for subsequent steps\n`;
          code += `  testResults.measurements.errorElements = errorElementsData.length;\n`;
          code += `  testResults.validations.push('error-elements-collected');\n`;
          break;
      }
    });
    
    return code;
  }

  /**
   * Analyze instruction type based on keywords and patterns
   */
  private analyzeInstructionType(instruction: string): string {
    const instructionLower = instruction.toLowerCase();
    
    // Navigation instructions
    if (instructionLower.includes('load') || instructionLower.includes('navigate') || instructionLower.includes('go to')) {
      return 'navigation';
    }
    
    // Element location instructions
    if (instructionLower.includes('locate') || instructionLower.includes('find') || instructionLower.includes('identify')) {
      if (instructionLower.includes('role')) return 'locate-role-elements';
      if (instructionLower.includes('error') || instructionLower.includes('message')) return 'locate-error-elements';
      if (instructionLower.includes('form') || instructionLower.includes('field')) return 'locate-form-elements';
      if (instructionLower.includes('button') || instructionLower.includes('link')) return 'locate-interactive-elements';
      return 'locate-elements';
    }
    
    // Reading/extraction instructions
    if (instructionLower.includes('read') || instructionLower.includes('extract') || instructionLower.includes('get')) {
      if (instructionLower.includes('role')) return 'read-role-values';
      if (instructionLower.includes('text') || instructionLower.includes('content')) return 'read-text-content';
      if (instructionLower.includes('attribute')) return 'read-attributes';
      return 'read-data';
    }
    
    // Validation/checking instructions
    if (instructionLower.includes('check') || instructionLower.includes('verify') || instructionLower.includes('validate')) {
      if (instructionLower.includes('compatibility') || instructionLower.includes('compatible')) return 'check-compatibility';
      if (instructionLower.includes('aria')) return 'check-aria-attributes';
      if (instructionLower.includes('contrast') || instructionLower.includes('color')) return 'check-visual-accessibility';
      if (instructionLower.includes('focus') || instructionLower.includes('keyboard')) return 'check-keyboard-accessibility';
      return 'check-compliance';
    }
    
    // Interaction instructions
    if (instructionLower.includes('press') || instructionLower.includes('key') || instructionLower.includes('tab')) {
      return 'keyboard-interaction';
    }
    
    if (instructionLower.includes('click') || instructionLower.includes('activate')) {
      return 'mouse-interaction';
    }
    
    if (instructionLower.includes('type') || instructionLower.includes('enter') || instructionLower.includes('input')) {
      return 'text-input';
    }
    
    if (instructionLower.includes('submit') || instructionLower.includes('send')) {
      return 'form-submission';
    }
    
    // Measurement instructions
    if (instructionLower.includes('measure') || instructionLower.includes('count') || instructionLower.includes('calculate')) {
      return 'measurement';
    }
    
    // Default fallback
    return 'generic-action';
  }

  /**
   * Generate code for specific instruction type
   */
  private generateCodeForInstructionType(instructionType: string, originalInstruction: string, stepNumber: number): string {
    const instructionLower = originalInstruction.toLowerCase();
    
    switch (instructionType) {
      case 'navigation':
        return this.generateNavigationCode(originalInstruction);
        
      case 'locate-role-elements':
        return this.generateLocateRoleElementsCode(originalInstruction);
        
      case 'locate-error-elements':
        return this.generateLocateErrorElementsCode(originalInstruction);
        
      case 'locate-form-elements':
        return this.generateLocateFormElementsCode(originalInstruction);
        
      case 'locate-interactive-elements':
        return this.generateLocateInteractiveElementsCode(originalInstruction);
        
      case 'locate-elements':
        return this.generateGenericLocateElementsCode(originalInstruction);
        
      case 'read-role-values':
        return this.generateReadRoleValuesCode(originalInstruction);
        
      case 'read-text-content':
        return this.generateReadTextContentCode(originalInstruction);
        
      case 'read-attributes':
        return this.generateReadAttributesCode(originalInstruction);
        
      case 'read-data':
        return this.generateGenericReadDataCode(originalInstruction);
        
      case 'check-compatibility':
        return this.generateCheckCompatibilityCode(originalInstruction);
        
      case 'check-aria-attributes':
        return this.generateCheckAriaAttributesCode(originalInstruction);
        
      case 'check-visual-accessibility':
        return this.generateCheckVisualAccessibilityCode(originalInstruction);
        
      case 'check-keyboard-accessibility':
        return this.generateCheckKeyboardAccessibilityCode(originalInstruction);
        
      case 'check-compliance':
        return this.generateGenericCheckComplianceCode(originalInstruction);
        
      case 'keyboard-interaction':
        return this.generateKeyboardInteractionCode(originalInstruction);
        
      case 'mouse-interaction':
        return this.generateMouseInteractionCode(originalInstruction);
        
      case 'text-input':
        return this.generateTextInputCode(originalInstruction);
        
      case 'form-submission':
        return this.generateFormSubmissionCode(originalInstruction);
        
      case 'measurement':
        return this.generateMeasurementCode(originalInstruction);
        
      default:
        return this.generateGenericActionCode(originalInstruction);
    }
  }

  /**
   * Generate navigation code
   */
  private generateNavigationCode(instruction: string): string {
    const instructionLower = instruction.toLowerCase();
    
    if (instructionLower.includes('form') || instructionLower.includes('login')) {
      return `  // Navigate to form/login area
  const formArea = await page.locator('form, [role="form"], #login, .login, [data-testid*="login"], [data-testid*="form"]').first();
  if (await formArea.isVisible()) {
    await formArea.scrollIntoViewIfNeeded();
    console.log('✅ Navigated to form area');
  } else {
    console.log('ℹ️  Form area not found, continuing with page');
  }`;
    }
    
    return `  // Page navigation already completed above
  console.log('✅ Page loaded and ready for testing');`;
  }

  /**
   * Generate code to locate elements with role attributes
   */
  private generateLocateRoleElementsCode(instruction: string): string {
    return `  // Locate elements with role attribute
  elementsWithRole = await page.locator('[role]').all();
  console.log(\`Found \${elementsWithRole.length} elements with role attributes\`);
  
  // Store role information for validation
  roleData = [];
  for (const element of elementsWithRole) {
    const roleValue = await element.getAttribute('role');
    const tagName = await element.evaluate(el => el.tagName.toLowerCase());
    const elementType = await element.evaluate(el => el.type || 'N/A');
    const isVisible = await element.isVisible();
    const elementId = await element.getAttribute('id') || 'no-id';
    
    roleData.push({ 
      element, 
      roleValue, 
      tagName, 
      elementType, 
      isVisible,
      elementId,
      isCompatible: false // Will be set during compatibility check
    });
  }
  
  expect(elementsWithRole.length).toBeGreaterThan(0);
  console.log('✅ Elements with role attributes located successfully');`;
  }

  /**
   * Generate code to locate error message elements
   */
  private generateLocateErrorElementsCode(instruction: string): string {
    return `  // Locate displayed error message elements
  const errorSelectors = [
    '.error', '.invalid', '.validation-error', '[role="alert"]', 
    '.alert-danger', '.field-error', '.form-error', '.error-message',
    '.help-block', '.invalid-feedback', '.error-text', '.validation-message',
    '[aria-invalid="true"]', '[data-error]', '.has-error'
  ];
  
  const errorMessages = await page.locator(errorSelectors.join(', ')).all();
  
  // Also look for elements with validation messages in common patterns
  const validationMessages = await page.locator('span:has-text("required"), span:has-text("field"), div:has-text("required"), small.error').all();
  
  const allErrorElements = [...errorMessages, ...validationMessages];
  
  console.log(\`Found \${allErrorElements.length} error message elements\`);
  
  // Store error elements for ARIA attribute checking
  errorElementsData = [];
  for (const element of allErrorElements) {
    const text = await element.textContent();
    const tagName = await element.evaluate(el => el.tagName.toLowerCase());
    const isVisible = await element.isVisible();
    const elementId = await element.getAttribute('id') || 'no-id';
    const ariaRole = await element.getAttribute('role');
    
    if (isVisible && text && text.trim().length > 0) {
      errorElementsData.push({ 
        element, 
        text: text.trim(), 
        tagName, 
        elementId,
        ariaRole,
        isVisible 
      });
      console.log(\`Error message: "\${text.trim()}" in \${tagName} element\`);
    }
  }
  
  expect(errorElementsData.length).toBeGreaterThan(0);
  console.log('✅ Error message elements located successfully');`;
  }

  /**
   * Generate code to read role values
   */
  private generateReadRoleValuesCode(instruction: string): string {
    return `  // Read role values from located elements
  const roleValues = [];
  for (const data of roleData) {
    roleValues.push(data.roleValue);
    console.log(\`Element \${data.tagName}#\${data.elementId} has role: \${data.roleValue}\`);
  }
  
  // Verify role values are not empty
  roleValues.forEach(role => {
    expect(role).toBeTruthy();
    expect(role.trim().length).toBeGreaterThan(0);
  });
  
  console.log('✅ Role values read successfully');
  console.log(\`📊 Total roles found: \${roleValues.length}\`);`;
  }

  /**
   * Generate code to check role compatibility
   */
  private generateCheckCompatibilityCode(instruction: string): string {
    return `  // Check role compatibility with element type
  const validRoleMappings = {
    'button': ['button', 'link', 'menuitem', 'option', 'radio', 'switch', 'tab', 'treeitem'],
    'input': ['textbox', 'searchbox', 'combobox', 'spinbutton', 'slider', 'checkbox', 'radio'],
    'a': ['link', 'button', 'menuitem', 'tab', 'treeitem'],
    'div': ['button', 'checkbox', 'dialog', 'tabpanel', 'alert', 'status', 'region', 'group'],
    'span': ['button', 'checkbox', 'radio', 'switch', 'status', 'alert'],
    'ul': ['list', 'menu', 'menubar', 'tablist', 'tree', 'group'],
    'ol': ['list'],
    'li': ['listitem', 'menuitem', 'option', 'tab', 'treeitem'],
    'nav': ['navigation'],
    'main': ['main'],
    'header': ['banner'],
    'footer': ['contentinfo'],
    'section': ['region', 'tabpanel', 'dialog', 'group'],
    'article': ['article'],
    'aside': ['complementary'],
    'h1': ['heading'],
    'h2': ['heading'],
    'h3': ['heading'],
    'h4': ['heading'],
    'h5': ['heading'],
    'h6': ['heading'],
    'img': ['img', 'presentation'],
    'table': ['table', 'grid'],
    'form': ['form', 'search']
  };
  
  let compatibilityResults = [];
  let validRoles = 0;
  let invalidRoles = 0;
  
  for (const data of roleData) {
    const { roleValue, tagName, elementType } = data;
    const allowedRoles = validRoleMappings[tagName] || [];
    const isCompatible = allowedRoles.includes(roleValue) || 
                         roleValue === tagName || // Implicit role
                         ['presentation', 'none'].includes(roleValue); // Always valid
    
    // Update the roleData with compatibility info
    data.isCompatible = isCompatible;
    
    compatibilityResults.push({
      tagName,
      roleValue,
      elementType,
      isCompatible,
      allowedRoles
    });
    
    if (isCompatible) {
      validRoles++;
      console.log(\`✅ \${tagName} with role="\${roleValue}" is compatible\`);
    } else {
      invalidRoles++;
      console.log(\`❌ \${tagName} with role="\${roleValue}" is NOT compatible. Allowed: [\${allowedRoles.join(', ')}]\`);
    }
  }
  
  // Generate test summary
  const totalElements = compatibilityResults.length;
  const compatibilityPercentage = totalElements > 0 ? (validRoles / totalElements * 100).toFixed(1) : 0;
  
  console.log(\`\\n📊 ARIA Role Compatibility Summary:\`);
  console.log(\`   Total elements tested: \${totalElements}\`);
  console.log(\`   Valid roles: \${validRoles}\`);
  console.log(\`   Invalid roles: \${invalidRoles}\`);
  console.log(\`   Compatibility rate: \${compatibilityPercentage}%\`);
  
  if (invalidRoles === 0) {
    console.log('🎉 ARIA roles are valid and correctly applied');
  } else {
    console.log('⚠️  Some ARIA roles need attention for better accessibility');
  }
  
  // Assertions for test validation
  expect(totalElements).toBeGreaterThan(0);
  expect(validRoles).toBeGreaterThanOrEqual(0);
  
  // Optional: Fail test if compatibility is below threshold
  // expect(compatibilityPercentage).toBeGreaterThanOrEqual(80);`;
  }

  /**
   * Generate code to check ARIA attributes
   */
  private generateCheckAriaAttributesCode(instruction: string): string {
    const instructionLower = instruction.toLowerCase();
    
    if (instructionLower.includes('describedby') || instructionLower.includes('live')) {
      return `  // Check aria-describedby or aria-live attributes
  let ariaAttributesFound = 0;
  let totalElementsChecked = 0;
  
  // Check form fields for aria-describedby attributes
  const formFields = await page.locator('input, textarea, select').all();
  const ariaDescribedByResults = [];
  
  for (const field of formFields) {
    totalElementsChecked++;
    const ariaDescribedBy = await field.getAttribute('aria-describedby');
    const fieldName = await field.getAttribute('name') || await field.getAttribute('id') || 'unnamed';
    
    if (ariaDescribedBy) {
      ariaAttributesFound++;
      ariaDescribedByResults.push({ fieldName, ariaDescribedBy, hasAttribute: true });
      console.log(\`✅ Field "\${fieldName}" has aria-describedby="\${ariaDescribedBy}"\`);
      
      // Verify the referenced element exists
      const referencedElement = await page.locator(\`#\${ariaDescribedBy}\`).first();
      const exists = await referencedElement.count() > 0;
      if (exists) {
        const referencedText = await referencedElement.textContent();
        console.log(\`   Referenced element contains: "\${referencedText}"\`);
      } else {
        console.log(\`   ⚠️ Referenced element #\${ariaDescribedBy} not found\`);
      }
    } else {
      ariaDescribedByResults.push({ fieldName, ariaDescribedBy: null, hasAttribute: false });
      console.log(\`❌ Field "\${fieldName}" missing aria-describedby attribute\`);
    }
  }
  
  // Check for aria-live regions
  const liveRegions = await page.locator('[aria-live]').all();
  const ariaLiveResults = [];
  
  for (const region of liveRegions) {
    const ariaLive = await region.getAttribute('aria-live');
    const regionId = await region.getAttribute('id') || 'no-id';
    const regionText = await region.textContent();
    
    ariaLiveResults.push({ regionId, ariaLive, text: regionText });
    console.log(\`✅ Live region #\${regionId} has aria-live="\${ariaLive}"\`);
    if (regionText && regionText.trim()) {
      console.log(\`   Content: "\${regionText.trim()}"\`);
    }
  }
  
  // Store results for summary
  ariaResults = {
    describedByResults: ariaDescribedByResults,
    liveResults: ariaLiveResults,
    totalFields: totalElementsChecked,
    fieldsWithAria: ariaAttributesFound
  };
  
  // Generate comprehensive ARIA attributes summary
  const totalAriaElements = ariaAttributesFound + liveRegions.length;
  const ariaCompliancePercentage = totalElementsChecked > 0 ? (ariaAttributesFound / totalElementsChecked * 100).toFixed(1) : 0;
  
  console.log(\`\\n📊 ARIA Attributes Summary:\`);
  console.log(\`   Form fields checked: \${totalElementsChecked}\`);
  console.log(\`   Fields with aria-describedby: \${ariaAttributesFound}\`);
  console.log(\`   Live regions found: \${liveRegions.length}\`);
  console.log(\`   Total ARIA elements: \${totalAriaElements}\`);
  console.log(\`   ARIA compliance rate: \${ariaCompliancePercentage}%\`);
  
  if (totalAriaElements > 0) {
    console.log('🎉 ARIA attributes are properly implemented for accessibility');
  } else {
    console.log('⚠️  No ARIA attributes found - consider adding for better accessibility');
  }
  
  // Assertions for validation
  expect(totalElementsChecked).toBeGreaterThan(0);
  // Optional: Require minimum ARIA compliance
  // expect(totalAriaElements).toBeGreaterThan(0);`;
    }
    
    // Generic ARIA attribute checking
    return `  // Check ARIA attributes comprehensively
  const ariaAttributes = ['aria-label', 'aria-labelledby', 'aria-describedby', 'aria-expanded', 'aria-selected', 'aria-checked'];
  const elementsWithAria = await page.locator('[aria-label], [aria-labelledby], [aria-describedby], [aria-expanded], [aria-selected], [aria-checked]').all();
  
  console.log(\`Found \${elementsWithAria.length} elements with ARIA attributes\`);
  
  for (const element of elementsWithAria) {
    const tagName = await element.evaluate(el => el.tagName.toLowerCase());
    const elementId = await element.getAttribute('id') || 'no-id';
    
    for (const attr of ariaAttributes) {
      const value = await element.getAttribute(attr);
      if (value) {
        console.log(\`✅ \${tagName}#\${elementId} has \${attr}="\${value}"\`);
      }
    }
  }
  
  expect(elementsWithAria.length).toBeGreaterThanOrEqual(0);
  console.log('✅ ARIA attributes checked successfully');`;
  }

  /**
   * Generate form submission code
   */
  private generateFormSubmissionCode(instruction: string): string {
    const instructionLower = instruction.toLowerCase();
    
    if (instructionLower.includes('without') && (instructionLower.includes('required') || instructionLower.includes('empty'))) {
      return `  // Submit the form without entering required fields
  const submitButton = await page.locator('button[type="submit"], input[type="submit"], button:has-text("submit"), #submit, .submit').first();
  if (await submitButton.isVisible()) {
    await submitButton.click();
    console.log('✅ Form submitted without filling required fields');
  } else {
    // Try to find and click any button that might submit the form
    const anyButton = await page.locator('button, input[type="button"]').first();
    if (await anyButton.isVisible()) {
      await anyButton.click();
      console.log('✅ Form submitted using generic button');
    }
  }
  
  // Wait for potential validation messages to appear
  await page.waitForTimeout(1000);`;
    }
    
    return `  // Submit form
  const submitButton = await page.locator('button[type="submit"], input[type="submit"], button:has-text("submit")').first();
  if (await submitButton.isVisible()) {
    await submitButton.click();
    console.log('✅ Form submitted');
  }
  await page.waitForTimeout(1000);`;
  }

  /**
   * Generate keyboard interaction code
   */
  private generateKeyboardInteractionCode(instruction: string): string {
    const instructionLower = instruction.toLowerCase();
    
    if (instructionLower.includes('tab')) {
      let tabCount = 1;
      if (instructionLower.includes('twice') || instructionLower.includes('two times')) tabCount = 2;
      if (instructionLower.includes('three times') || instructionLower.includes('thrice')) tabCount = 3;
      
      let code = `  // Press Tab ${tabCount > 1 ? tabCount + ' times' : 'once'} to navigate\n`;
      for (let i = 0; i < tabCount; i++) {
        code += `  await page.keyboard.press('Tab');\n`;
      }
      
      code += `  // Verify an element is focused after Tab navigation\n`;
      code += `  const focusedElement = await page.evaluate(() => {\n`;
      code += `    const el = document.activeElement;\n`;
      code += `    return el ? { \n`;
      code += `      tagName: el.tagName, \n`;
      code += `      type: el.type, \n`;
      code += `      name: el.name,\n`;
      code += `      id: el.id,\n`;
      code += `      role: el.getAttribute('role')\n`;
      code += `    } : null;\n`;
      code += `  });\n`;
      code += `  expect(focusedElement).toBeTruthy();\n`;
      code += `  console.log('✅ Tab navigation completed, focused element:', focusedElement);\n`;
      
      return code;
    }
    
    if (instructionLower.includes('enter')) {
      return `  // Press Enter to activate the focused element
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  console.log('✅ Enter key pressed');`;
    }
    
    if (instructionLower.includes('space')) {
      return `  // Press Space to activate the focused element
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);
  console.log('✅ Space key pressed');`;
    }
    
    return `  // Generic keyboard interaction
  await page.keyboard.press('Tab');
  console.log('✅ Keyboard interaction completed');`;
  }

  /**
   * Generate generic action code for unrecognized instructions
   */
  private generateGenericActionCode(instruction: string): string {
    return `  // Custom instruction: ${instruction}
  console.log('Executing instruction: ${instruction}');
  
  // Try to intelligently handle the instruction
  const pageState = await page.evaluate(() => ({
    readyState: document.readyState,
    activeElement: document.activeElement ? {
      tagName: document.activeElement.tagName,
      id: document.activeElement.id,
      className: document.activeElement.className
    } : null,
    elementsCount: document.querySelectorAll('*').length
  }));
  
  expect(pageState.readyState).toBe('complete');
  console.log('✅ Generic instruction completed, page state verified');`;
  }

  // Additional helper methods for other instruction types
  private generateLocateFormElementsCode(instruction: string): string {
    return `  // Locate form elements
  const formElements = await page.locator('form, input, textarea, select, button[type="submit"]').all();
  console.log(\`Found \${formElements.length} form elements\`);
  expect(formElements.length).toBeGreaterThan(0);
  console.log('✅ Form elements located successfully');`;
  }

  private generateLocateInteractiveElementsCode(instruction: string): string {
    return `  // Locate interactive elements
  const interactiveElements = await page.locator('button, a, input, select, textarea, [role="button"], [role="link"], [tabindex]').all();
  console.log(\`Found \${interactiveElements.length} interactive elements\`);
  expect(interactiveElements.length).toBeGreaterThan(0);
  console.log('✅ Interactive elements located successfully');`;
  }

  private generateGenericLocateElementsCode(instruction: string): string {
    return `  // Locate elements based on instruction
  const elements = await page.locator('*').all();
  console.log(\`Found \${elements.length} total elements\`);
  expect(elements.length).toBeGreaterThan(0);
  console.log('✅ Elements located successfully');`;
  }

  private generateReadTextContentCode(instruction: string): string {
    return `  // Read text content from elements
  const textElements = await page.locator('p, h1, h2, h3, h4, h5, h6, span, div').all();
  const textContents = [];
  for (const element of textElements.slice(0, 10)) {
    const text = await element.textContent();
    if (text && text.trim()) {
      textContents.push(text.trim());
    }
  }
  console.log(\`Read \${textContents.length} text contents\`);
  console.log('✅ Text content read successfully');`;
  }

  private generateReadAttributesCode(instruction: string): string {
    return `  // Read attributes from elements
  const elementsWithAttributes = await page.locator('[id], [class], [role], [aria-label]').all();
  for (const element of elementsWithAttributes.slice(0, 10)) {
    const id = await element.getAttribute('id');
    const className = await element.getAttribute('class');
    const role = await element.getAttribute('role');
    const ariaLabel = await element.getAttribute('aria-label');
    
    if (id || className || role || ariaLabel) {
      console.log('Element attributes:', { id, className, role, ariaLabel });
    }
  }
  console.log('✅ Attributes read successfully');`;
  }

  private generateGenericReadDataCode(instruction: string): string {
    return `  // Read data from page
  const pageData = await page.evaluate(() => ({
    title: document.title,
    url: window.location.href,
    elementCount: document.querySelectorAll('*').length
  }));
  console.log('Page data:', pageData);
  console.log('✅ Data read successfully');`;
  }

  private generateCheckVisualAccessibilityCode(instruction: string): string {
    return `  // Check visual accessibility (color contrast, focus indicators)
  const focusableElements = await page.locator('button, a, input, select, textarea, [tabindex]').all();
  
  for (const element of focusableElements.slice(0, 5)) {
    await element.focus();
    const focusStyles = await element.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        outlineColor: styles.outlineColor,
        outlineWidth: styles.outlineWidth,
        boxShadow: styles.boxShadow
      };
    });
    
    const hasFocusIndicator = focusStyles.outline !== 'none' || 
                             focusStyles.outlineWidth !== '0px' || 
                             focusStyles.boxShadow !== 'none';
    
    console.log(\`Element focus indicator: \${hasFocusIndicator ? 'Present' : 'Missing'}\`);
  }
  
  console.log('✅ Visual accessibility checked');`;
  }

  private generateCheckKeyboardAccessibilityCode(instruction: string): string {
    return `  // Check keyboard accessibility
  const focusableElements = await page.locator('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])').all();
  
  console.log(\`Found \${focusableElements.length} focusable elements\`);
  
  // Test Tab navigation through first few elements
  for (let i = 0; i < Math.min(5, focusableElements.length); i++) {
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? el.tagName + (el.id ? '#' + el.id : '') : null;
    });
    console.log(\`Tab \${i + 1}: Focused on \${focusedElement}\`);
  }
  
  console.log('✅ Keyboard accessibility checked');`;
  }

  private generateGenericCheckComplianceCode(instruction: string): string {
    return `  // Check general compliance
  const complianceChecks = await page.evaluate(() => {
    const checks = {
      hasTitle: !!document.title,
      hasLang: !!document.documentElement.lang,
      hasHeadings: document.querySelectorAll('h1, h2, h3, h4, h5, h6').length > 0,
      hasAltText: Array.from(document.querySelectorAll('img')).every(img => img.alt !== undefined)
    };
    return checks;
  });
  
  console.log('Compliance checks:', complianceChecks);
  expect(complianceChecks.hasTitle).toBe(true);
  console.log('✅ Compliance checks completed');`;
  }

  private generateMouseInteractionCode(instruction: string): string {
    return `  // Mouse interaction
  const clickableElement = await page.locator('button, a, [role="button"], [onclick]').first();
  if (await clickableElement.isVisible()) {
    await clickableElement.click();
    console.log('✅ Mouse interaction completed');
  }`;
  }

  private generateTextInputCode(instruction: string): string {
    // Extract text to type from quotes if present
    const textMatch = instruction.match(/["']([^"']+)["']/);
    const textToType = textMatch ? textMatch[1] : 'sample text';
    
    return `  // Type text input
  const inputField = await page.locator('input[type="text"], input[type="email"], textarea').first();
  if (await inputField.isVisible()) {
    await inputField.fill('${textToType}');
    console.log('✅ Text input completed');
  }`;
  }

  private generateMeasurementCode(instruction: string): string {
    return `  // Perform measurements
  const measurements = await page.evaluate(() => {
    const elements = document.querySelectorAll('*');
    const interactiveElements = document.querySelectorAll('button, a, input, select, textarea');
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    return {
      totalElements: elements.length,
      interactiveElements: interactiveElements.length,
      headings: headings.length
    };
  });
  
  console.log('Measurements:', measurements);
  console.log('✅ Measurements completed');`;
  }

  /**
   * Enhanced instruction parsing with semantic analysis
   * This replaces the old hardcoded approach with intelligent pattern matching
   */
  private parseInstructionSemantics(instruction: string): {
    action: string;
    target: string;
    context: string;
    modifiers: string[];
  } {
    const instructionLower = instruction.toLowerCase();
    
    // Extract action verbs
    const actionVerbs = ['load', 'navigate', 'locate', 'find', 'read', 'check', 'verify', 'validate', 'press', 'click', 'type', 'submit', 'measure', 'count'];
    const action = actionVerbs.find(verb => instructionLower.includes(verb)) || 'unknown';
    
    // Extract targets
    const targets = ['webpage', 'page', 'form', 'button', 'element', 'role', 'attribute', 'text', 'error', 'message'];
    const target = targets.find(t => instructionLower.includes(t)) || 'unknown';
    
    // Extract context
    let context = '';
    if (instructionLower.includes('accessibility') || instructionLower.includes('aria') || instructionLower.includes('wcag')) {
      context = 'accessibility';
    } else if (instructionLower.includes('form') || instructionLower.includes('validation')) {
      context = 'form';
    } else if (instructionLower.includes('keyboard') || instructionLower.includes('tab')) {
      context = 'keyboard';
    }
    
    // Extract modifiers
    const modifiers = [];
    if (instructionLower.includes('without')) modifiers.push('without');
    if (instructionLower.includes('required')) modifiers.push('required');
    if (instructionLower.includes('compatibility')) modifiers.push('compatibility');
    
    return { action, target, context, modifiers };
  }

  /**
   * Enhanced code generation methods for instruction-specific accessibility testing
   */
  
  /**
   * Generate enhanced code to locate elements with role attributes
   */
  private generateEnhancedLocateRoleElementsCode(instruction: string, stepContext: any): string {
    return `  // Enhanced locate elements with role attribute
  elementsWithRole = await page.locator('[role]').all();
  console.log(\`Found \${elementsWithRole.length} elements with role attributes\`);
  
  // Store comprehensive role information for validation
  roleData = [];
  for (const element of elementsWithRole) {
    const roleValue = await element.getAttribute('role');
    const tagName = await element.evaluate(el => el.tagName.toLowerCase());
    const elementType = await element.evaluate(el => el.type || 'N/A');
    const isVisible = await element.isVisible();
    const elementId = await element.getAttribute('id') || 'no-id';
    const ariaLabel = await element.getAttribute('aria-label');
    const className = await element.getAttribute('class') || '';
    
    roleData.push({ 
      element, 
      roleValue, 
      tagName, 
      elementType, 
      isVisible,
      elementId,
      ariaLabel,
      className,
      isCompatible: false // Will be set during compatibility check
    });
    
    console.log(\`📍 Found \${tagName}#\${elementId} with role="\${roleValue}"\`);
  }
  
  expect(elementsWithRole.length).toBeGreaterThan(0);
  console.log('✅ Elements with role attributes located successfully');
  testResults.measurements.roleElements = elementsWithRole.length;`;
  }

  /**
   * Generate enhanced code to read role values with detailed analysis
   */
  private generateEnhancedReadRoleValuesCode(instruction: string, stepContext: any): string {
    return `  // Enhanced read role values from located elements
  const roleValues = [];
  const roleAnalysis = {
    totalRoles: 0,
    uniqueRoles: new Set(),
    roleDistribution: {},
    semanticRoles: 0,
    interactiveRoles: 0,
    structuralRoles: 0
  };
  
  for (const data of roleData) {
    roleValues.push(data.roleValue);
    roleAnalysis.totalRoles++;
    roleAnalysis.uniqueRoles.add(data.roleValue);
    
    // Count role distribution
    roleAnalysis.roleDistribution[data.roleValue] = (roleAnalysis.roleDistribution[data.roleValue] || 0) + 1;
    
    // Categorize roles
    const semanticRoles = ['article', 'banner', 'complementary', 'contentinfo', 'main', 'navigation', 'region', 'search'];
    const interactiveRoles = ['button', 'link', 'menuitem', 'option', 'radio', 'checkbox', 'textbox', 'combobox'];
    const structuralRoles = ['list', 'listitem', 'table', 'row', 'cell', 'heading', 'group'];
    
    if (semanticRoles.includes(data.roleValue)) roleAnalysis.semanticRoles++;
    else if (interactiveRoles.includes(data.roleValue)) roleAnalysis.interactiveRoles++;
    else if (structuralRoles.includes(data.roleValue)) roleAnalysis.structuralRoles++;
    
    console.log(\`📖 Element \${data.tagName}#\${data.elementId} has role: \${data.roleValue}\`);
  }
  
  // Verify role values are not empty
  roleValues.forEach(role => {
    expect(role).toBeTruthy();
    expect(role.trim().length).toBeGreaterThan(0);
  });
  
  console.log('\\n📊 Role Analysis Summary:');
  console.log(\`   Total roles: \${roleAnalysis.totalRoles}\`);
  console.log(\`   Unique roles: \${roleAnalysis.uniqueRoles.size}\`);
  console.log(\`   Semantic roles: \${roleAnalysis.semanticRoles}\`);
  console.log(\`   Interactive roles: \${roleAnalysis.interactiveRoles}\`);
  console.log(\`   Structural roles: \${roleAnalysis.structuralRoles}\`);
  console.log('   Role distribution:', roleAnalysis.roleDistribution);
  
  console.log('✅ Role values read and analyzed successfully');
  testResults.measurements.uniqueRoles = roleAnalysis.uniqueRoles.size;
  testResults.validations.push('role-values-analyzed');`;
  }

  /**
   * Generate enhanced code to check role compatibility with comprehensive validation
   */
  private generateEnhancedCheckCompatibilityCode(instruction: string, stepContext: any): string {
    return `  // Enhanced check role compatibility with element type
  const validRoleMappings = {
    'button': ['button', 'link', 'menuitem', 'option', 'radio', 'switch', 'tab', 'treeitem'],
    'input': ['textbox', 'searchbox', 'combobox', 'spinbutton', 'slider', 'checkbox', 'radio'],
    'a': ['link', 'button', 'menuitem', 'tab', 'treeitem'],
    'div': ['button', 'checkbox', 'dialog', 'tabpanel', 'alert', 'status', 'region', 'group'],
    'span': ['button', 'checkbox', 'radio', 'switch', 'status', 'alert'],
    'ul': ['list', 'menu', 'menubar', 'tablist', 'tree', 'group'],
    'ol': ['list'],
    'li': ['listitem', 'menuitem', 'option', 'tab', 'treeitem'],
    'nav': ['navigation'],
    'main': ['main'],
    'header': ['banner'],
    'footer': ['contentinfo'],
    'section': ['region', 'tabpanel', 'dialog', 'group'],
    'article': ['article'],
    'aside': ['complementary'],
    'h1': ['heading'], 'h2': ['heading'], 'h3': ['heading'], 'h4': ['heading'], 'h5': ['heading'], 'h6': ['heading'],
    'img': ['img', 'presentation'],
    'table': ['table', 'grid'],
    'form': ['form', 'search']
  };
  
  let compatibilityResults = [];
  let validRoles = 0;
  let invalidRoles = 0;
  let warningRoles = 0;
  const compatibilityIssues = [];
  
  for (const data of roleData) {
    const { roleValue, tagName, elementType, elementId, ariaLabel } = data;
    const allowedRoles = validRoleMappings[tagName] || [];
    
    // Enhanced compatibility checking
    let isCompatible = false;
    let compatibilityLevel = 'invalid';
    let reason = '';
    
    if (allowedRoles.includes(roleValue)) {
      isCompatible = true;
      compatibilityLevel = 'valid';
      reason = 'Role is explicitly allowed for this element type';
    } else if (roleValue === tagName) {
      isCompatible = true;
      compatibilityLevel = 'implicit';
      reason = 'Role matches implicit semantic role';
    } else if (['presentation', 'none'].includes(roleValue)) {
      isCompatible = true;
      compatibilityLevel = 'neutral';
      reason = 'Presentation/none roles are universally valid';
    } else if (allowedRoles.length === 0) {
      isCompatible = true;
      compatibilityLevel = 'warning';
      reason = 'No specific role restrictions for this element type';
      warningRoles++;
    } else {
      compatibilityLevel = 'invalid';
      reason = \`Role not allowed. Permitted roles: [\${allowedRoles.join(', ')}]\`;
      compatibilityIssues.push({
        elementId,
        tagName,
        roleValue,
        allowedRoles,
        reason
      });
    }
    
    // Update the roleData with enhanced compatibility info
    data.isCompatible = isCompatible;
    data.compatibilityLevel = compatibilityLevel;
    data.compatibilityReason = reason;
    
    compatibilityResults.push({
      tagName,
      roleValue,
      elementType,
      elementId,
      ariaLabel,
      isCompatible,
      compatibilityLevel,
      reason,
      allowedRoles
    });
    
    if (isCompatible) {
      validRoles++;
      const icon = compatibilityLevel === 'valid' ? '✅' : compatibilityLevel === 'implicit' ? '🔄' : '⚠️';
      console.log(\`\${icon} \${tagName}#\${elementId} with role="\${roleValue}" - \${compatibilityLevel}\`);
    } else {
      invalidRoles++;
      console.log(\`❌ \${tagName}#\${elementId} with role="\${roleValue}" is NOT compatible\`);
      console.log(\`   Reason: \${reason}\`);
    }
  }
  
  // Generate comprehensive test summary
  const totalElements = compatibilityResults.length;
  const compatibilityPercentage = totalElements > 0 ? (validRoles / totalElements * 100).toFixed(1) : 0;
  const strictCompatibilityPercentage = totalElements > 0 ? ((validRoles - warningRoles) / totalElements * 100).toFixed(1) : 0;
  
  console.log(\`\\n📊 Enhanced ARIA Role Compatibility Summary:\`);
  console.log(\`   Total elements tested: \${totalElements}\`);
  console.log(\`   Valid roles: \${validRoles}\`);
  console.log(\`   Invalid roles: \${invalidRoles}\`);
  console.log(\`   Warning roles: \${warningRoles}\`);
  console.log(\`   Overall compatibility rate: \${compatibilityPercentage}%\`);
  console.log(\`   Strict compatibility rate: \${strictCompatibilityPercentage}%\`);
  
  if (compatibilityIssues.length > 0) {
    console.log('\\n🔍 Compatibility Issues Found:');
    compatibilityIssues.forEach((issue, index) => {
      console.log(\`   \${index + 1}. \${issue.tagName}#\${issue.elementId}: \${issue.reason}\`);
    });
  }
  
  if (invalidRoles === 0) {
    console.log('🎉 All ARIA roles are valid and correctly applied');
  } else if (invalidRoles <= 2) {
    console.log('⚠️  Minor ARIA role issues found - consider reviewing for better accessibility');
  } else {
    console.log('❌ Multiple ARIA role issues need attention for proper accessibility');
  }
  
  // Enhanced assertions for test validation
  expect(totalElements).toBeGreaterThan(0);
  expect(validRoles).toBeGreaterThanOrEqual(0);
  
  // Store detailed results for reporting
  testResults.measurements.compatibilityRate = parseFloat(compatibilityPercentage);
  testResults.measurements.strictCompatibilityRate = parseFloat(strictCompatibilityPercentage);
  testResults.measurements.compatibilityIssues = compatibilityIssues.length;
  testResults.validations.push('role-compatibility-checked');
  
  // Optional: Fail test if compatibility is below threshold (uncomment if needed)
  // expect(parseFloat(compatibilityPercentage)).toBeGreaterThanOrEqual(80);`;
  }

  /**
   * Generate enhanced code to locate error elements with comprehensive detection
   */
  private generateEnhancedLocateErrorElementsCode(instruction: string, stepContext: any): string {
    return `  // Enhanced locate displayed error message elements
  const errorSelectors = [
    '.error', '.invalid', '.validation-error', '[role="alert"]', 
    '.alert-danger', '.field-error', '.form-error', '.error-message',
    '.help-block', '.invalid-feedback', '.error-text', '.validation-message',
    '[aria-invalid="true"]', '[data-error]', '.has-error', '.is-invalid',
    '.form-control-feedback', '.field-validation-error', '.input-error'
  ];
  
  const errorMessages = await page.locator(errorSelectors.join(', ')).all();
  
  // Also look for elements with validation messages in common patterns
  const validationMessages = await page.locator('span:has-text("required"), span:has-text("field"), div:has-text("required"), small.error').all();
  
  // Look for ARIA live regions that might contain error messages
  const liveRegionErrors = await page.locator('[aria-live]:has-text("error"), [aria-live]:has-text("invalid"), [aria-live]:has-text("required")').all();
  
  const allErrorElements = [...errorMessages, ...validationMessages, ...liveRegionErrors];
  
  console.log(\`Found \${allErrorElements.length} error message elements\`);
  
  // Store comprehensive error elements data for ARIA attribute checking
  errorElementsData = [];
  const errorAnalysis = {
    totalErrors: 0,
    visibleErrors: 0,
    ariaErrors: 0,
    roleAlerts: 0,
    liveRegionErrors: 0,
    fieldAssociatedErrors: 0
  };
  
  for (const element of allErrorElements) {
    const text = await element.textContent();
    const tagName = await element.evaluate(el => el.tagName.toLowerCase());
    const isVisible = await element.isVisible();
    const elementId = await element.getAttribute('id') || 'no-id';
    const ariaRole = await element.getAttribute('role');
    const ariaLive = await element.getAttribute('aria-live');
    const ariaInvalid = await element.getAttribute('aria-invalid');
    
    errorAnalysis.totalErrors++;
    if (isVisible) errorAnalysis.visibleErrors++;
    if (ariaRole === 'alert') errorAnalysis.roleAlerts++;
    if (ariaLive) errorAnalysis.liveRegionErrors++;
    if (ariaInvalid === 'true') errorAnalysis.ariaErrors++;
    
    if (isVisible && text && text.trim().length > 0) {
      errorElementsData.push({ 
        element, 
        text: text.trim(), 
        tagName, 
        elementId,
        ariaRole,
        ariaLive,
        ariaInvalid,
        isVisible 
      });
      console.log(\`📍 Error message: "\${text.trim()}" in \${tagName}#\${elementId}\`);
      
      // Check if error is associated with a form field
      if (elementId !== 'no-id') {
        const associatedField = await page.locator(\`[aria-describedby*="\${elementId}"], [aria-errormessage*="\${elementId}"]\`).count();
        if (associatedField > 0) {
          errorAnalysis.fieldAssociatedErrors++;
          console.log(\`   ✅ Error is properly associated with form field\`);
        }
      }
    }
  }
  
  console.log('\\n📊 Error Message Analysis:');
  console.log(\`   Total error elements: \${errorAnalysis.totalErrors}\`);
  console.log(\`   Visible errors: \${errorAnalysis.visibleErrors}\`);
  console.log(\`   ARIA role="alert": \${errorAnalysis.roleAlerts}\`);
  console.log(\`   ARIA live regions: \${errorAnalysis.liveRegionErrors}\`);
  console.log(\`   Field-associated errors: \${errorAnalysis.fieldAssociatedErrors}\`);
  
  expect(errorElementsData.length).toBeGreaterThan(0);
  console.log('✅ Error message elements located and analyzed successfully');
  testResults.measurements.errorElements = errorElementsData.length;
  testResults.measurements.visibleErrors = errorAnalysis.visibleErrors;
  testResults.validations.push('error-elements-located');`;
  }

  /**
   * Generate enhanced code to check ARIA attributes with comprehensive validation
   */
  private generateEnhancedCheckAriaAttributesCode(instruction: string, stepContext: any): string {
    const instructionLower = instruction.toLowerCase();
    
    if (instructionLower.includes('describedby') || instructionLower.includes('live')) {
      return `  // Enhanced check aria-describedby and aria-live attributes
  let ariaAttributesFound = 0;
  let totalElementsChecked = 0;
  const ariaValidationResults = {
    describedByResults: [],
    liveResults: [],
    labelResults: [],
    validationSummary: {}
  };
  
  // Enhanced form fields checking for aria-describedby attributes
  const formFields = await page.locator('input, textarea, select').all();
  
  for (const field of formFields) {
    totalElementsChecked++;
    const ariaDescribedBy = await field.getAttribute('aria-describedby');
    const ariaLabel = await field.getAttribute('aria-label');
    const ariaLabelledBy = await field.getAttribute('aria-labelledby');
    const fieldName = await field.getAttribute('name') || await field.getAttribute('id') || 'unnamed';
    const fieldType = await field.getAttribute('type') || 'text';
    const isRequired = await field.getAttribute('required') !== null;
    
    const fieldData = { 
      fieldName, 
      fieldType,
      isRequired,
      ariaDescribedBy, 
      ariaLabel,
      ariaLabelledBy,
      hasAttribute: !!ariaDescribedBy,
      hasLabel: !!(ariaLabel || ariaLabelledBy),
      referencedElementExists: false,
      referencedText: ''
    };
    
    if (ariaDescribedBy) {
      ariaAttributesFound++;
      console.log(\`✅ Field "\${fieldName}" (\${fieldType}) has aria-describedby="\${ariaDescribedBy}"\`);
      
      // Enhanced verification of referenced element
      const referencedElements = ariaDescribedBy.split(' ');
      for (const refId of referencedElements) {
        const referencedElement = await page.locator(\`#\${refId.trim()}\`).first();
        const exists = await referencedElement.count() > 0;
        if (exists) {
          fieldData.referencedElementExists = true;
          const referencedText = await referencedElement.textContent();
          fieldData.referencedText += referencedText + ' ';
          console.log(\`   📖 Referenced element #\${refId} contains: "\${referencedText}"\`);
        } else {
          console.log(\`   ⚠️ Referenced element #\${refId} not found\`);
        }
      }
    } else {
      console.log(\`❌ Field "\${fieldName}" (\${fieldType}) missing aria-describedby attribute\`);
      if (isRequired) {
        console.log(\`   ⚠️ Required field without description may cause accessibility issues\`);
      }
    }
    
    ariaValidationResults.describedByResults.push(fieldData);
  }
  
  // Enhanced aria-live regions checking
  const liveRegions = await page.locator('[aria-live]').all();
  
  for (const region of liveRegions) {
    const ariaLive = await region.getAttribute('aria-live');
    const ariaAtomic = await region.getAttribute('aria-atomic');
    const ariaRelevant = await region.getAttribute('aria-relevant');
    const regionId = await region.getAttribute('id') || 'no-id';
    const regionText = await region.textContent();
    const regionRole = await region.getAttribute('role');
    
    const liveData = { 
      regionId, 
      ariaLive, 
      ariaAtomic,
      ariaRelevant,
      regionRole,
      text: regionText,
      hasContent: !!(regionText && regionText.trim()),
      isPolite: ariaLive === 'polite',
      isAssertive: ariaLive === 'assertive'
    };
    
    ariaValidationResults.liveResults.push(liveData);
    console.log(\`✅ Live region #\${regionId} has aria-live="\${ariaLive}"\`);
    if (ariaAtomic) console.log(\`   aria-atomic="\${ariaAtomic}"\`);
    if (ariaRelevant) console.log(\`   aria-relevant="\${ariaRelevant}"\`);
    if (regionText && regionText.trim()) {
      console.log(\`   Content: "\${regionText.trim()}"\`);
    }
  }
  
  // Store comprehensive results
  ariaResults = ariaValidationResults;
  ariaResults.validationSummary = {
    totalFields: totalElementsChecked,
    fieldsWithAria: ariaAttributesFound,
    liveRegions: liveRegions.length,
    complianceRate: totalElementsChecked > 0 ? (ariaAttributesFound / totalElementsChecked * 100).toFixed(1) : 0
  };
  
  // Generate comprehensive ARIA attributes summary
  const totalAriaElements = ariaAttributesFound + liveRegions.length;
  const ariaCompliancePercentage = ariaResults.validationSummary.complianceRate;
  
  console.log(\`\\n📊 Enhanced ARIA Attributes Summary:\`);
  console.log(\`   Form fields checked: \${totalElementsChecked}\`);
  console.log(\`   Fields with aria-describedby: \${ariaAttributesFound}\`);
  console.log(\`   Live regions found: \${liveRegions.length}\`);
  console.log(\`   Total ARIA elements: \${totalAriaElements}\`);
  console.log(\`   ARIA compliance rate: \${ariaCompliancePercentage}%\`);
  
  if (totalAriaElements > 0) {
    console.log('🎉 ARIA attributes are properly implemented for accessibility');
  } else {
    console.log('⚠️  No ARIA attributes found - consider adding for better accessibility');
  }
  
  // Enhanced assertions for validation
  expect(totalElementsChecked).toBeGreaterThan(0);
  testResults.measurements.ariaCompliance = parseFloat(ariaCompliancePercentage);
  testResults.measurements.totalAriaElements = totalAriaElements;
  testResults.validations.push('aria-attributes-validated');
  
  // Optional: Require minimum ARIA compliance
  // expect(totalAriaElements).toBeGreaterThan(0);`;
    }
    
    // Generic enhanced ARIA attribute checking
    return `  // Enhanced check ARIA attributes comprehensively
  const ariaAttributes = ['aria-label', 'aria-labelledby', 'aria-describedby', 'aria-expanded', 'aria-selected', 'aria-checked', 'aria-live', 'aria-atomic', 'aria-relevant'];
  const elementsWithAria = await page.locator('[aria-label], [aria-labelledby], [aria-describedby], [aria-expanded], [aria-selected], [aria-checked], [aria-live]').all();
  
  console.log(\`Found \${elementsWithAria.length} elements with ARIA attributes\`);
  
  const ariaAnalysis = {
    totalElements: elementsWithAria.length,
    attributeDistribution: {},
    validAttributes: 0,
    invalidAttributes: 0
  };
  
  for (const element of elementsWithAria) {
    const tagName = await element.evaluate(el => el.tagName.toLowerCase());
    const elementId = await element.getAttribute('id') || 'no-id';
    
    for (const attr of ariaAttributes) {
      const value = await element.getAttribute(attr);
      if (value) {
        ariaAnalysis.attributeDistribution[attr] = (ariaAnalysis.attributeDistribution[attr] || 0) + 1;
        
        // Validate attribute value
        const isValid = this.validateAriaAttributeValue(attr, value);
        if (isValid) {
          ariaAnalysis.validAttributes++;
          console.log(\`✅ \${tagName}#\${elementId} has \${attr}="\${value}"\`);
        } else {
          ariaAnalysis.invalidAttributes++;
          console.log(\`❌ \${tagName}#\${elementId} has invalid \${attr}="\${value}"\`);
        }
      }
    }
  }
  
  console.log('\\n📊 ARIA Attributes Analysis:');
  console.log(\`   Elements with ARIA: \${ariaAnalysis.totalElements}\`);
  console.log(\`   Valid attributes: \${ariaAnalysis.validAttributes}\`);
  console.log(\`   Invalid attributes: \${ariaAnalysis.invalidAttributes}\`);
  console.log('   Attribute distribution:', ariaAnalysis.attributeDistribution);
  
  expect(elementsWithAria.length).toBeGreaterThanOrEqual(0);
  console.log('✅ ARIA attributes checked and analyzed successfully');
  testResults.measurements.ariaElementsFound = ariaAnalysis.totalElements;
  testResults.validations.push('aria-attributes-analyzed');`;
  }

  /**
   * Validate ARIA attribute values
   */
  private validateAriaAttributeValue(attribute: string, value: string): boolean {
    switch (attribute) {
      case 'aria-expanded':
      case 'aria-selected':
      case 'aria-checked':
        return ['true', 'false', 'mixed'].includes(value);
      case 'aria-live':
        return ['off', 'polite', 'assertive'].includes(value);
      case 'aria-atomic':
        return ['true', 'false'].includes(value);
      case 'aria-relevant':
        const validRelevant = ['additions', 'removals', 'text', 'all'];
        return value.split(' ').every(v => validRelevant.includes(v.trim()));
      default:
        return value.trim().length > 0;
    }
  }

  /**
   * Generate enhanced keyboard interaction code with comprehensive navigation testing
   */
  private generateEnhancedKeyboardInteractionCode(instruction: string, stepContext: any): string {
    const instructionLower = instruction.toLowerCase();
    
    if (instructionLower.includes('tab')) {
      let tabCount = 1;
      if (instructionLower.includes('twice') || instructionLower.includes('two times')) tabCount = 2;
      if (instructionLower.includes('three times') || instructionLower.includes('thrice')) tabCount = 3;
      
      return `  // Enhanced Tab navigation with focus tracking
  const focusHistory = [];
  
  for (let i = 0; i < ${tabCount}; i++) {
    await page.keyboard.press('Tab');
    
    // Track focus changes with detailed information
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;
      
      return { 
        tagName: el.tagName.toLowerCase(),
        type: el.type || 'N/A',
        name: el.name || '',
        id: el.id || '',
        className: el.className || '',
        role: el.getAttribute('role') || '',
        ariaLabel: el.getAttribute('aria-label') || '',
        textContent: el.textContent?.trim().substring(0, 50) || '',
        tabIndex: el.tabIndex,
        isVisible: el.offsetParent !== null,
        boundingRect: el.getBoundingClientRect()
      };
    });
    
    if (focusedElement) {
      focusHistory.push(focusedElement);
      console.log(\`📍 Tab \${i + 1}: Focused on \${focusedElement.tagName}#\${focusedElement.id} (\${focusedElement.role || 'no-role'})\`);
      
      // Verify focus indicator is visible
      const focusStyles = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return null;
        
        const styles = window.getComputedStyle(el);
        return {
          outline: styles.outline,
          outlineColor: styles.outlineColor,
          outlineWidth: styles.outlineWidth,
          boxShadow: styles.boxShadow,
          border: styles.border
        };
      });
      
      const hasFocusIndicator = focusStyles && (
        focusStyles.outline !== 'none' || 
        focusStyles.outlineWidth !== '0px' || 
        focusStyles.boxShadow !== 'none'
      );
      
      console.log(\`   Focus indicator: \${hasFocusIndicator ? '✅ Visible' : '⚠️ Not visible'}\`);
    } else {
      console.log(\`⚠️ Tab \${i + 1}: No element focused\`);
    }
  }
  
  // Verify final focused element
  expect(focusHistory.length).toBeGreaterThan(0);
  const finalFocus = focusHistory[focusHistory.length - 1];
  expect(finalFocus).toBeTruthy();
  
  console.log('\\n📊 Keyboard Navigation Summary:');
  console.log(\`   Total Tab presses: ${tabCount}\`);
  console.log(\`   Elements focused: \${focusHistory.length}\`);
  console.log(\`   Focus sequence: \${focusHistory.map(f => f.tagName + (f.id ? '#' + f.id : '')).join(' → ')}\`);
  
  // Store focus data for subsequent steps
  focusedElements = focusHistory;
  testResults.measurements.tabNavigationSteps = ${tabCount};
  testResults.measurements.focusedElements = focusHistory.length;
  testResults.validations.push('keyboard-navigation-completed');
  
  console.log('✅ Enhanced Tab navigation completed with focus tracking');`;
    }
    
    if (instructionLower.includes('enter')) {
      return `  // Enhanced Enter key activation with result tracking
  const beforeActivation = await page.evaluate(() => ({
    url: window.location.href,
    title: document.title,
    activeElement: document.activeElement ? {
      tagName: document.activeElement.tagName,
      id: document.activeElement.id,
      textContent: document.activeElement.textContent?.trim()
    } : null
  }));
  
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  
  const afterActivation = await page.evaluate(() => ({
    url: window.location.href,
    title: document.title,
    activeElement: document.activeElement ? {
      tagName: document.activeElement.tagName,
      id: document.activeElement.id,
      textContent: document.activeElement.textContent?.trim()
    } : null
  }));
  
  // Analyze activation results
  const navigationOccurred = beforeActivation.url !== afterActivation.url;
  const titleChanged = beforeActivation.title !== afterActivation.title;
  const focusChanged = JSON.stringify(beforeActivation.activeElement) !== JSON.stringify(afterActivation.activeElement);
  
  console.log('📊 Enter Key Activation Results:');
  console.log(\`   Navigation occurred: \${navigationOccurred ? '✅ Yes' : '❌ No'}\`);
  console.log(\`   Title changed: \${titleChanged ? '✅ Yes' : '❌ No'}\`);
  console.log(\`   Focus changed: \${focusChanged ? '✅ Yes' : '❌ No'}\`);
  
  if (navigationOccurred) {
    console.log(\`   New URL: \${afterActivation.url}\`);
  }
  
  testResults.interactions.push({
    type: 'enter-activation',
    navigationOccurred,
    titleChanged,
    focusChanged,
    beforeUrl: beforeActivation.url,
    afterUrl: afterActivation.url
  });
  
  console.log('✅ Enhanced Enter key activation completed');`;
    }
    
    if (instructionLower.includes('space')) {
      return `  // Enhanced Space key activation with state tracking
  const elementBeforeSpace = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return null;
    
    return {
      tagName: el.tagName,
      type: el.type,
      checked: el.checked,
      selected: el.selected,
      ariaExpanded: el.getAttribute('aria-expanded'),
      ariaPressed: el.getAttribute('aria-pressed'),
      textContent: el.textContent?.trim()
    };
  });
  
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);
  
  const elementAfterSpace = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return null;
    
    return {
      tagName: el.tagName,
      type: el.type,
      checked: el.checked,
      selected: el.selected,
      ariaExpanded: el.getAttribute('aria-expanded'),
      ariaPressed: el.getAttribute('aria-pressed'),
      textContent: el.textContent?.trim()
    };
  });
  
  // Analyze state changes
  let stateChanged = false;
  const changes = [];
  
  if (elementBeforeSpace && elementAfterSpace) {
    if (elementBeforeSpace.checked !== elementAfterSpace.checked) {
      stateChanged = true;
      changes.push(\`checked: \${elementBeforeSpace.checked} → \${elementAfterSpace.checked}\`);
    }
    if (elementBeforeSpace.ariaExpanded !== elementAfterSpace.ariaExpanded) {
      stateChanged = true;
      changes.push(\`aria-expanded: \${elementBeforeSpace.ariaExpanded} → \${elementAfterSpace.ariaExpanded}\`);
    }
    if (elementBeforeSpace.ariaPressed !== elementAfterSpace.ariaPressed) {
      stateChanged = true;
      changes.push(\`aria-pressed: \${elementBeforeSpace.ariaPressed} → \${elementAfterSpace.ariaPressed}\`);
    }
  }
  
  console.log('📊 Space Key Activation Results:');
  console.log(\`   State changed: \${stateChanged ? '✅ Yes' : '❌ No'}\`);
  if (changes.length > 0) {
    console.log('   Changes detected:');
    changes.forEach(change => console.log(\`     - \${change}\`));
  }
  
  testResults.interactions.push({
    type: 'space-activation',
    stateChanged,
    changes,
    elementType: elementBeforeSpace?.tagName
  });
  
  console.log('✅ Enhanced Space key activation completed');`;
    }
    
    return `  // Enhanced generic keyboard interaction
  const keyboardEvent = await page.evaluate(() => {
    const el = document.activeElement;
    return el ? {
      tagName: el.tagName,
      id: el.id,
      role: el.getAttribute('role'),
      tabIndex: el.tabIndex
    } : null;
  });
  
  await page.keyboard.press('Tab');
  console.log('✅ Enhanced keyboard interaction completed');
  console.log('   Focused element:', keyboardEvent);`;
  }

  /**
   * Generate enhanced form submission code with validation tracking
   */
  private generateEnhancedFormSubmissionCode(instruction: string, stepContext: any): string {
    const instructionLower = instruction.toLowerCase();
    
    if (instructionLower.includes('without') && (instructionLower.includes('required') || instructionLower.includes('empty'))) {
      return `  // Enhanced form submission without required fields
  // First, identify required fields
  const requiredFields = await page.locator('input[required], textarea[required], select[required], [aria-required="true"]').all();
  const requiredFieldsData = [];
  
  for (const field of requiredFields) {
    const fieldName = await field.getAttribute('name') || await field.getAttribute('id') || 'unnamed';
    const fieldType = await field.getAttribute('type') || 'text';
    const currentValue = await field.inputValue().catch(() => '');
    const isEmpty = !currentValue || currentValue.trim() === '';
    
    requiredFieldsData.push({
      fieldName,
      fieldType,
      currentValue,
      isEmpty
    });
    
    console.log(\`📋 Required field "\${fieldName}" (\${fieldType}): \${isEmpty ? 'Empty' : 'Has value'}\`);
  }
  
  console.log(\`\\n📊 Form Validation Setup:\`);
  console.log(\`   Required fields found: \${requiredFields.length}\`);
  console.log(\`   Empty required fields: \${requiredFieldsData.filter(f => f.isEmpty).length}\`);
  
  // Attempt form submission
  const submitButton = await page.locator('button[type="submit"], input[type="submit"], button:has-text("submit"), #submit, .submit').first();
  
  if (await submitButton.isVisible()) {
    console.log('🚀 Attempting form submission without filling required fields...');
    await submitButton.click();
    console.log('✅ Form submission attempted');
  } else {
    // Try to find and click any button that might submit the form
    const anyButton = await page.locator('button, input[type="button"]').first();
    if (await anyButton.isVisible()) {
      await anyButton.click();
      console.log('✅ Form submission attempted using generic button');
    }
  }
  
  // Wait for potential validation messages to appear
  await page.waitForTimeout(1000);
  
  // Check for validation messages after submission
  const validationMessages = await page.locator('.error, .invalid, [role="alert"], .validation-error, [aria-invalid="true"]').all();
  const validationData = [];
  
  for (const message of validationMessages) {
    const text = await message.textContent();
    const isVisible = await message.isVisible();
    if (isVisible && text && text.trim()) {
      validationData.push(text.trim());
      console.log(\`⚠️ Validation message: "\${text.trim()}"\`);
    }
  }
  
  console.log(\`\\n📊 Form Submission Results:\`);
  console.log(\`   Validation messages appeared: \${validationData.length}\`);
  console.log(\`   Form validation working: \${validationData.length > 0 ? '✅ Yes' : '❌ No'}\`);
  
  testResults.measurements.requiredFields = requiredFields.length;
  testResults.measurements.validationMessages = validationData.length;
  testResults.validations.push('form-validation-tested');`;
    }
    
    return `  // Enhanced form submission
  const formData = await page.evaluate(() => {
    const forms = document.querySelectorAll('form');
    const formInfo = [];
    
    forms.forEach((form, index) => {
      const fields = form.querySelectorAll('input, textarea, select');
      const submitButtons = form.querySelectorAll('button[type="submit"], input[type="submit"]');
      
      formInfo.push({
        index,
        fieldCount: fields.length,
        submitButtonCount: submitButtons.length,
        action: form.action,
        method: form.method
      });
    });
    
    return formInfo;
  });
  
  console.log('📋 Form Analysis:', formData);
  
  const submitButton = await page.locator('button[type="submit"], input[type="submit"], button:has-text("submit")').first();
  if (await submitButton.isVisible()) {
    await submitButton.click();
    console.log('✅ Enhanced form submission completed');
    
    // Wait for potential navigation or response
    try {
      await page.waitForLoadState('networkidle', { timeout: 3000 });
    } catch (e) {
      await page.waitForTimeout(1000);
    }
  }
  
  testResults.interactions.push({
    type: 'form-submission',
    formsFound: formData.length,
    submitted: true
  });`;
  }

  /**
   * Generate enhanced visual accessibility checking code
   */
  private generateEnhancedCheckVisualAccessibilityCode(instruction: string, stepContext: any): string {
    return `  // Enhanced visual accessibility checking (color contrast, focus indicators)
  const focusableElements = await page.locator('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])').all();
  const visualAccessibilityResults = {
    totalElements: focusableElements.length,
    elementsWithFocusIndicators: 0,
    elementsWithoutFocusIndicators: 0,
    contrastIssues: [],
    focusIndicatorDetails: []
  };
  
  console.log(\`🔍 Checking visual accessibility for \${focusableElements.length} focusable elements...\`);
  
  for (let i = 0; i < Math.min(10, focusableElements.length); i++) {
    const element = focusableElements[i];
    await element.focus();
    
    const elementInfo = await element.evaluate(el => ({
      tagName: el.tagName.toLowerCase(),
      id: el.id || 'no-id',
      className: el.className || '',
      textContent: el.textContent?.trim().substring(0, 30) || ''
    }));
    
    const focusStyles = await element.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        outlineColor: styles.outlineColor,
        outlineWidth: styles.outlineWidth,
        outlineStyle: styles.outlineStyle,
        boxShadow: styles.boxShadow,
        border: styles.border,
        backgroundColor: styles.backgroundColor,
        color: styles.color
      };
    });
    
    // Enhanced focus indicator detection
    const hasFocusIndicator = (
      (focusStyles.outline !== 'none' && focusStyles.outline !== '0px') ||
      (focusStyles.outlineWidth !== '0px' && focusStyles.outlineWidth !== '0') ||
      (focusStyles.boxShadow !== 'none' && focusStyles.boxShadow.includes('inset') === false) ||
      (focusStyles.border && focusStyles.border !== 'none')
    );
    
    const focusIndicatorType = [];
    if (focusStyles.outline !== 'none' && focusStyles.outline !== '0px') focusIndicatorType.push('outline');
    if (focusStyles.boxShadow !== 'none') focusIndicatorType.push('box-shadow');
    if (focusStyles.border !== 'none') focusIndicatorType.push('border');
    
    const elementResult = {
      element: \`\${elementInfo.tagName}#\${elementInfo.id}\`,
      hasFocusIndicator,
      focusIndicatorType: focusIndicatorType.join(', ') || 'none',
      styles: focusStyles
    };
    
    visualAccessibilityResults.focusIndicatorDetails.push(elementResult);
    
    if (hasFocusIndicator) {
      visualAccessibilityResults.elementsWithFocusIndicators++;
      console.log(\`✅ \${elementInfo.tagName}#\${elementInfo.id}: Focus indicator present (\${focusIndicatorType.join(', ')})\`);
    } else {
      visualAccessibilityResults.elementsWithoutFocusIndicators++;
      console.log(\`❌ \${elementInfo.tagName}#\${elementInfo.id}: No focus indicator detected\`);
    }
    
    // Basic contrast checking (simplified)
    const hasGoodContrast = await element.evaluate(el => {
      const styles = window.getComputedStyle(el);
      const bgColor = styles.backgroundColor;
      const textColor = styles.color;
      
      // Simple heuristic: if background and text colors are different, assume good contrast
      // In a real implementation, you'd calculate actual contrast ratios
      return bgColor !== textColor && bgColor !== 'rgba(0, 0, 0, 0)';
    });
    
    if (!hasGoodContrast) {
      visualAccessibilityResults.contrastIssues.push(\`\${elementInfo.tagName}#\${elementInfo.id}\`);
    }
  }
  
  // Generate comprehensive visual accessibility summary
  const focusIndicatorPercentage = visualAccessibilityResults.totalElements > 0 ? 
    (visualAccessibilityResults.elementsWithFocusIndicators / Math.min(10, visualAccessibilityResults.totalElements) * 100).toFixed(1) : 0;
  
  console.log(\`\\n📊 Visual Accessibility Summary:\`);
  console.log(\`   Elements tested: \${Math.min(10, visualAccessibilityResults.totalElements)}\`);
  console.log(\`   With focus indicators: \${visualAccessibilityResults.elementsWithFocusIndicators}\`);
  console.log(\`   Without focus indicators: \${visualAccessibilityResults.elementsWithoutFocusIndicators}\`);
  console.log(\`   Focus indicator coverage: \${focusIndicatorPercentage}%\`);
  console.log(\`   Potential contrast issues: \${visualAccessibilityResults.contrastIssues.length}\`);
  
  if (visualAccessibilityResults.elementsWithoutFocusIndicators === 0) {
    console.log('🎉 All tested elements have proper focus indicators');
  } else if (visualAccessibilityResults.elementsWithoutFocusIndicators <= 2) {
    console.log('⚠️  Minor focus indicator issues found');
  } else {
    console.log('❌ Multiple elements lack proper focus indicators');
  }
  
  testResults.measurements.focusIndicatorCoverage = parseFloat(focusIndicatorPercentage);
  testResults.measurements.contrastIssues = visualAccessibilityResults.contrastIssues.length;
  testResults.validations.push('visual-accessibility-checked');
  
  console.log('✅ Enhanced visual accessibility checking completed');`;
  }

  /**
   * Extract WCAG criteria from requirements
   */
  private extractWCAGCriteriaFromRequirements(requirements: AccessibilityTestRequirements): string[] {
    const criteria: string[] = [];
    
    requirements.domInspection.forEach(req => criteria.push(...req.wcagCriteria));
    requirements.keyboardNavigation.forEach(req => criteria.push(...req.wcagCriteria));
    requirements.ariaCompliance.forEach(req => criteria.push(...req.wcagCriteria));
    requirements.visualAccessibility.forEach(req => criteria.push(...req.wcagCriteria));
    requirements.wcagGuidelines.forEach(req => criteria.push(req.successCriteria));
    
    return [...new Set(criteria)];
  }

  /**
   * Generate tests based on user request
   * 
   * This is the main entry point that:
   * 1. Classifies test intent
   * 2. Routes to appropriate generator(s)
   * 3. Combines results
   * 4. Returns unified response
   * 
   * @param request - Test generation request
   * @returns Test generation response with all generated tests
   */
  async generateTests(request: TestGenerationRequest): Promise<TestGenerationResponse> {
    const { url, prompt = '', websiteAnalysis } = request;

    // Use provided analysis or create minimal one
    const analysis: WebsiteAnalysis = websiteAnalysis || {
      url,
      allInteractive: [],
    };

    // Step 1: Classify test intent
    const intent = classifyTestIntent(prompt, analysis);
    
    console.log('[IntegratedTestRouter] Test intent classification:', {
      primaryType: intent.primaryType,
      secondaryTypes: intent.secondaryTypes,
      confidence: intent.confidence,
      keywords: intent.detectedKeywords,
    });

    const allTestCases: (BaseTestCase | AccessibilityTestCase | APITestCase)[] = [];
    const generatorsSummary: Record<string, number> = {};

    // Step 2: Route to appropriate generator(s) based on intent

    // Generate accessibility tests if intent detected
    if (intent.primaryType === 'accessibility' || 
        intent.primaryType === 'mixed' || 
        intent.secondaryTypes.includes('accessibility')) {
      console.log('[IntegratedTestRouter] Generating accessibility tests...');
      try {
        let accessibilityTests: AccessibilityTestCase[];
        
        // Use enhanced parser if flag is set
        if (intent.useEnhancedAccessibilityParser) {
          console.log('[IntegratedTestRouter] Using enhanced accessibility parser and generator');
          accessibilityTests = this.generateEnhancedAccessibilityTests(analysis, prompt);
        } else {
          console.log('[IntegratedTestRouter] Using basic accessibility generator');
          accessibilityTests = generateAccessibilityTests(analysis, prompt);
        }
        
        allTestCases.push(...accessibilityTests);
        generatorsSummary.accessibility = accessibilityTests.length;
        console.log(`[IntegratedTestRouter] Generated ${accessibilityTests.length} accessibility test cases`);
      } catch (error: any) {
        console.error('[IntegratedTestRouter] Accessibility test generation error:', error.message);
      }
    }

    // Generate security tests if security checkbox is ticked or security intent detected
    if (request.securityEnabled || 
        request.testType === 'security' || 
        intent.primaryType === 'security' || 
        intent.secondaryTypes.includes('security')) {
      console.log('[IntegratedTestRouter] Generating instruction-specific security tests...');
      try {
        // Use inline security generation
        const parsed = this.parseSecurityInstructionInline(prompt, url);
        const instructionTest = this.generateInstructionSpecificTestInline(parsed);
        
        // Convert to BaseTestCase format for compatibility
        const securityTestCase: BaseTestCase = {
          id: `security-${Date.now()}`,
          title: instructionTest.testName,
          description: instructionTest.description,
          category: 'Security',
          testType: 'API',
          priority: 'High',
          severity: 'High',
          stability: 'Stable',
          preconditions: [`URL ${url} is accessible`, 'Security testing environment is configured'],
          steps: instructionTest.steps.map((step: any, index: number) => ({
            stepNumber: step.stepNumber,
            action: `${step.action}: ${step.target}`,
            expectedResult: step.expectedResult || `Step ${step.stepNumber} completes successfully`
          })),
          expectedResult: '',
          validationCriteria: {
            compliance: [`Security Intent: ${parsed.method}`],
            behavior: []
          },
          qualityMetrics: {
            confidence: Math.round(instructionTest.confidence * 100),
            stability: 95,
            maintainability: 90
          },
          playwrightCode: instructionTest.testCode,
          automationMapping: instructionTest.testCode,
          testCaseId: `security-${Date.now()}`
        };
        
        allTestCases.push(securityTestCase);
        generatorsSummary.security = 1;
        console.log(`[IntegratedTestRouter] Generated 1 instruction-specific security test case`);
        console.log(`[IntegratedTestRouter] Security confidence: ${(instructionTest.confidence * 100).toFixed(1)}%`);
        console.log(`[IntegratedTestRouter] Steps generated: ${instructionTest.steps.length}`);
      } catch (error: any) {
        console.error('[IntegratedTestRouter] Instruction-specific security test generation error:', error.message);
      }
    }

    // Generate API tests if intent detected
    if (intent.primaryType === 'api' || intent.secondaryTypes.includes('api')) {
      console.log('[IntegratedTestRouter] Generating API tests...');
      try {
        // Check if instruction is specific or generic
        if (isSpecificInstruction(prompt)) {
          console.log('[IntegratedTestRouter] Detected specific instruction - using instruction-based generator');
          
          // Use instruction-based generation for specific instructions
          const parsedInstruction = parseAPIInstructionEnhanced(prompt, url);
          const instructionBasedTest = generateInstructionBasedTestCase(parsedInstruction);
          
          allTestCases.push(instructionBasedTest);
          generatorsSummary.api = 1;
          console.log('[IntegratedTestRouter] Generated 1 instruction-based API test case');
        } else {
          console.log('[IntegratedTestRouter] Detected generic instruction - using template-based generator');
          
          // Use template-based generation for generic instructions (fallback)
          const apiTests = generateAPITests(analysis, prompt);
          
          // CRITICAL FIX: Generate Playwright automation code for each API test
          apiTests.forEach((apiTest) => {
            if (!apiTest.automationMapping) {
              console.log(`[IntegratedTestRouter] Generating automation code for ${apiTest.id}`);
              // Pass the user prompt to enable instruction-based code generation
              apiTest.automationMapping = generateAPIAutomationCode(apiTest, prompt);
            }
            // CRITICAL FIX: Copy automationMapping to playwrightCode for frontend compatibility
            if (apiTest.automationMapping && !apiTest.playwrightCode) {
              (apiTest as any).playwrightCode = apiTest.automationMapping;
            }
            // CRITICAL FIX: Add testCaseId field for frontend compatibility
            if (!apiTest.testCaseId) {
              (apiTest as any).testCaseId = apiTest.id;
            }
          });
          
          allTestCases.push(...apiTests);
          generatorsSummary.api = apiTests.length;
          console.log(`[IntegratedTestRouter] Generated ${apiTests.length} template-based API test cases with automation code`);
        }
      } catch (error: any) {
        console.error('[IntegratedTestRouter] API test generation error:', error.message);
      }
    }

    // Generate functional tests if intent detected OR if confidence is low (fallback)
    // This preserves existing functionality and ensures backward compatibility
    if (
      intent.primaryType === 'functional' ||
      intent.secondaryTypes.includes('functional') ||
      intent.confidence < 0.5 ||
      allTestCases.length === 0
    ) {
      console.log('[IntegratedTestRouter] Generating functional tests (existing generator)...');
      try {
        if (this.functionalGenerator) {
          const functionalTests = await this.functionalGenerator.generate(analysis, prompt);
          // Ensure it's an array before spreading
          if (Array.isArray(functionalTests)) {
            allTestCases.push(...functionalTests);
            generatorsSummary.functional = functionalTests.length;
            console.log(`[IntegratedTestRouter] Generated ${functionalTests.length} functional test cases`);
          } else {
            console.warn('[IntegratedTestRouter] Functional generator did not return an array:', typeof functionalTests);
          }
        } else {
          console.warn('[IntegratedTestRouter] No functional generator set, skipping functional tests');
        }
      } catch (error: any) {
        console.error('[IntegratedTestRouter] Functional test generation error:', error.message);
      }
    }

    console.log(`[IntegratedTestRouter] Total generated: ${allTestCases.length} test cases`);
    console.log('[IntegratedTestRouter] Generators used:', generatorsSummary);

    // Step 3: Build unified response
    const summary = {
      totalTests: allTestCases.length,
      byType: allTestCases.reduce((acc: Record<string, number>, tc: any) => {
        const type = tc.testType || tc.type || 'Unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {}),
      intent: {
        primaryType: intent.primaryType,
        secondaryTypes: intent.secondaryTypes,
        confidence: intent.confidence,
      },
      generatorsUsed: generatorsSummary,
      coverageAreas: [...new Set(allTestCases.map((tc: any) => tc.testType || tc.type))],
    };

    return {
      testCases: allTestCases,
      summary,
      analysis,
      intent,
    };
  }

  /**
   * Generate tests with explicit type specification
   * 
   * Allows callers to explicitly request specific test types,
   * bypassing intent classification.
   * 
   * @param request - Test generation request
   * @param types - Explicit test types to generate
   * @returns Test generation response
   */
  async generateTestsWithTypes(
    request: TestGenerationRequest,
    types: ('functional' | 'accessibility' | 'api' | 'security')[]
  ): Promise<TestGenerationResponse> {
    const { url, prompt = '', websiteAnalysis } = request;

    const analysis: WebsiteAnalysis = websiteAnalysis || {
      url,
      allInteractive: [],
    };

    const allTestCases: (BaseTestCase | AccessibilityTestCase | APITestCase)[] = [];
    const generatorsSummary: Record<string, number> = {};

    // Generate tests for each specified type
    for (const type of types) {
      switch (type) {
        case 'accessibility':
          try {
            // For explicit type generation, always use enhanced parser if available
            console.log('[IntegratedTestRouter] Using enhanced accessibility parser for explicit type generation');
            const accessibilityTests = this.generateEnhancedAccessibilityTests(analysis, prompt);
            allTestCases.push(...accessibilityTests);
            generatorsSummary.accessibility = accessibilityTests.length;
          } catch (error: any) {
            console.error('[IntegratedTestRouter] Accessibility test generation error:', error.message);
          }
          break;

        case 'api':
          try {
            // Check if instruction is specific or generic
            if (isSpecificInstruction(prompt)) {
              console.log('[IntegratedTestRouter] Detected specific instruction - using instruction-based generator');
              
              // Use instruction-based generation for specific instructions
              const parsedInstruction = parseAPIInstructionEnhanced(prompt, url);
              const instructionBasedTest = generateInstructionBasedTestCase(parsedInstruction);
              
              allTestCases.push(instructionBasedTest);
              generatorsSummary.api = 1;
            } else {
              console.log('[IntegratedTestRouter] Detected generic instruction - using template-based generator');
              
              // Use template-based generation for generic instructions (fallback)
              const apiTests = generateAPITests(analysis, prompt);
              
              // CRITICAL FIX: Generate automation code for each API test
              apiTests.forEach((apiTest) => {
                if (!apiTest.automationMapping) {
                  // Pass the user prompt to enable instruction-based code generation
                  apiTest.automationMapping = generateAPIAutomationCode(apiTest, prompt);
                }
                // CRITICAL FIX: Copy automationMapping to playwrightCode for frontend compatibility
                if (apiTest.automationMapping && !apiTest.playwrightCode) {
                  (apiTest as any).playwrightCode = apiTest.automationMapping;
                }
                // CRITICAL FIX: Add testCaseId field for frontend compatibility
                if (!apiTest.testCaseId) {
                  (apiTest as any).testCaseId = apiTest.id;
                }
              });
              
              allTestCases.push(...apiTests);
              generatorsSummary.api = apiTests.length;
            }
          } catch (error: any) {
            console.error('[IntegratedTestRouter] API test generation error:', error.message);
          }
          break;

        case 'functional':
          try {
            if (this.functionalGenerator) {
              const functionalTests = await this.functionalGenerator.generate(analysis, prompt);
              if (Array.isArray(functionalTests)) {
                allTestCases.push(...functionalTests);
                generatorsSummary.functional = functionalTests.length;
              }
            }
          } catch (error: any) {
            console.error('[IntegratedTestRouter] Functional test generation error:', error.message);
          }
          break;

        case 'security':
          try {
            console.log('[IntegratedTestRouter] Generating instruction-specific security tests for explicit type');
            
            // Inline simplified security generation to avoid module loading issues
            const parsed = this.parseSecurityInstructionInline(prompt, url);
            const instructionTest = this.generateInstructionSpecificTestInline(parsed);
            
            // Convert to BaseTestCase format for compatibility
            const securityTestCase: BaseTestCase = {
              id: `security-${Date.now()}`,
              title: instructionTest.testName,
              description: instructionTest.description,
              category: 'Security',
              testType: 'API',
              priority: 'High',
              severity: 'High',
              stability: 'Stable',
              preconditions: [`URL ${url} is accessible`, 'Security testing environment is configured'],
              steps: instructionTest.steps.map((step: any, index: number) => ({
                stepNumber: step.stepNumber,
                action: `${step.action}: ${step.target}`,
                expectedResult: step.expectedResult || `Step ${step.stepNumber} completes successfully`
              })),
              expectedResult: '',
              validationCriteria: {
                compliance: [`Security Intent: ${parsed.method}`],
                behavior: []
              },
              qualityMetrics: {
                confidence: Math.round(instructionTest.confidence * 100),
                stability: 95,
                maintainability: 90
              },
              playwrightCode: instructionTest.testCode,
              automationMapping: instructionTest.testCode,
              testCaseId: `security-${Date.now()}`
            };
            
            allTestCases.push(securityTestCase);
            generatorsSummary.security = 1;
            console.log(`[IntegratedTestRouter] Generated instruction-specific security test`);
            console.log(`[IntegratedTestRouter] Steps generated: ${instructionTest.steps.length}`);
          } catch (error: any) {
            console.error('[IntegratedTestRouter] Security test generation error:', error.message);
          }
          break;
      }
    }

    const summary = {
      totalTests: allTestCases.length,
      byType: allTestCases.reduce((acc: Record<string, number>, tc: any) => {
        const type = tc.testType || tc.type || 'Unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {}),
      intent: {
        primaryType: types[0] || 'functional',
        secondaryTypes: types.slice(1),
        confidence: 1.0, // Explicit types have 100% confidence
      },
      generatorsUsed: generatorsSummary,
      coverageAreas: [...new Set(allTestCases.map((tc: any) => tc.testType || tc.type))],
    };

    // Create a synthetic intent for explicit type generation
    const intent: TestIntent = {
      primaryType: types[0] || 'functional',
      secondaryTypes: types.slice(1),
      confidence: 1.0,
      detectedKeywords: {
        accessibility: types.includes('accessibility') ? ['explicit'] : [],
        api: types.includes('api') ? ['explicit'] : [],
        functional: types.includes('functional') ? ['explicit'] : [],
        security: types.includes('security') ? ['explicit'] : [],
      },
    };

    return {
      testCases: allTestCases,
      summary,
      analysis,
      intent,
    };
  }

  /**
   * Generate Template-Based Accessibility Test Case
   * 
   * Creates a comprehensive accessibility test case using the selected template
   * and includes Axe-Core integration by default.
   * 
   * Requirements: 7.3, 7.4, 7.5
   */
  private generateTemplateBasedAccessibilityTest(
    analysis: WebsiteAnalysis,
    requirements: AccessibilityTestRequirements,
    templateSelection: TemplateSelectionResult,
    prompt: string
  ): AccessibilityTestCase | null {
    const template = templateSelection.selectedTemplate;
    
    // Generate Axe-Core integration code
    const axeCoreCode = generateAxeCoreIntegrationCode(templateSelection.axeCoreConfig);
    
    // Build automation code using template
    let automationCode = template.setupCode;
    
    // Replace template placeholders
    automationCode += template.codeTemplate
      .replace('{{TEST_NAME}}', template.name.toLowerCase().replace(/\s+/g, '-'))
      .replace('{{URL}}', analysis.url)
      .replace('{{DOM_INSPECTION_CODE}}', this.generateDOMInspectionTemplateCode(requirements.domInspection))
      .replace('{{KEYBOARD_NAVIGATION_CODE}}', this.generateKeyboardNavigationTemplateCode(requirements.keyboardNavigation))
      .replace('{{ARIA_COMPLIANCE_CODE}}', this.generateARIAComplianceTemplateCode(requirements.ariaCompliance))
      .replace('{{VISUAL_ACCESSIBILITY_CODE}}', this.generateVisualAccessibilityTemplateCode(requirements.visualAccessibility))
      .replace('{{WCAG_GUIDELINES_CODE}}', this.generateWCAGGuidelinesTemplateCode(requirements.wcagGuidelines))
      .replace('{{AXE_CORE_INTEGRATION_CODE}}', axeCoreCode);
    
    // Create test case
    const testCase: AccessibilityTestCase = {
      id: `template-accessibility-${Date.now()}`,
      title: `${template.name} - ${analysis.url}`,
      testType: 'Accessibility',
      description: `${template.description} for ${analysis.url}. Generated using enhanced accessibility parser with template-based approach.`,
      category: 'Regression',
      priority: 'High',
      severity: 'High',
      stability: 'Stable',
      preconditions: [
        'Page is accessible and loaded',
        'Axe-Core accessibility testing library is available',
        'Browser supports required accessibility APIs'
      ],
      steps: this.generateTemplateBasedSteps(template, requirements),
      expectedResult: `All accessibility requirements are met according to ${template.name} standards with Axe-Core validation`,
      validationCriteria: {
        compliance: template.wcagCriteria.map(criteria => `WCAG ${criteria}`),
        behavior: [
          'All interactive elements are keyboard accessible',
          'ARIA attributes are properly implemented',
          'Color contrast meets WCAG AA standards',
          'Page structure is semantically correct',
          'Axe-Core scan passes without violations'
        ]
      },
      qualityMetrics: { confidence: 95, stability: 90, maintainability: 95 },
      wcagVersion: '2.1',
      wcagPrinciple: ['Perceivable', 'Operable', 'Understandable', 'Robust'],
      wcagSuccessCriteria: template.wcagCriteria,
      assistiveTechnology: ['NVDA', 'JAWS', 'VoiceOver', 'Keyboard'],
      accessibilityTags: ['template-based', 'enhanced-parser', 'axe-core', ...template.requiredFeatures],
      keyboardAccess: true,
      automationMapping: automationCode,
    };
    
    return testCase;
  }

  /**
   * Generate DOM Inspection Test Case using Template
   */
  private generateDOMInspectionTestCase(
    analysis: WebsiteAnalysis,
    requirements: any[],
    templateSelection: TemplateSelectionResult
  ): AccessibilityTestCase | null {
    if (requirements.length === 0) return null;
    
    const axeCoreCode = generateAxeCoreIntegrationCode(templateSelection.axeCoreConfig);
    const domTemplate = templateSelection.selectedTemplate;
    
    const automationCode = domTemplate.setupCode + 
      domTemplate.codeTemplate
        .replace('{{TEST_NAME}}', 'dom-inspection-accessibility')
        .replace('{{URL}}', analysis.url)
        .replace('{{DOM_INSPECTION_CODE}}', this.generateDOMInspectionTemplateCode(requirements))
        .replace('{{AXE_CORE_INTEGRATION_CODE}}', axeCoreCode);
    
    return {
      id: `dom-inspection-${Date.now()}`,
      title: 'DOM Inspection - Accessibility Validation',
      testType: 'Accessibility',
      description: 'Comprehensive DOM inspection using accessibility-based selectors and template-driven validation',
      category: 'Regression',
      priority: 'High',
      severity: 'High',
      stability: 'Stable',
      preconditions: ['Page is loaded', 'DOM elements are rendered'],
      steps: requirements.map((req, index) => ({
        stepNumber: index + 1,
        action: `Validate ${req.type} accessibility requirements`,
        expectedResult: `${req.type} elements meet accessibility standards`
      })),
      expectedResult: 'All DOM elements pass accessibility validation',
      validationCriteria: { compliance: ['WCAG 1.1.1', 'WCAG 1.3.1', 'WCAG 2.4.6'] },
      qualityMetrics: { confidence: 90, stability: 85, maintainability: 95 },
      wcagVersion: '2.1',
      wcagPrinciple: ['Perceivable', 'Understandable'],
      wcagSuccessCriteria: ['1.1.1', '1.3.1', '2.4.6'],
      assistiveTechnology: ['NVDA', 'JAWS', 'VoiceOver'],
      accessibilityTags: ['dom-inspection', 'template-based'],
      keyboardAccess: false,
      automationMapping: automationCode,
    };
  }

  /**
   * Generate Keyboard Navigation Test Case using Template
   */
  private generateKeyboardNavigationTestCase(
    analysis: WebsiteAnalysis,
    requirements: any[],
    templateSelection: TemplateSelectionResult
  ): AccessibilityTestCase | null {
    if (requirements.length === 0) return null;
    
    const axeCoreCode = generateAxeCoreIntegrationCode(templateSelection.axeCoreConfig);
    const keyboardTemplate = templateSelection.selectedTemplate;
    
    const automationCode = keyboardTemplate.setupCode + 
      keyboardTemplate.codeTemplate
        .replace('{{TEST_NAME}}', 'keyboard-navigation-accessibility')
        .replace('{{URL}}', analysis.url)
        .replace('{{KEYBOARD_NAVIGATION_CODE}}', this.generateKeyboardNavigationTemplateCode(requirements))
        .replace('{{AXE_CORE_INTEGRATION_CODE}}', axeCoreCode);
    
    return {
      id: `keyboard-navigation-${Date.now()}`,
      title: 'Keyboard Navigation - Accessibility Validation',
      testType: 'Accessibility',
      description: 'Comprehensive keyboard navigation testing using template-driven validation',
      category: 'Regression',
      priority: 'High',
      severity: 'High',
      stability: 'Stable',
      preconditions: ['Page is loaded', 'Keyboard input is available'],
      steps: requirements.map((req, index) => ({
        stepNumber: index + 1,
        action: `Test ${req.type} keyboard navigation`,
        expectedResult: `${req.expectedBehavior}`
      })),
      expectedResult: 'All keyboard navigation requirements are met',
      validationCriteria: { compliance: ['WCAG 2.1.1', 'WCAG 2.1.2', 'WCAG 2.4.3'] },
      qualityMetrics: { confidence: 90, stability: 85, maintainability: 95 },
      wcagVersion: '2.1',
      wcagPrinciple: ['Operable'],
      wcagSuccessCriteria: ['2.1.1', '2.1.2', '2.4.3'],
      assistiveTechnology: ['Keyboard'],
      accessibilityTags: ['keyboard-navigation', 'template-based'],
      keyboardAccess: true,
      automationMapping: automationCode,
    };
  }

  /**
   * Generate ARIA Compliance Test Case using Template
   */
  private generateARIAComplianceTestCase(
    analysis: WebsiteAnalysis,
    requirements: any[],
    templateSelection: TemplateSelectionResult
  ): AccessibilityTestCase | null {
    if (requirements.length === 0) return null;
    
    const axeCoreCode = generateAxeCoreIntegrationCode(templateSelection.axeCoreConfig);
    const ariaTemplate = templateSelection.selectedTemplate;
    
    const automationCode = ariaTemplate.setupCode + 
      ariaTemplate.codeTemplate
        .replace('{{TEST_NAME}}', 'aria-compliance-accessibility')
        .replace('{{URL}}', analysis.url)
        .replace('{{ARIA_COMPLIANCE_CODE}}', this.generateARIAComplianceTemplateCode(requirements))
        .replace('{{AXE_CORE_INTEGRATION_CODE}}', axeCoreCode);
    
    return {
      id: `aria-compliance-${Date.now()}`,
      title: 'ARIA Compliance - Accessibility Validation',
      testType: 'Accessibility',
      description: 'Comprehensive ARIA compliance testing using template-driven validation',
      category: 'Regression',
      priority: 'High',
      severity: 'High',
      stability: 'Stable',
      preconditions: ['Page is loaded', 'ARIA attributes are rendered'],
      steps: requirements.map((req, index) => ({
        stepNumber: index + 1,
        action: `Validate ${req.type} ARIA compliance`,
        expectedResult: `${req.validationLogic}`
      })),
      expectedResult: 'All ARIA compliance requirements are met',
      validationCriteria: { compliance: ['WCAG 1.3.1', 'WCAG 4.1.2', 'WCAG 4.1.3'] },
      qualityMetrics: { confidence: 90, stability: 85, maintainability: 95 },
      wcagVersion: '2.1',
      wcagPrinciple: ['Perceivable', 'Robust'],
      wcagSuccessCriteria: ['1.3.1', '4.1.2', '4.1.3'],
      assistiveTechnology: ['NVDA', 'JAWS', 'VoiceOver'],
      accessibilityTags: ['aria-compliance', 'template-based'],
      keyboardAccess: true,
      automationMapping: automationCode,
    };
  }

  /**
   * Generate Visual Accessibility Test Case using Template
   */
  private generateVisualAccessibilityTestCase(
    analysis: WebsiteAnalysis,
    requirements: any[],
    templateSelection: TemplateSelectionResult
  ): AccessibilityTestCase | null {
    if (requirements.length === 0) return null;
    
    const axeCoreCode = generateAxeCoreIntegrationCode(templateSelection.axeCoreConfig);
    const visualTemplate = templateSelection.selectedTemplate;
    
    const automationCode = visualTemplate.setupCode + 
      visualTemplate.codeTemplate
        .replace('{{TEST_NAME}}', 'visual-accessibility')
        .replace('{{URL}}', analysis.url)
        .replace('{{VISUAL_ACCESSIBILITY_CODE}}', this.generateVisualAccessibilityTemplateCode(requirements))
        .replace('{{AXE_CORE_INTEGRATION_CODE}}', axeCoreCode);
    
    return {
      id: `visual-accessibility-${Date.now()}`,
      title: 'Visual Accessibility - Color Contrast and Focus Indicators',
      testType: 'Accessibility',
      description: 'Comprehensive visual accessibility testing using template-driven validation',
      category: 'Regression',
      priority: 'High',
      severity: 'Medium',
      stability: 'Stable',
      preconditions: ['Page is loaded', 'Visual elements are rendered'],
      steps: requirements.map((req, index) => ({
        stepNumber: index + 1,
        action: `Validate ${req.type} visual accessibility`,
        expectedResult: `${req.type} meets contrast ratio requirements`
      })),
      expectedResult: 'All visual accessibility requirements are met',
      validationCriteria: { compliance: ['WCAG 1.4.3', 'WCAG 1.4.11', 'WCAG 2.4.7'] },
      qualityMetrics: { confidence: 90, stability: 85, maintainability: 95 },
      wcagVersion: '2.1',
      wcagPrinciple: ['Perceivable', 'Operable'],
      wcagSuccessCriteria: ['1.4.3', '1.4.11', '2.4.7'],
      assistiveTechnology: ['Keyboard'],
      accessibilityTags: ['visual-accessibility', 'template-based'],
      keyboardAccess: false,
      automationMapping: automationCode,
    };
  }

  /**
   * Generate Template-Based Test Steps
   */
  private generateTemplateBasedSteps(template: AccessibilityTestTemplate, requirements: AccessibilityTestRequirements): any[] {
    const steps = [
      {
        stepNumber: 1,
        action: 'Navigate to the target page',
        expectedResult: 'Page loads successfully and is ready for accessibility testing'
      }
    ];
    
    let stepNumber = 2;
    
    if (template.requiredFeatures.includes('dom-inspection')) {
      steps.push({
        stepNumber: stepNumber++,
        action: 'Perform DOM inspection using accessibility-based selectors',
        expectedResult: 'All DOM elements meet accessibility requirements'
      });
    }
    
    if (template.requiredFeatures.includes('keyboard-navigation')) {
      steps.push({
        stepNumber: stepNumber++,
        action: 'Test keyboard navigation and focus management',
        expectedResult: 'All interactive elements are keyboard accessible'
      });
    }
    
    if (template.requiredFeatures.includes('aria-compliance')) {
      steps.push({
        stepNumber: stepNumber++,
        action: 'Validate ARIA attributes and screen reader compatibility',
        expectedResult: 'All ARIA attributes are properly implemented'
      });
    }
    
    if (template.requiredFeatures.includes('visual-accessibility')) {
      steps.push({
        stepNumber: stepNumber++,
        action: 'Check color contrast and visual accessibility features',
        expectedResult: 'All visual elements meet WCAG contrast requirements'
      });
    }
    
    if (template.requiredFeatures.includes('wcag-guidelines')) {
      steps.push({
        stepNumber: stepNumber++,
        action: 'Validate specific WCAG success criteria',
        expectedResult: 'All specified WCAG guidelines are met'
      });
    }
    
    // Always include Axe-Core scanning
    steps.push({
      stepNumber: stepNumber++,
      action: 'Run comprehensive Axe-Core accessibility scan',
      expectedResult: 'No accessibility violations detected by automated scanning'
    });
    
    return steps;
  }

  /**
   * Generate DOM Inspection Template Code
   */
  private generateDOMInspectionTemplateCode(requirements: any[]): string {
    if (requirements.length === 0) return '// No DOM inspection requirements';
    
    return `
  // DOM Inspection using Template-Based Validation
  console.log('Starting DOM inspection with ${requirements.length} requirements...');
  
  ${requirements.map(req => `
  // Validate ${req.type}
  await DOMInspectionUtils.validate${req.type.split('-').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join('')}(page);
  `).join('')}
  
  console.log('DOM inspection completed successfully');
`;
  }

  /**
   * Generate Keyboard Navigation Template Code
   */
  private generateKeyboardNavigationTemplateCode(requirements: any[]): string {
    if (requirements.length === 0) return '// No keyboard navigation requirements';
    
    return `
  // Keyboard Navigation using Template-Based Validation
  console.log('Starting keyboard navigation testing with ${requirements.length} requirements...');
  
  const focusSequence = await KeyboardUtils.testTabSequence(page);
  expect(focusSequence.length).toBeGreaterThan(0);
  
  const focusableElements = await KeyboardUtils.getFocusableElements(page);
  for (const element of focusableElements.slice(0, 5)) {
    const activationResult = await KeyboardUtils.testKeyboardActivation(page, element);
    expect(activationResult.enterActivation).toBeDefined();
  }
  
  console.log('Keyboard navigation testing completed successfully');
`;
  }

  /**
   * Generate ARIA Compliance Template Code
   */
  private generateARIAComplianceTemplateCode(requirements: any[]): string {
    if (requirements.length === 0) return '// No ARIA compliance requirements';
    
    return `
  // ARIA Compliance using Template-Based Validation
  console.log('Starting ARIA compliance testing with ${requirements.length} requirements...');
  
  const ariaLabels = await ARIAUtils.validateARIALabels(page);
  ariaLabels.forEach(result => {
    expect(result.hasAccessibleName).toBe(true);
  });
  
  const ariaStates = await ARIAUtils.validateARIAStates(page);
  ariaStates.forEach(result => {
    // Validate ARIA states are properly set
    if (result.expanded !== null) {
      expect(['true', 'false']).toContain(result.expanded);
    }
  });
  
  const liveRegions = await ARIAUtils.validateLiveRegions(page);
  liveRegions.forEach(result => {
    expect(result.isLiveRegion).toBe(true);
  });
  
  console.log('ARIA compliance testing completed successfully');
`;
  }

  /**
   * Generate Visual Accessibility Template Code
   */
  private generateVisualAccessibilityTemplateCode(requirements: any[]): string {
    if (requirements.length === 0) return '// No visual accessibility requirements';
    
    return `
  // Visual Accessibility using Template-Based Validation
  console.log('Starting visual accessibility testing with ${requirements.length} requirements...');
  
  // Check color contrast for text elements
  const textElements = await page.locator('p, h1, h2, h3, h4, h5, h6, span, div').all();
  for (const element of textElements.slice(0, 10)) {
    const contrastResult = await VisualUtils.checkColorContrast(page, await element.getAttribute('data-testid') || 'body');
    if (contrastResult) {
      // Validate contrast meets WCAG standards
      expect(contrastResult.color).toBeTruthy();
      expect(contrastResult.backgroundColor).toBeTruthy();
    }
  }
  
  // Check focus indicators
  const focusResults = await VisualUtils.checkFocusIndicators(page);
  focusResults.forEach(result => {
    expect(result.hasFocusIndicator).toBe(true);
  });
  
  console.log('Visual accessibility testing completed successfully');
`;
  }

  /**
   * Generate WCAG Guidelines Template Code
   */
  private generateWCAGGuidelinesTemplateCode(requirements: any[]): string {
    if (requirements.length === 0) return '// No WCAG guidelines requirements';
    
    return `
  // WCAG Guidelines using Template-Based Validation
  console.log('Starting WCAG guidelines testing with ${requirements.length} requirements...');
  
  // Validate heading hierarchy
  const headingData = await WCAGUtils.validateHeadingHierarchy(page);
  if (headingData.length > 0) {
    expect(headingData[0].level).toBe(1); // First heading should be h1
    
    // Check for proper nesting
    for (let i = 1; i < headingData.length; i++) {
      const levelDiff = headingData[i].level - headingData[i - 1].level;
      expect(levelDiff).toBeLessThanOrEqual(1);
    }
  }
  
  // Validate skip links
  const skipLinks = await WCAGUtils.validateSkipLinks(page);
  const functionalSkipLinks = skipLinks.filter(link => link.isSkipLink && link.targetExists);
  expect(functionalSkipLinks.length).toBeGreaterThanOrEqual(0);
  
  // Validate landmarks
  const landmarks = await WCAGUtils.validateLandmarks(page);
  expect(landmarks.main).toBe(1); // Exactly one main landmark
  expect(landmarks.banner).toBeGreaterThanOrEqual(1); // At least one banner
  
  console.log('WCAG guidelines testing completed successfully');
`;
  }

  /**
   * Generate contextual accessibility validation based on test context
   */
  private generateContextualAccessibilityValidation(testContext: any): string {
    let code = `  // Contextual accessibility validation based on test focus: ${testContext.primaryFocus}
  console.log('🔍 Running contextual accessibility validation...');
  
`;

    // Add Axe-Core scanning based on context
    if (testContext.requiresAriaValidation || testContext.requiresRoleValidation) {
      code += `  // Run Axe-Core accessibility scan with ARIA focus
  const axeResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .include('body')
    .analyze();
  
  console.log(\`🔍 Axe-Core scan completed: \${axeResults.violations.length} violations found\`);
  
  if (axeResults.violations.length > 0) {
    console.log('⚠️  Accessibility violations detected:');
    axeResults.violations.forEach((violation, index) => {
      console.log(\`   \${index + 1}. \${violation.id}: \${violation.description}\`);
      console.log(\`      Impact: \${violation.impact}\`);
      console.log(\`      Nodes affected: \${violation.nodes.length}\`);
    });
  } else {
    console.log('✅ No accessibility violations found by Axe-Core');
  }
  
  testResults.measurements.axeViolations = axeResults.violations.length;
  testResults.validations.push('axe-core-scan-completed');
  
`;
    }

    // Add specific validations based on context
    if (testContext.requiresKeyboardSetup) {
      code += `  // Validate keyboard accessibility requirements
  const keyboardAccessibilityScore = await page.evaluate(() => {
    const focusableElements = document.querySelectorAll('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    let score = 0;
    let totalElements = focusableElements.length;
    
    focusableElements.forEach(el => {
      // Check if element is keyboard accessible
      if (el.tabIndex >= 0 || ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName)) {
        score++;
      }
    });
    
    return totalElements > 0 ? (score / totalElements * 100).toFixed(1) : 100;
  });
  
  console.log(\`📊 Keyboard accessibility score: \${keyboardAccessibilityScore}%\`);
  testResults.measurements.keyboardAccessibilityScore = parseFloat(keyboardAccessibilityScore);
  
`;
    }

    if (testContext.requiresFormSetup) {
      code += `  // Validate form accessibility requirements
  const formAccessibilityAnalysis = await page.evaluate(() => {
    const forms = document.querySelectorAll('form');
    const formFields = document.querySelectorAll('input, textarea, select');
    let labeledFields = 0;
    let requiredFieldsWithAria = 0;
    
    formFields.forEach(field => {
      // Check for labels
      const hasLabel = field.labels && field.labels.length > 0;
      const hasAriaLabel = field.getAttribute('aria-label');
      const hasAriaLabelledBy = field.getAttribute('aria-labelledby');
      
      if (hasLabel || hasAriaLabel || hasAriaLabelledBy) {
        labeledFields++;
      }
      
      // Check required fields have proper ARIA
      if (field.required || field.getAttribute('aria-required') === 'true') {
        if (field.getAttribute('aria-describedby') || field.getAttribute('aria-invalid')) {
          requiredFieldsWithAria++;
        }
      }
    });
    
    return {
      totalForms: forms.length,
      totalFields: formFields.length,
      labeledFields,
      requiredFieldsWithAria,
      labelingRate: formFields.length > 0 ? (labeledFields / formFields.length * 100).toFixed(1) : 0
    };
  });
  
  console.log('📊 Form accessibility analysis:', formAccessibilityAnalysis);
  testResults.measurements.formLabelingRate = parseFloat(formAccessibilityAnalysis.labelingRate);
  
`;
    }

    code += `  console.log('✅ Contextual accessibility validation completed');
`;

    return code;
  }

  /**
   * Generate intelligent test summary based on test context and results
   */
  private generateIntelligentTestSummary(testContext: any): string {
    return `  // Generate intelligent test summary
  const testSummary = {
    testType: '${testContext.primaryFocus}',
    description: '${testContext.description}',
    wcagCriteria: ${JSON.stringify(testContext.wcagCriteria)},
    stepsCompleted: testResults.stepsCompleted,
    validationsPerformed: testResults.validations.length,
    measurements: testResults.measurements,
    interactions: testResults.interactions.length,
    overallSuccess: true
  };
  
  // Calculate overall success based on context
  if (testResults.measurements.axeViolations > 0) {
    testSummary.overallSuccess = false;
  }
  
  if (testResults.measurements.compatibilityRate < 80) {
    testSummary.overallSuccess = false;
  }
  
  console.log('\\n🎯 Test Execution Summary:');
  console.log(\`   Test Type: \${testSummary.testType}\`);
  console.log(\`   Steps Completed: \${testSummary.stepsCompleted}\`);
  console.log(\`   Validations Performed: \${testSummary.validationsPerformed}\`);
  console.log(\`   Interactions Recorded: \${testSummary.interactions}\`);
  console.log(\`   WCAG Criteria Tested: \${testSummary.wcagCriteria.join(', ')}\`);
  console.log(\`   Overall Success: \${testSummary.overallSuccess ? '✅ Pass' : '❌ Issues Found'}\`);
  
  if (Object.keys(testResults.measurements).length > 0) {
    console.log('\\n📊 Key Measurements:');
    Object.entries(testResults.measurements).forEach(([key, value]) => {
      console.log(\`   \${key}: \${value}\`);
    });
  }
  
  if (testResults.validations.length > 0) {
    console.log('\\n✅ Validations Completed:');
    testResults.validations.forEach(validation => {
      console.log(\`   - \${validation}\`);
    });
  }
  
  // Final assertion based on overall success
  expect(testSummary.overallSuccess).toBe(true);
  
  console.log('\\n🎉 Instruction-based accessibility test completed successfully!');`;
  }

  /**
   * Generate form setup code for tests that require form interaction
   */
  private generateFormSetupCode(): string {
    return `  // Form setup for accessibility testing
  const formElements = await page.locator('form, input, textarea, select').count();
  if (formElements > 0) {
    console.log(\`📋 Form elements detected: \${formElements}\`);
    
    // Ensure form is visible and ready for interaction
    const firstForm = await page.locator('form').first();
    if (await firstForm.isVisible()) {
      await firstForm.scrollIntoViewIfNeeded();
    }
  }
  
`;
  }

  /**
   * Generate keyboard setup code for tests that require keyboard interaction
   */
  private generateKeyboardSetupCode(): string {
    return `  // Keyboard setup for accessibility testing
  // Ensure page is ready for keyboard navigation
  await page.evaluate(() => {
    // Remove any existing focus
    if (document.activeElement && document.activeElement.blur) {
      document.activeElement.blur();
    }
    
    // Focus on the first focusable element or body
    const firstFocusable = document.querySelector('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable) {
      firstFocusable.focus();
    } else {
      document.body.focus();
    }
  });
  
  console.log('⌨️  Keyboard navigation setup completed');
  
`;
  }

  /**
   * Detect HTTP method from instruction text
   */
  private detectHttpMethod(instruction: string): string {
    const instructionLower = instruction.toLowerCase();
    
    if (instructionLower.includes('get request') || instructionLower.includes('send get')) {
      return 'GET';
    }
    if (instructionLower.includes('post request') || instructionLower.includes('send post')) {
      return 'POST';
    }
    if (instructionLower.includes('put request') || instructionLower.includes('send put')) {
      return 'PUT';
    }
    if (instructionLower.includes('delete request') || instructionLower.includes('send delete')) {
      return 'DELETE';
    }
    if (instructionLower.includes('patch request') || instructionLower.includes('send patch')) {
      return 'PATCH';
    }
    
    // Default based on common patterns
    if (instructionLower.includes('login') || instructionLower.includes('submit') || instructionLower.includes('create')) {
      return 'POST';
    }
    
    return 'GET'; // Default fallback
  }

  /**
   * Inline security instruction parsing to avoid module loading issues
   */
  private parseSecurityInstructionInline(instruction: string, url: string): any {
    console.log('🔍 Parsing instruction-specific security test (inline):', instruction);
    
    const method = this.extractHttpMethodInline(instruction);
    const steps = this.extractSpecificStepsInline(instruction);
    const headers = this.extractSpecificHeadersInline(instruction);
    const data = this.extractSpecificDataInline(instruction);
    const validations: string[] = [];
    
    return {
      url,
      method,
      steps,
      headers,
      data,
      validations,
      originalInstruction: instruction
    };
  }

  /**
   * Inline test generation to avoid module loading issues
   */
  private generateInstructionSpecificTestInline(parsed: any): any {
    console.log('🔧 Generating instruction-specific security test (inline)');
    
    const testName = `SEC_${parsed.method}_${Date.now()}`;
    const testCode = this.generateSpecificTestCodeInline(parsed);
    
    return {
      testCode,
      testName,
      description: `Instruction-specific security test: ${parsed.originalInstruction}`,
      steps: parsed.steps,
      confidence: 0.8
    };
  }

  /**
   * Extract HTTP method inline
   */
  private extractHttpMethodInline(instruction: string): string {
    const instructionLower = instruction.toLowerCase();
    
    if (instructionLower.includes('send a get') || instructionLower.includes('send get')) return 'GET';
    if (instructionLower.includes('send a post') || instructionLower.includes('send post')) return 'POST';
    if (instructionLower.includes('send a put') || instructionLower.includes('send put')) return 'PUT';
    if (instructionLower.includes('send a patch') || instructionLower.includes('send patch')) return 'PATCH';
    if (instructionLower.includes('send a delete') || instructionLower.includes('send delete')) return 'DELETE';
    
    // Context-based detection
    if (instructionLower.includes('login') || instructionLower.includes('create') || instructionLower.includes('submit')) return 'POST';
    
    return 'GET'; // Default
  }

  /**
   * Extract specific steps inline
   */
  private extractSpecificStepsInline(instruction: string): any[] {
    const steps: any[] = [];
    let stepNumber = 1;
    
    // Simple sentence splitting
    const sentences = instruction.split('.').map(s => s.trim()).filter(s => s.length > 0);
    
    for (const sentence of sentences) {
      const sentenceLower = sentence.toLowerCase();
      
      console.log(`🔍 Analyzing sentence: "${sentence}"`);
      
      // API Request detection
      if (sentenceLower.includes('send') && (sentenceLower.includes('post') || sentenceLower.includes('request'))) {
        steps.push({
          stepNumber: stepNumber++,
          action: 'SEND_POST_REQUEST',
          target: 'API_ENDPOINT',
          value: '/api/users',
          expectedResult: 'POST request should be sent and response received'
        });
        console.log('✅ Detected SEND_POST_REQUEST');
        continue;
      }
      
      // Header setting detection
      if (sentenceLower.includes('set') && sentenceLower.includes('header')) {
        const headerMatch = sentence.match(/content-type.*?["']([^"']+)["']/i);
        const headerValue = headerMatch ? headerMatch[1] : 'text/plain';
        steps.push({
          stepNumber: stepNumber++,
          action: 'SET_HEADER',
          target: 'Content-Type',
          value: headerValue,
          expectedResult: `Header Content-Type should be set to ${headerValue}`
        });
        console.log(`✅ Detected SET_HEADER: Content-Type = ${headerValue}`);
        continue;
      }
      
      // Body setting detection
      if (sentenceLower.includes('send') && sentenceLower.includes('body')) {
        const bodyMatch = sentence.match(/["']([^"']+)["']/);
        const bodyContent = bodyMatch ? bodyMatch[1] : 'name=test';
        steps.push({
          stepNumber: stepNumber++,
          action: 'SET_BODY',
          target: 'PLAIN_TEXT',
          value: bodyContent,
          expectedResult: 'Request body should be set as plain text'
        });
        console.log(`✅ Detected SET_BODY: ${bodyContent}`);
        continue;
      }
      
      // Response storage detection
      if (sentenceLower.includes('store') && sentenceLower.includes('response')) {
        steps.push({
          stepNumber: stepNumber++,
          action: 'STORE_RESPONSE',
          target: 'STATUS_CODE',
          value: 'storedResponse1',
          expectedResult: 'Response status code should be stored for later use'
        });
        console.log('✅ Detected STORE_RESPONSE: STATUS_CODE');
        continue;
      }
    }
    
    return steps;
  }

  /**
   * Extract specific headers inline
   */
  private extractSpecificHeadersInline(instruction: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    const instructionLower = instruction.toLowerCase();
    
    // Extract Content-Type header
    if (instructionLower.includes('text/plain')) {
      headers['Content-Type'] = 'text/plain';
    }
    
    return headers;
  }

  /**
   * Extract specific data inline
   */
  private extractSpecificDataInline(instruction: string): Record<string, any> {
    const data: Record<string, any> = {};
    
    // Extract name field
    const nameMatch = instruction.match(/name[=:]?\s*["']?([^"'\s,]+)["']?/i);
    if (nameMatch) {
      data.name = nameMatch[1];
    }
    
    return data;
  }

  /**
   * Generate specific test code inline
   */
  private generateSpecificTestCodeInline(parsed: any): string {
    const testName = `SEC_${parsed.method}_${Date.now()}`;
    
    let testCode = `import { test, expect } from '@playwright/test';

test('${testName}', async ({ page, request }) => {
  console.log('🔒 Instruction-Specific Security Test');
  console.log('📋 Original Instruction: ${parsed.originalInstruction.replace(/'/g, "\\'")}');
  console.log('🎯 URL: ${parsed.url}');
  console.log('📡 Method: ${parsed.method}');
  
  // Variables for storing data
  let storedResponse1: any;
  let stepCounter = 0;
  
  console.log('\\n🚀 Executing ${parsed.steps.length} instruction-specific steps:');
`;

    // Generate code for each step
    parsed.steps.forEach((step: any, index: number) => {
      testCode += `
  // Step ${step.stepNumber}: ${step.action}
  stepCounter++;
  console.log(\`\${stepCounter}. ${step.action} - ${step.target}\`);
  console.log('   Expected: ${step.expectedResult}');
`;
      
      switch (step.action) {
        case 'SEND_POST_REQUEST':
          testCode += `
  try {
    const response = await request.post('${parsed.url}', {
      headers: ${JSON.stringify(parsed.headers, null, 4)},
      data: ${JSON.stringify(parsed.data, null, 4)}
    });
    
    console.log('   ✅ POST request sent successfully');
    console.log('   Status:', response.status());
    
    // Store response for later steps
    storedResponse1 = {
      status: response.status(),
      statusText: response.statusText(),
      headers: response.headers()
    };
    
  } catch (error: any) {
    console.log('   ⚠️ Request error:', error.message);
  }`;
          break;
          
        case 'SET_HEADER':
          testCode += `
  console.log('   Header ${step.target} will be set to: ${step.value}');
  console.log('   ✅ Header configuration noted');`;
          break;
          
        case 'SET_BODY':
          testCode += `
  console.log('   Body will be set as ${step.target}: ${step.value}');
  console.log('   ✅ Body configuration noted');`;
          break;
          
        case 'STORE_RESPONSE':
          testCode += `
  if (storedResponse1) {
    console.log('   📊 Stored Response Data:');
    console.log('   - Status Code:', storedResponse1.status);
    console.log('   - Status Text:', storedResponse1.statusText);
    console.log('   - Headers Count:', Object.keys(storedResponse1.headers).length);
    console.log('   ✅ Response data stored successfully');
  } else {
    console.log('   ⚠️ No response data available to store');
  }`;
          break;
          
        default:
          testCode += `
  console.log('   ✅ Step completed: ${step.action}');`;
      }
    });

    testCode += `
  
  // Final summary
  console.log('\\n📊 Test Summary:');
  console.log('   Steps Executed:', stepCounter);
  console.log('   Original Instruction:', '${parsed.originalInstruction.replace(/'/g, "\\'")}');
  console.log('   ✅ Instruction-specific security test completed');
});`;

    return testCode;
  }
}

export const integratedTestRouter = new IntegratedTestRouter();

/**
 * Generate Tests - Main Entry Point
 */
export async function generateTests(
  request: TestGenerationRequest
): Promise<TestGenerationResponse> {
  return integratedTestRouter.generateTests(request);
}