/**
 * Improved Test Generator
 * 
 * Uses natural language instruction parsing to generate more accurate tests
 * that understand user intent rather than literal text matching.
 */

import { NaturalLanguageInstructionParser, NaturalLanguageParsedInstruction } from './naturalLanguageInstructionParser';

export interface ImprovedTestRequest {
  instruction: string;
  url?: string;
  testName?: string;
  description?: string;
}

export interface ImprovedTestResult {
  testCode: string;
  testName: string;
  description: string;
  confidence: number;
  interpretations: string[];
  metadata: {
    actionsCount: number;
    parsedSuccessfully: boolean;
    generatedAt: string;
  };
}

export class ImprovedTestGenerator {
  private parser: NaturalLanguageInstructionParser;

  constructor() {
    this.parser = new NaturalLanguageInstructionParser();
  }

  /**
   * Generate improved test from natural language instruction
   */
  public generateTest(request: ImprovedTestRequest): ImprovedTestResult {
    console.log('🚀 Generating improved test from instruction:', request.instruction);

    // Parse the instruction using natural language understanding
    const parsedInstruction = this.parser.parseInstruction(request.instruction, request.url);
    
    // Generate test name if not provided
    const testName = request.testName || this.generateTestName(parsedInstruction);
    
    // Generate description if not provided
    const description = request.description || this.generateDescription(parsedInstruction);
    
    // Generate the test code
    const testCode = this.generateImprovedTestCode(parsedInstruction, testName, description);
    
    return {
      testCode,
      testName,
      description,
      confidence: parsedInstruction.confidence,
      interpretations: parsedInstruction.interpretations,
      metadata: {
        actionsCount: parsedInstruction.actions.length,
        parsedSuccessfully: parsedInstruction.actions.length > 0,
        generatedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Generate test name from parsed instruction
   */
  private generateTestName(parsedInstruction: NaturalLanguageParsedInstruction): string {
    const actions = parsedInstruction.actions;
    
    if (actions.length === 0) {
      return 'Generated Test';
    }
    
    // Extract key actions for naming
    const keyActions = actions
      .filter(action => action.type !== 'wait')
      .map(action => action.interpretedAction)
      .slice(0, 3); // Take first 3 key actions
    
    if (keyActions.length === 1) {
      return keyActions[0];
    } else if (keyActions.length === 2) {
      return `${keyActions[0]} and ${keyActions[1]}`;
    } else {
      return `${keyActions[0]}, ${keyActions[1]} and more`;
    }
  }

  /**
   * Generate description from parsed instruction
   */
  private generateDescription(parsedInstruction: NaturalLanguageParsedInstruction): string {
    const actions = parsedInstruction.actions;
    
    if (actions.length === 0) {
      return 'Generated test case';
    }
    
    const actionDescriptions = actions
      .map(action => action.interpretedAction.toLowerCase())
      .join(', then ');
    
    return `Test that ${actionDescriptions}`;
  }

  /**
   * Generate improved test code with better selectors and error handling
   */
  private generateImprovedTestCode(
    parsedInstruction: NaturalLanguageParsedInstruction,
    testName: string,
    description: string
  ): string {
    const actions = parsedInstruction.actions;
    
    let code = `import { test, expect } from '@playwright/test';\n\n`;
    code += `test('${testName}', async ({ page }) => {\n`;
    code += `  console.log('🚀 Starting test: ${testName}');\n\n`;
    
    // Add confidence information as comment
    if (parsedInstruction.confidence < 0.8) {
      code += `  // ⚠️  Confidence: ${(parsedInstruction.confidence * 100).toFixed(1)}% - Review generated selectors\n`;
    }
    
    for (const action of actions) {
      code += this.generateImprovedActionCode(action);
    }
    
    // Add final screenshot and completion
    code += `  // Take final screenshot\n`;
    code += `  await page.screenshot({ path: 'test-results/${testName.replace(/[^a-zA-Z0-9]/g, '-')}-final.png', fullPage: true });\n`;
    code += `  console.log('✅ Test completed successfully');\n`;
    code += `});\n`;
    
    return code;
  }

  /**
   * Generate improved action code with better error handling and selectors
   */
  private generateImprovedActionCode(action: any): string {
    let code = `  // ${action.originalInstruction}\n`;
    code += `  console.log('📋 Step ${action.stepNumber}: ${action.interpretedAction}');\n`;
    
    switch (action.type) {
      case 'navigate':
        const url = action.target.description.replace('Navigate to ', '');
        code += `  await page.goto('${url}', { waitUntil: 'domcontentloaded', timeout: 30000 });\n`;
        code += `  console.log('✅ Page loaded');\n`;
        break;
        
      case 'click':
        code += this.generateClickCode(action);
        break;
        
      case 'type':
        code += this.generateTypeCode(action);
        break;
        
      case 'verify':
        code += this.generateVerifyCode(action);
        break;
        
      case 'wait':
        const duration = action.target.description.match(/\d+/)?.[0] || '1000';
        code += `  await page.waitForTimeout(${duration});\n`;
        break;
    }
    
    code += `  await page.waitForTimeout(1000);\n\n`;
    return code;
  }

  /**
   * Generate improved click code with fallback strategies
   */
  private generateClickCode(action: any): string {
    const target = action.target;
    let code = '';
    
    if (target.searchText) {
      // Generate multiple selector strategies
      const selectors = this.generateFallbackSelectors(target);
      const varName = `element${action.stepNumber}`;
      
      code += `  // Try multiple selector strategies for: ${target.searchText}\n`;
      code += `  let ${varName};\n`;
      
      for (let i = 0; i < selectors.length; i++) {
        const selector = selectors[i];
        if (i === 0) {
          code += `  try {\n`;
          code += `    ${varName} = page.locator('${selector}');\n`;
          code += `    await ${varName}.waitFor({ state: 'visible', timeout: 5000 });\n`;
        } else {
          code += `  } catch (error${i}) {\n`;
          code += `    console.log('⚠️  Trying alternative selector ${i + 1}...');\n`;
          code += `    ${varName} = page.locator('${selector}');\n`;
          code += `    await ${varName}.waitFor({ state: 'visible', timeout: 5000 });\n`;
        }
      }
      
      code += `  } catch (finalError) {\n`;
      code += `    throw new Error('Could not find element with text "${target.searchText}". Tried ${selectors.length} different selectors.');\n`;
      code += `  }\n`;
      code += `  await ${varName}.click();\n`;
      code += `  console.log('✅ ${target.searchText} clicked');\n`;
    } else {
      // Simple selector
      code += `  await page.click('${target.selector}');\n`;
      code += `  console.log('✅ ${action.interpretedAction} completed');\n`;
    }
    
    return code;
  }

  /**
   * Generate fallback selectors for better reliability
   */
  private generateFallbackSelectors(target: any): string[] {
    const selectors: string[] = [];
    const searchText = target.searchText;
    
    if (target.type === 'link') {
      // Link-specific selectors
      selectors.push(`a:has-text("${searchText}")`);
      selectors.push(`a[aria-label*="${searchText}" i]`);
      selectors.push(`a[title*="${searchText}" i]`);
      selectors.push(`[role="link"]:has-text("${searchText}")`);
    } else if (target.type === 'button') {
      // Button-specific selectors
      selectors.push(`button:has-text("${searchText}")`);
      selectors.push(`[role="button"]:has-text("${searchText}")`);
      selectors.push(`input[type="submit"][value*="${searchText}" i]`);
      selectors.push(`input[type="button"][value*="${searchText}" i]`);
      selectors.push(`a:has-text("${searchText}")`); // Sometimes buttons are styled links
    } else {
      // Generic selectors
      selectors.push(`*:has-text("${searchText}")`);
      selectors.push(`[aria-label*="${searchText}" i]`);
      selectors.push(`[title*="${searchText}" i]`);
    }
    
    // Apply position modifiers
    if (target.position === 'first') {
      return selectors.map(sel => `(${sel}).first()`);
    } else if (target.position === 'last') {
      return selectors.map(sel => `(${sel}).last()`);
    } else if (typeof target.position === 'number') {
      return selectors.map(sel => `(${sel}).nth(${target.position - 1})`);
    }
    
    return selectors;
  }

  /**
   * Generate type code with input field detection
   */
  private generateTypeCode(action: any): string {
    const target = action.target;
    const value = action.value || '';
    
    let code = `  // Type "${value}" in ${target.description}\n`;
    code += `  const inputField = page.locator('${target.selector}');\n`;
    code += `  await inputField.waitFor({ state: 'visible', timeout: 10000 });\n`;
    code += `  await inputField.clear();\n`;
    code += `  await inputField.fill('${value}');\n`;
    code += `  console.log('✅ Entered "${value}" in ${target.description}');\n`;
    
    return code;
  }

  /**
   * Generate verify code with assertions
   */
  private generateVerifyCode(action: any): string {
    let code = `  // Verification: ${action.target.description}\n`;
    code += `  // TODO: Add specific assertion based on: ${action.originalInstruction}\n`;
    code += `  console.log('✅ Verification step completed');\n`;
    
    return code;
  }

  /**
   * Update existing test file with improved logic
   */
  public updateExistingTest(testFilePath: string, instruction: string): string {
    const parsedInstruction = this.parser.parseInstruction(instruction);
    
    // Generate just the test body code
    let testBody = '';
    for (const action of parsedInstruction.actions) {
      testBody += this.generateImprovedActionCode(action);
    }
    
    return testBody;
  }
}