/**
 * Intelligent Playwright Code Generator
 * 
 * Generates high-quality, instruction-specific Playwright test code based on
 * intelligently parsed instructions. Focuses on creating executable, maintainable,
 * and reliable test code that directly implements user intentions.
 */

import { IntelligentParsedInstruction, AtomicTestStep, TestAction, TestTarget, ValidationRule } from './intelligentInstructionParser';

export interface GeneratedTestCode {
  testCode: string;
  testName: string;
  description: string;
  steps: string[];
  confidence: number;
}

export class IntelligentPlaywrightGenerator {
  /**
   * Generate Playwright test code from parsed instruction
   */
  generateTestCode(parsedInstruction: IntelligentParsedInstruction): GeneratedTestCode {
    const testName = this.generateTestName(parsedInstruction);
    const steps = this.generateSteps(parsedInstruction);
    const testCode = this.buildTestCode(testName, steps, parsedInstruction);

    return {
      testCode,
      testName,
      description: `${parsedInstruction.primaryIntent} - ${parsedInstruction.testDomain}`,
      steps,
      confidence: parsedInstruction.confidence
    };
  }

  /**
   * Generate test name from instruction
   */
  private generateTestName(instruction: IntelligentParsedInstruction): string {
    const domain = instruction.testDomain || 'Test';
    const intent = instruction.primaryIntent || 'Execute';
    return `${domain} - ${intent}`;
  }

  /**
   * Generate individual test steps
   */
  private generateSteps(instruction: IntelligentParsedInstruction): string[] {
    const steps: string[] = [];

    // Add action steps
    for (const action of instruction.atomicSteps) {
      steps.push(this.generateStepDescription(action));
    }

    // Add validation steps
    for (const atomicStep of instruction.atomicSteps) {
      for (const validation of atomicStep.validations) {
        steps.push(`Verify: ${validation.description}`);
      }
    }

    return steps;
  }

  /**
   * Generate description for a single step
   */
  private generateStepDescription(step: AtomicTestStep): string {
    const action = step.action.method;
    const target = step.target.selector || step.target.identifier;
    return `${action} on ${target}`;
  }

  /**
   * Build complete Playwright test code
   */
  private buildTestCode(testName: string, steps: string[], instruction: IntelligentParsedInstruction): string {
    const code = `import { test, expect } from '@playwright/test';

test('${testName}', async ({ page }) => {
  // Test: ${instruction.primaryIntent}
  // Domain: ${instruction.testDomain}
  // Confidence: ${(instruction.confidence * 100).toFixed(1)}%
  
  try {
${this.generatePlaywrightSteps(instruction)}
    
    console.log('✅ Test completed successfully');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
});`;

    return code;
  }

  /**
   * Generate Playwright-specific code for steps
   */
  private generatePlaywrightSteps(instruction: IntelligentParsedInstruction): string {
    let code = '';

    // Action steps
    for (const step of instruction.atomicSteps) {
      code += this.generateActionCode(step);
    }

    return code;
  }

  /**
   * Generate code for an action step
   */
  private generateActionCode(step: AtomicTestStep): string {
    const selector = step.target.selector || `'${step.target.identifier}'`;
    const method = step.action.method.toLowerCase();

    let code = '';

    switch (method) {
      case 'click':
        code += `    await page.click(${selector});\n`;
        code += `    await page.waitForTimeout(500);\n`;
        break;
      case 'fill':
      case 'type':
        const value = step.parameters?.value || 'test';
        code += `    await page.fill(${selector}, '${value}');\n`;
        break;
      case 'select':
        const selectValue = step.parameters?.value || '';
        code += `    await page.selectOption(${selector}, '${selectValue}');\n`;
        break;
      case 'check':
        code += `    await page.check(${selector});\n`;
        break;
      case 'uncheck':
        code += `    await page.uncheck(${selector});\n`;
        break;
      case 'hover':
        code += `    await page.hover(${selector});\n`;
        break;
      case 'scroll':
        code += `    await page.evaluate(() => window.scrollBy(0, window.innerHeight));\n`;
        break;
      case 'navigate':
        const url = step.parameters?.url || 'https://example.com';
        code += `    await page.goto('${url}');\n`;
        code += `    await page.waitForLoadState('networkidle');\n`;
        break;
      case 'wait':
        const timeout = step.parameters?.timeout || 1000;
        code += `    await page.waitForTimeout(${timeout});\n`;
        break;
      default:
        code += `    // Action: ${method}\n`;
    }

    code += '\n';
    return code;
  }
}
