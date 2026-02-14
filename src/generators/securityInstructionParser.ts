/**
 * Security Instruction Parser
 * Parses natural language security testing instructions into structured test data
 * Implements the Instruction → Action parsing pipeline
 */

export interface ParsedInstruction {
  action: string;
  target: string;
  condition: string;
  verification: string;
  payload?: any;
  expectedBehavior: ExpectedBehavior;
  constraints: SecurityConstraints;
}

export interface ExpectedBehavior {
  statusCode: number[];
  responseContains?: string[];
  responseNotContains?: string[];
  headersPresent?: string[];
  headersAbsent?: string[];
  customValidations?: string[];
}

export interface SecurityConstraints {
  successNotAllowed?: boolean;
  authRequired?: boolean;
  dataLeakagePrevention?: boolean;
  injectionPrevention?: boolean;
  rateLimitEnforced?: boolean;
}

export interface SecurityTestData {
  testType: string;
  intent: string;
  url: string;
  method: string;
  instruction: string;
  inputData: any;
  expectedBehavior: ExpectedBehavior;
  testSteps: string[];
  assertions: string[];
  payload?: any;
}

export class SecurityInstructionParser {
  private readonly actionPatterns = {
    'API_CALL': [
      'send request', 'make request', 'call api', 'post to', 'get from', 
      'submit', 'login', 'authenticate', 'access'
    ],
    'ASSERT_NEGATIVE': [
      'verify fails', 'should fail', 'must fail', 'reject', 'deny', 
      'block', 'prevent', 'error', 'unauthorized'
    ],
    'ASSERT_POSITIVE': [
      'verify success', 'should succeed', 'allow', 'accept', 'grant'
    ],
    'PARSE_RESPONSE': [
      'extract', 'parse', 'check response', 'validate response', 
      'examine', 'inspect'
    ],
    'VALIDATE_HEADERS': [
      'check headers', 'verify headers', 'header present', 'header contains'
    ]
  };

  private readonly payloadPatterns = {
    'SQL_INJECTION': [
      "' or 1=1 --", "' union select", "'; drop table", "' or '1'='1",
      "admin'--", "' or 1=1#", "1' or '1'='1"
    ],
    'XSS_INJECTION': [
      '<script>alert(1)</script>', '<img src=x onerror=alert(1)>',
      'javascript:alert(1)', '<svg onload=alert(1)>'
    ],
    'NOSQL_INJECTION': [
      '{"$ne": null}', '{"$gt": ""}', '{"$where": "1==1"}'
    ],
    'INVALID_AUTH': [
      'invalid_token', 'expired_token', '', null, 'malformed_jwt'
    ]
  };

  /**
   * Parses security instruction into structured format
   */
  public parseInstruction(instruction: string, url: string, method: string = 'POST'): ParsedInstruction {
    const normalized = this.normalizeInstruction(instruction);
    
    return {
      action: this.extractAction(normalized),
      target: this.extractTarget(normalized, url),
      condition: this.extractCondition(normalized),
      verification: this.extractVerification(normalized),
      payload: this.extractPayload(normalized),
      expectedBehavior: this.extractExpectedBehavior(normalized),
      constraints: this.extractConstraints(normalized)
    };
  }

  /**
   * Generates complete security test data structure
   */
  public generateSecurityTestData(
    instruction: string,
    url: string,
    intent: string,
    method: string = 'POST'
  ): SecurityTestData {
    const parsed = this.parseInstruction(instruction, url, method);
    const inputData = this.generateInputData(parsed, intent);
    
    return {
      testType: 'security',
      intent,
      url,
      method,
      instruction,
      inputData,
      expectedBehavior: parsed.expectedBehavior,
      testSteps: this.generateTestSteps(parsed, url, method),
      assertions: this.generateAssertions(parsed, intent),
      payload: parsed.payload
    };
  }

  /**
   * Normalizes instruction for consistent parsing
   */
  private normalizeInstruction(instruction: string): string {
    return instruction
      .toLowerCase()
      .replace(/[^\w\s'"<>=.-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extracts primary action from instruction
   */
  private extractAction(instruction: string): string {
    for (const [action, patterns] of Object.entries(this.actionPatterns)) {
      if (patterns.some(pattern => instruction.includes(pattern))) {
        return action;
      }
    }
    return 'API_CALL'; // Default action
  }

  /**
   * Extracts target endpoint/resource
   */
  private extractTarget(instruction: string, url: string): string {
    // Extract endpoint name from URL
    const urlParts = url.split('/');
    const endpoint = urlParts[urlParts.length - 1] || 'api';
    
    // Look for specific targets in instruction
    const targets = ['login', 'register', 'user', 'admin', 'profile', 'data'];
    const foundTarget = targets.find(target => instruction.includes(target));
    
    return foundTarget || endpoint;
  }

  /**
   * Extracts test condition/scenario
   */
  private extractCondition(instruction: string): string {
    if (instruction.includes('without')) {
      return 'missing_required_data';
    }
    if (instruction.includes('invalid')) {
      return 'invalid_input';
    }
    if (instruction.includes('malicious') || instruction.includes('inject')) {
      return 'malicious_payload';
    }
    if (instruction.includes('unauthorized') || instruction.includes('no token')) {
      return 'unauthorized_access';
    }
    return 'standard_request';
  }

  /**
   * Extracts verification requirements
   */
  private extractVerification(instruction: string): string {
    if (instruction.includes('fail') || instruction.includes('reject')) {
      return 'failure';
    }
    if (instruction.includes('success') || instruction.includes('allow')) {
      return 'success';
    }
    if (instruction.includes('error')) {
      return 'error_present';
    }
    return 'status_validation';
  }

  /**
   * Extracts or generates appropriate payload
   */
  private extractPayload(instruction: string): any {
    // Check for SQL injection patterns
    for (const payload of this.payloadPatterns.SQL_INJECTION) {
      if (instruction.includes(payload)) {
        return { type: 'sql_injection', value: payload };
      }
    }

    // Check for XSS patterns
    for (const payload of this.payloadPatterns.XSS_INJECTION) {
      if (instruction.includes(payload.toLowerCase())) {
        return { type: 'xss_injection', value: payload };
      }
    }

    // Generate based on condition
    if (instruction.includes('sql') || instruction.includes('inject')) {
      return { type: 'sql_injection', value: "' OR 1=1 --" };
    }
    if (instruction.includes('xss') || instruction.includes('script')) {
      return { type: 'xss_injection', value: '<script>alert(1)</script>' };
    }

    return null;
  }

  /**
   * Extracts expected behavior from instruction
   */
  private extractExpectedBehavior(instruction: string): ExpectedBehavior {
    const behavior: ExpectedBehavior = {
      statusCode: []
    };

    // Status code expectations
    if (instruction.includes('fail') || instruction.includes('reject')) {
      behavior.statusCode = [400, 401, 403, 422];
    } else if (instruction.includes('unauthorized')) {
      behavior.statusCode = [401, 403];
    } else if (instruction.includes('success')) {
      behavior.statusCode = [200, 201];
    } else {
      behavior.statusCode = [400, 401, 403]; // Default to security failure
    }

    // Response content expectations
    if (instruction.includes('error')) {
      behavior.responseContains = ['error'];
    }
    if (instruction.includes('token') && instruction.includes('not')) {
      behavior.responseNotContains = ['token', 'access_token', 'jwt'];
    }
    if (instruction.includes('password') && instruction.includes('not')) {
      behavior.responseNotContains = ['password', 'pwd', 'pass'];
    }

    return behavior;
  }

  /**
   * Extracts security constraints
   */
  private extractConstraints(instruction: string): SecurityConstraints {
    return {
      successNotAllowed: instruction.includes('fail') || instruction.includes('reject'),
      authRequired: instruction.includes('token') || instruction.includes('auth'),
      dataLeakagePrevention: instruction.includes('password') || instruction.includes('sensitive'),
      injectionPrevention: instruction.includes('inject') || instruction.includes('sql'),
      rateLimitEnforced: instruction.includes('rate') || instruction.includes('limit')
    };
  }

  /**
   * Generates input data based on parsed instruction
   */
  private generateInputData(parsed: ParsedInstruction, intent: string): any {
    const baseData: any = {};

    // Generate data based on intent and payload
    switch (intent) {
      case 'SEC_INJ':
        if (parsed.payload?.type === 'sql_injection') {
          baseData.email = 'test@test.com';
          baseData.password = parsed.payload.value;
        } else if (parsed.payload?.type === 'xss_injection') {
          baseData.username = parsed.payload.value;
          baseData.email = 'test@test.com';
        }
        break;

      case 'SEC_AUTH':
        if (parsed.condition === 'missing_required_data') {
          baseData.email = 'test@test.com';
          // Intentionally omit password
        } else if (parsed.condition === 'invalid_input') {
          baseData.email = 'invalid-email';
          baseData.password = 'wrong-password';
        }
        break;

      case 'SEC_AUTHZ':
        // No auth token or invalid token
        baseData.authorization = parsed.condition === 'unauthorized_access' ? null : 'invalid_token';
        break;

      case 'SEC_DATA':
        baseData.email = 'test@test.com';
        baseData.password = 'password123';
        break;

      default:
        baseData.email = 'test@test.com';
        baseData.password = 'password123';
    }

    return baseData;
  }

  /**
   * Generates structured test steps
   */
  private generateTestSteps(parsed: ParsedInstruction, url: string, method: string): string[] {
    const steps: string[] = [];

    // Step 1: Prepare payload
    if (parsed.payload) {
      steps.push(`Prepare ${parsed.payload.type} payload: "${parsed.payload.value}"`);
    }

    // Step 2: Send request
    steps.push(`Send ${method} request to ${url} with ${parsed.condition} data`);

    // Step 3: Capture response
    steps.push('Capture HTTP status code and response body');

    // Step 4: Verify behavior
    switch (parsed.verification) {
      case 'failure':
        steps.push('Verify request is rejected with appropriate error');
        break;
      case 'success':
        steps.push('Verify request succeeds with expected response');
        break;
      case 'error_present':
        steps.push('Verify error message is present in response');
        break;
      default:
        steps.push('Verify response matches security expectations');
    }

    return steps;
  }

  /**
   * Generates test assertions based on parsed instruction
   */
  private generateAssertions(parsed: ParsedInstruction, intent: string): string[] {
    const assertions: string[] = [];

    // Status code assertions
    if (parsed.expectedBehavior.statusCode.length > 0) {
      if (parsed.constraints.successNotAllowed) {
        assertions.push('status code is not 200');
        assertions.push(`status code is one of: ${parsed.expectedBehavior.statusCode.join(', ')}`);
      } else {
        assertions.push(`status code is ${parsed.expectedBehavior.statusCode[0]}`);
      }
    }

    // Response content assertions
    if (parsed.expectedBehavior.responseContains) {
      parsed.expectedBehavior.responseContains.forEach(content => {
        assertions.push(`response contains "${content}"`);
      });
    }

    if (parsed.expectedBehavior.responseNotContains) {
      parsed.expectedBehavior.responseNotContains.forEach(content => {
        assertions.push(`response does not contain "${content}"`);
      });
    }

    // Intent-specific assertions
    switch (intent) {
      case 'SEC_INJ':
        assertions.push('injection attempt is blocked');
        break;
      case 'SEC_AUTH':
        assertions.push('authentication is properly validated');
        break;
      case 'SEC_AUTHZ':
        assertions.push('authorization is enforced');
        break;
      case 'SEC_DATA':
        assertions.push('sensitive data is not exposed');
        break;
    }

    return assertions;
  }
}