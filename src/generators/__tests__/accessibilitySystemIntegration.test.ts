/**
 * Integration Tests for Complete Accessibility Test Enhancement System
 * 
 * Tests end-to-end accessibility test generation from user input to generated code
 * Validates integration with existing test generation infrastructure
 * 
 * Requirements: All requirements - Complete system validation
 */

import { classifyTestIntent } from '../testIntentClassifier';
import { EnhancedAccessibilityParser, WCAGRuleset, ViolationHandlingStrategy } from '../enhancedAccessibilityParser';
import { selectAccessibilityTestTemplate, generateAxeCoreIntegrationCode } from '../accessibilityTestTemplates';
import { AccessibilityErrorHandler, AccessibilityErrorType } from '../accessibilityErrorHandler';

describe('Accessibility System Integration Tests', () => {
  let accessibilityParser: EnhancedAccessibilityParser;
  let errorHandler: AccessibilityErrorHandler;

  beforeEach(() => {
    accessibilityParser = new EnhancedAccessibilityParser();
    errorHandler = AccessibilityErrorHandler.getInstance();
    errorHandler.clearErrorLog();
  });

  describe('End-to-End Test Generation Flow', () => {
    it('should generate complete accessibility test from user input', () => {
      // Step 1: User provides accessibility testing instructions
      const userInput = 'Test keyboard navigation, check color contrast, and validate ARIA labels';
      const websiteAnalysis = {
        url: 'https://example.com',
        allInteractive: [
          { tag: 'button', type: 'button', text: 'Submit', ariaLabel: 'Submit form', role: 'button' },
          { tag: 'input', type: 'text', text: '', ariaLabel: 'Username', role: '' }
        ]
      };

      // Step 2: Classify test intent
      const intent = classifyTestIntent(userInput, websiteAnalysis);
      
      expect(intent.primaryType).toBe('accessibility');
      expect(intent.useEnhancedAccessibilityParser).toBe(true);
      expect(intent.detectedKeywords.accessibility.length).toBeGreaterThan(0);

      // Step 3: Parse accessibility requirements
      const requirements = accessibilityParser.parseInstructions(userInput, websiteAnalysis);
      
      expect(requirements.keyboardNavigation.length).toBeGreaterThan(0);
      expect(requirements.visualAccessibility.length).toBeGreaterThan(0);
      expect(requirements.ariaCompliance.length).toBeGreaterThan(0);

      // Step 4: Select appropriate template
      const templateSelection = selectAccessibilityTestTemplate(requirements, userInput);
      
      expect(templateSelection.selectedTemplate).toBeDefined();
      expect(templateSelection.customizations.length).toBeGreaterThan(0);
      expect(templateSelection.axeCoreConfig).toBeDefined();

      // Step 5: Generate Axe-Core integration code
      const axeCoreCode = generateAxeCoreIntegrationCode(templateSelection.axeCoreConfig);
      
      expect(axeCoreCode).toContain('AxeBuilder');
      expect(axeCoreCode).toContain('analyze()');
      expect(axeCoreCode).toContain('violations');
    });

    it('should handle complex accessibility requirements', () => {
      const complexInput = `
        Test comprehensive accessibility including:
        - Keyboard navigation with Tab and Shift+Tab
        - Screen reader compatibility with NVDA and JAWS
        - Color contrast meeting WCAG 2.1 AA standards
        - Form labels and error messages
        - Heading hierarchy and landmarks
        - Focus indicators and management
        - ARIA live regions and states
      `;

      const websiteAnalysis = {
        url: 'https://complex-app.com',
        allInteractive: [
          { tag: 'nav', type: '', text: 'Navigation', ariaLabel: 'Main navigation', role: 'navigation' },
          { tag: 'main', type: '', text: 'Content', ariaLabel: '', role: 'main' },
          { tag: 'form', type: '', text: 'Contact Form', ariaLabel: 'Contact us', role: 'form' }
        ]
      };

      // Test complete flow
      const intent = classifyTestIntent(complexInput, websiteAnalysis);
      expect(intent.useEnhancedAccessibilityParser).toBe(true);

      const requirements = accessibilityParser.parseInstructions(complexInput, websiteAnalysis);
      
      // Should detect multiple requirement types
      expect(requirements.keyboardNavigation.length).toBeGreaterThan(0);
      expect(requirements.ariaCompliance.length).toBeGreaterThan(0);
      expect(requirements.visualAccessibility.length).toBeGreaterThan(0);
      expect(requirements.domInspection.length).toBeGreaterThan(0);
      expect(requirements.wcagGuidelines.length).toBeGreaterThan(0);

      const templateSelection = selectAccessibilityTestTemplate(requirements, complexInput);
      
      // Should select comprehensive template for complex requirements
      expect(templateSelection.selectedTemplate.name).toContain('Comprehensive');
      expect(templateSelection.customizations.length).toBeGreaterThanOrEqual(4);
    });

    it('should integrate with error handling system', () => {
      // Test with invalid input
      const invalidInput = '';
      const websiteAnalysis = { url: 'https://example.com' };

      // Validate setup should catch errors
      const validation = errorHandler.validateAccessibilitySetup(invalidInput, websiteAnalysis);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors[0].type).toBe(AccessibilityErrorType.INVALID_INSTRUCTIONS);

      // Error handler should provide fallback
      const fallbackRequirements = errorHandler.handleError(validation.errors[0]);
      
      expect(fallbackRequirements).toBeDefined();
      expect(fallbackRequirements.domInspection).toBeDefined();
      expect(fallbackRequirements.keyboardNavigation).toBeDefined();
    });
  });

  describe('Template Integration', () => {
    it('should select appropriate templates based on requirements', () => {
      const testCases = [
        {
          input: 'test keyboard navigation only',
          expectedTemplate: 'Keyboard Navigation'
        },
        {
          input: 'check color contrast and focus indicators',
          expectedTemplate: 'Visual Accessibility'
        },
        {
          input: 'validate ARIA labels and screen reader compatibility',
          expectedTemplate: 'ARIA Compliance'
        },
        {
          input: 'test DOM structure and semantic HTML',
          expectedTemplate: 'DOM Inspection'
        },
        {
          input: 'comprehensive accessibility testing with all features',
          expectedTemplate: 'Comprehensive'
        }
      ];

      testCases.forEach(testCase => {
        const requirements = accessibilityParser.parseInstructions(
          testCase.input,
          { url: 'https://example.com' }
        );
        
        const templateSelection = selectAccessibilityTestTemplate(requirements, testCase.input);
        
        expect(templateSelection.selectedTemplate.name).toContain(testCase.expectedTemplate);
      });
    });

    it('should generate valid Axe-Core integration for all templates', () => {
      const axeConfigs = [
        { rulesets: ['wcag2a', 'wcag2aa'], tags: ['wcag2a'], disabledRules: [], reportingLevel: 'violations' as const },
        { rulesets: ['wcag21aa', 'section508'], tags: ['wcag21aa'], disabledRules: ['color-contrast'], reportingLevel: 'all' as const }
      ];

      axeConfigs.forEach(config => {
        const axeCoreCode = generateAxeCoreIntegrationCode(config);
        
        expect(axeCoreCode).toContain('AxeBuilder');
        expect(axeCoreCode).toContain('withTags');
        expect(axeCoreCode).toContain('analyze()');
        expect(axeCoreCode).toContain('expect(accessibilityScanResults.violations)');
        
        if (config.disabledRules.length > 0) {
          expect(axeCoreCode).toContain('disableRules');
        }
        
        if (config.reportingLevel === 'all') {
          expect(axeCoreCode).toContain('passes.length');
        }
      });
    });
  });

  describe('Parser Integration', () => {
    it('should correctly route accessibility requests to enhanced parser', () => {
      const accessibilityInputs = [
        'test accessibility with screen reader',
        'check keyboard navigation and focus',
        'validate WCAG 2.1 compliance',
        'test color contrast ratios',
        'check ARIA attributes and roles'
      ];

      accessibilityInputs.forEach(input => {
        const intent = classifyTestIntent(input, { url: 'https://example.com' });
        
        expect(intent.useEnhancedAccessibilityParser).toBe(true);
        expect(intent.primaryType === 'accessibility' || intent.secondaryTypes.includes('accessibility')).toBe(true);
      });
    });

    it('should not route non-accessibility requests to enhanced parser', () => {
      const nonAccessibilityInputs = [
        'test login functionality',
        'validate API responses',
        'check database connections',
        'test performance metrics'
      ];

      nonAccessibilityInputs.forEach(input => {
        const intent = classifyTestIntent(input, { url: 'https://example.com' });
        
        expect(intent.useEnhancedAccessibilityParser).toBe(false);
      });
    });

    it('should parse complex accessibility patterns correctly', () => {
      const complexPatterns = [
        {
          input: 'Test Tab key navigation through form fields with proper focus order',
          expectedTypes: ['keyboard-navigation']
        },
        {
          input: 'Validate image alt attributes and figure captions for screen readers',
          expectedTypes: ['dom-inspection', 'aria-compliance']
        },
        {
          input: 'Check 4.5:1 color contrast ratio for normal text and 3:1 for large text',
          expectedTypes: ['visual-accessibility']
        },
        {
          input: 'Ensure WCAG 2.4.1 bypass blocks with skip links to main content',
          expectedTypes: ['wcag-guidelines']
        }
      ];

      complexPatterns.forEach(pattern => {
        const requirements = accessibilityParser.parseInstructions(
          pattern.input,
          { url: 'https://example.com' }
        );

        pattern.expectedTypes.forEach(expectedType => {
          switch (expectedType) {
            case 'keyboard-navigation':
              expect(requirements.keyboardNavigation.length).toBeGreaterThan(0);
              break;
            case 'dom-inspection':
              expect(requirements.domInspection.length).toBeGreaterThan(0);
              break;
            case 'aria-compliance':
              expect(requirements.ariaCompliance.length).toBeGreaterThan(0);
              break;
            case 'visual-accessibility':
              expect(requirements.visualAccessibility.length).toBeGreaterThan(0);
              break;
            case 'wcag-guidelines':
              expect(requirements.wcagGuidelines.length).toBeGreaterThan(0);
              break;
          }
        });
      });
    });
  });

  describe('Code Generation Integration', () => {
    it('should generate executable Playwright code', () => {
      const requirements = accessibilityParser.parseInstructions(
        'Test keyboard navigation and ARIA labels',
        { url: 'https://example.com' }
      );

      const templateSelection = selectAccessibilityTestTemplate(requirements, 'Test keyboard navigation and ARIA labels');
      
      // Verify template contains executable code patterns
      expect(templateSelection.selectedTemplate.setupCode).toContain('import');
      expect(templateSelection.selectedTemplate.codeTemplate).toContain('test(');
      expect(templateSelection.selectedTemplate.codeTemplate).toContain('page.goto');
      
      // Verify Axe-Core integration
      const axeCoreCode = generateAxeCoreIntegrationCode(templateSelection.axeCoreConfig);
      expect(axeCoreCode).toContain('new AxeBuilder({ page })');
      expect(axeCoreCode).toContain('.analyze()');
    });

    it('should include proper error handling in generated code', () => {
      const templateSelection = selectAccessibilityTestTemplate(
        {
          domInspection: [{ type: 'image-alt', elements: ['img'], validationRules: [], wcagCriteria: ['1.1.1'] }],
          keyboardNavigation: [],
          ariaCompliance: [],
          visualAccessibility: [],
          wcagGuidelines: [],
          axeCoreIntegration: { 
            rulesets: [WCAGRuleset.WCAG20AA], 
            tags: ['wcag2aa'], 
            violationHandling: ViolationHandlingStrategy.FAIL_ON_VIOLATIONS,
            reportingLevel: 'violations' as const 
          }
        },
        'test image alt attributes'
      );

      const axeCoreCode = generateAxeCoreIntegrationCode(templateSelection.axeCoreConfig);
      
      // Should include error handling for violations
      expect(axeCoreCode).toContain('expect(accessibilityScanResults.violations).toHaveLength(0)');
      expect(axeCoreCode).toContain('console.error');
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain compatibility with existing accessibility tests', () => {
      // Test that non-enhanced accessibility requests still work
      const basicInput = 'accessibility test';
      const websiteAnalysis = { url: 'https://example.com' };

      const intent = classifyTestIntent(basicInput, websiteAnalysis);
      
      // Should still be classified as accessibility
      expect(intent.primaryType === 'accessibility' || intent.secondaryTypes.includes('accessibility')).toBe(true);
      
      // Enhanced parser should handle basic input gracefully
      const requirements = accessibilityParser.parseInstructions(basicInput, websiteAnalysis);
      expect(requirements).toBeDefined();
    });

    it('should provide fallbacks for unsupported features', () => {
      // Test with unsupported accessibility feature
      const unsupportedInput = 'test advanced AI-powered accessibility analysis';
      
      const validation = errorHandler.validateAccessibilitySetup(unsupportedInput, { url: 'https://example.com' });
      
      if (!validation.isValid) {
        const fallback = errorHandler.handleError(validation.errors[0]);
        expect(fallback).toBeDefined();
      }
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle large numbers of accessibility requirements efficiently', () => {
      const largeInput = Array(50).fill('test keyboard navigation, ARIA labels, color contrast, and WCAG compliance').join('. ');
      
      const startTime = Date.now();
      const requirements = accessibilityParser.parseInstructions(largeInput, { url: 'https://example.com' });
      const endTime = Date.now();
      
      // Should complete within reasonable time (less than 5 seconds)
      expect(endTime - startTime).toBeLessThan(5000);
      expect(requirements).toBeDefined();
    });

    it('should handle malformed input gracefully', () => {
      const malformedInputs = [
        null,
        undefined,
        '',
        '   ',
        'test @#$%^&*() invalid characters',
        'a'.repeat(10000), // Very long input
        '测试中文输入', // Non-English input
      ];

      malformedInputs.forEach(input => {
        expect(() => {
          if (input !== null && input !== undefined) {
            const requirements = accessibilityParser.parseInstructions(input, { url: 'https://example.com' });
            expect(requirements).toBeDefined();
          }
        }).not.toThrow();
      });
    });
  });

  describe('WCAG Compliance Integration', () => {
    it('should map user requirements to correct WCAG success criteria', () => {
      const wcagMappings = [
        { input: 'test image alt text', expectedCriteria: ['1.1.1'] },
        { input: 'check keyboard navigation', expectedCriteria: ['2.1.1'] },
        { input: 'validate color contrast', expectedCriteria: ['1.4.3'] },
        { input: 'test heading hierarchy', expectedCriteria: ['1.3.1', '2.4.6'] },
        { input: 'check skip links', expectedCriteria: ['2.4.1'] }
      ];

      wcagMappings.forEach(mapping => {
        const requirements = accessibilityParser.parseInstructions(
          mapping.input,
          { url: 'https://example.com' }
        );

        // Check if any requirement contains expected WCAG criteria
        const allCriteria = [
          ...requirements.domInspection.flatMap(req => req.wcagCriteria),
          ...requirements.keyboardNavigation.flatMap(req => req.wcagCriteria),
          ...requirements.ariaCompliance.flatMap(req => req.wcagCriteria),
          ...requirements.visualAccessibility.flatMap(req => req.wcagCriteria),
          ...requirements.wcagGuidelines.map(req => req.successCriteria)
        ];

        const hasExpectedCriteria = mapping.expectedCriteria.some(criteria => 
          allCriteria.includes(criteria)
        );
        
        expect(hasExpectedCriteria).toBe(true);
      });
    });

    it('should validate WCAG criteria correctly', () => {
      const validCriteria = ['1.1.1', '2.1.1', '4.1.2'];
      const invalidCriteria = ['9.9.9', 'invalid'];

      const validResult = errorHandler.validateWCAGCriteria(validCriteria);
      expect(validResult.isValid).toBe(true);

      const invalidResult = errorHandler.validateWCAGCriteria(invalidCriteria);
      expect(invalidResult.isValid).toBe(false);
    });
  });
});