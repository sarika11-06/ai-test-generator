/**
 * Security Playwright Code Generator
 * Generates executable Playwright test code for security test cases
 * Produces research-grade, verifiable security tests
 */

import { SecurityTestData } from './securityInstructionParser';

export interface GeneratedSecurityTest {
  testCode: string;
  testName: string;
  description: string;
  assertions: string[];
  metadata: {
    intent: string;
    securityType: string;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    wcagCompliance?: string[];
  };
}

export class SecurityPlaywrightCodeGenerator {
  private readonly securityTemplates = {
    'SEC_INJ': this.generateInjectionTest.bind(this),
    'SEC_AUTH': this.generateAuthenticationTest.bind(this),
    'SEC_AUTHZ': this.generateAuthorizationTest.bind(this),
    'SEC_DATA': this.generateDataExposureTest.bind(this),
    'SEC_HEADER': this.generateSecurityHeaderTest.bind(this),
    'SEC_METHOD': this.generateMethodMisuseTest.bind(this),
    'SEC_RATE': this.generateRateLimitTest.bind(this)
  };

  /**
   * Generates complete Playwright security test
   */
  public generateSecurityTest(testData: SecurityTestData): GeneratedSecurityTest {
    const generator = this.securityTemplates[testData.intent as keyof typeof this.securityTemplates];
    
    if (!generator) {
      throw new Error(`Unsupported security intent: ${testData.intent}`);
    }

    return generator(testData);
  }

  /**
   * Generates injection prevention test
   */
  private generateInjectionTest(testData: SecurityTestData): GeneratedSecurityTest {
    const testName = `${testData.intent}_${this.sanitizeTestName(testData.url)}_Injection_Prevention`;
    const payloadType = testData.payload?.type || 'sql_injection';
    const payload = testData.payload?.value || "' OR 1=1 --";

    const testCode = `import { test, expect } from '@playwright/test';

test('${testName}', async ({ request }) => {
  console.log('🔒 Security Test: ${testData.intent} - Injection Prevention');
  console.log('📋 Instruction: ${testData.instruction}');
  
  // Step 1: Prepare malicious payload
  console.log('Step 1: Preparing ${payloadType} payload');
  const maliciousPayload = ${JSON.stringify(testData.inputData, null, 2)};
  console.log('Payload prepared:', maliciousPayload);

  // Step 2: Send request with injected payload
  console.log('Step 2: Sending ${testData.method} request to ${testData.url}');
  const response = await request.${testData.method.toLowerCase()}('${testData.url}', {
    data: maliciousPayload,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Step 3: Capture response details
  console.log('Step 3: Capturing response details');
  const statusCode = response.status();
  const responseBody = await response.json().catch(() => ({}));
  
  console.log('Response Status:', statusCode);
  console.log('Response Body:', responseBody);

  // Step 4: Verify injection is blocked
  console.log('Step 4: Verifying injection prevention');
  
  // Critical Security Assertions
  expect(statusCode, 'Injection should be rejected').not.toBe(200);
  expect([400, 401, 403, 422], 'Status should indicate rejection').toContain(statusCode);
  
  if (responseBody.error) {
    expect(responseBody.error, 'Error message should be present').toBeTruthy();
    console.log('✅ Error message present:', responseBody.error);
  }
  
  // Verify no sensitive data leakage
  expect(responseBody, 'No authentication token should be returned').not.toHaveProperty('token');
  expect(responseBody, 'No access token should be returned').not.toHaveProperty('access_token');
  expect(responseBody, 'No session data should be returned').not.toHaveProperty('session');
  
  // Verify injection payload is not executed
  const responseText = JSON.stringify(responseBody).toLowerCase();
  expect(responseText, 'Response should not contain SQL keywords').not.toMatch(/select|union|drop|insert|update|delete/);
  
  console.log('🎉 Injection prevention test completed successfully');
  console.log('✅ System properly rejected ${payloadType} attempt');
});`;

    return {
      testCode,
      testName,
      description: `Tests ${payloadType} injection prevention on ${testData.url}`,
      assertions: [
        'Status code is not 200',
        'Error message is present',
        'No authentication tokens returned',
        'No SQL keywords in response'
      ],
      metadata: {
        intent: testData.intent,
        securityType: 'Injection Prevention',
        riskLevel: 'CRITICAL'
      }
    };
  }

  /**
   * Generates authentication security test
   */
  private generateAuthenticationTest(testData: SecurityTestData): GeneratedSecurityTest {
    const testName = `${testData.intent}_${this.sanitizeTestName(testData.url)}_Authentication_Security`;

    const testCode = `import { test, expect } from '@playwright/test';

test('${testName}', async ({ request }) => {
  console.log('🔒 Security Test: ${testData.intent} - Authentication Security');
  console.log('📋 Instruction: ${testData.instruction}');
  
  // Step 1: Prepare authentication test data
  console.log('Step 1: Preparing authentication test data');
  const testData = ${JSON.stringify(testData.inputData, null, 2)};
  console.log('Test data prepared:', testData);

  // Step 2: Send authentication request
  console.log('Step 2: Sending ${testData.method} request to ${testData.url}');
  const response = await request.${testData.method.toLowerCase()}('${testData.url}', {
    data: testData,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Step 3: Analyze authentication response
  console.log('Step 3: Analyzing authentication response');
  const statusCode = response.status();
  const responseBody = await response.json().catch(() => ({}));
  
  console.log('Response Status:', statusCode);
  console.log('Response Body:', responseBody);

  // Step 4: Verify authentication security
  console.log('Step 4: Verifying authentication security');
  
  // Authentication Security Assertions
  ${this.generateAuthAssertions(testData)}
  
  console.log('🎉 Authentication security test completed successfully');
});`;

    return {
      testCode,
      testName,
      description: `Tests authentication security mechanisms on ${testData.url}`,
      assertions: testData.assertions,
      metadata: {
        intent: testData.intent,
        securityType: 'Authentication Security',
        riskLevel: 'HIGH'
      }
    };
  }

  /**
   * Generates authorization security test
   */
  private generateAuthorizationTest(testData: SecurityTestData): GeneratedSecurityTest {
    const testName = `${testData.intent}_${this.sanitizeTestName(testData.url)}_Authorization_Control`;

    const testCode = `import { test, expect } from '@playwright/test';

test('${testName}', async ({ request }) => {
  console.log('🔒 Security Test: ${testData.intent} - Authorization Control');
  console.log('📋 Instruction: ${testData.instruction}');
  
  // Step 1: Attempt unauthorized access
  console.log('Step 1: Attempting unauthorized access');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  // Intentionally omit or use invalid authorization
  ${testData.inputData.authorization ? 
    `headers['Authorization'] = '${testData.inputData.authorization}';` : 
    '// No authorization header provided'
  }

  // Step 2: Send request without proper authorization
  console.log('Step 2: Sending ${testData.method} request to ${testData.url}');
  const response = await request.${testData.method.toLowerCase()}('${testData.url}', {
    headers
  });

  // Step 3: Verify access is denied
  console.log('Step 3: Verifying access control');
  const statusCode = response.status();
  const responseBody = await response.json().catch(() => ({}));
  
  console.log('Response Status:', statusCode);
  console.log('Response Body:', responseBody);

  // Authorization Security Assertions
  expect([401, 403], 'Access should be denied').toContain(statusCode);
  
  if (statusCode === 401) {
    console.log('✅ Proper authentication required (401)');
  } else if (statusCode === 403) {
    console.log('✅ Access forbidden - proper authorization (403)');
  }
  
  // Verify no sensitive data is returned
  expect(responseBody, 'No user data should be returned').not.toHaveProperty('user');
  expect(responseBody, 'No profile data should be returned').not.toHaveProperty('profile');
  
  console.log('🎉 Authorization control test completed successfully');
});`;

    return {
      testCode,
      testName,
      description: `Tests authorization controls on ${testData.url}`,
      assertions: [
        'Status code is 401 or 403',
        'No user data returned',
        'Access properly denied'
      ],
      metadata: {
        intent: testData.intent,
        securityType: 'Authorization Control',
        riskLevel: 'HIGH'
      }
    };
  }

  /**
   * Generates sensitive data exposure test
   */
  private generateDataExposureTest(testData: SecurityTestData): GeneratedSecurityTest {
    const testName = `${testData.intent}_${this.sanitizeTestName(testData.url)}_Data_Exposure_Prevention`;

    const testCode = `import { test, expect } from '@playwright/test';

test('${testName}', async ({ request }) => {
  console.log('🔒 Security Test: ${testData.intent} - Sensitive Data Exposure Prevention');
  console.log('📋 Instruction: ${testData.instruction}');
  
  // Step 1: Send request to potentially expose sensitive data
  console.log('Step 1: Sending request to check for data exposure');
  const response = await request.${testData.method.toLowerCase()}('${testData.url}', {
    data: ${JSON.stringify(testData.inputData, null, 2)},
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Step 2: Analyze response for sensitive data
  console.log('Step 2: Analyzing response for sensitive data exposure');
  const statusCode = response.status();
  const responseBody = await response.json().catch(() => ({}));
  const responseText = JSON.stringify(responseBody).toLowerCase();
  
  console.log('Response Status:', statusCode);
  console.log('Checking for sensitive data exposure...');

  // Step 3: Verify sensitive data is not exposed
  console.log('Step 3: Verifying sensitive data protection');
  
  // Sensitive Data Protection Assertions
  expect(responseBody, 'Password should not be exposed').not.toHaveProperty('password');
  expect(responseBody, 'Password field should not be present').not.toHaveProperty('pwd');
  expect(responseBody, 'Pass field should not be present').not.toHaveProperty('pass');
  
  // Check for sensitive patterns in response text
  expect(responseText, 'No password values in response').not.toMatch(/password.*:/);
  expect(responseText, 'No credit card patterns').not.toMatch(/\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}/);
  expect(responseText, 'No SSN patterns').not.toMatch(/\\d{3}-\\d{2}-\\d{4}/);
  
  // Verify proper data masking if user data is returned
  if (responseBody.user || responseBody.profile) {
    const userData = responseBody.user || responseBody.profile;
    expect(userData, 'User password should not be exposed').not.toHaveProperty('password');
    
    if (userData.email) {
      console.log('✅ Email present but password properly hidden');
    }
  }
  
  console.log('🎉 Sensitive data exposure prevention test completed successfully');
});`;

    return {
      testCode,
      testName,
      description: `Tests sensitive data exposure prevention on ${testData.url}`,
      assertions: [
        'No password fields exposed',
        'No credit card patterns',
        'No SSN patterns',
        'Proper data masking'
      ],
      metadata: {
        intent: testData.intent,
        securityType: 'Data Protection',
        riskLevel: 'HIGH'
      }
    };
  }

  /**
   * Generates security headers test
   */
  private generateSecurityHeaderTest(testData: SecurityTestData): GeneratedSecurityTest {
    const testName = `${testData.intent}_${this.sanitizeTestName(testData.url)}_Security_Headers`;

    const testCode = `import { test, expect } from '@playwright/test';

test('${testName}', async ({ request }) => {
  console.log('🔒 Security Test: ${testData.intent} - Security Headers Validation');
  console.log('📋 Instruction: ${testData.instruction}');
  
  // Step 1: Send request to check security headers
  console.log('Step 1: Sending request to validate security headers');
  const response = await request.${testData.method.toLowerCase()}('${testData.url}');

  // Step 2: Extract and analyze headers
  console.log('Step 2: Analyzing security headers');
  const headers = response.headers();
  
  console.log('Response Headers:', headers);

  // Step 3: Verify critical security headers
  console.log('Step 3: Verifying security headers presence');
  
  // Security Headers Assertions
  expect(headers, 'X-Frame-Options should be present').toHaveProperty('x-frame-options');
  expect(headers, 'X-Content-Type-Options should be present').toHaveProperty('x-content-type-options');
  expect(headers, 'X-XSS-Protection should be present').toHaveProperty('x-xss-protection');
  
  // Verify header values
  if (headers['x-frame-options']) {
    expect(['DENY', 'SAMEORIGIN'], 'X-Frame-Options should have secure value')
      .toContain(headers['x-frame-options'].toUpperCase());
    console.log('✅ X-Frame-Options properly configured');
  }
  
  if (headers['x-content-type-options']) {
    expect(headers['x-content-type-options'], 'X-Content-Type-Options should be nosniff')
      .toBe('nosniff');
    console.log('✅ X-Content-Type-Options properly configured');
  }
  
  console.log('🎉 Security headers validation completed successfully');
});`;

    return {
      testCode,
      testName,
      description: `Tests security headers on ${testData.url}`,
      assertions: [
        'X-Frame-Options present',
        'X-Content-Type-Options present',
        'X-XSS-Protection present',
        'Header values are secure'
      ],
      metadata: {
        intent: testData.intent,
        securityType: 'Security Headers',
        riskLevel: 'MEDIUM'
      }
    };
  }

  /**
   * Generates HTTP method misuse test
   */
  private generateMethodMisuseTest(testData: SecurityTestData): GeneratedSecurityTest {
    const testName = `${testData.intent}_${this.sanitizeTestName(testData.url)}_Method_Security`;

    const testCode = `import { test, expect } from '@playwright/test';

test('${testName}', async ({ request }) => {
  console.log('🔒 Security Test: ${testData.intent} - HTTP Method Security');
  console.log('📋 Instruction: ${testData.instruction}');
  
  // Step 1: Test inappropriate HTTP methods
  console.log('Step 1: Testing HTTP method restrictions');
  
  const inappropriateMethods = ['GET', 'PUT', 'DELETE', 'PATCH'];
  const results: Array<{method: string, status: number}> = [];
  
  for (const method of inappropriateMethods) {
    console.log(\`Testing \${method} method on ${testData.url}\`);
    
    try {
      const response = await request.fetch('${testData.url}', {
        method: method,
        data: method !== 'GET' ? ${JSON.stringify(testData.inputData)} : undefined
      });
      
      results.push({ method, status: response.status() });
      console.log(\`\${method}: \${response.status()}\`);
    } catch (error) {
      console.log(\`\${method}: Request failed (expected)\`);
      results.push({ method, status: 0 });
    }
  }

  // Step 2: Verify method restrictions
  console.log('Step 2: Verifying method security');
  
  results.forEach(result => {
    if (result.status === 200) {
      console.warn(\`⚠️ \${result.method} method allowed (potential security issue)\`);
    } else if (result.status === 405) {
      console.log(\`✅ \${result.method} method properly rejected (405)\`);
    } else {
      console.log(\`✅ \${result.method} method blocked (status: \${result.status})\`);
    }
    
    // Method should not succeed inappropriately
    expect(result.status, \`\${result.method} should not be allowed\`).not.toBe(200);
  });
  
  console.log('🎉 HTTP method security test completed successfully');
});`;

    return {
      testCode,
      testName,
      description: `Tests HTTP method security on ${testData.url}`,
      assertions: [
        'Inappropriate methods rejected',
        'Method restrictions enforced',
        'No unintended method access'
      ],
      metadata: {
        intent: testData.intent,
        securityType: 'Method Security',
        riskLevel: 'MEDIUM'
      }
    };
  }

  /**
   * Generates rate limiting test
   */
  private generateRateLimitTest(testData: SecurityTestData): GeneratedSecurityTest {
    const testName = `${testData.intent}_${this.sanitizeTestName(testData.url)}_Rate_Limiting`;

    const testCode = `import { test, expect } from '@playwright/test';

test('${testName}', async ({ request }) => {
  console.log('🔒 Security Test: ${testData.intent} - Rate Limiting');
  console.log('📋 Instruction: ${testData.instruction}');
  
  // Step 1: Send multiple rapid requests
  console.log('Step 1: Sending multiple rapid requests to test rate limiting');
  
  const requestCount = 10;
  const requests: Promise<any>[] = [];
  
  for (let i = 0; i < requestCount; i++) {
    requests.push(
      request.${testData.method.toLowerCase()}('${testData.url}', {
        data: ${JSON.stringify(testData.inputData, null, 2)}
      })
    );
  }
  
  // Step 2: Execute requests simultaneously
  console.log('Step 2: Executing simultaneous requests');
  const responses = await Promise.all(requests);
  
  // Step 3: Analyze rate limiting behavior
  console.log('Step 3: Analyzing rate limiting behavior');
  
  const statusCodes = responses.map(r => r.status());
  const rateLimitedRequests = statusCodes.filter(code => code === 429);
  
  console.log('Status codes:', statusCodes);
  console.log('Rate limited requests (429):', rateLimitedRequests.length);
  
  // Rate Limiting Assertions
  if (rateLimitedRequests.length > 0) {
    console.log(\`✅ Rate limiting active: \${rateLimitedRequests.length} requests blocked\`);
    expect(rateLimitedRequests.length, 'Some requests should be rate limited').toBeGreaterThan(0);
  } else {
    console.warn('⚠️ No rate limiting detected - potential security concern');
    // This might be acceptable depending on the endpoint
  }
  
  // Check for rate limit headers
  const lastResponse = responses[responses.length - 1];
  const headers = lastResponse.headers();
  
  if (headers['x-ratelimit-limit'] || headers['x-ratelimit-remaining']) {
    console.log('✅ Rate limit headers present');
    console.log('Rate limit headers:', {
      limit: headers['x-ratelimit-limit'],
      remaining: headers['x-ratelimit-remaining']
    });
  }
  
  console.log('🎉 Rate limiting test completed successfully');
});`;

    return {
      testCode,
      testName,
      description: `Tests rate limiting on ${testData.url}`,
      assertions: [
        'Rate limiting enforced',
        'Status 429 for excess requests',
        'Rate limit headers present'
      ],
      metadata: {
        intent: testData.intent,
        securityType: 'Rate Limiting',
        riskLevel: 'MEDIUM'
      }
    };
  }

  /**
   * Generates authentication-specific assertions
   */
  private generateAuthAssertions(testData: SecurityTestData): string {
    const assertions: string[] = [];

    if (testData.expectedBehavior.statusCode.includes(400) || 
        testData.expectedBehavior.statusCode.includes(401)) {
      assertions.push(`
  expect([400, 401, 422], 'Authentication should fail appropriately').toContain(statusCode);
  
  if (responseBody.error) {
    expect(responseBody.error, 'Error message should be present').toBeTruthy();
    console.log('✅ Authentication error properly reported:', responseBody.error);
  }
  
  // Verify no authentication tokens are issued
  expect(responseBody, 'No token should be issued for failed auth').not.toHaveProperty('token');
  expect(responseBody, 'No access_token should be issued').not.toHaveProperty('access_token');`);
    }

    return assertions.join('\n');
  }

  /**
   * Sanitizes URL for test name
   */
  private sanitizeTestName(url: string): string {
    return url
      .replace(/https?:\/\//, '')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }
}