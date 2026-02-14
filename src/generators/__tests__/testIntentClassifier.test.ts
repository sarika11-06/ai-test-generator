import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';
import { classifyTestIntent } from '../testIntentClassifier';
import type { WebsiteAnalysis } from '../testIntentClassifier';

/**
 * Property-Based Tests for Test Intent Classifier
 * 
 * These tests validate universal properties that should hold across all inputs
 * using fast-check for property-based testing with 100+ iterations per test.
 */

describe('Test Intent Classifier - Property-Based Tests', () => {
  
  /**
   * Helper: Create a minimal valid WebsiteAnalysis object
   */
  const createMinimalAnalysis = (): WebsiteAnalysis => ({
    url: 'https://example.com',
    allInteractive: [],
  });
  
  /**
   * Helper: Create WebsiteAnalysis with interactive elements
   */
  const createAnalysisWithElements = (hasAria: boolean = false): WebsiteAnalysis => ({
    url: 'https://example.com',
    allInteractive: [
      {
        tag: 'button',
        type: 'button',
        text: 'Submit',
        ariaLabel: hasAria ? 'Submit form' : '',
        role: hasAria ? 'button' : '',
        placeholder: '',
        name: 'submit',
        id: 'submit-btn',
        selectors: ['#submit-btn'],
        xpath: '//button[@id="submit-btn"]',
      },
    ],
  });
  
  /**
   * Property 4: Accessibility Keyword Classification
   * 
   * For any user prompt containing accessibility keywords ("screen reader", "keyboard", 
   * "ARIA", "WCAG", "a11y", "accessible", "focus", "tab navigation"), the test intent 
   * classifier should identify "accessibility" as the primary or secondary test type 
   * with confidence > 0.7.
   * 
   * **Validates: Requirements 2.1, 4.1**
   * **Feature: accessibility-api-testing, Property 4: Accessibility Keyword Classification**
   */
  it('Property 4: should classify accessibility keywords with high confidence', () => {
    // Define accessibility keywords to test
    const accessibilityKeywords = [
      'screen reader',
      'keyboard',
      'ARIA',
      'WCAG',
      'a11y',
      'accessible',
      'focus',
      'tab navigation',
      'keyboard navigation',
      'color contrast',
      'aria label',
      'aria role',
    ];
    
    fc.assert(
      fc.property(
        // Generate random prompts containing accessibility keywords
        fc.constantFrom(...accessibilityKeywords),
        fc.string({ minLength: 0, maxLength: 50 }),
        fc.string({ minLength: 0, maxLength: 50 }),
        (keyword, prefix, suffix) => {
          // Construct prompt with accessibility keyword
          const prompt = `${prefix} ${keyword} ${suffix}`.trim();
          const analysis = createMinimalAnalysis();
          
          // Classify the intent
          const result = classifyTestIntent(prompt, analysis);
          
          // Verify accessibility is identified as primary or secondary type
          const isAccessibilityIdentified = 
            result.primaryType === 'accessibility' ||
            result.secondaryTypes.includes('accessibility') ||
            result.primaryType === 'mixed';
          
          // Property: If accessibility keyword is present, it should be identified
          expect(isAccessibilityIdentified).toBe(true);
          
          // If accessibility is the primary type (not mixed), confidence should be >= 0.7
          if (result.primaryType === 'accessibility') {
            expect(result.confidence).toBeGreaterThanOrEqual(0.7);
          }
          
          // Verify the keyword was detected
          expect(result.detectedKeywords.accessibility.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  });
  
  /**
   * Property 8: API Keyword Classification
   * 
   * For any user prompt containing API keywords ("API", "endpoint", "REST", "GraphQL", 
   * "status code", "JSON", "schema", "request", "response", "HTTP"), the test intent 
   * classifier should identify "api" as the primary or secondary test type with 
   * confidence > 0.7.
   * 
   * **Validates: Requirements 3.1, 4.2**
   * **Feature: accessibility-api-testing, Property 8: API Keyword Classification**
   */
  it('Property 8: should classify API keywords with high confidence', () => {
    // Define API keywords to test
    const apiKeywords = [
      'API',
      'endpoint',
      'REST',
      'GraphQL',
      'status code',
      'JSON',
      'schema',
      'request',
      'response',
      'HTTP',
      'authentication',
      'token',
      'bearer',
      'authorization',
      'rest api',
      'api endpoint',
      'json schema',
      'response code',
    ];
    
    fc.assert(
      fc.property(
        // Generate random prompts containing API keywords
        fc.constantFrom(...apiKeywords),
        fc.string({ minLength: 0, maxLength: 50 }),
        fc.string({ minLength: 0, maxLength: 50 }),
        (keyword, prefix, suffix) => {
          // Construct prompt with API keyword
          const prompt = `${prefix} ${keyword} ${suffix}`.trim();
          const analysis = createMinimalAnalysis();
          
          // Classify the intent
          const result = classifyTestIntent(prompt, analysis);
          
          // Verify API is identified as primary or secondary type
          const isApiIdentified = 
            result.primaryType === 'api' ||
            result.secondaryTypes.includes('api') ||
            result.primaryType === 'mixed';
          
          // Property: If API keyword is present, it should be identified
          expect(isApiIdentified).toBe(true);
          
          // If API is the primary type (not mixed), confidence should be >= 0.7
          if (result.primaryType === 'api') {
            expect(result.confidence).toBeGreaterThanOrEqual(0.7);
          }
          
          // Verify the keyword was detected
          expect(result.detectedKeywords.api.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  });
  
  /**
   * Additional Property: Functional Keyword Backward Compatibility
   * 
   * For any user prompt containing functional testing keywords ("click", "fill", 
   * "navigate", "submit", "login", "search", "form") without accessibility or API 
   * keywords, the test generator should identify "functional" as the primary type.
   * 
   * This ensures backward compatibility with existing functional test generation.
   */
  it('should classify functional keywords correctly for backward compatibility', () => {
    const functionalKeywords = [
      'click',
      'fill',
      'navigate',
      'submit',
      'login',
      'search',
      'form',
      'button',
      'link',
      'input',
    ];
    
    fc.assert(
      fc.property(
        fc.constantFrom(...functionalKeywords),
        fc.string({ minLength: 0, maxLength: 50 }).filter(s => 
          // Ensure no accessibility or API keywords in the random strings
          !s.toLowerCase().includes('api') &&
          !s.toLowerCase().includes('aria') &&
          !s.toLowerCase().includes('wcag') &&
          !s.toLowerCase().includes('accessibility') &&
          !s.toLowerCase().includes('endpoint')
        ),
        (keyword, suffix) => {
          const prompt = `${keyword} ${suffix}`.trim();
          const analysis = createMinimalAnalysis();
          
          const result = classifyTestIntent(prompt, analysis);
          
          // Verify functional is identified
          const isFunctionalIdentified = 
            result.primaryType === 'functional' ||
            result.secondaryTypes.includes('functional') ||
            result.primaryType === 'mixed';
          
          expect(isFunctionalIdentified).toBe(true);
          expect(result.detectedKeywords.functional.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Additional Property: Multiple Keyword Types Detection
   * 
   * For any user prompt containing keywords from multiple test types, the classifier
   * should detect all relevant types and potentially mark as 'mixed'.
   */
  it('should detect multiple test types when keywords from different categories are present', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('screen reader', 'keyboard', 'ARIA'),
        fc.constantFrom('API', 'endpoint', 'REST'),
        fc.constantFrom('click', 'fill', 'navigate'),
        (accessibilityKw, apiKw, functionalKw) => {
          const prompt = `Test ${accessibilityKw} and ${apiKw} with ${functionalKw}`;
          const analysis = createMinimalAnalysis();
          
          const result = classifyTestIntent(prompt, analysis);
          
          // Should detect keywords from all three categories
          expect(result.detectedKeywords.accessibility.length).toBeGreaterThan(0);
          expect(result.detectedKeywords.api.length).toBeGreaterThan(0);
          expect(result.detectedKeywords.functional.length).toBeGreaterThan(0);
          
          // Should either be marked as 'mixed' or have secondary types
          const hasMultipleTypes = 
            result.primaryType === 'mixed' ||
            result.secondaryTypes.length > 0;
          
          expect(hasMultipleTypes).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Additional Property: Confidence Score Validity
   * 
   * For any user prompt, the confidence score should always be between 0 and 1 inclusive.
   */
  it('should always return confidence score between 0 and 1', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }),
        (prompt) => {
          const analysis = createMinimalAnalysis();
          const result = classifyTestIntent(prompt, analysis);
          
          // Confidence must be in valid range
          expect(result.confidence).toBeGreaterThanOrEqual(0);
          expect(result.confidence).toBeLessThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Additional Property: Empty Prompt Handling
   * 
   * For any empty or whitespace-only prompt, the classifier should default to 
   * 'functional' type with low confidence.
   */
  it('should handle empty prompts gracefully', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('', '   ', '\t', '\n', '  \t\n  '),
        (emptyPrompt) => {
          const analysis = createMinimalAnalysis();
          const result = classifyTestIntent(emptyPrompt, analysis);
          
          // Should default to functional
          expect(result.primaryType).toBe('functional');
          
          // Should have low or zero confidence
          expect(result.confidence).toBeLessThanOrEqual(0.2);
        }
      ),
      { numRuns: 50 }
    );
  });
  
  /**
   * Additional Property: Case Insensitivity
   * 
   * For any keyword in any case (uppercase, lowercase, mixed), the classifier
   * should detect it correctly.
   */
  it('should be case-insensitive for keyword detection', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('ARIA', 'aria', 'Aria', 'ArIa'),
        fc.constantFrom('API', 'api', 'Api', 'aPi'),
        (ariaVariant, apiVariant) => {
          const prompt1 = `Test ${ariaVariant} labels`;
          const prompt2 = `Test ${apiVariant} endpoint`;
          const analysis = createMinimalAnalysis();
          
          const result1 = classifyTestIntent(prompt1, analysis);
          const result2 = classifyTestIntent(prompt2, analysis);
          
          // Should detect accessibility keyword regardless of case
          expect(result1.detectedKeywords.accessibility.length).toBeGreaterThan(0);
          expect(result1.primaryType === 'accessibility' || 
                 result1.secondaryTypes.includes('accessibility')).toBe(true);
          
          // Should detect API keyword regardless of case
          expect(result2.detectedKeywords.api.length).toBeGreaterThan(0);
          expect(result2.primaryType === 'api' || 
                 result2.secondaryTypes.includes('api')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
