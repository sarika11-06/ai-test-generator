/**
 * Property-Based Tests for Accessibility Test Template Selection
 * 
 * **Feature: accessibility-test-enhancement, Property 8: Accessibility Test Template Selection**
 * 
 * Tests the universal property that accessibility test generation requests should use 
 * accessibility-focused code templates and include Axe-Core integration while maintaining 
 * backward compatibility with existing functionality.
 * 
 * **Validates: Requirements 7.3, 7.4, 7.5, 7.6**
 */

import fc from 'fast-check';
import { 
  selectAccessibilityTestTemplate, 
  generateAxeCoreIntegrationCode,
  generateAccessibilityTestingFeedback,
  type AccessibilityTestTemplate,
  type TemplateSelectionResult 
} from '../accessibilityTestTemplates';
import { EnhancedAccessibilityParser, type AccessibilityTestRequirements } from '../enhancedAccessibilityParser';
import { IntegratedTestRouter } from '../integratedTestRouter';

// Test data generators for property-based testing
const accessibilityKeywordArb = fc.oneof(
  fc.constant('accessibility'),
  fc.constant('aria'),
  fc.constant('wcag'),
  fc.constant('keyboard navigation'),
  fc.constant('screen reader'),
  fc.constant('focus management'),
  fc.constant('color contrast'),
  fc.constant('alt text'),
  fc.constant('form labels'),
  fc.constant('heading hierarchy')
);

const accessibilityInstructionArb = fc.record({
  baseInstruction: fc.string({ minLength: 10, maxLength: 100 }),
  accessibilityKeywords: fc.array(accessibilityKeywordArb, { minLength: 1, maxLength: 3 }),
  hasSpecificSteps: fc.boolean(),
  includesAxeCore: fc.boolean()
}).map(({ baseInstruction, accessibilityKeywords, hasSpecificSteps, includesAxeCore }) => {
  let instruction = baseInstruction;
  
  // Add accessibility keywords
  accessibilityKeywords.forEach(keyword => {
    instruction += ` ${keyword}`;
  });
  
  // Add specific steps if requested
  if (hasSpecificSteps) {
    instruction += ' step 1: load page, step 2: check compliance';
  }
  
  // Add Axe-Core reference if requested
  if (includesAxeCore) {
    instruction += ' using axe-core';
  }
  
  return instruction;
});

const websiteAnalysisArb = fc.record({
  url: fc.webUrl(),
  allInteractive: fc.array(fc.record({
    tag: fc.oneof(fc.constant('button'), fc.constant('a'), fc.constant('input')),
    type: fc.oneof(fc.constant('button'), fc.constant('submit'), fc.constant('text')),
    text: fc.string({ minLength: 1, maxLength: 20 }),
    ariaLabel: fc.string({ minLength: 1, maxLength: 20 }),
    role: fc.oneof(fc.constant('button'), fc.constant('link'), fc.constant('textbox'))
  }), { maxLength: 10 })
});

describe('Property 8: Accessibility Test Template Selection', () => {
  const parser = new EnhancedAccessibilityParser();
  const router = new IntegratedTestRouter();

  it('should always select accessibility-focused templates for accessibility test requests', () => {
    fc.assert(fc.property(
      accessibilityInstructionArb,
      websiteAnalysisArb,
      (instruction, websiteAnalysis) => {
        // Parse the accessibility instruction
        const requirements: AccessibilityTestRequirements = parser.parseInstructions(
          instruction,
          websiteAnalysis
        );
        
        // Select template based on requirements
        const templateSelection: TemplateSelectionResult = selectAccessibilityTestTemplate(
          requirements,
          instruction
        );
        
        // **Property 8.1**: Template selection should always return a valid accessibility template
        expect(templateSelection.selectedTemplate).toBeDefined();
        expect(templateSelection.selectedTemplate.name).toBeTruthy();
        
        // **Property 8.2**: Template should include accessibility-specific features
        const template = templateSelection.selectedTemplate;
        expect(template.setupCode).toContain('AxeBuilder');
        expect(template.codeTemplate).toContain('accessibility');
        
        // **Property 8.3**: Axe-Core integration should always be included
        expect(templateSelection.axeCoreConfig).toBeDefined();
        expect(templateSelection.axeCoreConfig.rulesets).toContain('wcag21aa');
        
        // **Property 8.4**: Template customizations should be accessibility-focused
        templateSelection.customizations.forEach(customization => {
          expect(['dom-inspection', 'keyboard-navigation', 'aria-compliance', 'visual-accessibility', 'wcag-guidelines'])
            .toContain(customization.feature);
        });
        
        return true;
      }
    ), { numRuns: 10 }); // Reduced runs for faster testing
  });

  it('should generate Axe-Core integration code for all accessibility templates', () => {
    fc.assert(fc.property(
      accessibilityInstructionArb,
      websiteAnalysisArb,
      (instruction, websiteAnalysis) => {
        // Parse requirements and select template
        const requirements = parser.parseInstructions(instruction, websiteAnalysis);
        const templateSelection = selectAccessibilityTestTemplate(requirements, instruction);
        
        // Generate Axe-Core integration code
        const axeCoreCode = generateAxeCoreIntegrationCode(templateSelection.axeCoreConfig);
        
        // **Property 8.5**: Axe-Core code should always include required imports and setup
        expect(axeCoreCode).toContain('AxeBuilder');
        expect(axeCoreCode).toContain('import');
        expect(axeCoreCode).toContain('analyze()');
        
        // **Property 8.6**: Axe-Core code should include WCAG rule sets
        expect(axeCoreCode).toContain('wcag2a');
        expect(axeCoreCode).toContain('wcag2aa');
        expect(axeCoreCode).toContain('wcag21aa');
        
        // **Property 8.7**: Axe-Core code should include violation handling
        expect(axeCoreCode).toContain('violations');
        expect(axeCoreCode).toContain('expect');
        
        return true;
      }
    ), { numRuns: 100 });
  });

  it('should provide user feedback for accessibility-specific parsing activation', () => {
    fc.assert(fc.property(
      accessibilityInstructionArb,
      websiteAnalysisArb,
      (instruction, websiteAnalysis) => {
        // Parse requirements and select template
        const requirements = parser.parseInstructions(instruction, websiteAnalysis);
        const templateSelection = selectAccessibilityTestTemplate(requirements, instruction);
        
        // Generate user feedback
        const feedback = generateAccessibilityTestingFeedback(
          templateSelection.selectedTemplate,
          templateSelection.customizations.map(c => c.feature)
        );
        
        // **Property 8.8**: Feedback should indicate enhanced accessibility testing is active
        expect(feedback).toContain('accessibility');
        expect(feedback).toContain('enhanced');
        
        // **Property 8.9**: Feedback should mention specific accessibility features being tested
        const features = templateSelection.customizations.map(c => c.feature);
        if (features.includes('dom-inspection')) {
          expect(feedback).toMatch(/dom|element|semantic/i);
        }
        if (features.includes('keyboard-navigation')) {
          expect(feedback).toMatch(/keyboard|navigation|focus/i);
        }
        if (features.includes('aria-compliance')) {
          expect(feedback).toMatch(/aria|attributes|compliance/i);
        }
        
        return true;
      }
    ), { numRuns: 100 });
  });

  it('should maintain backward compatibility with existing accessibility functionality', () => {
    fc.assert(fc.property(
      fc.string({ minLength: 5, maxLength: 50 }),
      websiteAnalysisArb,
      (genericInstruction, websiteAnalysis) => {
        // Test with generic (non-accessibility-specific) instruction
        const requirements = parser.parseInstructions(genericInstruction, websiteAnalysis);
        
        // Even for generic instructions, if accessibility testing is requested,
        // the system should still work (backward compatibility)
        const templateSelection = selectAccessibilityTestTemplate(requirements, genericInstruction);
        
        // **Property 8.10**: System should handle non-accessibility instructions gracefully
        expect(templateSelection.selectedTemplate).toBeDefined();
        
        // **Property 8.11**: Axe-Core integration should still be included for backward compatibility
        expect(templateSelection.axeCoreConfig).toBeDefined();
        
        // **Property 8.12**: Template should provide basic accessibility testing even for generic requests
        const axeCoreCode = generateAxeCoreIntegrationCode(templateSelection.axeCoreConfig);
        expect(axeCoreCode).toContain('AxeBuilder');
        expect(axeCoreCode).toContain('violations');
        
        return true;
      }
    ), { numRuns: 100 });
  });

  it('should include WCAG criteria tagging in accessibility test templates', () => {
    fc.assert(fc.property(
      accessibilityInstructionArb,
      websiteAnalysisArb,
      (instruction, websiteAnalysis) => {
        // Parse requirements and select template
        const requirements = parser.parseInstructions(instruction, websiteAnalysis);
        const templateSelection = selectAccessibilityTestTemplate(requirements, instruction);
        
        // **Property 8.17**: Template should include WCAG criteria references
        const template = templateSelection.selectedTemplate;
        expect(template.wcagCriteria).toBeDefined();
        expect(template.wcagCriteria.length).toBeGreaterThan(0);
        
        // **Property 8.18**: WCAG criteria should be valid format (X.X.X)
        template.wcagCriteria.forEach(criteria => {
          expect(criteria).toMatch(/^\d+\.\d+\.\d+$/);
        });
        
        // **Property 8.19**: Template code should include WCAG criteria tagging
        expect(template.codeTemplate).toContain('wcag');
        
        return true;
      }
    ), { numRuns: 100 });
  });

  it('should handle edge cases in template selection gracefully', () => {
    fc.assert(fc.property(
      fc.oneof(
        fc.constant(''), // Empty instruction
        fc.constant('   '), // Whitespace only
        fc.string({ minLength: 1, maxLength: 5 }), // Very short instruction
        fc.string({ minLength: 500, maxLength: 1000 }) // Very long instruction
      ),
      websiteAnalysisArb,
      (edgeCaseInstruction, websiteAnalysis) => {
        // Test edge cases in instruction parsing and template selection
        const requirements = parser.parseInstructions(edgeCaseInstruction, websiteAnalysis);
        const templateSelection = selectAccessibilityTestTemplate(requirements, edgeCaseInstruction);
        
        // **Property 8.20**: System should handle edge cases without crashing
        expect(templateSelection.selectedTemplate).toBeDefined();
        expect(templateSelection.selectedTemplate.name).toBeTruthy();
        
        // **Property 8.21**: Even for edge cases, basic accessibility features should be included
        expect(templateSelection.axeCoreConfig).toBeDefined();
        
        // **Property 8.22**: Axe-Core integration should work for edge cases
        const axeCoreCode = generateAxeCoreIntegrationCode(templateSelection.axeCoreConfig);
        expect(axeCoreCode).toContain('AxeBuilder');
        
        return true;
      }
    ), { numRuns: 100 });
  });
});

/**
 * Integration property tests for template selection with real accessibility scenarios
 */
describe('Property 8: Real-world Accessibility Template Selection Scenarios', () => {
  const parser = new EnhancedAccessibilityParser();

  const realWorldScenarios = [
    'Test keyboard navigation and ARIA compliance for a login form',
    'Verify color contrast and focus indicators meet WCAG AA standards',
    'Check that all images have proper alt text and semantic markup',
    'Validate form error messages are properly associated with fields using aria-describedby',
    'Test screen reader compatibility and heading hierarchy',
    'Ensure skip links and landmark roles are properly implemented'
  ];

  it('should select appropriate templates for real-world accessibility scenarios', () => {
    realWorldScenarios.forEach(scenario => {
      const websiteAnalysis = {
        url: 'https://example.com',
        allInteractive: [
          { tag: 'button', type: 'submit', text: 'Submit', ariaLabel: 'Submit form', role: 'button' },
          { tag: 'input', type: 'email', text: '', ariaLabel: 'Email address', role: 'textbox' },
          { tag: 'a', type: 'link', text: 'Home', ariaLabel: 'Go to home page', role: 'link' }
        ]
      };

      // Parse the real-world scenario
      const requirements = parser.parseInstructions(scenario, websiteAnalysis);
      const templateSelection = selectAccessibilityTestTemplate(requirements, scenario);

      // **Property 8.23**: Real-world scenarios should get comprehensive templates
      expect(templateSelection.selectedTemplate.name).toContain('Accessibility');
      expect(templateSelection.customizations.length).toBeGreaterThan(0);

      // **Property 8.24**: Template should match the scenario's focus area
      if (scenario.includes('keyboard')) {
        expect(templateSelection.customizations.some(c => c.feature === 'keyboard-navigation')).toBe(true);
      }
      if (scenario.includes('aria') || scenario.includes('ARIA')) {
        expect(templateSelection.customizations.some(c => c.feature === 'aria-compliance')).toBe(true);
      }
      if (scenario.includes('contrast') || scenario.includes('color')) {
        expect(templateSelection.customizations.some(c => c.feature === 'visual-accessibility')).toBe(true);
      }
      if (scenario.includes('alt text') || scenario.includes('semantic')) {
        expect(templateSelection.customizations.some(c => c.feature === 'dom-inspection')).toBe(true);
      }

      // **Property 8.25**: All real-world scenarios should include Axe-Core
      expect(templateSelection.axeCoreConfig.rulesets).toContain('wcag21aa');
      
      const axeCoreCode = generateAxeCoreIntegrationCode(templateSelection.axeCoreConfig);
      expect(axeCoreCode).toContain('AxeBuilder');
      expect(axeCoreCode).toContain('violations');
    });
  });
});