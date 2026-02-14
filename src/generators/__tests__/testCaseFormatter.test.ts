import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';
import {
  formatTestCase,
  generateTestId,
  calculateQualityMetrics,
  validateTestCaseStructure,
  type BaseTestCase,
  type TestStep,
  type QualityMetrics,
} from '../testCaseFormatter';

/**
 * Property-Based Tests for Test Case Formatter
 * 
 * These tests validate universal properties that should hold across all test case types
 * using fast-check for property-based testing with 100+ iterations per test.
 */

describe('Test Case Formatter - Property-Based Tests', () => {
  
  /**
   * Arbitraries (Generators) for Property-Based Testing
   */
  
  const testTypeArb = fc.constantFrom('Functional', 'Accessibility', 'API', 'UI', 'Database');
  const categoryArb = fc.constantFrom('Smoke', 'Regression', 'End-to-End', 'Integration', 'Security', 'Performance');
  const priorityArb = fc.constantFrom('Critical', 'High', 'Medium', 'Low');
  const severityArb = fc.constantFrom('Critical', 'High', 'Medium', 'Low');
  const stabilityArb = fc.constantFrom('Stable', 'Unstable', 'Flaky');
  
  const testStepArb: fc.Arbitrary<TestStep> = fc.record({
    stepNumber: fc.integer({ min: 1, max: 100 }),
    action: fc.string({ minLength: 5, maxLength: 100 }),
    inputData: fc.option(fc.anything(), { nil: undefined }),
    expectedResult: fc.string({ minLength: 5, maxLength: 100 }),
  });
  
  const qualityMetricsArb: fc.Arbitrary<QualityMetrics> = fc.record({
    confidence: fc.integer({ min: 0, max: 100 }),
    stability: fc.integer({ min: 0, max: 100 }),
    maintainability: fc.integer({ min: 0, max: 100 }),
  });
  
  const baseTestCaseArb: fc.Arbitrary<BaseTestCase> = fc.record({
    id: fc.uuid(),
    title: fc.string({ minLength: 10, maxLength: 100 }),
    description: fc.string({ minLength: 20, maxLength: 200 }),
    category: categoryArb,
    testType: testTypeArb,
    priority: priorityArb,
    severity: severityArb,
    stability: stabilityArb,
    preconditions: fc.array(fc.string({ minLength: 5, maxLength: 50 }), { minLength: 1, maxLength: 5 }),
    steps: fc.array(testStepArb, { minLength: 1, maxLength: 10 }),
    expectedResult: fc.string({ minLength: 10, maxLength: 100 }),
    validationCriteria: fc.record({
      uiElement: fc.option(fc.array(fc.string({ minLength: 5, maxLength: 30 }), { minLength: 1, maxLength: 5 }), { nil: undefined }),
      apiResponse: fc.option(fc.array(fc.string({ minLength: 5, maxLength: 30 }), { minLength: 1, maxLength: 5 }), { nil: undefined }),
      dataState: fc.option(fc.array(fc.string({ minLength: 5, maxLength: 30 }), { minLength: 1, maxLength: 5 }), { nil: undefined }),
      behavior: fc.option(fc.array(fc.string({ minLength: 5, maxLength: 30 }), { minLength: 1, maxLength: 5 }), { nil: undefined }),
      compliance: fc.option(fc.array(fc.string({ minLength: 5, maxLength: 30 }), { minLength: 1, maxLength: 5 }), { nil: undefined }),
    }),
    qualityMetrics: qualityMetricsArb,
    automationMapping: fc.option(fc.string({ minLength: 50, maxLength: 500 }), { nil: undefined }),
  });
  
  /**
   * Property 1: Universal Test Case Structure Completeness
   * 
   * For any generated test case, regardless of type, the test case should contain all 
   * mandatory fields: Test_ID, Test_Title, Category, Test_Type, Priority, Severity, 
   * Stability, Preconditions, Test Steps (with Step_Number, Action, Input_Data, 
   * Expected_Result), Validation Criteria, and Quality Metrics (Confidence, Stability, 
   * Maintainability).
   * 
   * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**
   * **Feature: accessibility-api-testing, Property 1: Universal Test Case Structure Completeness**
   */
  it('Property 1: should ensure all mandatory fields are present in formatted test case', () => {
    fc.assert(
      fc.property(
        baseTestCaseArb,
        testTypeArb,
        (partialTestCase, testType) => {
          // Format the test case
          const formatted = formatTestCase(partialTestCase, testType);
          
          // Verify all mandatory fields are present
          expect(formatted.id).toBeDefined();
          expect(typeof formatted.id).toBe('string');
          expect(formatted.id.length).toBeGreaterThan(0);
          
          expect(formatted.title).toBeDefined();
          expect(typeof formatted.title).toBe('string');
          expect(formatted.title.length).toBeGreaterThan(0);
          
          expect(formatted.category).toBeDefined();
          expect(['Smoke', 'Regression', 'End-to-End', 'Integration', 'Security', 'Performance']).toContain(formatted.category);
          
          expect(formatted.testType).toBeDefined();
          expect(['Functional', 'Accessibility', 'API', 'UI', 'Database']).toContain(formatted.testType);
          
          expect(formatted.priority).toBeDefined();
          expect(['Critical', 'High', 'Medium', 'Low']).toContain(formatted.priority);
          
          expect(formatted.severity).toBeDefined();
          expect(['Critical', 'High', 'Medium', 'Low']).toContain(formatted.severity);
          
          expect(formatted.stability).toBeDefined();
          expect(['Stable', 'Unstable', 'Flaky']).toContain(formatted.stability);
          
          expect(formatted.preconditions).toBeDefined();
          expect(Array.isArray(formatted.preconditions)).toBe(true);
          
          expect(formatted.steps).toBeDefined();
          expect(Array.isArray(formatted.steps)).toBe(true);
          
          expect(formatted.expectedResult).toBeDefined();
          expect(typeof formatted.expectedResult).toBe('string');
          
          expect(formatted.validationCriteria).toBeDefined();
          expect(typeof formatted.validationCriteria).toBe('object');
          
          expect(formatted.qualityMetrics).toBeDefined();
          expect(typeof formatted.qualityMetrics).toBe('object');
          expect(formatted.qualityMetrics.confidence).toBeDefined();
          expect(formatted.qualityMetrics.stability).toBeDefined();
          expect(formatted.qualityMetrics.maintainability).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Property 2: Test Step Structure Consistency
   * 
   * For any generated test case with test steps, each step should have a step number, 
   * action description, optional input data, and expected result, and steps should be 
   * numbered sequentially starting from 1.
   * 
   * **Validates: Requirements 1.3**
   * **Feature: accessibility-api-testing, Property 2: Test Step Structure Consistency**
   */
  it('Property 2: should ensure test steps are numbered sequentially starting from 1', () => {
    fc.assert(
      fc.property(
        fc.array(testStepArb, { minLength: 1, maxLength: 20 }),
        testTypeArb,
        (steps, testType) => {
          // Create a test case with the generated steps
          const testCase: Partial<BaseTestCase> = {
            title: 'Test Case',
            description: 'Test Description',
            steps,
          };
          
          // Format the test case
          const formatted = formatTestCase(testCase, testType);
          
          // Verify steps are numbered sequentially starting from 1
          expect(formatted.steps.length).toBe(steps.length);
          
          formatted.steps.forEach((step, index) => {
            // Step number should match index + 1
            expect(step.stepNumber).toBe(index + 1);
            
            // Each step should have required fields
            expect(step.action).toBeDefined();
            expect(typeof step.action).toBe('string');
            expect(step.action.length).toBeGreaterThan(0);
            
            expect(step.expectedResult).toBeDefined();
            expect(typeof step.expectedResult).toBe('string');
            expect(step.expectedResult.length).toBeGreaterThan(0);
            
            // inputData is optional, but if present should be defined
            if (step.inputData !== undefined) {
              expect(step.inputData).toBeDefined();
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Property 3: Quality Metrics Validity
   * 
   * For any generated test case, the quality metrics (Confidence, Stability, 
   * Maintainability) should be numeric values between 0 and 100 inclusive.
   * 
   * **Validates: Requirements 1.5**
   * **Feature: accessibility-api-testing, Property 3: Quality Metrics Validity**
   */
  it('Property 3: should ensure quality metrics are between 0 and 100', () => {
    fc.assert(
      fc.property(
        baseTestCaseArb,
        (testCase) => {
          // Calculate quality metrics
          const metrics = calculateQualityMetrics(testCase);
          
          // Verify all metrics are in valid range [0, 100]
          expect(metrics.confidence).toBeGreaterThanOrEqual(0);
          expect(metrics.confidence).toBeLessThanOrEqual(100);
          expect(typeof metrics.confidence).toBe('number');
          expect(Number.isFinite(metrics.confidence)).toBe(true);
          
          expect(metrics.stability).toBeGreaterThanOrEqual(0);
          expect(metrics.stability).toBeLessThanOrEqual(100);
          expect(typeof metrics.stability).toBe('number');
          expect(Number.isFinite(metrics.stability)).toBe(true);
          
          expect(metrics.maintainability).toBeGreaterThanOrEqual(0);
          expect(metrics.maintainability).toBeLessThanOrEqual(100);
          expect(typeof metrics.maintainability).toBe('number');
          expect(Number.isFinite(metrics.maintainability)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Additional Property: Test ID Uniqueness
   * 
   * For any two test cases generated at different times, their IDs should be unique.
   */
  it('should generate unique test IDs', () => {
    fc.assert(
      fc.property(
        testTypeArb,
        fc.integer({ min: 1, max: 1000000 }),
        fc.integer({ min: 1, max: 1000000 }),
        (testType, seq1, seq2) => {
          // Skip if sequences are the same (would generate same ID)
          fc.pre(seq1 !== seq2);
          
          const id1 = generateTestId(testType, seq1);
          const id2 = generateTestId(testType, seq2);
          
          // IDs should be different
          expect(id1).not.toBe(id2);
          
          // IDs should have correct prefix
          const prefixMap: Record<string, string> = {
            'Functional': 'FT',
            'Accessibility': 'A11Y',
            'API': 'API',
            'UI': 'UI',
            'Database': 'DB',
          };
          const expectedPrefix = prefixMap[testType] || 'TC';
          expect(id1.startsWith(expectedPrefix)).toBe(true);
          expect(id2.startsWith(expectedPrefix)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Additional Property: Format Test Case Idempotence
   * 
   * For any test case, formatting it multiple times should produce the same result
   * (except for generated IDs if not provided).
   */
  it('should be idempotent when formatting with provided ID', () => {
    fc.assert(
      fc.property(
        baseTestCaseArb,
        testTypeArb,
        (testCase, testType) => {
          // Format twice
          const formatted1 = formatTestCase(testCase, testType);
          const formatted2 = formatTestCase(testCase, testType);
          
          // Should produce identical results (since ID is provided)
          expect(formatted1.id).toBe(formatted2.id);
          expect(formatted1.title).toBe(formatted2.title);
          expect(formatted1.description).toBe(formatted2.description);
          expect(formatted1.testType).toBe(formatted2.testType);
          expect(formatted1.steps.length).toBe(formatted2.steps.length);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Additional Property: Validation Detects Missing Fields
   * 
   * For any incomplete test case, validation should detect missing required fields.
   */
  it('should detect missing required fields in validation', () => {
    fc.assert(
      fc.property(
        fc.record({
          title: fc.option(fc.string(), { nil: undefined }),
          id: fc.option(fc.uuid(), { nil: undefined }),
          testType: fc.option(testTypeArb, { nil: undefined }),
        }),
        (incompleteTestCase) => {
          const errors = validateTestCaseStructure(incompleteTestCase);
          
          // Should have errors for missing fields
          if (!incompleteTestCase.id) {
            expect(errors.some(e => e.includes('id'))).toBe(true);
          }
          if (!incompleteTestCase.title) {
            expect(errors.some(e => e.includes('title'))).toBe(true);
          }
          if (!incompleteTestCase.testType) {
            expect(errors.some(e => e.includes('testType'))).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Additional Property: Complete Test Cases Pass Validation
   * 
   * For any complete test case with all required fields, validation should return no errors.
   */
  it('should pass validation for complete test cases', () => {
    fc.assert(
      fc.property(
        baseTestCaseArb,
        (testCase) => {
          const errors = validateTestCaseStructure(testCase);
          
          // Should have no errors for complete test case
          expect(errors.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Additional Property: Quality Metrics Increase with Completeness
   * 
   * For any test case, adding more complete information should not decrease quality metrics.
   */
  it('should not decrease quality metrics when adding information', () => {
    fc.assert(
      fc.property(
        fc.record({
          title: fc.string({ minLength: 5, maxLength: 50 }),
          description: fc.string({ minLength: 10, maxLength: 100 }),
        }),
        fc.array(testStepArb, { minLength: 1, maxLength: 5 }),
        fc.array(fc.string({ minLength: 5, maxLength: 30 }), { minLength: 1, maxLength: 3 }),
        (baseInfo, steps, preconditions) => {
          // Calculate metrics for minimal test case
          const minimalMetrics = calculateQualityMetrics(baseInfo);
          
          // Calculate metrics for enhanced test case
          const enhancedTestCase = {
            ...baseInfo,
            steps,
            preconditions,
            expectedResult: 'Test should pass successfully',
            validationCriteria: {
              uiElement: ['Element should be visible'],
              behavior: ['System should respond correctly'],
            },
          };
          const enhancedMetrics = calculateQualityMetrics(enhancedTestCase);
          
          // Enhanced test case should have equal or higher confidence
          expect(enhancedMetrics.confidence).toBeGreaterThanOrEqual(minimalMetrics.confidence);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Additional Property: Test Type Prefix Consistency
   * 
   * For any test type, generated IDs should always start with the correct prefix.
   */
  it('should use consistent prefixes for test types', () => {
    const testTypes: Array<'Functional' | 'Accessibility' | 'API' | 'UI' | 'Database'> = [
      'Functional',
      'Accessibility',
      'API',
      'UI',
      'Database',
    ];
    
    const expectedPrefixes: Record<string, string> = {
      'Functional': 'FT',
      'Accessibility': 'A11Y',
      'API': 'API',
      'UI': 'UI',
      'Database': 'DB',
    };
    
    fc.assert(
      fc.property(
        fc.constantFrom(...testTypes),
        fc.integer({ min: 1, max: 1000000 }),
        (testType, sequence) => {
          const id = generateTestId(testType, sequence);
          const expectedPrefix = expectedPrefixes[testType];
          
          expect(id.startsWith(expectedPrefix + '-')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
