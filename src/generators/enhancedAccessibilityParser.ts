/**
 * Enhanced Accessibility Parser Module
 * 
 * Provides sophisticated instruction parsing for accessibility-specific testing patterns.
 * This module extends the existing accessibility testing capabilities with advanced
 * pattern recognition for DOM inspection, keyboard navigation, ARIA compliance,
 * visual accessibility, and WCAG guideline requirements.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

import type { WebsiteAnalysis } from './testIntentClassifier';

/**
 * Accessibility Test Requirements Interface
 * 
 * Represents the complete set of accessibility testing requirements
 * parsed from user instructions.
 */
export interface AccessibilityTestRequirements {
  domInspection: DOMInspectionRequirement[];
  keyboardNavigation: KeyboardNavigationRequirement[];
  ariaCompliance: ARIAComplianceRequirement[];
  visualAccessibility: VisualAccessibilityRequirement[];
  wcagGuidelines: WCAGGuidelineRequirement[];
  axeCoreIntegration: AxeCoreConfiguration;
}

/**
 * DOM Inspection Requirement Interface
 * 
 * Represents requirements for inspecting DOM elements for accessibility attributes.
 */
export interface DOMInspectionRequirement {
  type: 'image-alt' | 'form-labels' | 'heading-hierarchy' | 'landmarks' | 'semantic-html';
  elements: string[]; // CSS selectors or element types
  validationRules: ValidationRule[];
  wcagCriteria: string[];
}

/**
 * Keyboard Navigation Requirement Interface
 * 
 * Represents requirements for testing keyboard navigation patterns.
 */
export interface KeyboardNavigationRequirement {
  type: 'tab-sequence' | 'focus-order' | 'keyboard-activation' | 'focus-management' | 'keyboard-traps';
  scope: 'page' | 'component' | 'modal' | 'form';
  expectedBehavior: string;
  wcagCriteria: string[];
}

/**
 * ARIA Compliance Requirement Interface
 * 
 * Represents requirements for validating ARIA attribute usage and compliance.
 */
export interface ARIAComplianceRequirement {
  type: 'aria-labels' | 'aria-descriptions' | 'aria-live-regions' | 'aria-states' | 'aria-roles';
  attributes: string[];
  validationLogic: string;
  wcagCriteria: string[];
}

/**
 * Visual Accessibility Requirement Interface
 * 
 * Represents requirements for testing visual accessibility features.
 */
export interface VisualAccessibilityRequirement {
  type: 'color-contrast' | 'focus-indicators' | 'interactive-element-contrast';
  contrastRatio: number;
  scope: string[];
  wcagCriteria: string[];
}

/**
 * WCAG Guideline Requirement Interface
 * 
 * Represents requirements for validating specific WCAG success criteria.
 */
export interface WCAGGuidelineRequirement {
  successCriteria: string;
  level: 'A' | 'AA' | 'AAA';
  validationType: 'automated' | 'manual' | 'hybrid';
  testingApproach: string;
}

/**
 * Validation Rule Interface
 * 
 * Represents a specific validation rule for accessibility testing.
 */
export interface ValidationRule {
  attribute: string;
  condition: 'present' | 'absent' | 'equals' | 'contains' | 'matches';
  expectedValue?: string;
  description: string;
}

/**
 * Axe-Core Configuration Interface
 * 
 * Configuration for Axe-Core accessibility testing integration.
 */
export interface AxeCoreConfiguration {
  rulesets: WCAGRuleset[];
  tags: string[];
  violationHandling: ViolationHandlingStrategy;
  reportingLevel: 'violations' | 'incomplete' | 'passes' | 'all';
}

/**
 * WCAG Ruleset Enumeration
 * 
 * Supported WCAG rulesets for Axe-Core integration.
 */
export enum WCAGRuleset {
  WCAG20A = 'wcag2a',
  WCAG20AA = 'wcag2aa',
  WCAG21A = 'wcag21a',
  WCAG21AA = 'wcag21aa',
  WCAG22AA = 'wcag22aa',
  SECTION508 = 'section508'
}

/**
 * Violation Handling Strategy Enumeration
 * 
 * Strategies for handling accessibility violations found by Axe-Core.
 */
export enum ViolationHandlingStrategy {
  FAIL_ON_VIOLATIONS = 'fail-on-violations',
  WARN_ON_VIOLATIONS = 'warn-on-violations',
  LOG_ONLY = 'log-only'
}

/**
 * Accessibility Pattern Interface
 * 
 * Represents a recognized accessibility testing pattern from user instructions.
 */
export interface AccessibilityPattern {
  pattern: string;
  confidence: number;
  category: AccessibilityCategory;
  keywords: string[];
  context: PatternContext;
}

/**
 * Accessibility Category Enumeration
 * 
 * Categories of accessibility testing patterns.
 */
export enum AccessibilityCategory {
  DOM_INSPECTION = 'dom-inspection',
  KEYBOARD_NAVIGATION = 'keyboard-navigation',
  ARIA_COMPLIANCE = 'aria-compliance',
  VISUAL_ACCESSIBILITY = 'visual-accessibility',
  WCAG_GUIDELINES = 'wcag-guidelines'
}

/**
 * Pattern Context Interface
 * 
 * Context information for accessibility patterns.
 */
export interface PatternContext {
  elementTypes: string[];
  interactionTypes: string[];
  validationTypes: string[];
  wcagReferences: string[];
}

/**
 * Enhanced Accessibility Instruction Parser
 * 
 * Main parser class for understanding accessibility-specific instructions
 * and mapping them to test requirements.
 */
export class EnhancedAccessibilityParser {
  private patternRecognizer: AccessibilityPatternRecognizer;

  constructor() {
    this.patternRecognizer = new AccessibilityPatternRecognizer();
  }

  /**
   * Parse accessibility instructions into structured test requirements
   * 
   * This method now handles both instruction-based and pattern-based parsing:
   * 1. Instruction-based: Parses specific user instructions into actionable test steps
   * 2. Pattern-based: Generates comprehensive accessibility tests based on detected patterns
   * 
   * @param userInput - User's accessibility testing instructions
   * @param websiteAnalysis - Analysis of the website structure
   * @returns Structured accessibility test requirements
   */
  parseInstructions(userInput: string, websiteAnalysis: WebsiteAnalysis): AccessibilityTestRequirements {
    console.log('[EnhancedAccessibilityParser] Parsing instructions:', userInput);
    
    // CRITICAL FIX: Check if input contains specific step-by-step instructions
    const isInstructionBased = this.isInstructionBasedInput(userInput);
    console.log('[EnhancedAccessibilityParser] Instruction-based input detected:', isInstructionBased);
    
    let domInspection: DOMInspectionRequirement[] = [];
    let keyboardNavigation: KeyboardNavigationRequirement[] = [];
    let ariaCompliance: ARIAComplianceRequirement[] = [];
    let visualAccessibility: VisualAccessibilityRequirement[] = [];
    let wcagGuidelines: WCAGGuidelineRequirement[] = [];
    
    if (isInstructionBased) {
      // CRITICAL FIX: Parse specific instructions into actionable test steps
      console.log('[EnhancedAccessibilityParser] Using instruction-based parsing');
      const instructionRequirements = this.parseSpecificInstructions(userInput, websiteAnalysis);
      
      domInspection = instructionRequirements.domInspection;
      keyboardNavigation = instructionRequirements.keyboardNavigation;
      ariaCompliance = instructionRequirements.ariaCompliance;
      visualAccessibility = instructionRequirements.visualAccessibility;
      wcagGuidelines = instructionRequirements.wcagGuidelines;
    } else {
      // Use pattern-based parsing for comprehensive accessibility testing
      console.log('[EnhancedAccessibilityParser] Using pattern-based parsing');
      domInspection = this.identifyDOMInspectionPatterns(userInput);
      keyboardNavigation = this.identifyKeyboardNavigationPatterns(userInput);
      ariaCompliance = this.identifyARIACompliancePatterns(userInput);
      visualAccessibility = this.identifyVisualAccessibilityPatterns(userInput);
      wcagGuidelines = this.identifyWCAGGuidelinePatterns(userInput);
    }

    // Configure Axe-Core integration based on detected patterns
    const axeCoreIntegration = this.configureAxeCoreIntegration(userInput, {
      domInspection,
      keyboardNavigation,
      ariaCompliance,
      visualAccessibility,
      wcagGuidelines
    });

    console.log('[EnhancedAccessibilityParser] Generated requirements:', {
      domInspection: domInspection.length,
      keyboardNavigation: keyboardNavigation.length,
      ariaCompliance: ariaCompliance.length,
      visualAccessibility: visualAccessibility.length,
      wcagGuidelines: wcagGuidelines.length
    });

    return {
      domInspection,
      keyboardNavigation,
      ariaCompliance,
      visualAccessibility,
      wcagGuidelines,
      axeCoreIntegration
    };
  }

  /**
   * Check if user input contains specific step-by-step instructions
   * 
   * @param userInput - User's input text
   * @returns True if input contains specific instructions, false for general accessibility testing
   */
  private isInstructionBasedInput(userInput: string): boolean {
    const instructionKeywords = [
      // Action keywords
      'load the webpage', 'press tab', 'press enter', 'press space', 'click on', 'navigate to',
      'store', 'verify', 'check that', 'ensure that', 'validate that', 'confirm that',
      'measure', 'count', 'find', 'locate', 'inspect', 'examine',
      
      // Step indicators
      'step 1', 'step 2', 'first', 'then', 'next', 'after that', 'finally',
      'load', 'press', 'store', 'verify', 'check', 'measure', 'count',
      
      // Specific element references
      'first focused element', 'next focusable element', 'previous element',
      'current focus', 'focused element', 'active element',
      
      // Sequence indicators
      'at page start', 'from the beginning', 'in order', 'sequentially',
      'one by one', 'step by step'
    ];
    
    const inputLower = userInput.toLowerCase();
    const hasInstructionKeywords = instructionKeywords.some(keyword => inputLower.includes(keyword));
    
    // Also check for comma-separated or numbered steps
    const hasStepStructure = /\d+\.|,\s*[a-z]|;\s*[a-z]/i.test(userInput);
    
    return hasInstructionKeywords || hasStepStructure;
  }

  /**
   * Parse specific step-by-step instructions into accessibility test requirements
   * 
   * @param userInput - User's specific instructions
   * @param websiteAnalysis - Website analysis data
   * @returns Parsed accessibility test requirements
   */
  private parseSpecificInstructions(userInput: string, websiteAnalysis: WebsiteAnalysis): Omit<AccessibilityTestRequirements, 'axeCoreIntegration'> {
    console.log('[EnhancedAccessibilityParser] Parsing specific instructions:', userInput);
    
    // Split instructions into individual steps
    const steps = this.extractInstructionSteps(userInput);
    console.log('[EnhancedAccessibilityParser] Extracted steps:', steps);
    
    const domInspection: DOMInspectionRequirement[] = [];
    const keyboardNavigation: KeyboardNavigationRequirement[] = [];
    const ariaCompliance: ARIAComplianceRequirement[] = [];
    const visualAccessibility: VisualAccessibilityRequirement[] = [];
    const wcagGuidelines: WCAGGuidelineRequirement[] = [];
    
    // Process each step and categorize into accessibility requirements
    steps.forEach((step, index) => {
      const stepLower = step.toLowerCase();
      
      // Enhanced ARIA compliance detection
      if (stepLower.includes('aria-describedby') || stepLower.includes('aria-live') || stepLower.includes('aria-label') || 
          stepLower.includes('aria-labelledby') || stepLower.includes('aria-expanded') || stepLower.includes('aria-selected') ||
          stepLower.includes('aria-checked') || stepLower.includes('aria-hidden') || stepLower.includes('role=')) {
        
        const attributes = this.extractARIAAttributesFromStep(step);
        ariaCompliance.push({
          type: this.determineARIAType(stepLower),
          attributes,
          validationLogic: step,
          wcagCriteria: ['4.1.2', '1.3.1']
        });
      }
      
      // Enhanced keyboard navigation detection
      if (stepLower.includes('press tab') || stepLower.includes('tab key') || stepLower.includes('keyboard navigation') ||
          stepLower.includes('focus') || stepLower.includes('tabindex') || stepLower.includes('tab order')) {
        keyboardNavigation.push({
          type: stepLower.includes('focus') ? 'focus-order' : 'tab-sequence',
          scope: 'page',
          expectedBehavior: step,
          wcagCriteria: ['2.1.1', '2.4.3', '2.4.7']
        });
      }
      
      if (stepLower.includes('press enter') || stepLower.includes('press space') || stepLower.includes('keyboard activation') ||
          stepLower.includes('activate') || stepLower.includes('trigger')) {
        keyboardNavigation.push({
          type: 'keyboard-activation',
          scope: 'component',
          expectedBehavior: step,
          wcagCriteria: ['2.1.1']
        });
      }
      
      // Enhanced DOM inspection detection
      if (stepLower.includes('check') || stepLower.includes('verify') || stepLower.includes('validate') ||
          stepLower.includes('inspect') || stepLower.includes('examine') || stepLower.includes('ensure') ||
          stepLower.includes('alt') || stepLower.includes('heading') || stepLower.includes('label') ||
          stepLower.includes('landmark') || stepLower.includes('semantic')) {
        
        const inspectionType = this.determineDOMInspectionType(stepLower);
        domInspection.push({
          type: inspectionType,
          elements: this.extractElementsFromStep(step),
          validationRules: this.createValidationRulesFromStep(step),
          wcagCriteria: this.getWCAGCriteriaForDOMType(inspectionType)
        });
      }
      
      // Enhanced visual accessibility detection
      if (stepLower.includes('contrast') || stepLower.includes('color') || stepLower.includes('visible') || 
          stepLower.includes('focus indicator') || stepLower.includes('highlight') || stepLower.includes('outline')) {
        visualAccessibility.push({
          type: stepLower.includes('focus') ? 'focus-indicators' : 'color-contrast',
          contrastRatio: stepLower.includes('focus') ? 3.0 : 4.5,
          scope: this.extractElementsFromStep(step),
          wcagCriteria: stepLower.includes('focus') ? ['2.4.7', '1.4.11'] : ['1.4.3']
        });
      }
      
      // Add WCAG guideline requirement for each step
      wcagGuidelines.push({
        successCriteria: this.determineWCAGCriteriaForStep(step),
        level: 'AA',
        validationType: 'hybrid',
        testingApproach: `Execute step ${index + 1}: ${step}`
      });
    });
    
    // If no specific requirements were generated, create comprehensive accessibility requirements
    if (keyboardNavigation.length === 0 && domInspection.length === 0 && ariaCompliance.length === 0 && visualAccessibility.length === 0) {
      console.log('[EnhancedAccessibilityParser] No specific requirements found, creating comprehensive accessibility requirements');
      
      // Create ARIA compliance requirement based on the input
      ariaCompliance.push({
        type: 'aria-labels',
        attributes: ['aria-describedby', 'aria-live', 'aria-label', 'aria-labelledby', 'role'],
        validationLogic: userInput,
        wcagCriteria: ['4.1.2', '1.3.1']
      });
      
      // Create keyboard navigation requirement
      keyboardNavigation.push({
        type: 'tab-sequence',
        scope: 'page',
        expectedBehavior: userInput,
        wcagCriteria: ['2.1.1', '2.4.3']
      });
    }
    
    return {
      domInspection,
      keyboardNavigation,
      ariaCompliance,
      visualAccessibility,
      wcagGuidelines
    };
  }

  /**
   * Extract individual instruction steps from user input
   * 
   * @param userInput - User's instruction text
   * @returns Array of individual steps
   */
  private extractInstructionSteps(userInput: string): string[] {
    // Split by common delimiters
    let steps = userInput.split(/[,;]|\d+\.|\n/).map(step => step.trim()).filter(step => step.length > 0);
    
    // If no clear delimiters, treat as single step
    if (steps.length <= 1) {
      steps = [userInput.trim()];
    }
    
    // Clean up step text
    steps = steps.map(step => {
      // Remove leading numbers or bullets
      return step.replace(/^\d+\.?\s*/, '').replace(/^[-*]\s*/, '').trim();
    }).filter(step => step.length > 0);
    
    return steps;
  }

  /**
   * Determine ARIA compliance type from step content
   */
  private determineARIAType(stepLower: string): ARIAComplianceRequirement['type'] {
    if (stepLower.includes('aria-describedby') || stepLower.includes('aria-live')) {
      return 'aria-descriptions';
    }
    if (stepLower.includes('aria-label') || stepLower.includes('aria-labelledby')) {
      return 'aria-labels';
    }
    if (stepLower.includes('aria-expanded') || stepLower.includes('aria-selected') || stepLower.includes('aria-checked')) {
      return 'aria-states';
    }
    if (stepLower.includes('role=') || stepLower.includes('role ')) {
      return 'aria-roles';
    }
    return 'aria-labels'; // Default
  }

  /**
   * Determine DOM inspection type from step content
   */
  private determineDOMInspectionType(stepLower: string): DOMInspectionRequirement['type'] {
    if (stepLower.includes('alt') || stepLower.includes('image')) {
      return 'image-alt';
    }
    if (stepLower.includes('label') || stepLower.includes('form')) {
      return 'form-labels';
    }
    if (stepLower.includes('heading') || stepLower.includes('h1') || stepLower.includes('h2')) {
      return 'heading-hierarchy';
    }
    if (stepLower.includes('landmark') || stepLower.includes('main') || stepLower.includes('nav')) {
      return 'landmarks';
    }
    return 'semantic-html'; // Default
  }

  /**
   * Create validation rules from step content
   */
  private createValidationRulesFromStep(step: string): ValidationRule[] {
    const stepLower = step.toLowerCase();
    const rules: ValidationRule[] = [];
    
    if (stepLower.includes('aria-describedby')) {
      rules.push({
        attribute: 'aria-describedby',
        condition: 'present',
        description: 'Element should have aria-describedby attribute'
      });
    }
    
    if (stepLower.includes('aria-live')) {
      rules.push({
        attribute: 'aria-live',
        condition: 'present',
        description: 'Element should have aria-live attribute'
      });
    }
    
    if (stepLower.includes('aria-label')) {
      rules.push({
        attribute: 'aria-label',
        condition: 'present',
        description: 'Element should have aria-label attribute'
      });
    }
    
    if (stepLower.includes('role')) {
      rules.push({
        attribute: 'role',
        condition: 'present',
        description: 'Element should have role attribute'
      });
    }
    
    if (stepLower.includes('alt')) {
      rules.push({
        attribute: 'alt',
        condition: 'present',
        description: 'Image should have alt attribute'
      });
    }
    
    // Default rule if none specified
    if (rules.length === 0) {
      rules.push({
        attribute: 'accessibility',
        condition: 'present',
        description: step
      });
    }
    
    return rules;
  }

  /**
   * Get WCAG criteria for DOM inspection type
   */
  private getWCAGCriteriaForDOMType(type: DOMInspectionRequirement['type']): string[] {
    switch (type) {
      case 'image-alt':
        return ['1.1.1'];
      case 'form-labels':
        return ['1.3.1', '3.3.2', '4.1.2'];
      case 'heading-hierarchy':
        return ['1.3.1', '2.4.6'];
      case 'landmarks':
        return ['1.3.1', '2.4.1'];
      case 'semantic-html':
        return ['1.3.1', '4.1.2'];
      default:
        return ['1.3.1'];
    }
  }

  /**
   * Extract element selectors from an instruction step
   * 
   * @param step - Individual instruction step
   * @returns Array of element selectors
   */
  private extractElementsFromStep(step: string): string[] {
    const stepLower = step.toLowerCase();
    const elements: string[] = [];
    
    // Common element patterns
    if (stepLower.includes('button')) elements.push('button', '[role="button"]');
    if (stepLower.includes('link')) elements.push('a', '[role="link"]');
    if (stepLower.includes('input') || stepLower.includes('field')) elements.push('input', 'textarea', 'select');
    if (stepLower.includes('form')) elements.push('form', 'fieldset');
    if (stepLower.includes('heading')) elements.push('h1', 'h2', 'h3', 'h4', 'h5', 'h6');
    if (stepLower.includes('image')) elements.push('img', '[role="img"]');
    if (stepLower.includes('focus') || stepLower.includes('tab')) elements.push('[tabindex]', 'button', 'a', 'input');
    
    // Default to interactive elements if no specific elements found
    if (elements.length === 0) {
      elements.push('button', 'a', 'input', 'select', 'textarea', '[tabindex]');
    }
    
    return elements;
  }

  /**
   * Extract ARIA attributes from an instruction step
   * 
   * @param step - Individual instruction step
   * @returns Array of ARIA attributes
   */
  private extractARIAAttributesFromStep(step: string): string[] {
    const stepLower = step.toLowerCase();
    const attributes: string[] = [];
    
    if (stepLower.includes('aria-label')) attributes.push('aria-label');
    if (stepLower.includes('aria-labelledby')) attributes.push('aria-labelledby');
    if (stepLower.includes('aria-describedby')) attributes.push('aria-describedby');
    if (stepLower.includes('aria-expanded')) attributes.push('aria-expanded');
    if (stepLower.includes('aria-selected')) attributes.push('aria-selected');
    if (stepLower.includes('aria-checked')) attributes.push('aria-checked');
    if (stepLower.includes('role')) attributes.push('role');
    
    // Default ARIA attributes if none specified
    if (attributes.length === 0) {
      attributes.push('aria-label', 'aria-labelledby', 'role');
    }
    
    return attributes;
  }

  /**
   * Determine appropriate WCAG success criteria for an instruction step
   * 
   * @param step - Individual instruction step
   * @returns WCAG success criteria
   */
  private determineWCAGCriteriaForStep(step: string): string {
    const stepLower = step.toLowerCase();
    
    if (stepLower.includes('keyboard') || stepLower.includes('tab') || stepLower.includes('press')) {
      return '2.1.1'; // Keyboard accessibility
    }
    if (stepLower.includes('focus') && stepLower.includes('order')) {
      return '2.4.3'; // Focus Order
    }
    if (stepLower.includes('focus') && stepLower.includes('visible')) {
      return '2.4.7'; // Focus Visible
    }
    if (stepLower.includes('contrast') || stepLower.includes('color')) {
      return '1.4.3'; // Contrast (Minimum)
    }
    if (stepLower.includes('aria') || stepLower.includes('name') || stepLower.includes('role')) {
      return '4.1.2'; // Name, Role, Value
    }
    if (stepLower.includes('structure') || stepLower.includes('heading') || stepLower.includes('landmark')) {
      return '1.3.1'; // Info and Relationships
    }
    if (stepLower.includes('alt') || stepLower.includes('image')) {
      return '1.1.1'; // Non-text Content
    }
    
    // Default to keyboard accessibility
    return '2.1.1';
  }

  /**
   * Identify DOM Inspection Patterns
   * 
   * @param instructions - User instructions text
   * @returns Array of DOM inspection requirements
   */
  identifyDOMInspectionPatterns(instructions: string): DOMInspectionRequirement[] {
    const patterns = this.patternRecognizer.recognizeImageAltPatterns(instructions)
      .concat(this.patternRecognizer.recognizeFormLabelPatterns(instructions))
      .concat(this.patternRecognizer.recognizeHeadingHierarchyPatterns(instructions))
      .concat(this.patternRecognizer.recognizeLandmarkPatterns(instructions))
      .concat(this.patternRecognizer.recognizeSemanticHTMLPatterns(instructions));

    return patterns.map(pattern => this.convertPatternToDOMRequirement(pattern));
  }

  /**
   * Identify keyboard navigation patterns from user instructions
   * 
   * @param instructions - User instructions text
   * @returns Array of keyboard navigation requirements
   */
  identifyKeyboardNavigationPatterns(instructions: string): KeyboardNavigationRequirement[] {
    const patterns = this.patternRecognizer.recognizeTabSequencePatterns(instructions)
      .concat(this.patternRecognizer.recognizeFocusOrderPatterns(instructions))
      .concat(this.patternRecognizer.recognizeKeyboardActivationPatterns(instructions))
      .concat(this.patternRecognizer.recognizeFocusManagementPatterns(instructions));

    return patterns.map(pattern => this.convertPatternToKeyboardRequirement(pattern));
  }

  /**
   * Identify ARIA compliance patterns from user instructions
   * 
   * @param instructions - User instructions text
   * @returns Array of ARIA compliance requirements
   */
  identifyARIACompliancePatterns(instructions: string): ARIAComplianceRequirement[] {
    const patterns = this.patternRecognizer.recognizeARIALabelPatterns(instructions)
      .concat(this.patternRecognizer.recognizeARIADescriptionPatterns(instructions))
      .concat(this.patternRecognizer.recognizeARIALiveRegionPatterns(instructions))
      .concat(this.patternRecognizer.recognizeARIAStatePatterns(instructions));

    return patterns.map(pattern => this.convertPatternToARIARequirement(pattern));
  }

  /**
   * Identify visual accessibility patterns from user instructions
   * 
   * @param instructions - User instructions text
   * @returns Array of visual accessibility requirements
   */
  identifyVisualAccessibilityPatterns(instructions: string): VisualAccessibilityRequirement[] {
    const patterns = this.patternRecognizer.recognizeColorContrastPatterns(instructions)
      .concat(this.patternRecognizer.recognizeFocusIndicatorPatterns(instructions));

    return patterns.map(pattern => this.convertPatternToVisualRequirement(pattern));
  }

  /**
   * Identify WCAG guideline patterns from user instructions
   * 
   * @param instructions - User instructions text
   * @returns Array of WCAG guideline requirements
   */
  identifyWCAGGuidelinePatterns(instructions: string): WCAGGuidelineRequirement[] {
    const patterns = this.patternRecognizer.recognizeWCAGSuccessCriteriaPatterns(instructions);
    return patterns.map(pattern => this.convertPatternToWCAGRequirement(pattern));
  }

  /**
   * Configure Axe-Core integration based on detected patterns
   * 
   * @param instructions - User instructions text
   * @param requirements - Detected accessibility requirements
   * @returns Axe-Core configuration
   */
  private configureAxeCoreIntegration(
    instructions: string,
    requirements: Omit<AccessibilityTestRequirements, 'axeCoreIntegration'>
  ): AxeCoreConfiguration {
    const instructionsLower = instructions.toLowerCase();
    
    // Determine WCAG rulesets based on instructions
    const rulesets: WCAGRuleset[] = [];
    if (instructionsLower.includes('wcag 2.2') || instructionsLower.includes('wcag22')) {
      rulesets.push(WCAGRuleset.WCAG22AA);
    } else if (instructionsLower.includes('wcag 2.1') || instructionsLower.includes('wcag21')) {
      rulesets.push(WCAGRuleset.WCAG21AA, WCAGRuleset.WCAG21A);
    } else {
      // Default to WCAG 2.1 AA
      rulesets.push(WCAGRuleset.WCAG21AA);
    }

    if (instructionsLower.includes('section 508')) {
      rulesets.push(WCAGRuleset.SECTION508);
    }

    // Determine tags based on requirements
    const tags: string[] = [];
    if (requirements.keyboardNavigation.length > 0) {
      tags.push('wcag2a', 'wcag21a');
    }
    if (requirements.visualAccessibility.length > 0) {
      tags.push('wcag2aa', 'wcag21aa');
    }
    if (requirements.ariaCompliance.length > 0) {
      tags.push('wcag2a', 'wcag21a');
    }

    // Determine violation handling strategy
    let violationHandling = ViolationHandlingStrategy.FAIL_ON_VIOLATIONS;
    if (instructionsLower.includes('warn') || instructionsLower.includes('warning')) {
      violationHandling = ViolationHandlingStrategy.WARN_ON_VIOLATIONS;
    } else if (instructionsLower.includes('log only') || instructionsLower.includes('report only')) {
      violationHandling = ViolationHandlingStrategy.LOG_ONLY;
    }

    return {
      rulesets,
      tags: [...new Set(tags)], // Remove duplicates
      violationHandling,
      reportingLevel: 'violations'
    };
  }

  /**
   * Convert accessibility pattern to DOM inspection requirement
   */
  private convertPatternToDOMRequirement(pattern: AccessibilityPattern): DOMInspectionRequirement {
    const type = this.mapPatternToDOMType(pattern);
    const elements = pattern.context.elementTypes;
    const validationRules = this.createValidationRules(pattern);
    const wcagCriteria = pattern.context.wcagReferences;

    return {
      type,
      elements,
      validationRules,
      wcagCriteria
    };
  }

  /**
   * Convert accessibility pattern to keyboard navigation requirement
   */
  private convertPatternToKeyboardRequirement(pattern: AccessibilityPattern): KeyboardNavigationRequirement {
    const type = this.mapPatternToKeyboardType(pattern);
    const scope = this.determineKeyboardScope(pattern);
    const expectedBehavior = pattern.pattern;
    const wcagCriteria = pattern.context.wcagReferences;

    return {
      type,
      scope,
      expectedBehavior,
      wcagCriteria
    };
  }

  /**
   * Convert accessibility pattern to ARIA compliance requirement
   */
  private convertPatternToARIARequirement(pattern: AccessibilityPattern): ARIAComplianceRequirement {
    const type = this.mapPatternToARIAType(pattern);
    const attributes = this.extractARIAAttributes(pattern);
    const validationLogic = pattern.pattern;
    const wcagCriteria = pattern.context.wcagReferences;

    return {
      type,
      attributes,
      validationLogic,
      wcagCriteria
    };
  }

  /**
   * Convert accessibility pattern to visual accessibility requirement
   */
  private convertPatternToVisualRequirement(pattern: AccessibilityPattern): VisualAccessibilityRequirement {
    const type = this.mapPatternToVisualType(pattern);
    const contrastRatio = this.extractContrastRatio(pattern);
    const scope = pattern.context.elementTypes;
    const wcagCriteria = pattern.context.wcagReferences;

    return {
      type,
      contrastRatio,
      scope,
      wcagCriteria
    };
  }

  /**
   * Convert accessibility pattern to WCAG guideline requirement
   * Enhanced implementation for comprehensive WCAG criteria mapping
   */
  private convertPatternToWCAGRequirement(pattern: AccessibilityPattern): WCAGGuidelineRequirement {
    const successCriteria = this.extractSuccessCriteria(pattern);
    const level = this.extractWCAGLevel(pattern);
    const validationType = this.determineValidationType(pattern);
    const testingApproach = this.generateTestingApproach(pattern, successCriteria);

    return {
      successCriteria,
      level,
      validationType,
      testingApproach
    };
  }

  // Helper methods for pattern conversion
  private mapPatternToDOMType(pattern: AccessibilityPattern): DOMInspectionRequirement['type'] {
    if (pattern.keywords.some(k => k.includes('alt') || k.includes('image'))) {
      return 'image-alt';
    }
    if (pattern.keywords.some(k => k.includes('label') || k.includes('form'))) {
      return 'form-labels';
    }
    if (pattern.keywords.some(k => k.includes('heading') || k.includes('h1') || k.includes('h2'))) {
      return 'heading-hierarchy';
    }
    if (pattern.keywords.some(k => k.includes('landmark') || k.includes('main') || k.includes('nav'))) {
      return 'landmarks';
    }
    if (pattern.keywords.some(k => k.includes('semantic') || k.includes('html5') || k.includes('structural'))) {
      return 'semantic-html';
    }
    return 'semantic-html';
  }

  private mapPatternToKeyboardType(pattern: AccessibilityPattern): KeyboardNavigationRequirement['type'] {
    if (pattern.keywords.some(k => k.includes('tab') || k.includes('sequence') || k.includes('tabindex'))) {
      return 'tab-sequence';
    }
    if (pattern.keywords.some(k => k.includes('focus') && (k.includes('order') || k.includes('sequence') || k.includes('flow')))) {
      return 'focus-order';
    }
    if (pattern.keywords.some(k => k.includes('enter') || k.includes('space') || k.includes('activation') || k.includes('key press'))) {
      return 'keyboard-activation';
    }
    if (pattern.keywords.some(k => k.includes('modal') || k.includes('trap') || k.includes('management') || k.includes('containment'))) {
      return 'focus-management';
    }
    if (pattern.keywords.some(k => k.includes('keyboard trap') || k.includes('escape') || k.includes('boundary'))) {
      return 'keyboard-traps';
    }
    return 'tab-sequence'; // Default fallback
  }

  private mapPatternToARIAType(pattern: AccessibilityPattern): ARIAComplianceRequirement['type'] {
    if (pattern.keywords.some(k => k.includes('aria-label') || k.includes('accessible name') || k.includes('labeling'))) {
      return 'aria-labels';
    }
    if (pattern.keywords.some(k => k.includes('aria-describedby') || k.includes('description') || k.includes('aria-details'))) {
      return 'aria-descriptions';
    }
    if (pattern.keywords.some(k => k.includes('aria-live') || k.includes('live region') || k.includes('dynamic content'))) {
      return 'aria-live-regions';
    }
    if (pattern.keywords.some(k => k.includes('aria-expanded') || k.includes('aria-selected') || k.includes('state') || k.includes('aria-checked'))) {
      return 'aria-states';
    }
    if (pattern.keywords.some(k => k.includes('role') || k.includes('aria role'))) {
      return 'aria-roles';
    }
    return 'aria-labels'; // Default fallback
  }

  private mapPatternToVisualType(pattern: AccessibilityPattern): VisualAccessibilityRequirement['type'] {
    if (pattern.keywords.some(k => k.includes('contrast') && !k.includes('focus'))) {
      return 'color-contrast';
    }
    if (pattern.keywords.some(k => k.includes('focus') && (k.includes('indicator') || k.includes('visible') || k.includes('highlight')))) {
      return 'focus-indicators';
    }
    return 'interactive-element-contrast';
  }

  private determineKeyboardScope(pattern: AccessibilityPattern): KeyboardNavigationRequirement['scope'] {
    if (pattern.keywords.some(k => k.includes('modal') || k.includes('dialog') || k.includes('popup'))) {
      return 'modal';
    }
    if (pattern.keywords.some(k => k.includes('form') || k.includes('input') || k.includes('field'))) {
      return 'form';
    }
    if (pattern.keywords.some(k => k.includes('component') || k.includes('widget') || k.includes('control'))) {
      return 'component';
    }
    // Focus management patterns should default to 'modal' scope since they typically involve modal dialogs
    if (pattern.keywords.some(k => k.includes('focus management') || k.includes('focus trap') || k.includes('management'))) {
      return 'modal';
    }
    if (pattern.keywords.some(k => k.includes('page') || k.includes('document') || k.includes('global'))) {
      return 'page';
    }
    return 'page'; // Default fallback
  }

  private createValidationRules(pattern: AccessibilityPattern): ValidationRule[] {
    const rules: ValidationRule[] = [];
    
    pattern.keywords.forEach(keyword => {
      if (keyword.includes('alt')) {
        rules.push({
          attribute: 'alt',
          condition: 'present',
          description: 'Image must have alt attribute'
        });
        rules.push({
          attribute: 'alt',
          condition: 'matches',
          expectedValue: '^(?!\\s*$).+', // Not empty or whitespace only
          description: 'Alt attribute must not be empty'
        });
      }
      if (keyword.includes('label')) {
        rules.push({
          attribute: 'aria-label',
          condition: 'present',
          description: 'Element must have accessible label'
        });
        rules.push({
          attribute: 'for',
          condition: 'present',
          description: 'Label must be associated with form control'
        });
      }
      if (keyword.includes('heading')) {
        rules.push({
          attribute: 'tagName',
          condition: 'matches',
          expectedValue: '^H[1-6]$',
          description: 'Must use proper heading tags (h1-h6)'
        });
      }
      if (keyword.includes('landmark')) {
        rules.push({
          attribute: 'role',
          condition: 'present',
          description: 'Landmark must have appropriate role'
        });
      }
      if (keyword.includes('semantic')) {
        rules.push({
          attribute: 'tagName',
          condition: 'matches',
          expectedValue: '^(ARTICLE|SECTION|ASIDE|FIGURE|TIME|ADDRESS)$',
          description: 'Must use semantic HTML5 elements'
        });
      }
    });

    // Default rule if no specific rules found
    if (rules.length === 0) {
      rules.push({
        attribute: 'accessibility',
        condition: 'present',
        description: 'Element must meet accessibility requirements'
      });
    }

    return rules;
  }

  private extractARIAAttributes(pattern: AccessibilityPattern): string[] {
    const attributes: string[] = [];
    
    pattern.keywords.forEach(keyword => {
      if (keyword.startsWith('aria-')) {
        attributes.push(keyword);
      }
      // Add common ARIA attributes based on pattern type
      if (keyword.includes('label')) {
        attributes.push('aria-label', 'aria-labelledby');
      }
      if (keyword.includes('description')) {
        attributes.push('aria-describedby', 'aria-details');
      }
      if (keyword.includes('live')) {
        attributes.push('aria-live', 'aria-atomic', 'aria-relevant');
      }
      if (keyword.includes('state')) {
        attributes.push('aria-expanded', 'aria-selected', 'aria-checked', 'aria-pressed');
      }
    });

    return attributes.length > 0 ? [...new Set(attributes)] : ['aria-label', 'aria-describedby'];
  }

  private extractContrastRatio(pattern: AccessibilityPattern): number {
    if (pattern.keywords.some(k => k.includes('4.5') || k.includes('4.5:1'))) {
      return 4.5;
    }
    if (pattern.keywords.some(k => k.includes('7:1') || k.includes('7.0'))) {
      return 7.0;
    }
    if (pattern.keywords.some(k => k.includes('3:1') || k.includes('3.0'))) {
      return 3.0;
    }
    return 4.5; // Default to WCAG AA standard
  }

  private extractSuccessCriteria(pattern: AccessibilityPattern): string {
    // First check if there's an explicit WCAG criteria in the pattern's context
    const explicitCriteria = pattern.context.wcagReferences.find(ref => 
      ref.match(/^\d+\.\d+\.\d+$/)
    );
    
    if (explicitCriteria) {
      return explicitCriteria;
    }

    // Enhanced mapping based on pattern keywords and content
    const keywordLower = pattern.keywords.join(' ').toLowerCase();
    
    // Specific criteria mapping based on enhanced pattern recognition
    if (keywordLower.includes('alt') || keywordLower.includes('alternative text') || keywordLower.includes('non-text content')) {
      return '1.1.1'; // Non-text Content
    }
    if (keywordLower.includes('heading hierarchy') || keywordLower.includes('landmark') || keywordLower.includes('structure')) {
      return '1.3.1'; // Info and Relationships
    }
    if (keywordLower.includes('4.5:1') || keywordLower.includes('minimum contrast') || keywordLower.includes('text contrast')) {
      return '1.4.3'; // Contrast (Minimum)
    }
    if (keywordLower.includes('3:1') || keywordLower.includes('non-text contrast') || keywordLower.includes('ui element contrast')) {
      return '1.4.11'; // Non-text Contrast
    }
    if (keywordLower.includes('keyboard') && !keywordLower.includes('focus')) {
      return '2.1.1'; // Keyboard
    }
    if (keywordLower.includes('skip link') || keywordLower.includes('bypass')) {
      return '2.4.1'; // Bypass Blocks
    }
    if (keywordLower.includes('focus order') || keywordLower.includes('logical focus')) {
      return '2.4.3'; // Focus Order
    }
    if (keywordLower.includes('focus visible') || keywordLower.includes('focus indicator')) {
      return '2.4.7'; // Focus Visible
    }
    if (keywordLower.includes('error') && keywordLower.includes('form')) {
      return '3.3.1'; // Error Identification
    }
    if (keywordLower.includes('label') && keywordLower.includes('form')) {
      return '3.3.2'; // Labels or Instructions
    }
    if (keywordLower.includes('name role value') || keywordLower.includes('programmatic')) {
      return '4.1.2'; // Name, Role, Value
    }
    
    return '2.1.1'; // Default fallback
  }

  private extractWCAGLevel(pattern: AccessibilityPattern): 'A' | 'AA' | 'AAA' {
    const keywordLower = pattern.keywords.join(' ').toLowerCase();
    
    if (keywordLower.includes('aaa') || keywordLower.includes('level aaa') || keywordLower.includes('7:1')) {
      return 'AAA';
    }
    if (keywordLower.includes('aa') || keywordLower.includes('level aa') || keywordLower.includes('4.5:1') || keywordLower.includes('focus visible')) {
      return 'AA';
    }
    
    // Determine level based on success criteria
    const criteria = this.extractSuccessCriteria(pattern);
    const aaLevelCriteria = ['1.4.3', '1.4.11', '2.4.7']; // Common AA criteria
    
    if (aaLevelCriteria.includes(criteria)) {
      return 'AA';
    }
    
    return 'A'; // Default to Level A
  }

  private determineValidationType(pattern: AccessibilityPattern): 'automated' | 'manual' | 'hybrid' {
    const keywordLower = pattern.keywords.join(' ').toLowerCase();
    const validationTypes = pattern.context.validationTypes.join(' ').toLowerCase();
    
    if (keywordLower.includes('manual') || keywordLower.includes('human') || validationTypes.includes('manual')) {
      return 'manual';
    }
    if (keywordLower.includes('hybrid') || keywordLower.includes('semi') || validationTypes.includes('hybrid')) {
      return 'hybrid';
    }
    
    // Determine based on pattern characteristics
    if (keywordLower.includes('contrast') || keywordLower.includes('color') || keywordLower.includes('alt')) {
      return 'automated'; // These can be fully automated
    }
    if (keywordLower.includes('focus order') || keywordLower.includes('skip link') || keywordLower.includes('keyboard')) {
      return 'hybrid'; // Requires both automated and manual testing
    }
    if (keywordLower.includes('meaningful') || keywordLower.includes('appropriate') || keywordLower.includes('quality')) {
      return 'manual'; // Requires human judgment
    }
    
    return 'automated'; // Default to automated
  }

  /**
   * Generate comprehensive testing approach based on pattern and WCAG criteria
   * New method for enhanced WCAG guideline pattern recognition
   */
  private generateTestingApproach(pattern: AccessibilityPattern, successCriteria: string): string {
    const baseApproach = pattern.pattern;
    const keywordLower = pattern.keywords.join(' ').toLowerCase();
    
    // Generate specific testing approaches based on WCAG success criteria
    const testingApproaches: Record<string, string> = {
      '1.1.1': 'Verify all non-text content has appropriate alternative text that serves the same purpose, or is marked as decorative',
      '1.3.1': 'Validate that information, structure, and relationships conveyed through presentation are programmatically determinable',
      '1.4.3': 'Measure color contrast ratios using browser APIs and validate against 4.5:1 minimum for normal text and 3:1 for large text',
      '1.4.11': 'Validate 3:1 contrast ratio for interactive UI components and their focus/hover/active states',
      '2.1.1': 'Test all functionality using keyboard-only navigation, ensuring no mouse-dependent interactions',
      '2.4.1': 'Verify skip navigation links are present, functional, and allow bypassing repetitive content blocks',
      '2.4.3': 'Test focus moves in logical, meaningful order that preserves meaning and operability of the interface',
      '2.4.7': 'Verify visible focus indicators are present for all keyboard-focusable elements with sufficient contrast',
      '3.3.1': 'Validate error messages clearly identify form fields with errors and provide descriptive error information',
      '3.3.2': 'Ensure all form fields have associated labels or instructions that clearly describe the required input',
      '4.1.2': 'Verify all interactive elements have programmatically determinable name, role, and value properties'
    };
    
    const specificApproach = testingApproaches[successCriteria];
    
    if (specificApproach) {
      // Enhance with pattern-specific details
      if (keywordLower.includes('automated') || keywordLower.includes('axe')) {
        return `${specificApproach} using automated accessibility testing tools and browser APIs`;
      }
      if (keywordLower.includes('manual') || keywordLower.includes('human')) {
        return `${specificApproach} through manual testing and human evaluation`;
      }
      if (keywordLower.includes('keyboard')) {
        return `${specificApproach} with comprehensive keyboard navigation testing`;
      }
      if (keywordLower.includes('screen reader')) {
        return `${specificApproach} including screen reader compatibility testing`;
      }
      
      return specificApproach;
    }
    
    // Fallback to base pattern with WCAG context
    return `${baseApproach} to ensure compliance with WCAG ${successCriteria}`;
  }
}

/**
 * Accessibility Pattern Recognizer
 * 
 * Specialized pattern recognition engine for accessibility-specific instruction parsing.
 */
export class AccessibilityPatternRecognizer {
  
  /**
   * Recognize image alt attribute patterns in text
   */
  recognizeImageAltPatterns(text: string): AccessibilityPattern[] {
    const patterns: AccessibilityPattern[] = [];
    const textLower = text.toLowerCase();

    const imageAltKeywords = [
      'alt attribute', 'alt text', 'image alt', 'alternative text',
      'img alt', 'image description', 'alt tag', 'image accessibility',
      'missing alt', 'empty alt', 'decorative images', 'informative images',
      'complex images', 'image captions', 'alt attribute validation'
    ];

    imageAltKeywords.forEach(keyword => {
      if (textLower.includes(keyword)) {
        patterns.push({
          pattern: `Verify ${keyword} for images`,
          confidence: 0.9,
          category: AccessibilityCategory.DOM_INSPECTION,
          keywords: [keyword, 'alt', 'image'],
          context: {
            elementTypes: ['img', 'svg', 'canvas', '[role="img"]'],
            interactionTypes: ['inspection'],
            validationTypes: ['attribute-presence', 'attribute-quality'],
            wcagReferences: ['1.1.1']
          }
        });
      }
    });

    return patterns;
  }

  /**
   * Recognize form label patterns in text
   */
  recognizeFormLabelPatterns(text: string): AccessibilityPattern[] {
    const patterns: AccessibilityPattern[] = [];
    const textLower = text.toLowerCase();

    const formLabelKeywords = [
      'form label', 'input label', 'label association', 'form accessibility',
      'field label', 'label for', 'aria-labelledby', 'form labeling',
      'missing labels', 'label text', 'form field labels', 'input labeling',
      'accessible labels', 'label validation', 'form control labels',
      'programmatic labels', 'explicit labels', 'implicit labels'
    ];

    formLabelKeywords.forEach(keyword => {
      if (textLower.includes(keyword)) {
        patterns.push({
          pattern: `Verify ${keyword} for form elements`,
          confidence: 0.85,
          category: AccessibilityCategory.DOM_INSPECTION,
          keywords: [keyword, 'label', 'form'],
          context: {
            elementTypes: ['input', 'textarea', 'select', 'button[type="submit"]', 'fieldset'],
            interactionTypes: ['inspection'],
            validationTypes: ['label-association', 'label-quality'],
            wcagReferences: ['1.3.1', '3.3.2', '4.1.2']
          }
        });
      }
    });

    return patterns;
  }

  /**
   * Recognize heading hierarchy patterns in text
   */
  recognizeHeadingHierarchyPatterns(text: string): AccessibilityPattern[] {
    const patterns: AccessibilityPattern[] = [];
    const textLower = text.toLowerCase();

    const headingKeywords = [
      'heading hierarchy', 'heading structure', 'h1 h2 h3', 'heading order',
      'heading levels', 'semantic headings', 'heading nesting',
      'heading sequence', 'proper headings', 'heading validation',
      'skipped headings', 'heading outline', 'document outline',
      'heading accessibility', 'heading tags', 'heading elements'
    ];

    headingKeywords.forEach(keyword => {
      if (textLower.includes(keyword)) {
        patterns.push({
          pattern: `Verify ${keyword} structure`,
          confidence: 0.8,
          category: AccessibilityCategory.DOM_INSPECTION,
          keywords: [keyword, 'heading', 'hierarchy'],
          context: {
            elementTypes: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', '[role="heading"]'],
            interactionTypes: ['inspection'],
            validationTypes: ['hierarchy-validation', 'sequence-validation'],
            wcagReferences: ['1.3.1', '2.4.6', '2.4.10']
          }
        });
      }
    });

    return patterns;
  }

  /**
   * Recognize landmark patterns in text
   */
  recognizeLandmarkPatterns(text: string): AccessibilityPattern[] {
    const patterns: AccessibilityPattern[] = [];
    const textLower = text.toLowerCase();

    const landmarkKeywords = [
      'landmark', 'main content', 'navigation', 'banner', 'contentinfo',
      'complementary', 'semantic structure', 'page structure',
      'landmark roles', 'aria landmarks', 'page regions', 'content regions',
      'navigation landmarks', 'main landmark', 'banner landmark',
      'contentinfo landmark', 'complementary landmark', 'search landmark',
      'form landmark', 'region landmark', 'landmark navigation'
    ];

    landmarkKeywords.forEach(keyword => {
      if (textLower.includes(keyword)) {
        patterns.push({
          pattern: `Verify ${keyword} landmarks`,
          confidence: 0.75,
          category: AccessibilityCategory.DOM_INSPECTION,
          keywords: [keyword, 'landmark', 'structure'],
          context: {
            elementTypes: ['main', 'nav', 'header', 'footer', 'aside', 'section', '[role="main"]', '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]', '[role="complementary"]', '[role="search"]', '[role="form"]', '[role="region"]'],
            interactionTypes: ['inspection'],
            validationTypes: ['landmark-presence', 'landmark-labeling'],
            wcagReferences: ['1.3.1', '2.4.1', '1.3.6']
          }
        });
      }
    });

    return patterns;
  }

  /**
   * Recognize tab sequence patterns in text
   */
  recognizeTabSequencePatterns(text: string): AccessibilityPattern[] {
    const patterns: AccessibilityPattern[] = [];
    const textLower = text.toLowerCase();

    const tabKeywords = [
      'tab sequence', 'tab order', 'tab navigation', 'tabbing',
      'tab key', 'sequential navigation', 'tab through', 'keyboard navigation',
      'tab index', 'tabindex', 'tab flow', 'tab cycle', 'tab accessibility',
      'tab behavior', 'tab movement', 'tab progression', 'logical tab order',
      'tab sequence validation', 'tab order testing', 'sequential focus'
    ];

    tabKeywords.forEach(keyword => {
      if (textLower.includes(keyword)) {
        patterns.push({
          pattern: `Test ${keyword} behavior`,
          confidence: 0.9,
          category: AccessibilityCategory.KEYBOARD_NAVIGATION,
          keywords: [keyword, 'tab', 'navigation'],
          context: {
            elementTypes: ['button', 'a', 'input', 'select', 'textarea', '[tabindex]', '[tabindex="0"]'],
            interactionTypes: ['keyboard', 'sequential'],
            validationTypes: ['sequence-validation', 'order-validation'],
            wcagReferences: ['2.1.1', '2.4.3']
          }
        });
      }
    });

    return patterns;
  }

  /**
   * Recognize focus order patterns in text
   */
  recognizeFocusOrderPatterns(text: string): AccessibilityPattern[] {
    const patterns: AccessibilityPattern[] = [];
    const textLower = text.toLowerCase();

    const focusOrderKeywords = [
      'focus order', 'focus sequence', 'logical focus', 'focus flow',
      'focus navigation', 'reading order', 'visual order',
      'focus progression', 'focus direction', 'focus path',
      'meaningful focus order', 'predictable focus', 'focus hierarchy',
      'focus structure', 'focus accessibility', 'focus validation'
    ];

    focusOrderKeywords.forEach(keyword => {
      if (textLower.includes(keyword)) {
        patterns.push({
          pattern: `Verify ${keyword} is logical`,
          confidence: 0.85,
          category: AccessibilityCategory.KEYBOARD_NAVIGATION,
          keywords: [keyword, 'focus', 'order'],
          context: {
            elementTypes: ['*[tabindex]', 'button', 'a', 'input', 'select', 'textarea', '[tabindex="0"]', '[tabindex="-1"]'],
            interactionTypes: ['keyboard', 'focus'],
            validationTypes: ['order-validation', 'logical-validation'],
            wcagReferences: ['2.4.3', '1.3.2']
          }
        });
      }
    });

    return patterns;
  }

  /**
   * Recognize keyboard activation patterns in text
   */
  recognizeKeyboardActivationPatterns(text: string): AccessibilityPattern[] {
    const patterns: AccessibilityPattern[] = [];
    const textLower = text.toLowerCase();

    const activationKeywords = [
      'keyboard activation', 'enter key', 'space key', 'keyboard operation',
      'activate with keyboard', 'keyboard accessible', 'key press',
      'keyboard interaction', 'key activation', 'keyboard control',
      'enter activation', 'space activation', 'keyboard trigger',
      'key event', 'keyboard event', 'activation keys', 'keyboard commands',
      'keyboard shortcuts', 'key combinations', 'keyboard functionality'
    ];

    activationKeywords.forEach(keyword => {
      if (textLower.includes(keyword)) {
        patterns.push({
          pattern: `Test ${keyword} functionality`,
          confidence: 0.8,
          category: AccessibilityCategory.KEYBOARD_NAVIGATION,
          keywords: [keyword, 'keyboard', 'activation'],
          context: {
            elementTypes: ['button', 'a', '[role="button"]', '[role="link"]', 'input[type="button"]', 'input[type="submit"]'],
            interactionTypes: ['keyboard', 'activation'],
            validationTypes: ['activation-validation', 'key-event-validation'],
            wcagReferences: ['2.1.1', '2.1.3']
          }
        });
      }
    });

    return patterns;
  }

  /**
   * Recognize focus management patterns in text
   */
  recognizeFocusManagementPatterns(text: string): AccessibilityPattern[] {
    const patterns: AccessibilityPattern[] = [];
    const textLower = text.toLowerCase();

    const focusManagementKeywords = [
      'focus management', 'focus trap', 'modal focus', 'focus return',
      'focus restoration', 'keyboard trap', 'focus containment',
      'focus handling', 'focus control', 'focus behavior',
      'modal keyboard trap', 'dialog focus', 'popup focus',
      'focus cycling', 'focus boundary', 'focus escape',
      'focus restoration', 'initial focus', 'focus placement',
      'focus lock', 'focus isolation', 'focus delegation'
    ];

    focusManagementKeywords.forEach(keyword => {
      if (textLower.includes(keyword)) {
        patterns.push({
          pattern: `Verify ${keyword} behavior`,
          confidence: 0.85,
          category: AccessibilityCategory.KEYBOARD_NAVIGATION,
          keywords: [keyword, 'focus', 'management'],
          context: {
            elementTypes: ['[role="dialog"]', '[role="modal"]', 'dialog', 'modal', '.modal', '[aria-modal="true"]', 'popup'],
            interactionTypes: ['keyboard', 'focus-management'],
            validationTypes: ['focus-management', 'trap-validation', 'restoration-validation'],
            wcagReferences: ['2.1.2', '2.4.3', '3.2.1']
          }
        });
      }
    });

    return patterns;
  }

  /**
   * Recognize ARIA label patterns in text
   */
  recognizeARIALabelPatterns(text: string): AccessibilityPattern[] {
    const patterns: AccessibilityPattern[] = [];
    const textLower = text.toLowerCase();

    const ariaLabelKeywords = [
      'aria-label', 'aria label', 'accessible name', 'aria-labelledby',
      'screen reader label', 'assistive technology label',
      'aria labeling', 'accessible labeling', 'programmatic label',
      'label attribute', 'aria name', 'accessible naming',
      'label text', 'aria accessibility', 'screen reader text',
      'assistive text', 'accessible description', 'aria description'
    ];

    ariaLabelKeywords.forEach(keyword => {
      if (textLower.includes(keyword)) {
        patterns.push({
          pattern: `Verify ${keyword} attributes`,
          confidence: 0.9,
          category: AccessibilityCategory.ARIA_COMPLIANCE,
          keywords: [keyword, 'aria', 'label'],
          context: {
            elementTypes: ['button', 'a', 'input', '[role]', '[aria-label]', '[aria-labelledby]'],
            interactionTypes: ['inspection', 'validation'],
            validationTypes: ['aria-validation', 'label-validation'],
            wcagReferences: ['4.1.2', '1.3.1']
          }
        });
      }
    });

    return patterns;
  }

  /**
   * Recognize ARIA description patterns in text
   */
  recognizeARIADescriptionPatterns(text: string): AccessibilityPattern[] {
    const patterns: AccessibilityPattern[] = [];
    const textLower = text.toLowerCase();

    const ariaDescriptionKeywords = [
      'aria-describedby', 'aria description', 'accessible description',
      'aria-details', 'descriptive text', 'help text',
      'aria help', 'description association', 'descriptive content',
      'aria descriptive', 'accessible help', 'contextual description',
      'additional description', 'supplementary text', 'explanatory text',
      'aria context', 'description link', 'description reference'
    ];

    ariaDescriptionKeywords.forEach(keyword => {
      if (textLower.includes(keyword)) {
        patterns.push({
          pattern: `Verify ${keyword} associations`,
          confidence: 0.85,
          category: AccessibilityCategory.ARIA_COMPLIANCE,
          keywords: [keyword, 'aria', 'description'],
          context: {
            elementTypes: ['input', 'button', '[aria-describedby]', '[aria-details]', 'form'],
            interactionTypes: ['inspection', 'validation'],
            validationTypes: ['description-validation', 'association-validation'],
            wcagReferences: ['1.3.1', '3.3.2', '4.1.2']
          }
        });
      }
    });

    return patterns;
  }

  /**
   * Recognize ARIA live region patterns in text
   */
  recognizeARIALiveRegionPatterns(text: string): AccessibilityPattern[] {
    const patterns: AccessibilityPattern[] = [];
    const textLower = text.toLowerCase();

    const liveRegionKeywords = [
      'aria-live', 'live region', 'dynamic content', 'aria-atomic',
      'aria-relevant', 'status message', 'live announcement',
      'dynamic updates', 'live updates', 'real-time updates',
      'aria polite', 'aria assertive', 'live content',
      'dynamic announcements', 'status updates', 'notification updates',
      'aria busy', 'live feedback', 'dynamic feedback'
    ];

    liveRegionKeywords.forEach(keyword => {
      if (textLower.includes(keyword)) {
        patterns.push({
          pattern: `Test ${keyword} announcements`,
          confidence: 0.8,
          category: AccessibilityCategory.ARIA_COMPLIANCE,
          keywords: [keyword, 'aria', 'live'],
          context: {
            elementTypes: ['[aria-live]', '[role="status"]', '[role="alert"]', '[aria-atomic]', '[aria-relevant]'],
            interactionTypes: ['dynamic', 'validation'],
            validationTypes: ['live-region-validation', 'announcement-validation'],
            wcagReferences: ['4.1.3', '1.3.1']
          }
        });
      }
    });

    return patterns;
  }

  /**
   * Recognize ARIA state patterns in text
   */
  recognizeARIAStatePatterns(text: string): AccessibilityPattern[] {
    const patterns: AccessibilityPattern[] = [];
    const textLower = text.toLowerCase();

    const stateKeywords = [
      'aria-expanded', 'aria-selected', 'aria-checked', 'aria-pressed',
      'aria state', 'dynamic state', 'state change', 'aria-hidden',
      'aria-disabled', 'aria-current', 'aria-invalid', 'aria-required',
      'state management', 'aria properties', 'dynamic properties',
      'interactive states', 'element states', 'aria attributes',
      'state validation', 'property validation', 'aria updates'
    ];

    stateKeywords.forEach(keyword => {
      if (textLower.includes(keyword)) {
        patterns.push({
          pattern: `Verify ${keyword} updates`,
          confidence: 0.85,
          category: AccessibilityCategory.ARIA_COMPLIANCE,
          keywords: [keyword, 'aria', 'state'],
          context: {
            elementTypes: ['button', '[role="button"]', '[role="checkbox"]', '[role="tab"]', '[aria-expanded]', '[aria-selected]'],
            interactionTypes: ['state-change', 'validation'],
            validationTypes: ['state-validation', 'property-validation'],
            wcagReferences: ['4.1.2', '1.3.1']
          }
        });
      }
    });

    return patterns;
  }

  /**
   * Recognize color contrast patterns in text
   * Enhanced implementation for Requirements 1.4, 5.1, 5.2, 5.3, 5.4
   */
  recognizeColorContrastPatterns(text: string): AccessibilityPattern[] {
    const patterns: AccessibilityPattern[] = [];
    const textLower = text.toLowerCase();

    // Enhanced color contrast keywords with more comprehensive coverage
    const contrastKeywords = [
      // Basic contrast terms
      'color contrast', 'contrast ratio', 'text contrast', 'background contrast',
      
      // Specific ratio requirements
      '4.5:1', '4.5 to 1', '4.5:1 ratio', 'four point five to one',
      '3:1', '3 to 1', '3:1 ratio', 'three to one',
      '7:1', '7 to 1', '7:1 ratio', 'seven to one',
      
      // WCAG compliance levels
      'wcag aa contrast', 'wcag aaa contrast', 'wcag 2.1 contrast',
      'wcag 2.2 contrast', 'level aa contrast', 'level aaa contrast',
      
      // Element-specific contrast
      'button contrast', 'link contrast', 'input contrast', 'form contrast',
      'interactive element contrast', 'control contrast', 'ui element contrast',
      
      // Text-specific contrast
      'normal text contrast', 'large text contrast', 'bold text contrast',
      'heading contrast', 'body text contrast', 'small text contrast',
      
      // Visual accessibility terms
      'visual accessibility', 'color accessibility', 'readability',
      'legibility', 'visibility', 'perceivable text',
      
      // Contrast measurement and validation
      'contrast checker', 'contrast validation', 'contrast testing',
      'contrast measurement', 'contrast analysis', 'contrast compliance',
      'contrast evaluation', 'contrast assessment', 'contrast audit',
      
      // Color-related accessibility
      'color blindness', 'color vision deficiency', 'colorblind friendly',
      'color perception', 'color differentiation', 'color dependency',
      
      // Browser and tool-specific
      'browser contrast', 'automated contrast', 'contrast tools',
      'contrast api', 'computed contrast', 'rendered contrast'
    ];

    contrastKeywords.forEach(keyword => {
      if (textLower.includes(keyword)) {
        // Determine confidence based on keyword specificity
        let confidence = 0.9;
        if (keyword.includes('4.5:1') || keyword.includes('3:1') || keyword.includes('7:1')) {
          confidence = 0.95; // Higher confidence for specific ratios
        } else if (keyword.includes('wcag')) {
          confidence = 0.92; // High confidence for WCAG references
        } else if (keyword.includes('contrast')) {
          confidence = 0.9; // Standard confidence for contrast terms
        } else {
          confidence = 0.8; // Lower confidence for general terms
        }

        // Determine element types based on keyword context
        let elementTypes = ['*']; // Default to all elements
        if (keyword.includes('button')) {
          elementTypes = ['button', '[role="button"]', 'input[type="button"]', 'input[type="submit"]'];
        } else if (keyword.includes('link')) {
          elementTypes = ['a', '[role="link"]'];
        } else if (keyword.includes('input') || keyword.includes('form')) {
          elementTypes = ['input', 'textarea', 'select', 'button', 'label'];
        } else if (keyword.includes('text') || keyword.includes('heading')) {
          elementTypes = ['p', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'td', 'th'];
        } else if (keyword.includes('interactive') || keyword.includes('control') || keyword.includes('ui')) {
          elementTypes = ['button', 'a', 'input', 'select', 'textarea', '[tabindex]', '[role="button"]', '[role="link"]'];
        }

        // Determine WCAG criteria based on keyword
        let wcagReferences = ['1.4.3']; // Default to minimum contrast
        if (keyword.includes('7:1') || keyword.includes('aaa')) {
          wcagReferences = ['1.4.6']; // Enhanced contrast (AAA)
        } else if (keyword.includes('interactive') || keyword.includes('control') || keyword.includes('ui')) {
          wcagReferences = ['1.4.3', '1.4.11']; // Include non-text contrast
        } else if (keyword.includes('large text') || keyword.includes('bold text')) {
          wcagReferences = ['1.4.3']; // Large text has different requirements
        }

        patterns.push({
          pattern: `Verify ${keyword} compliance`,
          confidence,
          category: AccessibilityCategory.VISUAL_ACCESSIBILITY,
          keywords: [keyword, 'contrast', 'color', 'visual'],
          context: {
            elementTypes,
            interactionTypes: ['visual', 'measurement'],
            validationTypes: ['contrast-validation', 'color-validation', 'ratio-validation'],
            wcagReferences
          }
        });
      }
    });

    return patterns;
  }

  /**
   * Recognize focus indicator patterns in text
   * Enhanced implementation for Requirements 1.4, 5.1, 5.2, 5.3, 5.4
   */
  recognizeFocusIndicatorPatterns(text: string): AccessibilityPattern[] {
    const patterns: AccessibilityPattern[] = [];
    const textLower = text.toLowerCase();

    // Enhanced focus indicator keywords with comprehensive coverage
    const focusIndicatorKeywords = [
      // Basic focus indicator terms
      'focus indicator', 'focus outline', 'focus ring', 'focus visible',
      'focus highlight', 'keyboard focus', 'focus border', 'focus style',
      
      // Visual focus terms
      'visible focus', 'focus visibility', 'focus appearance', 'focus display',
      'focus presentation', 'focus styling', 'focus design', 'focus ui',
      
      // Focus indicator types
      'outline focus', 'border focus', 'shadow focus', 'background focus',
      'color focus', 'highlight focus', 'glow focus', 'underline focus',
      
      // Focus indicator properties
      'focus contrast', 'focus color', 'focus width', 'focus thickness',
      'focus opacity', 'focus brightness', 'focus saturation',
      
      // Accessibility focus terms
      'accessible focus', 'focus accessibility', 'keyboard accessibility',
      'focus navigation', 'focus management', 'focus control',
      
      // WCAG focus terms
      'wcag focus', 'focus visible wcag', '2.4.7', 'focus visible 2.4.7',
      'level aa focus', 'wcag 2.1 focus', 'wcag 2.2 focus',
      
      // Focus indicator validation
      'focus validation', 'focus testing', 'focus verification',
      'focus compliance', 'focus audit', 'focus assessment',
      'focus evaluation', 'focus analysis', 'focus review',
      
      // Interactive element focus
      'button focus', 'link focus', 'input focus', 'form focus',
      'control focus', 'interactive focus', 'element focus',
      'widget focus', 'component focus', 'ui control focus',
      
      // Focus indicator requirements
      'focus requirements', 'focus standards', 'focus guidelines',
      'focus criteria', 'focus specification', 'focus policy',
      
      // Focus indicator issues
      'missing focus', 'invisible focus', 'poor focus', 'weak focus',
      'unclear focus', 'hidden focus', 'no focus indicator',
      
      // Browser and CSS focus
      'css focus', 'focus pseudo-class', ':focus', ':focus-visible',
      'browser focus', 'default focus', 'custom focus', 'focus-within',
      
      // Focus indicator contrast
      'focus indicator contrast', 'focus outline contrast', 'focus border contrast',
      'focus highlight contrast', 'focus ring contrast', '3:1 focus'
    ];

    focusIndicatorKeywords.forEach(keyword => {
      if (textLower.includes(keyword)) {
        // Determine confidence based on keyword specificity
        let confidence = 0.85;
        if (keyword.includes('2.4.7') || keyword.includes('wcag')) {
          confidence = 0.95; // Higher confidence for WCAG references
        } else if (keyword.includes('contrast') || keyword.includes('3:1')) {
          confidence = 0.92; // High confidence for contrast requirements
        } else if (keyword.includes('focus indicator') || keyword.includes('focus visible')) {
          confidence = 0.9; // High confidence for specific terms
        } else if (keyword.includes('focus')) {
          confidence = 0.85; // Standard confidence for focus terms
        } else {
          confidence = 0.8; // Lower confidence for general terms
        }

        // Determine element types based on keyword context
        let elementTypes = ['button', 'a', 'input', 'select', 'textarea', '[tabindex]'];
        if (keyword.includes('button')) {
          elementTypes = ['button', '[role="button"]', 'input[type="button"]', 'input[type="submit"]'];
        } else if (keyword.includes('link')) {
          elementTypes = ['a', '[role="link"]'];
        } else if (keyword.includes('input') || keyword.includes('form')) {
          elementTypes = ['input', 'textarea', 'select', 'fieldset'];
        } else if (keyword.includes('interactive') || keyword.includes('control') || keyword.includes('widget')) {
          elementTypes = ['button', 'a', 'input', 'select', 'textarea', '[tabindex]', '[role="button"]', '[role="link"]', '[role="checkbox"]', '[role="radio"]', '[role="slider"]', '[role="tab"]'];
        } else if (keyword.includes('component') || keyword.includes('ui')) {
          elementTypes = ['*[tabindex]', 'button', 'a', 'input', 'select', 'textarea', '[role]'];
        }

        // Determine validation types based on keyword
        let validationTypes = ['indicator-validation', 'visibility-validation'];
        if (keyword.includes('contrast')) {
          validationTypes.push('contrast-validation');
        }
        if (keyword.includes('css') || keyword.includes('style')) {
          validationTypes.push('style-validation');
        }
        if (keyword.includes('browser')) {
          validationTypes.push('browser-validation');
        }

        // Determine WCAG criteria
        let wcagReferences = ['2.4.7']; // Focus Visible
        if (keyword.includes('contrast') || keyword.includes('3:1')) {
          wcagReferences.push('1.4.11'); // Non-text Contrast
        }
        if (keyword.includes('keyboard')) {
          wcagReferences.push('2.1.1'); // Keyboard accessibility
        }

        patterns.push({
          pattern: `Verify ${keyword} visibility and compliance`,
          confidence,
          category: AccessibilityCategory.VISUAL_ACCESSIBILITY,
          keywords: [keyword, 'focus', 'indicator', 'visual'],
          context: {
            elementTypes,
            interactionTypes: ['focus', 'keyboard', 'visual'],
            validationTypes,
            wcagReferences
          }
        });
      }
    });

    return patterns;
  }

  /**
   * Recognize WCAG success criteria patterns in text
   * Enhanced implementation for Requirements 1.5, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
   */
  recognizeWCAGSuccessCriteriaPatterns(text: string): AccessibilityPattern[] {
    const patterns: AccessibilityPattern[] = [];
    const textLower = text.toLowerCase();

    // Match explicit WCAG success criteria patterns (e.g., "2.1.1", "1.4.3")
    const criteriaRegex = /(\d+\.\d+\.\d+)/g;
    const matches = textLower.match(criteriaRegex);

    if (matches) {
      matches.forEach(criteria => {
        const wcagInfo = this.getWCAGCriteriaInfo(criteria);
        patterns.push({
          pattern: `Verify WCAG ${criteria} compliance: ${wcagInfo.title}`,
          confidence: 0.95,
          category: AccessibilityCategory.WCAG_GUIDELINES,
          keywords: ['wcag', criteria, 'success criteria', wcagInfo.title.toLowerCase()],
          context: {
            elementTypes: wcagInfo.elementTypes,
            interactionTypes: wcagInfo.interactionTypes,
            validationTypes: ['wcag-validation', ...wcagInfo.validationTypes],
            wcagReferences: [criteria]
          }
        });
      });
    }

    // Enhanced WCAG guideline pattern recognition with comprehensive mapping
    const wcagPatternMappings = [
      // Requirement 6.1: Heading hierarchy validation
      {
        keywords: ['heading hierarchy', 'heading structure', 'heading order', 'heading levels', 'h1 h2 h3', 'heading nesting', 'heading sequence', 'document outline', 'heading outline', 'proper headings', 'heading validation', 'skipped headings'],
        successCriteria: '1.3.1',
        title: 'Info and Relationships - Heading Hierarchy',
        elementTypes: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', '[role="heading"]'],
        interactionTypes: ['inspection', 'structure-validation'],
        validationTypes: ['hierarchy-validation', 'sequence-validation', 'nesting-validation'],
        testingApproach: 'Automated validation of heading hierarchy and proper nesting sequence',
        confidence: 0.92
      },
      
      // Requirement 6.2: Skip links validation
      {
        keywords: ['skip links', 'skip navigation', 'skip to content', 'skip to main', 'bypass blocks', 'skip mechanism', 'navigation bypass', 'content bypass', 'skip link', 'bypass navigation', 'skip nav'],
        successCriteria: '2.4.1',
        title: 'Bypass Blocks - Skip Links',
        elementTypes: ['a[href^="#"]', '.skip-link', '.skip-nav', '[href="#main"]', '[href="#content"]'],
        interactionTypes: ['keyboard', 'navigation'],
        validationTypes: ['skip-link-validation', 'bypass-validation', 'functionality-validation'],
        testingApproach: 'Test skip link presence, visibility on focus, and functional navigation',
        confidence: 0.95
      },
      
      // Requirement 6.3: Form error handling validation
      {
        keywords: ['form error', 'error message', 'form validation', 'input error', 'field error', 'validation message', 'error handling', 'form feedback', 'error announcement', 'error association', 'error identification', 'form error handling', 'validation feedback', 'error text', 'error description'],
        successCriteria: '3.3.1',
        title: 'Error Identification - Form Error Handling',
        elementTypes: ['input', 'textarea', 'select', 'form', '[aria-invalid]', '[aria-describedby]', '.error', '.validation-message'],
        interactionTypes: ['form-interaction', 'validation', 'error-handling'],
        validationTypes: ['error-validation', 'association-validation', 'announcement-validation'],
        testingApproach: 'Validate error message association with form fields via aria-describedby',
        confidence: 0.9
      },
      
      // Requirement 6.4: Page structure validation (landmarks)
      {
        keywords: ['page structure', 'landmark', 'main content', 'navigation', 'banner', 'contentinfo', 'complementary', 'page regions', 'content regions', 'structural landmarks', 'aria landmarks', 'landmark roles', 'page layout', 'document structure', 'semantic structure'],
        successCriteria: '1.3.1',
        title: 'Info and Relationships - Page Structure',
        elementTypes: ['main', 'nav', 'header', 'footer', 'aside', 'section', '[role="main"]', '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]', '[role="complementary"]', '[role="search"]', '[role="form"]', '[role="region"]'],
        interactionTypes: ['inspection', 'structure-validation'],
        validationTypes: ['landmark-validation', 'structure-validation', 'labeling-validation'],
        testingApproach: 'Verify presence and proper labeling of page landmarks and regions',
        confidence: 0.88
      },
      
      // Requirement 6.5: Keyboard accessibility validation (WCAG 2.1.1)
      {
        keywords: ['keyboard accessibility', 'keyboard only', 'keyboard navigation', 'keyboard operation', 'keyboard access', 'keyboard functionality', 'keyboard interaction', 'keyboard control', 'keyboard usability', 'keyboard support', 'no mouse', 'keyboard interface', 'keyboard input', 'keyboard commands'],
        successCriteria: '2.1.1',
        title: 'Keyboard - All Functionality Available via Keyboard',
        elementTypes: ['button', 'a', 'input', 'select', 'textarea', '[tabindex]', '[role="button"]', '[role="link"]', '[onclick]', 'interactive'],
        interactionTypes: ['keyboard', 'navigation', 'activation'],
        validationTypes: ['keyboard-validation', 'functionality-validation', 'accessibility-validation'],
        testingApproach: 'Test all interactive functionality using keyboard-only navigation',
        confidence: 0.93
      },
      
      // Additional WCAG 2.1.1 patterns for comprehensive keyboard testing
      {
        keywords: ['tab navigation', 'tab sequence', 'tab order', 'tabbing', 'sequential navigation', 'tab key', 'keyboard focus', 'focus order', 'focus sequence', 'focus navigation'],
        successCriteria: '2.1.1',
        title: 'Keyboard - Sequential Navigation',
        elementTypes: ['button', 'a', 'input', 'select', 'textarea', '[tabindex]', '[tabindex="0"]'],
        interactionTypes: ['keyboard', 'sequential', 'focus'],
        validationTypes: ['sequence-validation', 'order-validation', 'navigation-validation'],
        testingApproach: 'Validate logical tab sequence and focus order throughout the interface',
        confidence: 0.91
      },
      
      // WCAG 2.4.3 Focus Order
      {
        keywords: ['focus order', 'logical focus', 'meaningful focus order', 'focus sequence', 'predictable focus', 'focus flow', 'focus progression', 'reading order', 'visual order'],
        successCriteria: '2.4.3',
        title: 'Focus Order - Logical Focus Sequence',
        elementTypes: ['*[tabindex]', 'button', 'a', 'input', 'select', 'textarea', '[tabindex="0"]', '[tabindex="-1"]'],
        interactionTypes: ['keyboard', 'focus', 'sequence'],
        validationTypes: ['focus-order-validation', 'logical-validation', 'sequence-validation'],
        testingApproach: 'Verify focus moves in logical, meaningful order that preserves meaning and operability',
        confidence: 0.89
      },
      
      // WCAG 1.4.3 Contrast (Minimum)
      {
        keywords: ['color contrast', 'contrast ratio', '4.5:1', 'minimum contrast', 'text contrast', 'background contrast', 'wcag aa contrast', 'contrast compliance', 'readability', 'legibility'],
        successCriteria: '1.4.3',
        title: 'Contrast (Minimum) - 4.5:1 Ratio',
        elementTypes: ['p', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'td', 'th', 'label', 'button', 'a'],
        interactionTypes: ['visual', 'measurement'],
        validationTypes: ['contrast-validation', 'ratio-validation', 'color-validation'],
        testingApproach: 'Measure color contrast ratios using browser APIs and validate against 4.5:1 minimum',
        confidence: 0.94
      },
      
      // WCAG 1.4.11 Non-text Contrast
      {
        keywords: ['non-text contrast', 'ui element contrast', 'interactive element contrast', 'control contrast', 'button contrast', 'input contrast', '3:1 contrast', 'interface contrast', 'component contrast'],
        successCriteria: '1.4.11',
        title: 'Non-text Contrast - UI Elements 3:1 Ratio',
        elementTypes: ['button', 'input', 'select', 'textarea', '[role="button"]', '[role="checkbox"]', '[role="radio"]', '[role="slider"]', 'interactive'],
        interactionTypes: ['visual', 'measurement', 'interaction'],
        validationTypes: ['non-text-contrast-validation', 'ui-contrast-validation', 'interactive-contrast-validation'],
        testingApproach: 'Validate 3:1 contrast ratio for interactive UI components and their states',
        confidence: 0.92
      },
      
      // WCAG 2.4.7 Focus Visible
      {
        keywords: ['focus visible', 'focus indicator', 'visible focus', 'focus outline', 'focus ring', 'focus highlight', 'keyboard focus indicator', 'focus visibility'],
        successCriteria: '2.4.7',
        title: 'Focus Visible - Keyboard Focus Indicators',
        elementTypes: ['button', 'a', 'input', 'select', 'textarea', '[tabindex]', '[role="button"]', '[role="link"]', 'interactive'],
        interactionTypes: ['keyboard', 'focus', 'visual'],
        validationTypes: ['focus-indicator-validation', 'visibility-validation', 'indicator-contrast-validation'],
        testingApproach: 'Verify visible focus indicators are present and meet contrast requirements',
        confidence: 0.93
      },
      
      // WCAG 4.1.2 Name, Role, Value
      {
        keywords: ['name role value', 'accessible name', 'programmatic name', 'aria-label', 'aria-labelledby', 'role attribute', 'accessible role', 'element role', 'programmatic role', 'accessible value', 'programmatic value'],
        successCriteria: '4.1.2',
        title: 'Name, Role, Value - Programmatic Properties',
        elementTypes: ['button', 'input', 'select', 'textarea', 'a', '[role]', '[aria-label]', '[aria-labelledby]', 'interactive'],
        interactionTypes: ['inspection', 'validation', 'programmatic'],
        validationTypes: ['name-validation', 'role-validation', 'value-validation', 'programmatic-validation'],
        testingApproach: 'Validate all interactive elements have programmatically determinable name, role, and value',
        confidence: 0.91
      },
      
      // WCAG 1.1.1 Non-text Content
      {
        keywords: ['alt text', 'alternative text', 'image alt', 'alt attribute', 'non-text content', 'image description', 'decorative images', 'informative images', 'complex images'],
        successCriteria: '1.1.1',
        title: 'Non-text Content - Alternative Text',
        elementTypes: ['img', 'svg', 'canvas', '[role="img"]', 'object', 'embed', 'video', 'audio'],
        interactionTypes: ['inspection', 'content-validation'],
        validationTypes: ['alt-validation', 'content-validation', 'description-validation'],
        testingApproach: 'Verify all non-text content has appropriate alternative text or is marked as decorative',
        confidence: 0.95
      },
      
      // WCAG 3.3.2 Labels or Instructions
      {
        keywords: ['form labels', 'input labels', 'field labels', 'label association', 'form instructions', 'field instructions', 'input instructions', 'form guidance', 'labeling', 'form accessibility'],
        successCriteria: '3.3.2',
        title: 'Labels or Instructions - Form Field Labeling',
        elementTypes: ['input', 'textarea', 'select', 'fieldset', 'label', '[aria-label]', '[aria-labelledby]'],
        interactionTypes: ['form-interaction', 'validation', 'labeling'],
        validationTypes: ['label-validation', 'association-validation', 'instruction-validation'],
        testingApproach: 'Validate all form fields have associated labels or instructions',
        confidence: 0.9
      }
    ];

    // Process each WCAG pattern mapping
    wcagPatternMappings.forEach(mapping => {
      mapping.keywords.forEach(keyword => {
        if (textLower.includes(keyword)) {
          patterns.push({
            pattern: `Verify ${mapping.title}: ${mapping.testingApproach}`,
            confidence: mapping.confidence,
            category: AccessibilityCategory.WCAG_GUIDELINES,
            keywords: [keyword, 'wcag', mapping.successCriteria, ...mapping.title.toLowerCase().split(' ')],
            context: {
              elementTypes: mapping.elementTypes,
              interactionTypes: mapping.interactionTypes,
              validationTypes: mapping.validationTypes,
              wcagReferences: [mapping.successCriteria]
            }
          });
        }
      });
    });

    // General WCAG compliance patterns
    const generalWCAGKeywords = [
      'wcag 2.1', 'wcag 2.2', 'wcag aa', 'wcag aaa', 'wcag compliance',
      'accessibility guidelines', 'web accessibility', 'accessibility standards',
      'wcag conformance', 'accessibility compliance', 'wcag validation',
      'accessibility audit', 'wcag assessment', 'accessibility evaluation'
    ];

    generalWCAGKeywords.forEach(keyword => {
      if (textLower.includes(keyword)) {
        let level: 'A' | 'AA' | 'AAA' = 'AA'; // Default to AA
        let rulesets = ['wcag21aa'];
        
        if (keyword.includes('aaa')) {
          level = 'AAA';
          rulesets = ['wcag21aaa'];
        } else if (keyword.includes('2.2')) {
          rulesets = ['wcag22aa'];
        } else if (keyword.includes('2.1')) {
          rulesets = ['wcag21aa'];
        }

        patterns.push({
          pattern: `Verify ${keyword} compliance`,
          confidence: 0.8,
          category: AccessibilityCategory.WCAG_GUIDELINES,
          keywords: [keyword, 'wcag', 'guidelines', 'compliance'],
          context: {
            elementTypes: ['*'],
            interactionTypes: ['validation', 'compliance'],
            validationTypes: ['wcag-validation', 'compliance-validation', 'standards-validation'],
            wcagReferences: ['2.1.1', '1.4.3', '2.4.3', '4.1.2'] // Common criteria
          }
        });
      }
    });

    return patterns;
  }

  /**
   * Get detailed information about a specific WCAG success criteria
   * Helper method for enhanced WCAG pattern recognition
   */
  private getWCAGCriteriaInfo(criteria: string): {
    title: string;
    level: 'A' | 'AA' | 'AAA';
    elementTypes: string[];
    interactionTypes: string[];
    validationTypes: string[];
  } {
    const wcagCriteriaMap: Record<string, any> = {
      '1.1.1': {
        title: 'Non-text Content',
        level: 'A',
        elementTypes: ['img', 'svg', 'canvas', '[role="img"]', 'object', 'embed'],
        interactionTypes: ['inspection', 'content-validation'],
        validationTypes: ['alt-validation', 'content-validation']
      },
      '1.3.1': {
        title: 'Info and Relationships',
        level: 'A',
        elementTypes: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'main', 'nav', 'header', 'footer', 'aside', 'section'],
        interactionTypes: ['inspection', 'structure-validation'],
        validationTypes: ['structure-validation', 'relationship-validation']
      },
      '1.4.3': {
        title: 'Contrast (Minimum)',
        level: 'AA',
        elementTypes: ['*'],
        interactionTypes: ['visual', 'measurement'],
        validationTypes: ['contrast-validation', 'ratio-validation']
      },
      '1.4.11': {
        title: 'Non-text Contrast',
        level: 'AA',
        elementTypes: ['button', 'input', 'select', 'textarea', '[role="button"]', 'interactive'],
        interactionTypes: ['visual', 'measurement', 'interaction'],
        validationTypes: ['non-text-contrast-validation', 'ui-contrast-validation']
      },
      '2.1.1': {
        title: 'Keyboard',
        level: 'A',
        elementTypes: ['button', 'a', 'input', 'select', 'textarea', '[tabindex]', 'interactive'],
        interactionTypes: ['keyboard', 'navigation', 'activation'],
        validationTypes: ['keyboard-validation', 'functionality-validation']
      },
      '2.4.1': {
        title: 'Bypass Blocks',
        level: 'A',
        elementTypes: ['a[href^="#"]', '.skip-link', '.skip-nav'],
        interactionTypes: ['keyboard', 'navigation'],
        validationTypes: ['skip-link-validation', 'bypass-validation']
      },
      '2.4.3': {
        title: 'Focus Order',
        level: 'A',
        elementTypes: ['*[tabindex]', 'button', 'a', 'input', 'select', 'textarea'],
        interactionTypes: ['keyboard', 'focus', 'sequence'],
        validationTypes: ['focus-order-validation', 'sequence-validation']
      },
      '2.4.7': {
        title: 'Focus Visible',
        level: 'AA',
        elementTypes: ['button', 'a', 'input', 'select', 'textarea', '[tabindex]', 'interactive'],
        interactionTypes: ['keyboard', 'focus', 'visual'],
        validationTypes: ['focus-indicator-validation', 'visibility-validation']
      },
      '3.3.1': {
        title: 'Error Identification',
        level: 'A',
        elementTypes: ['input', 'textarea', 'select', 'form', '[aria-invalid]'],
        interactionTypes: ['form-interaction', 'validation', 'error-handling'],
        validationTypes: ['error-validation', 'identification-validation']
      },
      '3.3.2': {
        title: 'Labels or Instructions',
        level: 'A',
        elementTypes: ['input', 'textarea', 'select', 'fieldset', 'label'],
        interactionTypes: ['form-interaction', 'validation', 'labeling'],
        validationTypes: ['label-validation', 'instruction-validation']
      },
      '4.1.2': {
        title: 'Name, Role, Value',
        level: 'A',
        elementTypes: ['button', 'input', 'select', 'textarea', 'a', '[role]', 'interactive'],
        interactionTypes: ['inspection', 'validation', 'programmatic'],
        validationTypes: ['name-validation', 'role-validation', 'value-validation']
      }
    };

    return wcagCriteriaMap[criteria] || {
      title: 'Unknown Criteria',
      level: 'A',
      elementTypes: ['*'],
      interactionTypes: ['validation'],
      validationTypes: ['wcag-validation']
    };
  }

  /**
   * Recognize semantic HTML patterns in text
   */
  recognizeSemanticHTMLPatterns(text: string): AccessibilityPattern[] {
    const patterns: AccessibilityPattern[] = [];
    const textLower = text.toLowerCase();

    const semanticHTMLKeywords = [
      'semantic html', 'semantic elements', 'semantic structure', 'html5 elements',
      'article element', 'section element', 'aside element', 'figure element',
      'figcaption', 'time element', 'address element', 'semantic markup',
      'meaningful markup', 'structural elements', 'document structure'
    ];

    semanticHTMLKeywords.forEach(keyword => {
      if (textLower.includes(keyword)) {
        patterns.push({
          pattern: `Verify ${keyword} usage`,
          confidence: 0.8,
          category: AccessibilityCategory.DOM_INSPECTION,
          keywords: [keyword, 'semantic', 'html'],
          context: {
            elementTypes: ['article', 'section', 'aside', 'figure', 'figcaption', 'time', 'address'],
            interactionTypes: ['inspection'],
            validationTypes: ['semantic-validation'],
            wcagReferences: ['1.3.1']
          }
        });
      }
    });

    return patterns;
  }
}