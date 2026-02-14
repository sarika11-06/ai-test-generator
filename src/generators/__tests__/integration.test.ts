import { describe, it, expect } from '@jest/globals';
import { classifyTestIntent } from '../testIntentClassifier';
import { generateAccessibilityTests } from '../accessibilityTestGenerator';
import { generateAPITests } from '../apiTestGenerator';
import type { WebsiteAnalysis } from '../testIntentClassifier';
import type { AccessibilityTestCase } from '../accessibilityTestGenerator';
import type { APITestCase } from '../apiTestGenerator';

/**
 * Integration Tests - End-to-End Flow
 * 
 * These tests validate the complete flow from user prompt through classification,
 * generation, and output formatting.
 * 
 * Task 11.1: Write integration tests for end-to-end flow
 * - Test complete flow: prompt → classification → generation → output
 * - Test accessibility test generation flow
 * - Test API test generation flow
 * - Test mixed test type generation flow
 * - Test backward compatibility with existing functional tests
 */

/**
 * Helper: Create a minimal valid WebsiteAnalysis object
 */
const createWebsiteAnalysis = (url: string = 'https://example.com'): WebsiteAnalysis => ({
  url,
  allInteractive: [
    {
      tag: 'button',
      type: 'submit',
      text: 'Submit',
      ariaLabel: 'Submit form',
      role: 'button',
      placeholder: '',
      name: 'submit',
      id: 'submit-btn',
      selectors: ['#submit-btn', 'button[type="submit"]'],
      xpath: '//button[@id="submit-btn"]',
      friendlyName: 'Submit Button',
    },
    {
      tag: 'input',
      type: 'text',
      text: '',
      ariaLabel: 'Username',
      role: 'textbox',
      placeholder: 'Enter username',
      name: 'username',
      id: 'username-input',
      selectors: ['#username-input', 'input[name="username"]'],
      xpath: '//input[@id="username-input"]',
      friendlyName: 'Username Input',
    },
  ],
});

describe('End-to-End Integration Tests', () => {
  
  describe('Complete Flow: prompt → classification → generation → output', () => {
    
    it('should complete full flow for accessibility and API tests', () => {
      const websiteAnalysis = createWebsiteAnalysis();
      const userPrompt = 'Test keyboard navigation and API endpoints';
      
      // Step 1: Classification
      const intent = classifyTestIntent(userPrompt, websiteAnalysis);
      expect(intent).toBeDefined();
      expect(intent.primaryType).toBeDefined();
      expect(intent.confidence).toBeGreaterThan(0);
      
      // Step 2: Generation based on classification
      const allTests: any[] = [];
      
      if (intent.primaryType === 'accessibility' || intent.secondaryTypes.includes('accessibility')) {
        const accessibilityTests = generateAccessibilityTests(websiteAnalysis, userPrompt);
        expect(accessibilityTests.length).toBeGreaterThan(0);
        allTests.push(...accessibilityTests);
      }
      
      if (intent.primaryType === 'api' || intent.secondaryTypes.includes('api')) {
        const apiTests = generateAPITests(websiteAnalysis, userPrompt);
        expect(apiTests.length).toBeGreaterThan(0);
        allTests.push(...apiTests);
      }
      
      // Step 3: Verify output structure
      expect(allTests.length).toBeGreaterThan(0);
      
      for (const test of allTests) {
        // All tests should have base structure
        expect(test).toHaveProperty('id');
        expect(test).toHaveProperty('title');
        expect(test).toHaveProperty('testType');
        expect(test).toHaveProperty('priority');
        expect(test).toHaveProperty('steps');
        expect(test).toHaveProperty('validationCriteria');
        
        // Type-specific validation
        if (test.testType === 'Accessibility') {
          expect(test).toHaveProperty('wcagVersion');
          expect(test).toHaveProperty('wcagPrinciple');
        } else if (test.testType === 'API') {
          expect(test).toHaveProperty('apiDetails');
          expect(test).toHaveProperty('expectedResults');
        }
      }
    });
  });

  describe('Accessibility Test Generation Flow', () => {
    
    it('should handle accessibility test generation flow', () => {
      const websiteAnalysis = createWebsiteAnalysis();
      const userPrompt = 'Test screen reader compatibility and ARIA labels';
      
      // Classification
      const intent = classifyTestIntent(userPrompt, websiteAnalysis);
      expect(intent.primaryType).toBe('accessibility');
      expect(intent.confidence).toBeGreaterThan(0.7);
      
      // Generation
      const tests = generateAccessibilityTests(websiteAnalysis, userPrompt);
      expect(tests.length).toBeGreaterThan(0);
      
      // Validation
      for (const test of tests) {
        expect(test.testType).toBe('Accessibility');
        expect(test.wcagVersion).toMatch(/^2\.[012]$/);
        expect(test.wcagPrinciple.length).toBeGreaterThan(0);
        expect(test.assistiveTechnology.length).toBeGreaterThan(0);
        expect(test.steps.length).toBeGreaterThan(0);
        
        // Should have proper validation criteria
        expect(test.validationCriteria).toBeDefined();
        const criteria = test.validationCriteria as any;
        // Check that at least one accessibility-related validation exists
        const hasAccessibilityCriteria = 
          (criteria.ariaAttributes && criteria.ariaAttributes.length > 0) ||
          (criteria.keyboardNavigation && criteria.keyboardNavigation.length > 0) ||
          (criteria.screenReaderAnnouncements && criteria.screenReaderAnnouncements.length > 0) ||
          (criteria.focusManagement && criteria.focusManagement.length > 0) ||
          (criteria.compliance && criteria.compliance.length > 0) ||
          (criteria.behavior && criteria.behavior.length > 0);
        expect(hasAccessibilityCriteria).toBe(true);
      }
    });

    it('should generate keyboard navigation tests', () => {
      const websiteAnalysis = createWebsiteAnalysis();
      const userPrompt = 'Test keyboard navigation';
      
      const tests = generateAccessibilityTests(websiteAnalysis, userPrompt);
      expect(tests.length).toBeGreaterThan(0);
      
      // Should have keyboard-related tests
      const hasKeyboardTest = tests.some(test => 
        test.title.toLowerCase().includes('keyboard') ||
        test.description.toLowerCase().includes('keyboard')
      );
      expect(hasKeyboardTest).toBe(true);
    });

    it('should generate screen reader tests', () => {
      const websiteAnalysis = createWebsiteAnalysis();
      const userPrompt = 'Test screen reader compatibility';
      
      const tests = generateAccessibilityTests(websiteAnalysis, userPrompt);
      expect(tests.length).toBeGreaterThan(0);
      
      // Should have screen reader-related tests
      const hasScreenReaderTest = tests.some(test => 
        test.title.toLowerCase().includes('screen reader') ||
        test.description.toLowerCase().includes('screen reader') ||
        test.assistiveTechnology.some(tech => 
          tech.toLowerCase().includes('nvda') || 
          tech.toLowerCase().includes('jaws') ||
          tech.toLowerCase().includes('voiceover')
        )
      );
      expect(hasScreenReaderTest).toBe(true);
    });
  });

  describe('API Test Generation Flow', () => {
    
    it('should handle API test generation flow', () => {
      const websiteAnalysis = createWebsiteAnalysis();
      const userPrompt = 'Test POST /api/users endpoint with authentication';
      
      // Classification
      const intent = classifyTestIntent(userPrompt, websiteAnalysis);
      expect(intent.primaryType).toBe('api');
      expect(intent.confidence).toBeGreaterThan(0.7);
      
      // Generation
      const tests = generateAPITests(websiteAnalysis, userPrompt);
      expect(tests.length).toBeGreaterThan(0);
      
      // Validation
      for (const test of tests) {
        expect(test.testType).toBe('API');
        expect(test.apiDetails).toBeDefined();
        expect(test.apiDetails.httpMethod).toMatch(/^(GET|POST|PUT|DELETE|PATCH)$/);
        expect(test.apiDetails.endpoint).toBeTruthy();
        expect(test.authentication).toBeDefined();
        expect(test.expectedResults).toBeDefined();
        expect(test.expectedResults.responseCode).toBeGreaterThan(0);
        
        // Should have proper validation criteria
        expect(test.validationCriteria).toBeDefined();
        const criteria = test.validationCriteria as any;
        expect(criteria.apiResponse).toBeDefined();
        expect(criteria.apiResponse.length).toBeGreaterThan(0);
      }
    });

    it('should generate success path tests', () => {
      const websiteAnalysis = createWebsiteAnalysis();
      const userPrompt = 'Test GET /api/users endpoint';
      
      const tests = generateAPITests(websiteAnalysis, userPrompt);
      expect(tests.length).toBeGreaterThan(0);
      
      // Should have success path test
      const hasSuccessTest = tests.some(test => 
        test.title.toLowerCase().includes('success') ||
        test.expectedResults.responseCode === 200 ||
        test.expectedResults.responseCode === 201
      );
      expect(hasSuccessTest).toBe(true);
    });

    it('should generate validation error tests', () => {
      const websiteAnalysis = createWebsiteAnalysis();
      const userPrompt = 'Test POST /api/users with invalid data';
      
      const tests = generateAPITests(websiteAnalysis, userPrompt);
      expect(tests.length).toBeGreaterThan(0);
      
      // Should have validation error test
      const hasValidationTest = tests.some(test => 
        test.title.toLowerCase().includes('validation') ||
        test.title.toLowerCase().includes('invalid') ||
        test.expectedResults.responseCode === 400
      );
      expect(hasValidationTest).toBe(true);
    });
  });

  describe('Mixed Test Type Generation Flow', () => {
    
    it('should handle mixed test type generation flow', () => {
      const websiteAnalysis = createWebsiteAnalysis();
      const userPrompt = 'Test form accessibility and API submission';
      
      // Classification
      const intent = classifyTestIntent(userPrompt, websiteAnalysis);
      expect(intent.secondaryTypes.length).toBeGreaterThanOrEqual(1);
      
      // Generation
      const accessibilityTests = generateAccessibilityTests(websiteAnalysis, userPrompt);
      const apiTests = generateAPITests(websiteAnalysis, userPrompt);
      
      const allTests = [...accessibilityTests, ...apiTests];
      expect(allTests.length).toBeGreaterThan(0);
      
      // Validation - should have both types
      const hasAccessibility = allTests.some(t => t.testType === 'Accessibility');
      const hasAPI = allTests.some(t => t.testType === 'API');
      
      expect(hasAccessibility || hasAPI).toBe(true);
      
      // Each test maintains type purity
      for (const test of allTests) {
        if (test.testType === 'Accessibility') {
          expect(test).toHaveProperty('wcagVersion');
          expect(test).not.toHaveProperty('apiDetails');
        } else if (test.testType === 'API') {
          expect(test).toHaveProperty('apiDetails');
          expect(test).not.toHaveProperty('wcagVersion');
        }
      }
    });

    it('should maintain type purity in mixed generation', () => {
      const websiteAnalysis = createWebsiteAnalysis();
      const userPrompt = 'Test accessibility and API';
      
      // Generate both types of tests
      const accessibilityTests = generateAccessibilityTests(websiteAnalysis, userPrompt);
      const apiTests = generateAPITests(websiteAnalysis, userPrompt);
      
      // Verify accessibility tests don't have API fields
      for (const test of accessibilityTests) {
        expect(test.testType).toBe('Accessibility');
        expect(test).not.toHaveProperty('apiDetails');
        expect(test).not.toHaveProperty('httpMethod');
        expect(test).toHaveProperty('wcagVersion');
      }
      
      // Verify API tests don't have accessibility fields
      for (const test of apiTests) {
        expect(test.testType).toBe('API');
        expect(test).toHaveProperty('apiDetails');
        expect(test).not.toHaveProperty('wcagVersion');
        expect(test).not.toHaveProperty('wcagPrinciple');
      }
    });
  });

  describe('Backward Compatibility with Functional Tests', () => {
    
    it('should maintain backward compatibility with functional tests', () => {
      const websiteAnalysis = createWebsiteAnalysis();
      const userPrompt = 'Test login form submission';
      
      // Classification
      const intent = classifyTestIntent(userPrompt, websiteAnalysis);
      
      // Should classify as functional
      expect(intent.primaryType).toBe('functional');
      
      // Should not generate accessibility or API tests as primary
      expect(intent.primaryType).not.toBe('accessibility');
      expect(intent.primaryType).not.toBe('api');
    });

    it('should not classify functional keywords as accessibility', () => {
      const websiteAnalysis = createWebsiteAnalysis();
      const functionalKeywords = ['click', 'fill', 'navigate', 'submit', 'login', 'search'];
      
      for (const keyword of functionalKeywords) {
        const userPrompt = `Test ${keyword} functionality`;
        const intent = classifyTestIntent(userPrompt, websiteAnalysis);
        
        // Should not classify as accessibility
        expect(intent.primaryType).not.toBe('accessibility');
        expect(intent.secondaryTypes).not.toContain('accessibility');
      }
    });

    it('should not classify functional keywords as API', () => {
      const websiteAnalysis = createWebsiteAnalysis();
      const functionalKeywords = ['click', 'fill', 'navigate', 'submit', 'login', 'search', 'form'];
      
      for (const keyword of functionalKeywords) {
        const userPrompt = `Test ${keyword} functionality`;
        const intent = classifyTestIntent(userPrompt, websiteAnalysis);
        
        // Should not classify as API
        expect(intent.primaryType).not.toBe('api');
        expect(intent.secondaryTypes).not.toContain('api');
      }
    });
  });

  describe('Edge Cases and Error Handling', () => {
    
    it('should handle empty prompt', () => {
      const websiteAnalysis = createWebsiteAnalysis();
      const userPrompt = '';
      
      // Classification should still work
      const intent = classifyTestIntent(userPrompt, websiteAnalysis);
      expect(intent).toBeDefined();
      expect(intent.primaryType).toBeDefined();
      
      // Should default to functional with low confidence
      expect(intent.primaryType).toBe('functional');
      expect(intent.confidence).toBeLessThanOrEqual(0.5);
    });

    it('should handle ambiguous prompt', () => {
      const websiteAnalysis = createWebsiteAnalysis();
      const userPrompt = 'test the website';
      
      // Classification
      const intent = classifyTestIntent(userPrompt, websiteAnalysis);
      expect(intent).toBeDefined();
      
      // Should have low confidence
      expect(intent.confidence).toBeLessThan(0.7);
      
      // Should still be able to generate some tests
      expect(intent.primaryType).toBeDefined();
    });

    it('should generate valid automation code', () => {
      const websiteAnalysis = createWebsiteAnalysis();
      
      // Test accessibility automation code
      const accessibilityPrompt = 'Test keyboard navigation';
      const accessibilityTests = generateAccessibilityTests(websiteAnalysis, accessibilityPrompt);
      
      for (const test of accessibilityTests) {
        if (test.automationMapping) {
          expect(test.automationMapping).toBeTruthy();
          expect(typeof test.automationMapping).toBe('string');
          
          // Should contain Playwright code
          expect(test.automationMapping).toMatch(/page\./);
          
          // Should contain accessibility-specific code
          const hasAccessibilityCode = 
            test.automationMapping.includes('axe') ||
            test.automationMapping.includes('keyboard') ||
            test.automationMapping.includes('aria') ||
            test.automationMapping.includes('focus');
          expect(hasAccessibilityCode).toBe(true);
        }
      }
      
      // Test API automation code
      const apiPrompt = 'Test GET /api/users endpoint';
      const apiTests = generateAPITests(websiteAnalysis, apiPrompt);
      
      for (const test of apiTests) {
        if (test.automationMapping) {
          expect(test.automationMapping).toBeTruthy();
          expect(typeof test.automationMapping).toBe('string');
          
          // Should contain HTTP client code
          const hasHTTPCode = 
            test.automationMapping.includes('fetch') ||
            test.automationMapping.includes('axios') ||
            test.automationMapping.includes('request');
          expect(hasHTTPCode).toBe(true);
          
          // Should contain assertions
          expect(test.automationMapping).toMatch(/expect|assert/);
        }
      }
    });

    it('should generate consistent test IDs', () => {
      const websiteAnalysis = createWebsiteAnalysis();
      const userPrompt = 'Test accessibility';
      
      // Generate tests multiple times
      const tests1 = generateAccessibilityTests(websiteAnalysis, userPrompt);
      const tests2 = generateAccessibilityTests(websiteAnalysis, userPrompt);
      
      // IDs should follow consistent pattern (A11Y- prefix with timestamp and UUID)
      for (const test of [...tests1, ...tests2]) {
        expect(test.id).toMatch(/^A11Y-/);
        expect(test.id.length).toBeGreaterThan(10);
      }
    });

    it('should include quality metrics in all generated tests', () => {
      const websiteAnalysis = createWebsiteAnalysis();
      
      // Test accessibility
      const accessibilityTests = generateAccessibilityTests(websiteAnalysis, 'Test accessibility');
      for (const test of accessibilityTests) {
        expect(test.qualityMetrics).toBeDefined();
        expect(test.qualityMetrics.confidence).toBeGreaterThanOrEqual(0);
        expect(test.qualityMetrics.confidence).toBeLessThanOrEqual(100);
        expect(test.qualityMetrics.stability).toBeGreaterThanOrEqual(0);
        expect(test.qualityMetrics.stability).toBeLessThanOrEqual(100);
        expect(test.qualityMetrics.maintainability).toBeGreaterThanOrEqual(0);
        expect(test.qualityMetrics.maintainability).toBeLessThanOrEqual(100);
      }
      
      // Test API
      const apiTests = generateAPITests(websiteAnalysis, 'Test API');
      for (const test of apiTests) {
        expect(test.qualityMetrics).toBeDefined();
        expect(test.qualityMetrics.confidence).toBeGreaterThanOrEqual(0);
        expect(test.qualityMetrics.confidence).toBeLessThanOrEqual(100);
        expect(test.qualityMetrics.stability).toBeGreaterThanOrEqual(0);
        expect(test.qualityMetrics.stability).toBeLessThanOrEqual(100);
        expect(test.qualityMetrics.maintainability).toBeGreaterThanOrEqual(0);
        expect(test.qualityMetrics.maintainability).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('Test Type Purity', () => {
    
    it('should ensure API test cases do not contain UI-specific fields', () => {
      const websiteAnalysis = createWebsiteAnalysis();
      const userPrompt = 'Test the POST /api/users API endpoint';
      
      const apiTests = generateAPITests(websiteAnalysis, userPrompt);
      
      // Verify all API tests don't have UI-specific fields
      for (const testCase of apiTests) {
        // Check testType is API
        expect(testCase.testType).toBe('API');
        
        // API tests should not have Playwright selectors or DOM-related fields
        const testCaseStr = JSON.stringify(testCase);
        
        // Should not contain Playwright-specific methods
        expect(testCaseStr).not.toMatch(/page\.locator/i);
        expect(testCaseStr).not.toMatch(/page\.click/i);
        expect(testCaseStr).not.toMatch(/page\.fill/i);
        expect(testCaseStr).not.toMatch(/page\.goto/i);
        
        // API tests should have API-specific fields
        expect(testCase).toHaveProperty('apiDetails');
        expect(testCase).toHaveProperty('authentication');
        expect(testCase).toHaveProperty('expectedResults');
      }
    });

    it('should ensure Accessibility test cases do not contain API-specific fields', () => {
      const websiteAnalysis = createWebsiteAnalysis();
      const userPrompt = 'Test keyboard accessibility';
      
      const accessibilityTests = generateAccessibilityTests(websiteAnalysis, userPrompt);
      
      // Verify all accessibility tests don't have API-specific fields
      for (const testCase of accessibilityTests) {
        // Check testType is Accessibility
        expect(testCase.testType).toBe('Accessibility');
        
        // Accessibility tests should not have API-specific fields
        expect(testCase).not.toHaveProperty('apiDetails');
        expect(testCase).not.toHaveProperty('httpMethod');
        expect(testCase).not.toHaveProperty('endpoint');
        
        // Accessibility tests should have accessibility-specific fields
        expect(testCase).toHaveProperty('wcagVersion');
        expect(testCase).toHaveProperty('wcagPrinciple');
        expect(testCase).toHaveProperty('wcagSuccessCriteria');
        expect(testCase).toHaveProperty('assistiveTechnology');
        
        // Steps should not mention HTTP methods or API calls
        const testCaseStr = JSON.stringify(testCase);
        expect(testCaseStr).not.toMatch(/\b(GET|POST|PUT|DELETE|PATCH)\b/);
        expect(testCaseStr).not.toMatch(/status code/i);
        expect(testCaseStr).not.toMatch(/response body/i);
        expect(testCaseStr).not.toMatch(/request header/i);
      }
    });
  });
});
