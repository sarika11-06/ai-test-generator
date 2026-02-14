/**
 * Unit Tests for Precondition Generation
 * 
 * Tests for generatePreconditionsFromInstruction function that:
 * - Includes relevant preconditions
 * - Excludes irrelevant preconditions
 * - Handles authentication preconditions correctly
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { describe, it, expect } from '@jest/globals';
import {
  generatePreconditionsFromInstruction,
  generateInstructionBasedTestCase,
} from '../instructionBasedAPIGenerator';
import {
  parseAPIInstructionEnhanced,
  type ParsedAPIInstruction,
} from '../apiPlaywrightCodeGenerator';

describe('Precondition Generation - Relevant Preconditions', () => {
  it('should always include "API server is running and accessible"', () => {
    const instruction = 'Send a GET request to "https://api.example.com/users"';
    const parsed = parseAPIInstructionEnhanced(instruction, 'https://api.example.com/users');
    const preconditions = generatePreconditionsFromInstruction(parsed);
    
    expect(preconditions).toContain('API server is running and accessible');
  });

  it('should always include "Endpoint [endpoint] is accessible"', () => {
    const instruction = 'Send a GET request to "https://api.example.com/users"';
    const parsed = parseAPIInstructionEnhanced(instruction, 'https://api.example.com/users');
    const preconditions = generatePreconditionsFromInstruction(parsed);
    
    const endpointPrecondition = preconditions.find(p => p.includes('Endpoint') && p.includes('accessible'));
    expect(endpointPrecondition).toBeDefined();
    expect(endpointPrecondition).toContain('/users');
  });

  it('should include authentication precondition when requiresAuth is true', () => {
    const instruction = 'Send a GET request to "https://api.example.com/users" with authentication';
    const parsed = parseAPIInstructionEnhanced(instruction, 'https://api.example.com/users');
    const preconditions = generatePreconditionsFromInstruction(parsed);
    
    expect(parsed.requiresAuth).toBe(true);
    expect(preconditions).toContain('Valid authentication token is available');
  });

  it('should include data precondition for POST requests', () => {
    const instruction = 'Send a POST request to "https://api.example.com/users"';
    const parsed = parseAPIInstructionEnhanced(instruction, 'https://api.example.com/users');
    const preconditions = generatePreconditionsFromInstruction(parsed);
    
    expect(preconditions).toContain('Test data is prepared');
  });

  it('should include data precondition for PUT requests', () => {
    const instruction = 'Send a PUT request to "https://api.example.com/users/1"';
    const parsed = parseAPIInstructionEnhanced(instruction, 'https://api.example.com/users/1');
    const preconditions = generatePreconditionsFromInstruction(parsed);
    
    expect(preconditions).toContain('Test data is prepared');
  });

  it('should include data precondition for PATCH requests', () => {
    const instruction = 'Send a PATCH request to "https://api.example.com/users/1"';
    const parsed = parseAPIInstructionEnhanced(instruction, 'https://api.example.com/users/1');
    const preconditions = generatePreconditionsFromInstruction(parsed);
    
    expect(preconditions).toContain('Test data is prepared');
  });
});

describe('Precondition Generation - Irrelevant Preconditions', () => {
  it('should not include authentication precondition when requiresAuth is false', () => {
    const instruction = 'Send a GET request to "https://api.example.com/users"';
    const parsed = parseAPIInstructionEnhanced(instruction, 'https://api.example.com/users');
    const preconditions = generatePreconditionsFromInstruction(parsed);
    
    expect(parsed.requiresAuth).toBe(false);
    expect(preconditions).not.toContain('Valid authentication token is available');
  });

  it('should not include data precondition for GET requests', () => {
    const instruction = 'Send a GET request to "https://api.example.com/users"';
    const parsed = parseAPIInstructionEnhanced(instruction, 'https://api.example.com/users');
    const preconditions = generatePreconditionsFromInstruction(parsed);
    
    expect(preconditions).not.toContain('Test data is prepared');
  });

  it('should not include data precondition for DELETE requests', () => {
    const instruction = 'Send a DELETE request to "https://api.example.com/users/1"';
    const parsed = parseAPIInstructionEnhanced(instruction, 'https://api.example.com/users/1');
    const preconditions = generatePreconditionsFromInstruction(parsed);
    
    expect(preconditions).not.toContain('Test data is prepared');
  });

  it('should not include generic unrelated preconditions', () => {
    const instruction = 'Send a GET request to "https://api.example.com/users"';
    const parsed = parseAPIInstructionEnhanced(instruction, 'https://api.example.com/users');
    const preconditions = generatePreconditionsFromInstruction(parsed);
    
    // Should not include preconditions unrelated to the instruction
    expect(preconditions.every(p => 
      p.includes('API') || 
      p.includes('Endpoint') || 
      p.includes('authentication') || 
      p.includes('data')
    )).toBe(true);
    
    // Should not have vague preconditions
    expect(preconditions.some(p => p.includes('System is ready'))).toBe(false);
    expect(preconditions.some(p => p.includes('User is logged in'))).toBe(false);
  });
});

describe('Precondition Generation - Authentication Logic', () => {
  it('should include auth precondition for "with authentication" keyword', () => {
    const instruction = 'Send a GET request to "https://api.example.com/users" with authentication';
    const parsed = parseAPIInstructionEnhanced(instruction, 'https://api.example.com/users');
    const preconditions = generatePreconditionsFromInstruction(parsed);
    
    expect(preconditions).toContain('Valid authentication token is available');
  });

  it('should include auth precondition for "with token" keyword', () => {
    const instruction = 'Send a GET request to "https://api.example.com/users" with token';
    const parsed = parseAPIInstructionEnhanced(instruction, 'https://api.example.com/users');
    const preconditions = generatePreconditionsFromInstruction(parsed);
    
    expect(preconditions).toContain('Valid authentication token is available');
  });

  it('should include auth precondition for "Bearer token" keyword', () => {
    const instruction = 'Send a GET request to "https://api.example.com/users" using Bearer token';
    const parsed = parseAPIInstructionEnhanced(instruction, 'https://api.example.com/users');
    const preconditions = generatePreconditionsFromInstruction(parsed);
    
    expect(preconditions).toContain('Valid authentication token is available');
  });

  it('should not include auth precondition when no auth keywords present', () => {
    const instruction = 'Send a GET request to "https://api.example.com/users"';
    const parsed = parseAPIInstructionEnhanced(instruction, 'https://api.example.com/users');
    const preconditions = generatePreconditionsFromInstruction(parsed);
    
    expect(preconditions).not.toContain('Valid authentication token is available');
  });
});

describe('Precondition Generation - Integration with Test Case', () => {
  it('should generate test case with correct preconditions', () => {
    const instruction = 'Send a GET request to "https://api.example.com/users"';
    const parsed = parseAPIInstructionEnhanced(instruction, 'https://api.example.com/users');
    const testCase = generateInstructionBasedTestCase(parsed);
    
    expect(testCase.preconditions).toBeDefined();
    expect(Array.isArray(testCase.preconditions)).toBe(true);
    expect(testCase.preconditions.length).toBeGreaterThan(0);
    
    // Should have base preconditions
    expect(testCase.preconditions).toContain('API server is running and accessible');
  });

  it('should generate test case with auth precondition when needed', () => {
    const instruction = 'Send a GET request to "https://api.example.com/users" with authentication';
    const parsed = parseAPIInstructionEnhanced(instruction, 'https://api.example.com/users');
    const testCase = generateInstructionBasedTestCase(parsed);
    
    expect(testCase.preconditions).toContain('Valid authentication token is available');
  });

  it('should generate test case with data precondition for POST', () => {
    const instruction = 'Send a POST request to "https://api.example.com/users"';
    const parsed = parseAPIInstructionEnhanced(instruction, 'https://api.example.com/users');
    const testCase = generateInstructionBasedTestCase(parsed);
    
    expect(testCase.preconditions).toContain('Test data is prepared');
  });
});

describe('Precondition Generation - Complex Scenarios', () => {
  it('should include both auth and data preconditions for authenticated POST', () => {
    const instruction = 'Send a POST request to "https://api.example.com/users" with authentication';
    const parsed = parseAPIInstructionEnhanced(instruction, 'https://api.example.com/users');
    const preconditions = generatePreconditionsFromInstruction(parsed);
    
    expect(preconditions).toContain('Valid authentication token is available');
    expect(preconditions).toContain('Test data is prepared');
    expect(preconditions).toContain('API server is running and accessible');
  });

  it('should generate minimal preconditions for simple GET', () => {
    const instruction = 'Send a GET request to "https://api.example.com/users"';
    const parsed = parseAPIInstructionEnhanced(instruction, 'https://api.example.com/users');
    const preconditions = generatePreconditionsFromInstruction(parsed);
    
    // Should only have 2 preconditions for simple GET (server + endpoint)
    expect(preconditions.length).toBe(2);
    expect(preconditions).toContain('API server is running and accessible');
    expect(preconditions.some(p => p.includes('Endpoint') && p.includes('accessible'))).toBe(true);
  });

  it('should handle different endpoints correctly', () => {
    const instruction1 = 'Send a GET request to "https://api.example.com/users"';
    const instruction2 = 'Send a GET request to "https://api.example.com/products"';
    
    const parsed1 = parseAPIInstructionEnhanced(instruction1, 'https://api.example.com/users');
    const parsed2 = parseAPIInstructionEnhanced(instruction2, 'https://api.example.com/products');
    
    const preconditions1 = generatePreconditionsFromInstruction(parsed1);
    const preconditions2 = generatePreconditionsFromInstruction(parsed2);
    
    // Should have different endpoint preconditions
    expect(preconditions1.some(p => p.includes('/users'))).toBe(true);
    expect(preconditions2.some(p => p.includes('/products'))).toBe(true);
  });
});

describe('Precondition Generation - Edge Cases', () => {
  it('should handle missing endpoint gracefully', () => {
    const parsed: ParsedAPIInstruction = {
      method: 'GET',
      url: 'https://api.example.com',
      endpoint: '',
      baseUrl: 'https://api.example.com',
      actions: [],
      assertions: [],
      requiresAuth: false,
      testMetadata: {
        title: 'GET test',
        description: 'Test',
        category: 'Smoke',
      },
    };
    
    const preconditions = generatePreconditionsFromInstruction(parsed);
    
    expect(preconditions).toBeDefined();
    expect(Array.isArray(preconditions)).toBe(true);
    expect(preconditions.length).toBeGreaterThan(0);
  });

  it('should return array even for minimal instruction', () => {
    const instruction = 'Send a GET request';
    const parsed = parseAPIInstructionEnhanced(instruction, 'https://api.example.com');
    const preconditions = generatePreconditionsFromInstruction(parsed);
    
    expect(Array.isArray(preconditions)).toBe(true);
    expect(preconditions.length).toBeGreaterThan(0);
  });
});
