/**
 * Accessibility Test Generator Module
 * 
 * Generates WCAG-compliant accessibility test cases for web applications.
 * This module creates test cases for keyboard navigation, screen reader compatibility,
 * color contrast, form accessibility, and focus management.
 * 
 * Enhanced with DOM inspection code generation for Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */

import {
  formatTestCase,
  generateTestId,
  type BaseTestCase,
  type TestStep,
  type ValidationCriteria,
} from './testCaseFormatter';
import type { WebsiteAnalysis } from './testIntentClassifier';
import { 
  EnhancedAccessibilityParser,
  type AccessibilityTestRequirements 
} from './enhancedAccessibilityParser';
import { 
  EnhancedDOMInspectionCodeGenerator,
  type DOMInspectionCodeGenerator 
} from './domInspectionCodeGenerator';
import {
  EnhancedAccessibilityCodeGenerator,
  type AccessibilityCodeGenerator,
  type AccessibilityTestStep
} from './accessibilityCodeGenerator';

/**
 * Accessibility Test Case Interface
 * 
 * Extends BaseTestCase with accessibility-specific fields for WCAG compliance testing.
 */
export interface AccessibilityTestCase extends BaseTestCase {
  testType: 'Accessibility';
  wcagVersion: '2.0' | '2.1' | '2.2';
  wcagPrinciple: ('Perceivable' | 'Operable' | 'Understandable' | 'Robust')[];
  wcagSuccessCriteria: string[];
  assistiveTechnology: ('NVDA' | 'JAWS' | 'VoiceOver' | 'TalkBack' | 'Keyboard')[];
  accessibilityTags: string[];
  keyboardAccess: boolean;
}

/**
 * Interactive Element Interface
 * 
 * Represents an interactive element from website analysis.
 */
interface InteractiveElement {
  tag: string;
  type: string;
  text: string;
  ariaLabel: string;
  role: string;
  placeholder: string;
  name: string;
  id: string;
  friendlyName?: string;
  selectors: string[];
  xpath: string;
}

/**
 * Generate Accessibility Tests
 * 
 * Main entry point for generating accessibility test cases based on website analysis
 * and user prompt. Enhanced with structured test steps and Playwright code generation.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 * 
 * @param websiteAnalysis - Analysis of the website structure
 * @param userPrompt - User's test generation prompt
 * @returns Array of accessibility test cases with Playwright code
 */
export function generateAccessibilityTests(
  websiteAnalysis: WebsiteAnalysis,
  userPrompt: string
): AccessibilityTestCase[] {
  const testCases: AccessibilityTestCase[] = [];
  const elements = websiteAnalysis.allInteractive || [];
  
  // Initialize enhanced accessibility parser and code generators
  const accessibilityParser = new EnhancedAccessibilityParser();
  const domInspectionGenerator = new EnhancedDOMInspectionCodeGenerator();
  const accessibilityCodeGenerator = new EnhancedAccessibilityCodeGenerator();
  
  // Parse accessibility requirements from user prompt
  const accessibilityRequirements = accessibilityParser.parseInstructions(userPrompt, websiteAnalysis);
  
  console.log('[AccessibilityTestGenerator] Parsed requirements:', {
    domInspection: accessibilityRequirements.domInspection.length,
    keyboardNavigation: accessibilityRequirements.keyboardNavigation.length,
    ariaCompliance: accessibilityRequirements.ariaCompliance.length,
    visualAccessibility: accessibilityRequirements.visualAccessibility.length,
    wcagGuidelines: accessibilityRequirements.wcagGuidelines.length
  });
  
  // Generate comprehensive accessibility test with structured steps and Playwright code
  const comprehensiveTest = generateComprehensiveAccessibilityTest(
    websiteAnalysis, 
    userPrompt, 
    accessibilityRequirements, 
    accessibilityCodeGenerator
  );
  
  if (comprehensiveTest) {
    console.log('[AccessibilityTestGenerator] Generated comprehensive test with Playwright code');
    testCases.push(comprehensiveTest);
  }
  
  // Determine which test types to generate based on prompt and parsed requirements
  const promptLower = userPrompt.toLowerCase();
  const hasDOMRequirements = accessibilityRequirements.domInspection.length > 0;
  const hasKeyboardRequirements = accessibilityRequirements.keyboardNavigation.length > 0;
  const hasARIARequirements = accessibilityRequirements.ariaCompliance.length > 0;
  const hasVisualRequirements = accessibilityRequirements.visualAccessibility.length > 0;
  
  // Legacy keyword detection for backward compatibility
  const generateKeyboard = promptLower.includes('keyboard') || promptLower.includes('tab') || promptLower.includes('navigation') || hasKeyboardRequirements;
  const generateScreenReader = promptLower.includes('screen reader') || promptLower.includes('aria') || promptLower.includes('semantic') || hasARIARequirements;
  const generateContrast = promptLower.includes('contrast') || promptLower.includes('color') || hasVisualRequirements;
  const generateForm = (promptLower.includes('form') && elements.some(e => e.tag === 'input' || e.tag === 'textarea' || e.tag === 'select')) || 
                       accessibilityRequirements.domInspection.some(req => req.type === 'form-labels');
  const generateFocus = promptLower.includes('focus') || promptLower.includes('indicator') || hasVisualRequirements;
  const generateDOMInspection = hasDOMRequirements || promptLower.includes('alt') || promptLower.includes('heading') || promptLower.includes('landmark') || promptLower.includes('semantic');
  
  // If no specific keywords, generate all types
  const generateAll = !generateKeyboard && !generateScreenReader && !generateContrast && !generateForm && !generateFocus && !generateDOMInspection;
  
  // Generate DOM inspection tests (NEW - Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6)
  if (generateDOMInspection || generateAll) {
    const domInspectionTest = generateDOMInspectionTest(websiteAnalysis, accessibilityRequirements, domInspectionGenerator);
    if (domInspectionTest) {
      testCases.push(domInspectionTest);
    }
  }
  
  // Generate keyboard navigation tests
  if (generateKeyboard || generateAll) {
    const interactiveElements = elements.filter(e => 
      ['button', 'a', 'input', 'select', 'textarea'].includes(e.tag)
    ) as InteractiveElement[];
    
    if (interactiveElements.length > 0) {
      // Generate one comprehensive keyboard navigation test
      testCases.push(generateKeyboardNavigationTest(websiteAnalysis, interactiveElements));
    }
  }
  
  // Generate screen reader tests
  if (generateScreenReader || generateAll) {
    testCases.push(generateScreenReaderTest(websiteAnalysis, elements as InteractiveElement[]));
  }
  
  // Generate color contrast tests
  if (generateContrast || generateAll) {
    testCases.push(generateColorContrastTest(websiteAnalysis));
  }
  
  // Generate form accessibility tests
  if (generateForm || generateAll) {
    const formElements = elements.filter(e => 
      e.tag === 'input' || e.tag === 'textarea' || e.tag === 'select'
    ) as InteractiveElement[];
    
    if (formElements.length > 0) {
      testCases.push(generateFormAccessibilityTest(websiteAnalysis, formElements));
    }
  }
  
  // Generate focus management tests
  if (generateFocus || generateAll) {
    const focusableElements = elements.filter(e => 
      ['button', 'a', 'input', 'select', 'textarea'].includes(e.tag)
    ) as InteractiveElement[];
    
    if (focusableElements.length > 0) {
      testCases.push(generateFocusManagementTest(websiteAnalysis, focusableElements));
    }
  }
  
  console.log(`[AccessibilityTestGenerator] Generated ${testCases.length} accessibility test cases`);
  return testCases;
}

/**
 * Generate Comprehensive Accessibility Test with Structured Steps
 * 
 * Creates a comprehensive accessibility test that includes all parsed requirements
 * and generates structured test steps with clear expected outcomes and Playwright code.
 * 
 * @param websiteAnalysis - Website analysis data
 * @param userPrompt - User's original prompt
 * @param accessibilityRequirements - Parsed accessibility requirements
 * @param codeGenerator - Accessibility code generator instance
 * @returns Comprehensive accessibility test case with structured steps
 */
export function generateComprehensiveAccessibilityTest(
  websiteAnalysis: WebsiteAnalysis,
  userPrompt: string,
  accessibilityRequirements: AccessibilityTestRequirements,
  codeGenerator: AccessibilityCodeGenerator
): AccessibilityTestCase | null {
  // Skip if no requirements
  const hasRequirements = accessibilityRequirements.domInspection.length > 0 ||
                         accessibilityRequirements.keyboardNavigation.length > 0 ||
                         accessibilityRequirements.ariaCompliance.length > 0 ||
                         accessibilityRequirements.visualAccessibility.length > 0 ||
                         accessibilityRequirements.wcagGuidelines.length > 0;
  
  if (!hasRequirements) {
    return null;
  }

  // Generate structured test steps with clear expected outcomes
  const accessibilityTestSteps = codeGenerator.generateAccessibilityTestSteps(accessibilityRequirements, websiteAnalysis.url);

  // Generate complete Playwright test code
  const playwrightCode = codeGenerator.generateCompleteTestCode(accessibilityTestSteps, websiteAnalysis.url);

  // Convert accessibility test steps to standard test steps format
  const steps: TestStep[] = accessibilityTestSteps.map(step => ({
    stepNumber: step.stepNumber,
    action: step.action,
    expectedResult: step.expectedOutcome,
  }));

  // Collect all WCAG criteria from test steps
  const wcagCriteria = [...new Set(accessibilityTestSteps.flatMap(step => step.wcagCriteria))];
  const accessibilityTags = generateAccessibilityTags(accessibilityRequirements);

  // Build validation criteria based on test steps
  const validationCriteria: ValidationCriteria = {
    behavior: accessibilityTestSteps.map(step => step.expectedOutcome),
    compliance: wcagCriteria.map(criteria => `WCAG ${criteria}`),
  };

  // Create comprehensive test case
  const testCase: Partial<AccessibilityTestCase> = {
    title: 'Comprehensive Accessibility Test - Instruction-Based',
    description: `Comprehensive accessibility testing of ${websiteAnalysis.url} based on user instructions: "${userPrompt}". This test validates ARIA compliance, keyboard navigation, visual accessibility, and WCAG guidelines with structured test steps and clear expected outcomes.`,
    category: 'Regression',
    testType: 'Accessibility',
    priority: 'High',
    severity: 'High',
    stability: 'Stable',
    wcagVersion: '2.1',
    wcagPrinciple: ['Perceivable', 'Operable', 'Understandable', 'Robust'],
    wcagSuccessCriteria: wcagCriteria,
    assistiveTechnology: ['Keyboard', 'NVDA', 'JAWS'],
    accessibilityTags,
    keyboardAccess: true,
    preconditions: [
      'Page is accessible and loaded',
      'Keyboard is available for input',
      'Axe-Core is integrated for automated scanning',
      'Browser supports accessibility APIs',
    ],
    steps,
    expectedResult: 'All accessibility requirements are met according to WCAG 2.1 AA standards with no critical violations',
    validationCriteria,
    qualityMetrics: { confidence: 95, stability: 90, maintainability: 95 },
    automationMapping: playwrightCode, // This is the key field that contains the Playwright code
  };

  const formattedTestCase = formatTestCase(testCase, 'Accessibility') as AccessibilityTestCase;
  
  // Ensure the automationMapping is preserved after formatting
  formattedTestCase.automationMapping = playwrightCode;
  
  return formattedTestCase;
}

/**
 * Generate accessibility tags based on requirements
 */
function generateAccessibilityTags(requirements: AccessibilityTestRequirements): string[] {
  const tags: string[] = [];
  
  if (requirements.domInspection.length > 0) {
    tags.push('dom-inspection');
  }
  if (requirements.keyboardNavigation.length > 0) {
    tags.push('keyboard-navigation');
  }
  if (requirements.ariaCompliance.length > 0) {
    tags.push('aria-compliance');
  }
  if (requirements.visualAccessibility.length > 0) {
    tags.push('visual-accessibility');
  }
  if (requirements.wcagGuidelines.length > 0) {
    tags.push('wcag-guidelines');
  }
  
  return [...new Set(tags)];
}

/**
 * Generate DOM Inspection Test
 * 
 * Creates a test case for DOM inspection using accessibility-based selectors.
 * This function integrates the Enhanced DOM Inspection Code Generator to create
 * comprehensive DOM validation tests.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 * 
 * @param websiteAnalysis - Website analysis data
 * @param accessibilityRequirements - Parsed accessibility requirements
 * @param domInspectionGenerator - DOM inspection code generator instance
 * @returns Accessibility test case for DOM inspection or null if no requirements
 */
export function generateDOMInspectionTest(
  websiteAnalysis: WebsiteAnalysis,
  accessibilityRequirements: AccessibilityTestRequirements,
  domInspectionGenerator: DOMInspectionCodeGenerator
): AccessibilityTestCase | null {
  // Skip if no DOM inspection requirements
  if (accessibilityRequirements.domInspection.length === 0) {
    return null;
  }

  // Determine which DOM inspection types are required
  const requirementTypes = accessibilityRequirements.domInspection.map(req => req.type);
  const hasImageAlt = requirementTypes.includes('image-alt');
  const hasFormLabels = requirementTypes.includes('form-labels');
  const hasHeadingHierarchy = requirementTypes.includes('heading-hierarchy');
  const hasLandmarks = requirementTypes.includes('landmarks');
  const hasSemanticHTML = requirementTypes.includes('semantic-html');

  // Build test steps based on requirements
  const steps: TestStep[] = [
    {
      stepNumber: 1,
      action: `Navigate to ${websiteAnalysis.url}`,
      expectedResult: 'Page loads successfully',
    },
  ];

  let stepNumber = 2;
  const wcagCriteria: string[] = [];
  const accessibilityTags: string[] = ['dom-inspection'];

  if (hasImageAlt) {
    steps.push({
      stepNumber: stepNumber++,
      action: 'Verify all images have appropriate alt attributes',
      expectedResult: 'Images have meaningful alt text or are marked as decorative',
    });
    wcagCriteria.push('1.1.1');
    accessibilityTags.push('image-alt');
  }

  if (hasFormLabels) {
    steps.push({
      stepNumber: stepNumber++,
      action: 'Verify all form controls have associated labels',
      expectedResult: 'Form inputs have explicit or implicit labels via for/id or aria-labelledby',
    });
    wcagCriteria.push('1.3.1', '3.3.2', '4.1.2');
    accessibilityTags.push('form-labels');
  }

  if (hasHeadingHierarchy) {
    steps.push({
      stepNumber: stepNumber++,
      action: 'Verify heading hierarchy is logical and sequential',
      expectedResult: 'Headings follow proper nesting (h1 > h2 > h3) without skipping levels',
    });
    wcagCriteria.push('1.3.1', '2.4.6');
    accessibilityTags.push('heading-hierarchy');
  }

  if (hasLandmarks) {
    steps.push({
      stepNumber: stepNumber++,
      action: 'Verify page landmarks are present and properly labeled',
      expectedResult: 'Essential landmarks (main, banner, contentinfo) exist with appropriate labels',
    });
    wcagCriteria.push('1.3.1', '2.4.1');
    accessibilityTags.push('landmarks');
  }

  if (hasSemanticHTML) {
    steps.push({
      stepNumber: stepNumber++,
      action: 'Verify semantic HTML5 elements are used appropriately',
      expectedResult: 'Semantic elements (article, section, aside, figure) are used correctly',
    });
    wcagCriteria.push('1.3.1');
    accessibilityTags.push('semantic-html');
  }

  steps.push({
    stepNumber: stepNumber++,
    action: 'Run comprehensive DOM inspection using accessibility-based selectors',
    expectedResult: 'All DOM elements meet accessibility requirements using programmatic validation',
  });

  // Build validation criteria
  const validationCriteria: ValidationCriteria = {
    behavior: [],
    compliance: [...new Set(wcagCriteria)].map(criteria => `WCAG ${criteria}`),
  };

  if (hasImageAlt) {
    validationCriteria.behavior!.push('Images have meaningful alternative text or are marked decorative');
  }
  if (hasFormLabels) {
    validationCriteria.behavior!.push('Form controls have programmatically associated labels');
  }
  if (hasHeadingHierarchy) {
    validationCriteria.behavior!.push('Heading hierarchy follows logical sequence without gaps');
  }
  if (hasLandmarks) {
    validationCriteria.behavior!.push('Page landmarks provide clear navigation structure');
  }
  if (hasSemanticHTML) {
    validationCriteria.behavior!.push('Semantic HTML elements convey meaning and structure');
  }

  // Create test case
  const testCase: Partial<AccessibilityTestCase> = {
    title: 'DOM Inspection - Accessibility-Based Validation',
    description: `Comprehensive DOM inspection of ${websiteAnalysis.url} using accessibility-based selectors to validate ${requirementTypes.join(', ')}`,
    category: 'Regression',
    testType: 'Accessibility',
    priority: 'High',
    severity: 'High',
    stability: 'Stable',
    wcagVersion: '2.1',
    wcagPrinciple: ['Perceivable', 'Understandable', 'Robust'],
    wcagSuccessCriteria: [...new Set(wcagCriteria)],
    assistiveTechnology: ['Keyboard'],
    accessibilityTags,
    keyboardAccess: false,
    preconditions: [
      'Page is accessible and loaded',
      'DOM elements are rendered and interactive',
    ],
    steps,
    expectedResult: 'All DOM elements meet accessibility requirements through programmatic validation',
    validationCriteria,
  };

  return formatTestCase(testCase, 'Accessibility') as AccessibilityTestCase;
}

/**
 * Generate Keyboard Navigation Test
 * 
 * Creates a test case for verifying keyboard accessibility of interactive elements.
 * 
 * @param websiteAnalysis - Website analysis data
 * @param elements - Interactive elements to test
 * @returns Accessibility test case for keyboard navigation
 */
export function generateKeyboardNavigationTest(
  websiteAnalysis: WebsiteAnalysis,
  elements: InteractiveElement[]
): AccessibilityTestCase {
  const steps: TestStep[] = [
    {
      stepNumber: 1,
      action: `Navigate to ${websiteAnalysis.url}`,
      expectedResult: 'Page loads successfully',
    },
    {
      stepNumber: 2,
      action: 'Press Tab key repeatedly to navigate through interactive elements',
      expectedResult: 'Focus moves sequentially through all interactive elements',
    },
    {
      stepNumber: 3,
      action: 'Verify visible focus indicator on each element',
      expectedResult: 'Each focused element has a clear, visible focus indicator',
    },
    {
      stepNumber: 4,
      action: 'Press Shift+Tab to navigate backward',
      expectedResult: 'Focus moves backward through elements in reverse order',
    },
    {
      stepNumber: 5,
      action: 'Press Enter or Space on buttons and links',
      expectedResult: 'Elements activate without requiring mouse interaction',
    },
    {
      stepNumber: 6,
      action: 'Verify no keyboard traps exist',
      expectedResult: 'User can navigate away from all elements using keyboard only',
    },
  ];
  
  const validationCriteria: ValidationCriteria = {
    behavior: [
      'Tab key moves focus forward through interactive elements',
      'Shift+Tab moves focus backward',
      'Enter/Space activates buttons and links',
      'Focus order is logical and follows visual layout',
      'No keyboard traps prevent navigation',
    ],
    compliance: [
      'WCAG 2.1.1 Keyboard (Level A)',
      'WCAG 2.4.7 Focus Visible (Level AA)',
      'WCAG 2.1.2 No Keyboard Trap (Level A)',
    ],
  };
  
  const testCase: Partial<AccessibilityTestCase> = {
    title: 'Keyboard Navigation - All Interactive Elements',
    description: `Verify all interactive elements on ${websiteAnalysis.url} are accessible via keyboard navigation`,
    category: 'Regression',
    testType: 'Accessibility',
    priority: 'High',
    severity: 'High',
    stability: 'Stable',
    wcagVersion: '2.1',
    wcagPrinciple: ['Operable'],
    wcagSuccessCriteria: ['2.1.1', '2.1.2', '2.4.7'],
    assistiveTechnology: ['Keyboard'],
    accessibilityTags: ['keyboard-navigation', 'focus-management'],
    keyboardAccess: true,
    preconditions: [
      'Page is accessible and loaded',
      'Keyboard is available for input',
      'No modal dialogs are open initially',
    ],
    steps,
    expectedResult: 'All interactive elements are fully accessible via keyboard without mouse',
    validationCriteria,
  };
  
  return formatTestCase(testCase, 'Accessibility') as AccessibilityTestCase;
}

/**
 * Generate Screen Reader Test
 * 
 * Creates a test case for verifying screen reader compatibility.
 * 
 * @param websiteAnalysis - Website analysis data
 * @param elements - Interactive elements to test
 * @returns Accessibility test case for screen reader compatibility
 */
export function generateScreenReaderTest(
  websiteAnalysis: WebsiteAnalysis,
  elements: InteractiveElement[]
): AccessibilityTestCase {
  const steps: TestStep[] = [
    {
      stepNumber: 1,
      action: `Navigate to ${websiteAnalysis.url} with screen reader enabled`,
      expectedResult: 'Page loads and screen reader announces page title',
    },
    {
      stepNumber: 2,
      action: 'Navigate through page using screen reader commands',
      expectedResult: 'Screen reader announces all content in logical order',
    },
    {
      stepNumber: 3,
      action: 'Verify ARIA labels are present on interactive elements',
      expectedResult: 'All buttons, links, and inputs have meaningful labels or aria-label attributes',
    },
    {
      stepNumber: 4,
      action: 'Verify ARIA roles are appropriate for element types',
      expectedResult: 'Elements have correct ARIA roles (button, link, navigation, etc.)',
    },
    {
      stepNumber: 5,
      action: 'Verify form labels are associated with inputs',
      expectedResult: 'Screen reader announces label when input receives focus',
    },
    {
      stepNumber: 6,
      action: 'Verify semantic HTML is used (headings, landmarks, lists)',
      expectedResult: 'Screen reader can navigate by headings and landmarks',
    },
  ];
  
  const validationCriteria: ValidationCriteria = {
    compliance: [
      'WCAG 1.3.1 Info and Relationships (Level A)',
      'WCAG 2.4.6 Headings and Labels (Level AA)',
      'WCAG 4.1.2 Name, Role, Value (Level A)',
    ],
    behavior: [
      'All interactive elements have accessible names',
      'ARIA labels are meaningful and descriptive',
      'ARIA roles match element functionality',
      'Form labels are properly associated',
      'Semantic HTML structure is present',
    ],
  };
  
  const testCase: Partial<AccessibilityTestCase> = {
    title: 'Screen Reader Compatibility - ARIA and Semantic HTML',
    description: `Verify ${websiteAnalysis.url} is compatible with screen readers and uses proper ARIA attributes`,
    category: 'Regression',
    testType: 'Accessibility',
    priority: 'High',
    severity: 'High',
    stability: 'Stable',
    wcagVersion: '2.1',
    wcagPrinciple: ['Perceivable', 'Understandable', 'Robust'],
    wcagSuccessCriteria: ['1.3.1', '2.4.6', '4.1.2'],
    assistiveTechnology: ['NVDA', 'JAWS', 'VoiceOver'],
    accessibilityTags: ['screen-reader', 'aria', 'semantic-html'],
    keyboardAccess: true,
    preconditions: [
      'Screen reader software is installed and enabled',
      'Page is accessible and loaded',
      'Audio output is available for verification',
    ],
    steps,
    expectedResult: 'All content is accessible and properly announced by screen readers',
    validationCriteria,
  };
  
  return formatTestCase(testCase, 'Accessibility') as AccessibilityTestCase;
}

/**
 * Generate Color Contrast Test
 * 
 * Creates a test case for verifying WCAG color contrast requirements.
 * 
 * @param websiteAnalysis - Website analysis data
 * @returns Accessibility test case for color contrast
 */
export function generateColorContrastTest(
  websiteAnalysis: WebsiteAnalysis
): AccessibilityTestCase {
  const steps: TestStep[] = [
    {
      stepNumber: 1,
      action: `Navigate to ${websiteAnalysis.url}`,
      expectedResult: 'Page loads successfully',
    },
    {
      stepNumber: 2,
      action: 'Verify text color contrast against background',
      expectedResult: 'Normal text has minimum 4.5:1 contrast ratio (WCAG AA)',
    },
    {
      stepNumber: 3,
      action: 'Verify large text color contrast (18pt or 14pt bold)',
      expectedResult: 'Large text has minimum 3:1 contrast ratio (WCAG AA)',
    },
    {
      stepNumber: 4,
      action: 'Verify interactive element contrast (buttons, links, inputs)',
      expectedResult: 'Interactive elements have minimum 3:1 contrast ratio',
    },
    {
      stepNumber: 5,
      action: 'Verify focus indicator contrast',
      expectedResult: 'Focus indicators have minimum 3:1 contrast ratio against background',
    },
    {
      stepNumber: 6,
      action: 'Use automated contrast checker tool',
      expectedResult: 'No contrast violations detected by automated tools',
    },
  ];
  
  const validationCriteria: ValidationCriteria = {
    compliance: [
      'WCAG 1.4.3 Contrast (Minimum) - Level AA',
      'WCAG 1.4.11 Non-text Contrast - Level AA',
    ],
    behavior: [
      'Normal text meets 4.5:1 contrast ratio',
      'Large text meets 3:1 contrast ratio',
      'Interactive elements meet 3:1 contrast ratio',
      'Focus indicators are clearly visible',
    ],
  };
  
  const testCase: Partial<AccessibilityTestCase> = {
    title: 'Color Contrast - WCAG AA Compliance',
    description: `Verify color contrast ratios on ${websiteAnalysis.url} meet WCAG AA standards`,
    category: 'Regression',
    testType: 'Accessibility',
    priority: 'High',
    severity: 'Medium',
    stability: 'Stable',
    wcagVersion: '2.1',
    wcagPrinciple: ['Perceivable'],
    wcagSuccessCriteria: ['1.4.3', '1.4.11'],
    assistiveTechnology: ['Keyboard'],
    accessibilityTags: ['color-contrast', 'visual'],
    keyboardAccess: false,
    preconditions: [
      'Page is accessible and loaded',
      'Contrast checking tool is available',
    ],
    steps,
    expectedResult: 'All text and interactive elements meet WCAG AA contrast requirements',
    validationCriteria,
  };
  
  return formatTestCase(testCase, 'Accessibility') as AccessibilityTestCase;
}

/**
 * Generate Form Accessibility Test
 * 
 * Creates a test case for verifying form accessibility.
 * 
 * @param websiteAnalysis - Website analysis data
 * @param formElements - Form elements to test
 * @returns Accessibility test case for form accessibility
 */
export function generateFormAccessibilityTest(
  websiteAnalysis: WebsiteAnalysis,
  formElements: InteractiveElement[]
): AccessibilityTestCase {
  const steps: TestStep[] = [
    {
      stepNumber: 1,
      action: `Navigate to ${websiteAnalysis.url}`,
      expectedResult: 'Page loads successfully with form visible',
    },
    {
      stepNumber: 2,
      action: 'Verify all form inputs have associated labels',
      expectedResult: 'Each input has a visible label or aria-label attribute',
    },
    {
      stepNumber: 3,
      action: 'Verify required fields are indicated',
      expectedResult: 'Required fields have visual indicator and aria-required attribute',
    },
    {
      stepNumber: 4,
      action: 'Submit form with invalid data',
      expectedResult: 'Error messages are displayed and announced by screen readers',
    },
    {
      stepNumber: 5,
      action: 'Verify error messages are associated with fields',
      expectedResult: 'Error messages use aria-describedby to link to inputs',
    },
    {
      stepNumber: 6,
      action: 'Verify fieldsets and legends for grouped inputs',
      expectedResult: 'Related inputs are grouped with fieldset and legend elements',
    },
  ];
  
  const validationCriteria: ValidationCriteria = {
    compliance: [
      'WCAG 1.3.1 Info and Relationships (Level A)',
      'WCAG 3.3.2 Labels or Instructions (Level A)',
      'WCAG 4.1.3 Status Messages (Level AA)',
    ],
    behavior: [
      'All inputs have associated labels',
      'Required fields are clearly indicated',
      'Error messages are descriptive and accessible',
      'Error messages are programmatically associated with fields',
      'Grouped inputs use fieldset and legend',
    ],
  };
  
  const testCase: Partial<AccessibilityTestCase> = {
    title: 'Form Accessibility - Labels and Error Handling',
    description: `Verify form accessibility on ${websiteAnalysis.url} including labels, required fields, and error messages`,
    category: 'Regression',
    testType: 'Accessibility',
    priority: 'High',
    severity: 'High',
    stability: 'Stable',
    wcagVersion: '2.1',
    wcagPrinciple: ['Perceivable', 'Understandable', 'Robust'],
    wcagSuccessCriteria: ['1.3.1', '3.3.2', '4.1.3'],
    assistiveTechnology: ['NVDA', 'JAWS', 'VoiceOver', 'Keyboard'],
    accessibilityTags: ['forms', 'labels', 'error-handling'],
    keyboardAccess: true,
    preconditions: [
      'Page is accessible and loaded',
      'Form is visible and interactive',
      'Screen reader is available for testing',
    ],
    steps,
    expectedResult: 'Form is fully accessible with proper labels, required field indicators, and error handling',
    validationCriteria,
  };
  
  return formatTestCase(testCase, 'Accessibility') as AccessibilityTestCase;
}

/**
 * Generate Focus Management Test
 * 
 * Creates a test case for verifying focus management and indicators.
 * 
 * @param websiteAnalysis - Website analysis data
 * @param focusableElements - Focusable elements to test
 * @returns Accessibility test case for focus management
 */
export function generateFocusManagementTest(
  websiteAnalysis: WebsiteAnalysis,
  focusableElements: InteractiveElement[]
): AccessibilityTestCase {
  const steps: TestStep[] = [
    {
      stepNumber: 1,
      action: `Navigate to ${websiteAnalysis.url}`,
      expectedResult: 'Page loads successfully',
    },
    {
      stepNumber: 2,
      action: 'Verify focus order is logical and follows visual layout',
      expectedResult: 'Tab order matches visual reading order (left-to-right, top-to-bottom)',
    },
    {
      stepNumber: 3,
      action: 'Verify all interactive elements have visible focus indicators',
      expectedResult: 'Each element shows clear visual indicator when focused',
    },
    {
      stepNumber: 4,
      action: 'Open modal or dialog if present',
      expectedResult: 'Focus moves to modal and is trapped within modal',
    },
    {
      stepNumber: 5,
      action: 'Close modal or dialog',
      expectedResult: 'Focus returns to element that triggered modal',
    },
    {
      stepNumber: 6,
      action: 'Verify skip links are present and functional',
      expectedResult: 'Skip links allow bypassing repetitive content',
    },
  ];
  
  const validationCriteria: ValidationCriteria = {
    compliance: [
      'WCAG 2.4.3 Focus Order (Level A)',
      'WCAG 2.4.7 Focus Visible (Level AA)',
      'WCAG 2.4.1 Bypass Blocks (Level A)',
    ],
    behavior: [
      'Focus order is logical and predictable',
      'Focus indicators are clearly visible',
      'Focus is properly managed in modals',
      'Focus returns to trigger element after modal close',
      'Skip links are available and functional',
    ],
  };
  
  const testCase: Partial<AccessibilityTestCase> = {
    title: 'Focus Management - Order and Indicators',
    description: `Verify focus management on ${websiteAnalysis.url} including focus order, indicators, and modal handling`,
    category: 'Regression',
    testType: 'Accessibility',
    priority: 'High',
    severity: 'High',
    stability: 'Stable',
    wcagVersion: '2.1',
    wcagPrinciple: ['Operable'],
    wcagSuccessCriteria: ['2.4.1', '2.4.3', '2.4.7'],
    assistiveTechnology: ['Keyboard'],
    accessibilityTags: ['focus-management', 'focus-indicators', 'modals'],
    keyboardAccess: true,
    preconditions: [
      'Page is accessible and loaded',
      'Keyboard is available for input',
    ],
    steps,
    expectedResult: 'Focus management is proper with logical order, visible indicators, and correct modal handling',
    validationCriteria,
  };
  
  return formatTestCase(testCase, 'Accessibility') as AccessibilityTestCase;
}

/**
 * Generate Accessibility Automation Code
 * 
 * Creates executable Playwright code with axe-core integration for automated
 * accessibility testing. Includes keyboard navigation, ARIA verification,
 * focus indicator checks, DOM inspection using accessibility-based selectors,
 * and comprehensive accessibility scanning.
 * 
 * Enhanced with DOM inspection code generation for Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 * 
 * @param testCase - Accessibility test case to generate code for
 * @param url - URL to test
 * @returns Playwright test code with axe-core integration and DOM inspection
 */
export function generateAccessibilityAutomationCode(
  testCase: AccessibilityTestCase,
  url: string
): string {
  const testTitle = testCase.title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-').toLowerCase();
  
  // Determine which automation patterns to include based on test type
  const includeKeyboard = testCase.accessibilityTags.includes('keyboard-navigation') || 
                          testCase.keyboardAccess;
  const includeScreenReader = testCase.accessibilityTags.includes('screen-reader') || 
                              testCase.accessibilityTags.includes('aria');
  const includeContrast = testCase.accessibilityTags.includes('color-contrast');
  const includeFocus = testCase.accessibilityTags.includes('focus-management') || 
                       testCase.accessibilityTags.includes('focus-indicators');
  const includeForms = testCase.accessibilityTags.includes('forms');
  
  // NEW: DOM inspection patterns (Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6)
  const includeDOMInspection = testCase.accessibilityTags.includes('dom-inspection');
  const includeImageAlt = testCase.accessibilityTags.includes('image-alt');
  const includeFormLabels = testCase.accessibilityTags.includes('form-labels');
  const includeHeadingHierarchy = testCase.accessibilityTags.includes('heading-hierarchy');
  const includeLandmarks = testCase.accessibilityTags.includes('landmarks');
  const includeSemanticHTML = testCase.accessibilityTags.includes('semantic-html');
  
  let code = `import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * ${testCase.title}
 * 
 * ${testCase.description}
 * 
 * WCAG ${testCase.wcagVersion} - ${testCase.wcagPrinciple.join(', ')}
 * Success Criteria: ${testCase.wcagSuccessCriteria.join(', ')}
 * Assistive Technology: ${testCase.assistiveTechnology.join(', ')}
 */
test('${testTitle}', async ({ page }) => {
  // Navigate to page
  await page.goto('${url}');
  await page.waitForLoadState('networkidle');
  
`;

  // NEW: Add DOM inspection code using accessibility-based selectors
  if (includeDOMInspection || includeImageAlt || includeFormLabels || includeHeadingHierarchy || includeLandmarks || includeSemanticHTML) {
    code += `  // DOM Inspection using Accessibility-Based Selectors
  // Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
  
`;

    // Generate image alt validation code (Requirement 2.1, 2.2)
    if (includeImageAlt || includeDOMInspection) {
      code += `  // Image Alt Attribute Validation
  // Validates: Requirements 2.1, 2.2 - Image accessibility using accessibility-based selectors
  
  // Find all images using accessibility-focused selectors
  const images = await page.locator('img, svg[role="img"], canvas[role="img"], [role="img"]').all();
  
  for (const image of images) {
    const tagName = await image.evaluate(el => el.tagName.toLowerCase());
    const altText = await image.getAttribute('alt');
    const ariaLabel = await image.getAttribute('aria-label');
    const ariaLabelledBy = await image.getAttribute('aria-labelledby');
    const role = await image.getAttribute('role');
    
    // Check if image is decorative (empty alt or role="presentation")
    const isDecorative = altText === '' || role === 'presentation' || role === 'none';
    
    if (!isDecorative) {
      // Informative images must have meaningful alternative text
      const hasAccessibleName = altText || ariaLabel || ariaLabelledBy;
      expect(hasAccessibleName).toBeTruthy();
      
      if (altText) {
        // Alt text should not be empty or just whitespace
        expect(altText.trim()).not.toBe('');
        
        // Alt text should not contain redundant phrases
        const redundantPhrases = ['image of', 'picture of', 'graphic of', 'photo of'];
        const hasRedundantPhrase = redundantPhrases.some(phrase => 
          altText.toLowerCase().includes(phrase)
        );
        expect(hasRedundantPhrase).toBe(false);
      }
    } else {
      // Decorative images should have empty alt or appropriate role
      const isProperlyMarkedDecorative = 
        altText === '' || role === 'presentation' || role === 'none';
      expect(isProperlyMarkedDecorative).toBe(true);
    }
  }
  
`;
    }

    // Generate form label validation code (Requirement 2.2, 2.3)
    if (includeFormLabels || includeDOMInspection) {
      code += `  // Form Label Validation
  // Validates: Requirements 2.2, 2.3 - Form accessibility using accessibility-based selectors
  
  // Find all form controls using accessibility-focused selectors
  const formControls = await page.locator('input:not([type="hidden"]), textarea, select').all();
  
  for (const control of formControls) {
    const id = await control.getAttribute('id');
    const ariaLabel = await control.getAttribute('aria-label');
    const ariaLabelledBy = await control.getAttribute('aria-labelledby');
    const type = await control.getAttribute('type');
    
    // Skip submit buttons and other non-input controls
    if (type === 'submit' || type === 'button' || type === 'reset') {
      continue;
    }
    
    // Verify form control has accessible name
    let hasAccessibleName = false;
    
    // Check for aria-label
    if (ariaLabel && ariaLabel.trim() !== '') {
      hasAccessibleName = true;
    }
    
    // Check for aria-labelledby association
    if (ariaLabelledBy) {
      const labelledByElements = await page.locator(\`#\${ariaLabelledBy.split(' ').join(', #')}\`).count();
      hasAccessibleName = labelledByElements > 0;
    }
    
    // Check for explicit label association (for/id relationship)
    if (id) {
      const explicitLabel = await page.locator(\`label[for="\${id}"]\`).count();
      if (explicitLabel > 0) {
        hasAccessibleName = true;
        
        // Verify label text is meaningful
        const labelText = await page.locator(\`label[for="\${id}"]\`).textContent();
        expect(labelText?.trim()).not.toBe('');
      }
    }
    
    // Check for implicit label association (label wrapping input)
    if (!hasAccessibleName) {
      const implicitLabel = await control.evaluate(el => {
        const label = el.closest('label');
        return label ? label.textContent?.trim() : null;
      });
      
      if (implicitLabel && implicitLabel !== '') {
        hasAccessibleName = true;
      }
    }
    
    // Assert that form control has accessible name
    expect(hasAccessibleName).toBeTruthy();
  }
  
`;
    }

    // Generate heading hierarchy validation code (Requirement 2.5, 2.6)
    if (includeHeadingHierarchy || includeDOMInspection) {
      code += `  // Heading Hierarchy Validation
  // Validates: Requirements 2.5, 2.6 - Heading hierarchy using accessibility-based selectors
  
  // Find all headings using accessibility-focused selectors
  const headings = await page.locator('h1, h2, h3, h4, h5, h6, [role="heading"]').all();
  
  if (headings.length > 0) {
    const headingData = [];
    
    // Collect heading information
    for (const heading of headings) {
      const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
      const ariaLevel = await heading.getAttribute('aria-level');
      const textContent = await heading.textContent();
      
      let level;
      if (tagName.startsWith('h') && tagName.length === 2) {
        level = parseInt(tagName.charAt(1));
      } else if (ariaLevel) {
        level = parseInt(ariaLevel);
      } else {
        level = 1; // Default for role="heading" without aria-level
      }
      
      headingData.push({
        level,
        text: textContent?.trim() || '',
        tagName
      });
    }
    
    // Validate heading hierarchy rules
    
    // 1. Page should start with h1
    const firstHeading = headingData[0];
    expect(firstHeading.level).toBe(1);
    
    // 2. Headings should not skip levels
    for (let i = 1; i < headingData.length; i++) {
      const currentLevel = headingData[i].level;
      const previousLevel = headingData[i - 1].level;
      
      // Can stay same level, go up one level, or go down any number of levels
      const levelDifference = currentLevel - previousLevel;
      expect(levelDifference).toBeLessThanOrEqual(1);
    }
    
    // 3. All headings should have meaningful text content
    for (const heading of headingData) {
      expect(heading.text).not.toBe('');
      expect(heading.text.length).toBeGreaterThan(0);
    }
  }
  
`;
    }

    // Generate landmark validation code (Requirement 2.5, 2.6)
    if (includeLandmarks || includeDOMInspection) {
      code += `  // Landmark Validation
  // Validates: Requirements 2.5, 2.6 - Page landmarks using accessibility-based selectors
  
  // Validate essential landmarks are present
  const mainLandmark = await page.locator('main, [role="main"]').count();
  expect(mainLandmark).toBe(1); // Exactly one main landmark
  
  const bannerLandmark = await page.locator('header, [role="banner"]').count();
  expect(bannerLandmark).toBeGreaterThanOrEqual(1); // At least one banner
  
  const contentinfoLandmark = await page.locator('footer, [role="contentinfo"]').count();
  expect(contentinfoLandmark).toBeGreaterThanOrEqual(1); // At least one contentinfo
  
  // Validate navigation landmarks have meaningful content
  const navigations = await page.locator('nav, [role="navigation"]').all();
  for (const nav of navigations) {
    const links = await nav.locator('a, [role="link"]').count();
    const buttons = await nav.locator('button, [role="button"]').count();
    const interactiveElements = links + buttons;
    
    expect(interactiveElements).toBeGreaterThan(0);
  }
  
`;
    }

    // Generate semantic HTML validation code (Requirement 2.5, 2.6)
    if (includeSemanticHTML || includeDOMInspection) {
      code += `  // Semantic HTML Validation
  // Validates: Requirements 2.5, 2.6 - Semantic HTML structure using accessibility-based selectors
  
  // Validate article elements have headings
  const articles = await page.locator('article').all();
  for (const article of articles) {
    const headings = await article.locator('h1, h2, h3, h4, h5, h6, [role="heading"]').count();
    expect(headings).toBeGreaterThan(0);
  }
  
  // Validate figure and figcaption relationships
  const figures = await page.locator('figure').all();
  for (const figure of figures) {
    const figcaption = await figure.locator('figcaption').count();
    if (figcaption > 0) {
      // Figcaption should be first or last child of figure
      const figcaptionPosition = await figure.evaluate(fig => {
        const caption = fig.querySelector('figcaption');
        if (!caption) return null;
        const children = Array.from(fig.children);
        const index = children.indexOf(caption);
        return index === 0 || index === children.length - 1;
      });
      expect(figcaptionPosition).toBe(true);
    }
  }
  
`;
    }
  }

  // Add keyboard navigation code
  if (includeKeyboard) {
    code += `  // Keyboard Navigation Testing
  // Verify Tab key navigation through interactive elements
  const interactiveElements = await page.locator('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])').all();
  
  // Focus first element
  await page.keyboard.press('Tab');
  
  // Verify focus moves through elements
  for (let i = 0; i < Math.min(interactiveElements.length, 10); i++) {
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        tagName: el?.tagName.toLowerCase(),
        hasFocusIndicator: window.getComputedStyle(el as Element).outline !== 'none'
      };
    });
    
    // Verify element is focused
    expect(focusedElement.tagName).toBeTruthy();
    
    // Move to next element
    await page.keyboard.press('Tab');
  }
  
  // Test backward navigation with Shift+Tab
  await page.keyboard.press('Shift+Tab');
  
  // Test activation with Enter/Space
  const firstButton = await page.locator('button').first();
  if (await firstButton.count() > 0) {
    await firstButton.focus();
    await page.keyboard.press('Enter');
    // Verify button was activated (page state changed or event fired)
  }
  
`;
  }

  // Add ARIA attribute verification code
  if (includeScreenReader) {
    code += `  // ARIA Attribute Verification
  // Verify interactive elements have accessible names
  const buttons = await page.locator('button').all();
  for (const button of buttons) {
    const ariaLabel = await button.getAttribute('aria-label');
    const ariaLabelledBy = await button.getAttribute('aria-labelledby');
    const textContent = await button.textContent();
    
    // Button should have accessible name via aria-label, aria-labelledby, or text content
    expect(ariaLabel || ariaLabelledBy || textContent?.trim()).toBeTruthy();
  }
  
  // Verify ARIA roles are appropriate
  const elementsWithRoles = await page.locator('[role]').all();
  for (const element of elementsWithRoles) {
    const role = await element.getAttribute('role');
    const validRoles = ['button', 'link', 'navigation', 'main', 'complementary', 'banner', 
                        'contentinfo', 'search', 'form', 'dialog', 'alert', 'status'];
    expect(validRoles).toContain(role);
  }
  
  // Verify form labels are associated with inputs
  const inputs = await page.locator('input, textarea, select').all();
  for (const input of inputs) {
    const id = await input.getAttribute('id');
    const ariaLabel = await input.getAttribute('aria-label');
    const ariaLabelledBy = await input.getAttribute('aria-labelledby');
    
    if (id) {
      const label = await page.locator(\`label[for="\${id}"]\`).count();
      // Input should have associated label or aria-label
      expect(label > 0 || ariaLabel || ariaLabelledBy).toBeTruthy();
    }
  }
  
`;
  }

  // Add focus indicator verification code
  if (includeFocus) {
    code += `  // Focus Indicator Verification
  // Verify visible focus indicators on interactive elements
  const focusableElements = await page.locator('button, a, input, select, textarea').all();
  
  for (const element of focusableElements.slice(0, 5)) {
    await element.focus();
    
    // Check if focus indicator is visible
    const focusStyles = await page.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        outlineStyle: styles.outlineStyle,
        outlineColor: styles.outlineColor,
        boxShadow: styles.boxShadow,
        border: styles.border
      };
    }, await element.elementHandle());
    
    // Verify focus indicator exists (outline, box-shadow, or border change)
    const hasFocusIndicator = 
      (focusStyles.outline && focusStyles.outline !== 'none') ||
      (focusStyles.outlineWidth && focusStyles.outlineWidth !== '0px') ||
      (focusStyles.boxShadow && focusStyles.boxShadow !== 'none') ||
      (focusStyles.border && focusStyles.border !== 'none');
    
    expect(hasFocusIndicator).toBeTruthy();
  }
  
`;
  }

  // Add form accessibility code
  if (includeForms) {
    code += `  // Form Accessibility Testing
  // Verify required fields are indicated
  const requiredInputs = await page.locator('input[required], textarea[required], select[required]').all();
  for (const input of requiredInputs) {
    const ariaRequired = await input.getAttribute('aria-required');
    const required = await input.getAttribute('required');
    
    // Required fields should have aria-required or required attribute
    expect(ariaRequired === 'true' || required !== null).toBeTruthy();
  }
  
  // Test error message accessibility
  const form = await page.locator('form').first();
  if (await form.count() > 0) {
    // Submit form with invalid data to trigger errors
    await form.evaluate((f) => {
      const submitBtn = f.querySelector('button[type="submit"], input[type="submit"]');
      if (submitBtn) (submitBtn as HTMLElement).click();
    });
    
    // Wait for error messages
    await page.waitForTimeout(500);
    
    // Verify error messages are associated with fields
    const errorMessages = await page.locator('[role="alert"], .error, [aria-invalid="true"]').all();
    for (const error of errorMessages) {
      const ariaDescribedBy = await error.getAttribute('aria-describedby');
      const role = await error.getAttribute('role');
      
      // Error should be announced via role="alert" or aria-describedby
      expect(role === 'alert' || ariaDescribedBy).toBeTruthy();
    }
  }
  
`;
  }

  // Add comprehensive axe-core scanning (always included)
  code += `  // Comprehensive Accessibility Scanning with axe-core
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  
  // Verify no critical accessibility violations
  expect(accessibilityScanResults.violations).toHaveLength(0);
  
  // Log any incomplete or needs review items
  if (accessibilityScanResults.incomplete.length > 0) {
    console.log('Incomplete accessibility checks:', accessibilityScanResults.incomplete.length);
  }
  
  // Verify passes (successful checks)
  expect(accessibilityScanResults.passes.length).toBeGreaterThan(0);
});
`;

  return code;
}
