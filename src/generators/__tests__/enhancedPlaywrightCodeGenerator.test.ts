/**
 * Enhanced Playwright Code Generator Tests
 * 
 * Integration tests for all accessibility code generation functionality
 * Requirements: 2.1-2.6, 3.1-3.6, 4.1-4.6, 5.1-5.6, 6.1-6.6, 8.1-8.6
 */

import { EnhancedPlaywrightAccessibilityCodeGenerator } from '../enhancedPlaywrightCodeGenerator';
import type { 
  ARIAComplianceRequirement,
  AccessibilityTestRequirements,
  DOMInspectionRequirement,
  KeyboardNavigationRequirement,
  VisualAccessibilityRequirement,
  WCAGGuidelineRequirement,
  AxeCoreConfiguration,
  ValidationRule
} from '../enhancedAccessibilityParser';
import { WCAGRuleset, ViolationHandlingStrategy } from '../enhancedAccessibilityParser';

describe('Enhanced Playwright Code Generator - Integration Tests', () => {
  let generator: EnhancedPlaywrightAccessibilityCodeGenerator;

  beforeEach(() => {
    generator = new EnhancedPlaywrightAccessibilityCodeGenerator();
  });

  describe('generateAccessibilityTestSuite - End-to-End Integration', () => {
    it('should generate complete test suite with all accessibility components', () => {
      const requirements: AccessibilityTestRequirements = {
        domInspection: [{
          type: 'image-alt',
          elements: ['img'],
          validationRules: [{ 
            attribute: 'alt', 
            condition: 'present', 
            description: 'Alt text must be present' 
          }],
          wcagCriteria: ['1.1.1']
        }],
        keyboardNavigation: [{
          type: 'tab-sequence',
          scope: 'page',
          expectedBehavior: 'Sequential navigation',
          wcagCriteria: ['2.1.1', '2.4.3']
        }],
        ariaCompliance: [{
          type: 'aria-labels',
          attributes: ['aria-label'],
          validationLogic: 'Verify labels',
          wcagCriteria: ['4.1.2']
        }],
        visualAccessibility: [{
          type: 'color-contrast',
          contrastRatio: 4.5,
          scope: ['text'],
          wcagCriteria: ['1.4.3']
        }],
        wcagGuidelines: [{
          successCriteria: '1.3.1',
          level: 'A',
          validationType: 'automated',
          testingApproach: 'DOM inspection'
        }],
        axeCoreIntegration: {
          rulesets: [WCAGRuleset.WCAG20AA],
          tags: ['best-practice'],
          violationHandling: ViolationHandlingStrategy.FAIL_ON_VIOLATIONS,
          reportingLevel: 'violations'
        }
      };

      const testSuite = generator.generateAccessibilityTestSuite(requirements);

      // Verify test suite structure
      expect(testSuite.imports).toBeDefined();
      expect(testSuite.setup).toBeDefined();
      expect(testSuite.testCases).toBeDefined();
      expect(testSuite.utilities).toBeDefined();

      // Verify imports include required dependencies
      expect(testSuite.imports).toContain("import { test, expect } from '@playwright/test';");
      expect(testSuite.imports).toContain("import AxeBuilder from '@axe-core/playwright';");

      // Verify test cases are generated
      expect(testSuite.testCases.length).toBeGreaterThan(0);
      
      // Verify keyboard navigation test case
      const keyboardTest = testSuite.testCases.find(tc => tc.name.includes('Keyboard'));
      expect(keyboardTest).toBeDefined();
      expect(keyboardTest?.wcagCriteria).toContain('2.1.1');
      expect(keyboardTest?.code).toContain('Tab key sequences');
    });

    it('should handle empty requirements gracefully', () => {
      const requirements: AccessibilityTestRequirements = {
        domInspection: [],
        keyboardNavigation: [],
        ariaCompliance: [],
        visualAccessibility: [],
        wcagGuidelines: [],
        axeCoreIntegration: {
          rulesets: [],
          tags: [],
          violationHandling: ViolationHandlingStrategy.FAIL_ON_VIOLATIONS,
          reportingLevel: 'violations'
        }
      };

      const testSuite = generator.generateAccessibilityTestSuite(requirements);

      expect(testSuite.imports).toBeDefined();
      expect(testSuite.setup).toBeDefined();
      expect(testSuite.testCases).toBeDefined();
      expect(testSuite.utilities).toBeDefined();
    });
  });

  describe('generateDOMInspectionCode - Requirements 2.1-2.6', () => {
    it('should generate image alt validation code', () => {
      const requirements: DOMInspectionRequirement[] = [{
        type: 'image-alt',
        elements: ['img', 'svg[role="img"]'],
        validationRules: [{ 
          attribute: 'alt', 
          condition: 'present', 
          description: 'Alt text must be meaningful' 
        }],
        wcagCriteria: ['1.1.1']
      }];

      const result = generator.generateDOMInspectionCode(requirements);

      expect(result).toContain('DOM Inspection');
      expect(result).toContain('Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6');
      expect(result).toContain('img, svg[role="img"]');
      expect(result).toContain('alt');
      expect(result).toContain('aria-label');
      expect(result).toContain('meaningful');
    });

    it('should generate form labels validation code', () => {
      const requirements: DOMInspectionRequirement[] = [{
        type: 'form-labels',
        elements: ['input', 'textarea', 'select'],
        validationRules: [{ 
          attribute: 'for', 
          condition: 'present', 
          description: 'Label association required' 
        }],
        wcagCriteria: ['1.3.1', '3.3.2']
      }];

      const result = generator.generateDOMInspectionCode(requirements);

      expect(result).toContain('form controls');
      expect(result).toContain('label[for=');
      expect(result).toContain('aria-labelledby');
      expect(result).toContain('accessible name');
    });

    it('should generate heading hierarchy validation code', () => {
      const requirements: DOMInspectionRequirement[] = [{
        type: 'heading-hierarchy',
        elements: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
        validationRules: [{ 
          attribute: 'level', 
          condition: 'matches', 
          expectedValue: 'sequential', 
          description: 'Sequential hierarchy required' 
        }],
        wcagCriteria: ['1.3.1', '2.4.6']
      }];

      const result = generator.generateDOMInspectionCode(requirements);

      expect(result).toContain('heading hierarchy');
      expect(result).toContain('h1, h2, h3, h4, h5, h6');
      expect(result).toContain('aria-level');
      expect(result).toContain('sequential');
    });

    it('should generate landmarks validation code', () => {
      const requirements: DOMInspectionRequirement[] = [{
        type: 'landmarks',
        elements: ['main', 'nav', 'header', 'footer'],
        validationRules: [{ 
          attribute: 'role', 
          condition: 'present', 
          description: 'Landmark structure required' 
        }],
        wcagCriteria: ['1.3.1', '2.4.1']
      }];

      const result = generator.generateDOMInspectionCode(requirements);

      expect(result).toContain('landmarks');
      expect(result).toContain('main');
      expect(result).toContain('banner');
      expect(result).toContain('contentinfo');
      expect(result).toContain('navigation');
    });

    it('should generate semantic HTML validation code', () => {
      const requirements: DOMInspectionRequirement[] = [{
        type: 'semantic-html',
        elements: ['article', 'section', 'aside', 'figure'],
        validationRules: [{ 
          attribute: 'semantic', 
          condition: 'present', 
          description: 'Semantic structure required' 
        }],
        wcagCriteria: ['1.3.1']
      }];

      const result = generator.generateDOMInspectionCode(requirements);

      expect(result).toContain('semantic HTML');
      expect(result).toContain('article');
      expect(result).toContain('figure');
      expect(result).toContain('figcaption');
    });
  });

  describe('generateKeyboardNavigationCode - Requirements 3.1-3.6', () => {
    it('should generate tab sequence validation code', () => {
      const requirements: KeyboardNavigationRequirement[] = [{
        type: 'tab-sequence',
        scope: 'page',
        expectedBehavior: 'Sequential tab navigation',
        wcagCriteria: ['2.1.1', '2.4.3']
      }];

      const result = generator.generateKeyboardNavigationCode(requirements);

      expect(result).toContain('Keyboard Navigation');
      expect(result).toContain('Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6');
      expect(result).toContain('Tab key sequences');
      expect(result).toContain('focus order');
      expect(result).toContain('keyboard activation');
    });

    it('should generate focus management validation code', () => {
      const requirements: KeyboardNavigationRequirement[] = [{
        type: 'focus-management',
        scope: 'modal',
        expectedBehavior: 'Focus trapped in modal',
        wcagCriteria: ['2.1.2', '2.4.3']
      }];

      const result = generator.generateKeyboardNavigationCode(requirements);

      expect(result).toContain('focus management');
      expect(result).toContain('keyboard trap');
      expect(result).toContain('modal');
    });

    it('should generate keyboard activation validation code', () => {
      const requirements: KeyboardNavigationRequirement[] = [{
        type: 'keyboard-activation',
        scope: 'component',
        expectedBehavior: 'Enter and Space activate elements',
        wcagCriteria: ['2.1.1']
      }];

      const result = generator.generateKeyboardNavigationCode(requirements);

      expect(result).toContain('keyboard activation');
      expect(result).toContain('Enter');
      expect(result).toContain('Space');
    });
  });

  describe('generateARIAValidationCode - Requirements 4.1-4.6', () => {
    it('should return empty validation message when no requirements provided', () => {
      const result = generator.generateARIAValidationCode([]);
      
      expect(result).toContain('No ARIA compliance requirements specified');
      expect(result).toContain('No ARIA validation to perform');
    });

    it('should generate ARIA labels validation code', () => {
      const requirements: ARIAComplianceRequirement[] = [{
        type: 'aria-labels',
        attributes: ['aria-label', 'aria-labelledby'],
        validationLogic: 'Verify accessible names',
        wcagCriteria: ['4.1.2', '1.3.1']
      }];

      const result = generator.generateARIAValidationCode(requirements);
      
      expect(result).toContain('ARIA Labels Validation');
      expect(result).toContain('4.1.2, 1.3.1');
      expect(result).toContain('interactiveElements');
      expect(result).toContain('aria-label');
      expect(result).toContain('aria-labelledby');
      expect(result).toContain('accessibleName');
      expect(result).toContain('expect(accessibleName).not.toBe');
    });

    it('should generate comprehensive validation for multiple ARIA requirements', () => {
      const requirements: ARIAComplianceRequirement[] = [
        {
          type: 'aria-labels',
          attributes: ['aria-label'],
          validationLogic: 'Verify labels',
          wcagCriteria: ['4.1.2']
        },
        {
          type: 'aria-states',
          attributes: ['aria-expanded'],
          validationLogic: 'Verify states',
          wcagCriteria: ['4.1.2']
        },
        {
          type: 'aria-live-regions',
          attributes: ['aria-live'],
          validationLogic: 'Verify live regions',
          wcagCriteria: ['4.1.3']
        }
      ];

      const result = generator.generateARIAValidationCode(requirements);
      
      expect(result).toContain('ARIA Compliance Validation');
      expect(result).toContain('Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6');
      expect(result).toContain('ARIA Labels Validation');
      expect(result).toContain('ARIA States Validation');
      expect(result).toContain('ARIA Live Regions Validation');
    });
  });

  describe('generateVisualAccessibilityCode - Requirements 5.1-5.6', () => {
    it('should return empty validation when no requirements provided', () => {
      const result = generator.generateVisualAccessibilityCode([]);
      
      expect(result).toContain('No visual accessibility requirements specified');
      expect(result).toContain('No visual accessibility validation to perform');
    });

    it('should generate color contrast validation code', () => {
      const requirements: VisualAccessibilityRequirement[] = [{
        type: 'color-contrast',
        contrastRatio: 4.5,
        scope: ['text', 'buttons'],
        wcagCriteria: ['1.4.3']
      }];

      const result = generator.generateVisualAccessibilityCode(requirements);

      expect(result).toContain('Visual Accessibility Validation');
      expect(result).toContain('Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6');
      expect(result).toContain('Color Contrast Validation');
      expect(result).toContain('browser APIs');
      expect(result).toContain('textElements');
      expect(result).toContain('getComputedStyle');
    });

    it('should generate focus indicator validation code', () => {
      const requirements: VisualAccessibilityRequirement[] = [{
        type: 'focus-indicators',
        contrastRatio: 3.0,
        scope: ['interactive'],
        wcagCriteria: ['1.4.11', '2.4.7']
      }];

      const result = generator.generateVisualAccessibilityCode(requirements);

      expect(result).toContain('Focus Indicator Validation');
      expect(result).toContain('interactiveElements');
      expect(result).toContain('focus()');
      expect(result).toContain('outline');
      expect(result).toContain('boxShadow');
      expect(result).toContain('hasVisibleIndicator');
    });
  });

  describe('generateWCAGValidationCode - Requirements 6.1-6.6', () => {
    it('should return empty validation when no requirements provided', () => {
      const result = generator.generateWCAGValidationCode([]);
      
      expect(result).toContain('No WCAG guideline requirements specified');
      expect(result).toContain('No WCAG validation to perform');
    });

    it('should generate Info and Relationships validation (WCAG 1.3.1)', () => {
      const requirements: WCAGGuidelineRequirement[] = [{
        successCriteria: '1.3.1',
        level: 'A',
        validationType: 'automated',
        testingApproach: 'DOM inspection'
      }];

      const result = generator.generateWCAGValidationCode(requirements);

      expect(result).toContain('WCAG Guideline Validation');
      expect(result).toContain('Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6');
      expect(result).toContain('WCAG 1.3.1 - Info and Relationships');
      expect(result).toContain('heading hierarchy');
      expect(result).toContain('table structure');
      expect(result).toContain('list structure');
    });

    it('should generate Bypass Blocks validation (WCAG 2.4.1)', () => {
      const requirements: WCAGGuidelineRequirement[] = [{
        successCriteria: '2.4.1',
        level: 'A',
        validationType: 'automated',
        testingApproach: 'Skip link detection'
      }];

      const result = generator.generateWCAGValidationCode(requirements);

      expect(result).toContain('WCAG 2.4.1 - Bypass Blocks');
      expect(result).toContain('skip links');
      expect(result).toContain('landmark structure');
      expect(result).toContain('bypass mechanism');
    });

    it('should generate Headings and Labels validation (WCAG 2.4.6)', () => {
      const requirements: WCAGGuidelineRequirement[] = [{
        successCriteria: '2.4.6',
        level: 'AA',
        validationType: 'automated',
        testingApproach: 'Content analysis'
      }];

      const result = generator.generateWCAGValidationCode(requirements);

      expect(result).toContain('WCAG 2.4.6 - Headings and Labels');
      expect(result).toContain('heading descriptiveness');
      expect(result).toContain('label descriptiveness');
      expect(result).toContain('generic');
    });

    it('should generate Keyboard validation (WCAG 2.1.1)', () => {
      const requirements: WCAGGuidelineRequirement[] = [{
        successCriteria: '2.1.1',
        level: 'A',
        validationType: 'automated',
        testingApproach: 'Keyboard simulation'
      }];

      const result = generator.generateWCAGValidationCode(requirements);

      expect(result).toContain('WCAG 2.1.1 - Keyboard');
      expect(result).toContain('keyboard accessibility');
      expect(result).toContain('interactive elements');
      expect(result).toContain('Tab navigation');
      expect(result).toContain('Enter key activation');
      expect(result).toContain('Space key activation');
    });
  });

  describe('generateAxeCoreIntegrationCode - Requirements 8.1-8.6', () => {
    it('should generate basic Axe-Core integration code', () => {
      const config: AxeCoreConfiguration = {
        rulesets: [WCAGRuleset.WCAG20AA],
        tags: ['best-practice'],
        violationHandling: ViolationHandlingStrategy.FAIL_ON_VIOLATIONS,
        reportingLevel: 'violations'
      };

      const result = generator.generateAxeCoreIntegrationCode(config);

      expect(result).toContain('Axe-Core Integration');
      expect(result).toContain('Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6');
      expect(result).toContain('AxeBuilder');
      expect(result).toContain('wcag2aa');
      expect(result).toContain('best-practice');
      expect(result).toContain('analyze()');
    });

    it('should generate violation handling code for fail-on-violations strategy', () => {
      const config: AxeCoreConfiguration = {
        rulesets: [WCAGRuleset.WCAG20AA],
        tags: [],
        violationHandling: ViolationHandlingStrategy.FAIL_ON_VIOLATIONS,
        reportingLevel: 'violations'
      };

      const result = generator.generateAxeCoreIntegrationCode(config);

      expect(result).toContain('Fail test if any violations are found');
      expect(result).toContain('axeResults.violations.length > 0');
      expect(result).toContain('throw new Error');
      expect(result).toContain('Accessibility violations found');
    });

    it('should generate violation handling code for warn-on-violations strategy', () => {
      const config: AxeCoreConfiguration = {
        rulesets: [WCAGRuleset.WCAG20AA],
        tags: [],
        violationHandling: ViolationHandlingStrategy.WARN_ON_VIOLATIONS,
        reportingLevel: 'violations'
      };

      const result = generator.generateAxeCoreIntegrationCode(config);

      expect(result).toContain('Log violations as warnings');
      expect(result).toContain('console.warn');
      expect(result).toContain('review required');
    });

    it('should generate detailed violation reporting', () => {
      const config: AxeCoreConfiguration = {
        rulesets: [WCAGRuleset.WCAG20AA],
        tags: [],
        violationHandling: ViolationHandlingStrategy.FAIL_ON_VIOLATIONS,
        reportingLevel: 'all'
      };

      const result = generator.generateAxeCoreIntegrationCode(config);

      expect(result).toContain('Accessibility Violations Found');
      expect(result).toContain('violation.id');
      expect(result).toContain('violation.description');
      expect(result).toContain('violation.impact');
      expect(result).toContain('violation.help');
      expect(result).toContain('violation.helpUrl');
      expect(result).toContain('node.target');
      expect(result).toContain('node.html');
      expect(result).toContain('failureSummary');
    });

    it('should generate incomplete checks logging', () => {
      const config: AxeCoreConfiguration = {
        rulesets: [WCAGRuleset.WCAG20AA],
        tags: [],
        violationHandling: ViolationHandlingStrategy.FAIL_ON_VIOLATIONS,
        reportingLevel: 'incomplete'
      };

      const result = generator.generateAxeCoreIntegrationCode(config);

      expect(result).toContain('Incomplete Accessibility Checks');
      expect(result).toContain('manual verification');
      expect(result).toContain('incomplete.id');
      expect(result).toContain('incomplete.description');
    });

    it('should handle multiple rulesets and tags', () => {
      const config: AxeCoreConfiguration = {
        rulesets: [WCAGRuleset.WCAG20A, WCAGRuleset.WCAG20AA, WCAGRuleset.WCAG21AA],
        tags: ['best-practice', 'experimental'],
        violationHandling: ViolationHandlingStrategy.FAIL_ON_VIOLATIONS,
        reportingLevel: 'violations'
      };

      const result = generator.generateAxeCoreIntegrationCode(config);

      expect(result).toContain('wcag2a');
      expect(result).toContain('wcag2aa');
      expect(result).toContain('wcag21aa');
      expect(result).toContain('best-practice');
      expect(result).toContain('experimental');
    });
  });

  describe('Code Generation Quality and Syntax', () => {
    it('should generate syntactically valid JavaScript/TypeScript code', () => {
      const requirements: AccessibilityTestRequirements = {
        domInspection: [{
          type: 'image-alt',
          elements: ['img'],
          validationRules: [{ 
            attribute: 'alt', 
            condition: 'present', 
            description: 'Alt text required' 
          }],
          wcagCriteria: ['1.1.1']
        }],
        keyboardNavigation: [{
          type: 'tab-sequence',
          scope: 'page',
          expectedBehavior: 'Sequential',
          wcagCriteria: ['2.1.1']
        }],
        ariaCompliance: [{
          type: 'aria-labels',
          attributes: ['aria-label'],
          validationLogic: 'Verify labels',
          wcagCriteria: ['4.1.2']
        }],
        visualAccessibility: [{
          type: 'color-contrast',
          contrastRatio: 4.5,
          scope: ['text'],
          wcagCriteria: ['1.4.3']
        }],
        wcagGuidelines: [{
          successCriteria: '1.3.1',
          level: 'A',
          validationType: 'automated',
          testingApproach: 'DOM'
        }],
        axeCoreIntegration: {
          rulesets: [WCAGRuleset.WCAG20AA],
          tags: [],
          violationHandling: ViolationHandlingStrategy.FAIL_ON_VIOLATIONS,
          reportingLevel: 'violations'
        }
      };

      const testSuite = generator.generateAccessibilityTestSuite(requirements);
      
      // Check each generated code block for basic syntax validity
      testSuite.testCases.forEach(testCase => {
        const code = testCase.code;
        
        // Basic syntax checks
        expect(code).not.toContain('undefined');
        expect(code).not.toContain('null');
        
        // Check for balanced brackets and parentheses
        const openBrackets = (code.match(/\[/g) || []).length;
        const closeBrackets = (code.match(/\]/g) || []).length;
        expect(openBrackets).toBe(closeBrackets);
        
        const openParens = (code.match(/\(/g) || []).length;
        const closeParens = (code.match(/\)/g) || []).length;
        expect(openParens).toBe(closeParens);
        
        // Check for proper Playwright syntax
        expect(code).toMatch(/await page\./);
        expect(code).toMatch(/expect\(/);
      });
    });

    it('should include proper WCAG criteria references in all generated code', () => {
      const requirements: AccessibilityTestRequirements = {
        domInspection: [{
          type: 'form-labels',
          elements: ['input'],
          validationRules: [{ 
            attribute: 'for', 
            condition: 'present', 
            description: 'Label association required' 
          }],
          wcagCriteria: ['1.3.1', '3.3.2']
        }],
        keyboardNavigation: [],
        ariaCompliance: [],
        visualAccessibility: [],
        wcagGuidelines: [],
        axeCoreIntegration: {
          rulesets: [],
          tags: [],
          violationHandling: ViolationHandlingStrategy.FAIL_ON_VIOLATIONS,
          reportingLevel: 'violations'
        }
      };

      const domCode = generator.generateDOMInspectionCode(requirements.domInspection);
      
      expect(domCode).toContain('1.3.1');
      expect(domCode).toContain('3.3.2');
      expect(domCode).toContain('WCAG');
    });

    it('should generate code with proper error handling and logging', () => {
      const requirements: ARIAComplianceRequirement[] = [{
        type: 'aria-states',
        attributes: ['aria-expanded'],
        validationLogic: 'Verify states',
        wcagCriteria: ['4.1.2']
      }];

      const result = generator.generateARIAValidationCode(requirements);
      
      expect(result).toContain('console.warn');
      expect(result).toContain('console.log');
      expect(result).toContain('try');
      expect(result).toContain('catch');
    });
  });

  describe('Integration with Existing System', () => {
    it('should generate code compatible with existing test infrastructure', () => {
      const testSuite = generator.generateAccessibilityTestSuite({
        domInspection: [],
        keyboardNavigation: [],
        ariaCompliance: [],
        visualAccessibility: [],
        wcagGuidelines: [],
        axeCoreIntegration: {
          rulesets: [WCAGRuleset.WCAG20AA],
          tags: [],
          violationHandling: ViolationHandlingStrategy.FAIL_ON_VIOLATIONS,
          reportingLevel: 'violations'
        }
      });

      // Verify compatibility with Playwright test framework
      expect(testSuite.imports).toContain("import { test, expect } from '@playwright/test';");
      
      // Verify setup includes standard Playwright patterns
      expect(testSuite.setup).toContain('waitForLoadState');
      
      // Verify utilities are properly formatted
      expect(testSuite.utilities).toBeDefined();
      expect(Array.isArray(testSuite.utilities)).toBe(true);
    });
  });
});