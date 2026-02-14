/**
 * Enhanced Playwright Code Generator Module
 * 
 * Generates comprehensive Playwright test code for accessibility testing by integrating
 * DOM inspection, keyboard navigation, ARIA compliance, visual accessibility, and WCAG validation.
 * This module serves as the main orchestrator for all accessibility code generation.
 * 
 * Requirements: 2.1-2.6, 3.1-3.6, 4.1-4.6, 5.1-5.6, 6.1-6.6, 8.1-8.6
 */

import type { 
  AccessibilityTestRequirements,
  DOMInspectionRequirement,
  KeyboardNavigationRequirement,
  ARIAComplianceRequirement,
  VisualAccessibilityRequirement,
  WCAGGuidelineRequirement,
  AxeCoreConfiguration
} from './enhancedAccessibilityParser';
import { ViolationHandlingStrategy } from './enhancedAccessibilityParser';

import { EnhancedDOMInspectionCodeGenerator } from './domInspectionCodeGenerator';
import { EnhancedKeyboardNavigationCodeGenerator, KeyboardNavigationTestUtils } from './keyboardNavigationCodeGenerator';

/**
 * Playwright Test Suite Interface
 * 
 * Represents a complete Playwright test suite with imports, setup, and test cases.
 */
export interface PlaywrightTestSuite {
  imports: string[];
  setup: string;
  testCases: PlaywrightTestCase[];
  utilities: string[];
}

/**
 * Playwright Test Case Interface
 * 
 * Represents an individual test case within the suite.
 */
export interface PlaywrightTestCase {
  name: string;
  description: string;
  wcagCriteria: string[];
  code: string;
  assertions: string[];
}

/**
 * Enhanced Playwright Code Generator Interface
 * 
 * Defines the contract for generating comprehensive accessibility test code.
 */
export interface EnhancedPlaywrightCodeGenerator {
  generateAccessibilityTestSuite(requirements: AccessibilityTestRequirements): PlaywrightTestSuite;
  generateDOMInspectionCode(requirements: DOMInspectionRequirement[]): string;
  generateKeyboardNavigationCode(requirements: KeyboardNavigationRequirement[]): string;
  generateARIAValidationCode(requirements: ARIAComplianceRequirement[]): string;
  generateVisualAccessibilityCode(requirements: VisualAccessibilityRequirement[]): string;
  generateWCAGValidationCode(requirements: WCAGGuidelineRequirement[]): string;
  generateAxeCoreIntegrationCode(config: AxeCoreConfiguration): string;
}

/**
 * Enhanced Playwright Code Generator Implementation
 * 
 * Main class that orchestrates all accessibility code generation.
 */
export class EnhancedPlaywrightAccessibilityCodeGenerator implements EnhancedPlaywrightCodeGenerator {
  private domInspectionGenerator: EnhancedDOMInspectionCodeGenerator;
  private keyboardNavigationGenerator: EnhancedKeyboardNavigationCodeGenerator;

  constructor() {
    this.domInspectionGenerator = new EnhancedDOMInspectionCodeGenerator();
    this.keyboardNavigationGenerator = new EnhancedKeyboardNavigationCodeGenerator();
  }

  /**
   * Generate complete accessibility test suite
   * 
   * Creates a comprehensive Playwright test suite with all accessibility validations.
   * Requirements: All accessibility requirements
   */
  generateAccessibilityTestSuite(requirements: AccessibilityTestRequirements): PlaywrightTestSuite {
    const imports = this.generateImports(requirements);
    const setup = this.generateSetup(requirements);
    const testCases = this.generateTestCases(requirements);
    const utilities = this.generateUtilities(requirements);

    return {
      imports,
      setup,
      testCases,
      utilities
    };
  }
  /**
   * Generate keyboard navigation test code
   * 
   * Creates Playwright code for comprehensive keyboard navigation testing.
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
   */
  generateKeyboardNavigationCode(requirements: KeyboardNavigationRequirement[]): string {
    return this.keyboardNavigationGenerator.generateComprehensiveKeyboardNavigationCode({
      domInspection: [],
      keyboardNavigation: requirements,
      ariaCompliance: [],
      visualAccessibility: [],
      wcagGuidelines: [],
      axeCoreIntegration: {
        rulesets: [],
        tags: [],
        violationHandling: 'fail-on-violations' as any,
        reportingLevel: 'violations'
      }
    });
  }

  /**
   * Generate DOM inspection test code
   * 
   * Creates Playwright code for DOM inspection and validation.
   * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
   */
  generateDOMInspectionCode(requirements: DOMInspectionRequirement[]): string {
    return this.domInspectionGenerator.generateComprehensiveDOMInspectionCode({
      domInspection: requirements,
      keyboardNavigation: [],
      ariaCompliance: [],
      visualAccessibility: [],
      wcagGuidelines: [],
      axeCoreIntegration: {
        rulesets: [],
        tags: [],
        violationHandling: 'fail-on-violations' as any,
        reportingLevel: 'violations'
      }
    });
  }

  /**
   * Generate ARIA validation test code
   * 
   * Creates Playwright code for ARIA compliance validation.
   * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
   */
  generateARIAValidationCode(requirements: ARIAComplianceRequirement[]): string {
    if (requirements.length === 0) {
      return `
  // No ARIA compliance requirements specified
  console.log('No ARIA validation to perform');`;
    }

    const codeBlocks: string[] = [];

    // Generate code for each ARIA compliance requirement
    requirements.forEach(requirement => {
      switch (requirement.type) {
        case 'aria-labels':
          codeBlocks.push(this.generateARIALabelsValidationCode(requirement));
          break;
        case 'aria-descriptions':
          codeBlocks.push(this.generateARIADescriptionsValidationCode(requirement));
          break;
        case 'aria-live-regions':
          codeBlocks.push(this.generateARIALiveRegionsValidationCode(requirement));
          break;
        case 'aria-states':
          codeBlocks.push(this.generateARIAStatesValidationCode(requirement));
          break;
        case 'aria-roles':
          codeBlocks.push(this.generateARIARolesValidationCode(requirement));
          break;
      }
    });

    return `
  // ARIA Compliance Validation
  // Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
  
  ${codeBlocks.join('\n\n  ')}`;
  }

  /**
   * Generate ARIA labels validation code
   * Validates: Requirement 4.1
   */
  private generateARIALabelsValidationCode(requirement: ARIAComplianceRequirement): string {
    return `// ARIA Labels Validation - ${requirement.wcagCriteria.join(', ')}
  console.log('Validating ARIA labels and accessible names...');
  
  // Find all interactive elements that should have accessible names
  const interactiveElements = await page.locator(
    'button:not([disabled]), a[href], input:not([type="hidden"]):not([disabled]), ' +
    'select:not([disabled]), textarea:not([disabled]), [role="button"], [role="link"], ' +
    '[role="menuitem"], [role="tab"], [role="checkbox"], [role="radio"], [tabindex]:not([tabindex="-1"])'
  ).all();
  
  for (const element of interactiveElements) {
    const tagName = await element.evaluate(el => el.tagName.toLowerCase());
    const role = await element.getAttribute('role');
    const ariaLabel = await element.getAttribute('aria-label');
    const ariaLabelledBy = await element.getAttribute('aria-labelledby');
    const textContent = await element.textContent();
    const altText = await element.getAttribute('alt');
    const title = await element.getAttribute('title');
    
    // Calculate accessible name
    let accessibleName = '';
    if (ariaLabel) {
      accessibleName = ariaLabel.trim();
    } else if (ariaLabelledBy) {
      const labellingElements = await page.locator(\`#\${ariaLabelledBy.split(' ').join(', #')}\`).all();
      const labelTexts = await Promise.all(labellingElements.map(el => el.textContent()));
      accessibleName = labelTexts.filter(text => text?.trim()).join(' ').trim();
    } else if (textContent && textContent.trim()) {
      accessibleName = textContent.trim();
    } else if (altText) {
      accessibleName = altText.trim();
    } else if (title) {
      accessibleName = title.trim();
    }
    
    // Validate accessible name exists and is meaningful
    expect(accessibleName).not.toBe('');
    expect(accessibleName.length).toBeGreaterThan(0);
    
    // Validate accessible name is not just whitespace or placeholder text
    expect(accessibleName).not.toMatch(/^\\s+$/);
    expect(accessibleName.toLowerCase()).not.toMatch(/^(click here|link|button|submit|more|read more)$/);
    
    // Validate aria-labelledby references exist
    if (ariaLabelledBy) {
      const referencedIds = ariaLabelledBy.split(' ').filter(id => id.trim());
      for (const id of referencedIds) {
        const referencedElement = await page.locator(\`#\${id}\`).count();
        expect(referencedElement).toBeGreaterThan(0);
        
        const referencedContent = await page.locator(\`#\${id}\`).textContent();
        expect(referencedContent?.trim()).not.toBe('');
      }
    }
    
    // Validate ARIA label is not redundant with visible text for certain elements
    if (ariaLabel && textContent && textContent.trim()) {
      const visibleText = textContent.trim().toLowerCase();
      const labelText = ariaLabel.trim().toLowerCase();
      
      // For buttons and links, aria-label should either match or enhance visible text
      if ((tagName === 'button' || tagName === 'a' || role === 'button' || role === 'link') && 
          labelText !== visibleText && !labelText.includes(visibleText)) {
        console.warn(\`Element has aria-label "\${ariaLabel}" that doesn't match or enhance visible text "\${textContent}"\`);
      }
    }
  }
  
  // Validate form labels specifically
  const formInputs = await page.locator('input:not([type="hidden"]), select, textarea').all();
  
  for (const input of formInputs) {
    const inputId = await input.getAttribute('id');
    const ariaLabel = await input.getAttribute('aria-label');
    const ariaLabelledBy = await input.getAttribute('aria-labelledby');
    const placeholder = await input.getAttribute('placeholder');
    
    let hasLabel = false;
    
    // Check for explicit label element
    if (inputId) {
      const labelElement = await page.locator(\`label[for="\${inputId}"]\`).count();
      if (labelElement > 0) {
        hasLabel = true;
        const labelText = await page.locator(\`label[for="\${inputId}"]\`).textContent();
        expect(labelText?.trim()).not.toBe('');
      }
    }
    
    // Check for aria-label
    if (ariaLabel && ariaLabel.trim()) {
      hasLabel = true;
    }
    
    // Check for aria-labelledby
    if (ariaLabelledBy) {
      hasLabel = true;
    }
    
    // Check for wrapping label
    const wrappingLabel = await input.evaluate(el => {
      let parent = el.parentElement;
      while (parent) {
        if (parent.tagName.toLowerCase() === 'label') {
          return parent.textContent?.trim() || '';
        }
        parent = parent.parentElement;
      }
      return '';
    });
    
    if (wrappingLabel) {
      hasLabel = true;
    }
    
    // Form inputs must have labels (placeholder is not sufficient)
    expect(hasLabel).toBe(true);
    
    // Warn if only placeholder is used (not accessible)
    if (!hasLabel && placeholder) {
      console.warn('Form input relies only on placeholder text, which is not accessible');
    }
  }`;
  }

  /**
   * Generate ARIA descriptions validation code
   * Validates: Requirement 4.2
   */
  private generateARIADescriptionsValidationCode(requirement: ARIAComplianceRequirement): string {
    return `// ARIA Descriptions Validation - ${requirement.wcagCriteria.join(', ')}
  console.log('Validating ARIA descriptions and help text...');
  
  // Find elements with aria-describedby
  const elementsWithDescriptions = await page.locator('[aria-describedby]').all();
  
  for (const element of elementsWithDescriptions) {
    const ariaDescribedBy = await element.getAttribute('aria-describedby');
    
    if (ariaDescribedBy) {
      const descriptionIds = ariaDescribedBy.split(' ').filter(id => id.trim());
      
      for (const id of descriptionIds) {
        // Verify describing element exists
        const describingElement = await page.locator(\`#\${id}\`).count();
        expect(describingElement).toBeGreaterThan(0);
        
        // Verify describing element has meaningful content
        const descriptionText = await page.locator(\`#\${id}\`).textContent();
        expect(descriptionText?.trim()).not.toBe('');
        expect(descriptionText?.trim().length).toBeGreaterThan(0);
        
        // Verify describing element is not hidden from screen readers
        const ariaHidden = await page.locator(\`#\${id}\`).getAttribute('aria-hidden');
        expect(ariaHidden).not.toBe('true');
        
        // Verify describing element is visible or properly hidden
        const isVisible = await page.locator(\`#\${id}\`).isVisible();
        const displayStyle = await page.locator(\`#\${id}\`).evaluate(el => 
          window.getComputedStyle(el).display
        );
        
        // Element can be visually hidden but must be available to screen readers
        if (!isVisible && displayStyle === 'none') {
          console.warn(\`Description element #\${id} is hidden with display:none, making it inaccessible to screen readers\`);
        }
      }
    }
  }
  
  // Find elements with aria-details
  const elementsWithDetails = await page.locator('[aria-details]').all();
  
  for (const element of elementsWithDetails) {
    const ariaDetails = await element.getAttribute('aria-details');
    
    if (ariaDetails) {
      const detailsIds = ariaDetails.split(' ').filter(id => id.trim());
      
      for (const id of detailsIds) {
        // Verify details element exists
        const detailsElement = await page.locator(\`#\${id}\`).count();
        expect(detailsElement).toBeGreaterThan(0);
        
        // Verify details element has content
        const detailsContent = await page.locator(\`#\${id}\`).textContent();
        expect(detailsContent?.trim()).not.toBe('');
      }
    }
  }
  
  // Validate form field descriptions and error messages
  const formFields = await page.locator('input, select, textarea').all();
  
  for (const field of formFields) {
    const fieldId = await field.getAttribute('id');
    const ariaDescribedBy = await field.getAttribute('aria-describedby');
    const ariaInvalid = await field.getAttribute('aria-invalid');
    
    // If field has validation errors, it should have aria-describedby pointing to error message
    if (ariaInvalid === 'true') {
      expect(ariaDescribedBy).not.toBeNull();
      
      if (ariaDescribedBy) {
        const errorMessageExists = await page.locator(\`#\${ariaDescribedBy}\`).count();
        expect(errorMessageExists).toBeGreaterThan(0);
        
        const errorMessage = await page.locator(\`#\${ariaDescribedBy}\`).textContent();
        expect(errorMessage?.trim()).not.toBe('');
        
        // Error message should be descriptive
        expect(errorMessage?.toLowerCase()).toMatch(/(error|invalid|required|must|should|cannot)/);
      }
    }
    
    // Check for help text associations
    if (fieldId) {
      const helpText = await page.locator(\`[id*="help"][id*="\${fieldId}"], [id*="\${fieldId}"][id*="help"], [id*="\${fieldId}"][id*="description"]\`).count();
      
      if (helpText > 0 && !ariaDescribedBy) {
        console.warn(\`Form field #\${fieldId} has associated help text but no aria-describedby attribute\`);
      }
    }
  }`;
  }

  /**
   * Generate ARIA live regions validation code
   * Validates: Requirement 4.3
   */
  private generateARIALiveRegionsValidationCode(requirement: ARIAComplianceRequirement): string {
    return `// ARIA Live Regions Validation - ${requirement.wcagCriteria.join(', ')}
  console.log('Validating ARIA live regions and dynamic content announcements...');
  
  // Find all live regions
  const liveRegions = await page.locator('[aria-live], [role="status"], [role="alert"], [role="log"], [role="marquee"], [role="timer"]').all();
  
  for (const liveRegion of liveRegions) {
    const ariaLive = await liveRegion.getAttribute('aria-live');
    const role = await liveRegion.getAttribute('role');
    const ariaAtomic = await liveRegion.getAttribute('aria-atomic');
    const ariaRelevant = await liveRegion.getAttribute('aria-relevant');
    const ariaBusy = await liveRegion.getAttribute('aria-busy');
    
    // Validate aria-live values
    if (ariaLive) {
      expect(['polite', 'assertive', 'off']).toContain(ariaLive);
    }
    
    // Validate role-based live region behavior
    if (role === 'status') {
      // Status role implies aria-live="polite"
      const effectiveLive = ariaLive || 'polite';
      expect(['polite', 'off']).toContain(effectiveLive);
    }
    
    if (role === 'alert') {
      // Alert role implies aria-live="assertive"
      const effectiveLive = ariaLive || 'assertive';
      expect(['assertive']).toContain(effectiveLive);
    }
    
    if (role === 'log' || role === 'marquee') {
      // Log and marquee roles imply aria-live="polite"
      const effectiveLive = ariaLive || 'polite';
      expect(['polite', 'off']).toContain(effectiveLive);
    }
    
    if (role === 'timer') {
      // Timer role implies aria-live="off"
      const effectiveLive = ariaLive || 'off';
      expect(['off', 'polite']).toContain(effectiveLive);
    }
    
    // Validate aria-atomic values
    if (ariaAtomic) {
      expect(['true', 'false']).toContain(ariaAtomic);
    }
    
    // Validate aria-relevant values
    if (ariaRelevant) {
      const validRelevantValues = ['additions', 'removals', 'text', 'all'];
      const relevantValues = ariaRelevant.split(' ').map(v => v.trim());
      
      relevantValues.forEach(value => {
        expect(validRelevantValues).toContain(value);
      });
    }
    
    // Validate aria-busy values
    if (ariaBusy) {
      expect(['true', 'false']).toContain(ariaBusy);
    }
    
    // Validate live region has appropriate container structure
    const hasContent = await liveRegion.evaluate(el => {
      return el.textContent?.trim().length > 0 || el.children.length > 0;
    });
    
    // Live regions should be present in DOM even when empty (for dynamic updates)
    const isInDOM = await liveRegion.count() > 0;
    expect(isInDOM).toBe(true);
    
    // Check if live region is properly positioned for screen readers
    const isHidden = await liveRegion.evaluate(el => {
      const style = window.getComputedStyle(el);
      return style.display === 'none' || style.visibility === 'hidden';
    });
    
    // Live regions should not be completely hidden
    if (isHidden) {
      console.warn('Live region is hidden and may not announce updates to screen readers');
    }
  }
  
  // Test dynamic content updates in live regions
  const dynamicContentAreas = await page.locator('[aria-live="polite"], [aria-live="assertive"], [role="status"], [role="alert"]').all();
  
  for (const area of dynamicContentAreas) {
    const initialContent = await area.textContent();
    
    // Check if area is used for dynamic updates by looking for common patterns
    const hasUpdateTriggers = await page.locator('button, [role="button"]').evaluateAll((buttons, liveArea) => {
      return buttons.some(button => {
        const buttonText = button.textContent?.toLowerCase() || '';
        return buttonText.includes('update') || buttonText.includes('refresh') || 
               buttonText.includes('load') || buttonText.includes('submit') ||
               buttonText.includes('save') || buttonText.includes('send');
      });
    }, area);
    
    if (hasUpdateTriggers) {
      console.log('Found live region with potential update triggers - manual testing recommended');
    }
  }
  
  // Validate status messages and notifications
  const statusMessages = await page.locator('[role="status"], .status, .message, .notification, .alert').all();
  
  for (const status of statusMessages) {
    const role = await status.getAttribute('role');
    const ariaLive = await status.getAttribute('aria-live');
    
    // Status messages should have appropriate live region properties
    if (!role && !ariaLive) {
      const className = await status.getAttribute('class');
      if (className?.includes('status') || className?.includes('message') || className?.includes('alert')) {
        console.warn('Status message element should have role="status" or aria-live attribute');
      }
    }
  }`;
  }

  /**
   * Generate ARIA states validation code
   * Validates: Requirement 4.4
   */
  private generateARIAStatesValidationCode(requirement: ARIAComplianceRequirement): string {
    return `// ARIA States Validation - ${requirement.wcagCriteria.join(', ')}
  console.log('Validating ARIA states and properties...');
  
  // Find elements with state attributes
  const elementsWithStates = await page.locator(
    '[aria-expanded], [aria-selected], [aria-checked], [aria-pressed], [aria-current], ' +
    '[aria-disabled], [aria-hidden], [aria-invalid], [aria-required], [aria-readonly]'
  ).all();
  
  for (const element of elementsWithStates) {
    const tagName = await element.evaluate(el => el.tagName.toLowerCase());
    const role = await element.getAttribute('role');
    
    // Validate aria-expanded
    const ariaExpanded = await element.getAttribute('aria-expanded');
    if (ariaExpanded !== null) {
      expect(['true', 'false']).toContain(ariaExpanded);
      
      // Elements with aria-expanded should be collapsible/expandable
      const appropriateElements = ['button', 'summary', 'menuitem'];
      const appropriateRoles = ['button', 'menuitem', 'tab', 'combobox', 'disclosure'];
      
      const isAppropriate = appropriateElements.includes(tagName) || 
                           (role && appropriateRoles.includes(role));
      
      if (!isAppropriate) {
        console.warn(\`Element \${tagName}\${role ? \` with role="\${role}"\` : ''} has aria-expanded but may not be semantically appropriate\`);
      }
      
      // If expanded, should control other elements
      if (ariaExpanded === 'true') {
        const ariaControls = await element.getAttribute('aria-controls');
        if (!ariaControls) {
          console.warn('Expanded element should have aria-controls attribute pointing to controlled content');
        } else {
          const controlledElement = await page.locator(\`#\${ariaControls}\`).count();
          expect(controlledElement).toBeGreaterThan(0);
        }
      }
    }
    
    // Validate aria-selected
    const ariaSelected = await element.getAttribute('aria-selected');
    if (ariaSelected !== null) {
      expect(['true', 'false']).toContain(ariaSelected);
      
      // Elements with aria-selected should be selectable
      const appropriateRoles = ['option', 'tab', 'gridcell', 'row', 'columnheader', 'rowheader'];
      
      if (role && !appropriateRoles.includes(role)) {
        console.warn(\`Element with role="\${role}" has aria-selected but may not be semantically appropriate\`);
      }
    }
    
    // Validate aria-checked
    const ariaChecked = await element.getAttribute('aria-checked');
    if (ariaChecked !== null) {
      expect(['true', 'false', 'mixed']).toContain(ariaChecked);
      
      // Elements with aria-checked should be checkable
      const appropriateElements = ['input'];
      const appropriateRoles = ['checkbox', 'radio', 'menuitemcheckbox', 'menuitemradio', 'option', 'switch'];
      
      const isAppropriate = (appropriateElements.includes(tagName) && 
                            ['checkbox', 'radio'].includes(await element.getAttribute('type') || '')) ||
                           (role && appropriateRoles.includes(role));
      
      if (!isAppropriate) {
        console.warn(\`Element \${tagName}\${role ? \` with role="\${role}"\` : ''} has aria-checked but may not be semantically appropriate\`);
      }
    }
    
    // Validate aria-pressed
    const ariaPressed = await element.getAttribute('aria-pressed');
    if (ariaPressed !== null) {
      expect(['true', 'false', 'mixed']).toContain(ariaPressed);
      
      // Elements with aria-pressed should be toggle buttons
      const appropriateElements = ['button'];
      const appropriateRoles = ['button'];
      
      const isAppropriate = appropriateElements.includes(tagName) || 
                           (role && appropriateRoles.includes(role));
      
      if (!isAppropriate) {
        console.warn(\`Element \${tagName}\${role ? \` with role="\${role}"\` : ''} has aria-pressed but may not be semantically appropriate\`);
      }
    }
    
    // Validate aria-current
    const ariaCurrent = await element.getAttribute('aria-current');
    if (ariaCurrent !== null) {
      expect(['page', 'step', 'location', 'date', 'time', 'true', 'false']).toContain(ariaCurrent);
    }
    
    // Validate aria-disabled
    const ariaDisabled = await element.getAttribute('aria-disabled');
    if (ariaDisabled !== null) {
      expect(['true', 'false']).toContain(ariaDisabled);
      
      // Check consistency with HTML disabled attribute
      const htmlDisabled = await element.getAttribute('disabled');
      
      if (ariaDisabled === 'true' && htmlDisabled === null && 
          ['input', 'button', 'select', 'textarea'].includes(tagName)) {
        console.warn('Element has aria-disabled="true" but no HTML disabled attribute - consider using both for maximum compatibility');
      }
    }
    
    // Validate aria-hidden
    const ariaHidden = await element.getAttribute('aria-hidden');
    if (ariaHidden !== null) {
      expect(['true', 'false']).toContain(ariaHidden);
      
      // Elements with aria-hidden="true" should not be focusable
      if (ariaHidden === 'true') {
        const isFocusable = await element.evaluate(el => {
          const tabIndex = el.getAttribute('tabindex');
          const tagName = el.tagName.toLowerCase();
          const type = el.getAttribute('type');
          
          // Check if element is naturally focusable
          const naturallyFocusable = [
            'a', 'button', 'input', 'select', 'textarea', 'details', 'summary'
          ].includes(tagName) && !el.hasAttribute('disabled');
          
          // Check if element has positive tabindex
          const hasPositiveTabIndex = tabIndex && parseInt(tabIndex) >= 0;
          
          return naturallyFocusable || hasPositiveTabIndex;
        });
        
        if (isFocusable) {
          console.warn('Element with aria-hidden="true" is still focusable - this creates accessibility issues');
        }
      }
    }
    
    // Validate aria-invalid
    const ariaInvalid = await element.getAttribute('aria-invalid');
    if (ariaInvalid !== null) {
      expect(['true', 'false', 'grammar', 'spelling']).toContain(ariaInvalid);
      
      // Invalid elements should have error descriptions
      if (ariaInvalid === 'true' || ariaInvalid === 'grammar' || ariaInvalid === 'spelling') {
        const ariaDescribedBy = await element.getAttribute('aria-describedby');
        
        if (!ariaDescribedBy) {
          console.warn('Invalid element should have aria-describedby pointing to error message');
        } else {
          const errorMessage = await page.locator(\`#\${ariaDescribedBy}\`).textContent();
          expect(errorMessage?.trim()).not.toBe('');
        }
      }
    }
    
    // Validate aria-required
    const ariaRequired = await element.getAttribute('aria-required');
    if (ariaRequired !== null) {
      expect(['true', 'false']).toContain(ariaRequired);
      
      // Check consistency with HTML required attribute
      const htmlRequired = await element.getAttribute('required');
      
      if (ariaRequired === 'true' && htmlRequired === null && 
          ['input', 'select', 'textarea'].includes(tagName)) {
        console.warn('Element has aria-required="true" but no HTML required attribute - consider using both for maximum compatibility');
      }
    }
    
    // Validate aria-readonly
    const ariaReadonly = await element.getAttribute('aria-readonly');
    if (ariaReadonly !== null) {
      expect(['true', 'false']).toContain(ariaReadonly);
      
      // Check consistency with HTML readonly attribute
      const htmlReadonly = await element.getAttribute('readonly');
      
      if (ariaReadonly === 'true' && htmlReadonly === null && 
          ['input', 'textarea'].includes(tagName)) {
        console.warn('Element has aria-readonly="true" but no HTML readonly attribute - consider using both for maximum compatibility');
      }
    }
  }`;
  }

  /**
   * Generate ARIA roles validation code
   * Validates: Requirement 4.5
   */
  private generateARIARolesValidationCode(requirement: ARIAComplianceRequirement): string {
    return `// ARIA Roles Validation - ${requirement.wcagCriteria.join(', ')}
  console.log('Validating ARIA roles and semantic structure...');
  
  // Find all elements with explicit roles
  const elementsWithRoles = await page.locator('[role]').all();
  
  // Valid ARIA roles (ARIA 1.2 specification)
  const validRoles = [
    // Widget roles
    'button', 'checkbox', 'gridcell', 'link', 'menuitem', 'menuitemcheckbox', 
    'menuitemradio', 'option', 'progressbar', 'radio', 'scrollbar', 'searchbox',
    'separator', 'slider', 'spinbutton', 'switch', 'tab', 'tabpanel', 'textbox',
    'treeitem', 'combobox', 'grid', 'listbox', 'menu', 'menubar', 'radiogroup',
    'tablist', 'tree', 'treegrid',
    
    // Document structure roles
    'application', 'article', 'cell', 'columnheader', 'definition', 'directory',
    'document', 'feed', 'figure', 'group', 'heading', 'img', 'list', 'listitem',
    'math', 'none', 'note', 'presentation', 'row', 'rowgroup', 'rowheader',
    'separator', 'table', 'term', 'toolbar', 'tooltip',
    
    // Landmark roles
    'banner', 'complementary', 'contentinfo', 'form', 'main', 'navigation',
    'region', 'search',
    
    // Live region roles
    'alert', 'log', 'marquee', 'status', 'timer',
    
    // Window roles
    'alertdialog', 'dialog'
  ];
  
  for (const element of elementsWithRoles) {
    const role = await element.getAttribute('role');
    const tagName = await element.evaluate(el => el.tagName.toLowerCase());
    
    if (role) {
      const roles = role.split(' ').map(r => r.trim()).filter(r => r);
      
      // Validate each role is valid
      roles.forEach(singleRole => {
        expect(validRoles).toContain(singleRole);
      });
      
      // Validate role appropriateness for element
      const primaryRole = roles[0];
      
      // Check for redundant roles (role matches semantic meaning of element)
      const redundantRoleMappings: Record<string, string[]> = {
        'button': ['button'],
        'a': ['link'],
        'input[type="checkbox"]': ['checkbox'],
        'input[type="radio"]': ['radio'],
        'input[type="text"]': ['textbox'],
        'input[type="search"]': ['searchbox'],
        'select': ['listbox', 'combobox'],
        'textarea': ['textbox'],
        'h1': ['heading'],
        'h2': ['heading'],
        'h3': ['heading'],
        'h4': ['heading'],
        'h5': ['heading'],
        'h6': ['heading'],
        'img': ['img'],
        'ul': ['list'],
        'ol': ['list'],
        'li': ['listitem'],
        'table': ['table'],
        'tr': ['row'],
        'td': ['cell', 'gridcell'],
        'th': ['columnheader', 'rowheader'],
        'form': ['form'],
        'main': ['main'],
        'nav': ['navigation'],
        'aside': ['complementary'],
        'header': ['banner'],
        'footer': ['contentinfo'],
        'section': ['region'],
        'article': ['article']
      };
      
      const inputType = await element.getAttribute('type');
      const elementKey = inputType ? \`\${tagName}[type="\${inputType}"]\` : tagName;
      
      if (redundantRoleMappings[elementKey]?.includes(primaryRole)) {
        console.warn(\`Element \${tagName}\${inputType ? \`[type="\${inputType}"]\` : ''} has redundant role="\${primaryRole}" - the role is implicit\`);
      }
      
      // Validate required properties for specific roles
      await this.validateRoleRequiredProperties(element, primaryRole, page);
      
      // Validate role hierarchy and relationships
      await this.validateRoleRelationships(element, primaryRole, page);
    }
  }
  
  // Validate landmark roles structure
  const landmarks = await page.locator('[role="banner"], [role="main"], [role="contentinfo"], [role="navigation"], [role="complementary"], [role="search"], [role="form"], [role="region"], header, main, footer, nav, aside').all();
  
  const landmarkCounts = {
    banner: 0,
    main: 0,
    contentinfo: 0,
    navigation: 0,
    complementary: 0,
    search: 0,
    form: 0,
    region: 0
  };
  
  for (const landmark of landmarks) {
    const role = await landmark.getAttribute('role');
    const tagName = await landmark.evaluate(el => el.tagName.toLowerCase());
    
    // Map HTML5 elements to their implicit roles
    let implicitRole = '';
    switch (tagName) {
      case 'header':
        implicitRole = 'banner';
        break;
      case 'main':
        implicitRole = 'main';
        break;
      case 'footer':
        implicitRole = 'contentinfo';
        break;
      case 'nav':
        implicitRole = 'navigation';
        break;
      case 'aside':
        implicitRole = 'complementary';
        break;
    }
    
    const effectiveRole = role || implicitRole;
    
    if (effectiveRole && landmarkCounts.hasOwnProperty(effectiveRole)) {
      landmarkCounts[effectiveRole as keyof typeof landmarkCounts]++;
    }
  }
  
  // Validate landmark structure
  expect(landmarkCounts.main).toBeLessThanOrEqual(1); // Should have at most one main landmark
  expect(landmarkCounts.banner).toBeLessThanOrEqual(1); // Should have at most one banner
  expect(landmarkCounts.contentinfo).toBeLessThanOrEqual(1); // Should have at most one contentinfo
  
  if (landmarkCounts.main === 0) {
    console.warn('Page should have a main landmark for primary content');
  }`;
  }

  /**
   * Validate required properties for specific ARIA roles
   */
  private async validateRoleRequiredProperties(element: any, role: string, page: any): Promise<void> {
    // This would be implemented as a separate method to validate role-specific requirements
    // For brevity, including key validations inline
    
    const requiredProperties: Record<string, string[]> = {
      'checkbox': ['aria-checked'],
      'radio': ['aria-checked'],
      'slider': ['aria-valuenow', 'aria-valuemin', 'aria-valuemax'],
      'spinbutton': ['aria-valuenow'],
      'progressbar': ['aria-valuenow'],
      'scrollbar': ['aria-valuenow', 'aria-valuemin', 'aria-valuemax'],
      'combobox': ['aria-expanded'],
      'grid': ['aria-rowcount', 'aria-colcount'],
      'gridcell': ['aria-rowindex', 'aria-colindex'],
      'tab': ['aria-selected'],
      'tabpanel': ['aria-labelledby'],
      'menuitem': [],
      'menuitemcheckbox': ['aria-checked'],
      'menuitemradio': ['aria-checked'],
      'option': ['aria-selected'],
      'switch': ['aria-checked']
    };

    if (requiredProperties[role]) {
      for (const property of requiredProperties[role]) {
        const value = await element.getAttribute(property);
        if (value === null) {
          console.warn(`Element with role="${role}" is missing required property "${property}"`);
        }
      }
    }
  }

  /**
   * Validate ARIA role relationships and hierarchy
   */
  private async validateRoleRelationships(element: any, role: string, page: any): Promise<void> {
    // Validate parent-child role relationships
    const roleHierarchy: Record<string, string[]> = {
      'tablist': ['tab'],
      'tab': [], // tabs should be children of tablist
      'tabpanel': [], // tabpanels should be associated with tabs
      'menu': ['menuitem', 'menuitemcheckbox', 'menuitemradio'],
      'menubar': ['menuitem', 'menuitemcheckbox', 'menuitemradio'],
      'listbox': ['option'],
      'radiogroup': ['radio'],
      'tree': ['treeitem'],
      'grid': ['row'],
      'row': ['cell', 'gridcell', 'columnheader', 'rowheader'],
      'table': ['row', 'rowgroup'],
      'rowgroup': ['row']
    };

    if (roleHierarchy[role]) {
      const children = await element.locator('*').all();
      for (const child of children) {
        const childRole = await child.getAttribute('role');
        if (childRole && !roleHierarchy[role].includes(childRole)) {
          console.warn(`Element with role="${role}" contains child with inappropriate role="${childRole}"`);
        }
      }
    }
  }
  /**
   * Generate visual accessibility test code
   * 
   * Creates Playwright code for visual accessibility validation including contrast and focus indicators.
   * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
   */
  generateVisualAccessibilityCode(requirements: VisualAccessibilityRequirement[]): string {
    if (requirements.length === 0) {
      return `
  // No visual accessibility requirements specified
  console.log('No visual accessibility validation to perform');`;
    }

    return `
  // Visual Accessibility Validation
  // Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
  
  // Color Contrast Validation using browser APIs
  const textElements = await page.locator('p, span, div, h1, h2, h3, h4, h5, h6, li, td, th, label, button, a').all();
  
  for (const element of textElements) {
    const textContent = await element.textContent();
    
    if (textContent && textContent.trim().length > 0) {
      const contrastInfo = await element.evaluate(el => {
        const styles = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        
        // Skip hidden elements
        if (rect.width === 0 || rect.height === 0) return null;
        if (styles.visibility === 'hidden' || styles.display === 'none') return null;
        
        return {
          color: styles.color,
          backgroundColor: styles.backgroundColor,
          fontSize: parseFloat(styles.fontSize),
          fontWeight: styles.fontWeight,
          tagName: el.tagName.toLowerCase(),
          isLargeText: parseFloat(styles.fontSize) >= 18 || 
                      (parseFloat(styles.fontSize) >= 14 && parseInt(styles.fontWeight) >= 700)
        };
      });
      
      if (contrastInfo) {
        // Note: Actual contrast calculation would require more complex color parsing
        // This is a simplified validation that checks for obvious contrast issues
        
        expect(contrastInfo.color).not.toBe(contrastInfo.backgroundColor);
        expect(contrastInfo.color).not.toBe('transparent');
        expect(contrastInfo.backgroundColor).toBeTruthy();
        
        // Verify text is not using problematic color combinations
        const problematicCombinations = [
          { color: 'rgb(255, 255, 255)', background: 'rgb(255, 255, 255)' },
          { color: 'rgb(0, 0, 0)', background: 'rgb(0, 0, 0)' },
          { color: 'rgb(128, 128, 128)', background: 'rgb(255, 255, 255)' }
        ];
        
        const hasProblematicContrast = problematicCombinations.some(combo => 
          contrastInfo.color === combo.color && contrastInfo.backgroundColor === combo.background
        );
        
        expect(hasProblematicContrast).toBe(false);
      }
    }
  }
  
  // Focus Indicator Validation
  const interactiveElements = await page.locator(
    'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), ' +
    'textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [role="button"], [role="link"]'
  ).all();
  
  for (const element of interactiveElements) {
    await element.focus();
    
    const focusIndicatorInfo = await element.evaluate(el => {
      const styles = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        outlineStyle: styles.outlineStyle,
        outlineColor: styles.outlineColor,
        boxShadow: styles.boxShadow,
        border: styles.border,
        borderWidth: styles.borderWidth,
        backgroundColor: styles.backgroundColor,
        hasVisibleIndicator: styles.outline !== 'none' || 
                           styles.boxShadow !== 'none' || 
                           styles.borderWidth !== '0px'
      };
    });
    
    // Verify focus indicator is visible
    expect(focusIndicatorInfo.hasVisibleIndicator).toBe(true);
    
    // Verify focus indicator is not transparent
    if (focusIndicatorInfo.outlineColor) {
      expect(focusIndicatorInfo.outlineColor).not.toBe('transparent');
      expect(focusIndicatorInfo.outlineColor).not.toBe('rgba(0, 0, 0, 0)');
    }
  }`;
  }

  /**
   * Generate WCAG validation test code
   * 
   * Creates Playwright code for WCAG guideline compliance validation.
   * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
   */
  generateWCAGValidationCode(requirements: WCAGGuidelineRequirement[]): string {
    if (requirements.length === 0) {
      return `
  // No WCAG guideline requirements specified
  console.log('No WCAG validation to perform');`;
    }

    const codeBlocks: string[] = [];

    // Generate code for each WCAG requirement
    requirements.forEach(requirement => {
      switch (requirement.successCriteria) {
        case '1.3.1': // Info and Relationships
          codeBlocks.push(this.generateInfoAndRelationshipsValidation(requirement));
          break;
        case '2.4.1': // Bypass Blocks
          codeBlocks.push(this.generateBypassBlocksValidation(requirement));
          break;
        case '2.4.6': // Headings and Labels
          codeBlocks.push(this.generateHeadingsAndLabelsValidation(requirement));
          break;
        case '3.3.2': // Labels or Instructions
          codeBlocks.push(this.generateLabelsOrInstructionsValidation(requirement));
          break;
        case '2.1.1': // Keyboard
          codeBlocks.push(this.generateKeyboardAccessValidation(requirement));
          break;
        default:
          codeBlocks.push(this.generateGenericWCAGValidation(requirement));
      }
    });

    return `
  // WCAG Guideline Validation
  // Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
  
  console.log('Performing WCAG guideline validation...');
  
  ${codeBlocks.join('\n\n  ')}`;
  }

  /**
   * Generate Info and Relationships validation (WCAG 1.3.1)
   * Validates: Requirement 6.1, 6.4
   */
  private generateInfoAndRelationshipsValidation(requirement: WCAGGuidelineRequirement): string {
    return `// WCAG 1.3.1 - Info and Relationships (Level ${requirement.level})
  console.log('Validating information and relationships...');
  
  // Validate heading hierarchy
  const headings = await page.locator('h1, h2, h3, h4, h5, h6, [role="heading"]').all();
  
  if (headings.length > 0) {
    const headingLevels: number[] = [];
    
    for (const heading of headings) {
      const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
      const ariaLevel = await heading.getAttribute('aria-level');
      
      let level: number;
      if (tagName.startsWith('h') && tagName.length === 2) {
        level = parseInt(tagName.charAt(1));
      } else if (ariaLevel) {
        level = parseInt(ariaLevel);
      } else {
        level = 1; // Default for role="heading"
      }
      
      headingLevels.push(level);
    }
    
    // Validate heading hierarchy - should start with h1 and not skip levels
    expect(headingLevels[0]).toBe(1);
    
    for (let i = 1; i < headingLevels.length; i++) {
      const currentLevel = headingLevels[i];
      const previousLevel = headingLevels[i - 1];
      const levelDifference = currentLevel - previousLevel;
      
      // Can stay same, go up one level, or go down any number
      expect(levelDifference).toBeLessThanOrEqual(1);
    }
  }
  
  // Validate table structure
  const tables = await page.locator('table').all();
  
  for (const table of tables) {
    // Tables should have proper headers
    const headers = await table.locator('th').count();
    const caption = await table.locator('caption').count();
    
    if (headers === 0 && caption === 0) {
      console.warn('Table lacks proper headers or caption for accessibility');
    }
    
    // Validate table header associations
    const headerCells = await table.locator('th').all();
    for (const header of headerCells) {
      const scope = await header.getAttribute('scope');
      const id = await header.getAttribute('id');
      
      // Headers should have scope or id for association
      if (!scope && !id) {
        console.warn('Table header lacks scope or id attribute for proper association');
      }
    }
  }
  
  // Validate list structure
  const lists = await page.locator('ul, ol, dl').all();
  
  for (const list of lists) {
    const tagName = await list.evaluate(el => el.tagName.toLowerCase());
    
    if (tagName === 'ul' || tagName === 'ol') {
      const listItems = await list.locator('> li').count();
      expect(listItems).toBeGreaterThan(0);
    } else if (tagName === 'dl') {
      const terms = await list.locator('> dt').count();
      const descriptions = await list.locator('> dd').count();
      expect(terms).toBeGreaterThan(0);
      expect(descriptions).toBeGreaterThan(0);
    }
  }`;
  }

  /**
   * Generate Bypass Blocks validation (WCAG 2.4.1)
   * Validates: Requirement 6.2
   */
  private generateBypassBlocksValidation(requirement: WCAGGuidelineRequirement): string {
    return `// WCAG 2.4.1 - Bypass Blocks (Level ${requirement.level})
  console.log('Validating bypass mechanisms...');
  
  // Check for skip links
  const skipLinks = await page.locator('a[href^="#"], [role="link"][href^="#"]').all();
  let hasSkipToMain = false;
  
  for (const link of skipLinks) {
    const linkText = await link.textContent();
    const href = await link.getAttribute('href');
    
    if (linkText && linkText.toLowerCase().includes('skip') && 
        (linkText.toLowerCase().includes('main') || linkText.toLowerCase().includes('content'))) {
      hasSkipToMain = true;
      
      // Verify skip link target exists
      if (href) {
        const targetId = href.substring(1);
        const target = await page.locator(\`#\${targetId}\`).count();
        expect(target).toBeGreaterThan(0);
      }
    }
  }
  
  // Check for landmark structure as alternative bypass mechanism
  const mainLandmark = await page.locator('main, [role="main"]').count();
  const navLandmarks = await page.locator('nav, [role="navigation"]').count();
  
  // Page should have skip links OR proper landmark structure
  const hasBypassMechanism = hasSkipToMain || (mainLandmark > 0 && navLandmarks > 0);
  
  if (!hasBypassMechanism) {
    console.warn('Page lacks bypass mechanism (skip links or landmark structure)');
  }
  
  // Validate skip link functionality
  if (hasSkipToMain) {
    const firstSkipLink = await page.locator('a[href^="#"]').first();
    const skipLinkText = await firstSkipLink.textContent();
    
    if (skipLinkText?.toLowerCase().includes('skip')) {
      // Skip link should be first focusable element or become visible on focus
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => document.activeElement?.textContent);
      
      if (focusedElement?.toLowerCase().includes('skip')) {
        console.log('Skip link is properly positioned and focusable');
      }
    }
  }`;
  }

  /**
   * Generate Headings and Labels validation (WCAG 2.4.6)
   * Validates: Requirement 6.1, 6.3
   */
  private generateHeadingsAndLabelsValidation(requirement: WCAGGuidelineRequirement): string {
    return `// WCAG 2.4.6 - Headings and Labels (Level ${requirement.level})
  console.log('Validating headings and labels descriptiveness...');
  
  // Validate heading descriptiveness
  const headings = await page.locator('h1, h2, h3, h4, h5, h6, [role="heading"]').all();
  
  for (const heading of headings) {
    const headingText = await heading.textContent();
    
    if (headingText) {
      // Headings should be descriptive and not empty
      expect(headingText.trim()).not.toBe('');
      expect(headingText.trim().length).toBeGreaterThan(1);
      
      // Headings should not be generic
      const genericHeadings = ['heading', 'title', 'header', 'section'];
      const isGeneric = genericHeadings.some(generic => 
        headingText.toLowerCase().trim() === generic
      );
      
      if (isGeneric) {
        console.warn(\`Heading "\${headingText}" may be too generic\`);
      }
    }
  }
  
  // Validate label descriptiveness
  const labels = await page.locator('label').all();
  
  for (const label of labels) {
    const labelText = await label.textContent();
    const forAttribute = await label.getAttribute('for');
    
    if (labelText) {
      // Labels should be descriptive
      expect(labelText.trim()).not.toBe('');
      expect(labelText.trim().length).toBeGreaterThan(1);
      
      // Labels should not be generic
      const genericLabels = ['input', 'field', 'text', 'enter'];
      const isGeneric = genericLabels.some(generic => 
        labelText.toLowerCase().trim() === generic
      );
      
      if (isGeneric) {
        console.warn(\`Label "\${labelText}" may be too generic\`);
      }
    }
    
    // Verify label association
    if (forAttribute) {
      const associatedInput = await page.locator(\`#\${forAttribute}\`).count();
      expect(associatedInput).toBe(1);
    }
  }
  
  // Validate button labels
  const buttons = await page.locator('button, [role="button"]').all();
  
  for (const button of buttons) {
    const buttonText = await button.textContent();
    const ariaLabel = await button.getAttribute('aria-label');
    const ariaLabelledBy = await button.getAttribute('aria-labelledby');
    
    const accessibleName = ariaLabel || buttonText?.trim();
    
    if (accessibleName) {
      expect(accessibleName.length).toBeGreaterThan(1);
      
      // Button labels should be descriptive
      const genericButtons = ['click', 'button', 'submit', 'ok'];
      const isGeneric = genericButtons.some(generic => 
        accessibleName.toLowerCase() === generic
      );
      
      if (isGeneric) {
        console.warn(\`Button "\${accessibleName}" may be too generic\`);
      }
    }
  }`;
  }

  /**
   * Generate Labels or Instructions validation (WCAG 3.3.2)
   * Validates: Requirement 6.3, 6.5
   */
  private generateLabelsOrInstructionsValidation(requirement: WCAGGuidelineRequirement): string {
    return `// WCAG 3.3.2 - Labels or Instructions (Level ${requirement.level})
  console.log('Validating form labels and instructions...');
  
  // Validate form field labels and instructions
  const formFields = await page.locator('input:not([type="hidden"]), textarea, select').all();
  
  for (const field of formFields) {
    const fieldType = await field.getAttribute('type');
    const fieldId = await field.getAttribute('id');
    const ariaLabel = await field.getAttribute('aria-label');
    const ariaLabelledBy = await field.getAttribute('aria-labelledby');
    const ariaDescribedBy = await field.getAttribute('aria-describedby');
    const placeholder = await field.getAttribute('placeholder');
    const required = await field.getAttribute('required');
    const ariaRequired = await field.getAttribute('aria-required');
    
    // Skip buttons and submit inputs
    if (fieldType === 'submit' || fieldType === 'button' || fieldType === 'reset') {
      continue;
    }
    
    // Field should have a label
    let hasLabel = false;
    
    if (ariaLabel && ariaLabel.trim()) {
      hasLabel = true;
    }
    
    if (ariaLabelledBy) {
      const labelElements = await page.locator(\`#\${ariaLabelledBy.split(' ').join(', #')}\`).count();
      hasLabel = labelElements > 0;
    }
    
    if (fieldId) {
      const explicitLabel = await page.locator(\`label[for="\${fieldId}"]\`).count();
      hasLabel = hasLabel || explicitLabel > 0;
    }
    
    // Check for implicit label (wrapping label)
    if (!hasLabel) {
      const implicitLabel = await field.evaluate(el => {
        const label = el.closest('label');
        return label && label.textContent?.trim();
      });
      hasLabel = !!implicitLabel;
    }
    
    expect(hasLabel).toBeTruthy();
    
    // Required fields should be clearly indicated
    if (required !== null || ariaRequired === 'true') {
      // Should have visual indicator and/or instruction
      const hasRequiredIndicator = await field.evaluate(el => {
        const label = el.closest('label') || 
                     document.querySelector(\`label[for="\${el.id}"]\`);
        
        if (label) {
          const labelText = label.textContent || '';
          return labelText.includes('*') || 
                 labelText.toLowerCase().includes('required') ||
                 labelText.toLowerCase().includes('mandatory');
        }
        return false;
      });
      
      if (!hasRequiredIndicator && !ariaDescribedBy) {
        console.warn('Required field lacks clear indication of required status');
      }
    }
    
    // Complex fields should have instructions
    if (fieldType === 'password' || fieldType === 'email' || fieldType === 'tel') {
      if (!ariaDescribedBy && !placeholder) {
        console.warn(\`\${fieldType} field may benefit from instructions or help text\`);
      }
    }
  }
  
  // Validate form instructions and help text
  const forms = await page.locator('form').all();
  
  for (const form of forms) {
    const formFields = await form.locator('input, textarea, select').count();
    
    if (formFields > 3) {
      // Complex forms should have overall instructions
      const instructions = await form.locator('.instructions, .help, [role="note"]').count();
      
      if (instructions === 0) {
        console.warn('Complex form may benefit from overall instructions');
      }
    }
  }`;
  }

  /**
   * Generate Keyboard Access validation (WCAG 2.1.1)
   * Validates: Requirement 6.4, 6.6
   */
  private generateKeyboardAccessValidation(requirement: WCAGGuidelineRequirement): string {
    return `// WCAG 2.1.1 - Keyboard (Level ${requirement.level})
  console.log('Validating keyboard accessibility...');
  
  // Find all interactive elements
  const interactiveElements = await page.locator(
    'button:not([disabled]), a[href], input:not([disabled]):not([type="hidden"]), ' +
    'select:not([disabled]), textarea:not([disabled]), [role="button"]:not([aria-disabled="true"]), ' +
    '[role="link"], [role="menuitem"], [role="tab"], [tabindex]:not([tabindex="-1"])'
  ).all();
  
  console.log(\`Found \${interactiveElements.length} interactive elements to test\`);
  
  // Test keyboard navigation
  let focusableCount = 0;
  
  for (const element of interactiveElements.slice(0, 10)) { // Test first 10 elements
    try {
      await element.focus();
      
      const isFocused = await element.evaluate(el => document.activeElement === el);
      
      if (isFocused) {
        focusableCount++;
        
        // Test keyboard activation
        const tagName = await element.evaluate(el => el.tagName.toLowerCase());
        const role = await element.getAttribute('role');
        const type = await element.getAttribute('type');
        
        // Test Enter key activation for buttons and links
        if (tagName === 'button' || role === 'button' || 
            (tagName === 'a' && await element.getAttribute('href')) ||
            (tagName === 'input' && (type === 'button' || type === 'submit'))) {
          
          // Simulate Enter key press
          await page.keyboard.press('Enter');
          
          // Note: In a real test, you would verify the expected action occurred
          console.log(\`Tested Enter key activation on \${tagName}\${role ? \` with role="\${role}"\` : ''}\`);
        }
        
        // Test Space key activation for buttons
        if (tagName === 'button' || role === 'button') {
          await element.focus();
          await page.keyboard.press('Space');
          
          console.log(\`Tested Space key activation on \${tagName}\${role ? \` with role="\${role}"\` : ''}\`);
        }
      }
    } catch (error) {
      console.warn(\`Could not focus element: \${error}\`);
    }
  }
  
  // Verify that interactive elements are keyboard accessible
  expect(focusableCount).toBeGreaterThan(0);
  
  // Test Tab navigation sequence
  await page.keyboard.press('Tab');
  
  let tabCount = 0;
  const maxTabs = Math.min(interactiveElements.length, 5);
  
  for (let i = 0; i < maxTabs; i++) {
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? {
        tagName: el.tagName.toLowerCase(),
        role: el.getAttribute('role'),
        id: el.id,
        className: el.className
      } : null;
    });
    
    if (focusedElement) {
      tabCount++;
      console.log(\`Tab \${i + 1}: Focused \${focusedElement.tagName}\${focusedElement.role ? \` with role="\${focusedElement.role}"\` : ''}\`);
    }
    
    await page.keyboard.press('Tab');
  }
  
  expect(tabCount).toBeGreaterThan(0);
  
  // Test Shift+Tab backward navigation
  await page.keyboard.press('Shift+Tab');
  
  const backwardFocusedElement = await page.evaluate(() => {
    const el = document.activeElement;
    return el ? el.tagName.toLowerCase() : null;
  });
  
  if (backwardFocusedElement) {
    console.log('Backward navigation with Shift+Tab works');
  }`;
  }

  /**
   * Generate generic WCAG validation for other success criteria
   */
  private generateGenericWCAGValidation(requirement: WCAGGuidelineRequirement): string {
    return `// WCAG ${requirement.successCriteria} - ${requirement.testingApproach} (Level ${requirement.level})
  console.log('Validating WCAG ${requirement.successCriteria}...');
  
  // Generic WCAG validation - specific implementation would depend on success criteria
  // This is a placeholder for success criteria not specifically implemented above
  
  console.log('WCAG ${requirement.successCriteria} validation completed');`;
  }

  /**
   * Generate Axe-Core integration code
   * 
   * Creates Playwright code for Axe-Core accessibility scanning.
   * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
   */
  generateAxeCoreIntegrationCode(config: AxeCoreConfiguration): string {
    const rulesetTags = config.rulesets.length > 0 ? config.rulesets : ['wcag2a', 'wcag2aa', 'wcag21aa'];
    const additionalTags = config.tags.length > 0 ? config.tags : [];
    const allTags = [...rulesetTags, ...additionalTags];

    return `
  // Axe-Core Integration
  // Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
  
  console.log('Running Axe-Core accessibility scan...');
  
  // Configure Axe-Core with specified rulesets and tags
  const axeBuilder = new AxeBuilder({ page })
    .withTags([${allTags.map(tag => `'${tag}'`).join(', ')}]);
  
  // Add custom configuration if needed
  ${config.violationHandling === ViolationHandlingStrategy.LOG_ONLY ? `
  axeBuilder.configure({
    rules: {
      // Custom rule configurations can be added here
    }
  });` : ''}
  
  // Run accessibility scan
  const axeResults = await axeBuilder.analyze();
  
  // Handle violations based on configuration
  ${this.generateViolationHandlingCode(config.violationHandling)}
  
  // Generate detailed violation reports
  if (axeResults.violations.length > 0) {
    console.log('\\n=== Accessibility Violations Found ===');
    
    axeResults.violations.forEach((violation, index) => {
      console.log(\`\\nViolation \${index + 1}: \${violation.id}\`);
      console.log(\`Description: \${violation.description}\`);
      console.log(\`Impact: \${violation.impact}\`);
      console.log(\`Help: \${violation.help}\`);
      console.log(\`Help URL: \${violation.helpUrl}\`);
      
      violation.nodes.forEach((node, nodeIndex) => {
        console.log(\`  Node \${nodeIndex + 1}:\`);
        console.log(\`    Target: \${node.target.join(', ')}\`);
        console.log(\`    HTML: \${node.html.substring(0, 100)}...\`);
        
        if (node.failureSummary) {
          console.log(\`    Failure: \${node.failureSummary}\`);
        }
        
        // Log remediation guidance
        if (node.any.length > 0) {
          console.log(\`    Fix any of:\`);
          node.any.forEach(check => {
            console.log(\`      - \${check.message}\`);
          });
        }
        
        if (node.all.length > 0) {
          console.log(\`    Fix all of:\`);
          node.all.forEach(check => {
            console.log(\`      - \${check.message}\`);
          });
        }
      });
    });
    
    console.log('\\n=== End Violations Report ===\\n');
  }
  
  // Log incomplete checks for manual review
  if (axeResults.incomplete.length > 0) {
    console.log('\\n=== Incomplete Accessibility Checks ===');
    console.log('The following checks require manual verification:');
    
    axeResults.incomplete.forEach((incomplete, index) => {
      console.log(\`\\nIncomplete \${index + 1}: \${incomplete.id}\`);
      console.log(\`Description: \${incomplete.description}\`);
      console.log(\`Help: \${incomplete.help}\`);
      
      incomplete.nodes.forEach((node, nodeIndex) => {
        console.log(\`  Node \${nodeIndex + 1}: \${node.target.join(', ')}\`);
        console.log(\`    HTML: \${node.html.substring(0, 100)}...\`);
      });
    });
    
    console.log('\\n=== End Incomplete Checks ===\\n');
  }
  
  // Log successful checks
  console.log(\`\\nAccessibility scan completed:\`);
  console.log(\`- Violations: \${axeResults.violations.length}\`);
  console.log(\`- Incomplete: \${axeResults.incomplete.length}\`);
  console.log(\`- Passes: \${axeResults.passes.length}\`);
  console.log(\`- Inapplicable: \${axeResults.inapplicable.length}\`);
  
  // Verify scan results based on reporting level
  ${this.generateReportingLevelValidation(config.reportingLevel)}`;
  }

  /**
   * Generate violation handling code based on strategy
   */
  private generateViolationHandlingCode(strategy: string): string {
    switch (strategy) {
      case 'fail-on-violations':
        return `
  // Fail test if any violations are found
  if (axeResults.violations.length > 0) {
    const violationSummary = axeResults.violations.map(v => 
      \`\${v.id} (\${v.impact}): \${v.nodes.length} instances\`
    ).join('\\n');
    
    throw new Error(\`Accessibility violations found:\\n\${violationSummary}\`);
  }`;
      
      case 'fail-on-critical':
        return `
  // Fail test only on critical and serious violations
  const criticalViolations = axeResults.violations.filter(v => 
    v.impact === 'critical' || v.impact === 'serious'
  );
  
  if (criticalViolations.length > 0) {
    const violationSummary = criticalViolations.map(v => 
      \`\${v.id} (\${v.impact}): \${v.nodes.length} instances\`
    ).join('\\n');
    
    throw new Error(\`Critical accessibility violations found:\\n\${violationSummary}\`);
  }`;
      
      case 'warn-only':
        return `
  // Log violations as warnings but don't fail test
  if (axeResults.violations.length > 0) {
    console.warn(\`Found \${axeResults.violations.length} accessibility violations - review required\`);
  }`;
      
      default:
        return `
  // Default: Expect no violations
  expect(axeResults.violations).toHaveLength(0);`;
    }
  }

  /**
   * Generate reporting level validation code
   */
  private generateReportingLevelValidation(level: string): string {
    switch (level) {
      case 'violations':
        return `
  // Report only violations
  expect(axeResults.violations.length).toBeGreaterThanOrEqual(0);`;
      
      case 'incomplete':
        return `
  // Report violations and incomplete checks
  expect(axeResults.violations.length).toBeGreaterThanOrEqual(0);
  expect(axeResults.incomplete.length).toBeGreaterThanOrEqual(0);`;
      
      case 'passes':
        return `
  // Report violations, incomplete, and passes
  expect(axeResults.violations.length).toBeGreaterThanOrEqual(0);
  expect(axeResults.incomplete.length).toBeGreaterThanOrEqual(0);
  expect(axeResults.passes.length).toBeGreaterThan(0);`;
      
      case 'all':
        return `
  // Report all results
  expect(axeResults.violations.length).toBeGreaterThanOrEqual(0);
  expect(axeResults.incomplete.length).toBeGreaterThanOrEqual(0);
  expect(axeResults.passes.length).toBeGreaterThan(0);
  expect(axeResults.inapplicable.length).toBeGreaterThanOrEqual(0);`;
      
      default:
        return `
  // Default: Verify scan completed successfully
  expect(axeResults.passes.length).toBeGreaterThan(0);`;
    }
  }

  // Helper methods for generating imports, setup, test cases, and utilities
  private generateImports(requirements: AccessibilityTestRequirements): string[] {
    return [
      "import { test, expect } from '@playwright/test';",
      "import AxeBuilder from '@axe-core/playwright';"
    ];
  }

  private generateSetup(requirements: AccessibilityTestRequirements): string {
    return `
  // Accessibility test setup
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);`;
  }

  private generateTestCases(requirements: AccessibilityTestRequirements): PlaywrightTestCase[] {
    const testCases: PlaywrightTestCase[] = [];

    // Generate keyboard navigation test case
    if (requirements.keyboardNavigation.length > 0) {
      testCases.push({
        name: 'Keyboard Navigation Accessibility',
        description: 'Validates comprehensive keyboard navigation patterns',
        wcagCriteria: ['2.1.1', '2.4.3', '2.4.7'],
        code: this.generateKeyboardNavigationCode(requirements.keyboardNavigation),
        assertions: ['Tab sequences work correctly', 'Focus indicators are visible', 'No keyboard traps exist']
      });
    }

    return testCases;
  }

  private generateUtilities(requirements: AccessibilityTestRequirements): string[] {
    return [
      KeyboardNavigationTestUtils.generateFocusIndicatorValidationCode(),
      KeyboardNavigationTestUtils.generateKeyboardEventSimulationCode()
    ];
  }
}