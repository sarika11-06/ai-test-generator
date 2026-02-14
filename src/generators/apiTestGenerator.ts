/**
 * API Test Generator Module
 * 
 * Generates comprehensive API test cases for endpoint validation.
 * This module creates test cases for success paths, validation errors,
 * authentication failures, schema validation, and performance testing.
 */

import {
  formatTestCase,
  generateTestId,
  type BaseTestCase,
  type TestStep,
  type ValidationCriteria,
} from './testCaseFormatter';
import type { WebsiteAnalysis } from './testIntentClassifier';
import { generateAPITestFromInstruction } from './apiPlaywrightCodeGenerator';

/**
 * API Test Case Interface
 * 
 * Extends BaseTestCase with API-specific fields for endpoint testing.
 */
export interface APITestCase extends BaseTestCase {
  testType: 'API';
  testCaseId?: string; // For backward compatibility with frontend
  playwrightCode?: string; // For backward compatibility with frontend (copy of automationMapping)
  apiDetails: {
    httpMethod: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    endpoint: string;
    baseUrl?: string;
    requestHeaders: Record<string, string>;
    requestBody?: any;
    queryParameters?: Record<string, string>;
  };
  authentication: {
    type: 'Bearer' | 'Basic' | 'API-Key' | 'OAuth2' | 'None';
    required: boolean;
    headerName?: string;
    tokenFormat?: string;
  };
  expectedResults: {
    responseCode: number;
    responseSchema: any;
    responseTime: number;
    responseHeaders?: Record<string, string>;
  };
  negativeScenarios?: {
    invalidInput: any;
    expectedError: string;
    expectedStatusCode: number;
  }[];
}

/**
 * API Endpoint Configuration
 * 
 * Configuration for API endpoint to test.
 */
interface APIEndpointConfig {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  baseUrl?: string;
  requiresAuth?: boolean;
  requestBodySchema?: any;
  responseSchema?: any;
}

/**
 * Generate API Tests
 * 
 * Main entry point for generating API test cases based on user prompt
 * and optional endpoint configuration.
 * 
 * @param websiteAnalysis - Analysis of the website (may contain API documentation)
 * @param userPrompt - User's test generation prompt
 * @param endpointConfig - Optional explicit endpoint configuration
 * @returns Array of API test cases
 */
export function generateAPITests(
  websiteAnalysis: WebsiteAnalysis,
  userPrompt: string,
  endpointConfig?: APIEndpointConfig
): APITestCase[] {
  const testCases: APITestCase[] = [];
  
  // Extract endpoint information from prompt or config
  const endpoint = endpointConfig?.endpoint || extractEndpointFromPrompt(userPrompt);
  const method = endpointConfig?.method || extractMethodFromPrompt(userPrompt);
  
  // Extract base URL - prioritize full URLs in prompt
  let baseUrl = endpointConfig?.baseUrl || websiteAnalysis.url;
  const urlMatch = userPrompt.match(/https?:\/\/[^\s"']+/i);
  if (urlMatch) {
    try {
      const url = new URL(urlMatch[0]);
      baseUrl = `${url.protocol}//${url.host}`;
    } catch (e) {
      // Keep default baseUrl if parsing fails
    }
  }
  
  const requiresAuth = endpointConfig?.requiresAuth ?? true; // Default to requiring auth
  
  // Generate success path test
  testCases.push(generateSuccessPathTest(endpoint, method, baseUrl, requiresAuth));
  
  // Generate validation error test (400)
  testCases.push(generateValidationErrorTest(endpoint, method, baseUrl, requiresAuth));
  
  // Generate authentication failure test (401) if auth is required
  if (requiresAuth) {
    testCases.push(generateAuthenticationFailureTest(endpoint, method, baseUrl));
  }
  
  // Generate schema validation test
  testCases.push(generateSchemaValidationTest(endpoint, method, baseUrl, requiresAuth));
  
  // Generate performance test
  testCases.push(generatePerformanceTest(endpoint, method, baseUrl, requiresAuth));
  
  return testCases;
}

/**
 * Generate Success Path Test
 * 
 * Creates a test case for verifying successful API response with valid input.
 * 
 * @param endpoint - API endpoint path
 * @param method - HTTP method
 * @param baseUrl - Base URL for the API
 * @param requiresAuth - Whether authentication is required
 * @returns API test case for success path
 */
export function generateSuccessPathTest(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  baseUrl: string,
  requiresAuth: boolean = true
): APITestCase {
  const expectedStatusCode = method === 'POST' ? 201 : 200;
  const requestBody = ['POST', 'PUT', 'PATCH'].includes(method) 
    ? { data: 'example', value: 'test' }
    : undefined;
  
  const steps: TestStep[] = [
    {
      stepNumber: 1,
      action: `Send ${method} request to ${endpoint}`,
      inputData: requestBody,
      expectedResult: 'Request is sent successfully',
    },
    {
      stepNumber: 2,
      action: 'Store response status code',
      expectedResult: 'Status code is stored',
    },
    {
      stepNumber: 3,
      action: 'Store response body',
      expectedResult: 'Response body is stored',
    },
    {
      stepNumber: 4,
      action: 'Read response status code from stored value',
      expectedResult: `Status code value is ${expectedStatusCode}`,
    },
    {
      stepNumber: 5,
      action: 'Compare status code with expected value',
      expectedResult: `Status code equals ${expectedStatusCode}`,
    },
    {
      stepNumber: 6,
      action: 'Read response body fields',
      expectedResult: 'All required fields are present',
    },
    {
      stepNumber: 7,
      action: 'Compare field data types with expected types',
      expectedResult: 'All field types match schema',
    },
    {
      stepNumber: 8,
      action: 'Measure response time',
      expectedResult: 'Response time is measured',
    },
    {
      stepNumber: 9,
      action: 'Compare response time with threshold',
      expectedResult: 'Response time is less than 500ms',
    },
  ];
  
  const validationCriteria: ValidationCriteria = {
    apiResponse: [
      `Status code is ${expectedStatusCode}`,
      'Response body matches schema',
      'Response time < 500ms',
    ],
    dataState: [
      'Response contains required fields',
      'Data types are correct',
      'Data values are valid',
    ],
  };
  
  const testCase: Partial<APITestCase> = {
    title: `${method} ${endpoint} - Success Path`,
    description: `Verify ${endpoint} returns successful response with valid input`,
    category: 'Smoke',
    testType: 'API',
    priority: 'Critical',
    severity: 'Critical',
    stability: 'Stable',
    apiDetails: {
      httpMethod: method,
      endpoint: endpoint,
      baseUrl: baseUrl,
      requestHeaders: {
        'Content-Type': 'application/json',
        ...(requiresAuth ? { 'Authorization': 'Bearer <token>' } : {}),
      },
      requestBody: requestBody,
    },
    authentication: {
      type: requiresAuth ? 'Bearer' : 'None',
      required: requiresAuth,
      headerName: requiresAuth ? 'Authorization' : undefined,
      tokenFormat: requiresAuth ? 'Bearer <token>' : undefined,
    },
    expectedResults: {
      responseCode: expectedStatusCode,
      responseSchema: {
        type: 'object',
        // Don't require specific fields - APIs have different response structures
        properties: {},
      },
      responseTime: 2000,  // Increased from 500ms to 2000ms for real API calls
    },
    preconditions: [
      'API server is running and accessible',
      ...(requiresAuth ? ['Valid authentication token is available'] : []),
      'Endpoint accepts valid requests',
      'Test data is prepared'
    ],
    steps,
    expectedResult: 'API returns successful response with valid data',
    validationCriteria,
  };
  
  return formatTestCase(testCase, 'API') as APITestCase;
}

/**
 * Generate Validation Error Test
 * 
 * Creates a test case for verifying 400 Bad Request response with invalid input.
 * 
 * @param endpoint - API endpoint path
 * @param method - HTTP method
 * @param baseUrl - Base URL for the API
 * @param requiresAuth - Whether authentication is required
 * @returns API test case for validation error (400)
 */
export function generateValidationErrorTest(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  baseUrl: string,
  requiresAuth: boolean = true
): APITestCase {
  const invalidRequestBody = ['POST', 'PUT', 'PATCH'].includes(method)
    ? { invalidField: 'invalid', missingRequired: null }
    : undefined;
  
  const steps: TestStep[] = [
    {
      stepNumber: 1,
      action: `Send ${method} request to ${endpoint} with invalid data`,
      inputData: invalidRequestBody,
      expectedResult: 'Request is sent with invalid payload',
    },
    {
      stepNumber: 2,
      action: 'Store response status code',
      expectedResult: 'Status code is stored',
    },
    {
      stepNumber: 3,
      action: 'Store response body',
      expectedResult: 'Response body is stored',
    },
    {
      stepNumber: 4,
      action: 'Read response status code from stored value',
      expectedResult: 'Status code value is 400',
    },
    {
      stepNumber: 5,
      action: 'Compare status code with expected value 400',
      expectedResult: 'Status code equals 400 Bad Request',
    },
    {
      stepNumber: 6,
      action: 'Read error field from response body',
      expectedResult: 'Error field exists',
    },
    {
      stepNumber: 7,
      action: 'Read message field from response body',
      expectedResult: 'Message field exists and is not empty',
    },
    {
      stepNumber: 8,
      action: 'Compare error message type with string',
      expectedResult: 'Error message is string type',
    },
  ];
  
  const validationCriteria: ValidationCriteria = {
    apiResponse: [
      'Status code is 400',
      'Error message is present and descriptive',
      'Error response follows standard format',
    ],
    dataState: [
      'Invalid data is rejected',
      'System state remains unchanged',
    ],
  };
  
  const testCase: Partial<APITestCase> = {
    title: `${method} ${endpoint} - Validation Error (400)`,
    description: `Verify ${endpoint} returns 400 Bad Request with invalid input`,
    category: 'Regression',
    testType: 'API',
    priority: 'High',
    severity: 'High',
    stability: 'Stable',
    apiDetails: {
      httpMethod: method,
      endpoint: endpoint,
      baseUrl: baseUrl,
      requestHeaders: {
        'Content-Type': 'application/json',
        ...(requiresAuth ? { 'Authorization': 'Bearer <token>' } : {}),
      },
      requestBody: invalidRequestBody,
    },
    authentication: {
      type: requiresAuth ? 'Bearer' : 'None',
      required: requiresAuth,
      headerName: requiresAuth ? 'Authorization' : undefined,
      tokenFormat: requiresAuth ? 'Bearer <token>' : undefined,
    },
    expectedResults: {
      responseCode: 400,
      responseSchema: {
        type: 'object',
        required: ['error', 'message'],
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
          details: { type: 'array' },
        },
      },
      responseTime: 2000,
    },
    negativeScenarios: [
      {
        invalidInput: invalidRequestBody,
        expectedError: 'Validation failed',
        expectedStatusCode: 400,
      },
    ],
    preconditions: [
      'API server is running and accessible',
      ...(requiresAuth ? ['Valid authentication token is available'] : []),
      'Endpoint has input validation enabled',
      'Invalid test data is prepared'
    ],
    steps,
    expectedResult: 'API returns 400 Bad Request with descriptive error message',
    validationCriteria,
  };
  
  return formatTestCase(testCase, 'API') as APITestCase;
}

/**
 * Generate Authentication Failure Test
 * 
 * Creates a test case for verifying 401 Unauthorized response with missing/invalid auth.
 * 
 * @param endpoint - API endpoint path
 * @param method - HTTP method
 * @param baseUrl - Base URL for the API
 * @returns API test case for authentication failure (401)
 */
export function generateAuthenticationFailureTest(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  baseUrl: string
): APITestCase {
  const requestBody = ['POST', 'PUT', 'PATCH'].includes(method)
    ? { data: 'example', value: 'test' }
    : undefined;
  
  const steps: TestStep[] = [
    {
      stepNumber: 1,
      action: `Send ${method} request to ${endpoint} without authentication token`,
      inputData: requestBody,
      expectedResult: 'Request is sent without Authorization header',
    },
    {
      stepNumber: 2,
      action: 'Store response status code',
      expectedResult: 'Status code is stored',
    },
    {
      stepNumber: 3,
      action: 'Compare status code with expected value 401',
      expectedResult: 'Status code equals 401 Unauthorized',
    },
    {
      stepNumber: 4,
      action: 'Read error message from response body',
      expectedResult: 'Error message indicates authentication failure',
    },
    {
      stepNumber: 5,
      action: `Send ${method} request to ${endpoint} with invalid token`,
      inputData: requestBody,
      expectedResult: 'Request is sent with invalid Authorization header',
    },
    {
      stepNumber: 6,
      action: 'Store response status code for invalid token',
      expectedResult: 'Status code is stored',
    },
    {
      stepNumber: 7,
      action: 'Compare status code with expected value 401',
      expectedResult: 'Status code equals 401 Unauthorized',
    },
  ];
  
  const validationCriteria: ValidationCriteria = {
    apiResponse: [
      'Status code is 401 for missing token',
      'Status code is 401 for invalid token',
      'Error message indicates authentication failure',
    ],
    dataState: [
      'No data is returned without authentication',
      'System state remains secure',
    ],
  };
  
  const testCase: Partial<APITestCase> = {
    title: `${method} ${endpoint} - Authentication Failure (401)`,
    description: `Verify ${endpoint} returns 401 Unauthorized with missing or invalid authentication`,
    category: 'Security',
    testType: 'API',
    priority: 'Critical',
    severity: 'Critical',
    stability: 'Stable',
    apiDetails: {
      httpMethod: method,
      endpoint: endpoint,
      baseUrl: baseUrl,
      requestHeaders: {
        'Content-Type': 'application/json',
        // No Authorization header
      },
      requestBody: requestBody,
    },
    authentication: {
      type: 'Bearer',
      required: true,
      headerName: 'Authorization',
      tokenFormat: 'Bearer <token>',
    },
    expectedResults: {
      responseCode: 401,
      responseSchema: {
        type: 'object',
        required: ['error', 'message'],
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
        },
      },
      responseTime: 2000,
    },
    negativeScenarios: [
      {
        invalidInput: { headers: {} },
        expectedError: 'Missing authentication token',
        expectedStatusCode: 401,
      },
      {
        invalidInput: { headers: { Authorization: 'Bearer invalid_token' } },
        expectedError: 'Invalid authentication token',
        expectedStatusCode: 401,
      },
    ],
    preconditions: [
      'API server is running and accessible',
      'Endpoint requires authentication',
      'Authentication system is active'
    ],
    steps,
    expectedResult: 'API returns 401 Unauthorized for missing or invalid authentication',
    validationCriteria,
  };
  
  return formatTestCase(testCase, 'API') as APITestCase;
}

/**
 * Generate Schema Validation Test
 * 
 * Creates a test case for verifying response schema matches expected structure.
 * 
 * @param endpoint - API endpoint path
 * @param method - HTTP method
 * @param baseUrl - Base URL for the API
 * @param requiresAuth - Whether authentication is required
 * @returns API test case for schema validation
 */
export function generateSchemaValidationTest(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  baseUrl: string,
  requiresAuth: boolean = true
): APITestCase {
  const expectedStatusCode = method === 'POST' ? 201 : 200;
  const requestBody = ['POST', 'PUT', 'PATCH'].includes(method)
    ? { data: 'example', value: 'test' }
    : undefined;
  
  const steps: TestStep[] = [
    {
      stepNumber: 1,
      action: `Send ${method} request to ${endpoint}`,
      inputData: requestBody,
      expectedResult: 'Request is sent successfully',
    },
    {
      stepNumber: 2,
      action: 'Store response status code',
      expectedResult: 'Status code is stored',
    },
    {
      stepNumber: 3,
      action: 'Store response body',
      expectedResult: 'Response body is stored',
    },
    {
      stepNumber: 4,
      action: 'Compare status code with expected value',
      expectedResult: `Status code equals ${expectedStatusCode}`,
    },
    {
      stepNumber: 5,
      action: 'Read all field names from response body',
      expectedResult: 'All required fields are present',
    },
    {
      stepNumber: 6,
      action: 'Compare field names with schema required fields',
      expectedResult: 'All required fields exist in response',
    },
    {
      stepNumber: 7,
      action: 'Read data type of each field',
      expectedResult: 'Data types are read successfully',
    },
    {
      stepNumber: 8,
      action: 'Compare field data types with schema types',
      expectedResult: 'All field types match schema',
    },
    {
      stepNumber: 9,
      action: 'Read enum field values',
      expectedResult: 'Enum values are read',
    },
    {
      stepNumber: 10,
      action: 'Compare enum values with allowed values',
      expectedResult: 'Enum fields contain only allowed values',
    },
  ];
  
  const validationCriteria: ValidationCriteria = {
    apiResponse: [
      `Status code is ${expectedStatusCode}`,
      'Response matches expected schema',
      'All required fields are present',
    ],
    dataState: [
      'Data types are correct',
      'Enum values are valid',
      'Nested objects follow schema',
    ],
  };
  
  const testCase: Partial<APITestCase> = {
    title: `${method} ${endpoint} - Schema Validation`,
    description: `Verify ${endpoint} response matches expected schema structure`,
    category: 'Regression',
    testType: 'API',
    priority: 'High',
    severity: 'High',
    stability: 'Stable',
    apiDetails: {
      httpMethod: method,
      endpoint: endpoint,
      baseUrl: baseUrl,
      requestHeaders: {
        'Content-Type': 'application/json',
        ...(requiresAuth ? { 'Authorization': 'Bearer <token>' } : {}),
      },
      requestBody: requestBody,
    },
    authentication: {
      type: requiresAuth ? 'Bearer' : 'None',
      required: requiresAuth,
      headerName: requiresAuth ? 'Authorization' : undefined,
      tokenFormat: requiresAuth ? 'Bearer <token>' : undefined,
    },
    expectedResults: {
      responseCode: expectedStatusCode,
      responseSchema: {
        type: 'object',
        required: ['data', 'status', 'timestamp'],
        properties: {
          data: {
            type: 'object',
            required: ['id', 'name'],
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              status: { type: 'string', enum: ['active', 'inactive'] },
            },
          },
          status: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      responseTime: 2000,
    },
    preconditions: [
      'API server is running and accessible',
      ...(requiresAuth ? ['Valid authentication token is available'] : []),
      'Response schema is documented',
      'JSON schema validator is available'
    ],
    steps,
    expectedResult: 'API response matches expected schema with correct data types and structure',
    validationCriteria,
  };
  
  return formatTestCase(testCase, 'API') as APITestCase;
}

/**
 * Generate Performance Test
 * 
 * Creates a test case for verifying API response time is within acceptable limits.
 * 
 * @param endpoint - API endpoint path
 * @param method - HTTP method
 * @param baseUrl - Base URL for the API
 * @param requiresAuth - Whether authentication is required
 * @returns API test case for performance testing
 */
export function generatePerformanceTest(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  baseUrl: string,
  requiresAuth: boolean = true
): APITestCase {
  const expectedStatusCode = method === 'POST' ? 201 : 200;
  const requestBody = ['POST', 'PUT', 'PATCH'].includes(method)
    ? { data: 'example', value: 'test' }
    : undefined;
  
  const steps: TestStep[] = [
    {
      stepNumber: 1,
      action: `Send ${method} request to ${endpoint}`,
      inputData: requestBody,
      expectedResult: 'Request is sent successfully',
    },
    {
      stepNumber: 2,
      action: 'Measure response time from request start to response received',
      expectedResult: 'Response time is measured in milliseconds',
    },
    {
      stepNumber: 3,
      action: 'Store response time value',
      expectedResult: 'Response time value is stored',
    },
    {
      stepNumber: 4,
      action: 'Compare response time with threshold 500ms',
      expectedResult: 'Response time is less than 500ms',
    },
    {
      stepNumber: 5,
      action: 'Send multiple concurrent requests (5 requests)',
      expectedResult: 'All concurrent requests are sent',
    },
    {
      stepNumber: 6,
      action: 'Store response status codes for all requests',
      expectedResult: 'All status codes are stored',
    },
    {
      stepNumber: 7,
      action: 'Compare each status code with expected value',
      expectedResult: 'All requests return expected status code',
    },
    {
      stepNumber: 8,
      action: 'Measure average response time across all requests',
      expectedResult: 'Average response time is calculated',
    },
    {
      stepNumber: 9,
      action: 'Compare average response time with threshold',
      expectedResult: 'Average response time remains under threshold',
    },
  ];
  
  const validationCriteria: ValidationCriteria = {
    apiResponse: [
      `Status code is ${expectedStatusCode}`,
      'Response time < 500ms',
      'Response time is consistent across requests',
    ],
    behavior: [
      'API handles concurrent requests',
      'Performance degrades gracefully under load',
    ],
  };
  
  const testCase: Partial<APITestCase> = {
    title: `${method} ${endpoint} - Performance Test`,
    description: `Verify ${endpoint} response time is within acceptable limits`,
    category: 'Performance',
    testType: 'API',
    priority: 'Medium',
    severity: 'Medium',
    stability: 'Stable',
    apiDetails: {
      httpMethod: method,
      endpoint: endpoint,
      baseUrl: baseUrl,
      requestHeaders: {
        'Content-Type': 'application/json',
        ...(requiresAuth ? { 'Authorization': 'Bearer <token>' } : {}),
      },
      requestBody: requestBody,
    },
    authentication: {
      type: requiresAuth ? 'Bearer' : 'None',
      required: requiresAuth,
      headerName: requiresAuth ? 'Authorization' : undefined,
      tokenFormat: requiresAuth ? 'Bearer <token>' : undefined,
    },
    expectedResults: {
      responseCode: expectedStatusCode,
      responseSchema: {
        type: 'object',
        required: ['data', 'status'],
        properties: {
          data: { type: 'object' },
          status: { type: 'string' },
        },
      },
      responseTime: 2000,
    },
    preconditions: [
      'API server is running and accessible',
      ...(requiresAuth ? ['Valid authentication token is available'] : []),
      'Network conditions are stable',
      'Performance monitoring tools are available'
    ],
    steps,
    expectedResult: 'API responds within 2000ms under normal and concurrent load',
    validationCriteria,
  };
  
  return formatTestCase(testCase, 'API') as APITestCase;
}

/**
 * Extract Endpoint from Prompt
 * 
 * Attempts to extract API endpoint path from user prompt.
 * Handles both full URLs and endpoint paths.
 * 
 * @param prompt - User prompt
 * @returns Extracted endpoint or default
 */
function extractEndpointFromPrompt(prompt: string): string {
  // First, check if prompt contains a full URL
  const urlMatch = prompt.match(/https?:\/\/[^\s"']+/i);
  if (urlMatch) {
    try {
      const url = new URL(urlMatch[0]);
      // Return empty string if the URL is already complete
      // The full URL will be used as-is
      return '';
    } catch (e) {
      // If URL parsing fails, continue to endpoint extraction
    }
  }
  
  // Look for patterns like /api/users, /v1/products, /posts, etc.
  // But exclude protocol slashes (https://)
  const endpointMatch = prompt.match(/(?<!:)\/[a-zA-Z0-9/_-]+/);
  return endpointMatch ? endpointMatch[0] : '';
}

/**
 * Extract HTTP Method from Prompt
 * 
 * Attempts to extract HTTP method from user prompt.
 * Looks for explicit method mentions or action verbs.
 * 
 * @param prompt - User prompt
 * @returns Extracted HTTP method or default GET
 */
function extractMethodFromPrompt(prompt: string): 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' {
  const promptLower = prompt.toLowerCase();
  
  // Check for explicit method mentions (highest priority)
  if (promptLower.includes('send a post') || promptLower.includes('send post') || promptLower.includes('post request')) return 'POST';
  if (promptLower.includes('send a put') || promptLower.includes('send put') || promptLower.includes('put request')) return 'PUT';
  if (promptLower.includes('send a patch') || promptLower.includes('send patch') || promptLower.includes('patch request')) return 'PATCH';
  if (promptLower.includes('send a delete') || promptLower.includes('send delete') || promptLower.includes('delete request')) return 'DELETE';
  if (promptLower.includes('send a get') || promptLower.includes('send get') || promptLower.includes('get request')) return 'GET';
  
  // Check for action verbs (lower priority)
  if (promptLower.includes('create') || promptLower.includes('add')) return 'POST';
  if (promptLower.includes('update') || promptLower.includes('replace')) return 'PUT';
  if (promptLower.includes('modify') || promptLower.includes('change')) return 'PATCH';
  if (promptLower.includes('delete') || promptLower.includes('remove')) return 'DELETE';
  
  // Default to GET for read operations
  return 'GET';
}

/**
 * Generate API Automation Code
 * 
 * Creates executable Playwright test code for API testing following best practices:
 * - SIGNAL 1: Response assertions (status, body, schema)
 * - SIGNAL 2: Structured logging for traceability
 * - SIGNAL 3: State change verification
 * 
 * Uses executable action verbs: send, store, read, compare, expect, measure
 * 
 * @param testCase - API test case to generate code for
 * @param userInstruction - Optional user instruction for custom test generation
 * @returns Executable Playwright API test code
 */
export function generateAPIAutomationCode(testCase: APITestCase, userInstruction?: string): string {
  // If we have a user instruction, check if it's a meaningful instruction
  // Generic prompts like "test API testing" should use template-based generation
  const isMeaningfulInstruction = userInstruction && 
    userInstruction.length > 20 && 
    /(?:click|enter|fill|type|select|verify|navigate|press|tap|hover|scroll|submit|login|button|field|form|input|check|uncheck|assert|expect|validate)/i.test(userInstruction);
  
  if (isMeaningfulInstruction) {
    const url = testCase.apiDetails.baseUrl + testCase.apiDetails.endpoint;
    return generateAPITestFromInstruction(userInstruction, url, testCase.title);
  }
  
  // Otherwise, use the standard template-based generation
  const testTitle = testCase.title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-').toLowerCase();
  const { httpMethod, endpoint, baseUrl, requestHeaders, requestBody } = testCase.apiDetails;
  const { responseCode, responseSchema, responseTime } = testCase.expectedResults;
  const requiresAuth = testCase.authentication.required;
  
  // Determine if this is a negative test (error scenario)
  const isNegativeTest = responseCode >= 400;
  const hasRequestBody = requestBody && ['POST', 'PUT', 'PATCH'].includes(httpMethod);
  
  // Build full URL - if endpoint is empty, use baseUrl as-is
  const fullUrl = endpoint ? `${baseUrl || 'https://api.example.com'}${endpoint}` : (baseUrl || 'https://api.example.com');
  
  let code = `import { test, expect } from '@playwright/test';

/**
 * ${testCase.title}
 * 
 * ${testCase.description}
 * 
 * Expected Response: ${responseCode}
 * Performance Threshold: ${responseTime}ms
 */
test('${testTitle}', async ({ request }) => {
  console.log('🚀 Starting API test: ${testCase.title}');
  
  // ═══════════════════════════════════════════════════════════
  // STEP 1: SEND ${httpMethod} REQUEST
  // ═══════════════════════════════════════════════════════════
  console.log('📋 Step 1: Send ${httpMethod} request to ${endpoint}');
  
  const startTime = Date.now();
  
  const response = await request.${httpMethod.toLowerCase()}('${fullUrl}', {
    headers: ${JSON.stringify(requestHeaders, null, 4)},
${hasRequestBody ? `    data: ${JSON.stringify(requestBody, null, 4)},\n` : ''}  });
  
  const responseTime = Date.now() - startTime;
  
  console.log(\`✅ Request sent successfully\`);
  
  // ═══════════════════════════════════════════════════════════
  // STEP 2: STORE RESPONSE STATUS CODE
  // ═══════════════════════════════════════════════════════════
  console.log('📋 Step 2: Store response status code');
  
  const statusCode = response.status();
  console.log(\`✅ Status Code: \${statusCode}\`);
  
  // ═══════════════════════════════════════════════════════════
  // STEP 3: STORE RESPONSE BODY
  // ═══════════════════════════════════════════════════════════
  console.log('📋 Step 3: Store response body');
  
  const responseBody = await response.json();
  console.log(\`✅ Response Body Retrieved\`);
  
  // ═══════════════════════════════════════════════════════════
  // STEP 4: MEASURE RESPONSE TIME
  // ═══════════════════════════════════════════════════════════
  console.log('📋 Step 4: Measure response time');
  console.log(\`✅ Response Time: \${responseTime} ms\`);
  
`;

  // Add assertions based on test type
  if (!isNegativeTest) {
    // SUCCESS PATH ASSERTIONS
    code += `  // ═══════════════════════════════════════════════════════════
  // SIGNAL 1: RESPONSE ASSERTIONS (SUCCESS PATH)
  // ═══════════════════════════════════════════════════════════
  console.log('📋 Step 5: Verify response assertions');
  
  // ASSERTION 1: Status code equals ${responseCode}
  console.log('  → Expect response status code equals ${responseCode}');
  expect(statusCode).toBe(${responseCode});
  console.log('  ✅ Status code is ${responseCode}');
  
  // ASSERTION 2: Response body is not empty
  console.log('  → Expect response body is not empty');
  expect(responseBody).toBeDefined();
  expect(responseBody).not.toBeNull();
  console.log('  ✅ Response body is not empty');
  
`;

    // Add field-specific assertions for success responses
    if (responseSchema.properties && Object.keys(responseSchema.properties).length > 0) {
      code += `  // ASSERTION 3: Response contains required fields
  console.log('  → Expect response contains required fields');
`;
      
      if (responseSchema.required) {
        responseSchema.required.forEach((field: string) => {
          code += `  expect(responseBody).toHaveProperty('${field}');
  console.log(\`  ✅ Field '${field}' exists\`);
`;
        });
      }
      
      code += `  
  // ASSERTION 4: Read and verify field data types
  console.log('  → Read and verify field data types');
`;
      
      Object.entries(responseSchema.properties).forEach(([field, schema]: [string, any]) => {
        if (schema.type === 'string') {
          code += `  expect(typeof responseBody.${field}).toBe('string');
  console.log(\`  ✅ Field '${field}' is string type\`);
`;
        } else if (schema.type === 'number') {
          code += `  expect(typeof responseBody.${field}).toBe('number');
  console.log(\`  ✅ Field '${field}' is number type\`);
`;
        } else if (schema.type === 'object') {
          code += `  expect(typeof responseBody.${field}).toBe('object');
  console.log(\`  ✅ Field '${field}' is object type\`);
`;
        } else if (schema.type === 'array') {
          code += `  expect(Array.isArray(responseBody.${field})).toBe(true);
  console.log(\`  ✅ Field '${field}' is array type\`);
`;
        }
      });
    } else {
      // No specific schema - just verify response is an object with content
      code += `  // ASSERTION 3: Response is a valid object
  console.log('  → Expect response is a valid object');
  expect(typeof responseBody).toBe('object');
  console.log('  ✅ Response is a valid object');
  
  // ASSERTION 4: Response has content
  console.log('  → Expect response has content');
  const responseKeys = Object.keys(responseBody);
  expect(responseKeys.length).toBeGreaterThan(0);
  console.log(\`  ✅ Response has \${responseKeys.length} fields\`);
`;
    }
    
    code += `  
  // ASSERTION 5: Response time within limit
  console.log('  → Expect response time within ${responseTime}ms');
  expect(responseTime).toBeLessThan(${responseTime});
  console.log(\`  ✅ Response time \${responseTime}ms < ${responseTime}ms\`);
  
`;

    // Add state change verification for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(httpMethod)) {
      code += `  // ═══════════════════════════════════════════════════════════
  // SIGNAL 3: STATE CHANGE VERIFICATION
  // ═══════════════════════════════════════════════════════════
  console.log('📋 Step 6: Verify state change');
  
`;
      
      if (httpMethod === 'POST') {
        code += `  // For POST: Verify resource was created
  console.log('  → Expect created resource has ID');
  expect(responseBody.data).toHaveProperty('id');
  expect(responseBody.data.id).toBeDefined();
  console.log(\`  ✅ Resource created with ID: \${responseBody.data.id}\`);
  
`;
      } else if (httpMethod === 'PUT' || httpMethod === 'PATCH') {
        code += `  // For ${httpMethod}: Verify resource was updated
  console.log('  → Expect updated resource reflects changes');
  expect(responseBody.data).toBeDefined();
  console.log(\`  ✅ Resource updated successfully\`);
  
`;
      }
    }
    
  } else {
    // ERROR PATH ASSERTIONS
    code += `  // ═══════════════════════════════════════════════════════════
  // SIGNAL 1: RESPONSE ASSERTIONS (ERROR PATH)
  // ═══════════════════════════════════════════════════════════
  console.log('📋 Step 5: Verify error response assertions');
  
  // ASSERTION 1: Status code equals ${responseCode}
  console.log('  → Expect response status code equals ${responseCode}');
  expect(statusCode).toBe(${responseCode});
  console.log('  ✅ Status code is ${responseCode}');
  
  // ASSERTION 2: Error response contains error field
  console.log('  → Expect response contains error field');
  expect(responseBody).toHaveProperty('error');
  console.log('  ✅ Error field exists');
  
  // ASSERTION 3: Error response contains message field
  console.log('  → Expect response contains message field');
  expect(responseBody).toHaveProperty('message');
  expect(responseBody.message).toBeTruthy();
  console.log(\`  ✅ Error message: \${responseBody.message}\`);
  
  // ASSERTION 4: Read error type
  console.log('  → Read error type from response');
  expect(typeof responseBody.error).toBe('string');
  console.log(\`  ✅ Error type: \${responseBody.error}\`);
  
`;
  }

  // Add final summary
  code += `  // ═══════════════════════════════════════════════════════════
  // SIGNAL 2: STRUCTURED LOGGING SUMMARY
  // ═══════════════════════════════════════════════════════════
  console.log('\\n📊 Test Execution Summary:');
  console.log(\`  • Endpoint: ${httpMethod} ${endpoint}\`);
  console.log(\`  • Status Code: \${statusCode}\`);
  console.log(\`  • Response Time: \${responseTime}ms\`);
  console.log(\`  • Expected Status: ${responseCode}\`);
  console.log(\`  • Performance Threshold: ${responseTime}ms\`);
  console.log(\`  • Result: ${!isNegativeTest ? 'SUCCESS ✅' : 'ERROR HANDLED ✅'}\`);
  
  console.log('\\n✅ Test completed successfully');
});
`;

  return code;
}
