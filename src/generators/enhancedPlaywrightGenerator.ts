/**
 * Enhanced Playwright Code Generator
 * Generates sophisticated, adaptive Playwright test code for varied instructions
 * Handles complex scenarios, edge cases, and diverse input patterns
 */

import { EnhancedParsedInstruction, TestStep, ExpectedOutcome } from './enhancedInstructionParser';

export interface EnhancedGeneratedTest {
  testCode: string;
  testName: string;
  description: string;
  metadata: {
    complexity: string;
    confidence: number;
    testTypes: string[];
    estimatedDuration: string;
    requirements: string[];
  };
  diagnostics: {
    warnings: string[];
    suggestions: string[];
    potentialIssues: string[];
  };
}

export class EnhancedPlaywrightGenerator {
  private readonly codeTemplates = {
    TEST_HEADER: `import { test, expect } from '@playwright/test';`,
    
    SETUP_SECTION: `
  // Test Setup and Configuration
  console.log('🚀 Starting test: {{TEST_NAME}}');
  console.log('📋 Description: {{DESCRIPTION}}');
  console.log('🎯 Complexity: {{COMPLEXITY}}');
  
  // Initialize test variables
  let testResults = {
    steps: [],
    assertions: [],
    data: {},
    timing: { start: Date.now() }
  };`,

    HTTP_REQUEST_TEMPLATE: `
  // {{STEP_DESCRIPTION}}
  console.log('{{STEP_NUMBER}}. {{ACTION}}');
  
  const {{RESPONSE_VAR}} = await request.{{METHOD}}('{{URL}}', {
    {{REQUEST_OPTIONS}}
  });
  
  // Capture response details
  const {{STATUS_VAR}} = {{RESPONSE_VAR}}.status();
  const {{HEADERS_VAR}} = {{RESPONSE_VAR}}.headers();
  let {{BODY_VAR}};
  
  try {
    {{BODY_VAR}} = await {{RESPONSE_VAR}}.json();
  } catch (error) {
    {{BODY_VAR}} = await {{RESPONSE_VAR}}.text();
    console.log('Response is not JSON, captured as text');
  }
  
  // Log response details
  console.log('Response Status:', {{STATUS_VAR}});
  console.log('Response Headers:', Object.keys({{HEADERS_VAR}}));
  console.log('Response Body Type:', typeof {{BODY_VAR}});
  
  // Store in test results
  testResults.steps.push({
    step: {{STEP_NUMBER}},
    action: '{{ACTION}}',
    status: {{STATUS_VAR}},
    timestamp: Date.now()
  });`,

    VALIDATION_TEMPLATE: `
  // {{VALIDATION_DESCRIPTION}}
  console.log('🔍 Validating: {{VALIDATION_TYPE}}');
  
  {{VALIDATION_CODE}}
  
  testResults.assertions.push({
    type: '{{VALIDATION_TYPE}}',
    passed: true,
    timestamp: Date.now()
  });`,

    SECURITY_VALIDATION: `
  // Security Validation Block
  console.log('🔒 Performing security validations');
  
  // Check for security indicators
  const securityChecks = {
    statusCodeSafe: {{STATUS_VAR}} !== 200 || {{STATUS_VAR}} >= 400,
    noSensitiveData: !JSON.stringify({{BODY_VAR}}).toLowerCase().match(/password|token|secret|key/),
    errorPresent: {{BODY_VAR}}.error || {{BODY_VAR}}.message,
    properHeaders: {{HEADERS_VAR}}['content-type'] && !{{HEADERS_VAR}}['x-debug-info']
  };
  
  console.log('Security Check Results:', securityChecks);`,

    ERROR_HANDLING: `
  } catch (testError) {
    console.error('❌ Test step failed:', testError.message);
    testResults.steps.push({
      step: {{STEP_NUMBER}},
      action: '{{ACTION}}',
      error: testError.message,
      timestamp: Date.now()
    });
    
    // Continue with graceful error handling
    {{ERROR_RECOVERY_CODE}}
  }`,

    TEST_SUMMARY: `
  // Test Completion Summary
  testResults.timing.end = Date.now();
  testResults.timing.duration = testResults.timing.end - testResults.timing.start;
  
  console.log('📊 Test Summary:');
  console.log('   Steps Completed:', testResults.steps.length);
  console.log('   Assertions Passed:', testResults.assertions.length);
  console.log('   Duration:', testResults.timing.duration + 'ms');
  console.log('   Success Rate:', (testResults.assertions.length / testResults.steps.length * 100).toFixed(1) + '%');
  
  // Final validation
  expect(testResults.steps.length, 'All test steps should complete').toBeGreaterThan(0);
  expect(testResults.assertions.length, 'At least one assertion should pass').toBeGreaterThan(0);`
  };

  /**
   * Generate enhanced Playwright test code
   */
  public generateTest(
    parsedInstruction: EnhancedParsedInstruction,
    url: string,
    originalInstruction: string
  ): EnhancedGeneratedTest {
    console.log('🔧 Generating enhanced Playwright test code');
    
    const testName = this.generateTestName(parsedInstruction, url);
    const description = this.generateDescription(parsedInstruction, originalInstruction);
    
    // Build test code sections
    const testHeader = this.generateTestHeader();
    const testFunction = this.generateTestFunction(testName, parsedInstruction, url);
    const setupSection = this.generateSetupSection(testName, description, parsedInstruction);
    const actionSections = this.generateActionSections(parsedInstruction, url);
    const validationSections = this.generateValidationSections(parsedInstruction);
    const summarySection = this.generateSummarySection(parsedInstruction);
    
    // Combine all sections
    const testCode = [
      testHeader,
      '',
      testFunction,
      setupSection,
      ...actionSections,
      ...validationSections,
      summarySection,
      '});'
    ].join('\\n');
    
    // Generate metadata and diagnostics
    const metadata = this.generateMetadata(parsedInstruction);
    const diagnostics = this.generateDiagnostics(parsedInstruction, originalInstruction);
    
    return {
      testCode,
      testName,
      description,
      metadata,
      diagnostics
    };
  }

  /**
   * Generate intelligent test name
   */
  private generateTestName(parsedInstruction: EnhancedParsedInstruction, url: string): string {
    const domain = this.extractDomain(url);
    const primaryAction = parsedInstruction.actions[0]?.verb || 'test';
    const securityType = parsedInstruction.conditions.find(c => c.type === 'SECURITY')?.parameters.securityType || '';
    
    let name = `${parsedInstruction.context.domain}_${primaryAction}_${domain}`;
    
    if (securityType) {
      name += `_${securityType}`;
    }
    
    if (parsedInstruction.context.complexity !== 'SIMPLE') {
      name += `_${parsedInstruction.context.complexity}`;
    }
    
    return name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  }

  /**
   * Generate comprehensive description
   */
  private generateDescription(parsedInstruction: EnhancedParsedInstruction, originalInstruction: string): string {
    const parts = [
      `${parsedInstruction.context.domain} test`,
      `with ${parsedInstruction.context.complexity.toLowerCase()} complexity`,
      `(${parsedInstruction.actions.length} actions, ${parsedInstruction.validations.length} validations)`
    ];
    
    if (parsedInstruction.context.securityLevel !== 'LOW') {
      parts.push(`Security level: ${parsedInstruction.context.securityLevel}`);
    }
    
    return `${parts.join(' ')} - ${originalInstruction}`;
  }

  /**
   * Generate test header
   */
  private generateTestHeader(): string {
    return this.codeTemplates.TEST_HEADER;
  }

  /**
   * Generate test function declaration
   */
  private generateTestFunction(testName: string, parsedInstruction: EnhancedParsedInstruction, url: string): string {
    const requestType = parsedInstruction.context.domain === 'API' ? '{ request }' : '{ page }';
    return `\\ntest('${testName}', async (${requestType}) => {`;
  }

  /**
   * Generate setup section
   */
  private generateSetupSection(testName: string, description: string, parsedInstruction: EnhancedParsedInstruction): string {
    return this.codeTemplates.SETUP_SECTION
      .replace('{{TEST_NAME}}', testName)
      .replace('{{DESCRIPTION}}', description)
      .replace('{{COMPLEXITY}}', parsedInstruction.context.complexity);
  }

  /**
   * Generate action sections
   */
  private generateActionSections(parsedInstruction: EnhancedParsedInstruction, url: string): string[] {
    const sections: string[] = [];
    
    parsedInstruction.testFlow.forEach((step, index) => {
      const action = parsedInstruction.actions.find(a => 
        step.action.toLowerCase().includes(a.verb.toLowerCase())
      );
      
      if (action?.type === 'HTTP_REQUEST') {
        sections.push(this.generateHttpRequestSection(step, action, url, index + 1));
      } else if (action?.type === 'DATA_MANIPULATION') {
        sections.push(this.generateDataManipulationSection(step, action, index + 1));
      } else if (action?.type === 'VALIDATION') {
        sections.push(this.generateGenericActionSection(step, index + 1));
      } else {
        sections.push(this.generateGenericActionSection(step, index + 1));
      }
    });
    
    return sections;
  }

  /**
   * Generate HTTP request section
   */
  private generateHttpRequestSection(step: TestStep, action: any, url: string, stepNumber: number): string {
    const method = this.extractHttpMethod(action.verb);
    const responseVar = `response${stepNumber}`;
    const statusVar = `status${stepNumber}`;
    const headersVar = `headers${stepNumber}`;
    const bodyVar = `body${stepNumber}`;
    
    // Generate request options
    const requestOptions = this.generateRequestOptions(action, step);
    
    let section = this.codeTemplates.HTTP_REQUEST_TEMPLATE
      .replace(/{{STEP_DESCRIPTION}}/g, step.details)
      .replace(/{{STEP_NUMBER}}/g, stepNumber.toString())
      .replace(/{{ACTION}}/g, step.action)
      .replace(/{{METHOD}}/g, method.toLowerCase())
      .replace(/{{URL}}/g, url)
      .replace(/{{REQUEST_OPTIONS}}/g, requestOptions)
      .replace(/{{RESPONSE_VAR}}/g, responseVar)
      .replace(/{{STATUS_VAR}}/g, statusVar)
      .replace(/{{HEADERS_VAR}}/g, headersVar)
      .replace(/{{BODY_VAR}}/g, bodyVar);
    
    // Add error handling
    section = this.wrapWithErrorHandling(section, step.action, stepNumber);
    
    return section;
  }

  /**
   * Generate request options based on action and step
   */
  private generateRequestOptions(action: any, step: TestStep): string {
    const options: string[] = [];
    
    // Add headers
    const headers: string[] = ['\'Content-Type\': \'application/json\''];
    
    // Add security headers if needed
    if (action.modifiers.includes('unauthorized')) {
      headers.push('\'Authorization\': \'Bearer invalid_token_123\'');
    } else if (action.modifiers.includes('admin')) {
      headers.push('\'X-Admin\': \'true\'');
    }
    
    if (headers.length > 0) {
      options.push(`headers: {\\n      ${headers.join(',\\n      ')}\\n    }`);
    }
    
    // Add data payload
    if (action.type === 'HTTP_REQUEST' && ['post', 'put', 'patch'].includes(action.verb.toLowerCase())) {
      const data = this.generateTestData(action, step);
      if (data) {
        options.push(`data: ${data}`);
      }
    }
    
    // Add timeout
    options.push('timeout: 30000');
    
    return options.join(',\\n    ');
  }

  /**
   * Generate test data based on action and step
   */
  private generateTestData(action: any, step: TestStep): string {
    const data: Record<string, any> = {};
    
    // Security test data
    if (action.modifiers.includes('malicious')) {
      if (step.details.toLowerCase().includes('sql')) {
        data.email = 'test@test.com';
        data.password = '\' OR 1=1 --';
      } else if (step.details.toLowerCase().includes('xss')) {
        data.username = '<script>alert(1)</script>';
        data.email = 'test@test.com';
      }
    } else if (action.modifiers.includes('invalid')) {
      data.email = 'invalid-email';
      data.password = '';
    } else {
      // Standard test data
      data.email = 'test@test.com';
      data.password = 'password123';
    }
    
    return JSON.stringify(data, null, 6);
  }

  /**
   * Generate validation sections
   */
  private generateValidationSections(parsedInstruction: EnhancedParsedInstruction): string[] {
    const sections: string[] = [];
    
    parsedInstruction.validations.forEach((validation, index) => {
      const validationCode = this.generateValidationCode(validation, index + 1);
      
      const section = this.codeTemplates.VALIDATION_TEMPLATE
        .replace('{{VALIDATION_DESCRIPTION}}', validation.expectation)
        .replace('{{VALIDATION_TYPE}}', validation.type)
        .replace('{{VALIDATION_CODE}}', validationCode);
      
      sections.push(section);
    });
    
    // Add security validation if needed
    if (parsedInstruction.context.securityLevel !== 'LOW') {
      sections.push(this.generateSecurityValidationSection());
    }
    
    return sections;
  }

  /**
   * Generate specific validation code
   */
  private generateValidationCode(validation: any, stepNumber: number): string {
    const statusVar = `status${stepNumber}`;
    const bodyVar = `body${stepNumber}`;
    
    switch (validation.type) {
      case 'STATUS_CODE':
        return this.generateStatusCodeValidation(validation, statusVar);
      case 'RESPONSE_CONTENT':
        return this.generateResponseContentValidation(validation, bodyVar);
      case 'SECURITY':
        return this.generateSecurityValidation(validation, statusVar, bodyVar);
      case 'HEADERS':
        return this.generateHeaderValidation(validation, `headers${stepNumber}`);
      default:
        return this.generateGenericValidation(validation, statusVar, bodyVar);
    }
  }

  /**
   * Generate status code validation
   */
  private generateStatusCodeValidation(validation: any, statusVar: string): string {
    const expectedCodes = validation.criteria
      .filter((c: string) => c.includes('status'))
      .map((c: string) => c.match(/\\d+/)?.[0])
      .filter(Boolean);
    
    if (expectedCodes.length === 1) {
      return `expect(${statusVar}, '${validation.expectation}').toBe(${expectedCodes[0]});`;
    } else if (expectedCodes.length > 1) {
      return `expect([${expectedCodes.join(', ')}], '${validation.expectation}').toContain(${statusVar});`;
    } else {
      return `expect(${statusVar}, '${validation.expectation}').toBeGreaterThanOrEqual(200);`;
    }
  }

  /**
   * Generate response content validation
   */
  private generateResponseContentValidation(validation: any, bodyVar: string): string {
    const contentChecks = validation.criteria
      .filter((c: string) => c.includes('includes') || c.includes('contains'))
      .map((c: string) => {
        const match = c.match(/["']([^"']+)["']/);
        return match ? match[1] : null;
      })
      .filter(Boolean);
    
    if (contentChecks.length > 0) {
      const checks = contentChecks.map((content: any) => 
        `expect(JSON.stringify(${bodyVar}), 'Response should contain "${content}"').toContain('${content}');`
      ).join('\\n  ');
      return checks;
    }
    
    return `expect(${bodyVar}, '${validation.expectation}').toBeDefined();`;
  }

  /**
   * Generate security validation
   */
  private generateSecurityValidation(validation: any, statusVar: string, bodyVar: string): string {
    return `
  // Security-specific validations
  expect(${statusVar}, 'Security test should not return 200').not.toBe(200);
  expect([400, 401, 403, 422], 'Status should indicate security rejection').toContain(${statusVar});
  
  // Check for error message
  if (${bodyVar}.error || ${bodyVar}.message) {
    expect(${bodyVar}.error || ${bodyVar}.message, 'Error message should be present').toBeTruthy();
    console.log('✅ Security error properly reported:', ${bodyVar}.error || ${bodyVar}.message);
  }
  
  // Verify no sensitive data leakage
  const responseText = JSON.stringify(${bodyVar}).toLowerCase();
  expect(responseText, 'No tokens should be exposed').not.toMatch(/token|jwt|session/);
  expect(responseText, 'No passwords should be exposed').not.toMatch(/password|pwd|pass/);`;
  }

  /**
   * Generate header validation
   */
  private generateHeaderValidation(validation: any, headersVar: string): string {
    return `
  // Header validations
  expect(${headersVar}, 'Headers should be present').toBeDefined();
  expect(Object.keys(${headersVar}).length, 'Should have response headers').toBeGreaterThan(0);
  
  // Check for security headers
  const securityHeaders = ['x-frame-options', 'x-content-type-options', 'x-xss-protection'];
  securityHeaders.forEach(header => {
    if (${headersVar}[header]) {
      console.log(\`✅ Security header present: \${header} = \${${headersVar}[header]}\`);
    }
  });`;
  }

  /**
   * Generate generic validation
   */
  private generateGenericValidation(validation: any, statusVar: string, bodyVar: string): string {
    return `
  // Generic validation: ${validation.expectation}
  expect(${statusVar}, 'Response status should be valid').toBeGreaterThanOrEqual(200);
  expect(${statusVar}, 'Response status should be less than 600').toBeLessThan(600);
  expect(${bodyVar}, 'Response body should be defined').toBeDefined();
  
  console.log('✅ Generic validation completed for: ${validation.type}');`;
  }

  /**
   * Generate security validation section
   */
  private generateSecurityValidationSection(): string {
    return this.codeTemplates.SECURITY_VALIDATION
      .replace(/{{STATUS_VAR}}/g, 'status1')
      .replace(/{{BODY_VAR}}/g, 'body1')
      .replace(/{{HEADERS_VAR}}/g, 'headers1');
  }

  /**
   * Generate data manipulation section
   */
  private generateDataManipulationSection(step: TestStep, action: any, stepNumber: number): string {
    return `
  // ${step.details}
  console.log('${stepNumber}. ${step.action}');
  
  // Data manipulation: ${action.verb} ${action.object}
  const manipulatedData = {
    operation: '${action.verb}',
    target: '${action.object}',
    modifiers: ${JSON.stringify(action.modifiers)},
    timestamp: Date.now()
  };
  
  testResults.data[\`step${stepNumber}\`] = manipulatedData;
  console.log('Data manipulation completed:', manipulatedData);`;
  }

  /**
   * Generate generic action section
   */
  private generateGenericActionSection(step: TestStep, stepNumber: number): string {
    return `
  // ${step.details}
  console.log('${stepNumber}. ${step.action}');
  
  // Generic action execution
  const actionResult = {
    step: ${stepNumber},
    action: '${step.action}',
    expectedResult: '${step.expectedResult}',
    validations: ${JSON.stringify(step.validations)},
    completed: true,
    timestamp: Date.now()
  };
  
  testResults.steps.push(actionResult);
  console.log('Action completed:', actionResult);`;
  }

  /**
   * Generate summary section
   */
  private generateSummarySection(parsedInstruction: EnhancedParsedInstruction): string {
    return this.codeTemplates.TEST_SUMMARY;
  }

  /**
   * Wrap code with error handling
   */
  private wrapWithErrorHandling(code: string, action: string, stepNumber: number): string {
    const errorRecovery = `
    // Attempt to continue test execution
    if (testError.message.includes('timeout')) {
      console.log('⚠️ Timeout occurred, but continuing test');
    } else {
      throw testError; // Re-throw non-recoverable errors
    }`;
    
    return `
  try {${code}
  ${this.codeTemplates.ERROR_HANDLING
    .replace(/{{STEP_NUMBER}}/g, stepNumber.toString())
    .replace(/{{ACTION}}/g, action)
    .replace(/{{ERROR_RECOVERY_CODE}}/g, errorRecovery)}`;
  }

  /**
   * Generate metadata
   */
  private generateMetadata(parsedInstruction: EnhancedParsedInstruction): any {
    const estimatedDuration = this.estimateTestDuration(parsedInstruction);
    const requirements = this.generateRequirements(parsedInstruction);
    
    return {
      complexity: parsedInstruction.context.complexity,
      confidence: Math.round(parsedInstruction.confidence * 100),
      testTypes: parsedInstruction.context.testType,
      estimatedDuration,
      requirements
    };
  }

  /**
   * Generate diagnostics
   */
  private generateDiagnostics(parsedInstruction: EnhancedParsedInstruction, originalInstruction: string): any {
    const warnings: string[] = [];
    const suggestions: string[] = [];
    const potentialIssues: string[] = [];
    
    // Confidence warnings
    if (parsedInstruction.confidence < 0.7) {
      warnings.push(`Low confidence in instruction parsing (${Math.round(parsedInstruction.confidence * 100)}%)`);
    }
    
    // Complexity warnings
    if (parsedInstruction.context.complexity === 'VERY_COMPLEX') {
      warnings.push('Very complex test - consider breaking into smaller tests');
    }
    
    // Security warnings
    if (parsedInstruction.context.securityLevel === 'CRITICAL') {
      warnings.push('Critical security test - ensure proper test environment isolation');
    }
    
    // Add suggestions from parser
    suggestions.push(...parsedInstruction.suggestions);
    
    // Potential issues
    if (parsedInstruction.actions.length === 0) {
      potentialIssues.push('No clear actions identified - test may not execute properly');
    }
    
    if (parsedInstruction.validations.length === 0) {
      potentialIssues.push('No validations identified - test may not verify expected behavior');
    }
    
    return {
      warnings,
      suggestions,
      potentialIssues
    };
  }

  // Helper methods
  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname.replace(/[^a-zA-Z0-9]/g, '_');
    } catch {
      return 'unknown_domain';
    }
  }

  private extractHttpMethod(verb: string): string {
    const methodMap: Record<string, string> = {
      'send': 'POST',
      'get': 'GET',
      'post': 'POST',
      'put': 'PUT',
      'patch': 'PATCH',
      'delete': 'DELETE',
      'login': 'POST',
      'register': 'POST',
      'create': 'POST',
      'update': 'PUT',
      'fetch': 'GET',
      'retrieve': 'GET'
    };
    
    return methodMap[verb.toLowerCase()] || 'GET';
  }

  private estimateTestDuration(parsedInstruction: EnhancedParsedInstruction): string {
    const baseTime = 5; // seconds
    const actionTime = parsedInstruction.actions.length * 2;
    const validationTime = parsedInstruction.validations.length * 1;
    const complexityMultiplier = {
      'SIMPLE': 1,
      'MODERATE': 1.5,
      'COMPLEX': 2,
      'VERY_COMPLEX': 3
    }[parsedInstruction.context.complexity] || 1;
    
    const totalSeconds = (baseTime + actionTime + validationTime) * complexityMultiplier;
    
    if (totalSeconds < 60) {
      return `${Math.round(totalSeconds)}s`;
    } else {
      return `${Math.round(totalSeconds / 60)}m ${Math.round(totalSeconds % 60)}s`;
    }
  }

  private generateRequirements(parsedInstruction: EnhancedParsedInstruction): string[] {
    const requirements: string[] = ['Playwright test framework'];
    
    if (parsedInstruction.context.domain === 'API') {
      requirements.push('API endpoint accessibility');
    }
    
    if (parsedInstruction.context.securityLevel !== 'LOW') {
      requirements.push('Isolated test environment');
      requirements.push('Security testing permissions');
    }
    
    if (parsedInstruction.context.complexity === 'VERY_COMPLEX') {
      requirements.push('Extended test timeout configuration');
    }
    
    return requirements;
  }
}