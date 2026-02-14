/**
 * Improved Security Test Generator
 * Enhanced version with comprehensive security testing patterns
 */

import { BaseTestGenerator, TestGenerationRequest, TestGenerationResult } from '../core/BaseTestGenerator';
import { InstructionParser, ParsedInstruction } from '../core/UnifiedInstructionParser';

export interface SecurityTestRequest extends TestGenerationRequest {
  securityLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  testTypes?: ('injection' | 'auth' | 'authorization' | 'data-exposure' | 'headers' | 'csrf' | 'xss')[];
  compliance?: ('OWASP' | 'PCI-DSS' | 'GDPR' | 'SOX')[];
}

export interface SecurityTestResult extends TestGenerationResult {
  securityCategories: string[];
  vulnerabilityTests: string[];
  complianceChecks: string[];
  riskLevel: string;
  securityHeaders: string[];
  payloadTests: string[];
}

/**
 * Security-specific instruction parser
 */
class SecurityInstructionParser extends InstructionParser {
  protected domain = 'SECURITY';
  protected keywords = [
    // Core security keywords
    'security', 'auth', 'authorization', 'authentication', 'token', 'bearer',
    'invalid', 'unauthorized', 'forbidden', 'inject', 'injection', 'sql',
    'xss', 'script', 'malicious', 'payload', 'exploit', 'vulnerability',
    'header', 'x-admin', 'admin', 'privilege', 'escalation', 'bypass',
    
    // Injection attacks
    'sql injection', 'union select', 'drop table', 'or 1=1', 'script injection',
    'command injection', 'ldap injection', 'xpath injection', 'nosql injection',
    
    // Authentication & Authorization
    'login bypass', 'password reset', 'session hijacking', 'privilege escalation',
    'role bypass', 'access control', 'jwt token', 'oauth', 'saml',
    
    // Data exposure
    'sensitive data', 'personal information', 'credit card', 'ssn', 'pii',
    'data leak', 'information disclosure', 'directory traversal', 'path traversal',
    
    // Security headers
    'content security policy', 'x-frame-options', 'x-xss-protection',
    'strict-transport-security', 'x-content-type-options', 'cors',
    
    // OWASP Top 10
    'broken access control', 'cryptographic failures', 'injection',
    'insecure design', 'security misconfiguration', 'vulnerable components',
    'identification failures', 'software integrity failures',
    'security logging failures', 'server-side request forgery'
  ];

  public parseInstruction(instruction: string, url: string): ParsedInstruction {
    const commonPatterns = this.extractCommonPatterns(instruction);
    const securityPatterns = this.extractSecurityPatterns(instruction);
    
    const confidence = this.calculateConfidence(instruction, {
      ...commonPatterns,
      ...securityPatterns
    });

    return {
      actions: this.parseSecurityActions(instruction, commonPatterns.actions),
      targets: this.parseSecurityTargets(instruction, commonPatterns.targets),
      conditions: this.parseSecurityConditions(instruction, commonPatterns.conditions),
      validations: this.parseSecurityValidations(instruction, commonPatterns.validations),
      context: this.parseSecurityContext(instruction),
      confidence,
      domain: 'SECURITY',
      testSteps: this.generateSecurityTestSteps(instruction, securityPatterns),
      expectedOutcomes: this.generateSecurityOutcomes(instruction, securityPatterns)
    };
  }

  private extractSecurityPatterns(instruction: string): {
    injectionAttacks: string[];
    authenticationTests: string[];
    authorizationTests: string[];
    dataExposureTests: string[];
    headerTests: string[];
    owaspTests: string[];
  } {
    const instructionLower = instruction.toLowerCase();
    
    return {
      injectionAttacks: this.extractInjectionPatterns(instructionLower),
      authenticationTests: this.extractAuthPatterns(instructionLower),
      authorizationTests: this.extractAuthzPatterns(instructionLower),
      dataExposureTests: this.extractDataExposurePatterns(instructionLower),
      headerTests: this.extractHeaderPatterns(instructionLower),
      owaspTests: this.extractOwaspPatterns(instructionLower)
    };
  }

  private extractInjectionPatterns(instruction: string): string[] {
    const injectionPatterns = [
      /\b(sql\s+injection|union\s+select|drop\s+table|or\s+1\s*=\s*1)\b/gi,
      /\b(script\s+injection|xss|cross\s+site\s+scripting)\b/gi,
      /\b(command\s+injection|ldap\s+injection|xpath\s+injection)\b/gi,
      /\b(nosql\s+injection|mongodb\s+injection)\b/gi
    ];
    return this.extractMatches(instruction, injectionPatterns);
  }

  private extractAuthPatterns(instruction: string): string[] {
    const authPatterns = [
      /\b(login\s+bypass|authentication\s+bypass|password\s+reset)\b/gi,
      /\b(session\s+hijacking|session\s+fixation|jwt\s+token)\b/gi,
      /\b(oauth|saml|sso|single\s+sign\s+on)\b/gi
    ];
    return this.extractMatches(instruction, authPatterns);
  }

  private extractAuthzPatterns(instruction: string): string[] {
    const authzPatterns = [
      /\b(privilege\s+escalation|role\s+bypass|access\s+control)\b/gi,
      /\b(unauthorized\s+access|forbidden\s+access|admin\s+bypass)\b/gi,
      /\b(vertical\s+privilege|horizontal\s+privilege)\b/gi
    ];
    return this.extractMatches(instruction, authzPatterns);
  }

  private extractDataExposurePatterns(instruction: string): string[] {
    const dataPatterns = [
      /\b(sensitive\s+data|personal\s+information|pii|credit\s+card)\b/gi,
      /\b(data\s+leak|information\s+disclosure|directory\s+traversal)\b/gi,
      /\b(path\s+traversal|file\s+inclusion|local\s+file\s+inclusion)\b/gi
    ];
    return this.extractMatches(instruction, dataPatterns);
  }

  private extractHeaderPatterns(instruction: string): string[] {
    const headerPatterns = [
      /\b(content\s+security\s+policy|csp|x-frame-options)\b/gi,
      /\b(x-xss-protection|strict-transport-security|hsts)\b/gi,
      /\b(x-content-type-options|cors|cross\s+origin)\b/gi
    ];
    return this.extractMatches(instruction, headerPatterns);
  }

  private extractOwaspPatterns(instruction: string): string[] {
    const owaspPatterns = [
      /\b(broken\s+access\s+control|cryptographic\s+failures)\b/gi,
      /\b(insecure\s+design|security\s+misconfiguration)\b/gi,
      /\b(vulnerable\s+components|identification\s+failures)\b/gi,
      /\b(software\s+integrity\s+failures|security\s+logging\s+failures)\b/gi,
      /\b(server\s+side\s+request\s+forgery|ssrf)\b/gi
    ];
    return this.extractMatches(instruction, owaspPatterns);
  }

  private parseSecurityActions(instruction: string, commonActions: string[]): any[] {
    return commonActions.map(action => ({
      type: this.mapToSecurityAction(action),
      verb: action,
      object: this.extractActionObject(instruction, action),
      modifiers: this.extractSecurityModifiers(instruction, action),
      confidence: 0.8
    }));
  }

  private parseSecurityTargets(instruction: string, commonTargets: string[]): any[] {
    return commonTargets.map(target => ({
      type: this.mapToSecurityTarget(target),
      value: target,
      properties: this.extractSecurityProperties(instruction, target),
      confidence: 0.8
    }));
  }

  private parseSecurityConditions(instruction: string, commonConditions: string[]): any[] {
    return commonConditions.map(condition => ({
      type: 'SECURITY',
      description: condition,
      parameters: this.extractSecurityParameters(instruction, condition),
      confidence: 0.7
    }));
  }

  private parseSecurityValidations(instruction: string, commonValidations: string[]): any[] {
    return commonValidations.map(validation => ({
      type: 'SECURITY_VALIDATION',
      expectation: validation,
      criteria: this.extractSecurityCriteria(instruction, validation),
      confidence: 0.8
    }));
  }

  private parseSecurityContext(instruction: string): any {
    const instructionLower = instruction.toLowerCase();
    
    return {
      domain: 'SECURITY',
      complexity: this.determineSecurityComplexity(instruction),
      testType: ['security'],
      securityLevel: this.determineSecurityLevel(instruction),
      language: this.determineLanguage(instruction)
    };
  }

  private generateSecurityTestSteps(instruction: string, patterns: any): any[] {
    const steps: any[] = [];
    let stepNumber = 1;

    // Add baseline security setup
    steps.push({
      stepNumber: stepNumber++,
      action: 'Setup security test environment',
      details: 'Configure security testing parameters and baseline',
      expectedResult: 'Security test environment is ready',
      validations: ['Test environment is isolated', 'Security tools are configured'],
      code: `
        // Setup security test environment
        const securityConfig = {
          timeout: 30000,
          retries: 2,
          ignoreHTTPSErrors: true
        };
        await page.goto('${this.extractUrl(instruction)}', securityConfig);
      `
    });

    // Add injection attack tests if detected
    if (patterns.injectionAttacks.length > 0) {
      steps.push({
        stepNumber: stepNumber++,
        action: 'Test injection vulnerabilities',
        details: 'Attempt various injection attacks to test input validation',
        expectedResult: 'Application properly sanitizes input and blocks injection attempts',
        validations: ['SQL injection is blocked', 'XSS attempts are sanitized', 'Command injection is prevented'],
        code: this.generateInjectionTestCode(patterns.injectionAttacks)
      });
    }

    // Add authentication tests if detected
    if (patterns.authenticationTests.length > 0) {
      steps.push({
        stepNumber: stepNumber++,
        action: 'Test authentication mechanisms',
        details: 'Verify authentication security and bypass attempts',
        expectedResult: 'Authentication cannot be bypassed and is properly secured',
        validations: ['Login bypass attempts fail', 'Session management is secure', 'Password policies are enforced'],
        code: this.generateAuthTestCode(patterns.authenticationTests)
      });
    }

    // Add authorization tests if detected
    if (patterns.authorizationTests.length > 0) {
      steps.push({
        stepNumber: stepNumber++,
        action: 'Test authorization controls',
        details: 'Verify access control and privilege escalation prevention',
        expectedResult: 'Authorization controls prevent unauthorized access',
        validations: ['Privilege escalation is blocked', 'Role-based access works', 'Unauthorized endpoints are protected'],
        code: this.generateAuthzTestCode(patterns.authorizationTests)
      });
    }

    // Add security header tests if detected
    if (patterns.headerTests.length > 0) {
      steps.push({
        stepNumber: stepNumber++,
        action: 'Validate security headers',
        details: 'Check for presence and configuration of security headers',
        expectedResult: 'All required security headers are present and properly configured',
        validations: ['CSP header is present', 'X-Frame-Options is set', 'HSTS is enabled'],
        code: this.generateHeaderTestCode(patterns.headerTests)
      });
    }

    return steps;
  }

  private generateSecurityOutcomes(instruction: string, patterns: any): any[] {
    const outcomes: any[] = [];

    outcomes.push({
      type: 'SUCCESS',
      description: 'Security test passes all vulnerability checks',
      criteria: ['No critical vulnerabilities found', 'Security controls are effective', 'Compliance requirements met']
    });

    if (patterns.injectionAttacks.length > 0) {
      outcomes.push({
        type: 'SUCCESS',
        description: 'Injection attacks are properly blocked',
        criteria: ['SQL injection attempts fail', 'XSS payloads are sanitized', 'Command injection is prevented']
      });
    }

    if (patterns.authenticationTests.length > 0) {
      outcomes.push({
        type: 'SUCCESS',
        description: 'Authentication mechanisms are secure',
        criteria: ['Login bypass attempts fail', 'Session management is robust', 'Multi-factor authentication works']
      });
    }

    return outcomes;
  }

  private generateInjectionTestCode(injectionPatterns: string[]): string {
    return `
      // Test SQL Injection
      const sqlPayloads = [
        "' OR '1'='1",
        "'; DROP TABLE users; --",
        "' UNION SELECT * FROM users --"
      ];
      
      for (const payload of sqlPayloads) {
        const response = await page.request.post('/api/login', {
          data: { username: payload, password: 'test' }
        });
        // Should not return sensitive data or cause errors
        expect(response.status()).not.toBe(200);
      }
      
      // Test XSS
      const xssPayloads = [
        "<script>alert('XSS')</script>",
        "javascript:alert('XSS')",
        "<img src=x onerror=alert('XSS')>"
      ];
      
      for (const payload of xssPayloads) {
        await page.fill('input[name="search"]', payload);
        await page.click('button[type="submit"]');
        // Should not execute script
        const alertDialog = page.locator('text=XSS');
        await expect(alertDialog).not.toBeVisible();
      }
    `;
  }

  private generateAuthTestCode(authPatterns: string[]): string {
    return `
      // Test authentication bypass
      const bypassAttempts = [
        { username: 'admin', password: '' },
        { username: 'admin', password: 'admin' },
        { username: 'admin\\'--', password: 'anything' }
      ];
      
      for (const attempt of bypassAttempts) {
        const response = await page.request.post('/api/login', {
          data: attempt
        });
        // Should not allow bypass
        expect(response.status()).not.toBe(200);
      }
      
      // Test session security
      await page.goto('/login');
      await page.fill('input[name="username"]', 'testuser');
      await page.fill('input[name="password"]', 'testpass');
      await page.click('button[type="submit"]');
      
      // Check for secure session cookies
      const cookies = await page.context().cookies();
      const sessionCookie = cookies.find(c => c.name.includes('session'));
      if (sessionCookie) {
        expect(sessionCookie.secure).toBe(true);
        expect(sessionCookie.httpOnly).toBe(true);
      }
    `;
  }

  private generateAuthzTestCode(authzPatterns: string[]): string {
    return `
      // Test privilege escalation
      await page.goto('/user/profile');
      
      // Try to access admin endpoints as regular user
      const adminEndpoints = ['/admin', '/admin/users', '/admin/settings'];
      
      for (const endpoint of adminEndpoints) {
        const response = await page.request.get(endpoint);
        // Should return 403 Forbidden or redirect to login
        expect([401, 403]).toContain(response.status());
      }
      
      // Test role-based access
      const userResponse = await page.request.get('/api/user/data');
      expect(userResponse.status()).toBe(200);
      
      const adminResponse = await page.request.get('/api/admin/data');
      expect(adminResponse.status()).toBe(403);
    `;
  }

  private generateHeaderTestCode(headerPatterns: string[]): string {
    return `
      // Test security headers
      const response = await page.request.get('/');
      const headers = response.headers();
      
      // Check Content Security Policy
      expect(headers['content-security-policy']).toBeDefined();
      expect(headers['content-security-policy']).toContain("default-src 'self'");
      
      // Check X-Frame-Options
      expect(headers['x-frame-options']).toBeDefined();
      expect(['DENY', 'SAMEORIGIN']).toContain(headers['x-frame-options']);
      
      // Check X-XSS-Protection
      expect(headers['x-xss-protection']).toBeDefined();
      expect(headers['x-xss-protection']).toBe('1; mode=block');
      
      // Check Strict-Transport-Security
      if (page.url().startsWith('https://')) {
        expect(headers['strict-transport-security']).toBeDefined();
      }
      
      // Check X-Content-Type-Options
      expect(headers['x-content-type-options']).toBe('nosniff');
    `;
  }

  // Helper methods
  private mapToSecurityAction(action: string): string {
    const actionMap: Record<string, string> = {
      'send': 'SECURITY_REQUEST',
      'inject': 'INJECTION_ATTACK',
      'bypass': 'BYPASS_ATTEMPT',
      'escalate': 'PRIVILEGE_ESCALATION',
      'verify': 'SECURITY_VALIDATION',
      'test': 'SECURITY_TEST'
    };
    return actionMap[action.toLowerCase()] || 'SECURITY_ACTION';
  }

  private mapToSecurityTarget(target: string): string {
    const targetMap: Record<string, string> = {
      'login': 'AUTH_ENDPOINT',
      'api': 'API_ENDPOINT',
      'admin': 'ADMIN_ENDPOINT',
      'header': 'HTTP_HEADER',
      'cookie': 'HTTP_COOKIE',
      'session': 'SESSION_TOKEN'
    };
    return targetMap[target.toLowerCase()] || 'SECURITY_TARGET';
  }

  private extractSecurityModifiers(instruction: string, action: string): string[] {
    const modifiers: string[] = [];
    const instructionLower = instruction.toLowerCase();
    
    if (instructionLower.includes('malicious')) modifiers.push('malicious');
    if (instructionLower.includes('invalid')) modifiers.push('invalid');
    if (instructionLower.includes('unauthorized')) modifiers.push('unauthorized');
    
    return modifiers;
  }

  private extractSecurityProperties(instruction: string, target: string): Record<string, any> {
    const properties: Record<string, any> = {};
    const instructionLower = instruction.toLowerCase();
    
    if (target.toLowerCase().includes('header')) {
      properties.headerType = this.extractHeaderType(instructionLower);
    }
    if (target.toLowerCase().includes('endpoint')) {
      properties.method = this.extractHttpMethod(instructionLower);
    }
    
    return properties;
  }

  private extractSecurityParameters(instruction: string, condition: string): Record<string, any> {
    return {
      condition,
      securityContext: true,
      riskLevel: this.determineSecurityLevel(instruction)
    };
  }

  private extractSecurityCriteria(instruction: string, validation: string): string[] {
    const criteria: string[] = [];
    const instructionLower = instruction.toLowerCase();
    
    if (instructionLower.includes('block') || instructionLower.includes('prevent')) {
      criteria.push('Attack is blocked');
    }
    if (instructionLower.includes('sanitize') || instructionLower.includes('escape')) {
      criteria.push('Input is sanitized');
    }
    if (instructionLower.includes('secure') || instructionLower.includes('protect')) {
      criteria.push('Security controls are active');
    }
    
    return criteria;
  }

  private determineSecurityComplexity(instruction: string): string {
    const instructionLower = instruction.toLowerCase();
    
    if (instructionLower.includes('comprehensive') || instructionLower.includes('penetration')) {
      return 'VERY_COMPLEX';
    }
    if (instructionLower.includes('advanced') || instructionLower.includes('thorough')) {
      return 'COMPLEX';
    }
    if (instructionLower.includes('basic') || instructionLower.includes('simple')) {
      return 'SIMPLE';
    }
    return 'MODERATE';
  }

  private determineSecurityLevel(instruction: string): string {
    const instructionLower = instruction.toLowerCase();
    
    if (instructionLower.includes('critical') || instructionLower.includes('high risk')) {
      return 'CRITICAL';
    }
    if (instructionLower.includes('high') || instructionLower.includes('important')) {
      return 'HIGH';
    }
    if (instructionLower.includes('medium') || instructionLower.includes('moderate')) {
      return 'MEDIUM';
    }
    return 'LOW';
  }

  private determineLanguage(instruction: string): string {
    if (instruction.includes('OWASP') || instruction.includes('CVE-')) {
      return 'TECHNICAL';
    }
    if (instruction.includes('please') || instruction.includes('could you')) {
      return 'FORMAL';
    }
    return 'MIXED';
  }

  private extractActionObject(instruction: string, action: string): string {
    const words = instruction.split(' ');
    const actionIndex = words.findIndex(word => word.toLowerCase().includes(action.toLowerCase()));
    return actionIndex < words.length - 1 ? words[actionIndex + 1] : 'target';
  }

  private extractUrl(instruction: string): string {
    const urlMatch = instruction.match(/https?:\/\/[^\s]+/);
    return urlMatch ? urlMatch[0] : 'URL_PLACEHOLDER';
  }

  private extractHeaderType(instruction: string): string {
    if (instruction.includes('csp') || instruction.includes('content-security-policy')) return 'CSP';
    if (instruction.includes('x-frame-options')) return 'X-Frame-Options';
    if (instruction.includes('hsts') || instruction.includes('strict-transport-security')) return 'HSTS';
    return 'unknown';
  }

  private extractHttpMethod(instruction: string): string {
    const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
    const instructionUpper = instruction.toUpperCase();
    
    for (const method of methods) {
      if (instructionUpper.includes(method)) {
        return method;
      }
    }
    return 'GET';
  }

  protected extractMatches(instruction: string, patterns: RegExp[]): string[] {
    const matches: string[] = [];
    patterns.forEach(pattern => {
      const found = instruction.match(pattern);
      if (found) {
        matches.push(...found);
      }
    });
    return [...new Set(matches)];
  }
}

/**
 * Improved Security Test Generator
 */
export class ImprovedSecurityGenerator extends BaseTestGenerator {
  protected generatorType = 'SECURITY';
  private parser: SecurityInstructionParser;

  constructor() {
    super();
    this.parser = new SecurityInstructionParser();
  }

  public async generateTest(request: SecurityTestRequest): Promise<SecurityTestResult> {
    const startTime = Date.now();
    this.validateRequest(request);

    try {
      console.log('🔒 Generating improved security test...');
      
      // Parse instruction
      const parsedInstruction = this.parser.parseInstruction(request.instruction, request.url);
      console.log(`🎯 Parsed with ${parsedInstruction.confidence * 100}% confidence`);

      // Generate test code
      const testCode = this.generateSecurityTestCode(parsedInstruction, request);
      const testName = this.generateTestName(request.instruction);
      const description = this.generateTestDescription(parsedInstruction, request);

      // Extract security-specific metadata
      const securityCategories = this.extractSecurityCategories(parsedInstruction);
      const vulnerabilityTests = this.extractVulnerabilityTests(parsedInstruction);
      const complianceChecks = this.extractComplianceChecks(parsedInstruction);
      const riskLevel = this.extractRiskLevel(parsedInstruction);
      const securityHeaders = this.extractSecurityHeaders(parsedInstruction);
      const payloadTests = this.extractPayloadTests(parsedInstruction);

      const metadata = this.createBaseMetadata(startTime, parsedInstruction.confidence);
      const diagnostics = this.createBaseDiagnostics();

      // Add security-specific diagnostics
      if (parsedInstruction.confidence < 0.7) {
        diagnostics.warnings.push('Low confidence in security instruction parsing - review generated test');
      }
      if (securityCategories.length === 0) {
        diagnostics.suggestions.push('Consider specifying security test categories for more targeted testing');
      }
      if (riskLevel === 'CRITICAL') {
        diagnostics.warnings.push('Critical security test - ensure proper test environment isolation');
      }

      console.log('✅ Security test generated successfully');

      return {
        success: true,
        testCode,
        testName,
        description,
        metadata,
        diagnostics,
        securityCategories,
        vulnerabilityTests,
        complianceChecks,
        riskLevel,
        securityHeaders,
        payloadTests
      };

    } catch (error: any) {
      console.error('❌ Security test generation failed:', error.message);
      
      const metadata = this.createBaseMetadata(startTime, 0.1);
      const diagnostics = this.createBaseDiagnostics();
      diagnostics.errors.push(error.message);
      diagnostics.suggestions.push('Simplify instruction or provide more specific security requirements');

      return {
        success: false,
        testCode: this.generateFallbackTestCode(request),
        testName: 'Fallback Security Test',
        description: 'Basic security test due to parsing error',
        metadata,
        diagnostics,
        securityCategories: ['basic-security'],
        vulnerabilityTests: ['input-validation', 'authentication'],
        complianceChecks: ['OWASP-basic'],
        riskLevel: 'MEDIUM',
        securityHeaders: ['CSP', 'X-Frame-Options'],
        payloadTests: ['sql-injection', 'xss']
      };
    }
  }

  private generateSecurityTestCode(parsedInstruction: ParsedInstruction, request: SecurityTestRequest): string {
    const testSteps = parsedInstruction.testSteps;
    const url = request.url;
    
    let testCode = `import { test, expect } from '@playwright/test';

test('${this.generateTestName(request.instruction)}', async ({ page, request: apiRequest }) => {
  // Security test configuration
  const securityConfig = {
    timeout: 30000,
    retries: 2,
    ignoreHTTPSErrors: true
  };
  
  // Load the target page
  await page.goto('${url}', securityConfig);
  
`;

    // Add generated test steps
    testSteps.forEach((step, index) => {
      testCode += `  // Step ${step.stepNumber}: ${step.action}\n`;
      testCode += `  ${step.code || `// ${step.details}`}\n`;
      testCode += `  // Expected: ${step.expectedResult}\n\n`;
    });

    testCode += `});`;

    return testCode;
  }

  private generateTestName(instruction: string): string {
    const cleanInstruction = instruction.replace(/[^a-zA-Z0-9\s]/g, '').trim();
    const words = cleanInstruction.split(' ').slice(0, 6);
    return 'Security Test: ' + words.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  }

  private generateTestDescription(parsedInstruction: ParsedInstruction, request: SecurityTestRequest): string {
    const categories = this.extractSecurityCategories(parsedInstruction);
    const riskLevel = this.extractRiskLevel(parsedInstruction);
    
    let description = `Security test for ${request.url}. `;
    
    if (categories.length > 0) {
      description += `Tests: ${categories.join(', ')}. `;
    }
    
    description += `Risk Level: ${riskLevel}. `;
    description += `Generated with ${Math.round(parsedInstruction.confidence * 100)}% confidence.`;
    
    return description;
  }

  private extractSecurityCategories(parsedInstruction: ParsedInstruction): string[] {
    const categories: string[] = [];
    const instruction = JSON.stringify(parsedInstruction).toLowerCase();
    
    const categoryKeywords = {
      'injection-attacks': ['injection', 'sql', 'xss', 'script', 'command'],
      'authentication': ['auth', 'login', 'password', 'session', 'token'],
      'authorization': ['access', 'privilege', 'role', 'permission', 'admin'],
      'data-exposure': ['sensitive', 'personal', 'leak', 'disclosure', 'traversal'],
      'security-headers': ['header', 'csp', 'frame', 'transport', 'content-type'],
      'owasp-top10': ['owasp', 'broken', 'cryptographic', 'insecure', 'vulnerable']
    };

    Object.entries(categoryKeywords).forEach(([category, keywords]) => {
      if (keywords.some(keyword => instruction.includes(keyword))) {
        categories.push(category);
      }
    });

    return categories;
  }

  private extractVulnerabilityTests(parsedInstruction: ParsedInstruction): string[] {
    const tests: string[] = [];
    const instruction = JSON.stringify(parsedInstruction).toLowerCase();
    
    const vulnerabilityMap = {
      'sql-injection': ['sql', 'union', 'drop', 'select'],
      'xss': ['xss', 'script', 'javascript', 'alert'],
      'csrf': ['csrf', 'cross-site', 'request', 'forgery'],
      'authentication-bypass': ['bypass', 'login', 'auth'],
      'privilege-escalation': ['escalation', 'privilege', 'admin', 'role'],
      'directory-traversal': ['traversal', 'path', 'directory', '../'],
      'session-hijacking': ['session', 'hijack', 'cookie', 'token']
    };

    Object.entries(vulnerabilityMap).forEach(([test, keywords]) => {
      if (keywords.some(keyword => instruction.includes(keyword))) {
        tests.push(test);
      }
    });

    return tests;
  }

  private extractComplianceChecks(parsedInstruction: ParsedInstruction): string[] {
    const checks: string[] = [];
    const instruction = JSON.stringify(parsedInstruction).toLowerCase();
    
    if (instruction.includes('owasp')) checks.push('OWASP-Top-10');
    if (instruction.includes('pci')) checks.push('PCI-DSS');
    if (instruction.includes('gdpr')) checks.push('GDPR');
    if (instruction.includes('sox')) checks.push('SOX');
    if (instruction.includes('iso')) checks.push('ISO-27001');
    
    return checks.length > 0 ? checks : ['OWASP-Basic'];
  }

  private extractRiskLevel(parsedInstruction: ParsedInstruction): string {
    const context = parsedInstruction.context;
    return context.securityLevel || 'MEDIUM';
  }

  private extractSecurityHeaders(parsedInstruction: ParsedInstruction): string[] {
    const headers: string[] = [];
    const instruction = JSON.stringify(parsedInstruction).toLowerCase();
    
    const headerMap = {
      'CSP': ['csp', 'content-security-policy'],
      'X-Frame-Options': ['frame', 'x-frame-options'],
      'HSTS': ['hsts', 'strict-transport-security'],
      'X-XSS-Protection': ['xss-protection', 'x-xss-protection'],
      'X-Content-Type-Options': ['content-type-options', 'nosniff'],
      'CORS': ['cors', 'cross-origin']
    };

    Object.entries(headerMap).forEach(([header, keywords]) => {
      if (keywords.some(keyword => instruction.includes(keyword))) {
        headers.push(header);
      }
    });

    return headers.length > 0 ? headers : ['CSP', 'X-Frame-Options', 'HSTS'];
  }

  private extractPayloadTests(parsedInstruction: ParsedInstruction): string[] {
    const payloads: string[] = [];
    const instruction = JSON.stringify(parsedInstruction).toLowerCase();
    
    const payloadMap = {
      'sql-injection': ['sql', 'union', 'drop'],
      'xss': ['xss', 'script', 'javascript'],
      'command-injection': ['command', 'shell', 'exec'],
      'ldap-injection': ['ldap'],
      'xpath-injection': ['xpath'],
      'nosql-injection': ['nosql', 'mongodb']
    };

    Object.entries(payloadMap).forEach(([payload, keywords]) => {
      if (keywords.some(keyword => instruction.includes(keyword))) {
        payloads.push(payload);
      }
    });

    return payloads.length > 0 ? payloads : ['sql-injection', 'xss'];
  }

  private generateFallbackTestCode(request: SecurityTestRequest): string {
    return `import { test, expect } from '@playwright/test';

test('Basic Security Test', async ({ page, request: apiRequest }) => {
  await page.goto('${request.url}');
  
  // Basic security header checks
  const response = await apiRequest.get('${request.url}');
  const headers = response.headers();
  
  // Check for basic security headers
  expect(headers['x-frame-options']).toBeDefined();
  expect(headers['x-content-type-options']).toBe('nosniff');
  
  // Basic XSS test
  await page.fill('input[type="text"]', '<script>alert("XSS")</script>');
  await page.click('button[type="submit"]');
  
  // Should not execute script
  const alertDialog = page.locator('text=XSS');
  await expect(alertDialog).not.toBeVisible();
});`;
  }
}