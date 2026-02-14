/**
 * Test Generators Module
 * 
 * Exports all test generation modules for accessibility, API, functional, and security testing.
 */

// Test Case Formatter
export {
  formatTestCase,
  generateTestId,
  calculateQualityMetrics,
  validateTestCaseStructure,
  type BaseTestCase,
  type TestStep,
  type ValidationCriteria,
  type QualityMetrics,
} from './testCaseFormatter';

// Test Intent Classifier
export {
  classifyTestIntent,
  type TestIntent,
  type WebsiteAnalysis,
} from './testIntentClassifier';

// Accessibility Test Generator
export {
  generateAccessibilityTests,
  type AccessibilityTestCase,
} from './accessibilityTestGenerator';

// API Test Generator
export {
  generateAPITests,
  type APITestCase,
} from './apiTestGenerator';

// Instruction-Based API Test Generator
export {
  generateInstructionBasedTestCase,
  generateTestStepsFromActions,
  generatePreconditionsFromInstruction,
} from './instructionBasedAPIGenerator';

// Integrated Test Router (NEW)
export {
  IntegratedTestRouter,
  integratedTestRouter,
  generateTests,
  type TestGenerationRequest,
  type TestGenerationResponse,
  type FunctionalTestGenerator,
} from './integratedTestRouter';

// Universal Test Generator (existing)
export { UniversalTestGenerator } from './universal-test-generator';

// Security Test Generation System (NEW)
export { SecurityTestGenerator } from './securityTestGenerator';
export { SecurityIntentClassifier } from './securityIntentClassifier';
export { SecurityInstructionParser } from './securityInstructionParser';
export { SecurityPlaywrightCodeGenerator } from './securityPlaywrightCodeGenerator';

