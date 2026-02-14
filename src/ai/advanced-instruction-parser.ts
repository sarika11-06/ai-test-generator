/**
 * Advanced Instruction Parser - Enhanced for Universal URL Support
 * Handles all types of URLs and complex testing instructions
 */

export interface ParsedInstruction {
  actions: InstructionAction[];
  url: string;
  isLoginTest: boolean;
  isFormTest: boolean;
  isNavigationTest: boolean;
  isInteractionTest: boolean;
  hasSpecificCredentials: boolean;
  credentials?: Record<string, string>;
  formData?: Record<string, any>;
  testContext?: TestContext;
}

export interface InstructionAction {
  type: 'navigate' | 'enter' | 'click' | 'select' | 'check' | 'verify' | 'wait' | 'hover' | 'scroll' | 'upload' | 'download';
  target: string;
  value?: string;
  field?: string;
  stepNumber: number;
  selector?: string;
  timeout?: number;
  optional?: boolean;
  metadata?: Record<string, any>;
}

export interface TestContext {
  pageType: 'login' | 'form' | 'dashboard' | 'ecommerce' | 'search' | 'generic';
  complexity: 'simple' | 'medium' | 'complex';
  detectedElements: string[];
  expectedOutcome: string;
  validationPoints: string[];
}

export class AdvancedInstructionParser {
  
  // Enhanced regex patterns for better instruction matching
  private readonly patterns = {
    // Field entry patterns - supports multiple formats and quote styles
    enter: /(?:enter|fill|type|input|set)\s+(?:the\s+)?(?:value\s+)?(?:of\s+)?(\w+(?:\s+\w+)?)\s+(?:as|to|with|field)?\s*[""''""]([^""''"]+)[""''"]/gi,
    enterReverse: /(?:enter|fill|type|input|set)\s+[""''""]([^""''"]+)[""''"]\s+(?:in|into|to|for)\s+(?:the\s+)?(\w+(?:\s+\w+)?)/gi,
    
    // Click patterns - comprehensive button/link detection
    click: /(?:click|press|tap|select)\s+(?:on\s+)?(?:the\s+)?(.+?)(?:\s+button|\s+link|\s+element)?$/i,
    
    // Select/dropdown patterns
    select: /(?:select|choose|pick)\s+[""''""]([^""''"]+)[""''"]\s+(?:from|in)\s+(?:the\s+)?(\w+(?:\s+\w+)?)/gi,
    selectReverse: /(?:select|choose|pick)\s+(?:the\s+)?(\w+(?:\s+\w+)?)\s+(?:as|to)\s+[""''""]([^""''"]+)[""''"]/gi,
    
    // Checkbox/radio patterns
    check: /(?:check|tick|mark|enable)\s+(?:the\s+)?(.+?)(?:\s+checkbox|\s+option)?$/i,
    uncheck: /(?:uncheck|untick|unmark|disable)\s+(?:the\s+)?(.+?)(?:\s+checkbox|\s+option)?$/i,
    
    // Verification patterns
    verify: /(?:verify|check|assert|ensure|confirm)\s+(?:that\s+)?(.+?)(?:\s+is\s+visible|\s+exists|\s+is\s+present|\s+appears)?$/i,
    
    // Wait patterns
    wait: /(?:wait|pause)\s+(?:for\s+)?(?:(\d+)\s+(?:seconds?|ms|milliseconds?)|(.+?)(?:\s+to\s+(?:appear|load|be\s+visible))?)$/i,
    
    // Navigation patterns
    navigate: /(?:navigate|go|open|visit)\s+(?:to\s+)?(.+)$/i,
    
    // Hover patterns
    hover: /(?:hover|mouse\s+over)\s+(?:on\s+)?(?:the\s+)?(.+)$/i,
    
    // Scroll patterns
    scroll: /(?:scroll)\s+(?:to\s+)?(.+)$/i,
    
    // Upload patterns
    upload: /(?:upload|attach)\s+(?:file\s+)?[""''""]([^""''"]+)[""''"]\s+(?:to|in)\s+(?:the\s+)?(\w+(?:\s+\w+)?)/gi,
    
    // URL extraction
    url: /(https?:\/\/[^\s]+)/i
  };

  /**
   * Parse multi-line testing instructions with advanced pattern recognition
   */
  parseTestingInstructions(instructions: string, baseUrl?: string): ParsedInstruction {
    console.log('🔍 [Advanced Parser] Parsing testing instructions:', instructions);
    
    const lines = this.normalizeInstructions(instructions);
    const actions: InstructionAction[] = [];
    let stepNumber = 1;
    
    const result: ParsedInstruction = {
      actions: [],
      url: baseUrl || this.extractUrl(instructions) || '',
      isLoginTest: false,
      isFormTest: false,
      isNavigationTest: false,
      isInteractionTest: false,
      hasSpecificCredentials: false,
      credentials: {},
      formData: {},
      testContext: this.analyzeTestContext(instructions)
    };

    // Analyze instruction intent
    const instructionText = instructions.toLowerCase();
    result.isLoginTest = this.isLoginInstruction(instructionText);
    result.isFormTest = this.isFormInstruction(instructionText);
    result.isNavigationTest = this.isNavigationInstruction(instructionText);
    result.isInteractionTest = this.isInteractionInstruction(instructionText);

    // Parse each line for actions
    for (const line of lines) {
      const parsedActions = this.parseInstructionLine(line, stepNumber);
      
      if (parsedActions && parsedActions.length > 0) {
        parsedActions.forEach(action => {
          actions.push(action);
          
          // Extract credentials and form data
          if (action.type === 'enter' && action.field && action.value) {
            const fieldLower = action.field.toLowerCase();
            
            // Detect credential fields
            if (this.isCredentialField(fieldLower)) {
              result.hasSpecificCredentials = true;
              result.credentials![action.field] = action.value;
            }
            
            // Store all form data
            result.formData![action.field] = action.value;
          }
          
          stepNumber++;
        });
      }
    }

    result.actions = actions;
    
    console.log('📋 [Advanced Parser] Parsed instructions:', {
      actionsCount: actions.length,
      isLoginTest: result.isLoginTest,
      isFormTest: result.isFormTest,
      hasCredentials: result.hasSpecificCredentials,
      credentials: result.credentials,
      formData: result.formData,
      testContext: result.testContext
    });

    return result;
  }

  /**
   * Parse a single instruction line with multiple pattern attempts
   */
  private parseInstructionLine(line: string, stepNumber: number): InstructionAction[] | null {
    const lowerLine = line.toLowerCase().trim();
    const actions: InstructionAction[] = [];
    
    // Skip empty lines and comments
    if (!lowerLine || lowerLine.startsWith('#') || lowerLine.startsWith('//')) {
      return null;
    }

    // 1. Navigate action
    if (lowerLine.includes('navigate') || lowerLine.includes('go to') || lowerLine.includes('open') || lowerLine.includes('visit')) {
      const match = line.match(this.patterns.navigate);
      if (match) {
        const url = this.extractUrl(match[1]) || match[1].trim();
        actions.push({
          type: 'navigate',
          target: url,
          stepNumber
        });
      }
    }

    // 2. Enter/Fill actions - try multiple patterns
    const enterMatches = this.extractEnterActions(line);
    if (enterMatches.length > 0) {
      enterMatches.forEach(match => {
        actions.push({
          type: 'enter',
          target: match.field,
          field: match.field,
          value: match.value,
          stepNumber,
          selector: this.generateSelector(match.field)
        });
      });
    }

    // 3. Select/Dropdown actions
    const selectMatches = this.extractSelectActions(line);
    if (selectMatches.length > 0) {
      selectMatches.forEach(match => {
        actions.push({
          type: 'select',
          target: match.field,
          field: match.field,
          value: match.value,
          stepNumber,
          selector: this.generateSelector(match.field, 'select')
        });
      });
    }

    // 4. Click actions
    if (lowerLine.includes('click') || lowerLine.includes('press') || lowerLine.includes('tap')) {
      const match = line.match(this.patterns.click);
      if (match) {
        const target = match[1].trim();
        actions.push({
          type: 'click',
          target: target,
          stepNumber,
          selector: this.generateClickSelector(target)
        });
      }
    }

    // 5. Checkbox actions
    if (lowerLine.includes('check') && !lowerLine.includes('verify')) {
      const match = line.match(this.patterns.check);
      if (match) {
        actions.push({
          type: 'check',
          target: match[1].trim(),
          stepNumber,
          selector: this.generateCheckboxSelector(match[1].trim())
        });
      }
    }

    // 6. Verify actions
    if (lowerLine.includes('verify') || lowerLine.includes('assert') || lowerLine.includes('ensure')) {
      const match = line.match(this.patterns.verify);
      if (match) {
        actions.push({
          type: 'verify',
          target: match[1].trim(),
          stepNumber
        });
      }
    }

    // 7. Wait actions
    if (lowerLine.includes('wait') || lowerLine.includes('pause')) {
      const match = line.match(this.patterns.wait);
      if (match) {
        const timeout = match[1] ? parseInt(match[1]) * 1000 : 5000;
        actions.push({
          type: 'wait',
          target: match[2] || 'page load',
          stepNumber,
          timeout
        });
      }
    }

    // 8. Hover actions
    if (lowerLine.includes('hover') || lowerLine.includes('mouse over')) {
      const match = line.match(this.patterns.hover);
      if (match) {
        actions.push({
          type: 'hover',
          target: match[1].trim(),
          stepNumber
        });
      }
    }

    // 9. Scroll actions
    if (lowerLine.includes('scroll')) {
      const match = line.match(this.patterns.scroll);
      if (match) {
        actions.push({
          type: 'scroll',
          target: match[1].trim(),
          stepNumber
        });
      }
    }

    // 10. Upload actions
    const uploadMatches = this.extractUploadActions(line);
    if (uploadMatches.length > 0) {
      uploadMatches.forEach(match => {
        actions.push({
          type: 'upload',
          target: match.field,
          field: match.field,
          value: match.value,
          stepNumber
        });
      });
    }

    return actions.length > 0 ? actions : null;
  }

  /**
   * Extract enter/fill actions with comprehensive pattern matching
   */
  private extractEnterActions(line: string): Array<{ field: string; value: string }> {
    const results: Array<{ field: string; value: string }> = [];
    
    // Pattern 1: enter field "value"
    let match;
    const pattern1 = /(?:enter|fill|type|input|set)\s+(?:the\s+)?(?:value\s+)?(?:of\s+)?(\w+(?:\s+\w+)?)\s+(?:as|to|with|field)?\s*[""''""]([^""''"]+)[""''"]/gi;
    while ((match = pattern1.exec(line)) !== null) {
      results.push({
        field: this.normalizeFieldName(match[1]),
        value: match[2]
      });
    }
    
    // Pattern 2: enter "value" in field
    const pattern2 = /(?:enter|fill|type|input|set)\s+[""''""]([^""''"]+)[""''"]\s+(?:in|into|to|for)\s+(?:the\s+)?(\w+(?:\s+\w+)?)/gi;
    while ((match = pattern2.exec(line)) !== null) {
      results.push({
        field: this.normalizeFieldName(match[2]),
        value: match[1]
      });
    }
    
    // Pattern 3: field "value" (shorthand)
    if (results.length === 0) {
      const pattern3 = /(\w+)\s+[""''""]([^""''"]+)[""''"]/gi;
      while ((match = pattern3.exec(line)) !== null) {
        const field = match[1].toLowerCase();
        if (this.isKnownFieldType(field)) {
          results.push({
            field: this.normalizeFieldName(match[1]),
            value: match[2]
          });
        }
      }
    }
    
    return results;
  }

  /**
   * Extract select/dropdown actions
   */
  private extractSelectActions(line: string): Array<{ field: string; value: string }> {
    const results: Array<{ field: string; value: string }> = [];
    
    // Pattern 1: select "value" from field
    let match;
    const pattern1 = /(?:select|choose|pick)\s+[""''""]([^""''"]+)[""''"]\s+(?:from|in)\s+(?:the\s+)?(\w+(?:\s+\w+)?)/gi;
    while ((match = pattern1.exec(line)) !== null) {
      results.push({
        field: this.normalizeFieldName(match[2]),
        value: match[1]
      });
    }
    
    // Pattern 2: select field as "value"
    const pattern2 = /(?:select|choose|pick)\s+(?:the\s+)?(\w+(?:\s+\w+)?)\s+(?:as|to)\s+[""''""]([^""''"]+)[""''"]/gi;
    while ((match = pattern2.exec(line)) !== null) {
      results.push({
        field: this.normalizeFieldName(match[1]),
        value: match[2]
      });
    }
    
    return results;
  }

  /**
   * Extract upload actions
   */
  private extractUploadActions(line: string): Array<{ field: string; value: string }> {
    const results: Array<{ field: string; value: string }> = [];
    
    let match;
    const pattern = /(?:upload|attach)\s+(?:file\s+)?[""''""]([^""''"]+)[""''"]\s+(?:to|in)\s+(?:the\s+)?(\w+(?:\s+\w+)?)/gi;
    while ((match = pattern.exec(line)) !== null) {
      results.push({
        field: this.normalizeFieldName(match[2]),
        value: match[1]
      });
    }
    
    return results;
  }

  /**
   * Normalize field names to standard format
   */
  private normalizeFieldName(field: string): string {
    return field.toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '');
  }

  /**
   * Check if field is a known field type
   */
  private isKnownFieldType(field: string): boolean {
    const knownFields = [
      'username', 'user', 'password', 'pass', 'email', 'phone', 'telephone',
      'name', 'firstname', 'lastname', 'address', 'city', 'state', 'zip',
      'zipcode', 'country', 'message', 'comment', 'description', 'title',
      'subject', 'company', 'organization', 'website', 'url'
    ];
    return knownFields.includes(field);
  }

  /**
   * Check if field is a credential field
   */
  private isCredentialField(field: string): boolean {
    return field.includes('username') || field.includes('user') || 
           field.includes('password') || field.includes('pass') ||
           field.includes('email') || field.includes('login');
  }

  /**
   * Generate universal selector for a field
   */
  private generateSelector(field: string, elementType: string = 'input'): string {
    const normalizedField = this.normalizeFieldName(field);
    
    if (elementType === 'select') {
      return `#${normalizedField}, [name="${normalizedField}"], select[data-test="${normalizedField}"], select[aria-label*="${field}" i]`;
    }
    
    // Generate comprehensive selector list
    const selectors = [
      `#${normalizedField}`,
      `[name="${normalizedField}"]`,
      `[data-test="${normalizedField}"]`,
      `[data-testid="${normalizedField}"]`,
      `[aria-label*="${field}" i]`,
      `[placeholder*="${field}" i]`,
      `input[id*="${normalizedField}" i]`,
      `input[name*="${normalizedField}" i]`
    ];
    
    return selectors.join(', ');
  }

  /**
   * Generate selector for click targets
   */
  private generateClickSelector(target: string): string {
    const targetLower = target.toLowerCase();
    const normalizedTarget = this.normalizeFieldName(target);
    
    const selectors = [
      `#${normalizedTarget}`,
      `[data-test="${normalizedTarget}"]`,
      `[data-testid="${normalizedTarget}"]`,
      `button:has-text("${target}")`,
      `a:has-text("${target}")`,
      `[aria-label*="${target}" i]`,
      `button[id*="${normalizedTarget}" i]`,
      `input[type="submit"][value*="${target}" i]`
    ];
    
    return selectors.join(', ');
  }

  /**
   * Generate selector for checkboxes
   */
  private generateCheckboxSelector(target: string): string {
    const normalizedTarget = this.normalizeFieldName(target);
    
    return `input[type="checkbox"]#${normalizedTarget}, input[type="checkbox"][name="${normalizedTarget}"], input[type="checkbox"][data-test="${normalizedTarget}"]`;
  }

  /**
   * Normalize instructions (handle different line endings, trim, etc.)
   */
  private normalizeInstructions(instructions: string): string[] {
    return instructions
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('#') && !line.startsWith('//'));
  }

  /**
   * Extract URL from text
   */
  private extractUrl(text: string): string | null {
    const match = text.match(this.patterns.url);
    return match ? match[1] : null;
  }

  /**
   * Analyze test context from instructions
   */
  private analyzeTestContext(instructions: string): TestContext {
    const lowerInstructions = instructions.toLowerCase();
    
    // Determine page type
    let pageType: TestContext['pageType'] = 'generic';
    if (lowerInstructions.includes('login') || lowerInstructions.includes('sign in')) {
      pageType = 'login';
    } else if (lowerInstructions.includes('search')) {
      pageType = 'search';
    } else if (lowerInstructions.includes('cart') || lowerInstructions.includes('checkout') || lowerInstructions.includes('product')) {
      pageType = 'ecommerce';
    } else if (lowerInstructions.includes('dashboard') || lowerInstructions.includes('profile')) {
      pageType = 'dashboard';
    } else if (lowerInstructions.includes('form') || lowerInstructions.includes('submit')) {
      pageType = 'form';
    }
    
    // Determine complexity
    const actionCount = (lowerInstructions.match(/enter|click|select|verify/g) || []).length;
    const complexity: TestContext['complexity'] = 
      actionCount <= 3 ? 'simple' : 
      actionCount <= 7 ? 'medium' : 
      'complex';
    
    // Detect elements
    const detectedElements: string[] = [];
    if (lowerInstructions.includes('button')) detectedElements.push('button');
    if (lowerInstructions.includes('link')) detectedElements.push('link');
    if (lowerInstructions.includes('dropdown') || lowerInstructions.includes('select')) detectedElements.push('dropdown');
    if (lowerInstructions.includes('checkbox')) detectedElements.push('checkbox');
    if (lowerInstructions.includes('radio')) detectedElements.push('radio');
    
    // Expected outcome
    let expectedOutcome = 'Action completed successfully';
    if (pageType === 'login') {
      expectedOutcome = 'User successfully logged in and redirected';
    } else if (pageType === 'form') {
      expectedOutcome = 'Form submitted successfully';
    } else if (pageType === 'search') {
      expectedOutcome = 'Search results displayed';
    }
    
    // Validation points
    const validationPoints: string[] = [];
    if (lowerInstructions.includes('verify')) {
      const verifyMatches = lowerInstructions.match(/verify\s+(.+?)(?:\n|$)/g);
      if (verifyMatches) {
        verifyMatches.forEach(match => validationPoints.push(match));
      }
    }
    
    return {
      pageType,
      complexity,
      detectedElements,
      expectedOutcome,
      validationPoints
    };
  }

  /**
   * Check if instructions indicate a login test
   */
  private isLoginInstruction(text: string): boolean {
    return text.includes('login') || text.includes('sign in') || 
           text.includes('authenticate') || 
           (text.includes('username') && text.includes('password'));
  }

  /**
   * Check if instructions indicate a form test
   */
  private isFormInstruction(text: string): boolean {
    return text.includes('form') || text.includes('submit') || 
           text.includes('enter') || text.includes('fill');
  }

  /**
   * Check if instructions indicate a navigation test
   */
  private isNavigationInstruction(text: string): boolean {
    return text.includes('navigate') || text.includes('go to') || 
           text.includes('open') || text.includes('visit');
  }

  /**
   * Check if instructions indicate an interaction test
   */
  private isInteractionInstruction(text: string): boolean {
    return text.includes('click') || text.includes('hover') || 
           text.includes('scroll') || text.includes('select');
  }
}
