/**
 * Tests for Accessibility Error Handler
 * 
 * Validates comprehensive error handling for accessibility test enhancement
 */

import {
  AccessibilityErrorHandler,
  AccessibilityError,
  AccessibilityErrorType,
  AccessibilityErrorUtils
} from '../accessibilityErrorHandler';

describe('AccessibilityErrorHandler', () => {
  let errorHandler: AccessibilityErrorHandler;

  beforeEach(() => {
    errorHandler = AccessibilityErrorHandler.getInstance();
    errorHandler.clearErrorLog();
  });

  describe('Error Creation and Handling', () => {
    it('should create accessibility error with proper user message', () => {
      const error = new AccessibilityError(
        AccessibilityErrorType.INVALID_INSTRUCTIONS,
        'Test error message',
        { testContext: 'test' }
      );

      expect(error.type).toBe(AccessibilityErrorType.INVALID_INSTRUCTIONS);
      expect(error.message).toBe('Test error message');
      expect(error.context.testContext).toBe('test');
      expect(error.userMessage).toContain('accessibility instructions could not be understood');
    });

    it('should handle invalid instructions error with recovery', () => {
      const error = new AccessibilityError(
        AccessibilityErrorType.INVALID_INSTRUCTIONS,
        'Invalid instructions provided'
      );

      const result = errorHandler.handleError(error);
      
      expect(result).toBeDefined();
      expect(result.domInspection).toBeDefined();
      expect(result.keyboardNavigation).toBeDefined();
      expect(result.ariaCompliance).toBeDefined();
    });

    it('should handle missing dependencies error', () => {
      const error = new AccessibilityError(
        AccessibilityErrorType.MISSING_DEPENDENCIES,
        'Axe-Core not installed'
      );

      const result = errorHandler.handleError(error);
      
      expect(result).toContain('Manual Accessibility Testing Instructions');
      expect(result).toContain('Dependencies are missing');
    });

    it('should handle code generation error with fallback', () => {
      const error = new AccessibilityError(
        AccessibilityErrorType.CODE_GENERATION_ERROR,
        'Failed to generate code'
      );

      const result = errorHandler.handleError(error);
      
      expect(result).toContain('Basic Accessibility Test');
      expect(result).toContain('playwright/test');
    });
  });

  describe('Validation Methods', () => {
    it('should validate accessibility setup correctly', () => {
      const validResult = errorHandler.validateAccessibilitySetup(
        'test keyboard navigation and screen reader compatibility',
        { url: 'https://example.com' }
      );

      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toHaveLength(0);
    });

    it('should detect invalid instructions', () => {
      const invalidResult = errorHandler.validateAccessibilitySetup(
        '',
        { url: 'https://example.com' }
      );

      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toHaveLength(1);
      expect(invalidResult.errors[0].type).toBe(AccessibilityErrorType.INVALID_INSTRUCTIONS);
    });

    it('should detect missing accessibility keywords', () => {
      const result = errorHandler.validateAccessibilitySetup(
        'just test the website',
        { url: 'https://example.com' }
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.type === AccessibilityErrorType.INVALID_INSTRUCTIONS)).toBe(true);
    });

    it('should validate WCAG criteria correctly', () => {
      const validResult = errorHandler.validateWCAGCriteria(['1.1.1', '2.1.1', '4.1.2']);
      expect(validResult.isValid).toBe(true);

      const invalidResult = errorHandler.validateWCAGCriteria(['1.1.1', '9.9.9']);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors[0].type).toBe(AccessibilityErrorType.WCAG_VALIDATION_ERROR);
    });

    it('should validate Axe-Core configuration', () => {
      const validConfig = {
        rulesets: ['wcag2a', 'wcag2aa'],
        tags: ['wcag2a']
      };
      
      const validResult = errorHandler.validateAxeCoreConfig(validConfig);
      expect(validResult.isValid).toBe(true);

      const invalidConfig = {
        rulesets: ['invalid-ruleset']
      };
      
      const invalidResult = errorHandler.validateAxeCoreConfig(invalidConfig);
      expect(invalidResult.isValid).toBe(false);
    });
  });

  describe('Error Statistics', () => {
    it('should track error statistics correctly', () => {
      const error1 = new AccessibilityError(AccessibilityErrorType.INVALID_INSTRUCTIONS, 'Error 1');
      const error2 = new AccessibilityError(AccessibilityErrorType.MISSING_DEPENDENCIES, 'Error 2');
      const error3 = new AccessibilityError(AccessibilityErrorType.INVALID_INSTRUCTIONS, 'Error 3');

      errorHandler.handleError(error1);
      errorHandler.handleError(error2);
      errorHandler.handleError(error3);

      const stats = errorHandler.getErrorStatistics();
      
      expect(stats.totalErrors).toBe(3);
      expect(stats.errorsByType[AccessibilityErrorType.INVALID_INSTRUCTIONS]).toBe(2);
      expect(stats.errorsByType[AccessibilityErrorType.MISSING_DEPENDENCIES]).toBe(1);
      expect(stats.recentErrors).toHaveLength(3);
    });
  });

  describe('Error Utils', () => {
    it('should wrap function with error handling', () => {
      const throwingFunction = () => {
        throw new Error('Test error');
      };

      const wrappedFunction = AccessibilityErrorUtils.withErrorHandling(
        throwingFunction,
        AccessibilityErrorType.CODE_GENERATION_ERROR
      );

      const result = wrappedFunction();
      expect(result).toContain('Basic Accessibility Test');
    });

    it('should handle async operations with error handling', async () => {
      const throwingAsyncFunction = async () => {
        throw new Error('Async test error');
      };

      const result = await AccessibilityErrorUtils.withAsyncErrorHandling(
        throwingAsyncFunction,
        AccessibilityErrorType.PARSING_ERROR
      );

      expect(result).toBeDefined();
      // Result should be the fallback from error handling
      if (result && typeof result === 'object' && 'domInspection' in result) {
        expect(result.domInspection).toBeDefined();
      }
    });

    it('should create error with context', () => {
      const error = AccessibilityErrorUtils.createError(
        AccessibilityErrorType.TEMPLATE_ERROR,
        'Template not found',
        { templateName: 'test-template' },
        'Use default template instead'
      );

      expect(error.type).toBe(AccessibilityErrorType.TEMPLATE_ERROR);
      expect(error.context.templateName).toBe('test-template');
      expect(error.fallbackSuggestion).toBe('Use default template instead');
    });
  });

  describe('Recovery Strategies', () => {
    it('should provide appropriate fallbacks for each error type', () => {
      const errorTypes = [
        AccessibilityErrorType.INVALID_INSTRUCTIONS,
        AccessibilityErrorType.MISSING_DEPENDENCIES,
        AccessibilityErrorType.UNSUPPORTED_FEATURE,
        AccessibilityErrorType.PARSING_ERROR,
        AccessibilityErrorType.CODE_GENERATION_ERROR,
        AccessibilityErrorType.TEMPLATE_ERROR,
        AccessibilityErrorType.AXE_CORE_ERROR,
        AccessibilityErrorType.WCAG_VALIDATION_ERROR
      ];

      errorTypes.forEach(errorType => {
        const error = new AccessibilityError(errorType, `Test ${errorType}`);
        const result = errorHandler.handleError(error);
        
        expect(result).toBeDefined();
        // Each error type should have a meaningful fallback
      });
    });
  });
});