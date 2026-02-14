/**
 * API Playwright Code Generator
 * 
 * Dedicated generator for creating working Playwright API test code.
 * Handles instruction parsing and generates executable test code.
 */

/**
 * Extract URL from instruction text
 * Handles both quoted and unquoted URLs, prioritizes actual URLs over field names
 */
function extractUrlFromInstruction(instruction: string, fallbackUrl: string): string {
  // First, try to find URLs that start with http/https in the instruction
  const httpUrlMatch = instruction.match(/\b(https?:\/\/[^\s"']+)/);
  if (httpUrlMatch) {
    return httpUrlMatch[1];
  }
  
  // Look for quoted URLs
  const quotedUrlMatch = instruction.match(/"(https?:\/\/[^"]+)"|'(https?:\/\/[^']+)'/);
  if (quotedUrlMatch) {
    return quotedUrlMatch[1] || quotedUrlMatch[2];
  }
  
  // Use fallback URL if no URL found in instruction
  let apiUrl = fallbackUrl;
  if (apiUrl && !apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
    apiUrl = 'https://' + apiUrl;
  }
  return apiUrl;
}

export interface APITestInstruction {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  headers?: Record<string, string>;
  body?: any;
  assertions: APIAssertion[];
}

export interface APIAssertion {
  type: 'status' | 'field' | 'type' | 'count' | 'time' | 'contains';
  field?: string;
  expectedValue?: any;
  operator?: 'equals' | 'lessThan' | 'greaterThan' | 'exists' | 'type';
}

/**
 * Enhanced interface for parsed API instructions with actions and metadata
 */
export interface ParsedAPIInstruction {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  endpoint: string;
  baseUrl: string;
  headers?: Record<string, string>;
  body?: any;
  actions: InstructionAction[];
  assertions: APIAssertion[];
  requiresAuth: boolean;
  testMetadata: {
    title: string;
    description: string;
    category: 'Smoke' | 'Regression' | 'Performance' | 'Security';
  };
}

/**
 * Represents an action extracted from the instruction
 */
export interface InstructionAction {
  type: 'send_request' | 'store_response' | 'read_field' | 'verify' | 'count' | 'measure_time' | 'attach_body' | 'send_chained_request';
  description: string;
  field?: string;
  expectedValue?: any;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url?: string;
  useStoredVariable?: string; // For chained requests
}

/**
 * Parse API Testing Instructions
 * 
 * Converts natural language instructions into structured API test instructions.
 * 
 * @param instruction - User's testing instruction
 * @param url - Target URL
 * @returns Parsed API test instruction
 */
export function parseAPIInstruction(instruction: string, url: string): APITestInstruction {
  const instructionLower = instruction.toLowerCase();
  
  // Extract HTTP method
  let method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET';
  if (instructionLower.includes('send a post') || instructionLower.includes('send post')) {
    method = 'POST';
  } else if (instructionLower.includes('send a put') || instructionLower.includes('send put')) {
    method = 'PUT';
  } else if (instructionLower.includes('send a patch') || instructionLower.includes('send patch')) {
    method = 'PATCH';
  } else if (instructionLower.includes('send a delete') || instructionLower.includes('send delete')) {
    method = 'DELETE';
  } else if (instructionLower.includes('send a get') || instructionLower.includes('send get')) {
    method = 'GET';
  }
  
  // Extract URL from instruction or use provided URL
  // Priority: URL in instruction (if it's actually a URL) > provided url parameter
  let apiUrl = url;
  
  // Look for URLs in quotes - but only match actual URLs (containing http:// or https:// or domain patterns)
  // This prevents matching field names like "street" or "city"
  const urlPatterns = [
    /"(https?:\/\/[^"]+)"/,  // Match "https://..." or "http://..."
    /"([a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\/[^"]*)"/, // Match "domain.com/path" (must have path)
  ];
  
  for (const pattern of urlPatterns) {
    const urlMatch = instruction.match(pattern);
    if (urlMatch && urlMatch[1]) {
      // Only use this if it looks like a URL (has dots or slashes)
      const matched = urlMatch[1];
      if (matched.includes('.') || matched.includes('/')) {
        apiUrl = matched;
        break;
      }
    }
  }
  
  // Ensure URL is complete
  if (apiUrl && !apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
    apiUrl = 'https://' + apiUrl;
  }
  
  // Parse assertions from instruction
  const assertions: APIAssertion[] = [];
  
  // Status code assertion
  if (instructionLower.includes('status code')) {
    const statusMatch = instruction.match(/status code.*?(\d{3})/i);
    if (statusMatch) {
      assertions.push({
        type: 'status',
        expectedValue: parseInt(statusMatch[1]),
        operator: 'equals'
      });
    } else {
      // Default to 200 for GET, 201 for POST
      assertions.push({
        type: 'status',
        expectedValue: method === 'POST' ? 201 : 200,
        operator: 'equals'
      });
    }
  }
  
  // Store response body
  if (instructionLower.includes('store') && instructionLower.includes('response body')) {
    assertions.push({
      type: 'field',
      field: 'body',
      operator: 'exists'
    });
  }
  
  // Count objects/items
  if (instructionLower.includes('count')) {
    assertions.push({
      type: 'count',
      operator: 'greaterThan',
      expectedValue: 0
    });
  }
  
  // Field existence checks
  const fieldMatches = instruction.match(/read ["']?(\w+)["']? field/gi);
  if (fieldMatches) {
    fieldMatches.forEach(match => {
      const fieldName = match.match(/read ["']?(\w+)["']? field/i)?.[1];
      if (fieldName) {
        assertions.push({
          type: 'field',
          field: fieldName,
          operator: 'exists'
        });
      }
    });
  }
  
  // Type checks
  const typeMatches = instruction.match(/(\w+) (?:value )?type is (\w+)/gi);
  if (typeMatches) {
    typeMatches.forEach(match => {
      const parts = match.match(/(\w+) (?:value )?type is (\w+)/i);
      if (parts) {
        assertions.push({
          type: 'type',
          field: parts[1],
          expectedValue: parts[2],
          operator: 'type'
        });
      }
    });
  }
  
  // Response time check
  if (instructionLower.includes('response time')) {
    const timeMatch = instruction.match(/response time.*?(\d+)\s*ms/i);
    assertions.push({
      type: 'time',
      expectedValue: timeMatch ? parseInt(timeMatch[1]) : 1000,
      operator: 'lessThan'
    });
  }
  
  return {
    method,
    url: apiUrl,
    assertions
  };
}

/**
 * Enhanced API Instruction Parser with Actions and Metadata
 * 
 * Extracts ordered actions, authentication requirements, and test metadata
 * from natural language instructions.
 * 
 * @param instruction - User's testing instruction
 * @param url - Target URL
 * @returns Enhanced parsed API instruction with actions and metadata
 */
export function parseAPIInstructionEnhanced(instruction: string, url: string): ParsedAPIInstruction {
  const instructionLower = instruction.toLowerCase();
  
  // Extract HTTP method
  let method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET';
  if (instructionLower.includes('send a post') || instructionLower.includes('send post')) {
    method = 'POST';
  } else if (instructionLower.includes('send a put') || instructionLower.includes('send put')) {
    method = 'PUT';
  } else if (instructionLower.includes('send a patch') || instructionLower.includes('send patch')) {
    method = 'PATCH';
  } else if (instructionLower.includes('send a delete') || instructionLower.includes('send delete')) {
    method = 'DELETE';
  } else if (instructionLower.includes('send a get') || instructionLower.includes('send get')) {
    method = 'GET';
  }
  
  // Extract URL from instruction or use provided URL
  // Priority: URL in instruction (if it's actually a URL) > provided url parameter
  let apiUrl = url;
  
  // Look for URLs in quotes - but only match actual URLs (containing http:// or https:// or domain patterns)
  // This prevents matching field names like "street" or "city"
  const urlPatterns = [
    /"(https?:\/\/[^"]+)"/,  // Match "https://..." or "http://..."
    /"([a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\/[^"]*)"/, // Match "domain.com/path" (must have path)
  ];
  
  for (const pattern of urlPatterns) {
    const urlMatch = instruction.match(pattern);
    if (urlMatch && urlMatch[1]) {
      // Only use this if it looks like a URL (has dots or slashes)
      const matched = urlMatch[1];
      if (matched.includes('.') || matched.includes('/')) {
        apiUrl = matched;
        break;
      }
    }
  }
  
  // Ensure URL is complete
  if (apiUrl && !apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
    apiUrl = 'https://' + apiUrl;
  }
  
  // Extract endpoint and base URL
  let endpoint = '';
  let baseUrl = '';
  try {
    const urlObj = new URL(apiUrl);
    baseUrl = `${urlObj.protocol}//${urlObj.host}`;
    endpoint = urlObj.pathname;
  } catch (e) {
    baseUrl = apiUrl;
    endpoint = '/';
  }
  
  // TASK 1.1: Extract ordered actions from instruction
  const actions: InstructionAction[] = extractActionsFromInstruction(instruction, method, apiUrl);
  
  // Parse assertions from instruction
  const assertions: APIAssertion[] = [];
  
  // Status code assertion - only add if there's an EXPECTATION, not just an action
  // Look for patterns like:
  // - "Response status code equals X"
  // - "Expected output: status code equals X"
  // - "Verify/Check/Expect status code"
  // - "Status code should be/must be X"
  // 
  // Do NOT add assertion for action-only patterns like:
  // - "Store the response status code"
  // - "Read the status code"
  
  const hasStatusExpectation = 
    /(?:response\s+)?status\s+code\s+(?:equals|is|should\s+be|must\s+be)\s+(\d{3})/i.test(instruction) ||
    /expected\s+output.*status\s+code.*(\d{3})/i.test(instruction) ||
    /verify.*status.*code/i.test(instruction) ||
    /check.*status.*code/i.test(instruction) ||
    /expect.*status.*code/i.test(instruction) ||
    /assert.*status.*code/i.test(instruction);
  
  if (hasStatusExpectation) {
    // Try to extract specific status code from expectation
    const statusMatch = instruction.match(/(?:response\s+)?status\s+code\s+(?:equals|is|should\s+be|must\s+be)\s+(\d{3})/i) ||
                       instruction.match(/expected\s+output.*status\s+code.*?(\d{3})/i);
    
    if (statusMatch) {
      assertions.push({
        type: 'status',
        expectedValue: parseInt(statusMatch[1]),
        operator: 'equals'
      });
    } else {
      // If verification is requested but no specific code, default to 200/201
      assertions.push({
        type: 'status',
        expectedValue: method === 'POST' ? 201 : 200,
        operator: 'equals'
      });
    }
  }
  
  // Field value expectations - only add assertions for EXPECTED values, not just "read" actions
  // Look for patterns like:
  // - "id value equals 1"
  // - "title value is a non-empty string"
  // - "userId value is a number"
  // - "Expected output: id equals 1"
  //
  // Do NOT add assertions for action-only patterns like:
  // - "Read the value of id"
  // - "Store the id value"
  
  // Field value equals expectations
  const fieldValueMatches = instruction.match(/(\w+)\s+value\s+(?:equals|is)\s+(.+?)(?:\n|$|Expected)/gi);
  if (fieldValueMatches) {
    fieldValueMatches.forEach(match => {
      const parts = match.match(/(\w+)\s+value\s+(?:equals|is)\s+(.+?)(?:\n|$|Expected)/i);
      if (parts) {
        const fieldName = parts[1];
        const expectedValue = parts[2].trim();
        
        // Check if it's a type check (e.g., "is a number", "is a string")
        if (/^a\s+(number|string|boolean|object|array)/i.test(expectedValue)) {
          const typeMatch = expectedValue.match(/^a\s+(number|string|boolean|object|array)/i);
          if (typeMatch) {
            assertions.push({
              type: 'type',
              field: fieldName,
              expectedValue: typeMatch[1].toLowerCase(),
              operator: 'type'
            });
          }
        } else {
          // It's a value check
          assertions.push({
            type: 'field',
            field: fieldName,
            expectedValue: expectedValue.replace(/['"]/g, ''),
            operator: 'equals'
          });
        }
      }
    });
  }
  
  // Type checks - explicit "type is" pattern
  const typeMatches = instruction.match(/(\w+)\s+(?:value\s+)?type\s+is\s+(\w+)/gi);
  if (typeMatches) {
    typeMatches.forEach(match => {
      const parts = match.match(/(\w+)\s+(?:value\s+)?type\s+is\s+(\w+)/i);
      if (parts) {
        assertions.push({
          type: 'type',
          field: parts[1],
          expectedValue: parts[2].toLowerCase(),
          operator: 'type'
        });
      }
    });
  }
  
  // Field existence expectations - "field exists" or "field value exists"
  const existsMatches = instruction.match(/(\w+)\s+(?:value\s+)?exists/gi);
  if (existsMatches) {
    existsMatches.forEach(match => {
      const parts = match.match(/(\w+)\s+(?:value\s+)?exists/i);
      if (parts) {
        assertions.push({
          type: 'field',
          field: parts[1],
          operator: 'exists'
        });
      }
    });
  }
  
  // Count expectations - only if there's an expected count
  // "Response body contains more than 0 objects"
  // "Count the number of objects" + "Expected output: more than 0"
  const countExpectation = 
    /(?:contains|has)\s+more\s+than\s+(\d+)\s+(?:objects|items)/i.test(instruction) ||
    /expected\s+output.*more\s+than\s+(\d+)/i.test(instruction);
  
  if (countExpectation) {
    const countMatch = instruction.match(/more\s+than\s+(\d+)/i);
    assertions.push({
      type: 'count',
      operator: 'greaterThan',
      expectedValue: countMatch ? parseInt(countMatch[1]) : 0
    });
  }
  
  // Response time check
  if (instructionLower.includes('response time') || instructionLower.includes('measure time')) {
    const timeMatch = instruction.match(/response time.*?(\d+)\s*ms/i) ||
                     instruction.match(/less\s+than\s+(\d+)\s*(?:milliseconds|ms)/i);
    assertions.push({
      type: 'time',
      expectedValue: timeMatch ? parseInt(timeMatch[1]) : 1000,
      operator: 'lessThan'
    });
  }
  
  // TASK 1.2: Detect authentication requirements
  const requiresAuth = detectAuthenticationRequirement(instruction);
  
  // TASK 1.3: Extract test metadata
  const testMetadata = extractTestMetadata(instruction, method, endpoint);
  
  return {
    method,
    url: apiUrl,
    endpoint,
    baseUrl,
    actions,
    assertions,
    requiresAuth,
    testMetadata
  };
}

import { parseInstructionSemantic, parseExpectedOutput } from './semanticInstructionParser';

/**
 * Extract ordered actions from instruction
 * 
 * Uses semantic understanding to parse instructions flexibly.
 * Falls back to pattern matching if semantic parsing has low confidence.
 * Also parses "Expected Output" section to generate verify actions.
 * 
 * @param instruction - User's testing instruction
 * @param method - HTTP method
 * @param url - Target URL
 * @returns Array of ordered actions
 */
function extractActionsFromInstruction(
  instruction: string,
  method: string,
  url: string
): InstructionAction[] {
  // Try semantic parsing first (handles varied phrasings)
  try {
    const semanticActions = parseInstructionSemantic(instruction, method, url);
    
    // Parse expected output section for verify actions
    const verifyActions = parseExpectedOutput(instruction);
    
    // Combine actions: semantic actions first, then verify actions
    const allActions = [...semanticActions, ...verifyActions];
    
    // If we got good results, use them
    if (allActions.length > 0) {
      console.log('[InstructionParser] Using semantic parsing');
      return allActions;
    }
  } catch (error) {
    console.warn('[InstructionParser] Semantic parsing failed, falling back to pattern matching:', error);
  }
  
  // Fall back to pattern matching for backward compatibility
  console.log('[InstructionParser] Using pattern matching fallback');
  return extractActionsFromInstructionPatternBased(instruction, method, url);
}

/**
 * Pattern-based action extraction (fallback)
 * 
 * Original pattern-matching implementation for backward compatibility.
 */
function extractActionsFromInstructionPatternBased(
  instruction: string,
  method: string,
  url: string
): InstructionAction[] {
  const actions: InstructionAction[] = [];
  const lines = instruction.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  for (const line of lines) {
    const lineLower = line.toLowerCase();
    
    // Parse "Send GET/POST/etc request" → action type: send_request
    if (lineLower.includes('send') && (
      lineLower.includes('get') || 
      lineLower.includes('post') || 
      lineLower.includes('put') || 
      lineLower.includes('patch') || 
      lineLower.includes('delete') ||
      lineLower.includes('request')
    )) {
      actions.push({
        type: 'send_request',
        description: `Send ${method} request to ${url}`
      });
    }
    
    // Parse "Store response status code" → action type: store_response
    else if (lineLower.includes('store') && lineLower.includes('status')) {
      actions.push({
        type: 'store_response',
        description: 'Store response status code',
        field: 'statusCode'
      });
    }
    
    // Parse "Store response headers" → action type: store_response
    else if (lineLower.includes('store') && lineLower.includes('header')) {
      actions.push({
        type: 'store_response',
        description: 'Store response headers',
        field: 'headers'
      });
    }
    
    // Parse "Store response body as a list" or "Store response body" → action type: store_response
    else if (lineLower.includes('store') && lineLower.includes('body')) {
      const description = lineLower.includes('as a list') || lineLower.includes('as list')
        ? 'Store response body as a list'
        : 'Store response body';
      actions.push({
        type: 'store_response',
        description,
        field: 'body'
      });
    }
    
    // Parse "Read value of [header] header" → action type: read_field (for headers)
    else if (lineLower.includes('read') && lineLower.includes('header')) {
      // Extract header name
      const headerMatch = line.match(/read (?:value of )?["']?([a-zA-Z-]+)["']? header/i);
      if (headerMatch) {
        const headerName = headerMatch[1];
        actions.push({
          type: 'read_field',
          description: `Read value of ${headerName} header`,
          field: headerName
        });
      }
    }
    
    // Parse "Read [field] value/field from each [object]" → action type: read_field (with iteration)
    // Handles patterns like: "Read the 'postId' value from each comment object"
    else if ((lineLower.includes('read') && (lineLower.includes('value') || lineLower.includes('field'))) && 
             (lineLower.includes('from each') || lineLower.includes('from every'))) {
      // Extract field name - handle quotes and various patterns
      const fieldMatch = line.match(/read (?:the )?["']?(\w+)["']? (?:value|field)/i);
      if (fieldMatch) {
        const fieldName = fieldMatch[1];
        // Extract what we're iterating over
        const iterateMatch = line.match(/from (?:each|every) (\w+)/i);
        const iterateOver = iterateMatch ? iterateMatch[1] : 'object';
        actions.push({
          type: 'read_field',
          description: `Read "${fieldName}" value from each ${iterateOver}`,
          field: fieldName
        });
      }
    }
    
    // Parse "Read [field] value/field" → action type: read_field (single)
    else if (lineLower.includes('read') && (lineLower.includes('value') || lineLower.includes('field'))) {
      // Extract field name - handle quotes and various patterns
      const fieldMatch = line.match(/read (?:the )?["']?(\w+)["']? (?:value|field)/i);
      if (fieldMatch) {
        const fieldName = fieldMatch[1];
        actions.push({
          type: 'read_field',
          description: `Read "${fieldName}" value from response body`,
          field: fieldName
        });
      }
    }
    
    // Parse "Count the number of [items]" → action type: count
    else if (lineLower.includes('count')) {
      // Extract what we're counting
      const countMatch = line.match(/count (?:the )?(?:number of )?(\w+(?: \w+)*)/i);
      const countWhat = countMatch ? countMatch[1] : 'objects';
      actions.push({
        type: 'count',
        description: `Count the number of ${countWhat} in the list`
      });
    }
    
    // Parse "Verify [assertion]" → action type: verify
    else if (lineLower.includes('verify') || lineLower.includes('expect') || lineLower.includes('check')) {
      // Extract what is being verified
      let verifyDescription = line;
      
      // Check for specific verification patterns
      if (lineLower.includes('status code')) {
        const statusMatch = line.match(/(\d{3})/);
        const expectedStatus = statusMatch ? statusMatch[1] : '200';
        actions.push({
          type: 'verify',
          description: `Verify status code equals ${expectedStatus}`,
          field: 'statusCode',
          expectedValue: parseInt(expectedStatus)
        });
      } else if (lineLower.includes('type is')) {
        const typeMatch = line.match(/(\w+) (?:value )?type is (\w+)/i);
        if (typeMatch) {
          actions.push({
            type: 'verify',
            description: `Verify ${typeMatch[1]} type is ${typeMatch[2]}`,
            field: typeMatch[1],
            expectedValue: typeMatch[2]
          });
        }
      } else {
        actions.push({
          type: 'verify',
          description: verifyDescription
        });
      }
    }
    
    // Parse "Measure response time" → action type: measure_time
    else if (lineLower.includes('measure') && lineLower.includes('time')) {
      actions.push({
        type: 'measure_time',
        description: 'Measure response time'
      });
    }
  }
  
  return actions;
}

/**
 * Detect authentication requirement from instruction
 * 
 * Checks for keywords indicating authentication is needed:
 * - "with authentication"
 * - "with token"
 * - "Bearer token"
 * - "authenticated"
 * 
 * @param instruction - User's testing instruction
 * @returns True if authentication is required
 */
function detectAuthenticationRequirement(instruction: string): boolean {
  const instructionLower = instruction.toLowerCase();
  
  const authKeywords = [
    'with authentication',
    'with token',
    'bearer token',
    'authenticated',
    'auth token',
    'authorization',
    'with auth'
  ];
  
  return authKeywords.some(keyword => instructionLower.includes(keyword));
}

/**
 * Extract test metadata from instruction
 * 
 * Generates title, description, and category based on instruction content.
 * 
 * @param instruction - User's testing instruction
 * @param method - HTTP method
 * @param endpoint - API endpoint
 * @returns Test metadata object
 */
function extractTestMetadata(
  instruction: string,
  method: string,
  endpoint: string
): { title: string; description: string; category: 'Smoke' | 'Regression' | 'Performance' | 'Security' } {
  const instructionLower = instruction.toLowerCase();
  
  // Generate title from method and endpoint
  const title = `${method} ${endpoint}`;
  
  // Generate description from instruction summary
  const firstLine = instruction.split('\n')[0].trim();
  const description = firstLine || `Test ${method} request to ${endpoint}`;
  
  // Determine category based on instruction keywords
  let category: 'Smoke' | 'Regression' | 'Performance' | 'Security' = 'Smoke';
  
  if (instructionLower.includes('performance') || 
      instructionLower.includes('response time') || 
      instructionLower.includes('measure time')) {
    category = 'Performance';
  } else if (instructionLower.includes('error') || 
             instructionLower.includes('validation') || 
             instructionLower.includes('invalid') ||
             instructionLower.includes('fail')) {
    category = 'Regression';
  } else if (instructionLower.includes('security') || 
             instructionLower.includes('authentication') || 
             instructionLower.includes('authorization') ||
             instructionLower.includes('token')) {
    category = 'Security';
  }
  
  return {
    title,
    description,
    category
  };
}

/**
 * Generate Playwright API Test Code from Parsed Actions
 * 
 * Creates executable Playwright test code from parsed instructions with actions.
 * Generates code that matches instruction order and includes only assertions
 * mentioned in the instruction.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 * 
 * @param parsedInstruction - Enhanced parsed API instruction with actions
 * @param testName - Name for the test
 * @returns Executable Playwright test code
 */
export function generatePlaywrightAPICodeFromActions(
  parsedInstruction: ParsedAPIInstruction,
  testName: string = 'api-test'
): string {
  const { method, url, headers, body, actions, assertions } = parsedInstruction;
  
  // Sanitize test name
  const sanitizedName = testName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  let code = `import { test, expect } from '@playwright/test';

/**
 * ${method} ${url}
 * 
 * API Test - ${testName}
 */
test('${sanitizedName}', async ({ request }) => {
  console.log('🚀 Starting API test: ${method} ${url}');
  
`;

  let stepNumber = 1;
  let hasRequest = false;
  let hasStatusStore = false;
  let hasBodyStore = false;
  let hasTimeStart = false;
  
  // Generate code based on actions in order
  for (const action of actions) {
    switch (action.type) {
      case 'send_request':
        if (!hasRequest) {
          code += `  // ═══════════════════════════════════════════════════════════
  // STEP ${stepNumber}: SEND ${method} REQUEST
  // ═══════════════════════════════════════════════════════════
  console.log('📋 Step ${stepNumber}: ${action.description}');
  
`;
          
          // Start timing if measure_time action exists
          if (actions.some(a => a.type === 'measure_time')) {
            code += `  const startTime = Date.now();
  
`;
            hasTimeStart = true;
          }
          
          // Build request body from attach_body actions OR from send_request with title (only for POST/PUT/PATCH)
          const bodyActions = actions.filter(a => a.type === 'attach_body');
          let requestBody: any = body || {};
          const shouldIncludeBody = ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase());
          
          // Check if send_request action has title/content
          if (shouldIncludeBody && action.field && action.expectedValue) {
            requestBody[action.field] = action.expectedValue;
          }
          
          if ((bodyActions.length > 0 || (action.field && action.expectedValue)) && shouldIncludeBody) {
            code += `  // Build request body\n`;
            code += `  const requestBody = {\n`;
            
            // Add fields from send_request action (like title)
            if (action.field && action.expectedValue) {
              const fieldName = action.field;
              const fieldValue = action.expectedValue;
              
              // Format value based on type
              let formattedValue: string;
              if (typeof fieldValue === 'string') {
                formattedValue = `"${fieldValue}"`;
              } else if (typeof fieldValue === 'number' || typeof fieldValue === 'boolean') {
                formattedValue = String(fieldValue);
              } else if (fieldValue === null) {
                formattedValue = 'null';
              } else {
                formattedValue = JSON.stringify(fieldValue);
              }
              
              code += `    ${fieldName}: ${formattedValue}`;
              if (bodyActions.length > 0) {
                code += ',';
              }
              code += `\n`;
            }
            
            // Add fields from attach_body actions
            bodyActions.forEach((bodyAction, index) => {
              const fieldName = bodyAction.field || 'field';
              const fieldValue = bodyAction.expectedValue;
              
              // Format value based on type
              let formattedValue: string;
              if (typeof fieldValue === 'string') {
                formattedValue = `"${fieldValue}"`;
              } else if (typeof fieldValue === 'number' || typeof fieldValue === 'boolean') {
                formattedValue = String(fieldValue);
              } else if (fieldValue === null) {
                formattedValue = 'null';
              } else {
                formattedValue = JSON.stringify(fieldValue);
              }
              
              code += `    ${fieldName}: ${formattedValue}`;
              if (index < bodyActions.length - 1) {
                code += ',';
              }
              code += `\n`;
              
              // Add to requestBody object for later use
              requestBody[fieldName] = fieldValue;
            });
            code += `  };\n`;
            code += `  console.log('✅ Request body prepared:', requestBody);\n\n`;
          }
          
          // Generate request code based on method
          const methodLower = method.toLowerCase();
          code += `  const response = await request.${methodLower}('${url}'`;
          
          // Add options if headers or body exist (only add body for POST/PUT/PATCH)
          if (headers || (shouldIncludeBody && ((bodyActions.length > 0) || (action.field && action.expectedValue) || body))) {
            code += `, {\n`;
            if (headers) {
              code += `    headers: ${JSON.stringify(headers, null, 4)},\n`;
            }
            if (shouldIncludeBody) {
              if (bodyActions.length > 0 || (action.field && action.expectedValue)) {
                code += `    data: requestBody,\n`;
              } else if (body) {
                code += `    data: ${JSON.stringify(body, null, 4)},\n`;
              }
            }
            code += `  }`;
          }
          
          code += `);\n`;
          code += `  console.log('✅ Request sent successfully');
  
`;
          hasRequest = true;
          stepNumber++;
        }
        break;
      
      case 'send_chained_request':
        // Generate chained request (like GET using stored ID)
        code += `  // ═══════════════════════════════════════════════════════════
  // STEP ${stepNumber}: SEND ${action.method} REQUEST USING STORED ${action.useStoredVariable?.toUpperCase()}
  // ═══════════════════════════════════════════════════════════
  console.log('📋 Step ${stepNumber}: ${action.description}');
  
`;
        
        // Build URL with stored variable
        const baseUrl = action.url || url;
        const methodLower = (action.method || 'GET').toLowerCase();
        const storedVar = action.useStoredVariable || 'Id';
        
        code += `  const ${methodLower}Response = await request.${methodLower}(\`${baseUrl}/\${storedId}\`);\n`;
        code += `  console.log('✅ ${action.method} request sent successfully using stored ${action.useStoredVariable}');\n\n`;
        
        stepNumber++;
        break;
      
      case 'store_response':
        if (action.field === 'statusCode') {
          // Check if this is for a GET response (chained request)
          const hasChainedRequest = actions.some(a => a.type === 'send_chained_request');
          const actionIndex = actions.indexOf(action);
          const chainedRequestIndex = actions.findIndex(a => a.type === 'send_chained_request');
          const isAfterChainedRequest = hasChainedRequest && actionIndex > chainedRequestIndex;
          
          if (isAfterChainedRequest) {
            // This is storing GET response status code
            code += `  // ═══════════════════════════════════════════════════════════
  // STEP ${stepNumber}: STORE GET RESPONSE STATUS CODE
  // ═══════════════════════════════════════════════════════════
  console.log('📋 Step ${stepNumber}: ${action.description}');
  
  const getStatusCode = getResponse.status();
  console.log(\`✅ GET Status Code: \${getStatusCode}\`);
  
`;
            stepNumber++;
          } else if (!hasStatusStore) {
            // This is storing POST response status code
            code += `  // ═══════════════════════════════════════════════════════════
  // STEP ${stepNumber}: STORE RESPONSE STATUS CODE
  // ═══════════════════════════════════════════════════════════
  console.log('📋 Step ${stepNumber}: ${action.description}');
  
  const statusCode = response.status();
  console.log(\`✅ Status Code: \${statusCode}\`);
  
`;
            hasStatusStore = true;
            stepNumber++;
          }
        } else if (action.field === 'headers') {
          code += `  // ═══════════════════════════════════════════════════════════
  // STEP ${stepNumber}: STORE RESPONSE HEADERS
  // ═══════════════════════════════════════════════════════════
  console.log('📋 Step ${stepNumber}: ${action.description}');
  
  const responseHeaders = response.headers();
  console.log('✅ Response Headers Retrieved');
  
`;
          stepNumber++;
        } else if (action.field === 'body' && !hasBodyStore) {
          code += `  // ═══════════════════════════════════════════════════════════
  // STEP ${stepNumber}: STORE RESPONSE BODY
  // ═══════════════════════════════════════════════════════════
  console.log('📋 Step ${stepNumber}: ${action.description}');
  
  const responseBody = await response.json();
  console.log('✅ Response Body Retrieved');
  
`;
          hasBodyStore = true;
          stepNumber++;
        }
        break;
      
      case 'read_field':
        // Check if this is reading a header value
        if (action.description && action.description.toLowerCase().includes('header')) {
          code += `  // ═══════════════════════════════════════════════════════════
  // STEP ${stepNumber}: READ HEADER '${action.field}'
  // ═══════════════════════════════════════════════════════════
  console.log('📋 Step ${stepNumber}: ${action.description}');
  
  const ${action.field || 'unknown'}Header = response.headers()['${(action.field || 'unknown').toLowerCase()}'];
  console.log(\`✅ Header '${action.field || 'unknown'}' value: \${${action.field || 'unknown'}Header}\`);
  
`;
          stepNumber++;
        }
        // Check if this is an iteration pattern ("from each")
        else if (action.description && action.description.toLowerCase().includes('from each')) {
          // Ensure body is stored before reading fields
          if (!hasBodyStore) {
            code += `  // Store response body for field reading
  const responseBody = await response.json();
  
`;
            hasBodyStore = true;
          }
          
          code += `  // ═══════════════════════════════════════════════════════════
  // STEP ${stepNumber}: READ FIELD '${action.field}' FROM EACH OBJECT
  // ═══════════════════════════════════════════════════════════
  console.log('📋 Step ${stepNumber}: ${action.description}');
  
  const ${action.field}Values: any[] = [];
  if (Array.isArray(responseBody)) {
    responseBody.forEach((item, index) => {
      if (item.${action.field} !== undefined) {
        ${action.field}Values.push(item.${action.field});
        console.log(\`  → Item \${index + 1}: ${action.field} = \${item.${action.field}}\`);
      }
    });
  }
  console.log(\`✅ Extracted \${${action.field}Values.length} '${action.field}' values\`);
  
`;
          stepNumber++;
        } else {
          // Ensure body is stored before reading fields
          if (!hasBodyStore) {
            code += `  // Store response body for field reading
  const responseBody = await response.json();
  
`;
            hasBodyStore = true;
          }
          
          // Check if this is nested field access (e.g., "address.street")
          const fieldPath = action.field || 'field';
          const isNested = fieldPath.includes('.');
          
          // Check if this is storing an ID for later use in chained requests
          const isStoringId = fieldPath.toLowerCase() === 'id' && 
                             (action.description?.toLowerCase().includes('store') || 
                              actions.some(a => a.type === 'send_chained_request'));
          
          if (isNested) {
            const parts = fieldPath.split('.');
            const varName = parts.join('_'); // e.g., "address_street"
            const accessPath = parts.map(p => `['${p}']`).join(''); // e.g., "['address']['street']"
            
            code += `  // ═══════════════════════════════════════════════════════════
  // STEP ${stepNumber}: READ FIELD '${fieldPath}'
  // ═══════════════════════════════════════════════════════════
  console.log('📋 Step ${stepNumber}: ${action.description}');
  
  const ${varName} = responseBody${accessPath};
  console.log(\`✅ Field '${fieldPath}' value: \${${varName}}\`);
  
`;
          } else if (isStoringId) {
            // Special handling for ID storage for chained requests
            code += `  // ═══════════════════════════════════════════════════════════
  // STEP ${stepNumber}: STORE ID FOR CHAINED REQUEST
  // ═══════════════════════════════════════════════════════════
  console.log('📋 Step ${stepNumber}: ${action.description}');
  
  const storedId = responseBody.${fieldPath};
  console.log(\`✅ Stored ID for chained request: \${storedId}\`);
  
`;
          } else {
            code += `  // ═══════════════════════════════════════════════════════════
  // STEP ${stepNumber}: READ FIELD '${fieldPath}'
  // ═══════════════════════════════════════════════════════════
  console.log('📋 Step ${stepNumber}: ${action.description}');
  
  const ${fieldPath}Value = responseBody.${fieldPath};
  console.log(\`✅ Field '${fieldPath}' value: \${${fieldPath}Value}\`);
  
`;
          }
          stepNumber++;
        }
        break;
      
      case 'count':
        // Ensure body is stored before counting
        if (!hasBodyStore) {
          code += `  // Store response body for counting
  const responseBody = await response.json();
  
`;
          hasBodyStore = true;
        }
        
        code += `  // ═══════════════════════════════════════════════════════════
  // STEP ${stepNumber}: COUNT OBJECTS
  // ═══════════════════════════════════════════════════════════
  console.log('📋 Step ${stepNumber}: ${action.description}');
  
  let itemCount = 0;
  if (Array.isArray(responseBody)) {
    itemCount = responseBody.length;
    console.log(\`✅ Found \${itemCount} items in the array\`);
  } else if (typeof responseBody === 'object' && responseBody !== null) {
    itemCount = Object.keys(responseBody).length;
    console.log(\`✅ Found \${itemCount} properties in the object\`);
  }
  console.log(\`✅ Item count: \${itemCount}\`);
  
`;
        stepNumber++;
        break;
      
      case 'measure_time':
        if (hasTimeStart) {
          code += `  // ═══════════════════════════════════════════════════════════
  // STEP ${stepNumber}: MEASURE RESPONSE TIME
  // ═══════════════════════════════════════════════════════════
  console.log('📋 Step ${stepNumber}: ${action.description}');
  
  const responseTime = Date.now() - startTime;
  console.log(\`✅ Response Time: \${responseTime} ms\`);
  
`;
          stepNumber++;
        }
        break;
      
      case 'attach_body':
        // Generate individual step for each attach_body action
        code += `  // ═══════════════════════════════════════════════════════════
  // STEP ${stepNumber}: ATTACH REQUEST BODY FIELD
  // ═══════════════════════════════════════════════════════════
  console.log('📋 Step ${stepNumber}: ${action.description}');
  
  // This step prepares field: ${action.field} = ${action.expectedValue}
  console.log('✅ Field "${action.field}" prepared for request body');
  
`;
        stepNumber++;
        break;
      
      case 'verify':
        // Generate verification/assertion code
        // Ensure body is stored before verifying fields
        if (action.field && action.field !== 'statusCode' && !hasBodyStore) {
          code += `  // Store response body for verification
  const responseBody = await response.json();
  
`;
          hasBodyStore = true;
        }
        
        // Ensure status code is stored if verifying status
        if (action.field === 'statusCode' && !hasStatusStore) {
          code += `  // Store status code for verification
  const statusCode = response.status();
  
`;
          hasStatusStore = true;
        }
        
        code += `  // ═══════════════════════════════════════════════════════════
  // STEP ${stepNumber}: VERIFY ${action.field || 'ASSERTION'}
  // ═══════════════════════════════════════════════════════════
  console.log('📋 Step ${stepNumber}: ${action.description}');
  
`;
        
        if (action.field === 'statusCode') {
          // Status code verification
          code += `  expect(statusCode).toBe(${action.expectedValue});
  console.log(\`✅ Status code is ${action.expectedValue}\`);
  
`;
        } else if (action.expectedValue === 'does_not_exist') {
          // Field should NOT exist (negative assertion)
          const fieldPath = action.field || 'field';
          const isNested = fieldPath.includes('.');
          
          if (isNested) {
            const parts = fieldPath.split('.');
            const varName = parts.join('_');
            const accessPath = parts.map(p => `['${p}']`).join('');
            
            code += `  const ${varName} = responseBody${accessPath};
  expect(${varName}).toBeUndefined();
  console.log(\`✅ Field '${fieldPath}' does not exist (as expected)\`);
  
`;
          } else {
            code += `  expect(responseBody).not.toHaveProperty('${fieldPath}');
  console.log(\`✅ Field '${fieldPath}' does not exist (as expected)\`);
  
`;
          }
        } else if (action.expectedValue === 'exists') {
          // Field existence check
          const fieldPath = action.field || 'field';
          const isNested = fieldPath.includes('.');
          
          if (isNested) {
            const parts = fieldPath.split('.');
            const varName = parts.join('_');
            const accessPath = parts.map(p => `['${p}']`).join('');
            
            code += `  const ${varName} = responseBody${accessPath};
  expect(${varName}).toBeDefined();
  console.log(\`✅ Field '${fieldPath}' exists\`);
  
`;
          } else {
            code += `  expect(responseBody).toHaveProperty('${fieldPath}');
  console.log(\`✅ Field '${fieldPath}' exists\`);
  
`;
          }
        } else if (['string', 'number', 'boolean', 'object', 'array'].includes(String(action.expectedValue).toLowerCase())) {
          // Type verification
          const fieldPath = action.field || 'field';
          const isNested = fieldPath.includes('.');
          const expectedType = String(action.expectedValue).toLowerCase();
          
          if (isNested) {
            const parts = fieldPath.split('.');
            const varName = parts.join('_');
            const accessPath = parts.map(p => `['${p}']`).join('');
            
            code += `  const ${varName} = responseBody${accessPath};
  expect(typeof ${varName}).toBe('${expectedType}');
  console.log(\`✅ Field '${fieldPath}' is a ${expectedType} (value: \${${varName}})\`);
  
`;
          } else {
            code += `  expect(typeof responseBody.${fieldPath}).toBe('${expectedType}');
  console.log(\`✅ Field '${fieldPath}' is a ${expectedType} (value: \${responseBody.${fieldPath}})\`);
  
`;
          }
        } else {
          // Value equality verification
          const fieldPath = action.field || 'field';
          const isNested = fieldPath.includes('.');
          
          if (isNested) {
            const parts = fieldPath.split('.');
            const varName = parts.join('_');
            const accessPath = parts.map(p => `['${p}']`).join('');
            
            // Format expected value
            const formattedExpected = typeof action.expectedValue === 'string' 
              ? `"${action.expectedValue}"` 
              : action.expectedValue;
            
            code += `  const ${varName} = responseBody${accessPath};
  expect(${varName}).toBe(${formattedExpected});
  console.log(\`✅ Field '${fieldPath}' equals ${formattedExpected}\`);
  
`;
          } else {
            // Format expected value
            const formattedExpected = typeof action.expectedValue === 'string' 
              ? `"${action.expectedValue}"` 
              : action.expectedValue;
            
            code += `  expect(responseBody.${fieldPath}).toBe(${formattedExpected});
  console.log(\`✅ Field '${fieldPath}' equals ${formattedExpected}\`);
  
`;
          }
        }
        
        stepNumber++;
        break;
    }
  }
  
  // Generate assertions section only if there are assertions
  if (assertions.length > 0) {
    code += `  // ═══════════════════════════════════════════════════════════
  // STEP ${stepNumber}: VERIFY ASSERTIONS
  // ═══════════════════════════════════════════════════════════
  console.log('📋 Step ${stepNumber}: Verify assertions');
  
`;
    
    let assertionNumber = 1;
    
    // Generate only the assertions mentioned in the instruction
    assertions.forEach(assertion => {
      switch (assertion.type) {
        case 'status':
          // Ensure status code is stored
          if (!hasStatusStore) {
            code += `  const statusCode = response.status();
  
`;
            hasStatusStore = true;
          }
          
          code += `  // ASSERTION ${assertionNumber}: Status code equals ${assertion.expectedValue}
  console.log('  → Expect response status code equals ${assertion.expectedValue}');
  expect(statusCode).toBe(${assertion.expectedValue});
  console.log('  ✅ Status code is ${assertion.expectedValue}');
  
`;
          assertionNumber++;
          break;
          
        case 'field':
          // Ensure body is stored
          if (!hasBodyStore) {
            code += `  const responseBody = await response.json();
  
`;
            hasBodyStore = true;
          }
          
          if (assertion.operator === 'exists') {
            if (assertion.field === 'body') {
              code += `  // ASSERTION ${assertionNumber}: Response body is not empty
  console.log('  → Expect response body is not empty');
  expect(responseBody).toBeDefined();
  expect(responseBody).not.toBeNull();
  console.log('  ✅ Response body is not empty');
  
`;
            } else {
              code += `  // ASSERTION ${assertionNumber}: Field '${assertion.field}' exists
  console.log('  → Expect field "${assertion.field}" exists');
  expect(responseBody).toHaveProperty('${assertion.field}');
  console.log('  ✅ Field "${assertion.field}" exists');
  
`;
            }
            assertionNumber++;
          }
          break;
          
        case 'type':
          // Ensure body is stored
          if (!hasBodyStore) {
            code += `  const responseBody = await response.json();
  
`;
            hasBodyStore = true;
          }
          
          code += `  // ASSERTION ${assertionNumber}: Field '${assertion.field}' type is ${assertion.expectedValue}
  console.log('  → Expect field "${assertion.field}" type is ${assertion.expectedValue}');
  expect(typeof responseBody.${assertion.field}).toBe('${assertion.expectedValue}');
  console.log('  ✅ Field "${assertion.field}" is ${assertion.expectedValue} type');
  
`;
          assertionNumber++;
          break;
          
        case 'count':
          // Ensure body is stored
          if (!hasBodyStore) {
            code += `  const responseBody = await response.json();
  
`;
            hasBodyStore = true;
          }
          
          code += `  // ASSERTION ${assertionNumber}: Count verification
  console.log('  → Expect item count is greater than ${assertion.expectedValue || 0}');
  expect(itemCount).toBeGreaterThan(${assertion.expectedValue || 0});
  console.log(\`  ✅ Item count \${itemCount} > ${assertion.expectedValue || 0}\`);
  
`;
          assertionNumber++;
          break;
          
        case 'time':
          code += `  // ASSERTION ${assertionNumber}: Response time within limit
  console.log('  → Expect response time within ${assertion.expectedValue}ms');
  expect(responseTime).toBeLessThan(${assertion.expectedValue});
  console.log(\`  ✅ Response time \${responseTime}ms < ${assertion.expectedValue}ms\`);
  
`;
          assertionNumber++;
          break;
      }
    });
    
    stepNumber++;
  }

  // Add summary
  code += `  // ═══════════════════════════════════════════════════════════
  // STEP ${stepNumber}: TEST SUMMARY
  // ═══════════════════════════════════════════════════════════
  console.log('\\n📊 Test Execution Summary:');
  console.log('  • Endpoint: ${method} ${url}');
`;

  // Add status codes for all requests with clear labels
  if (hasStatusStore) {
    code += `  console.log(\`  • POST Status Code: \${statusCode}\`);\n`;
  }
  
  // Check if there's a chained GET request
  const hasChainedRequest = actions.some(a => a.type === 'send_chained_request');
  if (hasChainedRequest) {
    code += `  console.log(\`  • GET Status Code: \${getStatusCode}\`);\n`;
  }
  
  if (hasTimeStart) {
    code += `  console.log(\`  • Response Time: \${responseTime}ms\`);\n`;
  }
  
  // Add field values to summary
  const readFieldActions = actions.filter(a => a.type === 'read_field');
  if (readFieldActions.length > 0 && hasBodyStore) {
    code += `  console.log('  • Field Values:');\n`;
    readFieldActions.forEach(action => {
      const fieldPath = action.field || 'field';
      const isNested = fieldPath.includes('.');
      
      // Check if this is a stored ID for chained requests
      const isStoredId = fieldPath.toLowerCase() === 'id' && 
                        actions.some(a => a.type === 'send_chained_request');
      
      if (isNested) {
        const parts = fieldPath.split('.');
        const varName = parts.join('_');
        code += `  console.log(\`    - ${fieldPath}: \${${varName}}\`);\n`;
      } else if (isStoredId) {
        code += `  console.log(\`    - ${fieldPath}: \${storedId}\`);\n`;
      } else {
        code += `  console.log(\`    - ${fieldPath}: \${${fieldPath}Value}\`);\n`;
      }
    });
  }
  
  code += `  console.log('  • Result: SUCCESS ✅');
  console.log('');
  console.log('🎯 EXECUTION RESULTS:');
`;

  // Add specific result messages for common scenarios
  if (hasStatusStore && hasChainedRequest) {
    code += `  console.log(\`   POST request returns status code \${statusCode}\`);
  console.log(\`   GET request returns status code \${getStatusCode}\`);
`;
  } else if (hasStatusStore) {
    code += `  console.log(\`   ${method} request returns status code \${statusCode}\`);
`;
  }
  
  // Add detailed verification results
  const verifyActions = actions.filter(a => a.type === 'verify');
  if (verifyActions.length > 0) {
    code += `  console.log('');
  console.log('📋 EXPECTED OUTCOME VERIFICATION:');
`;
    verifyActions.forEach(action => {
      const fieldPath = action.field || 'field';
      
      if (action.expectedValue === 'does_not_exist') {
        code += `  console.log('   ✅ Verified: Response body does not contain ${fieldPath} field');
`;
      } else if (action.expectedValue === 'exists') {
        code += `  console.log('   ✅ Verified: ${fieldPath} field exists in response');
`;
      } else if (['string', 'number', 'boolean', 'object', 'array'].includes(String(action.expectedValue).toLowerCase())) {
        code += `  console.log('   ✅ Verified: ${fieldPath} is a ${action.expectedValue}');
`;
      } else if (fieldPath === 'statusCode') {
        code += `  console.log('   ✅ Verified: Status code equals ${action.expectedValue}');
`;
      } else {
        code += `  console.log('   ✅ Verified: ${fieldPath} equals ${action.expectedValue}');
`;
      }
    });
  }
  
  code += `  console.log('');
  console.log('🏆 TEST OUTCOME:');
  console.log('   All expected outcomes verified successfully ✅');
  console.log('   Test demonstrates proper API behavior ✅');
  
  console.log('\\n✅ Test completed successfully');
});
`;

  return code;
}

/**
 * Generate Playwright API Test Code
 * 
 * Creates executable Playwright test code from parsed instructions.
 * 
 * @param instruction - Parsed API test instruction
 * @param testName - Name for the test
 * @returns Executable Playwright test code
 */
export function generatePlaywrightAPICode(
  instruction: APITestInstruction,
  testName: string = 'api-test'
): string {
  const { method, url, headers, body, assertions } = instruction;
  
  // Sanitize test name
  const sanitizedName = testName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  let code = `import { test, expect } from '@playwright/test';

/**
 * ${method} ${url}
 * 
 * API Test - ${testName}
 */
test('${sanitizedName}', async ({ request }) => {
  console.log('🚀 Starting API test: ${method} ${url}');
  
  // ═══════════════════════════════════════════════════════════
  // STEP 1: SEND ${method} REQUEST
  // ═══════════════════════════════════════════════════════════
  console.log('📋 Step 1: Send ${method} request to ${url}');
  
  const startTime = Date.now();
  
`;

  // Generate request code based on method
  const methodLower = method.toLowerCase();
  code += `  const response = await request.${methodLower}('${url}'`;
  
  // Add options if headers or body exist
  if (headers || body) {
    code += `, {\n`;
    if (headers) {
      code += `    headers: ${JSON.stringify(headers, null, 4)},\n`;
    }
    if (body) {
      code += `    data: ${JSON.stringify(body, null, 4)},\n`;
    }
    code += `  }`;
  }
  
  code += `);\n`;
  code += `  
  const responseTime = Date.now() - startTime;
  console.log('✅ Request sent successfully');
  
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
  console.log('✅ Response Body Retrieved');
  
  // ═══════════════════════════════════════════════════════════
  // STEP 4: MEASURE RESPONSE TIME
  // ═══════════════════════════════════════════════════════════
  console.log('📋 Step 4: Measure response time');
  console.log(\`✅ Response Time: \${responseTime} ms\`);
  
`;

  // Generate assertions
  code += `  // ═══════════════════════════════════════════════════════════
  // STEP 5: VERIFY ASSERTIONS
  // ═══════════════════════════════════════════════════════════
  console.log('📋 Step 5: Verify assertions');
  
`;

  let assertionNumber = 1;
  
  assertions.forEach(assertion => {
    switch (assertion.type) {
      case 'status':
        code += `  // ASSERTION ${assertionNumber}: Status code equals ${assertion.expectedValue}
  console.log('  → Expect response status code equals ${assertion.expectedValue}');
  expect(statusCode).toBe(${assertion.expectedValue});
  console.log('  ✅ Status code is ${assertion.expectedValue}');
  
`;
        assertionNumber++;
        break;
        
      case 'field':
        if (assertion.operator === 'exists') {
          if (assertion.field === 'body') {
            code += `  // ASSERTION ${assertionNumber}: Response body is not empty
  console.log('  → Expect response body is not empty');
  expect(responseBody).toBeDefined();
  expect(responseBody).not.toBeNull();
  console.log('  ✅ Response body is not empty');
  
`;
          } else {
            code += `  // ASSERTION ${assertionNumber}: Field '${assertion.field}' exists
  console.log('  → Expect field "${assertion.field}" exists');
  expect(responseBody).toHaveProperty('${assertion.field}');
  console.log('  ✅ Field "${assertion.field}" exists');
  
`;
          }
          assertionNumber++;
        }
        break;
        
      case 'type':
        code += `  // ASSERTION ${assertionNumber}: Field '${assertion.field}' type is ${assertion.expectedValue}
  console.log('  → Expect field "${assertion.field}" type is ${assertion.expectedValue}');
  expect(typeof responseBody.${assertion.field}).toBe('${assertion.expectedValue}');
  console.log('  ✅ Field "${assertion.field}" is ${assertion.expectedValue} type');
  
`;
        assertionNumber++;
        break;
        
      case 'count':
        code += `  // ASSERTION ${assertionNumber}: Count number of items in response
  console.log('  → Count number of items in response');
  let itemCount = 0;
  if (Array.isArray(responseBody)) {
    itemCount = responseBody.length;
  } else if (typeof responseBody === 'object' && responseBody !== null) {
    itemCount = Object.keys(responseBody).length;
  }
  console.log(\`  ✅ Item count: \${itemCount}\`);
  expect(itemCount).toBeGreaterThan(${assertion.expectedValue || 0});
  console.log('  ✅ Item count is greater than ${assertion.expectedValue || 0}');
  
`;
        assertionNumber++;
        break;
        
      case 'time':
        code += `  // ASSERTION ${assertionNumber}: Response time within limit
  console.log('  → Expect response time within ${assertion.expectedValue}ms');
  expect(responseTime).toBeLessThan(${assertion.expectedValue});
  console.log(\`  ✅ Response time \${responseTime}ms < ${assertion.expectedValue}ms\`);
  
`;
        assertionNumber++;
        break;
    }
  });

  // Add summary
  code += `  // ═══════════════════════════════════════════════════════════
  // STEP 6: TEST SUMMARY
  // ═══════════════════════════════════════════════════════════
  console.log('\\n📊 Test Execution Summary:');
  console.log('  • Endpoint: ${method} ${url}');
  console.log(\`  • Status Code: \${statusCode}\`);
  console.log(\`  • Response Time: \${responseTime}ms\`);
  console.log('  • Result: SUCCESS ✅');
  console.log('');
  console.log('🎯 EXECUTION RESULTS:');
  console.log(\`   ${method} request returns status code \${statusCode}\`);
  console.log('   All steps completed successfully ✅');
  
  console.log('\\n✅ Test completed successfully');
});
`;

  return code;
}

/**
 * Generate API Test from Natural Language
 * 
 * Main entry point that combines parsing and code generation.
 * Uses the enhanced parser to extract actions and generates code that matches
 * instruction order with only the assertions mentioned in the instruction.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 * 
 * @param instruction - Natural language testing instruction
 * @param url - Target URL
 * @param testName - Optional test name
 * @returns Executable Playwright test code
 */
export function generateAPITestFromInstruction(
  instruction: string,
  url: string,
  testName?: string
): string {
  // Parse the instruction using enhanced parser to get actions
  const parsedInstruction = parseAPIInstructionEnhanced(instruction, url);
  
  // Generate test name if not provided
  const finalTestName = testName || parsedInstruction.testMetadata.title;
  
  // Generate code using parsed actions
  return generatePlaywrightAPICodeFromActions(parsedInstruction, finalTestName);
}
