/**
 * Test Case Formatter Module
 * 
 * Provides shared utilities for formatting test cases consistently across all test types.
 * This module ensures all generated test cases follow a universal structure with proper
 * metadata, quality metrics, and validation criteria.
 */

import { randomUUID } from 'crypto';

// Global counter for sequential test IDs
let testIdCounter = 1;

/**
 * Reset test ID counter (useful for testing)
 */
export function resetTestIdCounter(): void {
  testIdCounter = 1;
}

/**
 * Base Test Case Interface
 * 
 * All test cases (Functional, Accessibility, API) must extend this base interface
 * to ensure consistent structure and required fields.
 */
export interface BaseTestCase {
  // Mandatory identification fields
  id: string;
  title: string;
  description: string;
  
  // Categorization fields
  category: 'Smoke' | 'Regression' | 'End-to-End' | 'Integration' | 'Security' | 'Performance';
  testType: 'Functional' | 'Accessibility' | 'API' | 'UI' | 'Database';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  stability: 'Stable' | 'Unstable' | 'Flaky';
  
  // Test execution details
  preconditions: string[];
  steps: TestStep[];
  expectedResult: string;
  
  // Validation and quality
  validationCriteria: ValidationCriteria;
  qualityMetrics: QualityMetrics;
  
  // Optional automation code
  automationMapping?: string;
  playwrightCode?: string; // Add Playwright code property for compatibility
  testCaseId?: string; // Add test case ID for frontend compatibility
}

/**
 * Test Step Interface
 * 
 * Represents a single step in a test case with action, input, and expected result.
 */
export interface TestStep {
  stepNumber: number;
  action: string;
  inputData?: any;
  expectedResult: string;
}

/**
 * Validation Criteria Interface
 * 
 * Defines what should be validated in the test case.
 * Different test types will populate different fields.
 */
export interface ValidationCriteria {
  uiElement?: string[];
  apiResponse?: string[];
  dataState?: string[];
  behavior?: string[];
  compliance?: string[];
}

/**
 * Quality Metrics Interface
 * 
 * Provides quality scores for the test case.
 * All scores should be between 0 and 100.
 */
export interface QualityMetrics {
  confidence: number;      // How confident we are in the test case (0-100)
  stability: number;       // How stable the test is expected to be (0-100)
  maintainability: number; // How easy it is to maintain (0-100)
}

/**
 * Format Test Case
 * 
 * Takes partial test case data and formats it into a complete BaseTestCase
 * with all required fields, applying defaults where necessary.
 * Preserves all additional fields from the input (e.g., accessibility-specific fields).
 * 
 * @param testData - Partial test case data
 * @param testType - Type of test being formatted
 * @returns Complete BaseTestCase with all required fields and any additional fields preserved
 */
export function formatTestCase(
  testData: Partial<BaseTestCase>,
  testType: 'Functional' | 'Accessibility' | 'API' | 'UI' | 'Database'
): BaseTestCase {
  // Generate ID if not provided
  const id = testData.id || generateTestId(testType, Date.now());
  
  // Apply defaults for missing fields
  const formatted: BaseTestCase = {
    ...testData, // Preserve all fields from input (including type-specific fields)
    id,
    title: testData.title || 'Untitled Test Case',
    description: testData.description || '',
    category: testData.category || 'Regression',
    testType: testData.testType || testType,
    priority: testData.priority || 'Medium',
    severity: testData.severity || 'Medium',
    stability: testData.stability || 'Stable',
    preconditions: testData.preconditions || [],
    steps: testData.steps || [],
    expectedResult: testData.expectedResult || '',
    validationCriteria: testData.validationCriteria || {},
    qualityMetrics: testData.qualityMetrics || calculateQualityMetrics(testData as BaseTestCase),
    automationMapping: testData.automationMapping,
  };
  
  // Ensure steps are properly numbered sequentially starting from 1
  // Always renumber steps to ensure consistency, regardless of input
  formatted.steps = formatted.steps.map((step, index) => ({
    ...step,
    stepNumber: index + 1,
  }));
  
  return formatted;
}

/**
 * Generate Test ID
 * 
 * Generates a unique test ID based on test type and sequence number.
 * Format: {PREFIX}-{SEQUENCE}
 * Example: API-001, A11Y-002, FT-003
 * 
 * @param testType - Type of test
 * @param sequence - Optional sequence number (auto-increments if not provided)
 * @returns Unique test ID string
 */
export function generateTestId(
  testType: string,
  sequence?: number
): string {
  // Determine prefix based on test type
  const prefixMap: Record<string, string> = {
    'Functional': 'FT',
    'Accessibility': 'A11Y',
    'API': 'API',
    'UI': 'UI',
    'Database': 'DB',
  };
  
  const prefix = prefixMap[testType] || 'TC';
  
  // Use provided sequence or auto-increment counter
  const seqNum = sequence !== undefined ? sequence : testIdCounter++;
  
  // Format: PREFIX-### (e.g., API-001, A11Y-002)
  return `${prefix}-${String(seqNum).padStart(3, '0')}`;
}

/**
 * Calculate Quality Metrics
 * 
 * Calculates quality metrics (confidence, stability, maintainability) for a test case
 * based on its completeness and structure.
 * 
 * @param testCase - Test case to calculate metrics for
 * @returns Quality metrics with scores 0-100
 */
export function calculateQualityMetrics(testCase: Partial<BaseTestCase>): QualityMetrics {
  let confidence = 50; // Base confidence
  let stability = 50;  // Base stability
  let maintainability = 50; // Base maintainability
  
  // Increase confidence based on completeness
  if (testCase.title && testCase.title.length > 10) confidence += 10;
  if (testCase.description && testCase.description.length > 20) confidence += 10;
  if (testCase.preconditions && testCase.preconditions.length > 0) confidence += 10;
  if (testCase.steps && testCase.steps.length > 0) confidence += 15;
  if (testCase.expectedResult && testCase.expectedResult.length > 10) confidence += 10;
  if (testCase.validationCriteria) {
    const criteriaCount = Object.values(testCase.validationCriteria).filter(v => v && v.length > 0).length;
    confidence += Math.min(criteriaCount * 5, 15);
  }
  
  // Calculate stability based on test structure
  if (testCase.steps && testCase.steps.length > 0) {
    // More steps = potentially less stable
    const stepCount = testCase.steps.length;
    if (stepCount <= 5) stability += 20;
    else if (stepCount <= 10) stability += 10;
    else stability += 5;
    
    // Steps with clear expected results = more stable
    const stepsWithExpectedResults = testCase.steps.filter(s => s.expectedResult && s.expectedResult.length > 0).length;
    stability += Math.min((stepsWithExpectedResults / stepCount) * 20, 20);
  }
  
  // Automation code increases stability
  if (testCase.automationMapping && testCase.automationMapping.length > 50) {
    stability += 10;
  }
  
  // Calculate maintainability based on clarity and structure
  if (testCase.title && testCase.title.length > 10 && testCase.title.length < 100) maintainability += 15;
  if (testCase.description && testCase.description.length > 20 && testCase.description.length < 200) maintainability += 15;
  if (testCase.steps && testCase.steps.length > 0 && testCase.steps.length <= 10) maintainability += 20;
  
  // Clear validation criteria improves maintainability
  if (testCase.validationCriteria) {
    const criteriaCount = Object.values(testCase.validationCriteria).filter(v => v && v.length > 0).length;
    maintainability += Math.min(criteriaCount * 5, 20);
  }
  
  // Cap all metrics at 100
  confidence = Math.min(confidence, 100);
  stability = Math.min(stability, 100);
  maintainability = Math.min(maintainability, 100);
  
  return {
    confidence,
    stability,
    maintainability,
  };
}

/**
 * Validate Test Case Structure
 * 
 * Validates that a test case has all required fields and proper structure.
 * Returns an array of validation errors, or empty array if valid.
 * 
 * @param testCase - Test case to validate
 * @returns Array of validation error messages
 */
export function validateTestCaseStructure(testCase: Partial<BaseTestCase>): string[] {
  const errors: string[] = [];
  
  // Check mandatory fields
  if (!testCase.id) errors.push('Missing required field: id');
  if (!testCase.title) errors.push('Missing required field: title');
  if (!testCase.testType) errors.push('Missing required field: testType');
  if (!testCase.priority) errors.push('Missing required field: priority');
  if (!testCase.severity) errors.push('Missing required field: severity');
  if (!testCase.stability) errors.push('Missing required field: stability');
  
  // Check arrays
  if (!testCase.preconditions || !Array.isArray(testCase.preconditions)) {
    errors.push('Missing or invalid field: preconditions (must be array)');
  }
  if (!testCase.steps || !Array.isArray(testCase.steps)) {
    errors.push('Missing or invalid field: steps (must be array)');
  }
  
  // Check steps structure
  if (testCase.steps && Array.isArray(testCase.steps)) {
    testCase.steps.forEach((step, index) => {
      if (!step.action) errors.push(`Step ${index + 1}: Missing action`);
      if (!step.expectedResult) errors.push(`Step ${index + 1}: Missing expectedResult`);
      // Note: We don't validate stepNumber here because formatTestCase always renumbers steps
    });
  }
  
  // Check validation criteria
  if (!testCase.validationCriteria) {
    errors.push('Missing required field: validationCriteria');
  }
  
  // Check quality metrics
  if (!testCase.qualityMetrics) {
    errors.push('Missing required field: qualityMetrics');
  } else {
    const { confidence, stability, maintainability } = testCase.qualityMetrics;
    if (confidence < 0 || confidence > 100) errors.push('Quality metric confidence must be 0-100');
    if (stability < 0 || stability > 100) errors.push('Quality metric stability must be 0-100');
    if (maintainability < 0 || maintainability > 100) errors.push('Quality metric maintainability must be 0-100');
  }
  
  return errors;
}
