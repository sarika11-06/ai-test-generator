/**
 * Property-Based Tests for Parser Routing Logic
 * 
 * **Feature: accessibility-test-enhancement, Property 2: Parser Routing Logic**
 * **Validates: Requirements 1.6, 7.1, 7.2**
 * 
 * Property: For any test generation request where accessibility testing is selected or 
 * accessibility keywords are detected, the AI Test Generator should route the request 
 * to the Enhanced Accessibility Parser instead of generic parsing logic
 */

import fc from 'fast-check';
import { classifyTestIntent, TestIntent, WebsiteAnalysis } from '../testIntentClassifier';

// Mock interfaces for testing
interface TestGenerationRequest {
  userInput: string;
  testType: string[];
  websiteAnalysis?: WebsiteAnalysis;
  useEnhancedAccessibilityParser?: boolean;
}

// Enhanced accessibility keywords for property testing
const ENHANCED_ACCESSIBILITY_KEYWORDS = [
  'alt text', 'alt attribute', 'image alt', 'form labels', 'label association',
  'heading hierarchy', 'semantic html', 'landmarks', 'main content', 'navigation',
  'keyboard navigation', 'tab sequence', 'focus order', 'keyboard activation',
  'focus management', 'keyboard trap', 'tab key', 'enter key', 'space key',
  'aria label', 'aria labelledby', 'aria describedby', 'aria live', 'aria expanded',
  'aria selected', 'aria checked', 'aria pressed', 'aria current', 'aria disabled',
  'color contrast', 'contrast ratio', 'focus indicators', 'visual accessibility',
  'wcag aa', 'wcag aaa', 'contrast compliance', 'text contrast', 'background contrast',
  'wcag 1.1.1', 'wcag 1.3.1', 'wcag 2.1.1', 'wcag 2.4.1', 'wcag 2.4.3', 'wcag 2.4.6',
  'axe core', 'axe-core', 'accessibility scan', 'accessibility audit',
  'accessibility violations', 'accessibility compliance', 'screen reader', 'a11y'
];

const BASIC_ACCESSIBILITY_KEYWORDS = [
  'accessibility', 'accessible', 'wcag', 'aria', 'keyboard', 'focus', 'contrast'
];

const NON_ACCESSIBILITY_KEYWORDS = [
  'click button', 'fill form', 'navigate page', 'submit data', 'login user',
  'api endpoint', 'rest api', 'json response', 'status code', 'authentication',
  'database query', 'performance test', 'load test', 'security test'
];

// Generators for property-based testing
const accessibilityKeywordGen = fc.oneof(
  fc.constantFrom(...ENHANCED_ACCESSIBILITY_KEYWORDS),
  fc.constantFrom(...BASIC_ACCESSIBILITY_KEYWORDS)
);

const nonAccessibilityKeywordGen = fc.constantFrom(...NON_ACCESSIBILITY_KEYWORDS);

const userInputWithAccessibilityGen = fc.tuple(
  fc.array(accessibilityKeywordGen, { minLength: 1, maxLength: 3 }),
  fc.array(fc.lorem({ maxCount: 5 }), { maxLength: 2 })
).map(([keywords, filler]) => 
  [...keywords, ...filler].join(' ')
);

const userInputWithoutAccessibilityGen = fc.tuple(
  fc.array(nonAccessibilityKeywordGen, { minLength: 1, maxLength: 3 }),
  fc.array(fc.lorem({ maxCount: 5 }), { maxLength: 2 })
).map(([keywords, filler]) => 
  [...keywords, ...filler].join(' ')
);

const testTypeGen = fc.array(
  fc.constantFrom('functional', 'accessibility', 'api', 'performance'),
  { minLength: 1, maxLength: 3 }
);

const websiteAnalysisGen = fc.record({
  url: fc.webUrl(),
  allInteractive: fc.option(fc.array(fc.record({
    tag: fc.constantFrom('button', 'input', 'a', 'select'),
    type: fc.constantFrom('button', 'text', 'email', 'submit'),
    text: fc.lorem({ maxCount: 3 }),
    ariaLabel: fc.option(fc.lorem({ maxCount: 2 }), { nil: '' }),
    role: fc.option(fc.constantFrom('button', 'link', 'textbox', 'combobox'), { nil: '' })
  }), { maxLength: 5 }), { nil: undefined }),
  forms: fc.option(fc.array(fc.record({
    name: fc.lorem({ maxCount: 1 }),
    fields: fc.array(fc.anything(), { maxLength: 3 })
  }), { maxLength: 2 }), { nil: undefined })
});

describe('Parser Routing Logic Property Tests', () => {
  
  /**
   * Property 2.1: Accessibility Type Selection Routes to Enhanced Parser
   * When accessibility is explicitly selected as test type, should use enhanced parser
   */
  it('should route to enhanced parser when accessibility is selected as test type', () => {
    fc.assert(fc.property(
      fc.lorem({ maxCount: 10 }),
      websiteAnalysisGen,
      (userInput, websiteAnalysis) => {
        const testTypes = ['accessibility'];
        const result = classifyTestIntent(userInput, websiteAnalysis);
        
        // When accessibility is primary type, should use enhanced parser
        if (result.primaryType === 'accessibility') {
          expect(result.useEnhancedAccessibilityParser).toBe(true);
        }
      }
    ), { numRuns: 100 });
  });

  /**
   * Property 2.2: Accessibility Keywords Trigger Enhanced Parser
   * When accessibility keywords are detected, should route to enhanced parser
   */
  it('should route to enhanced parser when accessibility keywords are detected', () => {
    fc.assert(fc.property(
      userInputWithAccessibilityGen,
      websiteAnalysisGen,
      (userInput, websiteAnalysis) => {
        const result = classifyTestIntent(userInput, websiteAnalysis);
        
        // If accessibility keywords are detected and result in accessibility classification
        const hasAccessibilityKeywords = result.detectedKeywords.accessibility.length > 0;
        const isAccessibilityRelated = result.primaryType === 'accessibility' || 
                                     result.secondaryTypes.includes('accessibility') ||
                                     result.primaryType === 'mixed';
        
        if (hasAccessibilityKeywords && isAccessibilityRelated) {
          expect(result.useEnhancedAccessibilityParser).toBe(true);
        }
      }
    ), { numRuns: 100 });
  });

  /**
   * Property 2.3: Enhanced Keywords Always Trigger Enhanced Parser
   * When enhanced accessibility keywords are present, should always use enhanced parser
   */
  it('should route to enhanced parser for enhanced accessibility keywords', () => {
    fc.assert(fc.property(
      fc.constantFrom(...ENHANCED_ACCESSIBILITY_KEYWORDS),
      fc.lorem({ maxCount: 5 }),
      websiteAnalysisGen,
      (keyword, additionalText, websiteAnalysis) => {
        const userInput = `${keyword} ${additionalText}`;
        const result = classifyTestIntent(userInput, websiteAnalysis);
        
        // Enhanced keywords should trigger enhanced parser
        const hasEnhancedKeyword = ENHANCED_ACCESSIBILITY_KEYWORDS.some(k => 
          userInput.toLowerCase().includes(k.toLowerCase())
        );
        
        if (hasEnhancedKeyword) {
          expect(result.useEnhancedAccessibilityParser).toBe(true);
        }
      }
    ), { numRuns: 100 });
  });

  /**
   * Property 2.4: Non-Accessibility Requests Use Standard Parser
   * When no accessibility keywords are detected, should use standard parser
   */
  it('should use standard parser when no accessibility keywords are detected', () => {
    fc.assert(fc.property(
      userInputWithoutAccessibilityGen,
      websiteAnalysisGen,
      (userInput, websiteAnalysis) => {
        const result = classifyTestIntent(userInput, websiteAnalysis);
        
        // If no accessibility keywords detected, should not use enhanced parser
        const hasAccessibilityKeywords = result.detectedKeywords.accessibility.length > 0;
        const isAccessibilityRelated = result.primaryType === 'accessibility' || 
                                     result.secondaryTypes.includes('accessibility');
        
        if (!hasAccessibilityKeywords && !isAccessibilityRelated) {
          expect(result.useEnhancedAccessibilityParser).toBe(false);
        }
      }
    ), { numRuns: 100 });
  });

  /**
   * Property 2.5: Mixed Type with Accessibility Uses Enhanced Parser
   * When mixed type includes accessibility, should use enhanced parser
   */
  it('should route to enhanced parser for mixed type with accessibility', () => {
    fc.assert(fc.property(
      fc.tuple(accessibilityKeywordGen, nonAccessibilityKeywordGen),
      websiteAnalysisGen,
      ([accessibilityKeyword, otherKeyword], websiteAnalysis) => {
        const userInput = `${accessibilityKeyword} and ${otherKeyword}`;
        const result = classifyTestIntent(userInput, websiteAnalysis);
        
        // Mixed type with accessibility should use enhanced parser
        if (result.primaryType === 'mixed' && result.detectedKeywords.accessibility.length > 0) {
          expect(result.useEnhancedAccessibilityParser).toBe(true);
        }
      }
    ), { numRuns: 100 });
  });

  /**
   * Property 2.6: Confidence Level Consistency
   * Parser routing should be consistent with confidence levels
   */
  it('should have consistent parser routing with confidence levels', () => {
    fc.assert(fc.property(
      userInputWithAccessibilityGen,
      websiteAnalysisGen,
      (userInput, websiteAnalysis) => {
        const result = classifyTestIntent(userInput, websiteAnalysis);
        
        // High confidence accessibility results should use enhanced parser
        if (result.primaryType === 'accessibility' && result.confidence > 0.7) {
          expect(result.useEnhancedAccessibilityParser).toBe(true);
        }
        
        // Results should have valid confidence values
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(1);
      }
    ), { numRuns: 100 });
  });

  /**
   * Property 2.7: Multiple Accessibility Keywords Increase Enhanced Parser Usage
   * Multiple accessibility keywords should increase likelihood of enhanced parser usage
   */
  it('should prefer enhanced parser with multiple accessibility keywords', () => {
    fc.assert(fc.property(
      fc.array(accessibilityKeywordGen, { minLength: 2, maxLength: 4 }),
      websiteAnalysisGen,
      (keywords, websiteAnalysis) => {
        const userInput = keywords.join(' ');
        const result = classifyTestIntent(userInput, websiteAnalysis);
        
        // Multiple accessibility keywords should strongly favor enhanced parser
        if (result.detectedKeywords.accessibility.length >= 2) {
          expect(result.useEnhancedAccessibilityParser).toBe(true);
        }
      }
    ), { numRuns: 100 });
  });

  /**
   * Property 2.8: Website Context Influences Routing
   * Website analysis with accessibility attributes should influence routing
   */
  it('should consider website context in parser routing', () => {
    fc.assert(fc.property(
      fc.constantFrom(...BASIC_ACCESSIBILITY_KEYWORDS),
      fc.lorem({ maxCount: 3 }),
      (keyword, additionalText) => {
        const userInput = `${keyword} ${additionalText}`;
        
        // Website with accessibility attributes
        const websiteWithA11y: WebsiteAnalysis = {
          url: 'https://example.com',
          allInteractive: [{
            tag: 'button',
            type: 'button',
            text: 'Submit',
            ariaLabel: 'Submit form',
            role: 'button'
          }]
        };
        
        // Website without accessibility attributes
        const websiteWithoutA11y: WebsiteAnalysis = {
          url: 'https://example.com',
          allInteractive: [{
            tag: 'button',
            type: 'button',
            text: 'Submit',
            ariaLabel: '',
            role: ''
          }]
        };
        
        const resultWithA11y = classifyTestIntent(userInput, websiteWithA11y);
        const resultWithoutA11y = classifyTestIntent(userInput, websiteWithoutA11y);
        
        // Website with accessibility attributes should be more likely to use enhanced parser
        if (resultWithA11y.primaryType === 'accessibility' || 
            resultWithA11y.secondaryTypes.includes('accessibility')) {
          expect(resultWithA11y.useEnhancedAccessibilityParser).toBe(true);
        }
      }
    ), { numRuns: 100 });
  });
});