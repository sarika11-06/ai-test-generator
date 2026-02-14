/**
 * Integration Tests for Instruction-Based API Testing
 * 
 * End-to-end tests that verify the complete flow from instruction to test case:
 * - Simple GET instruction → 1 test case
 * - POST with fields → correct steps and code
 * - Generic instruction → 5 test cases (fallback)
 * 
 * Requirements: 1.1, 5.1, 5.2
 */

import { describe, it, expect } from '@jest/globals';
import {
  generateInstructionBasedTestCase,
} from '../instructionBasedAPIGenerator';
import {
  parseAPIInstructionEnhanced,
  generateAPITestFromInstruction,
} from '../apiPlaywrightCodeGenerator';
import {
  IntegratedTestRouter,
} from '../integratedTestRouter';
import type { WebsiteAnalysis } from '../integratedTestRouter';

describe('Integration - Simple GET Instruction', () => {
  it('should generate 1 test case for simple GET instruction', async () => {
    const instruction = 'Send a GET request to "https://jsonplaceholder.typicode.com/posts"';
    const url = 'https://jsonplaceholder.typicode.com/posts';
    
    const router = new IntegratedTestRouter();
    const response = await router.generateTests({
      url,
      prompt: instruction,
    });
    
    // Should generate exactly 1 test case for specific instruction
    expect(response.testCases.length).toBe(1);
    expect(response.testCases[0].testType).toBe('API');
  });

  it('should generate test case with correct structure', () => {
    const instruction = 'Send a GET request to "https://jsonplaceholder.typicode.com/posts"';
    const parsed = parseAPIInstructionEnhanced(instruction, 'https://jsonplaceholder.typicode.com/posts');
    const testCase = generateInstructionBasedTestCase(parsed);
    
    // Verify test case structure
    expect(testCase.title).toBeDefined();
    expect(testCase.description).toBeDefined();
    expect(testCase.testType).toBe('API');
    expect(testCase.steps).toBeDefined();
    expect(testCase.steps.length).toBeGreaterThan(0);
    expect(testCase.preconditions).toBeDefined();
    expect(testCase.preconditions.length).toBeGreaterThan(0);
    expect(testCase.automationMapping).toBeDefined();
    if (testCase.automationMapping) {
      expect(testCase.automationMapping.length).toBeGreaterThan(0);
    }
  });

  it('should generate Playwright code for simple GET', () => {
    const instruction = 'Send a GET request to "https://jsonplaceholder.typicode.com/posts"';
    const url = 'https://jsonplaceholder.typicode.com/posts';
    
    const code = generateAPITestFromInstruction(instruction, url);
    
    // Verify code structure
    expect(code).toContain('import { test, expect }');
    expect(code).toContain('@playwright/test');
    expect(code).toContain('request.get');
    expect(code).toContain(url);
    // Simple GET without explicit assertions may not include status checks
    expect(code).toContain('response');
  });
});

describe('Integration - POST with Fields', () => {
  it('should generate test case with field reading steps', () => {
    const instruction = `Send a POST request to "https://api.example.com/users"
Read userId field
Read name field
Expect userId type is number`;
    
    const parsed = parseAPIInstructionEnhanced(instruction, 'https://api.example.com/users');
    const testCase = generateInstructionBasedTestCase(parsed);
    
    // Verify test case has correct method
    expect(testCase.apiDetails.httpMethod).toBe('POST');
    
    // Verify test case has steps for reading fields
    const stepActions = testCase.steps.map(s => s.action).join(' ');
    expect(stepActions).toContain('userId');
    expect(stepActions).toContain('name');
    
    // Verify preconditions include data preparation
    expect(testCase.preconditions).toContain('Test data is prepared');
  });

  it('should generate Playwright code with field assertions', () => {
    const instruction = `Send a POST request to "https://api.example.com/users"
Read userId field
Expect userId type is number`;
    
    const code = generateAPITestFromInstruction(instruction, 'https://api.example.com/users');
    
    // Verify code includes POST request
    expect(code).toContain('request.post');
    
    // Verify code includes field reading
    expect(code).toContain('userId');
    
    // Verify code includes type checking
    expect(code).toContain('typeof');
    expect(code).toContain('number');
  });

  it('should generate correct validation criteria', () => {
    const instruction = `Send a POST request to "https://api.example.com/users"
Read userId field
Read name field`;
    
    const parsed = parseAPIInstructionEnhanced(instruction, 'https://api.example.com/users');
    const testCase = generateInstructionBasedTestCase(parsed);
    
    // Verify validation criteria includes field checks
    const validationText = testCase.validationCriteria.apiResponse?.join(' ') || '';
    expect(validationText).toContain('userId');
    expect(validationText).toContain('name');
  });
});

describe('Integration - Generic Instruction Fallback', () => {
  it('should generate multiple test cases for generic instruction', async () => {
    const instruction = 'Test the API endpoint';
    const url = 'https://api.example.com/users';
    
    const router = new IntegratedTestRouter();
    const response = await router.generateTests({
      url,
      prompt: instruction,
    });
    
    // Should generate multiple test cases for generic instruction (fallback to template)
    expect(response.testCases.length).toBeGreaterThan(1);
  });

  it('should detect specific vs generic instructions correctly', async () => {
    const specificInstruction = 'Send a GET request to "https://api.example.com/users" and verify status code';
    const genericInstruction = 'Test the API';
    
    const router = new IntegratedTestRouter();
    
    const specificResponse = await router.generateTests({
      url: 'https://api.example.com/users',
      prompt: specificInstruction,
    });
    
    const genericResponse = await router.generateTests({
      url: 'https://api.example.com/users',
      prompt: genericInstruction,
    });
    
    // Specific instruction should generate 1 test
    expect(specificResponse.testCases.length).toBe(1);
    
    // Generic instruction should generate multiple tests
    expect(genericResponse.testCases.length).toBeGreaterThan(1);
  });
});

describe('Integration - Complex Instructions', () => {
  it('should handle multi-step instruction with all action types', () => {
    const instruction = `Send a GET request to "https://jsonplaceholder.typicode.com/posts"
Store the response status code
Store response body
Count the number of objects
Read id field
Verify status code equals 200`;
    
    const parsed = parseAPIInstructionEnhanced(instruction, 'https://jsonplaceholder.typicode.com/posts');
    const testCase = generateInstructionBasedTestCase(parsed);
    
    // Verify all actions are represented in steps
    expect(testCase.steps.length).toBeGreaterThanOrEqual(5);
    
    const stepActions = testCase.steps.map(s => s.action).join(' ').toLowerCase();
    expect(stepActions).toContain('send');
    expect(stepActions).toContain('store');
    expect(stepActions).toContain('count');
    expect(stepActions).toContain('read');
  });

  it('should generate code that matches instruction order', () => {
    const instruction = `Send a GET request to "https://api.example.com/users"
Store the response status code
Count the number of objects
Verify status code equals 200`;
    
    const code = generateAPITestFromInstruction(instruction, 'https://api.example.com/users');
    
    // Find positions of key operations in code
    const sendPos = code.indexOf('request.get');
    const storePos = code.indexOf('statusCode = response.status()');
    const countPos = code.indexOf('itemCount');
    const verifyPos = code.indexOf('expect(statusCode).toBe(200)');
    
    // Verify order matches instruction
    expect(sendPos).toBeLessThan(storePos);
    expect(storePos).toBeLessThan(countPos);
    expect(countPos).toBeLessThan(verifyPos);
  });

  it('should handle authenticated POST with multiple fields', () => {
    const instruction = `Send a POST request to "https://api.example.com/users" with authentication
Read userId field
Read email field
Expect userId type is number
Verify status code equals 201`;
    
    const parsed = parseAPIInstructionEnhanced(instruction, 'https://api.example.com/users');
    const testCase = generateInstructionBasedTestCase(parsed);
    
    // Verify authentication is detected
    expect(testCase.authentication.required).toBe(true);
    expect(testCase.authentication.type).toBe('Bearer');
    
    // Verify preconditions include auth
    expect(testCase.preconditions).toContain('Valid authentication token is available');
    
    // Verify expected status is 201
    expect(testCase.expectedResults.responseCode).toBe(201);
    
    // Verify steps include field reading
    const stepActions = testCase.steps.map(s => s.action).join(' ');
    expect(stepActions).toContain('userId');
    expect(stepActions).toContain('email');
  });
});

describe('Integration - Router Behavior', () => {
  it('should route specific instructions to instruction-based generator', async () => {
    const instruction = 'Send a GET request to "https://api.example.com/users" and store response';
    const url = 'https://api.example.com/users';
    
    const router = new IntegratedTestRouter();
    const response = await router.generateTests({
      url,
      prompt: instruction,
    });
    
    // Should use instruction-based generator (1 test)
    expect(response.testCases.length).toBe(1);
    expect(response.summary.generatorsUsed.api).toBe(1);
  });

  it('should route generic instructions to template-based generator', async () => {
    const instruction = 'Test API';
    const url = 'https://api.example.com/users';
    
    const router = new IntegratedTestRouter();
    const response = await router.generateTests({
      url,
      prompt: instruction,
    });
    
    // Should use template-based generator (multiple tests)
    expect(response.testCases.length).toBeGreaterThan(1);
  });

  it('should maintain backward compatibility', async () => {
    const analysis: WebsiteAnalysis = {
      url: 'https://api.example.com',
      allInteractive: [],
    };
    
    const router = new IntegratedTestRouter();
    const response = await router.generateTests({
      url: analysis.url,
      prompt: 'Test the API',
      websiteAnalysis: analysis,
    });
    
    // Should still work with existing interface
    expect(response.testCases).toBeDefined();
    expect(response.summary).toBeDefined();
    expect(response.intent).toBeDefined();
  });
});

describe('Integration - End-to-End Validation', () => {
  it('should generate executable Playwright code', () => {
    const instruction = `Send a GET request to "https://jsonplaceholder.typicode.com/posts"
Verify status code equals 200`;
    const code = generateAPITestFromInstruction(instruction, 'https://jsonplaceholder.typicode.com/posts');
    
    // Verify code has all required Playwright elements
    expect(code).toContain('import { test, expect }');
    expect(code).toContain('from \'@playwright/test\'');
    expect(code).toContain('test(');
    expect(code).toContain('async ({ request })');
    expect(code).toContain('await request.');
    expect(code).toContain('expect(');
    expect(code).toContain('});');
    
    // Verify code is properly formatted
    expect(code.split('\n').length).toBeGreaterThan(10);
  });

  it('should generate test case that matches all requirements', () => {
    const instruction = `Send a POST request to "https://api.example.com/users"
Store the response status code
Read userId field
Verify status code equals 201`;
    
    const parsed = parseAPIInstructionEnhanced(instruction, 'https://api.example.com/users');
    const testCase = generateInstructionBasedTestCase(parsed);
    
    // Requirement 1.1: Test case based on instruction
    expect(testCase.title).toContain('POST');
    expect(testCase.title).toContain('/users');
    
    // Requirement 1.2: Steps match actions
    expect(testCase.steps.some(s => s.action.includes('Send POST request'))).toBe(true);
    expect(testCase.steps.some(s => s.action.includes('Store response status code'))).toBe(true);
    expect(testCase.steps.some(s => s.action.includes('Read userId field'))).toBe(true);
    
    // Requirement 1.3: Assertions included
    expect(testCase.validationCriteria.apiResponse).toBeDefined();
    expect(testCase.validationCriteria.apiResponse?.some(v => v.includes('201'))).toBe(true);
    
    // Requirement 5.1: Single test case for simple instruction
    // (verified by router tests above)
    
    // Verify automation code is generated
    expect(testCase.automationMapping).toBeDefined();
    if (testCase.automationMapping) {
      expect(testCase.automationMapping.length).toBeGreaterThan(0);
    }
  });
});
