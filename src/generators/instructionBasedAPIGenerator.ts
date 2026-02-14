/**
 * Instruction-Based API Test Generator
 * 
 * Generates API test cases directly from user instructions, creating test cases,
 * test steps, preconditions, and Playwright code that match the specific instruction.
 * 
 * This module transforms natural language instructions into structured test cases
 * without relying on generic templates.
 */

import {
  formatTestCase,
  type BaseTestCase,
  type TestStep,
  type ValidationCriteria,
} from './testCaseFormatter';
import type { APITestCase } from './apiTestGenerator';
import {
  parseAPIInstructionEnhanced,
  generateAPITestFromInstruction,
  type ParsedAPIInstruction,
  type InstructionAction,
} from './apiPlaywrightCodeGenerator';

/**
 * Generate Instruction-Based Test Case
 * 
 * Main entry point for generating a test case from a parsed instruction.
 * Creates a complete APITestCase with instruction-based title, description,
 * steps, preconditions, and Playwright code.
 * 
 * Requirements: 1.1, 1.2, 1.3
 * 
 * @param parsedInstruction - Parsed API instruction with actions and metadata
 * @returns Complete API test case matching the instruction
 */
export function generateInstructionBasedTestCase(
  parsedInstruction: ParsedAPIInstruction
): APITestCase {
  // Generate test steps from instruction actions
  const steps = generateTestStepsFromActions(parsedInstruction.actions);
  
  // Generate preconditions from instruction
  const preconditions = generatePreconditionsFromInstruction(parsedInstruction);
  
  // Generate Playwright code from instruction
  const playwrightCode = generateAPITestFromInstruction(
    reconstructInstructionText(parsedInstruction),
    parsedInstruction.url,
    parsedInstruction.testMetadata.title
  );
  
  // Build validation criteria based on assertions
  const validationCriteria: ValidationCriteria = {
    apiResponse: [
      `Status code is ${parsedInstruction.assertions.find(a => a.type === 'status')?.expectedValue || 200}`,
      'Response body is valid',
    ],
    dataState: [],
  };
  
  // Add field validation criteria
  parsedInstruction.assertions
    .filter(a => a.type === 'field' && a.field)
    .forEach(assertion => {
      validationCriteria.apiResponse?.push(`Field '${assertion.field}' exists`);
    });
  
  // Add type validation criteria
  parsedInstruction.assertions
    .filter(a => a.type === 'type' && a.field)
    .forEach(assertion => {
      validationCriteria.apiResponse?.push(
        `Field '${assertion.field}' type is ${assertion.expectedValue}`
      );
    });
  
  // Add count validation criteria
  if (parsedInstruction.assertions.some(a => a.type === 'count')) {
    validationCriteria.apiResponse?.push('Object count is greater than 0');
  }
  
  // Add time validation criteria
  const timeAssertion = parsedInstruction.assertions.find(a => a.type === 'time');
  if (timeAssertion) {
    validationCriteria.apiResponse?.push(
      `Response time < ${timeAssertion.expectedValue}ms`
    );
  }
  
  // Determine expected status code
  const expectedStatusCode = parsedInstruction.assertions.find(a => a.type === 'status')?.expectedValue ||
    (parsedInstruction.method === 'POST' ? 201 : 200);
  
  // Build the test case
  const testCase: Partial<APITestCase> = {
    title: parsedInstruction.testMetadata.title,
    description: parsedInstruction.testMetadata.description,
    category: parsedInstruction.testMetadata.category,
    testType: 'API',
    priority: parsedInstruction.testMetadata.category === 'Smoke' ? 'Critical' : 'High',
    severity: parsedInstruction.testMetadata.category === 'Performance' ? 'Medium' : 'High',
    stability: 'Stable',
    preconditions,
    steps,
    expectedResult: `API returns ${expectedStatusCode} with valid response matching instruction`,
    validationCriteria,
    automationMapping: playwrightCode,
    playwrightCode, // For backward compatibility
    apiDetails: {
      httpMethod: parsedInstruction.method,
      endpoint: parsedInstruction.endpoint,
      baseUrl: parsedInstruction.baseUrl,
      requestHeaders: {
        'Content-Type': 'application/json',
        ...(parsedInstruction.requiresAuth ? { 'Authorization': 'Bearer <token>' } : {}),
      },
      requestBody: ['POST', 'PUT', 'PATCH'].includes(parsedInstruction.method)
        ? { data: 'example' }
        : undefined,
    },
    authentication: {
      type: parsedInstruction.requiresAuth ? 'Bearer' : 'None',
      required: parsedInstruction.requiresAuth,
      headerName: parsedInstruction.requiresAuth ? 'Authorization' : undefined,
      tokenFormat: parsedInstruction.requiresAuth ? 'Bearer <token>' : undefined,
    },
    expectedResults: {
      responseCode: expectedStatusCode,
      responseSchema: {
        type: 'object',
        properties: {},
      },
      responseTime: timeAssertion?.expectedValue || 1000,
    },
  };
  
  return formatTestCase(testCase, 'API') as APITestCase;
}

/**
 * Generate Test Steps from Actions
 * 
 * Maps instruction actions to test steps, preserving the order from the instruction
 * and generating step descriptions that match the instruction phrases.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 * 
 * @param actions - Array of instruction actions
 * @returns Array of test steps numbered sequentially
 */
export function generateTestStepsFromActions(actions: InstructionAction[]): TestStep[] {
  const steps: TestStep[] = [];
  
  // Map each action to a test step
  actions.forEach((action, index) => {
    const step: TestStep = {
      stepNumber: index + 1,
      action: action.description,
      expectedResult: generateExpectedResultForAction(action),
    };
    
    // Add input data for specific action types
    if (action.type === 'send_request' && action.field) {
      step.inputData = { [action.field]: 'example' };
    }
    
    steps.push(step);
  });
  
  return steps;
}

/**
 * Generate Expected Result for Action
 * 
 * Creates an appropriate expected result description based on the action type.
 * 
 * @param action - Instruction action
 * @returns Expected result description
 */
function generateExpectedResultForAction(action: InstructionAction): string {
  switch (action.type) {
    case 'send_request':
      return 'Request is sent successfully';
    
    case 'store_response':
      if (action.field === 'statusCode') {
        return 'Status code is stored';
      } else if (action.field === 'body') {
        return 'Response body is stored';
      }
      return 'Response data is stored';
    
    case 'read_field':
      return `Field '${action.field}' is read from response`;
    
    case 'count':
      return 'Object count is calculated';
    
    case 'verify':
      if (action.field === 'statusCode') {
        return `Status code equals ${action.expectedValue}`;
      } else if (action.expectedValue) {
        return `Verification passes: ${action.field} = ${action.expectedValue}`;
      }
      return 'Verification passes';
    
    case 'measure_time':
      return 'Response time is measured';
    
    default:
      return 'Action completes successfully';
  }
}

/**
 * Generate Preconditions from Instruction
 * 
 * Creates relevant preconditions based on the instruction requirements.
 * Always includes base preconditions, conditionally adds auth and data preconditions.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 * 
 * @param parsedInstruction - Parsed API instruction
 * @returns Array of precondition strings
 */
export function generatePreconditionsFromInstruction(
  parsedInstruction: ParsedAPIInstruction
): string[] {
  const preconditions: string[] = [];
  
  // Always include: "API server is running and accessible"
  preconditions.push('API server is running and accessible');
  
  // Always include: "Endpoint [endpoint] is accessible"
  preconditions.push(`Endpoint ${parsedInstruction.endpoint} is accessible`);
  
  // Conditionally include auth precondition if requiresAuth is true
  if (parsedInstruction.requiresAuth) {
    preconditions.push('Valid authentication token is available');
  }
  
  // Conditionally include data precondition for POST/PUT/PATCH
  if (['POST', 'PUT', 'PATCH'].includes(parsedInstruction.method)) {
    preconditions.push('Test data is prepared');
  }
  
  return preconditions;
}

/**
 * Reconstruct Instruction Text
 * 
 * Helper function to reconstruct instruction text from parsed instruction
 * for use with the Playwright code generator.
 * 
 * @param parsedInstruction - Parsed API instruction
 * @returns Reconstructed instruction text
 */
function reconstructInstructionText(parsedInstruction: ParsedAPIInstruction): string {
  const lines: string[] = [];
  
  // Add actions
  parsedInstruction.actions.forEach(action => {
    lines.push(action.description);
  });
  
  return lines.join('\n');
}
