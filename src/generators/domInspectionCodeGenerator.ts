/**
 * DOM Inspection Code Generator Module
 * 
 * Generates Playwright test code for DOM inspection and accessibility validation.
 * This module creates code that uses accessibility-based selectors instead of visual selectors
 * and validates DOM attributes for accessibility compliance.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */

import type { 
  DOMInspectionRequirement, 
  ValidationRule,
  AccessibilityTestRequirements 
} from './enhancedAccessibilityParser';

/**
 * DOM Inspection Code Generator Interface
 * 
 * Defines the contract for generating DOM inspection test code.
 */
export interface DOMInspectionCodeGenerator {
  generateImageAltValidationCode(requirements: DOMInspectionRequirement[]): string;
  generateFormLabelValidationCode(requirements: DOMInspectionRequirement[]): string;
  generateARIARoleValidationCode(requirements: DOMInspectionRequirement[]): string;
  generateSemanticHTMLValidationCode(requirements: DOMInspectionRequirement[]): string;
  generateHeadingHierarchyValidationCode(requirements: DOMInspectionRequirement[]): string;
  generateLandmarkValidationCode(requirements: DOMInspectionRequirement[]): string;
  generateComprehensiveDOMInspectionCode(requirements: AccessibilityTestRequirements): string;
}

/**
 * Enhanced DOM Inspection Code Generator
 * 
 * Implements comprehensive DOM inspection code generation for accessibility testing.
 */
export class EnhancedDOMInspectionCodeGenerator implements DOMInspectionCodeGenerator {
  
  /**
   * Generate image alt attribute validation code
   * 
   * Creates Playwright code that validates image alt attributes using accessibility-based selectors.
   * Requirements: 2.1, 2.2
   */
  generateImageAltValidationCode(requirements: DOMInspectionRequirement[]): string {
    const imageRequirements = requirements.filter(req => req.type === 'image-alt');
    
    if (imageRequirements.length === 0) {
      return '';
    }

    return `
  // Image Alt Attribute Validation
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
  }`;
  }
  /**
   * Generate form label validation code
   * 
   * Creates Playwright code that validates form label associations using for/id relationships.
   * Requirements: 2.2, 2.3
   */
  generateFormLabelValidationCode(requirements: DOMInspectionRequirement[]): string {
    const formRequirements = requirements.filter(req => req.type === 'form-labels');
    
    if (formRequirements.length === 0) {
      return '';
    }

    return `
  // Form Label Validation
  // Validates: Requirements 2.2, 2.3 - Form accessibility using accessibility-based selectors
  
  // Find all form controls using accessibility-focused selectors
  const formControls = await page.locator('input:not([type="hidden"]), textarea, select').all();
  
  for (const control of formControls) {
    const id = await control.getAttribute('id');
    const ariaLabel = await control.getAttribute('aria-label');
    const ariaLabelledBy = await control.getAttribute('aria-labelledby');
    const type = await control.getAttribute('type');
    const tagName = await control.evaluate(el => el.tagName.toLowerCase());
    
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
    
    // Check for placeholder as fallback (not ideal but acceptable for some cases)
    if (!hasAccessibleName) {
      const placeholder = await control.getAttribute('placeholder');
      if (placeholder && placeholder.trim() !== '') {
        hasAccessibleName = true;
      }
    }
    
    // Assert that form control has accessible name
    expect(hasAccessibleName).toBeTruthy();
    
    // Verify required fields are properly indicated
    const isRequired = await control.getAttribute('required') !== null;
    const ariaRequired = await control.getAttribute('aria-required');
    
    if (isRequired || ariaRequired === 'true') {
      // Required fields should have visual indicator and programmatic indication
      const hasRequiredIndication = isRequired || ariaRequired === 'true';
      expect(hasRequiredIndication).toBe(true);
    }
  }`;
  }

  /**
   * Generate ARIA role validation code
   * 
   * Creates Playwright code that validates ARIA role attributes match element functionality.
   * Requirements: 2.3, 2.4
   */
  generateARIARoleValidationCode(requirements: DOMInspectionRequirement[]): string {
    const ariaRequirements = requirements.filter(req => req.type === 'semantic-html' || req.type === 'landmarks');
    
    if (ariaRequirements.length === 0) {
      return '';
    }

    return `
  // ARIA Role Validation
  // Validates: Requirements 2.3, 2.4 - ARIA role validation using accessibility-based selectors
  
  // Find all elements with ARIA roles using accessibility-focused selectors
  const elementsWithRoles = await page.locator('[role]').all();
  
  // Define valid ARIA roles and their expected contexts
  const validRoles = {
    // Widget roles
    'button': ['button', 'input', 'a', 'div', 'span'],
    'checkbox': ['input', 'div', 'span'],
    'radio': ['input', 'div', 'span'],
    'slider': ['input', 'div'],
    'tab': ['button', 'a', 'div'],
    'tabpanel': ['div', 'section'],
    'textbox': ['input', 'textarea', 'div'],
    'link': ['a', 'button', 'div', 'span'],
    
    // Landmark roles
    'banner': ['header', 'div', 'section'],
    'main': ['main', 'div', 'section'],
    'navigation': ['nav', 'div', 'section'],
    'contentinfo': ['footer', 'div', 'section'],
    'complementary': ['aside', 'div', 'section'],
    'search': ['form', 'div', 'section'],
    'form': ['form', 'div', 'section'],
    'region': ['div', 'section'],
    
    // Document structure roles
    'article': ['article', 'div', 'section'],
    'heading': ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span'],
    'list': ['ul', 'ol', 'div'],
    'listitem': ['li', 'div'],
    
    // Live region roles
    'alert': ['div', 'span', 'p'],
    'status': ['div', 'span', 'p'],
    'log': ['div', 'section'],
    'marquee': ['div', 'section'],
    'timer': ['div', 'span'],
    
    // Presentation roles
    'presentation': ['*'],
    'none': ['*'],
    
    // Dialog roles
    'dialog': ['div', 'section'],
    'alertdialog': ['div', 'section']
  };
  
  for (const element of elementsWithRoles) {
    const role = await element.getAttribute('role');
    const tagName = await element.evaluate(el => el.tagName.toLowerCase());
    
    if (role) {
      // Verify role is valid
      expect(Object.keys(validRoles)).toContain(role);
      
      // Verify role is appropriate for element type
      const allowedTags = validRoles[role as keyof typeof validRoles];
      const isValidContext = allowedTags.includes('*') || allowedTags.includes(tagName);
      expect(isValidContext).toBe(true);
      
      // Additional validation for specific roles
      if (role === 'button') {
        // Button role elements should be keyboard accessible
        const tabIndex = await element.getAttribute('tabindex');
        const isKeyboardAccessible = tabIndex !== '-1';
        expect(isKeyboardAccessible).toBe(true);
      }
      
      if (role === 'heading') {
        // Heading role elements should have aria-level
        const ariaLevel = await element.getAttribute('aria-level');
        expect(ariaLevel).toBeTruthy();
        
        if (ariaLevel) {
          const level = parseInt(ariaLevel);
          expect(level).toBeGreaterThanOrEqual(1);
          expect(level).toBeLessThanOrEqual(6);
        }
      }
      
      if (['banner', 'main', 'contentinfo', 'navigation', 'complementary'].includes(role)) {
        // Landmark roles should have accessible names when multiple instances exist
        const sameRoleCount = await page.locator(\`[role="\${role}"]\`).count();
        if (sameRoleCount > 1) {
          const ariaLabel = await element.getAttribute('aria-label');
          const ariaLabelledBy = await element.getAttribute('aria-labelledby');
          const hasAccessibleName = ariaLabel || ariaLabelledBy;
          expect(hasAccessibleName).toBeTruthy();
        }
      }
      
      if (role === 'tab') {
        // Tab role elements should have aria-selected
        const ariaSelected = await element.getAttribute('aria-selected');
        expect(['true', 'false']).toContain(ariaSelected);
      }
      
      if (role === 'checkbox' || role === 'radio') {
        // Checkbox and radio role elements should have aria-checked
        const ariaChecked = await element.getAttribute('aria-checked');
        expect(['true', 'false', 'mixed']).toContain(ariaChecked);
      }
    }
  }`;
  }

  /**
   * Generate semantic HTML validation code
   * 
   * Creates Playwright code that validates proper semantic HTML structure.
   * Requirements: 2.5, 2.6
   */
  generateSemanticHTMLValidationCode(requirements: DOMInspectionRequirement[]): string {
    const semanticRequirements = requirements.filter(req => req.type === 'semantic-html');
    
    if (semanticRequirements.length === 0) {
      return '';
    }

    return `
  // Semantic HTML Validation
  // Validates: Requirements 2.5, 2.6 - Semantic HTML structure using accessibility-based selectors
  
  // Validate semantic HTML5 elements are used appropriately
  const semanticElements = {
    'main': 'Main content area',
    'nav': 'Navigation sections',
    'header': 'Page or section headers',
    'footer': 'Page or section footers',
    'aside': 'Sidebar or complementary content',
    'article': 'Standalone content pieces',
    'section': 'Thematic content groupings',
    'figure': 'Self-contained content with optional caption',
    'figcaption': 'Caption for figure elements',
    'time': 'Date and time information',
    'address': 'Contact information'
  };
  
  // Check for presence of key semantic elements
  const mainElement = await page.locator('main, [role="main"]').count();
  expect(mainElement).toBeGreaterThanOrEqual(1);
  
  // Validate main element uniqueness
  const mainCount = await page.locator('main').count();
  const mainRoleCount = await page.locator('[role="main"]').count();
  const totalMainElements = mainCount + mainRoleCount;
  expect(totalMainElements).toBeLessThanOrEqual(1);
  
  // Validate navigation elements
  const navElements = await page.locator('nav, [role="navigation"]').all();
  for (const nav of navElements) {
    // Navigation elements should contain links or buttons
    const interactiveElements = await nav.locator('a, button, [role="button"], [role="link"]').count();
    expect(interactiveElements).toBeGreaterThan(0);
    
    // Multiple navigation elements should have accessible names
    if (navElements.length > 1) {
      const ariaLabel = await nav.getAttribute('aria-label');
      const ariaLabelledBy = await nav.getAttribute('aria-labelledby');
      const hasAccessibleName = ariaLabel || ariaLabelledBy;
      expect(hasAccessibleName).toBeTruthy();
    }
  }
  
  // Validate article elements
  const articles = await page.locator('article').all();
  for (const article of articles) {
    // Articles should have headings
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
  
  // Validate time elements have datetime attribute when appropriate
  const timeElements = await page.locator('time').all();
  for (const timeEl of timeElements) {
    const textContent = await timeEl.textContent();
    const datetime = await timeEl.getAttribute('datetime');
    
    // If text content looks like a date/time, should have datetime attribute
    const dateTimePattern = /\\d{4}-\\d{2}-\\d{2}|\\d{1,2}[\/\\-]\\d{1,2}[\/\\-]\\d{2,4}|\\d{1,2}:\\d{2}/;
    if (textContent && dateTimePattern.test(textContent)) {
      expect(datetime).toBeTruthy();
    }
  }
  
  // Validate address elements contain contact information
  const addressElements = await page.locator('address').all();
  for (const address of addressElements) {
    const textContent = await address.textContent();
    expect(textContent?.trim()).not.toBe('');
    
    // Address should not contain non-contact information
    const headings = await address.locator('h1, h2, h3, h4, h5, h6').count();
    expect(headings).toBe(0);
  }`;
  }

  /**
   * Generate heading hierarchy validation code
   * 
   * Creates Playwright code that validates proper heading hierarchy structure.
   * Requirements: 2.5, 2.6
   */
  generateHeadingHierarchyValidationCode(requirements: DOMInspectionRequirement[]): string {
    const headingRequirements = requirements.filter(req => req.type === 'heading-hierarchy');
    
    if (headingRequirements.length === 0) {
      return '';
    }

    return `
  // Heading Hierarchy Validation
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
        element: heading,
        level,
        text: textContent?.trim() || '',
        tagName
      });
    }
    
    // Sort headings by DOM order
    const sortedHeadings = headingData.sort((a, b) => {
      return a.element.evaluate(el => {
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_ELEMENT,
          null,
          false
        );
        let order = 0;
        while (walker.nextNode()) {
          if (walker.currentNode === el) return order;
          order++;
        }
        return order;
      }) - b.element.evaluate(el => {
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_ELEMENT,
          null,
          false
        );
        let order = 0;
        while (walker.nextNode()) {
          if (walker.currentNode === el) return order;
          order++;
        }
        return order;
      });
    });
    
    // Validate heading hierarchy rules
    
    // 1. Page should start with h1
    const firstHeading = sortedHeadings[0];
    expect(firstHeading.level).toBe(1);
    
    // 2. Headings should not skip levels
    for (let i = 1; i < sortedHeadings.length; i++) {
      const currentLevel = sortedHeadings[i].level;
      const previousLevel = sortedHeadings[i - 1].level;
      
      // Can stay same level, go up one level, or go down any number of levels
      const levelDifference = currentLevel - previousLevel;
      expect(levelDifference).toBeLessThanOrEqual(1);
    }
    
    // 3. All headings should have meaningful text content
    for (const heading of sortedHeadings) {
      expect(heading.text).not.toBe('');
      expect(heading.text.length).toBeGreaterThan(0);
    }
    
    // 4. Validate role="heading" elements have aria-level
    for (const heading of sortedHeadings) {
      if (heading.tagName !== 'h1' && heading.tagName !== 'h2' && 
          heading.tagName !== 'h3' && heading.tagName !== 'h4' && 
          heading.tagName !== 'h5' && heading.tagName !== 'h6') {
        const ariaLevel = await heading.element.getAttribute('aria-level');
        expect(ariaLevel).toBeTruthy();
      }
    }
  }`;
  }

  /**
   * Generate landmark validation code
   * 
   * Creates Playwright code that validates page landmark structure.
   * Requirements: 2.5, 2.6
   */
  generateLandmarkValidationCode(requirements: DOMInspectionRequirement[]): string {
    const landmarkRequirements = requirements.filter(req => req.type === 'landmarks');
    
    if (landmarkRequirements.length === 0) {
      return '';
    }

    return `
  // Landmark Validation
  // Validates: Requirements 2.5, 2.6 - Page landmarks using accessibility-based selectors
  
  // Define landmark mappings
  const landmarkMappings = {
    'banner': ['header', '[role="banner"]'],
    'main': ['main', '[role="main"]'],
    'navigation': ['nav', '[role="navigation"]'],
    'contentinfo': ['footer', '[role="contentinfo"]'],
    'complementary': ['aside', '[role="complementary"]'],
    'search': ['[role="search"]'],
    'form': ['[role="form"]'],
    'region': ['[role="region"]']
  };
  
  // Validate essential landmarks are present
  const essentialLandmarks = ['main', 'banner', 'contentinfo'];
  
  for (const landmark of essentialLandmarks) {
    const selectors = landmarkMappings[landmark as keyof typeof landmarkMappings];
    const count = await page.locator(selectors.join(', ')).count();
    
    if (landmark === 'main') {
      // Exactly one main landmark
      expect(count).toBe(1);
    } else {
      // At least one banner and contentinfo
      expect(count).toBeGreaterThanOrEqual(1);
    }
  }
  
  // Validate landmark accessibility names for multiple instances
  for (const [landmarkType, selectors] of Object.entries(landmarkMappings)) {
    const landmarks = await page.locator(selectors.join(', ')).all();
    
    if (landmarks.length > 1) {
      // Multiple landmarks of same type should have accessible names
      for (const landmark of landmarks) {
        const ariaLabel = await landmark.getAttribute('aria-label');
        const ariaLabelledBy = await landmark.getAttribute('aria-labelledby');
        const hasAccessibleName = ariaLabel || ariaLabelledBy;
        expect(hasAccessibleName).toBeTruthy();
      }
    }
  }
  
  // Validate banner landmark placement
  const banners = await page.locator('header, [role="banner"]').all();
  for (const banner of banners) {
    // Banner should not be nested inside other landmarks (except document)
    const parentLandmark = await banner.evaluate(el => {
      let parent = el.parentElement;
      while (parent && parent !== document.body) {
        const role = parent.getAttribute('role');
        const tagName = parent.tagName.toLowerCase();
        
        if (role && ['main', 'contentinfo', 'complementary', 'navigation'].includes(role)) {
          return role;
        }
        if (['main', 'footer', 'aside', 'nav'].includes(tagName)) {
          return tagName;
        }
        parent = parent.parentElement;
      }
      return null;
    });
    
    expect(parentLandmark).toBeNull();
  }
  
  // Validate contentinfo landmark placement
  const contentinfos = await page.locator('footer, [role="contentinfo"]').all();
  for (const contentinfo of contentinfos) {
    // Contentinfo should not be nested inside other landmarks (except document)
    const parentLandmark = await contentinfo.evaluate(el => {
      let parent = el.parentElement;
      while (parent && parent !== document.body) {
        const role = parent.getAttribute('role');
        const tagName = parent.tagName.toLowerCase();
        
        if (role && ['main', 'banner', 'complementary', 'navigation'].includes(role)) {
          return role;
        }
        if (['main', 'header', 'aside', 'nav'].includes(tagName)) {
          return tagName;
        }
        parent = parent.parentElement;
      }
      return null;
    });
    
    expect(parentLandmark).toBeNull();
  }
  
  // Validate navigation landmarks have meaningful content
  const navigations = await page.locator('nav, [role="navigation"]').all();
  for (const nav of navigations) {
    const links = await nav.locator('a, [role="link"]').count();
    const buttons = await nav.locator('button, [role="button"]').count();
    const interactiveElements = links + buttons;
    
    expect(interactiveElements).toBeGreaterThan(0);
  }`;
  }

  /**
   * Generate comprehensive DOM inspection code
   * 
   * Creates complete Playwright test code that combines all DOM inspection validations.
   * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
   */
  generateComprehensiveDOMInspectionCode(requirements: AccessibilityTestRequirements): string {
    const codeBlocks: string[] = [];
    
    // Generate code for each type of DOM inspection
    const imageCode = this.generateImageAltValidationCode(requirements.domInspection);
    if (imageCode) codeBlocks.push(imageCode);
    
    const formCode = this.generateFormLabelValidationCode(requirements.domInspection);
    if (formCode) codeBlocks.push(formCode);
    
    const ariaCode = this.generateARIARoleValidationCode(requirements.domInspection);
    if (ariaCode) codeBlocks.push(ariaCode);
    
    const semanticCode = this.generateSemanticHTMLValidationCode(requirements.domInspection);
    if (semanticCode) codeBlocks.push(semanticCode);
    
    const headingCode = this.generateHeadingHierarchyValidationCode(requirements.domInspection);
    if (headingCode) codeBlocks.push(headingCode);
    
    const landmarkCode = this.generateLandmarkValidationCode(requirements.domInspection);
    if (landmarkCode) codeBlocks.push(landmarkCode);
    
    if (codeBlocks.length === 0) {
      return `
  // No DOM inspection requirements specified
  console.log('No DOM inspection validations to perform');`;
    }
    
    return codeBlocks.join('\n\n');
  }
}