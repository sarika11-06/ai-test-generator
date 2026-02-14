/**
 * Security Test Generator Test Suite
 * Comprehensive tests for the security test generation system
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SecurityTestGenerator } from '../securityTestGenerator';
import { SecurityIntentClassifier } from '../securityIntentClassifier';

describe('SecurityTestGenerator', () => {
  let generator: SecurityTestGenerator;

  beforeEach(() => {
    generator = new SecurityTestGenerator();
  });

  describe('SQL Injection Tests', () => {
    it('should generate SQL injection prevention test', async () => {
      const request = {
        url: 'https://reqres.in/api/login',
        instruction: "Send login request with SQL injection password \"' OR 1=1 --\" and verify login fails with error message"
      };

      const result = await generator.generateSecurityTest(request);

      expect(result.success).toBe(true);
      expect(result.classification.intent).toBe('SEC_INJ');
      expect(result.classification.confidence).toBeGreaterThan(0.5);
      expect(result.generatedTest.testCode).toContain("' OR 1=1 --");
      expect(result.generatedTest.testCode).toContain('expect(statusCode').toContain('not.toBe(200)');
      expect(result.generatedTest.assertions).toContain('Status code is not 200');
    });

    it('should detect XSS injection attempts', async () => {
      const request = {
        url: 'https://api.example.com/comments',
        instruction: 'Submit comment with XSS script tag and verify it is rejected'
      };

      const result = await generator.generateSecurityTest(request);

      expect(result.success).toBe(true);
      expect(result.classification.intent).toBe('SEC_INJ');
      expect(result.classification.matchedKeywords).toContain('script');
    });
  });

  describe('Authentication Security Tests', () => {
    it('should generate authentication failure test', async () => {
      const request = {
        url: 'https://reqres.in/api/login',
        instruction: 'Send login request without password and verify authentication fails'
      };

      const result = await generator.generateSecurityTest(request);

      expect(result.success).toBe(true);
      expect(result.classification.intent).toBe('SEC_AUTH');
      expect(result.generatedTest.testCode).toContain('authentication');
      expect(result.generatedTest.assertions).toContain('authentication is properly validated');
    });

    it('should test invalid credentials', async () => {
      const request = {
        url: 'https://reqres.in/api/login',
        instruction: 'Login with invalid credentials and verify error response'
      };

      const result = await generator.generateSecurityTest(request);

      expect(result.success).toBe(true);
      expect(result.classification.intent).toBe('SEC_AUTH');
      expect(result.testData.inputData).toHaveProperty('email');
      expect(result.testData.inputData).toHaveProperty('password');
    });
  });

  describe('Authorization Tests', () => {
    it('should generate unauthorized access test', async () => {
      const request = {
        url: 'https://reqres.in/api/users/2',
        instruction: 'Access user details without authentication token and verify access is denied',
        method: 'GET'
      };

      const result = await generator.generateSecurityTest(request);

      expect(result.success).toBe(true);
      expect(result.classification.intent).toBe('SEC_AUTHZ');
      expect(result.generatedTest.testCode).toContain('[401, 403]');
      expect(result.generatedTest.assertions).toContain('Access properly denied');
    });
  });

  describe('Sensitive Data Exposure Tests', () => {
    it('should generate data exposure prevention test', async () => {
      const request = {
        url: 'https://reqres.in/api/users/2',
        instruction: 'Fetch user profile and verify password is not returned in response',
        method: 'GET'
      };

      const result = await generator.generateSecurityTest(request);

      expect(result.success).toBe(true);
      expect(result.classification.intent).toBe('SEC_DATA');
      expect(result.generatedTest.testCode).toContain('not.toHaveProperty(\'password\')');
      expect(result.generatedTest.assertions).toContain('No password fields exposed');
    });
  });

  describe('Security Headers Tests', () => {
    it('should generate security headers validation test', async () => {
      const request = {
        url: 'https://reqres.in/api/users',
        instruction: 'Check that security headers like X-Frame-Options are present',
        method: 'GET'
      };

      const result = await generator.generateSecurityTest(request);

      expect(result.success).toBe(true);
      expect(result.classification.intent).toBe('SEC_HEADER');
      expect(result.generatedTest.testCode).toContain('x-frame-options');
      expect(result.generatedTest.assertions).toContain('X-Frame-Options present');
    });
  });

  describe('HTTP Method Security Tests', () => {
    it('should generate method misuse test', async () => {
      const request = {
        url: 'https://reqres.in/api/login',
        instruction: 'Try to login using GET method instead of POST and verify it is rejected'
      };

      const result = await generator.generateSecurityTest(request);

      expect(result.success).toBe(true);
      expect(result.classification.intent).toBe('SEC_METHOD');
      expect(result.generatedTest.testCode).toContain('inappropriateMethods');
      expect(result.generatedTest.assertions).toContain('Inappropriate methods rejected');
    });
  });

  describe('Rate Limiting Tests', () => {
    it('should generate rate limiting test', async () => {
      const request = {
        url: 'https://reqres.in/api/login',
        instruction: 'Send multiple rapid login requests and verify rate limiting is enforced'
      };

      const result = await generator.generateSecurityTest(request);

      expect(result.success).toBe(true);
      expect(result.classification.intent).toBe('SEC_RATE');
      expect(result.generatedTest.testCode).toContain('multiple rapid requests');
      expect(result.generatedTest.assertions).toContain('Rate limiting enforced');
    });
  });

  describe('Test Suite Generation', () => {
    it('should generate comprehensive security test suite', async () => {
      const instructions = [
        "Send login with SQL injection and verify it fails",
        "Access user data without token and verify access denied",
        "Check password is not exposed in user profile response",
        "Verify security headers are present"
      ];

      const results = await generator.generateSecurityTestSuite(
        'https://reqres.in/api',
        instructions
      );

      expect(results).toHaveLength(4);
      expect(results.every(r => r.success)).toBe(true);
      
      const intents = results.map(r => r.classification.intent);
      expect(intents).toContain('SEC_INJ');
      expect(intents).toContain('SEC_AUTHZ');
      expect(intents).toContain('SEC_DATA');
      expect(intents).toContain('SEC_HEADER');
    });
  });

  describe('Security Coverage Analysis', () => {
    it('should analyze security coverage and identify gaps', async () => {
      const results = [
        await generator.generateSecurityTest({
          url: 'https://reqres.in/api/login',
          instruction: 'Test SQL injection prevention'
        }),
        await generator.generateSecurityTest({
          url: 'https://reqres.in/api/login',
          instruction: 'Test authentication without password'
        })
      ];

      const analysis = generator.analyzeSecurityCoverage(results);

      expect(analysis.coverage).toHaveProperty('SEC_INJ');
      expect(analysis.coverage).toHaveProperty('SEC_AUTH');
      expect(analysis.gaps).toContain('Authorization');
      expect(analysis.recommendations).toContain('Add tests for: Authorization, Sensitive Data Exposure, Security Headers, HTTP Method Misuse, Rate Limiting/Abuse');
    });
  });

  describe('Input Validation', () => {
    it('should validate required fields', async () => {
      const request = {
        url: '',
        instruction: ''
      };

      const result = await generator.generateSecurityTest(request);

      expect(result.success).toBe(false);
      expect(result.validationResults.issues).toContain('URL is required for security test generation');
    });

    it('should validate URL format', async () => {
      const request = {
        url: 'invalid-url',
        instruction: 'Test something'
      };

      const result = await generator.generateSecurityTest(request);

      expect(result.success).toBe(false);
      expect(result.validationResults.issues[0]).toContain('Invalid URL format');
    });

    it('should validate instruction length', async () => {
      const request = {
        url: 'https://reqres.in/api/login',
        instruction: 'short'
      };

      const result = await generator.generateSecurityTest(request);

      expect(result.success).toBe(false);
      expect(result.validationResults.issues[0]).toContain('too short');
    });
  });

  describe('Security Context Validation', () => {
    it('should validate security context in instructions', () => {
      const classifier = new SecurityIntentClassifier();
      
      const validInstruction = 'Send login request with SQL injection and verify it fails';
      const invalidInstruction = 'Just send a request to the API';

      const validResult = classifier.validateSecurityContext(validInstruction);
      const invalidResult = classifier.validateSecurityContext(invalidInstruction);

      expect(validResult.isValid).toBe(true);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.issues).toContain('No security-specific keywords detected');
    });
  });

  describe('Generated Test Code Quality', () => {
    it('should generate syntactically correct Playwright code', async () => {
      const request = {
        url: 'https://reqres.in/api/login',
        instruction: 'Test SQL injection prevention with malicious password'
      };

      const result = await generator.generateSecurityTest(request);

      expect(result.success).toBe(true);
      
      const code = result.generatedTest.testCode;
      
      // Check for proper imports
      expect(code).toContain("import { test, expect } from '@playwright/test'");
      
      // Check for proper test structure
      expect(code).toContain('test(');
      expect(code).toContain('async ({ request })');
      
      // Check for proper assertions
      expect(code).toContain('expect(');
      
      // Check for console logging
      expect(code).toContain('console.log(');
      
      // Verify no syntax errors in basic structure
      expect(code).toMatch(/test\([^)]+,\s*async\s*\(\s*{\s*request\s*}\s*\)\s*=>\s*{/);
    });

    it('should include proper error handling', async () => {
      const request = {
        url: 'https://reqres.in/api/login',
        instruction: 'Test authentication failure handling'
      };

      const result = await generator.generateSecurityTest(request);

      expect(result.success).toBe(true);
      expect(result.generatedTest.testCode).toContain('.catch(');
    });
  });

  describe('Metadata and Documentation', () => {
    it('should include comprehensive metadata', async () => {
      const request = {
        url: 'https://reqres.in/api/login',
        instruction: 'Test SQL injection prevention'
      };

      const result = await generator.generateSecurityTest(request);

      expect(result.success).toBe(true);
      expect(result.metadata).toHaveProperty('generatedAt');
      expect(result.metadata).toHaveProperty('processingTime');
      expect(result.metadata).toHaveProperty('confidence');
      expect(result.generatedTest.metadata).toHaveProperty('intent');
      expect(result.generatedTest.metadata).toHaveProperty('securityType');
      expect(result.generatedTest.metadata).toHaveProperty('riskLevel');
    });

    it('should generate proper test documentation', async () => {
      const request = {
        url: 'https://reqres.in/api/login',
        instruction: 'Test SQL injection prevention'
      };

      const result = await generator.generateSecurityTest(request);

      expect(result.success).toBe(true);
      expect(result.generatedTest.description).toContain('injection prevention');
      expect(result.testData.testSteps).toBeInstanceOf(Array);
      expect(result.testData.testSteps.length).toBeGreaterThan(0);
    });
  });
});