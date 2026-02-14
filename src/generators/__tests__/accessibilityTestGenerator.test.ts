import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';
import {
  generateAccessibilityTests,
  generateKeyboardNavigationTest,
  generateScreenReaderTest,
  generateColorContrastTest,
  generateFormAccessibilityTest,
  generateFocusManagementTest,
  generateAccessibilityAutomationCode,
  type AccessibilityTestCase,
} from '../accessibilityTestGenerator';
import type { WebsiteAnalysis } from '../testIntentClassifier';

/**
 * Property-Based Tests for Accessibility Test Generator
 * 
 * These tests validate universal properties that should hold for all accessibility
 * test cases using fast-check for property-based testing with 100+ iterations per test.
 */

/**
 * Arbitraries (Generators) for Property-Based Testing
 * Shared across all test suites
 */

const interactiveElementArb = fc.record({
  tag: fc.constantFrom('button', 'a', 'input', 'select', 'textarea'),
  type: fc.constantFrom('button', 'submit', 'text', 'email', 'password', 'checkbox', 'radio'),
  text: fc.string({ minLength: 3, maxLength: 50 }),
  ariaLabel: fc.string({ minLength: 3, maxLength: 50 }),
  role: fc.constantFrom('button', 'link', 'textbox', 'checkbox', 'radio', 'combobox'),
  placeholder: fc.string({ minLength: 0, maxLength: 30 }),
  name: fc.string({ minLength: 3, maxLength: 30 }),
  id: fc.string({ minLength: 3, maxLength: 30 }),
  friendlyName: fc.option(fc.string({ minLength: 5, maxLength: 40 }), { nil: undefined }),
  selectors: fc.array(fc.string({ minLength: 5, maxLength: 50 }), { minLength: 1, maxLength: 3 }),
  xpath: fc.string({ minLength: 10, maxLength: 100 }),
});

const websiteAnalysisArb: fc.Arbitrary<WebsiteAnalysis> = fc.record({
  url: fc.webUrl(),
  allInteractive: fc.array(interactiveElementArb, { minLength: 1, maxLength: 10 }),
});

const userPromptArb = fc.constantFrom(
  'test keyboard navigation',
  'verify screen reader compatibility',
  'check color contrast',
  'test form accessibility',
  'verify focus management',
  'test accessibility'
);

describe('Accessibility Test Generator - Property-Based Tests', () => {
  
  /**
   * Property 5: Accessibility Test Case Structure
   * 
   * For any test case classified as accessibility type, the test case should include 
   * testType="Accessibility", wcagVersion, wcagPrinciple (containing only valid WCAG 
   * principles: Perceivable, Operable, Understandable, Robust), wcagSuccessCriteria, 
   * and assistiveTechnology fields.
   * 
   * **Validates: Requirements 2.2, 2.3, 2.4**
   * **Feature: accessibility-api-testing, Property 5: Accessibility Test Case Structure**
   */
  it('Property 5: should ensure accessibility test cases have required structure', () => {
    fc.assert(
      fc.property(
        websiteAnalysisArb,
        userPromptArb,
        (websiteAnalysis, userPrompt) => {
          // Generate accessibility tests
          const testCases = generateAccessibilityTests(websiteAnalysis, userPrompt);
          
          // Verify each test case has required accessibility structure
          testCases.forEach((testCase) => {
            // Verify testType is Accessibility
            expect(testCase.testType).toBe('Accessibility');
            
            // Verify wcagVersion is present and valid
            expect(testCase.wcagVersion).toBeDefined();
            expect(['2.0', '2.1', '2.2']).toContain(testCase.wcagVersion);
            
            // Verify wcagPrinciple is present and contains only valid principles
            expect(testCase.wcagPrinciple).toBeDefined();
            expect(Array.isArray(testCase.wcagPrinciple)).toBe(true);
            expect(testCase.wcagPrinciple.length).toBeGreaterThan(0);
            
            const validPrinciples = ['Perceivable', 'Operable', 'Understandable', 'Robust'];
            testCase.wcagPrinciple.forEach((principle) => {
              expect(validPrinciples).toContain(principle);
            });
            
            // Verify wcagSuccessCriteria is present
            expect(testCase.wcagSuccessCriteria).toBeDefined();
            expect(Array.isArray(testCase.wcagSuccessCriteria)).toBe(true);
            expect(testCase.wcagSuccessCriteria.length).toBeGreaterThan(0);
            
            // Verify assistiveTechnology is present
            expect(testCase.assistiveTechnology).toBeDefined();
            expect(Array.isArray(testCase.assistiveTechnology)).toBe(true);
            expect(testCase.assistiveTechnology.length).toBeGreaterThan(0);
            
            const validAssistiveTech = ['NVDA', 'JAWS', 'VoiceOver', 'TalkBack', 'Keyboard'];
            testCase.assistiveTechnology.forEach((tech) => {
              expect(validAssistiveTech).toContain(tech);
            });
          });
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Property 6: Accessibility Validation Criteria
   * 
   * For any accessibility test case, the validation criteria should include at least 
   * one of: keyboard navigation checks, screen reader announcement checks, ARIA 
   * attribute checks, or focus indicator checks.
   * 
   * **Validates: Requirements 2.5**
   * **Feature: accessibility-api-testing, Property 6: Accessibility Validation Criteria**
   */
  it('Property 6: should ensure accessibility test cases have proper validation criteria', () => {
    fc.assert(
      fc.property(
        websiteAnalysisArb,
        userPromptArb,
        (websiteAnalysis, userPrompt) => {
          // Generate accessibility tests
          const testCases = generateAccessibilityTests(websiteAnalysis, userPrompt);
          
          // Verify each test case has appropriate validation criteria
          testCases.forEach((testCase) => {
            expect(testCase.validationCriteria).toBeDefined();
            
            // Should have at least one validation category
            const hasValidation = 
              (testCase.validationCriteria.behavior && testCase.validationCriteria.behavior.length > 0) ||
              (testCase.validationCriteria.compliance && testCase.validationCriteria.compliance.length > 0);
            
            expect(hasValidation).toBe(true);
            
            // Check for accessibility-specific validation patterns
            const allValidationText = [
              ...(testCase.validationCriteria.behavior || []),
              ...(testCase.validationCriteria.compliance || []),
            ].join(' ').toLowerCase();
            
            // Should mention at least one accessibility concern
            const hasAccessibilityValidation = 
              allValidationText.includes('keyboard') ||
              allValidationText.includes('screen reader') ||
              allValidationText.includes('aria') ||
              allValidationText.includes('focus') ||
              allValidationText.includes('contrast') ||
              allValidationText.includes('wcag');
            
            expect(hasAccessibilityValidation).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});


describe('Accessibility Test Generator - Test Pattern Properties', () => {
  
  /**
   * Property 16: Keyboard Navigation Test Pattern
   * 
   * For any accessibility test case focused on keyboard navigation, the test steps 
   * should include Tab key navigation, focus indicator verification, and keyboard-only 
   * operation (no mouse interactions).
   * 
   * **Validates: Requirements 5.1**
   * **Feature: accessibility-api-testing, Property 16: Keyboard Navigation Test Pattern**
   */
  it('Property 16: should include keyboard navigation patterns in keyboard tests', () => {
    fc.assert(
      fc.property(
        websiteAnalysisArb,
        fc.array(interactiveElementArb, { minLength: 1, maxLength: 5 }),
        (websiteAnalysis, elements) => {
          // Generate keyboard navigation test
          const testCase = generateKeyboardNavigationTest(websiteAnalysis, elements);
          
          // Verify test case has keyboard navigation patterns
          expect(testCase.testType).toBe('Accessibility');
          expect(testCase.keyboardAccess).toBe(true);
          
          // Check steps mention keyboard navigation
          const allStepsText = testCase.steps.map(s => s.action + ' ' + s.expectedResult).join(' ').toLowerCase();
          
          // Should mention Tab key
          expect(allStepsText.includes('tab')).toBe(true);
          
          // Should mention focus indicator
          expect(allStepsText.includes('focus')).toBe(true);
          
          // Should mention keyboard-only operation (no mouse)
          const hasKeyboardOnly = 
            allStepsText.includes('keyboard') ||
            allStepsText.includes('enter') ||
            allStepsText.includes('space');
          expect(hasKeyboardOnly).toBe(true);
          
          // Verify WCAG criteria includes keyboard accessibility
          expect(testCase.wcagSuccessCriteria.some(c => c.startsWith('2.1'))).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Property 17: Screen Reader Test Pattern
   * 
   * For any accessibility test case focused on screen readers, the test steps should 
   * include ARIA label verification, role verification, and meaningful announcement checks.
   * 
   * **Validates: Requirements 5.2**
   * **Feature: accessibility-api-testing, Property 17: Screen Reader Test Pattern**
   */
  it('Property 17: should include screen reader patterns in screen reader tests', () => {
    fc.assert(
      fc.property(
        websiteAnalysisArb,
        fc.array(interactiveElementArb, { minLength: 1, maxLength: 5 }),
        (websiteAnalysis, elements) => {
          // Generate screen reader test
          const testCase = generateScreenReaderTest(websiteAnalysis, elements);
          
          // Verify test case has screen reader patterns
          expect(testCase.testType).toBe('Accessibility');
          
          // Check steps mention screen reader concepts
          const allStepsText = testCase.steps.map(s => s.action + ' ' + s.expectedResult).join(' ').toLowerCase();
          
          // Should mention ARIA
          expect(allStepsText.includes('aria')).toBe(true);
          
          // Should mention labels or roles
          const hasLabelsOrRoles = 
            allStepsText.includes('label') ||
            allStepsText.includes('role');
          expect(hasLabelsOrRoles).toBe(true);
          
          // Should mention screen reader
          expect(allStepsText.includes('screen reader')).toBe(true);
          
          // Verify assistive technology includes screen readers
          const hasScreenReader = testCase.assistiveTechnology.some(tech => 
            ['NVDA', 'JAWS', 'VoiceOver'].includes(tech)
          );
          expect(hasScreenReader).toBe(true);
          
          // Verify WCAG criteria includes appropriate standards
          expect(testCase.wcagSuccessCriteria.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Property 18: Color Contrast Test Pattern
   * 
   * For any accessibility test case focused on color contrast, the test should reference 
   * WCAG AA (4.5:1) or AAA (7:1) contrast ratio standards.
   * 
   * **Validates: Requirements 5.3**
   * **Feature: accessibility-api-testing, Property 18: Color Contrast Test Pattern**
   */
  it('Property 18: should reference WCAG contrast ratios in color contrast tests', () => {
    fc.assert(
      fc.property(
        websiteAnalysisArb,
        (websiteAnalysis) => {
          // Generate color contrast test
          const testCase = generateColorContrastTest(websiteAnalysis);
          
          // Verify test case has color contrast patterns
          expect(testCase.testType).toBe('Accessibility');
          
          // Check steps and validation mention contrast ratios
          const allText = [
            ...testCase.steps.map(s => s.action + ' ' + s.expectedResult),
            ...(testCase.validationCriteria.behavior || []),
            ...(testCase.validationCriteria.compliance || []),
          ].join(' ').toLowerCase();
          
          // Should mention contrast
          expect(allText.includes('contrast')).toBe(true);
          
          // Should mention specific ratio (4.5:1 or 3:1 or 7:1)
          const hasRatio = 
            allText.includes('4.5:1') ||
            allText.includes('3:1') ||
            allText.includes('7:1') ||
            allText.includes('ratio');
          expect(hasRatio).toBe(true);
          
          // Verify WCAG criteria includes contrast standards (1.4.3 or 1.4.11)
          const hasContrastCriteria = testCase.wcagSuccessCriteria.some(c => 
            c === '1.4.3' || c === '1.4.11'
          );
          expect(hasContrastCriteria).toBe(true);
          
          // Verify WCAG principle includes Perceivable
          expect(testCase.wcagPrinciple).toContain('Perceivable');
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Property 19: Form Accessibility Test Pattern
   * 
   * For any accessibility test case focused on forms, the test steps should include 
   * label association verification, error announcement checks, and required field 
   * indicator verification.
   * 
   * **Validates: Requirements 5.4**
   * **Feature: accessibility-api-testing, Property 19: Form Accessibility Test Pattern**
   */
  it('Property 19: should include form accessibility patterns in form tests', () => {
    fc.assert(
      fc.property(
        websiteAnalysisArb,
        fc.array(
          fc.record({
            tag: fc.constantFrom('input', 'textarea', 'select'),
            type: fc.constantFrom('button', 'submit', 'text', 'email', 'password', 'checkbox', 'radio'),
            text: fc.string({ minLength: 3, maxLength: 50 }),
            ariaLabel: fc.string({ minLength: 3, maxLength: 50 }),
            role: fc.constantFrom('button', 'link', 'textbox', 'checkbox', 'radio', 'combobox'),
            placeholder: fc.string({ minLength: 0, maxLength: 30 }),
            name: fc.string({ minLength: 3, maxLength: 30 }),
            id: fc.string({ minLength: 3, maxLength: 30 }),
            friendlyName: fc.option(fc.string({ minLength: 5, maxLength: 40 }), { nil: undefined }),
            selectors: fc.array(fc.string({ minLength: 5, maxLength: 50 }), { minLength: 1, maxLength: 3 }),
            xpath: fc.string({ minLength: 10, maxLength: 100 }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (websiteAnalysis, formElements) => {
          // Generate form accessibility test
          const testCase = generateFormAccessibilityTest(websiteAnalysis, formElements as any);
          
          // Verify test case has form accessibility patterns
          expect(testCase.testType).toBe('Accessibility');
          
          // Check steps mention form accessibility concepts
          const allStepsText = testCase.steps.map(s => s.action + ' ' + s.expectedResult).join(' ').toLowerCase();
          
          // Should mention labels
          expect(allStepsText.includes('label')).toBe(true);
          
          // Should mention required fields or error messages
          const hasFormValidation = 
            allStepsText.includes('required') ||
            allStepsText.includes('error');
          expect(hasFormValidation).toBe(true);
          
          // Should mention form or input
          const hasFormElements = 
            allStepsText.includes('form') ||
            allStepsText.includes('input') ||
            allStepsText.includes('field');
          expect(hasFormElements).toBe(true);
          
          // Verify WCAG criteria includes form-related standards
          expect(testCase.wcagSuccessCriteria.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Property 20: Interactive Element Accessibility Pattern
   * 
   * For any accessibility test case focused on interactive elements, the test steps 
   * should include focus management verification, keyboard shortcut testing, or skip 
   * link verification.
   * 
   * **Validates: Requirements 5.5**
   * **Feature: accessibility-api-testing, Property 20: Interactive Element Accessibility Pattern**
   */
  it('Property 20: should include interactive element patterns in focus management tests', () => {
    fc.assert(
      fc.property(
        websiteAnalysisArb,
        fc.array(interactiveElementArb, { minLength: 1, maxLength: 5 }),
        (websiteAnalysis, focusableElements) => {
          // Generate focus management test
          const testCase = generateFocusManagementTest(websiteAnalysis, focusableElements);
          
          // Verify test case has focus management patterns
          expect(testCase.testType).toBe('Accessibility');
          expect(testCase.keyboardAccess).toBe(true);
          
          // Check steps mention focus management concepts
          const allStepsText = testCase.steps.map(s => s.action + ' ' + s.expectedResult).join(' ').toLowerCase();
          
          // Should mention focus
          expect(allStepsText.includes('focus')).toBe(true);
          
          // Should mention focus order, indicators, or management
          const hasFocusManagement = 
            allStepsText.includes('order') ||
            allStepsText.includes('indicator') ||
            allStepsText.includes('modal') ||
            allStepsText.includes('skip');
          expect(hasFocusManagement).toBe(true);
          
          // Verify WCAG criteria includes focus-related standards (2.4.x)
          const hasFocusCriteria = testCase.wcagSuccessCriteria.some(c => 
            c.startsWith('2.4')
          );
          expect(hasFocusCriteria).toBe(true);
          
          // Verify WCAG principle includes Operable
          expect(testCase.wcagPrinciple).toContain('Operable');
        }
      ),
      { numRuns: 100 }
    );
  });
});


describe('Accessibility Automation Code Generation - Property-Based Tests', () => {
  
  /**
   * Property 7: Accessibility Automation Code
   * 
   * For any accessibility test case with automation mapping, the automation code should 
   * include references to accessibility testing libraries (axe-core, axe, or similar) and 
   * Playwright methods for keyboard interaction or ARIA verification.
   * 
   * **Validates: Requirements 2.6, 9.1, 9.2, 9.3, 9.4, 9.5**
   * **Feature: accessibility-api-testing, Property 7: Accessibility Automation Code**
   */
  it('Property 7: should generate automation code with axe-core and Playwright methods', () => {
    fc.assert(
      fc.property(
        websiteAnalysisArb,
        userPromptArb,
        fc.webUrl(),
        (websiteAnalysis, userPrompt, url) => {
          // Generate accessibility tests
          const testCases = generateAccessibilityTests(websiteAnalysis, userPrompt);
          
          // Verify each test case can generate automation code
          testCases.forEach((testCase) => {
            // Generate automation code
            const automationCode = generateAccessibilityAutomationCode(testCase, url);
            
            // Verify automation code is a non-empty string
            expect(typeof automationCode).toBe('string');
            expect(automationCode.length).toBeGreaterThan(0);
            
            // Requirement 9.1: Should include axe-core library imports
            const hasAxeCoreImport = 
              automationCode.includes('axe-core') ||
              automationCode.includes('AxeBuilder') ||
              automationCode.includes('axe');
            expect(hasAxeCoreImport).toBe(true);
            
            // Requirement 9.5: Should include axe.run() or AxeBuilder for comprehensive scanning
            const hasAxeScanning = 
              automationCode.includes('axe.run()') ||
              automationCode.includes('AxeBuilder') ||
              automationCode.includes('.analyze()');
            expect(hasAxeScanning).toBe(true);
            
            // Should include Playwright imports
            const hasPlaywrightImport = 
              automationCode.includes('@playwright/test') ||
              automationCode.includes('playwright');
            expect(hasPlaywrightImport).toBe(true);
            
            // Check for keyboard navigation if test includes keyboard access
            if (testCase.keyboardAccess || testCase.accessibilityTags.includes('keyboard-navigation')) {
              // Requirement 9.2: Should include keyboard navigation sequences using page.keyboard.press()
              const hasKeyboardNavigation = 
                automationCode.includes('page.keyboard.press') ||
                automationCode.includes('keyboard.press');
              expect(hasKeyboardNavigation).toBe(true);
              
              // Should test Tab key navigation
              const hasTabNavigation = 
                automationCode.includes('Tab') ||
                automationCode.includes('tab');
              expect(hasTabNavigation).toBe(true);
            }
            
            // Check for ARIA verification if test includes screen reader or ARIA tags
            if (testCase.accessibilityTags.includes('screen-reader') || 
                testCase.accessibilityTags.includes('aria')) {
              // Requirement 9.3: Should include ARIA attribute verification using getAttribute()
              const hasAriaVerification = 
                automationCode.includes('getAttribute') ||
                automationCode.includes('aria-label') ||
                automationCode.includes('aria-');
              expect(hasAriaVerification).toBe(true);
            }
            
            // Check for focus indicator verification if test includes focus management
            if (testCase.accessibilityTags.includes('focus-management') || 
                testCase.accessibilityTags.includes('focus-indicators')) {
              // Requirement 9.4: Should include focus indicator verification using page.evaluate()
              const hasFocusVerification = 
                automationCode.includes('page.evaluate') ||
                automationCode.includes('focus');
              expect(hasFocusVerification).toBe(true);
            }
            
            // Verify code structure
            // Should have test function
            expect(automationCode.includes('test(')).toBe(true);
            
            // Should have async function with page parameter
            expect(automationCode.includes('async ({ page })')).toBe(true);
            
            // Should navigate to URL
            expect(automationCode.includes('page.goto')).toBe(true);
            expect(automationCode.includes(url)).toBe(true);
            
            // Should have expect assertions
            expect(automationCode.includes('expect(')).toBe(true);
            
            // Should include WCAG information in comments
            const hasWCAGInfo = 
              automationCode.includes('WCAG') ||
              automationCode.includes(testCase.wcagVersion);
            expect(hasWCAGInfo).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
