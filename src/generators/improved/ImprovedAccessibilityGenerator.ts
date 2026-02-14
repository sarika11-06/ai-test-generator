/**
 * Improved Accessibility Test Generator
 * Enhanced version with better architecture and comprehensive WCAG support
 */

import { BaseTestGenerator, TestGenerationRequest, TestGenerationResult } from '../core/BaseTestGenerator';
import { InstructionParser, ParsedInstruction } from '../core/UnifiedInstructionParser';

export interface AccessibilityTestRequest extends TestGenerationRequest {
  wcagLevel?: 'A' | 'AA' | 'AAA';
  assistiveTechnology?: ('NVDA' | 'JAWS' | 'VoiceOver' | 'TalkBack' | 'Keyboard')[];
  focusAreas?: ('keyboard' | 'screen-reader' | 'contrast' | 'forms' | 'navigation')[];
}

export interface AccessibilityTestResult extends TestGenerationResult {
  wcagCriteria: string[];
  accessibilityFeatures: string[];
  axeCoreIntegration: boolean;
  keyboardTestSteps: string[];
  ariaValidations: string[];
}

/**
 * Accessibility-specific instruction parser
 */
class AccessibilityInstructionParser extends InstructionParser {
  protected domain = 'ACCESSIBILITY';
  protected keywords = [
    // Core accessibility keywords
    'accessibility', 'a11y', 'wcag', 'screen reader', 'keyboard', 'aria',
    'focus', 'tab navigation', 'contrast', 'semantic', 'assistive',
    
    // Keyboard navigation
    'press tab', 'tab key', 'tab twice', 'tab navigation', 'keyboard input',
    'keyboard access', 'tab order', 'focus order', 'tab sequence',
    'enter key', 'space key', 'arrow keys', 'shift tab', 'keyboard trap',
    
    // ARIA compliance
    'aria label', 'aria labelledby', 'aria describedby', 'aria live',
    'aria expanded', 'aria selected', 'aria checked', 'aria pressed',
    'aria role', 'role attribute', 'role value', 'role checking',
    
    // DOM inspection
    'alt text', 'alt attribute', 'form labels', 'heading hierarchy',
    'semantic html', 'landmarks', 'main content', 'navigation',
    
    // Visual accessibility
    'color contrast', 'contrast ratio', 'focus indicators',
    'visual accessibility', 'wcag aa', 'wcag aaa'
  ];

  public parseInstruction(instruction: string, url: string): ParsedInstruction {
    const commonPatterns = this.extractCommonPatterns(instruction);
    const accessibilityPatterns = this.extractAccessibilityPatterns(instruction);
    
    const confidence = this.calculateConfidence(instruction, {
      ...commonPatterns,
      ...accessibilityPatterns
    });

    return {
      actions: this.parseActions(instruction, commonPatterns.actions),
      targets: this.parseTargets(instruction, commonPatterns.targets),
      conditions: this.parseConditions(instruction, commonPatterns.conditions),
      validations: this.parseValidations(instruction, commonPatterns.validations),
      context: this.parseContext(instruction),
      confidence,
      domain: 'ACCESSIBILITY',
      testSteps: this.generateTestSteps(instruction, accessibilityPatterns),
      expectedOutcomes: this.generateExpectedOutcomes(instruction, accessibilityPatterns)
    };
  }

  private extractAccessibilityPatterns(instruction: string): {
    keyboardNavigation: string[];
    ariaCompliance: string[];
    domInspection: string[];
    visualAccessibility: string[];
    wcagGuidelines: string[];
  } {
    const instructionLower = instruction.toLowerCase();
    
    return {
      keyboardNavigation: this.extractKeyboardPatterns(instructionLower),
      ariaCompliance: this.extractAriaPatterns(instructionLower),
      domInspection: this.extractDomPatterns(instructionLower),
      visualAccessibility: this.extractVisualPatterns(instructionLower),
      wcagGuidelines: this.extractWcagPatterns(instructionLower)
    };
  }

  private extractKeyboardPatterns(instruction: string): string[] {
    const keyboardPatterns = [
      /\b(press\s+tab|tab\s+key|tab\s+navigation|keyboard\s+navigation)\b/gi,
      /\b(focus\s+order|tab\s+sequence|keyboard\s+access)\b/gi,
      /\b(enter\s+key|space\s+key|arrow\s+keys|shift\s+tab)\b/gi
    ];
    return this.extractMatches(instruction, keyboardPatterns);
  }

  private extractAriaPatterns(instruction: string): string[] {
    const ariaPatterns = [
      /\b(aria\s+label|aria\s+labelledby|aria\s+describedby|aria\s+live)\b/gi,
      /\b(aria\s+expanded|aria\s+selected|aria\s+checked|aria\s+pressed)\b/gi,
      /\b(aria\s+role|role\s+attribute|role\s+value)\b/gi
    ];
    return this.extractMatches(instruction, ariaPatterns);
  }

  private extractDomPatterns(instruction: string): string[] {
    const domPatterns = [
      /\b(alt\s+text|alt\s+attribute|form\s+labels|heading\s+hierarchy)\b/gi,
      /\b(semantic\s+html|landmarks|main\s+content|navigation)\b/gi
    ];
    return this.extractMatches(instruction, domPatterns);
  }

  private extractVisualPatterns(instruction: string): string[] {
    const visualPatterns = [
      /\b(color\s+contrast|contrast\s+ratio|focus\s+indicators)\b/gi,
      /\b(visual\s+accessibility|wcag\s+aa|wcag\s+aaa)\b/gi
    ];
    return this.extractMatches(instruction, visualPatterns);
  }

  private extractWcagPatterns(instruction: string): string[] {
    const wcagPatterns = [
      /\b(wcag\s+\d+\.\d+\.\d+|success\s+criteria|guideline)\b/gi,
      /\b(level\s+a|level\s+aa|level\s+aaa)\b/gi
    ];
    return this.extractMatches(instruction, wcagPatterns);
  }

  private parseActions(instruction: string, commonActions: string[]): any[] {
    // Convert common actions to accessibility-specific actions
    return commonActions.map(action => ({
      type: this.mapToAccessibilityAction(action),
      verb: action,
      object: this.extractActionObject(instruction, action),
      modifiers: [],
      confidence: 0.8
    }));
  }

  private parseTargets(instruction: string, commonTargets: string[]): any[] {
    return commonTargets.map(target => ({
      type: this.mapToAccessibilityTarget(target),
      value: target,
      properties: {},
      confidence: 0.8
    }));
  }

  private parseConditions(instruction: string, commonConditions: string[]): any[] {
    return commonConditions.map(condition => ({
      type: 'ACCESSIBILITY',
      description: condition,
      parameters: {},
      confidence: 0.7
    }));
  }

  private parseValidations(instruction: string, commonValidations: string[]): any[] {
    return commonValidations.map(validation => ({
      type: 'ACCESSIBILITY_COMPLIANCE',
      expectation: validation,
      criteria: [],
      confidence: 0.8
    }));
  }

  private parseContext(instruction: string): any {
    const instructionLower = instruction.toLowerCase();
    
    return {
      domain: 'ACCESSIBILITY',
      complexity: this.determineComplexity(instruction),
      testType: ['accessibility'],
      securityLevel: 'LOW',
      language: this.determineLanguage(instruction)
    };
  }

  private generateTestSteps(instruction: string, patterns: any): any[] {
    const steps: any[] = [];
    let stepNumber = 1;

    // Add page load step
    steps.push({
      stepNumber: stepNumber++,
      action: 'Load webpage',
      details: 'Navigate to the target URL',
      expectedResult: 'Page loads successfully',
      validations: ['Page is accessible', 'No critical accessibility errors'],
      code: `await page.goto('${instruction.includes('http') ? this.extractUrl(instruction) : 'URL_PLACEHOLDER'}');`
    });

    // Add keyboard navigation steps if detected
    if (patterns.keyboardNavigation.length > 0) {
      steps.push({
        stepNumber: stepNumber++,
        action: 'Test keyboard navigation',
        details: 'Navigate through interactive elements using keyboard',
        expectedResult: 'All interactive elements are keyboard accessible',
        validations: ['Tab order is logical', 'Focus indicators are visible', 'No keyboard traps'],
        code: `
          // Test keyboard navigation
          await page.keyboard.press('Tab');
          const focusedElement = await page.locator(':focus');
          await expect(focusedElement).toBeVisible();
        `
      });
    }

    // Add ARIA compliance steps if detected
    if (patterns.ariaCompliance.length > 0) {
      steps.push({
        stepNumber: stepNumber++,
        action: 'Validate ARIA compliance',
        details: 'Check ARIA attributes and roles',
        expectedResult: 'ARIA attributes are properly implemented',
        validations: ['ARIA labels are present', 'Roles are semantically correct', 'Live regions work properly'],
        code: `
          // Validate ARIA compliance
          const ariaElements = await page.locator('[aria-label], [aria-labelledby], [role]').all();
          for (const element of ariaElements) {
            await expect(element).toHaveAttribute('aria-label');
          }
        `
      });
    }

    return steps;
  }

  private generateExpectedOutcomes(instruction: string, patterns: any): any[] {
    const outcomes: any[] = [];

    outcomes.push({
      type: 'SUCCESS',
      description: 'Accessibility test passes all WCAG criteria',
      criteria: ['No critical accessibility violations', 'Keyboard navigation works', 'Screen reader compatible']
    });

    if (patterns.keyboardNavigation.length > 0) {
      outcomes.push({
        type: 'SUCCESS',
        description: 'Keyboard navigation is fully functional',
        criteria: ['Tab order is logical', 'All interactive elements are reachable', 'Focus indicators are visible']
      });
    }

    if (patterns.ariaCompliance.length > 0) {
      outcomes.push({
        type: 'SUCCESS',
        description: 'ARIA compliance is maintained',
        criteria: ['ARIA labels are descriptive', 'Roles are semantically correct', 'Live regions announce changes']
      });
    }

    return outcomes;
  }

  private mapToAccessibilityAction(action: string): string {
    const actionMap: Record<string, string> = {
      'click': 'KEYBOARD_ACTIVATION',
      'press': 'KEYBOARD_INPUT',
      'type': 'KEYBOARD_INPUT',
      'navigate': 'KEYBOARD_NAVIGATION',
      'verify': 'ACCESSIBILITY_VALIDATION',
      'check': 'ACCESSIBILITY_VALIDATION',
      'test': 'ACCESSIBILITY_TEST'
    };
    return actionMap[action.toLowerCase()] || 'ACCESSIBILITY_ACTION';
  }

  private mapToAccessibilityTarget(target: string): string {
    const targetMap: Record<string, string> = {
      'button': 'INTERACTIVE_ELEMENT',
      'link': 'INTERACTIVE_ELEMENT',
      'input': 'FORM_ELEMENT',
      'form': 'FORM_ELEMENT',
      'page': 'PAGE_ELEMENT',
      'element': 'DOM_ELEMENT'
    };
    return targetMap[target.toLowerCase()] || 'ACCESSIBILITY_TARGET';
  }

  private determineComplexity(instruction: string): string {
    const complexityIndicators = instruction.toLowerCase();
    if (complexityIndicators.includes('comprehensive') || complexityIndicators.includes('complete')) {
      return 'VERY_COMPLEX';
    }
    if (complexityIndicators.includes('detailed') || complexityIndicators.includes('thorough')) {
      return 'COMPLEX';
    }
    if (complexityIndicators.includes('basic') || complexityIndicators.includes('simple')) {
      return 'SIMPLE';
    }
    return 'MODERATE';
  }

  private determineLanguage(instruction: string): string {
    if (instruction.includes('WCAG') || instruction.includes('aria-')) {
      return 'TECHNICAL';
    }
    if (instruction.includes('please') || instruction.includes('could you')) {
      return 'FORMAL';
    }
    return 'MIXED';
  }

  private extractActionObject(instruction: string, action: string): string {
    // Simple extraction - could be enhanced with NLP
    const words = instruction.split(' ');
    const actionIndex = words.findIndex(word => word.toLowerCase().includes(action.toLowerCase()));
    return actionIndex < words.length - 1 ? words[actionIndex + 1] : 'element';
  }

  private extractUrl(instruction: string): string {
    const urlMatch = instruction.match(/https?:\/\/[^\s]+/);
    return urlMatch ? urlMatch[0] : 'URL_PLACEHOLDER';
  }

  protected extractMatches(instruction: string, patterns: RegExp[]): string[] {
    const matches: string[] = [];
    patterns.forEach(pattern => {
      const found = instruction.match(pattern);
      if (found) {
        matches.push(...found);
      }
    });
    return [...new Set(matches)];
  }
}

/**
 * Improved Accessibility Test Generator
 */
export class ImprovedAccessibilityGenerator extends BaseTestGenerator {
  protected generatorType = 'ACCESSIBILITY';
  private parser: AccessibilityInstructionParser;

  constructor() {
    super();
    this.parser = new AccessibilityInstructionParser();
  }

  public async generateTest(request: AccessibilityTestRequest): Promise<AccessibilityTestResult> {
    const startTime = Date.now();
    this.validateRequest(request);

    try {
      console.log('🎯 Generating improved accessibility test...');
      
      // Parse instruction
      const parsedInstruction = this.parser.parseInstruction(request.instruction, request.url);
      console.log(`📋 Parsed with ${parsedInstruction.confidence * 100}% confidence`);

      // Generate test code
      const testCode = this.generateAccessibilityTestCode(parsedInstruction, request);
      const testName = this.generateTestName(request.instruction);
      const description = this.generateTestDescription(parsedInstruction, request);

      // Extract accessibility-specific metadata
      const wcagCriteria = this.extractWcagCriteria(parsedInstruction);
      const accessibilityFeatures = this.extractAccessibilityFeatures(parsedInstruction);
      const keyboardTestSteps = this.extractKeyboardSteps(parsedInstruction);
      const ariaValidations = this.extractAriaValidations(parsedInstruction);

      const metadata = this.createBaseMetadata(startTime, parsedInstruction.confidence);
      const diagnostics = this.createBaseDiagnostics();

      // Add accessibility-specific diagnostics
      if (parsedInstruction.confidence < 0.7) {
        diagnostics.warnings.push('Low confidence in instruction parsing - review generated test');
      }
      if (wcagCriteria.length === 0) {
        diagnostics.suggestions.push('Consider specifying WCAG criteria for more targeted testing');
      }

      console.log('✅ Accessibility test generated successfully');

      return {
        success: true,
        testCode,
        testName,
        description,
        metadata,
        diagnostics,
        wcagCriteria,
        accessibilityFeatures,
        axeCoreIntegration: true,
        keyboardTestSteps,
        ariaValidations
      };

    } catch (error: any) {
      console.error('❌ Accessibility test generation failed:', error.message);
      
      const metadata = this.createBaseMetadata(startTime, 0.1);
      const diagnostics = this.createBaseDiagnostics();
      diagnostics.errors.push(error.message);
      diagnostics.suggestions.push('Simplify instruction or provide more specific accessibility requirements');

      return {
        success: false,
        testCode: this.generateFallbackTestCode(request),
        testName: 'Fallback Accessibility Test',
        description: 'Basic accessibility test due to parsing error',
        metadata,
        diagnostics,
        wcagCriteria: ['2.1.1', '4.1.2'],
        accessibilityFeatures: ['keyboard-navigation', 'screen-reader'],
        axeCoreIntegration: true,
        keyboardTestSteps: ['Navigate with Tab key', 'Verify focus indicators'],
        ariaValidations: ['Check ARIA labels', 'Validate roles']
      };
    }
  }

  private generateAccessibilityTestCode(parsedInstruction: ParsedInstruction, request: AccessibilityTestRequest): string {
    const testSteps = parsedInstruction.testSteps;
    const url = request.url;
    
    let testCode = `import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test('${this.generateTestName(request.instruction)}', async ({ page }) => {
  // Load the page
  await page.goto('${url}');
  
  // Inject Axe-Core for accessibility testing
  await injectAxe(page);
  
`;

    // Add generated test steps
    testSteps.forEach((step, index) => {
      testCode += `  // Step ${step.stepNumber}: ${step.action}\n`;
      testCode += `  ${step.code || `// ${step.details}`}\n`;
      testCode += `  // Expected: ${step.expectedResult}\n\n`;
    });

    // Add Axe-Core scan
    testCode += `  // Run comprehensive accessibility scan
  await checkA11y(page, null, {
    detailedReport: true,
    detailedReportOptions: { html: true },
    tags: ['wcag2a', 'wcag2aa', 'wcag21aa']
  });
  
  // Additional keyboard navigation test
  await page.keyboard.press('Tab');
  const focusedElement = await page.locator(':focus');
  await expect(focusedElement).toBeVisible();
  
  // Verify no keyboard traps
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Tab');
    const currentFocus = await page.locator(':focus');
    await expect(currentFocus).toBeVisible();
  }
});`;

    return testCode;
  }

  private generateTestName(instruction: string): string {
    const cleanInstruction = instruction.replace(/[^a-zA-Z0-9\s]/g, '').trim();
    const words = cleanInstruction.split(' ').slice(0, 6); // Limit to 6 words
    return words.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  }

  private generateTestDescription(parsedInstruction: ParsedInstruction, request: AccessibilityTestRequest): string {
    const features = this.extractAccessibilityFeatures(parsedInstruction);
    const wcagCriteria = this.extractWcagCriteria(parsedInstruction);
    
    let description = `Accessibility test for ${request.url}. `;
    
    if (features.length > 0) {
      description += `Tests: ${features.join(', ')}. `;
    }
    
    if (wcagCriteria.length > 0) {
      description += `WCAG Criteria: ${wcagCriteria.join(', ')}. `;
    }
    
    description += `Generated with ${Math.round(parsedInstruction.confidence * 100)}% confidence.`;
    
    return description;
  }

  private extractWcagCriteria(parsedInstruction: ParsedInstruction): string[] {
    const criteria: string[] = [];
    
    // Map accessibility features to WCAG criteria
    const featureMap: Record<string, string[]> = {
      'keyboard-navigation': ['2.1.1', '2.1.2', '2.4.3'],
      'screen-reader': ['1.1.1', '1.3.1', '4.1.2'],
      'aria-compliance': ['4.1.2', '4.1.3'],
      'color-contrast': ['1.4.3', '1.4.6'],
      'focus-indicators': ['2.4.7'],
      'form-labels': ['1.3.1', '3.3.2'],
      'heading-hierarchy': ['1.3.1', '2.4.6']
    };

    parsedInstruction.testSteps.forEach(step => {
      Object.entries(featureMap).forEach(([feature, wcagCodes]) => {
        if (step.action.toLowerCase().includes(feature) || step.details.toLowerCase().includes(feature)) {
          criteria.push(...wcagCodes);
        }
      });
    });

    return [...new Set(criteria)]; // Remove duplicates
  }

  private extractAccessibilityFeatures(parsedInstruction: ParsedInstruction): string[] {
    const features: string[] = [];
    const instruction = JSON.stringify(parsedInstruction).toLowerCase();
    
    const featureKeywords = {
      'keyboard-navigation': ['keyboard', 'tab', 'focus', 'navigation'],
      'screen-reader': ['screen reader', 'aria', 'label', 'role'],
      'color-contrast': ['contrast', 'color', 'visual'],
      'form-accessibility': ['form', 'input', 'label', 'field'],
      'semantic-html': ['semantic', 'heading', 'landmark', 'structure']
    };

    Object.entries(featureKeywords).forEach(([feature, keywords]) => {
      if (keywords.some(keyword => instruction.includes(keyword))) {
        features.push(feature);
      }
    });

    return features;
  }

  private extractKeyboardSteps(parsedInstruction: ParsedInstruction): string[] {
    return parsedInstruction.testSteps
      .filter(step => step.action.toLowerCase().includes('keyboard') || step.details.toLowerCase().includes('tab'))
      .map(step => step.details);
  }

  private extractAriaValidations(parsedInstruction: ParsedInstruction): string[] {
    return parsedInstruction.validations
      .filter(validation => validation.type.includes('ARIA') || validation.expectation.toLowerCase().includes('aria'))
      .map(validation => validation.expectation);
  }

  private generateFallbackTestCode(request: AccessibilityTestRequest): string {
    return `import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test('Basic Accessibility Test', async ({ page }) => {
  await page.goto('${request.url}');
  await injectAxe(page);
  
  // Basic accessibility scan
  await checkA11y(page, null, {
    tags: ['wcag2a', 'wcag2aa']
  });
  
  // Basic keyboard navigation test
  await page.keyboard.press('Tab');
  const focusedElement = await page.locator(':focus');
  await expect(focusedElement).toBeVisible();
});`;
  }
}