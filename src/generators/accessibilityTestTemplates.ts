/**
 * Accessibility-Focused Test Templates Module
 * 
 * Provides specialized code templates for accessibility tests that integrate with
 * the Enhanced Accessibility Parser and include Axe-Core integration by default.
 * 
 * Requirements: 7.3, 7.4, 7.5
 */

import type { AccessibilityTestRequirements } from './enhancedAccessibilityParser';
import type { WebsiteAnalysis } from './testIntentClassifier';

/**
 * Accessibility Test Template Configuration
 */
export interface AccessibilityTestTemplate {
  name: string;
  description: string;
  wcagCriteria: string[];
  requiredFeatures: AccessibilityFeature[];
  codeTemplate: string;
  setupCode: string;
  teardownCode?: string;
}

/**
 * Accessibility Feature Types
 */
export type AccessibilityFeature = 
  | 'dom-inspection'
  | 'keyboard-navigation'
  | 'aria-compliance'
  | 'visual-accessibility'
  | 'wcag-guidelines'
  | 'axe-core-integration';

/**
 * Template Selection Result
 */
export interface TemplateSelectionResult {
  selectedTemplate: AccessibilityTestTemplate;
  customizations: TemplateCustomization[];
  axeCoreConfig: AxeCoreConfiguration;
}

/**
 * Template Customization Options
 */
export interface TemplateCustomization {
  feature: AccessibilityFeature;
  enabled: boolean;
  configuration: Record<string, any>;
}

/**
 * Axe-Core Configuration for Templates
 */
export interface AxeCoreConfiguration {
  rulesets: string[];
  tags: string[];
  disabledRules: string[];
  reportingLevel: 'violations' | 'incomplete' | 'passes' | 'all';
}

/**
 * Accessibility Test Template Registry
 * 
 * Comprehensive collection of accessibility-focused test templates with
 * Axe-Core integration included by default.
 * 
 * Requirements: 7.3, 7.4, 7.5
 */
export const ACCESSIBILITY_TEST_TEMPLATES: Record<string, AccessibilityTestTemplate> = {
  
  /**
   * Comprehensive Accessibility Template
   * Full-featured template with all accessibility testing capabilities
   */
  comprehensive: {
    name: 'Comprehensive Accessibility Testing',
    description: 'Complete accessibility test suite with DOM inspection, keyboard navigation, ARIA compliance, visual accessibility, and WCAG validation',
    wcagCriteria: ['1.1.1', '1.3.1', '1.4.3', '1.4.11', '2.1.1', '2.1.2', '2.4.1', '2.4.3', '2.4.6', '2.4.7', '3.3.2', '4.1.2', '4.1.3'],
    requiredFeatures: ['dom-inspection', 'keyboard-navigation', 'aria-compliance', 'visual-accessibility', 'wcag-guidelines', 'axe-core-integration'],
    setupCode: `
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Accessibility testing utilities
const AccessibilityUtils = {
  async checkColorContrast(page, selector) {
    return await page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (!element) return null;
      
      const styles = window.getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;
      
      // Simple contrast calculation (would use more sophisticated algorithm in production)
      return { color, backgroundColor, element: sel };
    }, selector);
  },
  
  async checkFocusIndicator(page, element) {
    await element.focus();
    return await page.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        boxShadow: styles.boxShadow,
        hasFocusIndicator: styles.outline !== 'none' || styles.boxShadow !== 'none'
      };
    }, await element.elementHandle());
  }
};
`,
    codeTemplate: `
test('{{TEST_NAME}}', async ({ page }) => {
  // Navigate to page and wait for load
  await page.goto('{{URL}}');
  await page.waitForLoadState('networkidle');
  
  {{DOM_INSPECTION_CODE}}
  
  {{KEYBOARD_NAVIGATION_CODE}}
  
  {{ARIA_COMPLIANCE_CODE}}
  
  {{VISUAL_ACCESSIBILITY_CODE}}
  
  {{WCAG_GUIDELINES_CODE}}
  
  {{AXE_CORE_INTEGRATION_CODE}}
});
`
  },

  /**
   * DOM Inspection Focused Template
   * Specialized template for DOM structure and semantic HTML validation
   */
  domInspection: {
    name: 'DOM Inspection and Semantic HTML',
    description: 'Focused on DOM structure validation, semantic HTML, image alt attributes, form labels, and heading hierarchy',
    wcagCriteria: ['1.1.1', '1.3.1', '2.4.6', '3.3.2', '4.1.2'],
    requiredFeatures: ['dom-inspection', 'axe-core-integration'],
    setupCode: `
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// DOM inspection utilities
const DOMInspectionUtils = {
  async validateImageAlt(page) {
    const images = await page.locator('img, svg[role="img"], [role="img"]').all();
    const results = [];
    
    for (const image of images) {
      const alt = await image.getAttribute('alt');
      const ariaLabel = await image.getAttribute('aria-label');
      const role = await image.getAttribute('role');
      
      results.push({
        hasAlt: alt !== null,
        altText: alt,
        ariaLabel,
        role,
        isDecorative: alt === '' || role === 'presentation'
      });
    }
    
    return results;
  },
  
  async validateFormLabels(page) {
    const inputs = await page.locator('input:not([type="hidden"]), textarea, select').all();
    const results = [];
    
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      
      let hasLabel = false;
      if (id) {
        const labelCount = await page.locator(\`label[for="\${id}"]\`).count();
        hasLabel = labelCount > 0;
      }
      
      results.push({
        hasLabel: hasLabel || !!ariaLabel || !!ariaLabelledBy,
        id,
        ariaLabel,
        ariaLabelledBy
      });
    }
    
    return results;
  }
};
`,
    codeTemplate: `
test('{{TEST_NAME}}', async ({ page }) => {
  await page.goto('{{URL}}');
  await page.waitForLoadState('networkidle');
  
  {{DOM_INSPECTION_CODE}}
  
  {{AXE_CORE_INTEGRATION_CODE}}
});
`
  },

  /**
   * Keyboard Navigation Focused Template
   * Specialized template for keyboard accessibility and focus management
   */
  keyboardNavigation: {
    name: 'Keyboard Navigation and Focus Management',
    description: 'Focused on keyboard accessibility, tab sequences, focus order, and keyboard activation patterns',
    wcagCriteria: ['2.1.1', '2.1.2', '2.4.3', '2.4.7'],
    requiredFeatures: ['keyboard-navigation', 'axe-core-integration'],
    setupCode: `
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Keyboard navigation utilities
const KeyboardUtils = {
  async getFocusableElements(page) {
    return await page.locator('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])').all();
  },
  
  async testTabSequence(page, maxElements = 10) {
    const focusSequence = [];
    
    // Start tabbing from beginning
    await page.keyboard.press('Tab');
    
    for (let i = 0; i < maxElements; i++) {
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tagName: el?.tagName.toLowerCase(),
          id: el?.id,
          className: el?.className,
          text: el?.textContent?.trim().substring(0, 50)
        };
      });
      
      focusSequence.push(focusedElement);
      await page.keyboard.press('Tab');
    }
    
    return focusSequence;
  },
  
  async testKeyboardActivation(page, element) {
    await element.focus();
    
    // Test Enter key activation
    const enterResult = await element.evaluate((el) => {
      let activated = false;
      const handler = () => { activated = true; };
      
      el.addEventListener('click', handler);
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      el.removeEventListener('click', handler);
      
      return activated;
    });
    
    return { enterActivation: enterResult };
  }
};
`,
    codeTemplate: `
test('{{TEST_NAME}}', async ({ page }) => {
  await page.goto('{{URL}}');
  await page.waitForLoadState('networkidle');
  
  {{KEYBOARD_NAVIGATION_CODE}}
  
  {{AXE_CORE_INTEGRATION_CODE}}
});
`
  },

  /**
   * ARIA Compliance Focused Template
   * Specialized template for ARIA attributes and screen reader compatibility
   */
  ariaCompliance: {
    name: 'ARIA Compliance and Screen Reader Support',
    description: 'Focused on ARIA attributes, labels, descriptions, live regions, and screen reader compatibility',
    wcagCriteria: ['1.3.1', '4.1.2', '4.1.3'],
    requiredFeatures: ['aria-compliance', 'axe-core-integration'],
    setupCode: `
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// ARIA compliance utilities
const ARIAUtils = {
  async validateARIALabels(page) {
    const interactiveElements = await page.locator('button, a, input, select, textarea, [role="button"], [role="link"]').all();
    const results = [];
    
    for (const element of interactiveElements) {
      const ariaLabel = await element.getAttribute('aria-label');
      const ariaLabelledBy = await element.getAttribute('aria-labelledby');
      const textContent = await element.textContent();
      const role = await element.getAttribute('role');
      
      const hasAccessibleName = !!(ariaLabel || ariaLabelledBy || textContent?.trim());
      
      results.push({
        hasAccessibleName,
        ariaLabel,
        ariaLabelledBy,
        textContent: textContent?.trim(),
        role
      });
    }
    
    return results;
  },
  
  async validateARIAStates(page) {
    const elementsWithStates = await page.locator('[aria-expanded], [aria-selected], [aria-checked], [aria-pressed]').all();
    const results = [];
    
    for (const element of elementsWithStates) {
      const expanded = await element.getAttribute('aria-expanded');
      const selected = await element.getAttribute('aria-selected');
      const checked = await element.getAttribute('aria-checked');
      const pressed = await element.getAttribute('aria-pressed');
      
      results.push({
        expanded: expanded === 'true' || expanded === 'false' ? expanded : null,
        selected: selected === 'true' || selected === 'false' ? selected : null,
        checked: checked === 'true' || checked === 'false' ? checked : null,
        pressed: pressed === 'true' || pressed === 'false' ? pressed : null
      });
    }
    
    return results;
  },
  
  async validateLiveRegions(page) {
    const liveRegions = await page.locator('[aria-live], [role="alert"], [role="status"]').all();
    const results = [];
    
    for (const region of liveRegions) {
      const ariaLive = await region.getAttribute('aria-live');
      const role = await region.getAttribute('role');
      const ariaAtomic = await region.getAttribute('aria-atomic');
      
      results.push({
        ariaLive,
        role,
        ariaAtomic,
        isLiveRegion: !!(ariaLive || role === 'alert' || role === 'status')
      });
    }
    
    return results;
  }
};
`,
    codeTemplate: `
test('{{TEST_NAME}}', async ({ page }) => {
  await page.goto('{{URL}}');
  await page.waitForLoadState('networkidle');
  
  {{ARIA_COMPLIANCE_CODE}}
  
  {{AXE_CORE_INTEGRATION_CODE}}
});
`
  },

  /**
   * Visual Accessibility Focused Template
   * Specialized template for color contrast and visual accessibility features
   */
  visualAccessibility: {
    name: 'Visual Accessibility and Color Contrast',
    description: 'Focused on color contrast ratios, focus indicators, and visual accessibility requirements',
    wcagCriteria: ['1.4.3', '1.4.11', '2.4.7'],
    requiredFeatures: ['visual-accessibility', 'axe-core-integration'],
    setupCode: `
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Visual accessibility utilities
const VisualUtils = {
  async checkColorContrast(page, selector) {
    return await page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (!element) return null;
      
      const styles = window.getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;
      const fontSize = parseFloat(styles.fontSize);
      const fontWeight = styles.fontWeight;
      
      // Determine if text is large (18pt+ or 14pt+ bold)
      const isLargeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));
      
      return {
        color,
        backgroundColor,
        fontSize,
        fontWeight,
        isLargeText,
        selector: sel
      };
    }, selector);
  },
  
  async checkFocusIndicators(page) {
    const focusableElements = await page.locator('button, a, input, select, textarea').all();
    const results = [];
    
    for (const element of focusableElements.slice(0, 5)) {
      await element.focus();
      
      const focusStyles = await page.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          outline: styles.outline,
          outlineWidth: styles.outlineWidth,
          outlineColor: styles.outlineColor,
          boxShadow: styles.boxShadow,
          border: styles.border
        };
      }, await element.elementHandle());
      
      const hasFocusIndicator = 
        (focusStyles.outline && focusStyles.outline !== 'none') ||
        (focusStyles.outlineWidth && focusStyles.outlineWidth !== '0px') ||
        (focusStyles.boxShadow && focusStyles.boxShadow !== 'none');
      
      results.push({
        hasFocusIndicator,
        focusStyles
      });
    }
    
    return results;
  }
};
`,
    codeTemplate: `
test('{{TEST_NAME}}', async ({ page }) => {
  await page.goto('{{URL}}');
  await page.waitForLoadState('networkidle');
  
  {{VISUAL_ACCESSIBILITY_CODE}}
  
  {{AXE_CORE_INTEGRATION_CODE}}
});
`
  },

  /**
   * WCAG Guidelines Focused Template
   * Specialized template for specific WCAG success criteria validation
   */
  wcagGuidelines: {
    name: 'WCAG Guidelines and Success Criteria',
    description: 'Focused on specific WCAG success criteria including heading hierarchy, skip links, and page structure',
    wcagCriteria: ['1.3.1', '2.4.1', '2.4.6', '3.3.2'],
    requiredFeatures: ['wcag-guidelines', 'axe-core-integration'],
    setupCode: `
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// WCAG guidelines utilities
const WCAGUtils = {
  async validateHeadingHierarchy(page) {
    const headings = await page.locator('h1, h2, h3, h4, h5, h6, [role="heading"]').all();
    const headingData = [];
    
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
        level = 1;
      }
      
      headingData.push({
        level,
        text: textContent?.trim() || '',
        tagName
      });
    }
    
    return headingData;
  },
  
  async validateSkipLinks(page) {
    const skipLinks = await page.locator('a[href^="#"], [role="link"][href^="#"]').all();
    const results = [];
    
    for (const link of skipLinks) {
      const href = await link.getAttribute('href');
      const textContent = await link.textContent();
      const isVisible = await link.isVisible();
      
      // Check if target exists
      const targetExists = href ? await page.locator(href).count() > 0 : false;
      
      results.push({
        href,
        text: textContent?.trim(),
        isVisible,
        targetExists,
        isSkipLink: textContent?.toLowerCase().includes('skip') || textContent?.toLowerCase().includes('jump')
      });
    }
    
    return results;
  },
  
  async validateLandmarks(page) {
    const landmarks = {
      main: await page.locator('main, [role="main"]').count(),
      banner: await page.locator('header, [role="banner"]').count(),
      contentinfo: await page.locator('footer, [role="contentinfo"]').count(),
      navigation: await page.locator('nav, [role="navigation"]').count(),
      complementary: await page.locator('aside, [role="complementary"]').count()
    };
    
    return landmarks;
  }
};
`,
    codeTemplate: `
test('{{TEST_NAME}}', async ({ page }) => {
  await page.goto('{{URL}}');
  await page.waitForLoadState('networkidle');
  
  {{WCAG_GUIDELINES_CODE}}
  
  {{AXE_CORE_INTEGRATION_CODE}}
});
`
  }
};

/**
 * Select Appropriate Accessibility Test Template
 * 
 * Analyzes accessibility requirements and selects the most appropriate template
 * with necessary customizations and Axe-Core configuration.
 * 
 * Requirements: 7.3, 7.4, 7.5
 * 
 * @param requirements - Parsed accessibility requirements
 * @param userPrompt - Original user prompt for context
 * @returns Template selection result with customizations
 */
export function selectAccessibilityTestTemplate(
  requirements: AccessibilityTestRequirements,
  userPrompt: string
): TemplateSelectionResult {
  const promptLower = userPrompt.toLowerCase();
  
  // Determine required features based on requirements
  const requiredFeatures: AccessibilityFeature[] = [];
  
  if (requirements.domInspection.length > 0) {
    requiredFeatures.push('dom-inspection');
  }
  
  if (requirements.keyboardNavigation.length > 0) {
    requiredFeatures.push('keyboard-navigation');
  }
  
  if (requirements.ariaCompliance.length > 0) {
    requiredFeatures.push('aria-compliance');
  }
  
  if (requirements.visualAccessibility.length > 0) {
    requiredFeatures.push('visual-accessibility');
  }
  
  if (requirements.wcagGuidelines.length > 0) {
    requiredFeatures.push('wcag-guidelines');
  }
  
  // Always include Axe-Core integration
  requiredFeatures.push('axe-core-integration');
  
  // Select template based on feature requirements
  let selectedTemplate: AccessibilityTestTemplate;
  
  if (requiredFeatures.length <= 2) {
    // Single focus area - use specialized template
    if (requiredFeatures.includes('dom-inspection')) {
      selectedTemplate = ACCESSIBILITY_TEST_TEMPLATES.domInspection;
    } else if (requiredFeatures.includes('keyboard-navigation')) {
      selectedTemplate = ACCESSIBILITY_TEST_TEMPLATES.keyboardNavigation;
    } else if (requiredFeatures.includes('aria-compliance')) {
      selectedTemplate = ACCESSIBILITY_TEST_TEMPLATES.ariaCompliance;
    } else if (requiredFeatures.includes('visual-accessibility')) {
      selectedTemplate = ACCESSIBILITY_TEST_TEMPLATES.visualAccessibility;
    } else if (requiredFeatures.includes('wcag-guidelines')) {
      selectedTemplate = ACCESSIBILITY_TEST_TEMPLATES.wcagGuidelines;
    } else {
      selectedTemplate = ACCESSIBILITY_TEST_TEMPLATES.comprehensive;
    }
  } else {
    // Multiple focus areas - use comprehensive template
    selectedTemplate = ACCESSIBILITY_TEST_TEMPLATES.comprehensive;
  }
  
  // Create customizations based on requirements
  const customizations: TemplateCustomization[] = requiredFeatures.map(feature => ({
    feature,
    enabled: true,
    configuration: getFeatureConfiguration(feature, requirements)
  }));
  
  // Configure Axe-Core based on requirements
  const axeCoreConfig: AxeCoreConfiguration = {
    rulesets: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
    tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
    disabledRules: [],
    reportingLevel: 'violations'
  };
  
  // Add WCAG 2.2 if specifically mentioned
  if (promptLower.includes('wcag 2.2') || promptLower.includes('wcag22')) {
    axeCoreConfig.rulesets.push('wcag22aa');
    axeCoreConfig.tags.push('wcag22aa');
  }
  
  // Add Section 508 if mentioned
  if (promptLower.includes('section 508') || promptLower.includes('508')) {
    axeCoreConfig.rulesets.push('section508');
    axeCoreConfig.tags.push('section508');
  }
  
  return {
    selectedTemplate,
    customizations,
    axeCoreConfig
  };
}

/**
 * Get Feature-Specific Configuration
 * 
 * Returns configuration options for specific accessibility features
 * based on parsed requirements.
 * 
 * @param feature - Accessibility feature type
 * @param requirements - Parsed accessibility requirements
 * @returns Feature configuration object
 */
function getFeatureConfiguration(
  feature: AccessibilityFeature,
  requirements: AccessibilityTestRequirements
): Record<string, any> {
  switch (feature) {
    case 'dom-inspection':
      return {
        imageAlt: requirements.domInspection.some(req => req.type === 'image-alt'),
        formLabels: requirements.domInspection.some(req => req.type === 'form-labels'),
        headingHierarchy: requirements.domInspection.some(req => req.type === 'heading-hierarchy'),
        landmarks: requirements.domInspection.some(req => req.type === 'landmarks'),
        semanticHTML: requirements.domInspection.some(req => req.type === 'semantic-html')
      };
      
    case 'keyboard-navigation':
      return {
        tabSequence: requirements.keyboardNavigation.some(req => req.type === 'tab-sequence'),
        focusOrder: requirements.keyboardNavigation.some(req => req.type === 'focus-order'),
        keyboardActivation: requirements.keyboardNavigation.some(req => req.type === 'keyboard-activation'),
        focusManagement: requirements.keyboardNavigation.some(req => req.type === 'focus-management'),
        keyboardTraps: requirements.keyboardNavigation.some(req => req.type === 'keyboard-traps')
      };
      
    case 'aria-compliance':
      return {
        ariaLabels: requirements.ariaCompliance.some(req => req.type === 'aria-labels'),
        ariaDescriptions: requirements.ariaCompliance.some(req => req.type === 'aria-descriptions'),
        ariaLiveRegions: requirements.ariaCompliance.some(req => req.type === 'aria-live-regions'),
        ariaStates: requirements.ariaCompliance.some(req => req.type === 'aria-states'),
        ariaRoles: requirements.ariaCompliance.some(req => req.type === 'aria-roles')
      };
      
    case 'visual-accessibility':
      return {
        colorContrast: requirements.visualAccessibility.some(req => req.type === 'color-contrast'),
        focusIndicators: requirements.visualAccessibility.some(req => req.type === 'focus-indicators'),
        interactiveElementContrast: requirements.visualAccessibility.some(req => req.type === 'interactive-element-contrast')
      };
      
    case 'wcag-guidelines':
      return {
        successCriteria: requirements.wcagGuidelines.map(req => req.successCriteria),
        levels: [...new Set(requirements.wcagGuidelines.map(req => req.level))]
      };
      
    case 'axe-core-integration':
      return {
        rulesets: requirements.axeCoreIntegration?.rulesets || ['wcag2a', 'wcag2aa', 'wcag21aa'],
        reportingLevel: requirements.axeCoreIntegration?.reportingLevel || 'violations'
      };
      
    default:
      return {};
  }
}

/**
 * Generate Axe-Core Integration Code
 * 
 * Generates standardized Axe-Core integration code that is included
 * in all accessibility test templates.
 * 
 * Requirements: 7.3, 7.5
 * 
 * @param config - Axe-Core configuration
 * @returns Generated Axe-Core integration code
 */
export function generateAxeCoreIntegrationCode(config: AxeCoreConfiguration): string {
  const rulesets = config.rulesets.map(r => `'${r}'`).join(', ');
  const tags = config.tags.map(t => `'${t}'`).join(', ');
  
  return `
  // Comprehensive Accessibility Scanning with Axe-Core
  // Always included in accessibility test templates
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags([${tags}])${config.disabledRules.length > 0 ? `
    .disableRules([${config.disabledRules.map(r => `'${r}'`).join(', ')}])` : ''}
    .analyze();
  
  // Verify no critical accessibility violations
  expect(accessibilityScanResults.violations).toHaveLength(0);
  
  // Log detailed violation information if any exist
  if (accessibilityScanResults.violations.length > 0) {
    console.error('Accessibility violations found:', 
      accessibilityScanResults.violations.map(v => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        nodes: v.nodes.length
      }))
    );
  }
  
  ${config.reportingLevel === 'incomplete' || config.reportingLevel === 'all' ? `
  // Log incomplete accessibility checks for manual review
  if (accessibilityScanResults.incomplete.length > 0) {
    console.log('Incomplete accessibility checks (manual review needed):', 
      accessibilityScanResults.incomplete.map(i => ({
        id: i.id,
        description: i.description,
        nodes: i.nodes.length
      }))
    );
  }` : ''}
  
  ${config.reportingLevel === 'passes' || config.reportingLevel === 'all' ? `
  // Verify successful accessibility checks
  expect(accessibilityScanResults.passes.length).toBeGreaterThan(0);
  console.log(\`Accessibility scan passed \${accessibilityScanResults.passes.length} checks\`);` : ''}
`;
}

/**
 * Provide User Feedback for Enhanced Accessibility Testing
 * 
 * Generates user feedback message when accessibility-specific parsing
 * and templates are activated.
 * 
 * Requirements: 7.5
 * 
 * @param selectedTemplate - Selected accessibility template
 * @param features - Enabled accessibility features
 * @returns User feedback message
 */
export function generateAccessibilityTestingFeedback(
  selectedTemplate: AccessibilityTestTemplate,
  features: AccessibilityFeature[]
): string {
  const featureNames = {
    'dom-inspection': 'DOM Inspection',
    'keyboard-navigation': 'Keyboard Navigation',
    'aria-compliance': 'ARIA Compliance',
    'visual-accessibility': 'Visual Accessibility',
    'wcag-guidelines': 'WCAG Guidelines',
    'axe-core-integration': 'Axe-Core Integration'
  };
  
  const enabledFeatureNames = features
    .filter(f => f !== 'axe-core-integration') // Don't mention axe-core as it's always included
    .map(f => featureNames[f])
    .join(', ');
  
  return `
🔍 Enhanced Accessibility Testing Activated

Template: ${selectedTemplate.name}
Features: ${enabledFeatureNames}
WCAG Criteria: ${selectedTemplate.wcagCriteria.join(', ')}

✅ Axe-Core integration included automatically
✅ Accessibility-based selectors enabled
✅ Comprehensive WCAG compliance validation

The generated tests will use specialized accessibility testing patterns
and include automated accessibility scanning with detailed reporting.
`.trim();
}