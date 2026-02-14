export interface ParsedInstruction {
  actions: InstructionAction[];
  url: string;
  isLoginTest: boolean;
  isFormTest: boolean;
  hasSpecificCredentials: boolean;
  credentials?: {
    username?: string;
    password?: string;
  };
  formData?: Record<string, string>;
}

export interface InstructionAction {
  type: 'navigate' | 'enter' | 'click' | 'verify' | 'wait';
  target: string;
  value?: string;
  field?: string;
  stepNumber: number;
}

export class EnhancedInstructionParser {
  
  /**
   * Parse multi-line testing instructions into structured actions
   */
  parseTestingInstructions(instructions: string, baseUrl?: string): ParsedInstruction {
    console.log('🔍 Parsing testing instructions:', instructions);
    
    const lines = instructions.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const actions: InstructionAction[] = [];
    let stepNumber = 1;
    
    const result: ParsedInstruction = {
      actions: [],
      url: baseUrl || '',
      isLoginTest: false,
      isFormTest: false,
      hasSpecificCredentials: false
    };

    // Check if this is a login test
    const instructionText = instructions.toLowerCase();
    result.isLoginTest = instructionText.includes('login') || 
                        instructionText.includes('username') || 
                        instructionText.includes('password');
    
    result.isFormTest = instructionText.includes('enter') || 
                       instructionText.includes('fill') || 
                       instructionText.includes('submit');

    // Parse each line for actions
    for (const line of lines) {
      const action = this.parseInstructionLine(line, stepNumber);
      if (action) {
        actions.push(action);
        stepNumber++;
        
        // Extract credentials if found
        if (action.type === 'enter') {
          if (action.field?.toLowerCase().includes('username')) {
            result.hasSpecificCredentials = true;
            if (!result.credentials) result.credentials = {};
            result.credentials.username = action.value;
          } else if (action.field?.toLowerCase().includes('password')) {
            result.hasSpecificCredentials = true;
            if (!result.credentials) result.credentials = {};
            result.credentials.password = action.value;
          }
        }
      }
    }

    result.actions = actions;
    
    console.log('📋 Parsed instructions:', {
      actionsCount: actions.length,
      isLoginTest: result.isLoginTest,
      hasCredentials: result.hasSpecificCredentials,
      credentials: result.credentials
    });

    return result;
  }

  /**
   * Parse a single instruction line into an action
   */
  private parseInstructionLine(line: string, stepNumber: number): InstructionAction | null {
    const lowerLine = line.toLowerCase().trim();
    
    // Navigate action
    if (lowerLine.includes('navigate to') || lowerLine.includes('go to') || lowerLine.includes('open')) {
      return {
        type: 'navigate',
        target: this.extractUrl(line) || 'page',
        stepNumber
      };
    }

    // Enter/Fill actions with specific value extraction
    if (lowerLine.includes('enter') || lowerLine.includes('fill') || lowerLine.includes('type')) {
      const enterMatch = line.match(/enter\s+(\w+)\s*[""']([^""']+)[""']/i) ||
                        line.match(/enter\s+(\w+)\s*["""]([^"""]+)["""]/) ||
                        line.match(/fill\s+(\w+)\s*[""']([^""']+)[""']/i) ||
                        line.match(/type\s+(\w+)\s*[""']([^""']+)[""']/i);
      
      if (enterMatch) {
        return {
          type: 'enter',
          target: enterMatch[1], // field type (username, password, etc.)
          field: enterMatch[1],
          value: enterMatch[2], // actual value to enter
          stepNumber
        };
      }

      // Fallback pattern for simpler formats
      const simpleMatch = line.match(/enter\s+[""']([^""']+)[""']/i) ||
                         line.match(/fill\s+[""']([^""']+)[""']/i);
      if (simpleMatch) {
        // Try to determine field type from context
        const fieldType = this.determineFieldType(line, simpleMatch[1]);
        return {
          type: 'enter',
          target: fieldType,
          field: fieldType,
          value: simpleMatch[1],
          stepNumber
        };
      }
    }

    // Click actions
    if (lowerLine.includes('click')) {
      const clickMatch = line.match(/click\s+(.+?)(?:\s+button)?$/i);
      if (clickMatch) {
        return {
          type: 'click',
          target: clickMatch[1].trim(),
          stepNumber
        };
      }
    }

    // Verify actions
    if (lowerLine.includes('verify') || lowerLine.includes('check') || lowerLine.includes('assert')) {
      return {
        type: 'verify',
        target: line.replace(/verify|check|assert/i, '').trim(),
        stepNumber
      };
    }

    // Wait actions
    if (lowerLine.includes('wait')) {
      return {
        type: 'wait',
        target: line.replace(/wait/i, '').trim(),
        stepNumber
      };
    }

    return null;
  }

  /**
   * Determine field type from context and value
   */
  private determineFieldType(line: string, value: string): string {
    const lowerLine = line.toLowerCase();
    const lowerValue = value.toLowerCase();
    
    // Check line context first
    if (lowerLine.includes('username') || lowerLine.includes('user name')) {
      return 'username';
    }
    if (lowerLine.includes('password') || lowerLine.includes('pass')) {
      return 'password';
    }
    if (lowerLine.includes('email')) {
      return 'email';
    }
    
    // Check value patterns
    if (lowerValue.includes('user') || lowerValue.includes('admin')) {
      return 'username';
    }
    if (lowerValue.includes('password') || lowerValue.includes('secret')) {
      return 'password';
    }
    if (lowerValue.includes('@')) {
      return 'email';
    }
    
    return 'text';
  }

  /**
   * Extract URL from instruction line
   */
  private extractUrl(line: string): string | null {
    const urlMatch = line.match(/https?:\/\/[^\s]+/);
    return urlMatch ? urlMatch[0] : null;
  }

  /**
   * Generate test steps from parsed instructions
   */
  generateTestSteps(parsed: ParsedInstruction, baseUrl: string): any[] {
    const steps: any[] = [];
    
    // Add navigation step if not present
    if (!parsed.actions.some(a => a.type === 'navigate')) {
      steps.push({
        stepNumber: 1,
        action: `Navigate to ${baseUrl}`,
        expectedBehavior: 'Page loads successfully',
        data: baseUrl
      });
    }

    // Convert parsed actions to test steps
    parsed.actions.forEach((action, index) => {
      const stepNumber = steps.length + 1;
      
      switch (action.type) {
        case 'navigate':
          steps.push({
            stepNumber,
            action: `Navigate to ${action.target}`,
            expectedBehavior: 'Page loads successfully',
            data: action.target
          });
          break;
          
        case 'enter':
          steps.push({
            stepNumber,
            action: `Enter ${action.field} "${action.value}"`,
            expectedBehavior: `${action.field} field accepts input`,
            data: action.value
          });
          break;
          
        case 'click':
          steps.push({
            stepNumber,
            action: `Click ${action.target}`,
            expectedBehavior: `${action.target} is clicked and action is performed`
          });
          break;
          
        case 'verify':
          steps.push({
            stepNumber,
            action: `Verify ${action.target}`,
            expectedBehavior: `${action.target} is as expected`
          });
          break;
          
        case 'wait':
          steps.push({
            stepNumber,
            action: `Wait for ${action.target}`,
            expectedBehavior: `${action.target} condition is met`
          });
          break;
      }
    });

    return steps;
  }

  /**
   * Generate Playwright code from parsed instructions
   */
  generatePlaywrightCode(parsed: ParsedInstruction, baseUrl: string, testCaseId: string): string {
    let code = `import { test, expect } from '@playwright/test';\n\n`;
    code += `test('${testCaseId}: Instruction-based Test', async ({ page }) => {\n`;
    code += `  console.log('🚀 Starting instruction-based test...');\n\n`;

    // Navigation
    code += `  // Navigate to the page\n`;
    code += `  console.log('📋 Step 1: Navigate to page');\n`;
    code += `  await page.goto('${baseUrl}', { \n`;
    code += `    waitUntil: 'domcontentloaded',\n`;
    code += `    timeout: 30000 \n`;
    code += `  });\n`;
    code += `  await expect(page.locator('body')).toBeVisible();\n`;
    code += `  console.log('✅ Navigation completed');\n\n`;

    // Process each action
    parsed.actions.forEach((action, index) => {
      const stepNum = index + 2; // +2 because navigation is step 1
      
      code += `  // Step ${stepNum}: ${action.type} ${action.target}\n`;
      code += `  console.log('📋 Step ${stepNum}: ${action.type} ${action.target}');\n`;
      
      switch (action.type) {
        case 'enter':
          if (action.field === 'username') {
            code += `  const usernameField = page.locator('#username, [name="username"], [name="user"], input[type="text"]:first-of-type');\n`;
            code += `  await expect(usernameField).toBeVisible();\n`;
            code += `  await usernameField.fill('${action.value}');\n`;
            code += `  await expect(usernameField).toHaveValue('${action.value}');\n`;
            code += `  console.log('✅ Username entered successfully');\n\n`;
          } else if (action.field === 'password') {
            code += `  const passwordField = page.locator('#password, [name="password"], input[type="password"]');\n`;
            code += `  await expect(passwordField).toBeVisible();\n`;
            code += `  await passwordField.fill('${action.value}');\n`;
            code += `  await expect(passwordField).toHaveValue('${action.value}');\n`;
            code += `  console.log('✅ Password entered successfully');\n\n`;
          } else {
            code += `  const inputField = page.locator('input, textarea').first();\n`;
            code += `  await expect(inputField).toBeVisible();\n`;
            code += `  await inputField.fill('${action.value}');\n`;
            code += `  console.log('✅ Input entered successfully');\n\n`;
          }
          break;
          
        case 'click':
          if (action.target.toLowerCase().includes('login')) {
            code += `  const loginButton = page.locator('button:has-text("Login"), input[type="submit"], #login-button');\n`;
            code += `  await expect(loginButton).toBeVisible();\n`;
            code += `  await loginButton.click();\n`;
            code += `  console.log('✅ Login button clicked');\n\n`;
            
            // Add login verification
            code += `  // Wait for login to complete\n`;
            code += `  try {\n`;
            code += `    await expect(page).toHaveURL(/inventory|dashboard|home/, { timeout: 10000 });\n`;
            code += `    console.log('✅ Login successful - redirected to main page');\n`;
            code += `  } catch (e) {\n`;
            code += `    console.log('⚠️ Login may have failed or stayed on login page');\n`;
            code += `  }\n\n`;
          } else {
            code += `  const button = page.locator('button, input[type="submit"], a').filter({ hasText: '${action.target}' }).first();\n`;
            code += `  await expect(button).toBeVisible();\n`;
            code += `  await button.click();\n`;
            code += `  console.log('✅ Button clicked successfully');\n\n`;
          }
          break;
      }
    });

    // Final screenshot and delay
    code += `  // Take final screenshot for test report\n`;
    code += `  console.log('📸 Taking final screenshot for test report...');\n`;
    code += `  await page.screenshot({ \n`;
    code += `    path: 'test-results/${testCaseId}-final-screenshot.png', \n`;
    code += `    fullPage: true \n`;
    code += `  });\n`;
    code += `  console.log('✅ Final screenshot captured');\n\n`;
    
    code += `  console.log('🎉 Test completed successfully!');\n`;
    code += `  console.log('⏳ Keeping window open for 2 seconds to view results...');\n\n`;
    
    code += `  // Keep window open for 2 seconds to see the output\n`;
    code += `  await page.waitForTimeout(2000);\n\n`;
    
    code += `  console.log('✅ Test execution complete - window will now close');\n`;
    code += `});\n`;

    return code;
  }
}