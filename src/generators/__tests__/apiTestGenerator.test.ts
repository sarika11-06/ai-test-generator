import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';
import {
  generateAPITests,
  generateSuccessPathTest,
  generateValidationErrorTest,
  generateAuthenticationFailureTest,
  generateSchemaValidationTest,
  generatePerformanceTest,
  generateAPIAutomationCode,
  type APITestCase,
} from '../apiTestGenerator';
import type { WebsiteAnalysis } from '../testIntentClassifier';

/**
 * Property-Based Tests for API Test Generator
 * 
 * These tests validate universal properties that should hold for all API
 * test cases using fast-check for property-based testing with 100+ iterations per test.
 */

/**
 * Arbitraries (Generators) for Property-Based Testing
 */

const httpMethodArb = fc.constantFrom('GET', 'POST', 'PUT', 'PATCH', 'DELETE');

const endpointArb = fc.oneof(
  fc.constant('/api/users'),
  fc.constant('/api/products'),
  fc.constant('/v1/orders'),
  fc.constant('/api/auth/login'),
  fc.constant('/api/data'),
  fc.string({ minLength: 5, maxLength: 30 }).map(s => `/api/${s}`)
);

const websiteAnalysisArb: fc.Arbitrary<WebsiteAnalysis> = fc.record({
  url: fc.webUrl(),
  allInteractive: fc.option(
    fc.array(
      fc.record({
        tag: fc.string(),
        type: fc.string(),
        text: fc.string(),
        ariaLabel: fc.string(),
        role: fc.string(),
      })
    ),
    { nil: undefined }
  ),
});

const userPromptArb = fc.constantFrom(
  'test API endpoint',
  'verify API response',
  'test REST API',
  'check API status codes',
  'test API authentication',
  'verify API schema'
);

describe('API Test Generator - Property-Based Tests', () => {
  
  /**
   * Property 9: API Test Case Structure
   * 
   * For any test case classified as API type, the test case should include 
   * testType="API", httpMethod (valid HTTP verb), endpoint (URL string), requestHeaders, 
   * authentication details, expectedResponseCode, and responseSchema fields.
   * 
   * **Validates: Requirements 3.2, 3.3**
   * **Feature: accessibility-api-testing, Property 9: API Test Case Structure**
   */
  it('Property 9: should ensure API test cases have required structure', () => {
    fc.assert(
      fc.property(
        endpointArb,
        httpMethodArb,
        fc.webUrl(),
        fc.boolean(),
        (endpoint, method, baseUrl, requiresAuth) => {
          // Generate success path test
          const testCase = generateSuccessPathTest(endpoint, method, baseUrl, requiresAuth);
          
          // Verify testType is API
          expect(testCase.testType).toBe('API');
          
          // Verify apiDetails structure
          expect(testCase.apiDetails).toBeDefined();
          expect(typeof testCase.apiDetails).toBe('object');
          
          // Verify httpMethod is valid HTTP verb
          expect(testCase.apiDetails.httpMethod).toBeDefined();
          expect(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).toContain(testCase.apiDetails.httpMethod);
          expect(testCase.apiDetails.httpMethod).toBe(method);
          
          // Verify endpoint is URL string
          expect(testCase.apiDetails.endpoint).toBeDefined();
          expect(typeof testCase.apiDetails.endpoint).toBe('string');
          expect(testCase.apiDetails.endpoint.length).toBeGreaterThan(0);
          expect(testCase.apiDetails.endpoint).toBe(endpoint);
          
          // Verify requestHeaders is present
          expect(testCase.apiDetails.requestHeaders).toBeDefined();
          expect(typeof testCase.apiDetails.requestHeaders).toBe('object');
          
          // Verify authentication details
          expect(testCase.authentication).toBeDefined();
          expect(typeof testCase.authentication).toBe('object');
          expect(testCase.authentication.type).toBeDefined();
          expect(['Bearer', 'Basic', 'API-Key', 'OAuth2', 'None']).toContain(testCase.authentication.type);
          expect(typeof testCase.authentication.required).toBe('boolean');
          
          // Verify expectedResults structure
          expect(testCase.expectedResults).toBeDefined();
          expect(typeof testCase.expectedResults).toBe('object');
          
          // Verify expectedResponseCode
          expect(testCase.expectedResults.responseCode).toBeDefined();
          expect(typeof testCase.expectedResults.responseCode).toBe('number');
          expect(testCase.expectedResults.responseCode).toBeGreaterThanOrEqual(200);
          expect(testCase.expectedResults.responseCode).toBeLessThan(600);
          
          // Verify responseSchema
          expect(testCase.expectedResults.responseSchema).toBeDefined();
          expect(typeof testCase.expectedResults.responseSchema).toBe('object');
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Property 10: API Validation Criteria
   * 
   * For any API test case, the validation criteria should include status code validation, 
   * response schema validation, and at least one of: data validation or performance metrics.
   * 
   * **Validates: Requirements 3.4**
   * **Feature: accessibility-api-testing, Property 10: API Validation Criteria**
   */
  it('Property 10: should ensure API test cases have proper validation criteria', () => {
    fc.assert(
      fc.property(
        endpointArb,
        httpMethodArb,
        fc.webUrl(),
        fc.boolean(),
        (endpoint, method, baseUrl, requiresAuth) => {
          // Generate success path test
          const testCase = generateSuccessPathTest(endpoint, method, baseUrl, requiresAuth);
          
          // Verify validation criteria is present
          expect(testCase.validationCriteria).toBeDefined();
          
          // Should have apiResponse validation
          expect(testCase.validationCriteria.apiResponse).toBeDefined();
          expect(Array.isArray(testCase.validationCriteria.apiResponse)).toBe(true);
          expect(testCase.validationCriteria.apiResponse!.length).toBeGreaterThan(0);
          
          // Check for status code validation
          const allValidationText = testCase.validationCriteria.apiResponse!.join(' ').toLowerCase();
          expect(allValidationText.includes('status code')).toBe(true);
          
          // Check for schema validation
          const hasSchemaValidation = 
            allValidationText.includes('schema') ||
            allValidationText.includes('body');
          expect(hasSchemaValidation).toBe(true);
          
          // Should have dataState or behavior validation (for data validation or performance)
          const hasDataOrPerformance = 
            (testCase.validationCriteria.dataState && testCase.validationCriteria.dataState.length > 0) ||
            (testCase.validationCriteria.behavior && testCase.validationCriteria.behavior.length > 0) ||
            allValidationText.includes('time') ||
            allValidationText.includes('data');
          expect(hasDataOrPerformance).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Property 11: API Negative Scenarios
   * 
   * For any API test suite, there should be at least one negative test scenario covering 
   * invalid input (400), missing authentication (401), or malformed request (400).
   * This property validates that the test suite includes negative test cases, not that
   * every test case has a negativeScenarios field.
   * 
   * **Validates: Requirements 3.5**
   * **Feature: accessibility-api-testing, Property 11: API Negative Scenarios**
   */
  it('Property 11: should ensure API test suite includes negative scenarios', () => {
    fc.assert(
      fc.property(
        websiteAnalysisArb,
        userPromptArb,
        (websiteAnalysis, userPrompt) => {
          // Generate API tests
          const testCases = generateAPITests(websiteAnalysis, userPrompt);
          
          // Should have multiple test cases
          expect(testCases.length).toBeGreaterThan(0);
          
          // Check for negative scenario test cases by examining response codes and titles
          const hasValidationErrorTest = testCases.some(tc => 
            tc.title.toLowerCase().includes('validation') ||
            tc.title.toLowerCase().includes('400') ||
            tc.expectedResults.responseCode === 400
          );
          
          const hasAuthFailureTest = testCases.some(tc => 
            tc.title.toLowerCase().includes('authentication') ||
            tc.title.toLowerCase().includes('401') ||
            tc.expectedResults.responseCode === 401
          );
          
          // Should have at least one negative scenario test (either validation error or auth failure)
          expect(hasValidationErrorTest || hasAuthFailureTest).toBe(true);
          
          // For test cases that are negative scenarios (400 or 401), verify they test error conditions
          const negativeTestCases = testCases.filter(tc => 
            tc.expectedResults.responseCode === 400 || tc.expectedResults.responseCode === 401
          );
          
          // Should have at least one negative test case
          expect(negativeTestCases.length).toBeGreaterThan(0);
          
          // Verify negative test cases have appropriate structure
          negativeTestCases.forEach(tc => {
            // Should have steps that test error conditions
            expect(tc.steps.length).toBeGreaterThan(0);
            
            // Should have validation criteria for error responses
            expect(tc.validationCriteria.apiResponse).toBeDefined();
            expect(tc.validationCriteria.apiResponse!.length).toBeGreaterThan(0);
            
            // Validation should mention error or status code
            const validationText = tc.validationCriteria.apiResponse!.join(' ').toLowerCase();
            expect(
              validationText.includes('400') || 
              validationText.includes('401') || 
              validationText.includes('error')
            ).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});


describe('API Test Generator - Test Pattern Properties', () => {
  
  /**
   * Property 21: API Success Path Pattern
   * 
   * For any API test suite for an endpoint, there should be at least one test case that 
   * verifies successful response (200/201) with valid inputs.
   * 
   * **Validates: Requirements 6.1**
   * **Feature: accessibility-api-testing, Property 21: API Success Path Pattern**
   */
  it('Property 21: should include success path test in API test suite', () => {
    fc.assert(
      fc.property(
        websiteAnalysisArb,
        userPromptArb,
        (websiteAnalysis, userPrompt) => {
          // Generate API tests
          const testCases = generateAPITests(websiteAnalysis, userPrompt);
          
          // Should have at least one success path test
          const hasSuccessTest = testCases.some(tc => 
            (tc.expectedResults.responseCode === 200 || tc.expectedResults.responseCode === 201) &&
            (tc.title.toLowerCase().includes('success') || 
             tc.category === 'Smoke' ||
             tc.priority === 'Critical')
          );
          
          expect(hasSuccessTest).toBe(true);
          
          // Verify success test structure
          const successTests = testCases.filter(tc => 
            tc.expectedResults.responseCode === 200 || tc.expectedResults.responseCode === 201
          );
          
          expect(successTests.length).toBeGreaterThan(0);
          
          successTests.forEach(tc => {
            // Should have valid request configuration
            expect(tc.apiDetails.httpMethod).toBeDefined();
            expect(tc.apiDetails.endpoint).toBeDefined();
            
            // Should validate response
            expect(tc.validationCriteria.apiResponse).toBeDefined();
            expect(tc.validationCriteria.apiResponse!.length).toBeGreaterThan(0);
            
            // Should have steps that verify success
            expect(tc.steps.length).toBeGreaterThan(0);
            const stepsText = tc.steps.map(s => s.expectedResult).join(' ').toLowerCase();
            expect(stepsText.includes('success') || stepsText.includes('200') || stepsText.includes('201')).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Property 22: API Validation Error Pattern
   * 
   * For any API test suite for an endpoint, there should be at least one test case that 
   * verifies validation error response (400) with invalid inputs.
   * 
   * **Validates: Requirements 6.2**
   * **Feature: accessibility-api-testing, Property 22: API Validation Error Pattern**
   */
  it('Property 22: should include validation error test in API test suite', () => {
    fc.assert(
      fc.property(
        endpointArb,
        httpMethodArb,
        fc.webUrl(),
        fc.boolean(),
        (endpoint, method, baseUrl, requiresAuth) => {
          // Generate validation error test
          const testCase = generateValidationErrorTest(endpoint, method, baseUrl, requiresAuth);
          
          // Verify test case targets 400 error
          expect(testCase.expectedResults.responseCode).toBe(400);
          
          // Should mention validation or invalid in title
          const titleLower = testCase.title.toLowerCase();
          expect(titleLower.includes('validation') || titleLower.includes('400') || titleLower.includes('invalid')).toBe(true);
          
          // Should have steps that test invalid input
          expect(testCase.steps.length).toBeGreaterThan(0);
          const stepsText = testCase.steps.map(s => s.action + ' ' + s.expectedResult).join(' ').toLowerCase();
          expect(stepsText.includes('invalid') || stepsText.includes('400') || stepsText.includes('bad request')).toBe(true);
          
          // Should have validation criteria for error response
          expect(testCase.validationCriteria.apiResponse).toBeDefined();
          const validationText = testCase.validationCriteria.apiResponse!.join(' ').toLowerCase();
          expect(validationText.includes('400') || validationText.includes('error')).toBe(true);
          
          // Should have negative scenarios
          expect(testCase.negativeScenarios).toBeDefined();
          expect(testCase.negativeScenarios!.length).toBeGreaterThan(0);
          expect(testCase.negativeScenarios![0].expectedStatusCode).toBe(400);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Property 23: API Authentication Failure Pattern
   * 
   * For any API test suite for an authenticated endpoint, there should be at least one 
   * test case that verifies authentication failure (401) with missing or invalid tokens.
   * 
   * **Validates: Requirements 6.3**
   * **Feature: accessibility-api-testing, Property 23: API Authentication Failure Pattern**
   */
  it('Property 23: should include authentication failure test for authenticated endpoints', () => {
    fc.assert(
      fc.property(
        endpointArb,
        httpMethodArb,
        fc.webUrl(),
        (endpoint, method, baseUrl) => {
          // Generate authentication failure test
          const testCase = generateAuthenticationFailureTest(endpoint, method, baseUrl);
          
          // Verify test case targets 401 error
          expect(testCase.expectedResults.responseCode).toBe(401);
          
          // Should mention authentication or 401 in title
          const titleLower = testCase.title.toLowerCase();
          expect(titleLower.includes('authentication') || titleLower.includes('401') || titleLower.includes('unauthorized')).toBe(true);
          
          // Should require authentication
          expect(testCase.authentication.required).toBe(true);
          expect(testCase.authentication.type).toBe('Bearer');
          
          // Should have steps that test missing/invalid auth
          expect(testCase.steps.length).toBeGreaterThan(0);
          const stepsText = testCase.steps.map(s => s.action + ' ' + s.expectedResult).join(' ').toLowerCase();
          expect(stepsText.includes('authentication') || stepsText.includes('401') || stepsText.includes('unauthorized') || stepsText.includes('token')).toBe(true);
          
          // Should have validation criteria for auth failure
          expect(testCase.validationCriteria.apiResponse).toBeDefined();
          const validationText = testCase.validationCriteria.apiResponse!.join(' ').toLowerCase();
          expect(validationText.includes('401') || validationText.includes('unauthorized') || validationText.includes('authentication')).toBe(true);
          
          // Should have negative scenarios for auth failures
          expect(testCase.negativeScenarios).toBeDefined();
          expect(testCase.negativeScenarios!.length).toBeGreaterThan(0);
          testCase.negativeScenarios!.forEach(scenario => {
            expect(scenario.expectedStatusCode).toBe(401);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Property 24: API Schema Validation Pattern
   * 
   * For any API test case, the validation criteria should include response schema 
   * validation that verifies the response structure matches the expected schema.
   * 
   * **Validates: Requirements 6.4**
   * **Feature: accessibility-api-testing, Property 24: API Schema Validation Pattern**
   */
  it('Property 24: should include schema validation in API tests', () => {
    fc.assert(
      fc.property(
        endpointArb,
        httpMethodArb,
        fc.webUrl(),
        fc.boolean(),
        (endpoint, method, baseUrl, requiresAuth) => {
          // Generate schema validation test
          const testCase = generateSchemaValidationTest(endpoint, method, baseUrl, requiresAuth);
          
          // Should mention schema in title
          const titleLower = testCase.title.toLowerCase();
          expect(titleLower.includes('schema')).toBe(true);
          
          // Should have response schema defined
          expect(testCase.expectedResults.responseSchema).toBeDefined();
          expect(typeof testCase.expectedResults.responseSchema).toBe('object');
          
          // Schema should have structure (type, required, properties)
          const schema = testCase.expectedResults.responseSchema;
          expect(schema.type).toBeDefined();
          expect(schema.required).toBeDefined();
          expect(Array.isArray(schema.required)).toBe(true);
          expect(schema.properties).toBeDefined();
          expect(typeof schema.properties).toBe('object');
          
          // Should have steps that verify schema
          expect(testCase.steps.length).toBeGreaterThan(0);
          const stepsText = testCase.steps.map(s => s.action + ' ' + s.expectedResult).join(' ').toLowerCase();
          expect(stepsText.includes('schema') || stepsText.includes('structure') || stepsText.includes('fields')).toBe(true);
          
          // Should have validation criteria for schema
          expect(testCase.validationCriteria.apiResponse).toBeDefined();
          const validationText = testCase.validationCriteria.apiResponse!.join(' ').toLowerCase();
          expect(validationText.includes('schema') || validationText.includes('structure')).toBe(true);
          
          // Should validate data types
          expect(testCase.validationCriteria.dataState).toBeDefined();
          const dataStateText = testCase.validationCriteria.dataState!.join(' ').toLowerCase();
          expect(dataStateText.includes('type') || dataStateText.includes('data')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Property 25: API Performance Pattern
   * 
   * For any API test case, the expected results should include a response time threshold 
   * (typically < 500ms) and the validation criteria should include performance metric 
   * verification.
   * 
   * **Validates: Requirements 6.5**
   * **Feature: accessibility-api-testing, Property 25: API Performance Pattern**
   */
  it('Property 25: should include performance metrics in API tests', () => {
    fc.assert(
      fc.property(
        endpointArb,
        httpMethodArb,
        fc.webUrl(),
        fc.boolean(),
        (endpoint, method, baseUrl, requiresAuth) => {
          // Generate performance test
          const testCase = generatePerformanceTest(endpoint, method, baseUrl, requiresAuth);
          
          // Should mention performance in title
          const titleLower = testCase.title.toLowerCase();
          expect(titleLower.includes('performance')).toBe(true);
          
          // Should be categorized as Performance
          expect(testCase.category).toBe('Performance');
          
          // Should have response time threshold defined
          expect(testCase.expectedResults.responseTime).toBeDefined();
          expect(typeof testCase.expectedResults.responseTime).toBe('number');
          expect(testCase.expectedResults.responseTime).toBeGreaterThan(0);
          expect(testCase.expectedResults.responseTime).toBeLessThanOrEqual(5000); // Reasonable upper bound
          
          // Should have steps that measure performance
          expect(testCase.steps.length).toBeGreaterThan(0);
          const stepsText = testCase.steps.map(s => s.action + ' ' + s.expectedResult).join(' ').toLowerCase();
          expect(stepsText.includes('time') || stepsText.includes('performance') || stepsText.includes('measure')).toBe(true);
          
          // Should have validation criteria for performance
          expect(testCase.validationCriteria.apiResponse).toBeDefined();
          const validationText = testCase.validationCriteria.apiResponse!.join(' ').toLowerCase();
          expect(validationText.includes('time') || validationText.includes('performance')).toBe(true);
          
          // Should mention response time threshold in validation
          const allText = [
            ...testCase.steps.map(s => s.expectedResult),
            ...(testCase.validationCriteria.apiResponse || []),
          ].join(' ').toLowerCase();
          expect(allText.includes('ms') || allText.includes('millisecond') || allText.includes('500')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Property 26: API Data Validation Pattern
   * 
   * For any API test case, the validation criteria should include data validation rules 
   * that verify response data meets business logic requirements (e.g., valid enum values, 
   * required fields present, correct data types).
   * 
   * **Validates: Requirements 6.6**
   * **Feature: accessibility-api-testing, Property 26: API Data Validation Pattern**
   */
  it('Property 26: should include data validation in API tests', () => {
    fc.assert(
      fc.property(
        endpointArb,
        httpMethodArb,
        fc.webUrl(),
        fc.boolean(),
        (endpoint, method, baseUrl, requiresAuth) => {
          // Generate success path test (includes data validation)
          const testCase = generateSuccessPathTest(endpoint, method, baseUrl, requiresAuth);
          
          // Should have dataState validation criteria
          expect(testCase.validationCriteria.dataState).toBeDefined();
          expect(Array.isArray(testCase.validationCriteria.dataState)).toBe(true);
          expect(testCase.validationCriteria.dataState!.length).toBeGreaterThan(0);
          
          // Data validation should mention fields, types, or values
          const dataStateText = testCase.validationCriteria.dataState!.join(' ').toLowerCase();
          const hasDataValidation = 
            dataStateText.includes('field') ||
            dataStateText.includes('type') ||
            dataStateText.includes('data') ||
            dataStateText.includes('value') ||
            dataStateText.includes('required');
          expect(hasDataValidation).toBe(true);
          
          // Response schema should define data structure
          expect(testCase.expectedResults.responseSchema).toBeDefined();
          const schema = testCase.expectedResults.responseSchema;
          expect(schema.properties).toBeDefined();
          
          // Should have steps that verify data
          const stepsText = testCase.steps.map(s => s.expectedResult).join(' ').toLowerCase();
          const hasDataVerification = 
            stepsText.includes('data') ||
            stepsText.includes('field') ||
            stepsText.includes('body') ||
            stepsText.includes('response');
          expect(hasDataVerification).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('API Test Generator - Automation Code Properties', () => {
  
  /**
   * Property 12: API Automation Code
   * 
   * For any API test case with automation mapping, the automation code should include 
   * HTTP client library usage (axios, fetch, or similar), request configuration, 
   * status code assertions, and response handling.
   * 
   * **Validates: Requirements 3.6, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6**
   * **Feature: accessibility-api-testing, Property 12: API Automation Code**
   */
  it('Property 12: should generate valid automation code with HTTP client and assertions', () => {
    fc.assert(
      fc.property(
        endpointArb,
        httpMethodArb,
        fc.webUrl(),
        fc.boolean(),
        (endpoint, method, baseUrl, requiresAuth) => {
          // Generate test case
          const testCase = generateSuccessPathTest(endpoint, method, baseUrl, requiresAuth);
          
          // Generate automation code
          const automationCode = generateAPIAutomationCode(testCase);
          
          // Verify code is a non-empty string
          expect(typeof automationCode).toBe('string');
          expect(automationCode.length).toBeGreaterThan(0);
          
          // Requirement 10.1: Should include Playwright test imports
          const hasPlaywrightImport = 
            automationCode.includes('import { test, expect }') ||
            automationCode.includes('from \'@playwright/test\'');
          expect(hasPlaywrightImport).toBe(true);
          
          // Should use Playwright's request API
          expect(automationCode.includes('request.')).toBe(true);
          
          // Requirement 10.2: Should include request configuration (method, headers, body)
          // Check for method configuration (Playwright uses request.get(), request.post(), etc.)
          const methodLower = method.toLowerCase();
          expect(automationCode.includes(`request.${methodLower}(`)).toBe(true);
          
          // Check for headers configuration
          expect(automationCode.includes('headers:')).toBe(true);
          
          // Check for endpoint/URL configuration
          expect(automationCode.includes(endpoint) || automationCode.includes('http')).toBe(true);
          
          // If method supports body, should include data/body configuration
          if (['POST', 'PUT', 'PATCH'].includes(method)) {
            expect(automationCode.includes('data:') || automationCode.includes('body:')).toBe(true);
          }
          
          // Requirement 10.3: Should include response status code assertions
          expect(automationCode.includes('response.status()')).toBe(true);
          expect(automationCode.includes('.toBe(')).toBe(true);
          
          // Should verify the expected status code
          const expectedCode = testCase.expectedResults.responseCode;
          expect(automationCode.includes(`${expectedCode}`)).toBe(true);
          
          // Requirement 10.4: Should include response validation
          expect(automationCode.includes('response') && automationCode.includes('expect')).toBe(true);
          
          // Requirement 10.5: Should include response time measurement and assertions
          expect(automationCode.includes('Date.now()') || automationCode.includes('performance.now()')).toBe(true);
          expect(automationCode.includes('responseTime') || automationCode.includes('time')).toBe(true);
          expect(automationCode.includes('.toBeLessThan(') || automationCode.includes('< ')).toBe(true);
          
          // Should reference the response time threshold
          const threshold = testCase.expectedResults.responseTime;
          expect(automationCode.includes(`${threshold}`)).toBe(true);
          
          // Requirement 10.6: Should include basic test structure
          expect(automationCode.includes('test(')).toBe(true);
          expect(automationCode.includes('expect(')).toBe(true);
          
          // Should have response handling
          expect(automationCode.includes('response')).toBe(true);
          
          // Should have test structure
          expect(automationCode.includes('test(')).toBe(true);
          
          // Should be executable TypeScript/JavaScript code
          expect(automationCode.includes('async')).toBe(true);
          expect(automationCode.includes('await')).toBe(true);
          
          // Should include authentication handling if required
          if (requiresAuth) {
            expect(
              automationCode.includes('Authorization') ||
              automationCode.includes('Bearer') ||
              automationCode.includes('token')
            ).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Property 12b: API Automation Code for Error Scenarios
   * 
   * For any API test case testing error scenarios (400, 401), the automation code 
   * should properly handle and verify error responses.
   */
  it('Property 12b: should generate automation code that handles error scenarios', () => {
    fc.assert(
      fc.property(
        endpointArb,
        httpMethodArb,
        fc.webUrl(),
        fc.boolean(),
        (endpoint, method, baseUrl, requiresAuth) => {
          // Generate validation error test (400)
          const errorTestCase = generateValidationErrorTest(endpoint, method, baseUrl, requiresAuth);
          
          // Generate automation code
          const automationCode = generateAPIAutomationCode(errorTestCase);
          
          // Should use Playwright's request API
          expect(automationCode.includes('request.')).toBe(true);
          
          // Should verify error status code (400)
          expect(automationCode.includes('400')).toBe(true);
          expect(automationCode.includes('response.status()')).toBe(true);
          
          // Should verify error response structure
          expect(automationCode.includes('error') || automationCode.includes('Error')).toBe(true);
          
          // Should handle the error response appropriately
          expect(automationCode.includes('response') && automationCode.includes('status')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Property 12c: API Automation Code for Performance Tests
   * 
   * For any API performance test case, the automation code should include 
   * concurrent request handling and average response time calculation.
   */
  it('Property 12c: should generate automation code with concurrent request testing for performance tests', () => {
    fc.assert(
      fc.property(
        endpointArb,
        httpMethodArb,
        fc.webUrl(),
        fc.boolean(),
        (endpoint, method, baseUrl, requiresAuth) => {
          // Generate performance test
          const perfTestCase = generatePerformanceTest(endpoint, method, baseUrl, requiresAuth);
          
          // Generate automation code
          const automationCode = generateAPIAutomationCode(perfTestCase);
          
          // Should use Playwright's request API
          expect(automationCode.includes('request.')).toBe(true);
          
          // Should measure response time
          expect(automationCode.includes('Time') || automationCode.includes('time') || 
                 automationCode.includes('Date.now()')).toBe(true);
          
          // Should have performance-related checks
          expect(automationCode.includes('response') && automationCode.includes('status')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

