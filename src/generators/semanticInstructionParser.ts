/**
 * Semantic Instruction Parser
 * 
 * Parses API testing instructions using semantic understanding rather than exact pattern matching.
 * This allows the system to understand instructions phrased in many different ways.
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */

import type { InstructionAction } from './apiPlaywrightCodeGenerator';

/**
 * Action type keywords and their semantic variations
 */
const ACTION_SEMANTICS = {
  send_request: {
    verbs: ['send', 'make', 'execute', 'perform', 'do', 'call', 'invoke', 'issue', 'submit', 'fire', 'trigger'],
    objects: ['request', 'call', 'http', 'api'],
    methods: ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'],
    patterns: [
      /\b(send|make|execute|perform|do|call|invoke|issue|submit|fire|trigger)\b.*\b(get|post|put|patch|delete)\b.*\b(request|call)\b/i,
      /\b(get|post|put|patch|delete)\b.*\b(to|from|at|endpoint|url)\b/i,
      /\b(send|make)\b.*\b(get|post|put|patch|delete)\b/i,
    ]
  },
  
  attach_body: {
    verbs: ['attach', 'add', 'include', 'set', 'send', 'with', 'use', 'provide', 'create', 'post'],
    objects: ['body', 'data', 'payload', 'content', 'json', 'request body', 'post', 'title', 'name', 'value'],
    patterns: [
      /\b(attach|add|include|set|send|with|use|provide)\b.*\b(request\s+body|body|data|payload)\b/i,
      /\brequest\s+body\s+with\b/i,
      /\bwith\s+(request\s+)?body\b/i,
      /\bcreate.*\bwith\s+(title|name)\b/i,
      /\bpost.*\bwith\s+(title|name)\b/i,
      /\btitle\s+["']([^"']+)["']/i,
    ]
  },
  
  store_response: {
    verbs: ['store', 'save', 'capture', 'get', 'retrieve', 'fetch', 'grab', 'keep', 'hold', 'record', 'collect', 'obtain'],
    objects: ['response', 'result', 'output', 'data', 'status', 'code', 'body', 'headers', 'header', 'id', 'value'],
    patterns: [
      /\b(store|save|capture|get|retrieve|fetch|grab|keep|hold|record|collect|obtain)\b.*\b(response|result|output)\b/i,
      /\b(store|save|capture|get|retrieve|fetch|grab|keep|hold|record|collect|obtain)\b.*\b(status|code|body|headers?)\b/i,
      /\b(store|save|capture|get|retrieve|fetch|grab|keep|hold|record|collect|obtain)\b.*\b(id|value)\b.*\b(from|of)\b.*\b(response|body)\b/i,
    ]
  },
  
  read_field: {
    verbs: ['read', 'get', 'extract', 'retrieve', 'fetch', 'check', 'find', 'obtain', 'access', 'look', 'grab', 'pull', 'store'],
    objects: ['field', 'value', 'property', 'attribute', 'data', 'header', 'element', 'id', 'identifier'],
    patterns: [
      /\b(read|get|extract|retrieve|fetch|check|find|obtain|access|look|grab|pull|store)\b.*\b(value|field|property|attribute)\b/i,
      /\b(read|get|extract|retrieve|fetch|check|find|obtain|access|look|grab|pull|store)\b.*\b(of|from)\b.*\b(header|field|property|response)\b/i,
      /\b(check|verify|validate)\b.*\b(field|property|value|header)\b/i,
      /\bstore.*\bid\b.*\bvalue\b/i,
      /\bstore.*\bthe\s+id\b/i,
    ]
  },
  
  count: {
    verbs: ['count', 'tally', 'sum', 'total', 'calculate', 'determine', 'find'],
    objects: ['number', 'count', 'total', 'amount', 'quantity', 'items', 'objects', 'elements', 'entries'],
    patterns: [
      /\b(count|tally|sum|total|calculate|determine|find)\b.*\b(number|count|total|amount|quantity)\b/i,
      /\bhow\s+many\b/i,
      /\bnumber\s+of\b/i,
      /\b(count|tally)\b.*\b(items?|objects?|elements?|entries)\b/i,
    ]
  },
  
  verify: {
    verbs: ['verify', 'check', 'assert', 'validate', 'ensure', 'confirm', 'test', 'expect'],
    objects: ['status', 'code', 'value', 'field', 'response', 'result', 'type', 'equals', 'matches'],
    patterns: [
      /\b(verify|check|assert|validate|ensure|confirm|test|expect)\b/i,
      /\b(should|must|has to)\b.*\b(be|equal|match|contain)\b/i,
      /\b(equals?|matches?|contains?|includes?)\b/i,
    ]
  },
  
  measure_time: {
    verbs: ['measure', 'time', 'track', 'record', 'calculate', 'determine'],
    objects: ['time', 'duration', 'latency', 'speed', 'performance', 'response time'],
    patterns: [
      /\b(measure|time|track|record|calculate|determine)\b.*\b(time|duration|latency|speed|performance)\b/i,
      /\bresponse\s+time\b/i,
      /\bhow\s+(long|fast|quick)\b/i,
    ]
  }
};

/**
 * Field/object extraction patterns
 */
const FIELD_PATTERNS = [
  // Quoted field names: "fieldName", 'fieldName'
  /"([^"]+)"/,
  /'([^']+)'/,
  
  // Field with "of": "value of fieldName", "content of fieldName"
  /\b(?:value|content|data)\s+of\s+([a-zA-Z0-9_-]+)/i,
  
  // Field with "from": "fieldName from response"
  /\b([a-zA-Z0-9_-]+)\s+(?:from|in|of)\s+(?:response|body|result)/i,
  
  // Header patterns: "Content-Type header", "Authorization header"
  /\b([a-zA-Z0-9_-]+)\s+header\b/i,
  
  // Direct field reference: "the fieldName field"
  /\bthe\s+([a-zA-Z0-9_-]+)\s+(?:field|property|value|attribute)\b/i,
];

/**
 * HTTP method detection
 */
const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

/**
 * Parse instruction line using semantic understanding
 * 
 * @param line - Single instruction line
 * @param method - HTTP method (for context)
 * @param url - Target URL (for context)
 * @returns Parsed instruction action with confidence score
 */
export function parseInstructionLineSemantic(
  line: string,
  method: string,
  url: string
): { action: InstructionAction | null; confidence: number } {
  const lineLower = line.toLowerCase();
  
  // Try each action type and calculate confidence
  const scores: Array<{ type: keyof typeof ACTION_SEMANTICS; confidence: number }> = [];
  
  for (const [actionType, semantics] of Object.entries(ACTION_SEMANTICS)) {
    let confidence = 0;
    
    // Check verb matches
    const verbMatches = semantics.verbs.filter(verb => lineLower.includes(verb)).length;
    confidence += verbMatches * 0.3;
    
    // Check object matches
    const objectMatches = semantics.objects.filter(obj => lineLower.includes(obj)).length;
    confidence += objectMatches * 0.3;
    
    // Check pattern matches
    const patternMatches = semantics.patterns.filter(pattern => pattern.test(line)).length;
    confidence += patternMatches * 0.4;
    
    // Normalize confidence to 0-1 range
    confidence = Math.min(confidence, 1.0);
    
    if (confidence > 0) {
      scores.push({ type: actionType as keyof typeof ACTION_SEMANTICS, confidence });
    }
  }
  
  // Sort by confidence and get best match
  scores.sort((a, b) => b.confidence - a.confidence);
  
  if (scores.length === 0 || scores[0].confidence < 0.3) {
    // Low confidence - return best guess with warning
    console.warn(`[SemanticParser] Low confidence parsing: "${line}"`);
    return {
      action: {
        type: 'verify',
        description: line,
      },
      confidence: 0.2
    };
  }
  
  const bestMatch = scores[0];
  const actionType = bestMatch.type;
  
  // Extract specific details based on action type
  const action = buildActionFromType(actionType, line, method, url);
  
  return {
    action,
    confidence: bestMatch.confidence
  };
}

/**
 * Build InstructionAction from detected action type
 */
function buildActionFromType(
  actionType: string,
  line: string,
  method: string,
  url: string
): InstructionAction | null {
  const lineLower = line.toLowerCase();
  
  switch (actionType) {
    case 'send_request':
      // Check if this is a chained GET request using stored ID
      if (method.toUpperCase() === 'GET' && (lineLower.includes('using') || lineLower.includes('stored')) && lineLower.includes('id')) {
        return {
          type: 'send_chained_request',
          description: `Send ${method} request using stored ID`,
          method: method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
          url: url,
          useStoredVariable: 'id'
        };
      }
      
      // Check if this is a POST request with title/content
      if (method.toUpperCase() === 'POST' && (lineLower.includes('title') || lineLower.includes('create'))) {
        // Extract title from the line
        const titleMatch = line.match(/title\s+["']([^"']+)["']/i) || line.match(/with\s+title\s+["']([^"']+)["']/i);
        if (titleMatch) {
          return {
            type: 'send_request',
            description: `Send ${method} request to ${url} with title "${titleMatch[1]}"`,
            field: 'title',
            expectedValue: titleMatch[1]
          };
        }
      }
      
      return {
        type: 'send_request',
        description: `Send ${method} request to ${url}`
      };
    
    case 'attach_body':
      // Skip instructions that say "without" - these are negative instructions
      if (lineLower.includes('without')) {
        console.log(`[SemanticParser] Skipping negative attach instruction: "${line}"`);
        // Return null to indicate this should be completely skipped
        return null;
      }
      
      // Extract field name and value
      let bodyField = extractFieldName(line);
      let bodyValue = extractFieldValue(line);
      
      // Special handling for "create post with title" patterns
      if (lineLower.includes('create') && lineLower.includes('title')) {
        const titleMatch = line.match(/title\s+["']([^"']+)["']/i);
        if (titleMatch) {
          bodyField = 'title';
          bodyValue = titleMatch[1];
        }
      }
      // Handle "Attach request body with [field] [value]" patterns
      else if (lineLower.includes('attach') && lineLower.includes('request body') && lineLower.includes('with')) {
        const attachMatch = line.match(/attach\s+request\s+body\s+with\s+(\w+)\s+(.+)/i);
        if (attachMatch) {
          bodyField = attachMatch[1];
          bodyValue = attachMatch[2].replace(/^["']|["']$/g, ''); // Remove quotes
          
          // Parse value type
          if (/^\d+$/.test(bodyValue)) {
            bodyValue = parseInt(bodyValue);
          } else if (/^\d+\.\d+$/.test(bodyValue)) {
            bodyValue = parseFloat(bodyValue);
          } else if (bodyValue === 'true') {
            bodyValue = true;
          } else if (bodyValue === 'false') {
            bodyValue = false;
          } else if (bodyValue === 'null') {
            bodyValue = null;
          }
        }
      }
      // Handle "Attach large text value in [field] field" patterns
      else if (lineLower.includes('attach') && lineLower.includes('large') && lineLower.includes('field')) {
        const fieldMatch = line.match(/in\s+(\w+)\s+field/i);
        if (fieldMatch) {
          bodyField = fieldMatch[1];
          bodyValue = "Large text content placeholder";
        }
      }
      
      return {
        type: 'attach_body',
        description: `Attach request body with ${bodyField} ${bodyValue}`,
        field: bodyField,
        expectedValue: bodyValue
      };
    
    case 'store_response':
      // Determine what to store
      if (lineLower.includes('status') || lineLower.includes('code')) {
        return {
          type: 'store_response',
          description: 'Store response status code',
          field: 'statusCode'
        };
      } else if (lineLower.includes('header')) {
        return {
          type: 'store_response',
          description: 'Store response headers',
          field: 'headers'
        };
      } else if (lineLower.includes('id') && lineLower.includes('value')) {
        // Special case: "Store the id value" should be read_field, not store_response
        return {
          type: 'read_field',
          description: 'Store the id value from response',
          field: 'id'
        };
      } else if (lineLower.includes('body') || lineLower.includes('data') || lineLower.includes('result')) {
        const description = lineLower.includes('list') || lineLower.includes('array')
          ? 'Store response body as a list'
          : 'Store response body';
        return {
          type: 'store_response',
          description,
          field: 'body'
        };
      }
      return {
        type: 'store_response',
        description: 'Store response body',
        field: 'body'
      };
    
    case 'read_field':
      // Extract field name
      const fieldName = extractFieldName(line);
      
      // Check if it's reading from a nested object
      // Pattern: "Read X from Y" or "Read X value from Y" or "Read the X value from Y"
      const nestedMatch = line.match(/read (?:the )?["']?(\w+)["']? (?:value )?from (?:the )?["']?(\w+)["']?/i);
      
      if (nestedMatch) {
        const childField = nestedMatch[1];
        const parentObject = nestedMatch[2];
        
        // Don't treat common response-related words as parent objects
        const responseWords = ['response', 'body', 'result', 'output', 'data'];
        if (responseWords.includes(parentObject.toLowerCase())) {
          // This is just "read field from response", not nested access
          return {
            type: 'read_field',
            description: `Read "${childField}" value from response body`,
            field: childField
          };
        }
        
        // This is actual nested object access like "read street from address"
        return {
          type: 'read_field',
          description: `Read "${childField}" value from ${parentObject}`,
          field: `${parentObject}.${childField}`
        };
      }
      
      // Check if it's a header
      if (lineLower.includes('header')) {
        return {
          type: 'read_field',
          description: `Read value of ${fieldName} header`,
          field: fieldName
        };
      }
      
      // Check if it's "from each" pattern
      if (lineLower.includes('from each') || lineLower.includes('from every') || lineLower.includes('for each')) {
        const iterateMatch = line.match(/from (?:each|every) (\w+)/i);
        const iterateOver = iterateMatch ? iterateMatch[1] : 'object';
        return {
          type: 'read_field',
          description: `Read "${fieldName}" value from each ${iterateOver}`,
          field: fieldName
        };
      }
      
      // Check if it's just reading an object (not a specific field)
      if (lineLower.includes('read') && lineLower.includes('object')) {
        return {
          type: 'read_field',
          description: `Read "${fieldName}" object from response body`,
          field: fieldName
        };
      }
      
      return {
        type: 'read_field',
        description: `Read "${fieldName}" value from response body`,
        field: fieldName
      };
    
    case 'count':
      // Extract what to count
      const countMatch = line.match(/count (?:the )?(?:number of )?(\w+(?: \w+)*)/i) ||
                        line.match(/how many (\w+(?: \w+)*)/i) ||
                        line.match(/number of (\w+(?: \w+)*)/i);
      const countWhat = countMatch ? countMatch[1] : 'objects';
      
      return {
        type: 'count',
        description: `Count the number of ${countWhat} in the list`
      };
    
    case 'verify':
      // Extract verification details
      if (lineLower.includes('status') && lineLower.includes('code')) {
        const statusMatch = line.match(/(\d{3})/);
        const expectedStatus = statusMatch ? statusMatch[1] : '200';
        return {
          type: 'verify',
          description: `Verify status code equals ${expectedStatus}`,
          field: 'statusCode',
          expectedValue: parseInt(expectedStatus)
        };
      } else if (lineLower.includes('type is')) {
        const typeMatch = line.match(/(\w+) (?:value )?type is (\w+)/i);
        if (typeMatch) {
          return {
            type: 'verify',
            description: `Verify ${typeMatch[1]} type is ${typeMatch[2]}`,
            field: typeMatch[1],
            expectedValue: typeMatch[2]
          };
        }
      }
      
      return {
        type: 'verify',
        description: line
      };
    
    case 'measure_time':
      return {
        type: 'measure_time',
        description: 'Measure response time'
      };
    
    default:
      return {
        type: 'verify',
        description: line
      };
  }
}

/**
 * Extract field name from instruction line
 */
function extractFieldName(line: string): string {
  // Try each pattern
  for (const pattern of FIELD_PATTERNS) {
    const match = line.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  // Fallback: look for capitalized words or camelCase
  const words = line.split(/\s+/);
  for (const word of words) {
    // Check if it looks like a field name (camelCase, PascalCase, or kebab-case)
    if (/^[a-z][a-zA-Z0-9]*$/.test(word) || // camelCase
        /^[A-Z][a-zA-Z0-9]*$/.test(word) || // PascalCase
        /^[a-z][a-z0-9-]*$/.test(word)) {   // kebab-case
      // Skip common words
      const skipWords = ['the', 'a', 'an', 'of', 'from', 'to', 'in', 'on', 'at', 'for', 'with', 'by'];
      if (!skipWords.includes(word.toLowerCase())) {
        return word;
      }
    }
  }
  
  return 'field';
}

/**
 * Extract field value from instruction line
 * Handles quoted strings, numbers, and booleans
 */
function extractFieldValue(line: string): any {
  // Try to extract quoted string value
  const quotedMatch = line.match(/"([^"]+)"|'([^']+)'/);
  if (quotedMatch) {
    return quotedMatch[1] || quotedMatch[2];
  }
  
  // Try to extract number
  const numberMatch = line.match(/\b(\d+(?:\.\d+)?)\b/);
  if (numberMatch) {
    const num = parseFloat(numberMatch[1]);
    return Number.isInteger(num) ? parseInt(numberMatch[1]) : num;
  }
  
  // Try to extract boolean
  if (/\btrue\b/i.test(line)) {
    return true;
  }
  if (/\bfalse\b/i.test(line)) {
    return false;
  }
  
  // Try to extract null
  if (/\bnull\b/i.test(line)) {
    return null;
  }
  
  // Default: return the line after "with" keyword
  const withMatch = line.match(/\bwith\s+(.+)$/i);
  if (withMatch) {
    return withMatch[1].trim();
  }
  
  return '';
}

/**
 * Parse all instruction lines using semantic understanding
 * 
 * @param instruction - Full instruction text
 * @param method - HTTP method
 * @param url - Target URL
 * @returns Array of parsed actions
 */
export function parseInstructionSemantic(
  instruction: string,
  method: string,
  url: string
): InstructionAction[] {
  const lines = instruction.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const actions: InstructionAction[] = [];
  
  // Detect if this is a multi-step workflow with different HTTP methods
  const hasMultipleMethods = detectMultipleHttpMethods(instruction);
  let currentMethod = method;
  let currentUrl = url;
  let inExpectedOutputSection = false;
  
  for (const line of lines) {
    // Check if we're entering the Expected Output section
    if (line.toLowerCase().includes('expected output')) {
      inExpectedOutputSection = true;
      continue; // Skip the section header itself
    }
    
    // Skip lines in Expected Output section - they will be handled by parseExpectedOutput
    if (inExpectedOutputSection) {
      continue;
    }
    
    // Skip training notes and section headers
    if (line.startsWith('📌') || 
        line.toLowerCase().includes('this test trains') || 
        line.toLowerCase().includes('training note') ||
        line.toLowerCase().includes('trains the model')) {
      console.log(`[SemanticParser] Skipping training note: "${line}"`);
      continue;
    }
    
    // Check if this line specifies a different HTTP method
    if (hasMultipleMethods) {
      const lineMethod = extractHttpMethodFromLine(line);
      if (lineMethod) {
        currentMethod = lineMethod;
        // For GET requests using stored ID, keep the base URL
        if (lineMethod === 'GET' && line.toLowerCase().includes('using') && line.toLowerCase().includes('id')) {
          currentUrl = url; // Keep base URL, let code generator handle the ID
        }
      }
    }
    
    const { action, confidence } = parseInstructionLineSemantic(line, currentMethod, currentUrl);
    
    // Skip null actions (e.g., "without" instructions that should be ignored)
    if (action === null) {
      continue;
    }
    
    if (confidence < 0.5) {
      console.warn(`[SemanticParser] Low confidence (${confidence.toFixed(2)}) for: "${line}"`);
    }
    
    actions.push(action);
  }
  
  return actions;
}

/**
 * Detect if instruction contains multiple HTTP methods
 */
function detectMultipleHttpMethods(instruction: string): boolean {
  const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
  const foundMethods = methods.filter(method => 
    instruction.toLowerCase().includes(method.toLowerCase())
  );
  return foundMethods.length > 1;
}

/**
 * Extract HTTP method from a specific line
 */
function extractHttpMethodFromLine(line: string): string | null {
  const lineLower = line.toLowerCase();
  if (lineLower.includes('send') && lineLower.includes('post')) return 'POST';
  if (lineLower.includes('send') && lineLower.includes('get')) return 'GET';
  if (lineLower.includes('send') && lineLower.includes('put')) return 'PUT';
  if (lineLower.includes('send') && lineLower.includes('patch')) return 'PATCH';
  if (lineLower.includes('send') && lineLower.includes('delete')) return 'DELETE';
  return null;
}

/**
 * Parse Expected Output section to generate assertions
 * 
 * Extracts expected values and types from the "Expected Output" section
 * and converts them into verify actions.
 * 
 * @param instruction - Full instruction text
 * @returns Array of verify actions for expected outputs
 */
export function parseExpectedOutput(instruction: string): InstructionAction[] {
  const verifyActions: InstructionAction[] = [];
  
  // Find "Expected Output" section
  const expectedOutputMatch = instruction.match(/Expected Output[:\s]+([\s\S]*?)(?:\n\n|$)/i);
  
  if (!expectedOutputMatch) {
    return verifyActions;
  }
  
  const expectedOutputSection = expectedOutputMatch[1];
  const lines = expectedOutputSection.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  for (const line of lines) {
    const lineLower = line.toLowerCase();
    
    // Skip training notes (lines starting with 📌 or containing training keywords)
    if (line.startsWith('📌') || 
        lineLower.includes('this test trains') || 
        lineLower.includes('training note') ||
        lineLower.includes('trains the model')) {
      console.log(`[ExpectedOutput] Skipping training note: "${line}"`);
      continue;
    }
    
    // Pattern: "field value equals X"
    const equalsMatch = line.match(/(\w+(?:\.\w+)*)\s+(?:value\s+)?equals\s+(.+)/i);
    if (equalsMatch) {
      const field = equalsMatch[1];
      let expectedValue: any = equalsMatch[2].trim();
      
      // Parse value type
      if (/^\d+$/.test(expectedValue)) {
        expectedValue = parseInt(expectedValue);
      } else if (/^\d+\.\d+$/.test(expectedValue)) {
        expectedValue = parseFloat(expectedValue);
      } else if (expectedValue === 'true') {
        expectedValue = true;
      } else if (expectedValue === 'false') {
        expectedValue = false;
      } else if (expectedValue === 'null') {
        expectedValue = null;
      } else {
        // Remove quotes if present
        expectedValue = expectedValue.replace(/^["']|["']$/g, '');
      }
      
      verifyActions.push({
        type: 'verify',
        description: `Verify ${field} equals ${expectedValue}`,
        field: field,
        expectedValue: expectedValue
      });
      continue;
    }
    
    // Pattern: "field value is a type"
    const typeMatch = line.match(/(\w+(?:\.\w+)*)\s+(?:value\s+)?(?:is\s+a\s+|type\s+is\s+)(\w+)/i);
    if (typeMatch) {
      const field = typeMatch[1];
      const expectedType = typeMatch[2].toLowerCase();
      
      verifyActions.push({
        type: 'verify',
        description: `Verify ${field} is a ${expectedType}`,
        field: field,
        expectedValue: expectedType
      });
      continue;
    }
    
    // Pattern: "field exists" or "field value exists" or "field object exists"
    const existsMatch = line.match(/(\w+(?:\.\w+)*)\s+(?:value\s+|object\s+)?exists/i);
    if (existsMatch) {
      const field = existsMatch[1];
      
      verifyActions.push({
        type: 'verify',
        description: `Verify ${field} exists`,
        field: field,
        expectedValue: 'exists'
      });
      continue;
    }
    
    // Pattern: "field does not exist" or "field does not contain" (NEGATIVE ASSERTIONS)
    const doesNotExistMatch = line.match(/(\w+(?:\.\w+)*)\s+(?:does\s+not\s+exist|does\s+not\s+contain\s+(\w+)\s+field)/i);
    if (doesNotExistMatch) {
      const field = doesNotExistMatch[2] || doesNotExistMatch[1]; // Use the field mentioned
      
      verifyActions.push({
        type: 'verify',
        description: `Verify ${field} does not exist`,
        field: field,
        expectedValue: 'does_not_exist'
      });
      continue;
    }
    
    // Pattern: "Response body does not contain X field"
    const bodyDoesNotContainMatch = line.match(/response\s+body\s+does\s+not\s+contain\s+(\w+)\s+field/i);
    if (bodyDoesNotContainMatch) {
      const field = bodyDoesNotContainMatch[1];
      
      verifyActions.push({
        type: 'verify',
        description: `Verify response body does not contain ${field} field`,
        field: field,
        expectedValue: 'does_not_exist'
      });
      continue;
    }
    
    // Pattern: "status code equals X" or "Response status code equals X"
    const statusMatch = line.match(/(?:response\s+)?status\s+code\s+equals\s+(\d{3})/i);
    if (statusMatch) {
      verifyActions.push({
        type: 'verify',
        description: `Verify status code equals ${statusMatch[1]}`,
        field: 'statusCode',
        expectedValue: parseInt(statusMatch[1])
      });
      continue;
    }
  }
  
  return verifyActions;
}
