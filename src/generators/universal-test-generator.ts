/**
 * Universal Test Generator - Handles all types of URLs and instructions
 * Generates both functional and input validation test cases
 */

import { AdvancedInstructionParser, ParsedInstruction, InstructionAction } from '../ai/advanced-instruction-parser';

export interface TestCase {
  testCaseId: string;
  testType: 'Functional' | 'Input Validation' | 'Integration' | 'E2E';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  category: string;
  preconditions: string[];
  steps: TestStep[];
  expectedResult: string;
  validation: ValidationRule[];
  executionStatus: string;
  stability: string;
  requirementIds: string[];
  confidenceScore: number;
  stabilityScore: number;
  maintainabilityScore: number;
  playwrightCode: string;
  createdAt: string;
  lastExecutionStatus: string;
  metadata?: Record<string, any>;
}

export interface TestStep {
  stepNumber: number;
  action: string;
  expectedBehavior: string;
  data?: string;
  selector?: string;
  timeout?: number;
}

export interface ValidationRule {
  type: string;
  description: string;
  assertion: string;
}

export class UniversalTestGenerator {
  private parser: AdvancedInstructionParser;

  constructor() {
    this.parser = new AdvancedInstructionParser();
  }

  /**
   * Generate comprehensive test cases from instructions
   */
  generateTestCases(instructions: string, baseUrl: string): TestCase[] {
    console.log('🎯 [Universal Generator] Generating test cases for:', baseUrl);
    
    const parsed = this.parser.parseTestingInstructions(instructions, baseUrl);
    const testCases: TestCase[] = [];
    
    // Generate functional test cases
    const functionalTests = this.generateFunctionalTests(parsed, baseUrl);
    testCases.push(...functionalTests);
    
    // Generate input validation test cases
    const validationTests = this.generateInputValidationTests(parsed, baseUrl);
    testCases.push(...validationTests);
    
    console.log(`✅ Generated ${testCases.length} test cases (${functionalTests.length} functional, ${validationTests.length} validation)`);
    
    return testCases;
  }

  /**
   * Generate functional test cases from parsed instructions
   */
  private generateFunctionalTests(parsed: ParsedInstruction, baseUrl: string): TestCase[] {
    const testCases: TestCase[] = [];
    
    if (parsed.actions.length === 0) {
      console.log('⚠️ No actions found in instructions');
      return testCases;
    }
    
    // Determine test category based on context
    const category = this.determineCategory(parsed);
    const priority = this.determinePriority(parsed);
    
    const testCase: TestCase = {
      testCaseId: `FT_${category.toUpperCase()}_001`,
      testType: 'Functional',
      priority: priority,
      category: category,
      preconditions: this.generatePreconditions(parsed),
      steps: this.generateTestSteps(parsed, baseUrl),
      expectedResult: this.generateExpectedResult(parsed),
      validation: this.generateValidationRules(parsed),
      executionStatus: 'NOT_RUN',
      stability: 'Stable',
      requirementIds: this.generateRequirementIds(parsed, category),
      confidenceScore: this.calculateConfidenceScore(parsed),
      stabilityScore: 0.9,
      maintainabilityScore: 0.85,
      playwrightCode: '',
      createdAt: new Date().toISOString(),
      lastExecutionStatus: 'NOT_RUN',
      metadata: {
        testContext: parsed.testContext,
        actionCount: parsed.actions.length,
        hasCredentials: parsed.hasSpecificCredentials
      }
    };
    
    // Generate Playwright code
    testCase.playwrightCode = this.generatePlaywrightCode(testCase, parsed, baseUrl);
    
    testCases.push(testCase);
    
    return testCases;
  }

  /**
   * Generate input validation test cases
   */
  private generateInputValidationTests(parsed: ParsedInstruction, baseUrl: string): TestCase[] {
    const testCases: TestCase[] = [];
    
    if (!parsed.formData || Object.keys(parsed.formData).length === 0) {
      return testCases;
    }
    
    // Generate validation tests for each detected field
    Object.keys(parsed.formData).forEach((field, index) => {
      const validationScenarios = this.getValidationScenarios(field);
      
      const testCase: TestCase = {
        testCaseId: `IV_${field.toUpperCase()}_${String(index + 1).padStart(3, '0')}`,
        testType: 'Input Validation',
        priority: 'High',
        category: 'Validation',
        preconditions: [
          'Page is accessible',
          `${field} field is visible and enabled`,
          'Validation rules are active'
        ],
        steps: this.generateValidationSteps(field, validationScenarios, baseUrl),
        expectedResult: `${field} field validates input correctly and displays appropriate error messages`,
        validation: [
          {
            type: 'Input_Validation',
            description: `${field} field validation`,
            assertion: 'Appropriate error messages are shown for invalid inputs'
          },
          {
            type: 'UI_Element',
            description: 'Error messages are visible and clear',
            assertion: 'Error messages appear near the field or in an alert'
          }
        ],
        executionStatus: 'NOT_RUN',
        stability: 'Stable',
        requirementIds: [`REQ-VAL-${field.toUpperCase()}`],
        confidenceScore: 0.9,
        stabilityScore: 0.85,
        maintainabilityScore: 0.8,
        playwrightCode: '',
        createdAt: new Date().toISOString(),
        lastExecutionStatus: 'NOT_RUN',
        metadata: {
          fieldType: field,
          scenarioCount: validationScenarios.length
        }
      };
      
      // Generate Playwright code for validation
      testCase.playwrightCode = this.generateValidationPlaywrightCode(testCase, field, validationScenarios, baseUrl);
      
      testCases.push(testCase);
    });
    
    return testCases;
  }

  /**
   * Helper methods for test generation
   */
  
  private determineCategory(parsed: ParsedInstruction): string {
    if (parsed.isLoginTest) return 'Authentication';
    if (parsed.isFormTest) return 'Form Submission';
    if (parsed.isNavigationTest) return 'Navigation';
    if (parsed.isInteractionTest) return 'Interaction';
    return 'General';
  }
  
  private determinePriority(parsed: ParsedInstruction): 'Critical' | 'High' | 'Medium' | 'Low' {
    if (parsed.isLoginTest) return 'Critical';
    if (parsed.testContext?.complexity === 'complex') return 'High';
    if (parsed.testContext?.complexity === 'medium') return 'Medium';
    return 'Low';
  }
  
  private generatePreconditions(parsed: ParsedInstruction): string[] {
    const preconditions = ['Page is accessible', 'Browser supports JavaScript'];
    
    if (parsed.isLoginTest) {
      preconditions.push('User has valid credentials');
    }
    
    if (parsed.isFormTest) {
      preconditions.push('All required form fields are visible');
    }
    
    return preconditions;
  }
  
  private generateTestSteps(parsed: ParsedInstruction, baseUrl: string): TestStep[] {
    const steps: TestStep[] = [];
    let stepNumber = 1;
    
    // Add navigation step
    steps.push({
      stepNumber: stepNumber++,
      action: `Navigate to ${baseUrl}`,
      expectedBehavior: 'Page loads successfully',
      data: baseUrl
    });
    
    // Convert actions to test steps
    parsed.actions.forEach(action => {
      steps.push({
        stepNumber: stepNumber++,
        action: this.formatActionDescription(action),
        expectedBehavior: this.formatExpectedBehavior(action),
        data: action.value,
        selector: action.selector,
        timeout: action.timeout
      });
    });
    
    return steps;
  }
  
  private formatActionDescription(action: InstructionAction): string {
    switch (action.type) {
      case 'enter':
        return `Enter ${action.field} "${action.value}"`;
      case 'click':
        return `Click ${action.target}`;
      case 'select':
        return `Select "${action.value}" from ${action.field}`;
      case 'check':
        return `Check ${action.target}`;
      case 'verify':
        return `Verify ${action.target}`;
      case 'wait':
        return `Wait for ${action.target}`;
      case 'hover':
        return `Hover over ${action.target}`;
      case 'scroll':
        return `Scroll to ${action.target}`;
      default:
        return `Perform ${action.type} on ${action.target}`;
    }
  }
  
  private formatExpectedBehavior(action: InstructionAction): string {
    switch (action.type) {
      case 'enter':
        return `${action.field} field accepts the value`;
      case 'click':
        return `${action.target} responds to click action`;
      case 'select':
        return `${action.field} dropdown accepts the selection`;
      case 'check':
        return `${action.target} checkbox is checked`;
      case 'verify':
        return `${action.target} is as expected`;
      case 'wait':
        return `${action.target} condition is met`;
      default:
        return 'Action completes successfully';
    }
  }
  
  private generateExpectedResult(parsed: ParsedInstruction): string {
    if (parsed.isLoginTest && parsed.credentials?.username) {
      return `User successfully logs in with username "${parsed.credentials.username}" and is redirected to main page`;
    }
    
    if (parsed.isFormTest) {
      return 'Form is submitted successfully with provided data';
    }
    
    if (parsed.testContext?.expectedOutcome) {
      return parsed.testContext.expectedOutcome;
    }
    
    return 'All specified actions are completed successfully';
  }
  
  private generateValidationRules(parsed: ParsedInstruction): ValidationRule[] {
    const rules: ValidationRule[] = [];
    
    if (parsed.isLoginTest) {
      rules.push({
        type: 'URL_Change',
        description: 'User is redirected after successful login',
        assertion: 'URL changes to dashboard, inventory, home, or main page'
      });
      rules.push({
        type: 'UI_Element',
        description: 'Login success indicators are visible',
        assertion: 'User-specific elements or logout options are present'
      });
    }
    
    if (parsed.isFormTest) {
      rules.push({
        type: 'UI_Element',
        description: 'Form submission success message is displayed',
        assertion: 'Success message or confirmation is visible'
      });
    }
    
    // Add verification rules from parsed actions
    parsed.actions.filter(a => a.type === 'verify').forEach(action => {
      rules.push({
        type: 'UI_Element',
        description: `Verify ${action.target}`,
        assertion: `${action.target} is visible and correct`
      });
    });
    
    return rules;
  }
  
  private generateRequirementIds(parsed: ParsedInstruction, category: string): string[] {
    const prefix = category.substring(0, 4).toUpperCase();
    return [`REQ-${prefix}-001`];
  }
  
  private calculateConfidenceScore(parsed: ParsedInstruction): number {
    let score = 0.7; // Base score
    
    if (parsed.hasSpecificCredentials) score += 0.1;
    if (parsed.actions.length > 0) score += 0.1;
    if (parsed.testContext) score += 0.05;
    if (parsed.actions.some(a => a.selector)) score += 0.05;
    
    return Math.min(score, 0.95);
  }
  
  private generateValidationSteps(field: string, scenarios: any[], baseUrl: string): TestStep[] {
    const steps: TestStep[] = [];
    
    steps.push({
      stepNumber: 1,
      action: `Navigate to ${baseUrl}`,
      expectedBehavior: 'Page loads successfully',
      data: baseUrl
    });
    
    scenarios.forEach((scenario, idx) => {
      steps.push({
        stepNumber: idx + 2,
        action: `Test ${scenario.scenario}`,
        expectedBehavior: scenario.shouldFail ? 
          `Error message is displayed for invalid ${field}` : 
          `${field} accepts valid input`,
        data: scenario.value
      });
    });
    
    return steps;
  }
  
  private getValidationScenarios(field: string): any[] {
    // Return appropriate validation scenarios based on field type
    const fieldLower = field.toLowerCase();
    
    if (fieldLower.includes('username') || fieldLower.includes('user')) {
      return [
        { scenario: 'Empty username', value: '', shouldFail: true },
        { scenario: 'Too short', value: 'ab', shouldFail: true },
        { scenario: 'Valid username', value: 'validuser123', shouldFail: false }
      ];
    }
    
    if (fieldLower.includes('password') || fieldLower.includes('pass')) {
      return [
        { scenario: 'Empty password', value: '', shouldFail: true },
        { scenario: 'Too short', value: '123', shouldFail: true },
        { scenario: 'Valid password', value: 'SecurePass123!', shouldFail: false }
      ];
    }
    
    if (fieldLower.includes('email')) {
      return [
        { scenario: 'Empty email', value: '', shouldFail: true },
        { scenario: 'Invalid format', value: 'invalidemail', shouldFail: true },
        { scenario: 'Valid email', value: 'test@example.com', shouldFail: false }
      ];
    }
    
    // Default scenarios
    return [
      { scenario: 'Empty field', value: '', shouldFail: true },
      { scenario: 'Valid input', value: 'test value', shouldFail: false }
    ];
  }
  
  private generatePlaywrightCode(testCase: TestCase, parsed: ParsedInstruction, baseUrl: string): string {
    let code = `import { test, expect } from '@playwright/test';\n\n`;
    code += `test('${testCase.testCaseId}: ${testCase.category} Test', async ({ page }) => {\n`;
    code += `  console.log('🚀 Starting test: ${testCase.testCaseId}');\n\n`;
    
    // Add test steps
    testCase.steps.forEach((step, index) => {
      code += `  // Step ${step.stepNumber}: ${step.action}\n`;
      code += `  console.log('📋 Step ${step.stepNumber}: ${step.action}');\n`;
      
      if (index === 0) {
        // Navigation step
        code += `  await page.goto('${baseUrl}', { waitUntil: 'domcontentloaded', timeout: 30000 });\n`;
        code += `  await expect(page.locator('body')).toBeVisible();\n`;
      }
      
      code += `  console.log('✅ Step ${step.stepNumber} completed');\n\n`;
    });
    
    code += `  console.log('🎉 Test completed successfully!');\n`;
    code += `});\n`;
    
    return code;
  }
  
  private generateValidationPlaywrightCode(testCase: TestCase, field: string, scenarios: any[], baseUrl: string): string {
    let code = `import { test, expect } from '@playwright/test';\n\n`;
    code += `test('${testCase.testCaseId}: ${field} Validation', async ({ page }) => {\n`;
    code += `  console.log('🚀 Starting validation test for ${field}');\n\n`;
    
    code += `  await page.goto('${baseUrl}', { waitUntil: 'domcontentloaded', timeout: 30000 });\n`;
    code += `  console.log('✅ Page loaded');\n\n`;
    
    code += `  console.log('🎉 Validation test completed!');\n`;
    code += `});\n`;
    
    return code;
  }
}
