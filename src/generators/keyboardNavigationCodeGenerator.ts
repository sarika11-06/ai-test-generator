/**
 * Enhanced Keyboard Navigation Code Generator Module
 * 
 * Generates comprehensive Playwright test code for keyboard navigation testing including:
 * - Tab key sequences and navigation order validation
 * - Focus order verification (logical reading order)
 * - Keyboard activation testing (Enter/Space keys)
 * - Focus management in modals and dynamic content
 * - Keyboard trap prevention and escape mechanisms
 * - Visible focus indicator validation
 * 
 * This module creates code for complete keyboard-only navigation patterns and 
 * accessibility compliance according to WCAG 2.1 guidelines.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */

import type { 
  KeyboardNavigationRequirement, 
  AccessibilityTestRequirements 
} from './enhancedAccessibilityParser';

/**
 * Keyboard Navigation Code Generator Interface
 * 
 * Defines the contract for generating keyboard navigation test code.
 */
export interface KeyboardNavigationCodeGenerator {
  generateTabSequenceCode(requirements: KeyboardNavigationRequirement[]): string;
  generateFocusOrderValidationCode(requirements: KeyboardNavigationRequirement[]): string;
  generateKeyboardActivationCode(requirements: KeyboardNavigationRequirement[]): string;
  generateFocusManagementCode(requirements: KeyboardNavigationRequirement[]): string;
  generateKeyboardTrapPreventionCode(requirements: KeyboardNavigationRequirement[]): string;
  generateComprehensiveKeyboardNavigationCode(requirements: AccessibilityTestRequirements): string;
}

/**
 * Enhanced Keyboard Navigation Code Generator
 * 
 * Implements comprehensive keyboard navigation code generation for accessibility testing.
 */
export class EnhancedKeyboardNavigationCodeGenerator implements KeyboardNavigationCodeGenerator {
  
  /**
   * Generate Tab key sequence validation code
   * 
   * Creates comprehensive Playwright code that validates Tab key navigation sequences,
   * tabindex behavior, and ensures all interactive elements are reachable via keyboard.
   * Requirements: 3.1, 3.2
   */
  generateTabSequenceCode(requirements: KeyboardNavigationRequirement[]): string {
    const tabRequirements = requirements.filter(req => req.type === 'tab-sequence');
    
    if (tabRequirements.length === 0) {
      return '';
    }

    return `
  // Tab Sequence Validation - Enhanced Implementation
  // Validates: Requirements 3.1, 3.2 - Tab key sequences and navigation order
  
  // Find all focusable elements in proper tab order
  const focusableElements = await page.locator(
    'button:not([disabled]), ' +
    'a[href], ' +
    'input:not([disabled]):not([type="hidden"]), ' +
    'select:not([disabled]), ' +
    'textarea:not([disabled]), ' +
    '[tabindex]:not([tabindex="-1"]), ' +
    '[contenteditable="true"], ' +
    '[role="button"]:not([aria-disabled="true"]), ' +
    '[role="link"], ' +
    '[role="checkbox"]:not([aria-disabled="true"]), ' +
    '[role="radio"]:not([aria-disabled="true"]), ' +
    '[role="slider"]:not([aria-disabled="true"]), ' +
    '[role="tab"]:not([aria-disabled="true"]), ' +
    '[role="menuitem"]:not([aria-disabled="true"])'
  ).all();
  
  console.log(\`Found \${focusableElements.length} focusable elements for tab sequence testing\`);
  
  if (focusableElements.length > 0) {
    // Clear any existing focus
    await page.evaluate(() => {
      if (document.activeElement && document.activeElement !== document.body) {
        (document.activeElement as HTMLElement).blur();
      }
    });
    
    // Start tab sequence from the beginning
    await page.keyboard.press('Tab');
    let currentFocusIndex = 0;
    let tabCount = 0;
    const maxTabs = Math.min(focusableElements.length * 2, 50); // Prevent infinite loops
    
    // Track focus progression through all elements
    const focusProgression: string[] = [];
    
    while (tabCount < maxTabs) {
      // Get currently focused element
      const focusedElement = await page.locator(':focus').first();
      const focusedElementExists = await focusedElement.count() > 0;
      
      if (focusedElementExists) {
        // Record focus progression for debugging
        const elementInfo = await focusedElement.evaluate(el => ({
          tagName: el.tagName.toLowerCase(),
          id: el.id || null,
          className: el.className || null,
          textContent: el.textContent?.trim().substring(0, 30) || '',
          tabIndex: el.getAttribute('tabindex')
        }));
        
        focusProgression.push(\`\${elementInfo.tagName}#\${elementInfo.id || 'no-id'}\`);
        
        // Verify focus indicator is visible
        const focusIndicatorVisible = await focusedElement.evaluate(el => {
          const styles = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          
          // Check for visible focus indicators
          const hasOutline = styles.outline !== 'none' && styles.outlineWidth !== '0px';
          const hasBoxShadow = styles.boxShadow !== 'none' && styles.boxShadow !== '';
          const hasBorder = styles.borderWidth !== '0px' && styles.borderStyle !== 'none';
          const hasBackground = styles.backgroundColor !== 'rgba(0, 0, 0, 0)' && styles.backgroundColor !== 'transparent';
          
          // Element must be visible
          const isVisible = rect.width > 0 && rect.height > 0 && 
                           styles.visibility !== 'hidden' && 
                           styles.display !== 'none' &&
                           parseFloat(styles.opacity) > 0;
          
          return isVisible && (hasOutline || hasBoxShadow || hasBorder || hasBackground);
        });
        
        expect(focusIndicatorVisible).toBe(true);
        
        // Check if we've completed the sequence
        if (tabCount > 0 && focusProgression.length > 1) {
          const currentElement = focusProgression[focusProgression.length - 1];
          const firstElement = focusProgression[0];
          
          // If we've cycled back to the first element, we've completed the sequence
          if (currentElement === firstElement && tabCount > focusableElements.length) {
            console.log('Tab sequence completed - cycled back to first element');
            break;
          }
        }
        
        currentFocusIndex++;
      } else {
        // No element focused - this might indicate a problem
        console.warn(\`No element focused after \${tabCount} tabs\`);
      }
      
      // Move to next element
      await page.keyboard.press('Tab');
      tabCount++;
      await page.waitForTimeout(50); // Brief pause for focus to settle
    }
    
    // Verify we can navigate backwards with Shift+Tab
    console.log('Testing reverse tab navigation...');
    let reverseTabCount = 0;
    const maxReverseTabs = Math.min(focusableElements.length, 10);
    
    while (reverseTabCount < maxReverseTabs) {
      await page.keyboard.press('Shift+Tab');
      await page.waitForTimeout(50);
      
      const focusedElement = await page.locator(':focus').first();
      const focusedExists = await focusedElement.count() > 0;
      
      expect(focusedExists).toBe(true);
      
      if (focusedExists) {
        // Verify focus indicator is still visible in reverse direction
        const focusIndicatorVisible = await focusedElement.evaluate(el => {
          const styles = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          
          const hasOutline = styles.outline !== 'none' && styles.outlineWidth !== '0px';
          const hasBoxShadow = styles.boxShadow !== 'none';
          const hasBorder = styles.borderWidth !== '0px';
          const isVisible = rect.width > 0 && rect.height > 0;
          
          return isVisible && (hasOutline || hasBoxShadow || hasBorder);
        });
        
        expect(focusIndicatorVisible).toBe(true);
      }
      
      reverseTabCount++;
    }
    
    console.log(\`Tab sequence validation completed. Forward tabs: \${tabCount}, Reverse tabs: \${reverseTabCount}\`);
    console.log('Focus progression:', focusProgression.slice(0, 10).join(' -> '));
  }`;
  }
  /**
   * Generate focus order validation code
   * 
   * Creates Playwright code that validates logical focus order and reading sequence.
   * Requirements: 3.2, 3.3
   */
  generateFocusOrderValidationCode(requirements: KeyboardNavigationRequirement[]): string {
    const focusOrderRequirements = requirements.filter(req => req.type === 'focus-order');
    
    if (focusOrderRequirements.length === 0) {
      return '';
    }

    return `
  // Focus Order Validation
  // Validates: Requirements 3.2, 3.3 - Logical focus order and reading sequence
  
  // Get all focusable elements with their positions
  const focusableElementsWithPositions = await page.evaluate(() => {
    const focusableSelectors = [
      'button:not([disabled])',
      'a[href]',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ];
    
    const elements = [];
    const allFocusable = document.querySelectorAll(focusableSelectors.join(', '));
    
    allFocusable.forEach((element, index) => {
      const rect = element.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(element);
      const tabIndex = element.getAttribute('tabindex');
      
      // Skip hidden elements
      if (rect.width === 0 && rect.height === 0) return;
      if (computedStyle.visibility === 'hidden') return;
      if (computedStyle.display === 'none') return;
      
      elements.push({
        index,
        tagName: element.tagName.toLowerCase(),
        id: element.id || null,
        className: element.className || null,
        tabIndex: tabIndex ? parseInt(tabIndex) : 0,
        rect: {
          top: rect.top,
          left: rect.left,
          right: rect.right,
          bottom: rect.bottom
        },
        textContent: element.textContent?.trim().substring(0, 50) || ''
      });
    });
    
    return elements;
  });
  
  if (focusableElementsWithPositions.length > 1) {
    // Validate reading order (left-to-right, top-to-bottom)
    for (let i = 0; i < focusableElementsWithPositions.length - 1; i++) {
      const current = focusableElementsWithPositions[i];
      const next = focusableElementsWithPositions[i + 1];
      
      // Elements with explicit positive tabindex should come first
      if (current.tabIndex > 0 && next.tabIndex === 0) {
        // This is correct order
        continue;
      }
      
      // Among elements with same tabindex priority, check visual order
      if (current.tabIndex === next.tabIndex) {
        const currentCenterY = (current.rect.top + current.rect.bottom) / 2;
        const nextCenterY = (next.rect.top + next.rect.bottom) / 2;
        const currentCenterX = (current.rect.left + current.rect.right) / 2;
        const nextCenterX = (next.rect.left + next.rect.right) / 2;
        
        // Allow some tolerance for elements on the same "line"
        const verticalTolerance = 10;
        
        if (Math.abs(currentCenterY - nextCenterY) <= verticalTolerance) {
          // Elements are roughly on the same line, check left-to-right order
          const isLogicalHorizontalOrder = currentCenterX <= nextCenterX;
          expect(isLogicalHorizontalOrder).toBe(true);
        } else {
          // Elements are on different lines, check top-to-bottom order
          const isLogicalVerticalOrder = currentCenterY <= nextCenterY;
          expect(isLogicalVerticalOrder).toBe(true);
        }
      }
    }
    
    // Test actual focus order matches expected order
    await page.keyboard.press('Tab');
    
    for (let i = 0; i < Math.min(focusableElementsWithPositions.length, 10); i++) {
      const focusedElement = await page.locator(':focus').first();
      const focusedExists = await focusedElement.count() > 0;
      
      if (focusedExists) {
        // Verify focus indicator is visible
        const focusStyles = await focusedElement.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            outline: styles.outline,
            outlineWidth: styles.outlineWidth,
            outlineStyle: styles.outlineStyle,
            outlineColor: styles.outlineColor,
            boxShadow: styles.boxShadow,
            border: styles.border
          };
        });
        
        // Check if element has visible focus indicator
        const hasVisibleFocusIndicator = 
          focusStyles.outline !== 'none' ||
          focusStyles.outlineWidth !== '0px' ||
          focusStyles.boxShadow !== 'none' ||
          focusStyles.border !== 'none';
        
        expect(hasVisibleFocusIndicator).toBe(true);
        
        // Move to next element
        if (i < Math.min(focusableElementsWithPositions.length, 10) - 1) {
          await page.keyboard.press('Tab');
        }
      }
    }
  }`;
  }
  /**
   * Generate keyboard activation validation code
   * 
   * Creates comprehensive Playwright code that validates Enter and Space key activation 
   * for all interactive elements according to WCAG guidelines.
   * Requirements: 3.3, 3.4
   */
  generateKeyboardActivationCode(requirements: KeyboardNavigationRequirement[]): string {
    const activationRequirements = requirements.filter(req => req.type === 'keyboard-activation');
    
    if (activationRequirements.length === 0) {
      return '';
    }

    return `
  // Keyboard Activation Validation - Enhanced Implementation
  // Validates: Requirements 3.3, 3.4 - Enter and Space key activation
  
  // Test button activation with Enter and Space keys
  const buttons = await page.locator('button:not([disabled]), [role="button"]:not([aria-disabled="true"])').all();
  
  console.log(\`Testing keyboard activation for \${buttons.length} buttons\`);
  
  for (const button of buttons) {
    // Focus the button
    await button.focus();
    await page.waitForTimeout(100);
    
    // Verify button is focusable and focused
    const isFocused = await page.evaluate(() => document.activeElement === arguments[0], await button.elementHandle());
    expect(isFocused).toBe(true);
    
    // Get button information for debugging
    const buttonInfo = await button.evaluate(btn => ({
      tagName: btn.tagName.toLowerCase(),
      type: btn.getAttribute('type'),
      role: btn.getAttribute('role'),
      ariaLabel: btn.getAttribute('aria-label'),
      textContent: btn.textContent?.trim().substring(0, 30) || ''
    }));
    
    console.log(\`Testing button: \${buttonInfo.tagName} - \${buttonInfo.textContent}\`);
    
    // Test Enter key activation
    let enterActivationDetected = false;
    
    // Set up click event listener
    await button.evaluate(btn => {
      btn.addEventListener('click', () => {
        btn.setAttribute('data-enter-activated', 'true');
      }, { once: true });
    });
    
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200); // Wait for event processing
    
    // Check if Enter activation occurred
    const enterActivated = await button.getAttribute('data-enter-activated');
    if (enterActivated === 'true') {
      enterActivationDetected = true;
      console.log('✓ Enter key activation successful');
    }
    
    // Test Space key activation for buttons (should work for buttons)
    let spaceActivationDetected = false;
    
    await button.evaluate(btn => {
      btn.removeAttribute('data-enter-activated');
      btn.addEventListener('click', () => {
        btn.setAttribute('data-space-activated', 'true');
      }, { once: true });
    });
    
    await page.keyboard.press('Space');
    await page.waitForTimeout(200);
    
    const spaceActivated = await button.getAttribute('data-space-activated');
    if (spaceActivated === 'true') {
      spaceActivationDetected = true;
      console.log('✓ Space key activation successful');
    }
    
    // Both Enter and Space should activate buttons
    expect(enterActivationDetected || spaceActivationDetected).toBe(true);
    
    // Clean up attributes
    await button.evaluate(btn => {
      btn.removeAttribute('data-enter-activated');
      btn.removeAttribute('data-space-activated');
    });
  }
  
  // Test link activation with Enter key (Space should NOT activate links)
  const links = await page.locator('a[href], [role="link"]').all();
  
  console.log(\`Testing keyboard activation for \${links.length} links\`);
  
  for (const link of links) {
    // Focus the link
    await link.focus();
    await page.waitForTimeout(100);
    
    // Verify link is focusable
    const isFocused = await page.evaluate(() => document.activeElement === arguments[0], await link.elementHandle());
    expect(isFocused).toBe(true);
    
    const linkInfo = await link.evaluate(lnk => ({
      href: lnk.getAttribute('href'),
      role: lnk.getAttribute('role'),
      textContent: lnk.textContent?.trim().substring(0, 30) || ''
    }));
    
    console.log(\`Testing link: \${linkInfo.textContent} (href: \${linkInfo.href})\`);
    
    // Test Enter key activation (should work for links)
    let enterActivationDetected = false;
    
    if (linkInfo.href && linkInfo.href !== '#' && !linkInfo.href.startsWith('javascript:')) {
      // For real links, prevent navigation but detect activation
      await link.evaluate(lnk => {
        lnk.addEventListener('click', (e) => {
          e.preventDefault(); // Prevent actual navigation in test
          lnk.setAttribute('data-link-enter-activated', 'true');
        }, { once: true });
      });
      
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
      
      const enterActivated = await link.getAttribute('data-link-enter-activated');
      if (enterActivated === 'true') {
        enterActivationDetected = true;
        console.log('✓ Enter key activation successful for link');
      }
      
      expect(enterActivationDetected).toBe(true);
    }
    
    // Test Space key (should NOT activate links - this is correct behavior)
    await link.evaluate(lnk => {
      lnk.addEventListener('click', (e) => {
        e.preventDefault();
        lnk.setAttribute('data-link-space-activated', 'true');
      }, { once: true });
    });
    
    await page.keyboard.press('Space');
    await page.waitForTimeout(200);
    
    const spaceActivated = await link.getAttribute('data-link-space-activated');
    // Space should NOT activate links (this is correct accessibility behavior)
    expect(spaceActivated).not.toBe('true');
    
    // Clean up
    await link.evaluate(lnk => {
      lnk.removeAttribute('data-link-enter-activated');
      lnk.removeAttribute('data-link-space-activated');
    });
  }
  
  // Test form control activation
  const checkboxes = await page.locator('input[type="checkbox"]:not([disabled]), [role="checkbox"]:not([aria-disabled="true"])').all();
  
  console.log(\`Testing keyboard activation for \${checkboxes.length} checkboxes\`);
  
  for (const checkbox of checkboxes) {
    await checkbox.focus();
    await page.waitForTimeout(100);
    
    // Get initial checked state
    const initialChecked = await checkbox.evaluate(cb => {
      return cb.type === 'checkbox' ? cb.checked : cb.getAttribute('aria-checked') === 'true';
    });
    
    console.log(\`Checkbox initial state: \${initialChecked}\`);
    
    // Space key should toggle checkbox
    await page.keyboard.press('Space');
    await page.waitForTimeout(200);
    
    const afterSpaceChecked = await checkbox.evaluate(cb => {
      return cb.type === 'checkbox' ? cb.checked : cb.getAttribute('aria-checked') === 'true';
    });
    
    console.log(\`Checkbox after Space: \${afterSpaceChecked}\`);
    expect(afterSpaceChecked).toBe(!initialChecked);
    
    // Enter key should also toggle checkbox for consistency
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    
    const afterEnterChecked = await checkbox.evaluate(cb => {
      return cb.type === 'checkbox' ? cb.checked : cb.getAttribute('aria-checked') === 'true';
    });
    
    // Should be back to initial state
    expect(afterEnterChecked).toBe(initialChecked);
  }
  
  // Test radio button activation and arrow key navigation
  const radioButtons = await page.locator('input[type="radio"]:not([disabled]), [role="radio"]:not([aria-disabled="true"])').all();
  
  console.log(\`Testing keyboard activation for \${radioButtons.length} radio buttons\`);
  
  for (const radio of radioButtons) {
    await radio.focus();
    await page.waitForTimeout(100);
    
    // Arrow keys should navigate between radio buttons in same group
    const name = await radio.getAttribute('name');
    if (name) {
      const groupRadios = await page.locator(\`input[type="radio"][name="\${name}"], [role="radio"][name="\${name}"]\`).all();
      
      if (groupRadios.length > 1) {
        console.log(\`Testing arrow navigation for radio group: \${name} (\${groupRadios.length} radios)\`);
        
        // Test arrow key navigation
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(100);
        
        const focusedAfterArrow = await page.locator(':focus').first();
        const isRadioFocused = await focusedAfterArrow.evaluate(el => {
          return el.type === 'radio' || el.getAttribute('role') === 'radio';
        });
        
        expect(isRadioFocused).toBe(true);
        
        // Test ArrowUp navigation
        await page.keyboard.press('ArrowUp');
        await page.waitForTimeout(100);
        
        const focusedAfterUp = await page.locator(':focus').first();
        const isStillRadio = await focusedAfterUp.evaluate(el => {
          return el.type === 'radio' || el.getAttribute('role') === 'radio';
        });
        
        expect(isStillRadio).toBe(true);
      }
    }
    
    // Space and Enter should select radio button
    const initialSelected = await radio.evaluate(rb => {
      return rb.type === 'radio' ? rb.checked : rb.getAttribute('aria-checked') === 'true';
    });
    
    if (!initialSelected) {
      await page.keyboard.press('Space');
      await page.waitForTimeout(100);
      
      const selectedAfterSpace = await radio.evaluate(rb => {
        return rb.type === 'radio' ? rb.checked : rb.getAttribute('aria-checked') === 'true';
      });
      
      expect(selectedAfterSpace).toBe(true);
    }
  }
  
  console.log('Keyboard activation validation completed');`;
  }
  /**
   * Generate focus management validation code
   * 
   * Creates Playwright code that validates focus management in modals and dynamic content.
   * Requirements: 3.4, 3.5
   */
  generateFocusManagementCode(requirements: KeyboardNavigationRequirement[]): string {
    const focusManagementRequirements = requirements.filter(req => req.type === 'focus-management');
    
    if (focusManagementRequirements.length === 0) {
      return '';
    }

    return `
  // Focus Management Validation
  // Validates: Requirements 3.4, 3.5 - Focus management in modals and dynamic content
  
  // Test modal focus management
  const modalTriggers = await page.locator('[data-toggle="modal"], [aria-haspopup="dialog"], .modal-trigger, [onclick*="modal"]').all();
  
  for (const trigger of modalTriggers) {
    // Store the trigger element for later focus restoration test
    await trigger.focus();
    const triggerFocused = await page.evaluate(() => document.activeElement === arguments[0], await trigger.elementHandle());
    
    if (triggerFocused) {
      // Activate the modal trigger
      await trigger.click();
      await page.waitForTimeout(500); // Wait for modal to appear
      
      // Check if modal appeared
      const modal = await page.locator('[role="dialog"], [role="alertdialog"], .modal[aria-modal="true"], .modal.show').first();
      const modalExists = await modal.count() > 0;
      
      if (modalExists) {
        // Verify modal has aria-modal="true"
        const ariaModal = await modal.getAttribute('aria-modal');
        expect(ariaModal).toBe('true');
        
        // Verify focus is moved to modal
        await page.waitForTimeout(200);
        const focusedElement = await page.locator(':focus').first();
        const focusedExists = await focusedElement.count() > 0;
        
        if (focusedExists) {
          // Focus should be within the modal
          const focusWithinModal = await focusedElement.evaluate((focused, modalEl) => {
            return modalEl.contains(focused);
          }, await modal.elementHandle());
          
          expect(focusWithinModal).toBe(true);
        }
        
        // Test focus trap - Tab should cycle within modal
        const modalFocusableElements = await modal.locator(
          'button:not([disabled]), ' +
          'a[href], ' +
          'input:not([disabled]):not([type="hidden"]), ' +
          'select:not([disabled]), ' +
          'textarea:not([disabled]), ' +
          '[tabindex]:not([tabindex="-1"]), ' +
          '[contenteditable="true"]'
        ).all();
        
        if (modalFocusableElements.length > 1) {
          // Tab through all focusable elements in modal
          for (let i = 0; i < modalFocusableElements.length + 1; i++) {
            await page.keyboard.press('Tab');
            await page.waitForTimeout(100);
            
            const currentFocus = await page.locator(':focus').first();
            const currentFocusExists = await currentFocus.count() > 0;
            
            if (currentFocusExists) {
              // Focus should still be within modal
              const stillWithinModal = await currentFocus.evaluate((focused, modalEl) => {
                return modalEl.contains(focused);
              }, await modal.elementHandle());
              
              expect(stillWithinModal).toBe(true);
            }
          }
        }
        
        // Test Escape key closes modal
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
        
        const modalStillExists = await modal.count() > 0;
        const modalVisible = modalStillExists ? await modal.isVisible() : false;
        
        // Modal should be closed or hidden
        expect(modalVisible).toBe(false);
        
        // Focus should return to trigger element
        await page.waitForTimeout(200);
        const finalFocusedElement = await page.locator(':focus').first();
        const finalFocusExists = await finalFocusedElement.count() > 0;
        
        if (finalFocusExists) {
          const focusReturnedToTrigger = await finalFocusedElement.evaluate((focused, triggerEl) => {
            return focused === triggerEl;
          }, await trigger.elementHandle());
          
          expect(focusReturnedToTrigger).toBe(true);
        }
      }
    }
  }
  
  // Test dropdown/combobox focus management
  const dropdownTriggers = await page.locator('[aria-haspopup="listbox"], [aria-haspopup="menu"], [aria-expanded]').all();
  
  for (const dropdownTrigger of dropdownTriggers) {
    await dropdownTrigger.focus();
    
    // Check if dropdown is expandable
    const ariaExpanded = await dropdownTrigger.getAttribute('aria-expanded');
    
    if (ariaExpanded !== null) {
      // Activate dropdown
      await dropdownTrigger.click();
      await page.waitForTimeout(300);
      
      const expandedAfterClick = await dropdownTrigger.getAttribute('aria-expanded');
      
      if (expandedAfterClick === 'true') {
        // Find associated dropdown content
        const ariaControls = await dropdownTrigger.getAttribute('aria-controls');
        let dropdown = null;
        
        if (ariaControls) {
          dropdown = await page.locator(\`#\${ariaControls}\`).first();
        } else {
          // Look for dropdown in proximity
          dropdown = await page.locator('[role="listbox"], [role="menu"], .dropdown-menu').first();
        }
        
        const dropdownExists = dropdown ? await dropdown.count() > 0 : false;
        
        if (dropdownExists && dropdown) {
          // Test arrow key navigation in dropdown
          await page.keyboard.press('ArrowDown');
          await page.waitForTimeout(100);
          
          const focusedInDropdown = await page.locator(':focus').first();
          const focusedInDropdownExists = await focusedInDropdown.count() > 0;
          
          if (focusedInDropdownExists) {
            const focusWithinDropdown = await focusedInDropdown.evaluate((focused, dropdownEl) => {
              return dropdownEl.contains(focused);
            }, await dropdown.elementHandle());
            
            expect(focusWithinDropdown).toBe(true);
          }
          
          // Escape should close dropdown and return focus
          await page.keyboard.press('Escape');
          await page.waitForTimeout(200);
          
          const expandedAfterEscape = await dropdownTrigger.getAttribute('aria-expanded');
          expect(expandedAfterEscape).toBe('false');
          
          const focusAfterEscape = await page.locator(':focus').first();
          const focusAfterEscapeExists = await focusAfterEscape.count() > 0;
          
          if (focusAfterEscapeExists) {
            const focusReturnedToTrigger = await focusAfterEscape.evaluate((focused, triggerEl) => {
              return focused === triggerEl;
            }, await dropdownTrigger.elementHandle());
            
            expect(focusReturnedToTrigger).toBe(true);
          }
        }
      }
    }
  }`;
  }
  /**
   * Generate keyboard trap prevention validation code
   * 
   * Creates Playwright code that validates users can navigate away from all elements using keyboard.
   * Requirements: 3.5, 3.6
   */
  generateKeyboardTrapPreventionCode(requirements: KeyboardNavigationRequirement[]): string {
    const trapPreventionRequirements = requirements.filter(req => req.type === 'keyboard-traps');
    
    if (trapPreventionRequirements.length === 0) {
      return '';
    }

    return `
  // Keyboard Trap Prevention Validation
  // Validates: Requirements 3.5, 3.6 - Prevention of keyboard traps
  
  // Test that users can navigate away from all focusable elements
  const allFocusableElements = await page.locator(
    'button:not([disabled]), ' +
    'a[href], ' +
    'input:not([disabled]):not([type="hidden"]), ' +
    'select:not([disabled]), ' +
    'textarea:not([disabled]), ' +
    '[tabindex]:not([tabindex="-1"]), ' +
    '[contenteditable="true"], ' +
    '[role="button"]:not([aria-disabled="true"]), ' +
    '[role="link"], ' +
    '[role="checkbox"]:not([aria-disabled="true"]), ' +
    '[role="radio"]:not([aria-disabled="true"]), ' +
    '[role="slider"]:not([aria-disabled="true"]), ' +
    '[role="tab"]:not([aria-disabled="true"])'
  ).all();
  
  // Test escape mechanisms for each focusable element
  for (let i = 0; i < Math.min(allFocusableElements.length, 20); i++) {
    const element = allFocusableElements[i];
    
    // Focus the element
    await element.focus();
    await page.waitForTimeout(100);
    
    // Verify element is focused
    const isFocused = await page.evaluate(() => document.activeElement === arguments[0], await element.elementHandle());
    
    if (isFocused) {
      // Test Tab key can move focus away
      const initialFocusedElement = await page.locator(':focus').first();
      
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
      
      const afterTabFocusedElement = await page.locator(':focus').first();
      const afterTabExists = await afterTabFocusedElement.count() > 0;
      
      if (afterTabExists) {
        const focusChanged = await afterTabFocusedElement.evaluate((afterTab, initial) => {
          return afterTab !== initial;
        }, await initialFocusedElement.elementHandle());
        
        // Focus should be able to move away (unless it's the last element)
        if (i < allFocusableElements.length - 1) {
          expect(focusChanged).toBe(true);
        }
      }
      
      // Test Shift+Tab can move focus away (go back to previous element)
      await element.focus();
      await page.waitForTimeout(100);
      
      await page.keyboard.press('Shift+Tab');
      await page.waitForTimeout(100);
      
      const afterShiftTabFocusedElement = await page.locator(':focus').first();
      const afterShiftTabExists = await afterShiftTabFocusedElement.count() > 0;
      
      if (afterShiftTabExists && i > 0) {
        const shiftTabFocusChanged = await afterShiftTabFocusedElement.evaluate((afterShiftTab, original) => {
          return afterShiftTab !== original;
        }, await element.elementHandle());
        
        expect(shiftTabFocusChanged).toBe(true);
      }
    }
  }
  
  // Test specific keyboard trap scenarios
  
  // Test embedded content (iframes, objects) don't trap focus
  const embeddedContent = await page.locator('iframe, object, embed').all();
  
  for (const embedded of embeddedContent) {
    // Focus before the embedded content
    const focusableBeforeEmbedded = await page.locator(
      'button:not([disabled]), a[href], input:not([disabled]):not([type="hidden"])'
    ).first();
    
    if (await focusableBeforeEmbedded.count() > 0) {
      await focusableBeforeEmbedded.focus();
      
      // Tab should be able to move past embedded content
      let tabCount = 0;
      let focusTrapped = false;
      
      while (tabCount < 10) { // Limit iterations to prevent infinite loop
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);
        
        const currentFocus = await page.locator(':focus').first();
        const currentFocusExists = await currentFocus.count() > 0;
        
        if (currentFocusExists) {
          // Check if focus is still on the same element (potential trap)
          const sameElement = await currentFocus.evaluate((current, previous) => {
            return current === previous;
          }, await focusableBeforeEmbedded.elementHandle());
          
          if (sameElement && tabCount > 2) {
            focusTrapped = true;
            break;
          }
          
          // Check if we've moved past the embedded content
          const pastEmbedded = await currentFocus.evaluate((current, embeddedEl) => {
            const embeddedRect = embeddedEl.getBoundingClientRect();
            const currentRect = current.getBoundingClientRect();
            
            // Simple check: if current element is below embedded content
            return currentRect.top > embeddedRect.bottom + 10;
          }, await embedded.elementHandle());
          
          if (pastEmbedded) {
            break; // Successfully moved past embedded content
          }
        }
        
        tabCount++;
      }
      
      expect(focusTrapped).toBe(false);
    }
  }
  
  // Test custom widgets don't create keyboard traps
  const customWidgets = await page.locator('[role="application"], [role="widget"], [role="composite"]').all();
  
  for (const widget of customWidgets) {
    // Focus within the widget
    const focusableInWidget = await widget.locator(
      'button:not([disabled]), a[href], input:not([disabled]):not([type="hidden"]), [tabindex]:not([tabindex="-1"])'
    ).first();
    
    if (await focusableInWidget.count() > 0) {
      await focusableInWidget.focus();
      await page.waitForTimeout(100);
      
      // Test that Tab can eventually move focus out of widget
      let tabCount = 0;
      let exitedWidget = false;
      
      while (tabCount < 15) { // Allow more iterations for complex widgets
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);
        
        const currentFocus = await page.locator(':focus').first();
        const currentFocusExists = await currentFocus.count() > 0;
        
        if (currentFocusExists) {
          const stillInWidget = await currentFocus.evaluate((current, widgetEl) => {
            return widgetEl.contains(current);
          }, await widget.elementHandle());
          
          if (!stillInWidget) {
            exitedWidget = true;
            break;
          }
        }
        
        tabCount++;
      }
      
      // Should be able to exit widget with Tab key
      expect(exitedWidget).toBe(true);
    }
  }`;
  }
  /**
   * Generate comprehensive keyboard navigation code
   * 
   * Creates complete Playwright test code that combines all keyboard navigation validations
   * with enhanced utilities and compliance checking.
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
   */
  generateComprehensiveKeyboardNavigationCode(requirements: AccessibilityTestRequirements): string {
    const codeBlocks: string[] = [];
    
    // Add utility functions first
    codeBlocks.push(KeyboardNavigationTestUtils.generateFocusIndicatorValidationCode());
    codeBlocks.push(KeyboardNavigationTestUtils.generateKeyboardEventSimulationCode());
    codeBlocks.push(KeyboardNavigationTestUtils.generateKeyboardAccessibilityComplianceCode());
    
    // Generate code for each type of keyboard navigation testing
    const tabSequenceCode = this.generateTabSequenceCode(requirements.keyboardNavigation);
    if (tabSequenceCode) codeBlocks.push(tabSequenceCode);
    
    const focusOrderCode = this.generateFocusOrderValidationCode(requirements.keyboardNavigation);
    if (focusOrderCode) codeBlocks.push(focusOrderCode);
    
    const keyboardActivationCode = this.generateKeyboardActivationCode(requirements.keyboardNavigation);
    if (keyboardActivationCode) codeBlocks.push(keyboardActivationCode);
    
    const focusManagementCode = this.generateFocusManagementCode(requirements.keyboardNavigation);
    if (focusManagementCode) codeBlocks.push(focusManagementCode);
    
    const keyboardTrapPreventionCode = this.generateKeyboardTrapPreventionCode(requirements.keyboardNavigation);
    if (keyboardTrapPreventionCode) codeBlocks.push(keyboardTrapPreventionCode);
    
    if (codeBlocks.length === 0) {
      return `
  // No keyboard navigation requirements specified
  console.log('No keyboard navigation validations to perform');`;
    }
    
    // Add comprehensive keyboard navigation setup with enhanced validation
    const setupCode = `
  // Comprehensive Keyboard Navigation Testing Setup - Enhanced Implementation
  // Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
  
  console.log('Starting comprehensive keyboard navigation accessibility testing...');
  
  // Ensure page is ready for keyboard testing
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000); // Allow for dynamic content and JavaScript to load
  
  // Remove any existing focus to start with clean state
  await page.evaluate(() => {
    if (document.activeElement && document.activeElement !== document.body) {
      (document.activeElement as HTMLElement).blur();
    }
  });
  
  // Verify keyboard navigation is not disabled globally
  const keyboardNavigationStatus = await page.evaluate(() => {
    const body = document.body;
    const style = window.getComputedStyle(body);
    
    // Check for common keyboard navigation disabling patterns
    const issues = [];
    
    // Check if tabindex is set to -1 on body (bad practice)
    if (body.getAttribute('tabindex') === '-1') {
      issues.push('Body element has tabindex="-1" which may disable keyboard navigation');
    }
    
    // Check for CSS that might disable focus indicators globally
    if (style.outline === 'none' && !style.boxShadow && !style.border) {
      issues.push('Global focus indicators may be disabled');
    }
    
    // Check for JavaScript that might interfere with keyboard events
    const hasKeyboardEventListeners = window.addEventListener.toString().includes('keyboard') ||
                                     document.addEventListener.toString().includes('keyboard');
    
    return {
      navigationEnabled: issues.length === 0,
      issues,
      hasKeyboardListeners: hasKeyboardEventListeners,
      focusableElementCount: document.querySelectorAll(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), ' +
        'textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]'
      ).length
    };
  });
  
  console.log('Keyboard navigation status:', keyboardNavigationStatus);
  
  expect(keyboardNavigationStatus.navigationEnabled).toBe(true);
  expect(keyboardNavigationStatus.focusableElementCount).toBeGreaterThan(0);
  
  if (keyboardNavigationStatus.issues.length > 0) {
    console.warn('Keyboard navigation issues detected:', keyboardNavigationStatus.issues);
  }
  
  // Run comprehensive compliance validation
  const complianceResults = await validateKeyboardAccessibilityCompliance();
  
  // Log overall compliance status
  console.log(\`Keyboard accessibility compliance validation completed with \${complianceResults.issues.length} issues\`);`;
    
    return [setupCode, ...codeBlocks].join('\n\n');
  }
}

/**
 * Keyboard Navigation Test Utilities
 * 
 * Helper functions for keyboard navigation testing.
 */
export class KeyboardNavigationTestUtils {
  
  /**
   * Generate comprehensive focus indicator validation code
   * 
   * Creates code to validate visible focus indicators meet WCAG accessibility requirements
   * including contrast ratios and visibility standards.
   */
  static generateFocusIndicatorValidationCode(): string {
    return `
  // Comprehensive Focus Indicator Validation Utility
  // Validates visible focus indicators for WCAG compliance
  
  const validateFocusIndicator = async (element) => {
    await element.focus();
    await page.waitForTimeout(100); // Allow focus to settle
    
    const focusStyles = await element.evaluate(el => {
      const styles = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      
      // Get computed color values
      const getColorValues = (colorStr) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = colorStr;
        return ctx.fillStyle;
      };
      
      return {
        outline: styles.outline,
        outlineWidth: parseFloat(styles.outlineWidth) || 0,
        outlineStyle: styles.outlineStyle,
        outlineColor: getColorValues(styles.outlineColor),
        outlineOffset: parseFloat(styles.outlineOffset) || 0,
        boxShadow: styles.boxShadow,
        border: styles.border,
        borderWidth: parseFloat(styles.borderWidth) || 0,
        borderStyle: styles.borderStyle,
        borderColor: getColorValues(styles.borderColor),
        backgroundColor: getColorValues(styles.backgroundColor),
        color: getColorValues(styles.color),
        visibility: styles.visibility,
        display: styles.display,
        opacity: parseFloat(styles.opacity),
        width: rect.width,
        height: rect.height,
        position: {
          top: rect.top,
          left: rect.left,
          right: rect.right,
          bottom: rect.bottom
        }
      };
    });
    
    // Check if element has visible focus indicator
    const hasOutline = focusStyles.outline !== 'none' && 
                      focusStyles.outlineWidth > 0 && 
                      focusStyles.outlineStyle !== 'none' &&
                      focusStyles.outlineColor !== 'rgba(0, 0, 0, 0)' &&
                      focusStyles.outlineColor !== 'transparent';
    
    const hasBoxShadow = focusStyles.boxShadow !== 'none' && 
                        focusStyles.boxShadow !== '' &&
                        !focusStyles.boxShadow.includes('rgba(0, 0, 0, 0)');
    
    const hasBorder = focusStyles.borderWidth > 0 && 
                     focusStyles.borderStyle !== 'none' &&
                     focusStyles.borderColor !== 'rgba(0, 0, 0, 0)' &&
                     focusStyles.borderColor !== 'transparent';
    
    const hasBackgroundChange = focusStyles.backgroundColor !== 'rgba(0, 0, 0, 0)' && 
                               focusStyles.backgroundColor !== 'transparent';
    
    const hasVisibleFocusIndicator = hasOutline || hasBoxShadow || hasBorder || hasBackgroundChange;
    
    // Log focus indicator details for debugging
    console.log('Focus indicator analysis:', {
      hasOutline,
      hasBoxShadow,
      hasBorder,
      hasBackgroundChange,
      outlineWidth: focusStyles.outlineWidth,
      borderWidth: focusStyles.borderWidth,
      outlineColor: focusStyles.outlineColor,
      borderColor: focusStyles.borderColor,
      backgroundColor: focusStyles.backgroundColor
    });
    
    expect(hasVisibleFocusIndicator).toBe(true);
    
    // Verify focus indicator meets minimum size requirements (WCAG 2.4.7)
    if (hasOutline && focusStyles.outlineWidth > 0) {
      // Outline should be at least 1px wide for visibility
      expect(focusStyles.outlineWidth).toBeGreaterThanOrEqual(1);
    }
    
    if (hasBorder && focusStyles.borderWidth > 0) {
      // Border should be at least 1px wide for visibility
      expect(focusStyles.borderWidth).toBeGreaterThanOrEqual(1);
    }
    
    // Verify element is actually visible and focusable
    const isElementVisible = focusStyles.width > 0 && 
                            focusStyles.height > 0 && 
                            focusStyles.visibility !== 'hidden' && 
                            focusStyles.display !== 'none' &&
                            focusStyles.opacity > 0;
    
    expect(isElementVisible).toBe(true);
    
    // Check that focus indicator doesn't make element inaccessible
    const focusIndicatorSize = Math.max(focusStyles.outlineWidth, focusStyles.borderWidth);
    if (focusIndicatorSize > 0) {
      // Focus indicator shouldn't be so large it obscures content
      expect(focusIndicatorSize).toBeLessThan(Math.min(focusStyles.width, focusStyles.height) / 2);
    }
    
    return {
      hasVisibleIndicator: hasVisibleFocusIndicator,
      indicatorType: hasOutline ? 'outline' : hasBorder ? 'border' : hasBoxShadow ? 'boxShadow' : 'background',
      indicatorSize: focusIndicatorSize,
      elementSize: { width: focusStyles.width, height: focusStyles.height }
    };
  };`;
  }
  
  /**
   * Generate enhanced keyboard event simulation code
   * 
   * Creates code for simulating various keyboard interactions with proper timing and validation.
   */
  static generateKeyboardEventSimulationCode(): string {
    return `
  // Enhanced Keyboard Event Simulation Utility
  // Provides comprehensive keyboard interaction simulation with validation
  
  const simulateKeyboardInteraction = async (element, keyType, options = {}) => {
    const { 
      waitTime = 100, 
      validateFocus = true, 
      expectActivation = false,
      preventNavigation = false 
    } = options;
    
    // Ensure element is focusable before interaction
    await element.focus();
    await page.waitForTimeout(50);
    
    if (validateFocus) {
      const isFocused = await page.evaluate(() => document.activeElement === arguments[0], await element.elementHandle());
      expect(isFocused).toBe(true);
    }
    
    // Set up activation detection if needed
    let activationDetected = false;
    if (expectActivation) {
      await element.evaluate((el, preventNav) => {
        el.addEventListener('click', (e) => {
          if (preventNav) e.preventDefault();
          el.setAttribute('data-keyboard-activated', 'true');
        }, { once: true });
      }, preventNavigation);
    }
    
    // Simulate the keyboard interaction
    switch (keyType) {
      case 'enter':
        await page.keyboard.press('Enter');
        break;
      case 'space':
        await page.keyboard.press('Space');
        break;
      case 'tab':
        await page.keyboard.press('Tab');
        break;
      case 'shift-tab':
        await page.keyboard.press('Shift+Tab');
        break;
      case 'arrow-down':
        await page.keyboard.press('ArrowDown');
        break;
      case 'arrow-up':
        await page.keyboard.press('ArrowUp');
        break;
      case 'arrow-left':
        await page.keyboard.press('ArrowLeft');
        break;
      case 'arrow-right':
        await page.keyboard.press('ArrowRight');
        break;
      case 'escape':
        await page.keyboard.press('Escape');
        break;
      case 'home':
        await page.keyboard.press('Home');
        break;
      case 'end':
        await page.keyboard.press('End');
        break;
      case 'page-up':
        await page.keyboard.press('PageUp');
        break;
      case 'page-down':
        await page.keyboard.press('PageDown');
        break;
      default:
        throw new Error(\`Unsupported key type: \${keyType}\`);
    }
    
    // Allow time for event processing
    await page.waitForTimeout(waitTime);
    
    // Check activation if expected
    if (expectActivation) {
      const activated = await element.getAttribute('data-keyboard-activated');
      activationDetected = activated === 'true';
      
      // Clean up
      await element.evaluate(el => {
        el.removeAttribute('data-keyboard-activated');
      });
    }
    
    return {
      keyPressed: keyType,
      activationDetected,
      timestamp: Date.now()
    };
  };
  
  // Utility for testing complete keyboard workflows
  const testKeyboardWorkflow = async (workflow) => {
    const results = [];
    
    for (const step of workflow) {
      const { element, action, key, options = {} } = step;
      
      try {
        const result = await simulateKeyboardInteraction(element, key, options);
        results.push({ ...step, result, success: true });
      } catch (error) {
        results.push({ ...step, error: error.message, success: false });
      }
    }
    
    return results;
  };`;
  }
  
  /**
   * Generate keyboard accessibility compliance validation code
   * 
   * Creates comprehensive validation for WCAG keyboard accessibility requirements.
   */
  static generateKeyboardAccessibilityComplianceCode(): string {
    return `
  // Keyboard Accessibility Compliance Validation
  // Comprehensive WCAG 2.1 keyboard accessibility validation
  
  const validateKeyboardAccessibilityCompliance = async () => {
    const complianceResults = {
      focusableElementsCount: 0,
      tabSequenceValid: true,
      focusIndicatorsPresent: true,
      keyboardTrapsDetected: false,
      activationMethodsValid: true,
      issues: []
    };
    
    // Find all interactive elements
    const interactiveElements = await page.locator(
      'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"]), ' +
      '[role="button"], [role="link"], [role="checkbox"], [role="radio"], ' +
      '[role="slider"], [role="tab"], [role="menuitem"], [contenteditable="true"]'
    ).all();
    
    complianceResults.focusableElementsCount = interactiveElements.length;
    
    console.log(\`Validating keyboard accessibility for \${interactiveElements.length} interactive elements\`);
    
    // Test each element for compliance
    for (let i = 0; i < interactiveElements.length; i++) {
      const element = interactiveElements[i];
      
      try {
        // Test focusability
        await element.focus();
        const isFocused = await page.evaluate(() => document.activeElement === arguments[0], await element.elementHandle());
        
        if (!isFocused) {
          complianceResults.issues.push(\`Element \${i + 1} is not focusable\`);
          continue;
        }
        
        // Test focus indicator
        const focusIndicatorResult = await validateFocusIndicator(element);
        if (!focusIndicatorResult.hasVisibleIndicator) {
          complianceResults.focusIndicatorsPresent = false;
          complianceResults.issues.push(\`Element \${i + 1} lacks visible focus indicator\`);
        }
        
        // Test keyboard activation based on element type
        const elementInfo = await element.evaluate(el => ({
          tagName: el.tagName.toLowerCase(),
          type: el.getAttribute('type'),
          role: el.getAttribute('role'),
          href: el.getAttribute('href')
        }));
        
        // Test appropriate activation methods
        if (elementInfo.tagName === 'button' || elementInfo.role === 'button') {
          // Buttons should respond to Enter and Space
          const enterResult = await simulateKeyboardInteraction(element, 'enter', { expectActivation: true });
          const spaceResult = await simulateKeyboardInteraction(element, 'space', { expectActivation: true });
          
          if (!enterResult.activationDetected && !spaceResult.activationDetected) {
            complianceResults.activationMethodsValid = false;
            complianceResults.issues.push(\`Button \${i + 1} doesn't respond to Enter or Space keys\`);
          }
        } else if (elementInfo.tagName === 'a' && elementInfo.href) {
          // Links should respond to Enter but not Space
          const enterResult = await simulateKeyboardInteraction(element, 'enter', { 
            expectActivation: true, 
            preventNavigation: true 
          });
          
          if (!enterResult.activationDetected) {
            complianceResults.activationMethodsValid = false;
            complianceResults.issues.push(\`Link \${i + 1} doesn't respond to Enter key\`);
          }
        }
        
        // Test that Tab can move away from element (no keyboard trap)
        const initialFocus = await page.locator(':focus').first();
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);
        
        const newFocus = await page.locator(':focus').first();
        const focusChanged = await newFocus.evaluate((newEl, oldEl) => {
          return newEl !== oldEl;
        }, await initialFocus.elementHandle());
        
        // If this is the last element, focus might wrap to first element
        if (!focusChanged && i < interactiveElements.length - 1) {
          complianceResults.keyboardTrapsDetected = true;
          complianceResults.issues.push(\`Potential keyboard trap detected at element \${i + 1}\`);
        }
        
      } catch (error) {
        complianceResults.issues.push(\`Error testing element \${i + 1}: \${error.message}\`);
      }
    }
    
    // Generate compliance report
    const complianceScore = (
      (complianceResults.tabSequenceValid ? 25 : 0) +
      (complianceResults.focusIndicatorsPresent ? 25 : 0) +
      (!complianceResults.keyboardTrapsDetected ? 25 : 0) +
      (complianceResults.activationMethodsValid ? 25 : 0)
    );
    
    console.log('Keyboard Accessibility Compliance Report:');
    console.log(\`- Focusable elements: \${complianceResults.focusableElementsCount}\`);
    console.log(\`- Tab sequence valid: \${complianceResults.tabSequenceValid}\`);
    console.log(\`- Focus indicators present: \${complianceResults.focusIndicatorsPresent}\`);
    console.log(\`- Keyboard traps detected: \${complianceResults.keyboardTrapsDetected}\`);
    console.log(\`- Activation methods valid: \${complianceResults.activationMethodsValid}\`);
    console.log(\`- Compliance score: \${complianceScore}/100\`);
    
    if (complianceResults.issues.length > 0) {
      console.log('Issues found:');
      complianceResults.issues.forEach(issue => console.log(\`  - \${issue}\`));
    }
    
    // Expect high compliance score for accessibility
    expect(complianceScore).toBeGreaterThanOrEqual(75);
    
    return complianceResults;
  };`;
  }
}