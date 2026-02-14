/**
 * LLM-Enhanced Test Generator
 * Integrates Large Language Models for superior instruction parsing and code generation
 */

import OpenAI from 'openai';

export interface LLMTestRequest {
  instruction: string;
  url: string;
  context?: {
    testType?: string;
    framework?: 'playwright' | 'selenium' | 'cypress';
    language?: 'typescript' | 'javascript' | 'python';
  };
}

export interface LLMTestResult {
  success: boolean;
  steps: LLMTestStep[];
  playwrightCode: string;
  confidence: number;
  reasoning: string;
  alternatives: string[];
  metadata: {
    model: string;
    tokens: number;
    processingTime: number;
  };
}

export interface LLMTestStep {
  stepNumber: number;
  action: string;
  target: string;
  method: string;
  validation: string;
  playwrightCode: string;
  reasoning: string;
}

export class LLMEnhancedTestGenerator {
  private openai: OpenAI;
  private model: string = 'gpt-4';

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Generate test using LLM with structured output
   */
  public async generateTest(request: LLMTestRequest): Promise<LLMTestResult> {
    const startTime = Date.now();

    try {
      console.log('🤖 LLM: Generating test with AI assistance...');
      
      const systemPrompt = this.createSystemPrompt(request.context);
      const userPrompt = this.createUserPrompt(request);

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        functions: [{
          name: 'generate_test_case',
          description: 'Generate a comprehensive test case with steps and Playwright code',
          parameters: {
            type: 'object',
            properties: {
              steps: {
                type: 'array',
                description: 'Array of test steps',
                items: {
                  type: 'object',
                  properties: {
                    stepNumber: { type: 'number' },
                    action: { type: 'string', description: 'What action to perform' },
                    target: { type: 'string', description: 'What element to target' },
                    method: { type: 'string', description: 'How to perform the action' },
                    validation: { type: 'string', description: 'What to validate' },
                    playwrightCode: { type: 'string', description: 'Playwright code for this step' },
                    reasoning: { type: 'string', description: 'Why this step is needed' }
                  },
                  required: ['stepNumber', 'action', 'target', 'method', 'validation', 'playwrightCode', 'reasoning']
                }
              },
              playwrightCode: {
                type: 'string',
                description: 'Complete Playwright test code'
              },
              confidence: {
                type: 'number',
                description: 'Confidence score 0-100'
              },
              reasoning: {
                type: 'string',
                description: 'Overall reasoning for the test approach'
              },
              alternatives: {
                type: 'array',
                description: 'Alternative approaches or improvements',
                items: { type: 'string' }
              },
              testType: {
                type: 'string',
                description: 'Detected test type: accessibility, security, functional, api'
              }
            },
            required: ['steps', 'playwrightCode', 'confidence', 'reasoning', 'testType']
          }
        }],
        function_call: { name: 'generate_test_case' },
        temperature: 0.3 // Lower temperature for more consistent code generation
      });

      const functionCall = response.choices[0].message.function_call;
      if (!functionCall || !functionCall.arguments) {
        throw new Error('LLM did not return structured function call');
      }

      const result = JSON.parse(functionCall.arguments);
      
      console.log(`🤖 LLM: Generated ${result.steps.length} steps with ${result.confidence}% confidence`);

      return {
        success: true,
        steps: result.steps,
        playwrightCode: result.playwrightCode,
        confidence: result.confidence,
        reasoning: result.reasoning,
        alternatives: result.alternatives || [],
        metadata: {
          model: this.model,
          tokens: response.usage?.total_tokens || 0,
          processingTime: Date.now() - startTime
        }
      };

    } catch (error: any) {
      console.error('🤖 LLM: Generation failed:', error.message);
      
      return {
        success: false,
        steps: [],
        playwrightCode: this.generateFallbackCode(request),
        confidence: 10,
        reasoning: `LLM generation failed: ${error.message}`,
        alternatives: ['Use traditional rule-based parsing', 'Simplify instruction'],
        metadata: {
          model: this.model,
          tokens: 0,
          processingTime: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Create system prompt for the LLM
   */
  private createSystemPrompt(context?: any): string {
    const framework = context?.framework || 'playwright';
    const language = context?.language || 'typescript';

    return `You are an expert test automation engineer specializing in ${framework} with ${language}.

Your task is to parse natural language test instructions and generate high-quality, executable test code.

Key principles:
1. Generate robust, maintainable test code
2. Use appropriate selectors (prefer data-testid, then semantic selectors)
3. Include proper error handling and waits
4. Add meaningful assertions and validations
5. Follow ${framework} best practices
6. Consider accessibility, security, and performance aspects

For each instruction, you should:
- Break down into logical test steps
- Generate specific ${framework} code for each step
- Include proper waits and error handling
- Add comprehensive validations
- Explain your reasoning

Test types to consider:
- Functional: User interactions, form submissions, navigation
- Accessibility: WCAG compliance, keyboard navigation, screen reader support
- Security: Input validation, authentication, authorization
- API: HTTP requests, response validation, data manipulation

Always prioritize:
- Test reliability and maintainability
- Clear, readable code
- Comprehensive error handling
- Meaningful assertions`;
  }

  /**
   * Create user prompt with instruction and context
   */
  private createUserPrompt(request: LLMTestRequest): string {
    return `Generate a comprehensive test case for the following:

Instruction: "${request.instruction}"
URL: ${request.url}
Context: ${JSON.stringify(request.context || {})}

Requirements:
1. Parse the instruction into detailed test steps
2. Generate complete, executable Playwright code
3. Include proper selectors, waits, and assertions
4. Add error handling and logging
5. Provide reasoning for each step
6. Suggest alternative approaches if applicable

Focus on creating a production-ready test that would pass code review.`;
  }

  /**
   * Generate fallback code when LLM fails
   */
  private generateFallbackCode(request: LLMTestRequest): string {
    return `import { test, expect } from '@playwright/test';

test('LLM Fallback Test', async ({ page }) => {
  // LLM generation failed, using fallback
  console.log('Original instruction: ${request.instruction}');
  
  try {
    await page.goto('${request.url}');
    await expect(page).toHaveTitle(/.*/);
    console.log('✅ Basic page load test completed');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
});`;
  }

  /**
   * Enhance existing test with LLM suggestions
   */
  public async enhanceTest(existingTest: string, improvements: string[]): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [{
        role: 'system',
        content: 'You are an expert at improving test code. Enhance the provided test based on the suggestions.'
      }, {
        role: 'user',
        content: `Improve this test code:

${existingTest}

Improvements to make:
${improvements.map(imp => `- ${imp}`).join('\n')}

Return only the improved code.`
      }],
      temperature: 0.2
    });

    return response.choices[0].message.content || existingTest;
  }

  /**
   * Explain existing test code
   */
  public async explainTest(testCode: string): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [{
        role: 'system',
        content: 'You are an expert at explaining test code. Provide clear, educational explanations.'
      }, {
        role: 'user',
        content: `Explain what this test code does, step by step:

${testCode}`
      }],
      temperature: 0.3
    });

    return response.choices[0].message.content || 'Unable to explain test code.';
  }
}