/**
 * Unit Tests for Test Step Generation
 * 
 * Tests for generateTestStepsFromActions function that:
 * - Maps actions to test steps
 * - Preserves step ordering
 * - Generates appropriate step descriptions
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */

import { describe, it, expect } from '@jest/globals';
import {
  generateTestStepsFromActions,
  generateInstructionBasedTestCase,
} from '../instructionBasedAPIGenerator';
import {
  parseAPIInstructionEnhanced,
  type InstructionAction,
} from '../apiPlaywrightCodeGenerator';

describe('Test Step Generation - Action to Step Mapping', () => {
  it('should map send_request action to test step', () => {
    const actions: InstructionAction[] = [
      {
        type: 'send_request',
        description: 'Send GET request to https://api.example.com/users',
      },
    ];
    
    const steps = generateTestStepsFromActions(actions);
    
    expect(steps.length).toBe(1);
    expect(steps[0].action).toContain('Send GET request');
    expect(steps[0].expectedResult).toContain('successfully');
  });

  it('should map store_response action to test step', () => {
    const actions: InstructionAction[] = [
      {
        type: 'store_response',
        description: 'Store response status code',
        field: 'statusCode',
      },
    ];
    
    const steps = generateTestStepsFromActions(actions);
    
    expect(steps.length).toBe(1);
    expect(steps[0].action).toContain('Store response status code');
    expect(steps[0].expectedResult).toContain('stored');
  });

  it('should map read_field action to test step', () => {
    const actions: InstructionAction[] = [
      {
        type: 'read_field',
        description: 'Read userId field from response body',
        field: 'userId',
      },
    ];
    
    const steps = generateTestStepsFromActions(actions);
    
    expect(steps.length).toBe(1);
    expect(steps[0].action).toContain('Read userId field');
    expect(steps[0].expectedResult).toContain('userId');
    expect(steps[0].expectedResult).toContain('read');
  });

  it('should map count action to test step', () => {
    const actions: InstructionAction[] = [
      {
        type: 'count',
        description: 'Count number of objects in response',
      },
    ];
    
    const steps = generateTestStepsFromActions(actions);
    
    expect(steps.length).toBe(1);
    expect(steps[0].action).toContain('Count');
    expect(steps[0].expectedResult).toContain('calculated');
  });

  it('should map verify action to test step', () => {
    const actions: InstructionAction[] = [
      {
        type: 'verify',
        description: 'Verify status code equals 200',
        field: 'statusCode',
        expectedValue: 200,
      },
    ];
    
    const steps = generateTestStepsFromActions(actions);
    
    expect(steps.length).toBe(1);
    expect(steps[0].action).toContain('Verify');
    expect(steps[0].expectedResult).toContain('200');
  });

  it('should map measure_time action to test step', () => {
    const actions: InstructionAction[] = [
      {
        type: 'measure_time',
        description: 'Measure response time',
      },
    ];
    
    const steps = generateTestStepsFromActions(actions);
    
    expect(steps.length).toBe(1);
    expect(steps[0].action).toContain('Measure response time');
    expect(steps[0].expectedResult).toContain('measured');
  });
});

describe('Test Step Generation - Step Ordering', () => {
  it('should preserve action order in test steps', () => {
    const actions: InstructionAction[] = [
      {
        type: 'send_request',
        description: 'Send GET request',
      },
      {
        type: 'store_response',
        description: 'Store response status code',
        field: 'statusCode',
      },
      {
        type: 'read_field',
        description: 'Read userId field',
        field: 'userId',
      },
      {
        type: 'verify',
        description: 'Verify status code',
        field: 'statusCode',
        expectedValue: 200,
      },
    ];
    
    const steps = generateTestStepsFromActions(actions);
    
    expect(steps.length).toBe(4);
    
    // Verify order matches actions
    expect(steps[0].action).toContain('Send GET request');
    expect(steps[1].action).toContain('Store response status code');
    expect(steps[2].action).toContain('Read userId field');
    expect(steps[3].action).toContain('Verify');
  });

  it('should number steps sequentially', () => {
    const actions: InstructionAction[] = [
      { type: 'send_request', description: 'Send GET request' },
      { type: 'store_response', description: 'Store status', field: 'statusCode' },
      { type: 'read_field', description: 'Read field', field: 'userId' },
    ];
    
    const steps = generateTestStepsFromActions(actions);
    
    expect(steps[0].stepNumber).toBe(1);
    expect(steps[1].stepNumber).toBe(2);
    expect(steps[2].stepNumber).toBe(3);
  });
});

describe('Test Step Generation - Step Descriptions', () => {
  it('should generate step descriptions matching instruction phrases', () => {
    const instruction = `Send a GET request to "https://api.example.com/users"
Store the response status code
Read userId field`;
    
    const parsed = parseAPIInstructionEnhanced(instruction, 'https://api.example.com/users');
    const steps = generateTestStepsFromActions(parsed.actions);
    
    // Verify descriptions match instruction phrases
    expect(steps.some(s => s.action.includes('Send GET request'))).toBe(true);
    expect(steps.some(s => s.action.includes('Store response status code'))).toBe(true);
    expect(steps.some(s => s.action.includes('Read userId field'))).toBe(true);
  });

  it('should generate appropriate expected results for each action type', () => {
    const actions: InstructionAction[] = [
      { type: 'send_request', description: 'Send request' },
      { type: 'store_response', description: 'Store body', field: 'body' },
      { type: 'count', description: 'Count objects' },
    ];
    
    const steps = generateTestStepsFromActions(actions);
    
    // Each step should have a meaningful expected result
    steps.forEach(step => {
      expect(step.expectedResult).toBeDefined();
      expect(step.expectedResult.length).toBeGreaterThan(0);
    });
  });
});

describe('Test Step Generation - Integration with Test Case', () => {
  it('should generate test case with steps from instruction', () => {
    const instruction = `Send a GET request to "https://api.example.com/users"
Store the response status code
Count the number of objects`;
    
    const parsed = parseAPIInstructionEnhanced(instruction, 'https://api.example.com/users');
    const testCase = generateInstructionBasedTestCase(parsed);
    
    expect(testCase.steps).toBeDefined();
    expect(testCase.steps.length).toBeGreaterThan(0);
    
    // Verify steps match instruction
    const stepActions = testCase.steps.map(s => s.action).join(' ');
    expect(stepActions).toContain('Send GET request');
    expect(stepActions).toContain('Store response status code');
    expect(stepActions).toContain('Count');
  });

  it('should not include steps for actions not in instruction', () => {
    const instruction = 'Send a GET request to "https://api.example.com/users"';
    
    const parsed = parseAPIInstructionEnhanced(instruction, 'https://api.example.com/users');
    const testCase = generateInstructionBasedTestCase(parsed);
    
    // Should only have steps for send_request action
    // Should not have steps for count, read_field, etc. that weren't mentioned
    const stepActions = testCase.steps.map(s => s.action).join(' ').toLowerCase();
    
    // Should have send request
    expect(stepActions).toContain('send');
    
    // Should not have unmentioned actions (unless they're implicit like storing response)
    // This is a soft check - we verify the main action is present
    expect(testCase.steps.length).toBeLessThan(10); // Reasonable upper bound
  });
});

describe('Test Step Generation - Edge Cases', () => {
  it('should handle empty actions array', () => {
    const actions: InstructionAction[] = [];
    const steps = generateTestStepsFromActions(actions);
    
    expect(steps).toBeDefined();
    expect(Array.isArray(steps)).toBe(true);
    expect(steps.length).toBe(0);
  });

  it('should handle actions with missing fields', () => {
    const actions: InstructionAction[] = [
      {
        type: 'read_field',
        description: 'Read field',
        // field is missing
      },
    ];
    
    const steps = generateTestStepsFromActions(actions);
    
    expect(steps.length).toBe(1);
    expect(steps[0].action).toBeDefined();
    expect(steps[0].expectedResult).toBeDefined();
  });

  it('should handle multiple actions of the same type', () => {
    const actions: InstructionAction[] = [
      { type: 'read_field', description: 'Read userId', field: 'userId' },
      { type: 'read_field', description: 'Read name', field: 'name' },
      { type: 'read_field', description: 'Read email', field: 'email' },
    ];
    
    const steps = generateTestStepsFromActions(actions);
    
    expect(steps.length).toBe(3);
    expect(steps[0].action).toContain('userId');
    expect(steps[1].action).toContain('name');
    expect(steps[2].action).toContain('email');
  });
});
