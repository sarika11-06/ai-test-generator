/**
 * Comprehensive Error Handling for Accessibility Test Enhancement
 * 
 * Provides robust error handling for invalid instructions, missing dependencies,
 * and fallback mechanisms for unsupported accessibility features.
 * 
 * Requirements: 8.3 - All error handling scenarios
 */

import type { AccessibilityTestRequirements } from './enhancedAccessibilityParser';
import { WCAGRuleset } from './enhancedAccessibilityParser';
import type { WebsiteAnalysis } from './testIntentClassifier';

/**
 * Error Types for Accessibility Testing
 */
export enum AccessibilityErrorType {
  INVALID_INSTRUCTIONS = 'INVALID_INSTRUCTIONS',
  MISSING_DEPENDENCIES = 'MISSING_DEPENDENCIES',
  UNSUPPORTED_FEATURE = 'UNSUPPORTED_FEATURE',
  PARSING_ERROR = 'PARSING_ERROR',
  CODE_GENERATION_ERROR = 'CODE_GENERATION_ERROR',
  TEMPLATE_ERROR = 'TEMPLATE_ERROR',
  AXE_CORE_ERROR = 'AXE_CORE_ERROR',
  WCAG_VALIDATION_ERROR = 'WCAG_VALIDATION_ERROR'
}

/**
 * Accessibility Error Class
 */
export class AccessibilityError extends Error {
  public readonly type: AccessibilityErrorType;
  public readonly context: Record<string, any>;
  public readonly fallbackSuggestion?: string;
  public readonly userMessage: string;

  constructor(
    type: AccessibilityErrorType,
    message: string,
    context: Record<string, any> = {},
    fallbackSuggestion?: string
  ) {
    super(message);
    this.name = 'AccessibilityError';
    this.type = type;
    this.context = context;
    this.fallbackSuggestion = fallbackSuggestion;
    this.userMessage = this.generateUserMessage();
  }

  private generateUserMessage(): string {
    switch (this.type) {
      case AccessibilityErrorType.INVALID_INSTRUCTIONS:
        return `The accessibility instructions could not be understood. Please provide more specific accessibility testing requirements such as "test keyboard navigation" or "check color contrast".`;
      
      case AccessibilityErrorType.MISSING_DEPENDENCIES:
        return `Required accessibility testing dependencies are missing. Please ensure Axe-Core and Playwright are properly installed.`;
      
      case AccessibilityErrorType.UNSUPPORTED_FEATURE:
        return `The requested accessibility feature is not currently supported. Available features include: DOM inspection, keyboard navigation, ARIA compliance, visual accessibility, and WCAG guidelines.`;
      
      case AccessibilityErrorType.PARSING_ERROR:
        return `Failed to parse accessibility requirements from the provided instructions. Please use clearer accessibility terminology.`;
      
      case AccessibilityErrorType.CODE_GENERATION_ERROR:
        return `Failed to generate accessibility test code. The system will fall back to basic accessibility testing.`;
      
      case AccessibilityErrorType.TEMPLATE_ERROR:
        return `Error with accessibility test template. Using default template instead.`;
      
      case AccessibilityErrorType.AXE_CORE_ERROR:
        return `Axe-Core integration failed. Tests will proceed without automated accessibility scanning.`;
      
      case AccessibilityErrorType.WCAG_VALIDATION_ERROR:
        return `WCAG validation configuration error. Using default WCAG 2.1 AA standards.`;
      
      default:
        return `An accessibility testing error occurred: ${this.message}`;
    }
  }
}

/**
 * Error Recovery Strategy
 */
export interface ErrorRecoveryStrategy {
  canRecover: boolean;
  fallbackAction: () => any;
  userNotification: string;
  logLevel: 'error' | 'warn' | 'info';
}

/**
 * Comprehensive Accessibility Error Handler
 */
export class AccessibilityErrorHandler {
  private static instance: AccessibilityErrorHandler;
  private errorLog: AccessibilityError[] = [];
  private recoveryStrategies: Map<AccessibilityErrorType, ErrorRecoveryStrategy> = new Map();

  private constructor() {
    this.initializeRecoveryStrategies();
  }

  public static getInstance(): AccessibilityErrorHandler {
    if (!AccessibilityErrorHandler.instance) {
      AccessibilityErrorHandler.instance = new AccessibilityErrorHandler();
    }
    return AccessibilityErrorHandler.instance;
  }

  /**
   * Initialize Recovery Strategies for Different Error Types
   */
  private initializeRecoveryStrategies(): void {
    // Invalid Instructions Recovery
    this.recoveryStrategies.set(AccessibilityErrorType.INVALID_INSTRUCTIONS, {
      canRecover: true,
      fallbackAction: () => this.generateBasicAccessibilityRequirements(),
      userNotification: 'Using basic accessibility testing patterns due to unclear instructions.',
      logLevel: 'warn'
    });

    // Missing Dependencies Recovery
    this.recoveryStrategies.set(AccessibilityErrorType.MISSING_DEPENDENCIES, {
      canRecover: true,
      fallbackAction: () => this.generateManualTestInstructions(),
      userNotification: 'Generating manual accessibility test instructions due to missing dependencies.',
      logLevel: 'error'
    });

    // Unsupported Feature Recovery
    this.recoveryStrategies.set(AccessibilityErrorType.UNSUPPORTED_FEATURE, {
      canRecover: true,
      fallbackAction: () => this.generateSupportedFeatureAlternatives(),
      userNotification: 'Using supported accessibility features instead.',
      logLevel: 'warn'
    });

    // Parsing Error Recovery
    this.recoveryStrategies.set(AccessibilityErrorType.PARSING_ERROR, {
      canRecover: true,
      fallbackAction: () => this.generateGenericAccessibilityTests(),
      userNotification: 'Using generic accessibility tests due to parsing errors.',
      logLevel: 'warn'
    });

    // Code Generation Error Recovery
    this.recoveryStrategies.set(AccessibilityErrorType.CODE_GENERATION_ERROR, {
      canRecover: true,
      fallbackAction: () => this.generateBasicPlaywrightCode(),
      userNotification: 'Using basic Playwright accessibility code due to generation errors.',
      logLevel: 'error'
    });

    // Template Error Recovery
    this.recoveryStrategies.set(AccessibilityErrorType.TEMPLATE_ERROR, {
      canRecover: true,
      fallbackAction: () => this.getDefaultTemplate(),
      userNotification: 'Using default accessibility template due to template errors.',
      logLevel: 'warn'
    });

    // Axe-Core Error Recovery
    this.recoveryStrategies.set(AccessibilityErrorType.AXE_CORE_ERROR, {
      canRecover: true,
      fallbackAction: () => this.generateManualAxeInstructions(),
      userNotification: 'Axe-Core integration disabled. Manual accessibility validation required.',
      logLevel: 'warn'
    });

    // WCAG Validation Error Recovery
    this.recoveryStrategies.set(AccessibilityErrorType.WCAG_VALIDATION_ERROR, {
      canRecover: true,
      fallbackAction: () => this.getDefaultWCAGConfig(),
      userNotification: 'Using default WCAG 2.1 AA configuration.',
      logLevel: 'info'
    });
  }

  /**
   * Handle Accessibility Error with Recovery
   */
  public handleError(error: AccessibilityError): any {
    // Log the error
    this.logError(error);
    
    // Add to error log
    this.errorLog.push(error);

    // Attempt recovery
    const strategy = this.recoveryStrategies.get(error.type);
    
    if (strategy && strategy.canRecover) {
      console.log(`[AccessibilityErrorHandler] ${strategy.userNotification}`);
      
      try {
        return strategy.fallbackAction();
      } catch (recoveryError) {
        console.error('[AccessibilityErrorHandler] Recovery failed:', recoveryError);
        return this.getLastResortFallback(error.type);
      }
    } else {
      console.error('[AccessibilityErrorHandler] No recovery strategy available for:', error.type);
      return this.getLastResortFallback(error.type);
    }
  }

  /**
   * Validate Instructions and Dependencies
   */
  public validateAccessibilitySetup(
    instructions: string,
    websiteAnalysis: WebsiteAnalysis
  ): { isValid: boolean; errors: AccessibilityError[] } {
    const errors: AccessibilityError[] = [];

    // Validate instructions
    if (!instructions || instructions.trim().length === 0) {
      errors.push(new AccessibilityError(
        AccessibilityErrorType.INVALID_INSTRUCTIONS,
        'Empty or missing accessibility instructions',
        { instructions }
      ));
    }

    // Validate website analysis
    if (!websiteAnalysis || !websiteAnalysis.url) {
      errors.push(new AccessibilityError(
        AccessibilityErrorType.INVALID_INSTRUCTIONS,
        'Invalid or missing website analysis',
        { websiteAnalysis }
      ));
    }

    // Check for accessibility keywords
    const hasAccessibilityKeywords = this.hasAccessibilityKeywords(instructions);
    if (!hasAccessibilityKeywords) {
      errors.push(new AccessibilityError(
        AccessibilityErrorType.INVALID_INSTRUCTIONS,
        'No accessibility-specific keywords found in instructions',
        { instructions },
        'Try using terms like "keyboard navigation", "screen reader", "color contrast", or "ARIA"'
      ));
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate WCAG Criteria
   */
  public validateWCAGCriteria(criteria: string[]): { isValid: boolean; errors: AccessibilityError[] } {
    const errors: AccessibilityError[] = [];
    const validCriteria = [
      '1.1.1', '1.2.1', '1.2.2', '1.2.3', '1.3.1', '1.3.2', '1.3.3', '1.4.1', '1.4.2', '1.4.3',
      '2.1.1', '2.1.2', '2.2.1', '2.2.2', '2.3.1', '2.4.1', '2.4.2', '2.4.3', '2.4.4', '2.4.5', '2.4.6', '2.4.7',
      '3.1.1', '3.2.1', '3.2.2', '3.3.1', '3.3.2',
      '4.1.1', '4.1.2', '4.1.3'
    ];

    for (const criterion of criteria) {
      if (!validCriteria.includes(criterion)) {
        errors.push(new AccessibilityError(
          AccessibilityErrorType.WCAG_VALIDATION_ERROR,
          `Invalid WCAG success criterion: ${criterion}`,
          { criterion, validCriteria }
        ));
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate Axe-Core Configuration
   */
  public validateAxeCoreConfig(config: any): { isValid: boolean; errors: AccessibilityError[] } {
    const errors: AccessibilityError[] = [];

    if (!config) {
      errors.push(new AccessibilityError(
        AccessibilityErrorType.AXE_CORE_ERROR,
        'Missing Axe-Core configuration',
        { config }
      ));
      return { isValid: false, errors };
    }

    // Validate rulesets
    const validRulesets = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'section508'];
    if (config.rulesets && Array.isArray(config.rulesets)) {
      for (const ruleset of config.rulesets) {
        if (!validRulesets.includes(ruleset)) {
          errors.push(new AccessibilityError(
            AccessibilityErrorType.AXE_CORE_ERROR,
            `Invalid Axe-Core ruleset: ${ruleset}`,
            { ruleset, validRulesets }
          ));
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Recovery Methods
   */
  private generateBasicAccessibilityRequirements(): AccessibilityTestRequirements {
    return {
      domInspection: [{
        type: 'image-alt',
        elements: ['img'],
        validationRules: [{ attribute: 'alt', condition: 'present', description: 'Image must have alt attribute' }],
        wcagCriteria: ['1.1.1']
      }],
      keyboardNavigation: [{
        type: 'tab-sequence',
        scope: 'page',
        expectedBehavior: 'Tab key moves focus through interactive elements',
        wcagCriteria: ['2.1.1']
      }],
      ariaCompliance: [{
        type: 'aria-labels',
        attributes: ['aria-label', 'aria-labelledby'],
        validationLogic: 'Interactive elements have accessible names',
        wcagCriteria: ['4.1.2']
      }],
      visualAccessibility: [{
        type: 'color-contrast',
        contrastRatio: 4.5,
        scope: ['text'],
        wcagCriteria: ['1.4.3']
      }],
      wcagGuidelines: [{
        successCriteria: '2.4.1',
        level: 'A',
        validationType: 'automated',
        testingApproach: 'Check for skip links'
      }],
      axeCoreIntegration: {
        rulesets: [WCAGRuleset.WCAG20A, WCAGRuleset.WCAG20AA],
        tags: ['wcag2a', 'wcag2aa'],
        violationHandling: 'fail-on-violations' as any,
        reportingLevel: 'violations' as const
      }
    };
  }

  private generateManualTestInstructions(): string {
    return `
// Manual Accessibility Testing Instructions
// Dependencies are missing - perform manual testing

test('Manual Accessibility Validation', async ({ page }) => {
  await page.goto('{{URL}}');
  
  // Manual checks required:
  // 1. Verify all images have alt attributes
  // 2. Test keyboard navigation with Tab key
  // 3. Check color contrast ratios manually
  // 4. Validate ARIA labels and roles
  // 5. Test with screen reader software
  
  console.log('Manual accessibility testing required - automated tools unavailable');
});
`;
  }

  private generateSupportedFeatureAlternatives(): string[] {
    return [
      'dom-inspection',
      'keyboard-navigation', 
      'aria-compliance',
      'visual-accessibility',
      'wcag-guidelines'
    ];
  }

  private generateGenericAccessibilityTests(): any[] {
    return [{
      id: 'generic-accessibility-test',
      title: 'Generic Accessibility Test',
      description: 'Basic accessibility validation using generic patterns',
      type: 'accessibility'
    }];
  }

  private generateBasicPlaywrightCode(): string {
    return `
import { test, expect } from '@playwright/test';

test('Basic Accessibility Test', async ({ page }) => {
  await page.goto('{{URL}}');
  
  // Basic accessibility checks
  const images = await page.locator('img').all();
  for (const img of images) {
    const alt = await img.getAttribute('alt');
    expect(alt).toBeTruthy();
  }
  
  // Basic keyboard navigation
  await page.keyboard.press('Tab');
  const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
  expect(focusedElement).toBeTruthy();
});
`;
  }

  private getDefaultTemplate(): any {
    return {
      name: 'Default Accessibility Template',
      description: 'Basic accessibility testing template',
      setupCode: 'import { test, expect } from "@playwright/test";',
      codeTemplate: 'test("{{TEST_NAME}}", async ({ page }) => { await page.goto("{{URL}}"); });'
    };
  }

  private generateManualAxeInstructions(): string {
    return `
// Axe-Core integration failed - manual accessibility validation required
// Install Axe-Core: npm install @axe-core/playwright
// Then uncomment the following code:

// import AxeBuilder from '@axe-core/playwright';
// const results = await new AxeBuilder({ page }).analyze();
// expect(results.violations).toHaveLength(0);

console.log('Axe-Core integration unavailable - perform manual accessibility audit');
`;
  }

  private getDefaultWCAGConfig(): any {
    return {
      rulesets: ['wcag2a', 'wcag2aa', 'wcag21aa'],
      tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
      disabledRules: [],
      reportingLevel: 'violations'
    };
  }

  private getLastResortFallback(errorType: AccessibilityErrorType): any {
    console.error(`[AccessibilityErrorHandler] Last resort fallback for: ${errorType}`);
    
    switch (errorType) {
      case AccessibilityErrorType.CODE_GENERATION_ERROR:
        return this.generateBasicPlaywrightCode();
      case AccessibilityErrorType.PARSING_ERROR:
        return this.generateBasicAccessibilityRequirements();
      default:
        return null;
    }
  }

  private hasAccessibilityKeywords(instructions: string): boolean {
    const accessibilityKeywords = [
      'accessibility', 'a11y', 'wcag', 'aria', 'keyboard', 'screen reader',
      'contrast', 'focus', 'semantic', 'alt text', 'label', 'navigation',
      'tab', 'voiceover', 'nvda', 'jaws'
    ];

    const instructionsLower = instructions.toLowerCase();
    return accessibilityKeywords.some(keyword => instructionsLower.includes(keyword));
  }

  private logError(error: AccessibilityError): void {
    const strategy = this.recoveryStrategies.get(error.type);
    const logLevel = strategy?.logLevel || 'error';
    
    const logMessage = `[AccessibilityErrorHandler] ${error.type}: ${error.message}`;
    const contextMessage = Object.keys(error.context).length > 0 
      ? `Context: ${JSON.stringify(error.context, null, 2)}`
      : '';
    
    switch (logLevel) {
      case 'error':
        console.error(logMessage);
        if (contextMessage) console.error(contextMessage);
        break;
      case 'warn':
        console.warn(logMessage);
        if (contextMessage) console.warn(contextMessage);
        break;
      case 'info':
        console.info(logMessage);
        if (contextMessage) console.info(contextMessage);
        break;
    }
  }

  /**
   * Get Error Statistics
   */
  public getErrorStatistics(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    recentErrors: AccessibilityError[];
  } {
    const errorsByType: Record<string, number> = {};
    
    for (const error of this.errorLog) {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
    }

    return {
      totalErrors: this.errorLog.length,
      errorsByType,
      recentErrors: this.errorLog.slice(-10) // Last 10 errors
    };
  }

  /**
   * Clear Error Log
   */
  public clearErrorLog(): void {
    this.errorLog = [];
  }
}

/**
 * Utility Functions for Error Handling
 */
export const AccessibilityErrorUtils = {
  /**
   * Wrap function with error handling
   */
  withErrorHandling<T extends (...args: any[]) => any>(
    fn: T,
    errorType: AccessibilityErrorType,
    context: Record<string, any> = {}
  ): T {
    return ((...args: Parameters<T>) => {
      try {
        return fn(...args);
      } catch (error) {
        const accessibilityError = new AccessibilityError(
          errorType,
          error instanceof Error ? error.message : String(error),
          { ...context, originalError: error }
        );
        
        return AccessibilityErrorHandler.getInstance().handleError(accessibilityError);
      }
    }) as T;
  },

  /**
   * Validate and handle async operations
   */
  async withAsyncErrorHandling<T>(
    operation: () => Promise<T>,
    errorType: AccessibilityErrorType,
    context: Record<string, any> = {}
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      const accessibilityError = new AccessibilityError(
        errorType,
        error instanceof Error ? error.message : String(error),
        { ...context, originalError: error }
      );
      
      return AccessibilityErrorHandler.getInstance().handleError(accessibilityError);
    }
  },

  /**
   * Create error with context
   */
  createError(
    type: AccessibilityErrorType,
    message: string,
    context: Record<string, any> = {},
    fallbackSuggestion?: string
  ): AccessibilityError {
    return new AccessibilityError(type, message, context, fallbackSuggestion);
  }
};

// Export singleton instance
export const accessibilityErrorHandler = AccessibilityErrorHandler.getInstance();