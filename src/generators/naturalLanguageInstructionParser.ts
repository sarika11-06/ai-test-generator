/**
 * Natural Language Instruction Parser
 * 
 * Improved instruction parsing that understands natural language variations
 * and maps them to actual page elements, handling cases like:
 * - "first View Product from the card" → first "View Product" link
 * - "click the login button" → button with text containing "login"
 * - "enter username in the form" → input field for username
 */

export interface NaturalLanguageParsedAction {
  type: 'navigate' | 'click' | 'type' | 'verify' | 'wait' | 'select';
  originalInstruction: string;
  interpretedAction: string;
  target: ElementTarget;
  value?: string;
  stepNumber: number;
  confidence: number;
}

export interface ElementTarget {
  type: 'button' | 'link' | 'input' | 'select' | 'element';
  selector: string;
  description: string;
  searchText?: string;
  position?: 'first' | 'last' | number;
  attributes?: Record<string, string>;
}

export interface NaturalLanguageParsedInstruction {
  actions: NaturalLanguageParsedAction[];
  url: string;
  confidence: number;
  interpretations: string[];
}

export class NaturalLanguageInstructionParser {
  
  private readonly actionPatterns = {
    NAVIGATE: {
      patterns: [
        /(?:navigate to|go to|open|visit|load)\s+(.+)/i,
        /^(?:step \d+:?\s*)?(?:navigate to|go to|open|visit|load)\s+(.+)/i
      ],
      confidence: 0.9
    },
    CLICK: {
      patterns: [
        // Direct click patterns
        /(?:click|press|tap)\s+(?:on\s+)?(?:the\s+)?(.+)/i,
        /(?:click|press|tap)\s+(?:the\s+)?(.+?)(?:\s+button|\s+link|\s+element)?/i,
        
        // Natural language click patterns
        /(?:click|select|choose)\s+(?:the\s+)?(?:first|last|\d+(?:st|nd|rd|th))?\s*(.+?)(?:\s+from\s+(?:the\s+)?(.+))?/i,
        /(?:click|select|choose)\s+(.+?)(?:\s+from\s+(?:the\s+)?(.+))?/i,
        
        // Step-based patterns
        /^(?:step \d+:?\s*)?(?:click|press|tap)\s+(.+)/i
      ],
      confidence: 0.85
    },
    TYPE: {
      patterns: [
        /(?:type|enter|input|fill)\s+(?:in\s+)?(?:the\s+)?(.+?)(?:\s+(?:field|box|input))?(?:\s+with\s+)?(?:["'](.+)["']|(.+))?/i,
        /(?:enter|type)\s+["'](.+)["']\s+(?:in|into)\s+(?:the\s+)?(.+)/i,
        /^(?:step \d+:?\s*)?(?:type|enter|input|fill)\s+(.+)/i
      ],
      confidence: 0.8
    },
    VERIFY: {
      patterns: [
        /(?:verify|check|assert|ensure|confirm)\s+(?:that\s+)?(.+)/i,
        /(?:should|must|expect)\s+(.+)/i,
        /^(?:step \d+:?\s*)?(?:verify|check|assert)\s+(.+)/i
      ],
      confidence: 0.75
    },
    WAIT: {
      patterns: [
        /(?:wait|pause)\s+(?:for\s+)?(\d+)?\s*(?:seconds?|ms|milliseconds?)?/i,
        /^(?:step \d+:?\s*)?(?:wait|pause)\s+(.+)/i
      ],
      confidence: 0.9
    }
  };

  private readonly elementPatterns = {
    BUTTON: {
      keywords: ['button', 'btn', 'submit', 'click', 'press'],
      selectors: ['button', '[role="button"]', 'input[type="submit"]', 'input[type="button"]'],
      confidence: 0.9
    },
    LINK: {
      keywords: ['link', 'anchor', 'href', 'view', 'more', 'details'],
      selectors: ['a', '[role="link"]'],
      confidence: 0.85
    },
    INPUT: {
      keywords: ['input', 'field', 'textbox', 'box', 'form', 'enter', 'type'],
      selectors: ['input', 'textarea', '[role="textbox"]'],
      confidence: 0.8
    },
    SELECT: {
      keywords: ['select', 'dropdown', 'option', 'choose'],
      selectors: ['select', '[role="combobox"]', '[role="listbox"]'],
      confidence: 0.8
    }
  };

  private readonly positionPatterns = {
    FIRST: ['first', '1st', 'initial', 'top'],
    LAST: ['last', 'final', 'bottom', 'end'],
    NUMERIC: /(\d+)(?:st|nd|rd|th)?/
  };

  /**
   * Parse natural language instruction into structured actions
   */
  public parseInstruction(instruction: string, baseUrl?: string): NaturalLanguageParsedInstruction {
    console.log('🧠 Natural Language parsing:', instruction);
    
    const lines = instruction.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    const actions: NaturalLanguageParsedAction[] = [];
    const interpretations: string[] = [];
    let stepNumber = 1;
    
    for (const line of lines) {
      const action = this.parseInstructionLine(line, stepNumber);
      if (action) {
        actions.push(action);
        interpretations.push(`Step ${stepNumber}: ${action.interpretedAction}`);
        stepNumber++;
      }
    }
    
    const confidence = this.calculateOverallConfidence(actions);
    
    return {
      actions,
      url: baseUrl || '',
      confidence,
      interpretations
    };
  }

  /**
   * Parse a single instruction line with natural language understanding
   */
  private parseInstructionLine(line: string, stepNumber: number): NaturalLanguageParsedAction | null {
    const cleanLine = line.trim();
    
    // Try each action type
    for (const [actionType, config] of Object.entries(this.actionPatterns)) {
      for (const pattern of config.patterns) {
        const match = cleanLine.match(pattern);
        if (match) {
          const action = this.createActionFromMatch(
            actionType.toLowerCase() as any,
            match,
            cleanLine,
            stepNumber,
            config.confidence
          );
          if (action) {
            return action;
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Create action from regex match
   */
  private createActionFromMatch(
    actionType: 'navigate' | 'click' | 'type' | 'verify' | 'wait',
    match: RegExpMatchArray,
    originalLine: string,
    stepNumber: number,
    baseConfidence: number
  ): NaturalLanguageParsedAction | null {
    
    switch (actionType) {
      case 'navigate':
        return this.createNavigateAction(match, originalLine, stepNumber, baseConfidence);
      
      case 'click':
        return this.createClickAction(match, originalLine, stepNumber, baseConfidence);
      
      case 'type':
        return this.createTypeAction(match, originalLine, stepNumber, baseConfidence);
      
      case 'verify':
        return this.createVerifyAction(match, originalLine, stepNumber, baseConfidence);
      
      case 'wait':
        return this.createWaitAction(match, originalLine, stepNumber, baseConfidence);
      
      default:
        return null;
    }
  }

  /**
   * Create navigate action
   */
  private createNavigateAction(
    match: RegExpMatchArray,
    originalLine: string,
    stepNumber: number,
    baseConfidence: number
  ): NaturalLanguageParsedAction {
    const url = match[1]?.trim() || '';
    
    return {
      type: 'navigate',
      originalInstruction: originalLine,
      interpretedAction: `Navigate to ${url}`,
      target: {
        type: 'element',
        selector: '',
        description: `Navigate to ${url}`
      },
      stepNumber,
      confidence: baseConfidence
    };
  }

  /**
   * Create click action with intelligent element targeting
   */
  private createClickAction(
    match: RegExpMatchArray,
    originalLine: string,
    stepNumber: number,
    baseConfidence: number
  ): NaturalLanguageParsedAction {
    const targetText = match[1]?.trim() || '';
    const contextText = match[2]?.trim() || '';
    
    // Parse the target to understand what element to click
    const elementTarget = this.parseElementTarget(targetText, contextText, originalLine);
    
    return {
      type: 'click',
      originalInstruction: originalLine,
      interpretedAction: `Click ${elementTarget.description}`,
      target: elementTarget,
      stepNumber,
      confidence: baseConfidence * elementTarget.confidence
    };
  }

  /**
   * Parse element target with natural language understanding
   */
  private parseElementTarget(targetText: string, contextText: string, originalLine: string): ElementTarget & { confidence: number } {
    const lowerTarget = targetText.toLowerCase();
    const lowerOriginal = originalLine.toLowerCase();
    
    // Detect position (first, last, nth)
    let position: 'first' | 'last' | number | undefined;
    let cleanTargetText = targetText;
    
    // Check for position indicators
    if (lowerTarget.includes('first') || lowerOriginal.includes('first')) {
      position = 'first';
      cleanTargetText = cleanTargetText.replace(/\bfirst\b/i, '').trim();
    } else if (lowerTarget.includes('last') || lowerOriginal.includes('last')) {
      position = 'last';
      cleanTargetText = cleanTargetText.replace(/\blast\b/i, '').trim();
    } else {
      const numMatch = lowerTarget.match(this.positionPatterns.NUMERIC);
      if (numMatch) {
        position = parseInt(numMatch[1]);
        cleanTargetText = cleanTargetText.replace(this.positionPatterns.NUMERIC, '').trim();
      }
    }
    
    // Detect element type and create appropriate selector
    let elementType: 'button' | 'link' | 'input' | 'select' | 'element' = 'element';
    let selectors: string[] = [];
    let confidence = 0.5;
    
    // Check for specific element type indicators
    for (const [type, config] of Object.entries(this.elementPatterns)) {
      const hasKeyword = config.keywords.some(keyword => 
        lowerTarget.includes(keyword) || lowerOriginal.includes(keyword)
      );
      
      if (hasKeyword) {
        elementType = type.toLowerCase() as any;
        selectors = config.selectors;
        confidence = config.confidence;
        break;
      }
    }
    
    // Special handling for common patterns
    if (lowerOriginal.includes('view product')) {
      // Handle "first View Product from the card" → first "View Product" link
      elementType = 'link';
      selectors = ['a'];
      cleanTargetText = 'View Product';
      confidence = 0.9;
    } else if (lowerOriginal.includes('add to cart')) {
      // Handle "Add to Cart" button
      elementType = 'button';
      selectors = ['button', 'a', '[role="button"]'];
      cleanTargetText = 'Add to Cart';
      confidence = 0.9;
    } else if (lowerOriginal.includes('products')) {
      // Handle "products" link
      elementType = 'link';
      selectors = ['a', 'button', '[role="button"]'];
      cleanTargetText = 'products';
      confidence = 0.85;
    }
    
    // Build selector
    let selector = '';
    if (selectors.length > 0) {
      if (cleanTargetText) {
        // Create selector that looks for text content
        const selectorParts = selectors.map(sel => 
          `${sel}:has-text("${cleanTargetText}"), ${sel}[aria-label*="${cleanTargetText}" i], ${sel}[title*="${cleanTargetText}" i]`
        );
        selector = selectorParts.join(', ');
        
        // Add position if specified
        if (position === 'first') {
          selector = `(${selector}).first()`;
        } else if (position === 'last') {
          selector = `(${selector}).last()`;
        } else if (typeof position === 'number') {
          selector = `(${selector}).nth(${position - 1})`;
        }
      } else {
        selector = selectors.join(', ');
      }
    } else {
      // Fallback: search by text content
      selector = `*:has-text("${cleanTargetText}")`;
      if (position === 'first') {
        selector = `${selector}.first()`;
      }
    }
    
    return {
      type: elementType,
      selector,
      description: position ? `${position} ${cleanTargetText}` : cleanTargetText,
      searchText: cleanTargetText,
      position,
      confidence
    };
  }

  /**
   * Create type action
   */
  private createTypeAction(
    match: RegExpMatchArray,
    originalLine: string,
    stepNumber: number,
    baseConfidence: number
  ): NaturalLanguageParsedAction {
    // Extract value and target field
    let value = '';
    let targetField = '';
    
    if (match[2]) {
      // Pattern: "type in field with value"
      targetField = match[1];
      value = match[2];
    } else if (match[3]) {
      // Pattern: "type value in field"
      value = match[1];
      targetField = match[2];
    } else {
      // Single match - try to parse
      const text = match[1];
      const parts = text.split(/\s+(?:in|into|to)\s+/i);
      if (parts.length === 2) {
        value = parts[0].replace(/["']/g, '');
        targetField = parts[1];
      } else {
        targetField = text;
      }
    }
    
    const elementTarget = this.parseInputTarget(targetField);
    
    return {
      type: 'type',
      originalInstruction: originalLine,
      interpretedAction: `Type "${value}" in ${elementTarget.description}`,
      target: elementTarget,
      value,
      stepNumber,
      confidence: baseConfidence * 0.8
    };
  }

  /**
   * Parse input target for type actions
   */
  private parseInputTarget(targetField: string): ElementTarget {
    const lowerField = targetField.toLowerCase();
    
    // Common input field patterns
    if (lowerField.includes('username') || lowerField.includes('user')) {
      return {
        type: 'input',
        selector: 'input[name*="user" i], input[id*="user" i], input[placeholder*="user" i]',
        description: 'username field'
      };
    } else if (lowerField.includes('password') || lowerField.includes('pass')) {
      return {
        type: 'input',
        selector: 'input[type="password"], input[name*="pass" i], input[id*="pass" i]',
        description: 'password field'
      };
    } else if (lowerField.includes('email')) {
      return {
        type: 'input',
        selector: 'input[type="email"], input[name*="email" i], input[id*="email" i]',
        description: 'email field'
      };
    } else {
      return {
        type: 'input',
        selector: `input[name*="${targetField}" i], input[id*="${targetField}" i], input[placeholder*="${targetField}" i]`,
        description: `${targetField} field`
      };
    }
  }

  /**
   * Create verify action
   */
  private createVerifyAction(
    match: RegExpMatchArray,
    originalLine: string,
    stepNumber: number,
    baseConfidence: number
  ): NaturalLanguageParsedAction {
    const expectation = match[1]?.trim() || '';
    
    return {
      type: 'verify',
      originalInstruction: originalLine,
      interpretedAction: `Verify ${expectation}`,
      target: {
        type: 'element',
        selector: '',
        description: `Verify ${expectation}`
      },
      stepNumber,
      confidence: baseConfidence * 0.7
    };
  }

  /**
   * Create wait action
   */
  private createWaitAction(
    match: RegExpMatchArray,
    originalLine: string,
    stepNumber: number,
    baseConfidence: number
  ): NaturalLanguageParsedAction {
    const duration = match[1] ? parseInt(match[1]) : 1000;
    
    return {
      type: 'wait',
      originalInstruction: originalLine,
      interpretedAction: `Wait ${duration}ms`,
      target: {
        type: 'element',
        selector: '',
        description: `Wait ${duration}ms`
      },
      stepNumber,
      confidence: baseConfidence
    };
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(actions: NaturalLanguageParsedAction[]): number {
    if (actions.length === 0) return 0;
    
    const totalConfidence = actions.reduce((sum, action) => sum + action.confidence, 0);
    return totalConfidence / actions.length;
  }

  /**
   * Generate Playwright code from parsed actions
   */
  public generatePlaywrightCode(parsedInstruction: NaturalLanguageParsedInstruction): string {
    const actions = parsedInstruction.actions;
    
    let code = `import { test, expect } from '@playwright/test';\n\n`;
    code += `test('Generated Test', async ({ page }) => {\n`;
    code += `  console.log('🚀 Starting generated test');\n\n`;
    
    for (const action of actions) {
      code += this.generateActionCode(action);
    }
    
    code += `  console.log('✅ Test completed successfully');\n`;
    code += `});\n`;
    
    return code;
  }

  /**
   * Generate code for a single action
   */
  private generateActionCode(action: NaturalLanguageParsedAction): string {
    let code = `  // ${action.originalInstruction}\n`;
    code += `  console.log('📋 Step ${action.stepNumber}: ${action.interpretedAction}');\n`;
    
    switch (action.type) {
      case 'navigate':
        code += `  await page.goto('${action.target.description.replace('Navigate to ', '')}', { waitUntil: 'domcontentloaded', timeout: 30000 });\n`;
        break;
        
      case 'click':
        if (action.target.searchText) {
          // Use improved selector logic
          code += `  const element${action.stepNumber} = page.locator('${this.generatePlaywrightSelector(action.target)}');\n`;
          code += `  await element${action.stepNumber}.waitFor({ state: 'visible', timeout: 10000 });\n`;
          code += `  await element${action.stepNumber}.click();\n`;
        } else {
          code += `  await page.click('${action.target.selector}');\n`;
        }
        break;
        
      case 'type':
        code += `  await page.fill('${action.target.selector}', '${action.value || ''}');\n`;
        break;
        
      case 'verify':
        code += `  // Verification: ${action.target.description}\n`;
        break;
        
      case 'wait':
        code += `  await page.waitForTimeout(${action.target.description.match(/\d+/)?.[0] || '1000'});\n`;
        break;
    }
    
    code += `  console.log('✅ ${action.interpretedAction} completed');\n`;
    code += `  await page.waitForTimeout(1000);\n\n`;
    
    return code;
  }

  /**
   * Generate optimized Playwright selector
   */
  private generatePlaywrightSelector(target: ElementTarget): string {
    if (!target.searchText) return target.selector;
    
    // Create a more robust selector
    const selectors = [];
    
    if (target.type === 'link') {
      selectors.push(`a:has-text("${target.searchText}")`);
      selectors.push(`a[aria-label*="${target.searchText}" i]`);
    } else if (target.type === 'button') {
      selectors.push(`button:has-text("${target.searchText}")`);
      selectors.push(`[role="button"]:has-text("${target.searchText}")`);
      selectors.push(`a:has-text("${target.searchText}")`);
    } else {
      selectors.push(`*:has-text("${target.searchText}")`);
    }
    
    let selector = selectors.join(', ');
    
    // Add position modifier
    if (target.position === 'first') {
      return `(${selector}).first()`;
    } else if (target.position === 'last') {
      return `(${selector}).last()`;
    } else if (typeof target.position === 'number') {
      return `(${selector}).nth(${target.position - 1})`;
    }
    
    return selector;
  }
}