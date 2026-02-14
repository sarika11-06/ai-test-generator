/**
 * Unit Tests for Instruction Parser Enhancements
 * 
 * Tests for parseAPIInstructionEnhanced function that extracts:
 * - Ordered actions from instructions
 * - Authentication requirements
 * - Test metadata (title, description, category)
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */

import { describe, it, expect } from '@jest/globals';
import {
  parseAPIInstructionEnhanced,
  type ParsedAPIInstruction,
  type InstructionAction,
} from '../apiPlaywrightCodeGenerator';

describe('Instruction Parser - Action Extraction', () => {
  it('should extract send_request action from "Send GET request"', () => {
    const instruction = 'Send a GET request to "https://api.example.com/users"';
    const parsed = parseAPIInstructionEnhanced(instruction, 'https://api.example.com/users');
    
    expect(parsed.actions).toBeDefined();
    expect(parsed.actions.length).toBeGreaterThan(0);
    
    const sendAction = parsed.actions.find(a => a.type === 'send_request');
    expect(sendAction).toBeDefined();
    expect(sendAction?.description).toContain('Send GET request');
  });

  it('should extract store_response action from "Store response status code"', () => {
    const instruction = `Send a GET request to "https://api.example.com/users"
Store the response status code`;
    const parsed = parseAPIInstructionEnhanced(instruction, 'https://api.example.com/users');
    
    const storeAction = parsed.actions.find(a => a.type === 'store_response' && a.field === 'statusCode');
    expect(storeAction).toBeDefined();
    expect(storeAction?.description).toContain('Store response status code');
  });

  it('should extract read_field action from "Read userId field"', () => {
    const instruction = `Send a GET request to "https://api.example.com/users"
Read userId field`;
    const parsed = parseAPIInstructionEnhanced(instruction, 'https://api.example.com/users');
    
    const readAction = parsed.actions.find(a => a.type === 'read_field');
    expect(readAction).toBeDefined();
    expect(readAction?.field).toBe('userId');
    expect(readAction?.description).toContain('userId');
  });

  it('should extract count action from "Count objects"', () => {
    const instruction = `Send a GET request to "https://api.example.com/users"
Count the number of objects`;
    const parsed = parseAPIInstructionEnhanced(instruction, 'https://api.example.com/users');
    
    const countAction = parsed.actions.find(a => a.type === 'count');
    expect(countAction).toBeDefined();
    expect(countAction?.description).toContain('Count');
  });

  it('should extract verify action from "Verify status code"', () => {
    const instruction = `Send a GET request to "https://api.example.com/users"
Verify status code equals 200`;
    const parsed = parseAPIInstructionEnhanced(instruction, 'https://api.example.com/users');
    
    const verifyAction = parsed.actions.find(a => a.type === 'verify');
    expect(verifyAction).toBeDefined();
    expect(verifyAction?.description).toContain('Verify');
  });

  it('should preserve action order from instruction', () => {
    const instruction = `Send a GET request to "https://api.example.com/users"
Store the response status code
Read userId field
Count the number of objects
Verify status code equals 200`;
    const parsed = parseAPIInstructionEnhanced(instruction, 'https://api.example.com/users');
    
    expect(parsed.actions.length).toBeGreaterThanOrEqual(5);
    
    // Verify order: send_request should come first
    expect(parsed.actions[0].type).toBe('send_request');
    
    // Find indices of each action type
    const sendIndex = parsed.actions.findIndex(a => a.type === 'send_request');
    const storeIndex = parsed.actions.findIndex(a => a.type === 'store_response');
    const readIndex = parsed.actions.findIndex(a => a.type === 'read_field');
    const countIndex = parsed.actions.findIndex(a => a.type === 'count');
    const verifyIndex = parsed.actions.findIndex(a => a.type === 'verify');
    
    // Verify order matches instruction
    expect(sendIndex).toBeLessThan(storeIndex);
    expect(storeIndex).toBeLessThan(readIndex);
    expect(readIndex).toBeLessThan(countIndex);
    expect(countIndex).toBeLessThan(verifyIndex);
  });
});

describe('Instruction Parser - Authentication Detection', () => {
  it('should detect "with authentication" keyword', () => {
    const instruction = 'Send a GET request to "https://api.example.com/users" with authentication';
    const parsed = parseAPIInstructionEnhanced(instruction, 'https://api.example.com/users');
    
    expect(parsed.requiresAuth).toBe(true);
  });

  it('should detect "with token" keyword', () => {
    const instruction = 'Send a GET request to "https://api.example.com/users" with token';
    const parsed = parseAPIInstructionEnhanced(instruction, 'https://api.example.com/users');
    
    expect(parsed.requiresAuth).toBe(true);
  });

  it('should detect "Bearer token" keyword', () => {
    const instruction = 'Send a GET request to "https://api.example.com/users" using Bearer token';
    const parsed = parseAPIInstructionEnhanced(instruction, 'https://api.example.com/users');
    
    expect(parsed.requiresAuth).toBe(true);
  });

  it('should not set requiresAuth when no auth keywords present', () => {
    const instruction = 'Send a GET request to "https://api.example.com/users"';
    const parsed = parseAPIInstructionEnhanced(instruction, 'https://api.example.com/users');
    
    expect(parsed.requiresAuth).toBe(false);
  });
});

describe('Instruction Parser - Test Metadata Extraction', () => {
  it('should extract endpoint for title', () => {
    const instruction = 'Send a GET request to "https://api.example.com/users"';
    const parsed = parseAPIInstructionEnhanced(instruction, 'https://api.example.com/users');
    
    expect(parsed.testMetadata.title).toContain('GET');
    expect(parsed.testMetadata.title).toContain('/users');
  });

  it('should extract method for title', () => {
    const instruction = 'Send a POST request to "https://api.example.com/users"';
    const parsed = parseAPIInstructionEnhanced(instruction, 'https://api.example.com/users');
    
    expect(parsed.testMetadata.title).toContain('POST');
  });

  it('should generate description from instruction summary', () => {
    const instruction = 'Send a GET request to "https://api.example.com/users"';
    const parsed = parseAPIInstructionEnhanced(instruction, 'https://api.example.com/users');
    
    expect(parsed.testMetadata.description).toBeDefined();
    expect(parsed.testMetadata.description.length).toBeGreaterThan(0);
  });

  it('should categorize as Smoke for basic functionality', () => {
    const instruction = 'Send a GET request to "https://api.example.com/users"';
    const parsed = parseAPIInstructionEnhanced(instruction, 'https://api.example.com/users');
    
    expect(parsed.testMetadata.category).toBe('Smoke');
  });

  it('should categorize as Performance when measuring time', () => {
    const instruction = 'Send a GET request to "https://api.example.com/users" and measure response time';
    const parsed = parseAPIInstructionEnhanced(instruction, 'https://api.example.com/users');
    
    expect(parsed.testMetadata.category).toBe('Performance');
  });

  it('should categorize as Regression for error handling', () => {
    const instruction = 'Send a GET request to "https://api.example.com/users" and verify error handling';
    const parsed = parseAPIInstructionEnhanced(instruction, 'https://api.example.com/users');
    
    expect(parsed.testMetadata.category).toBe('Regression');
  });

  it('should categorize as Security for authentication tests', () => {
    const instruction = 'Send a GET request to "https://api.example.com/users" with authentication';
    const parsed = parseAPIInstructionEnhanced(instruction, 'https://api.example.com/users');
    
    expect(parsed.testMetadata.category).toBe('Security');
  });
});

describe('Instruction Parser - Complex Instructions', () => {
  it('should handle multi-line instructions with multiple actions', () => {
    const instruction = `Send a POST request to "https://api.example.com/users"
Store the response status code
Store response body
Read userId field
Read name field
Expect userId type is number
Verify status code equals 201`;
    
    const parsed = parseAPIInstructionEnhanced(instruction, 'https://api.example.com/users');
    
    expect(parsed.method).toBe('POST');
    expect(parsed.actions.length).toBeGreaterThanOrEqual(5);
    expect(parsed.assertions.length).toBeGreaterThan(0);
  });

  it('should extract URL from quoted string in instruction', () => {
    const instruction = 'Send a GET request to "https://jsonplaceholder.typicode.com/posts"';
    const parsed = parseAPIInstructionEnhanced(instruction, 'https://api.example.com');
    
    // Should use URL from instruction, not the parameter
    expect(parsed.url).toBe('https://jsonplaceholder.typicode.com/posts');
  });

  it('should parse endpoint and baseUrl correctly', () => {
    const instruction = 'Send a GET request to "https://api.example.com/v1/users"';
    const parsed = parseAPIInstructionEnhanced(instruction, 'https://api.example.com/v1/users');
    
    expect(parsed.baseUrl).toBe('https://api.example.com');
    expect(parsed.endpoint).toBe('/v1/users');
  });
});
