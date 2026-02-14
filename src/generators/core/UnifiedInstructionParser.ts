/**
 * Unified Instruction Parser
 * Single interface for all instruction parsing with domain-specific strategies
 */

export interface ParsedInstruction {
  // Core components
  actions: ParsedAction[];
  targets: ParsedTarget[];
  conditions: ParsedCondition[];
  validations: ParsedValidation[];
  
  // Context and metadata
  context: InstructionContext;
  confidence: number;
  domain: 'ACCESSIBILITY' | 'API' | 'SECURITY' | 'FUNCTIONAL' | 'MIXED';
  
  // Generated test structure
  testSteps: TestStep[];
  expectedOutcomes: ExpectedOutcome[];
}

export interface ParsedAction {
  type: string;
  verb: string;
  object: string;
  modifiers: string[];
  confidence: number;
}

export interface ParsedTarget {
  type: string;
  value: string;
  properties: Record<string, any>;
  confidence: number;
}

export interface ParsedCondition {
  type: string;
  description: string;
  parameters: Record<string, any>;
  confidence: number;
}

export interface ParsedValidation {
  type: string;
  expectation: string;
  criteria: string[];
  confidence: number;
}

export interface InstructionContext {
  domain: string;
  complexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX' | 'VERY_COMPLEX';
  testType: string[];
  securityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  language: 'FORMAL' | 'CASUAL' | 'TECHNICAL' | 'MIXED';
}

export interface TestStep {
  stepNumber: number;
  action: string;
  details: string;
  expectedResult: string;
  validations: string[];
  code?: string;
}

export interface ExpectedOutcome {
  type: string;
  description: string;
  criteria: string[];
}

/**
 * Abstract base parser that all domain-specific parsers extend
 */
export abstract class InstructionParser {
  protected abstract domain: string;
  protected abstract keywords: string[];

  /**
   * Parse instruction into structured format
   */
  public abstract parseInstruction(instruction: string, url: string): ParsedInstruction;

  /**
   * Check if this parser can handle the given instruction
   */
  public canHandle(instruction: string): { canHandle: boolean; confidence: number } {
    const instructionLower = instruction.toLowerCase();
    const matchedKeywords = this.keywords.filter(keyword => 
      instructionLower.includes(keyword.toLowerCase())
    );
    
    const confidence = matchedKeywords.length / this.keywords.length;
    return {
      canHandle: confidence > 0.1,
      confidence
    };
  }

  /**
   * Extract common patterns from instruction
   */
  protected extractCommonPatterns(instruction: string): {
    actions: string[];
    targets: string[];
    conditions: string[];
    validations: string[];
  } {
    const instructionLower = instruction.toLowerCase();
    
    // Common action patterns
    const actionPatterns = [
      /\b(click|press|type|enter|submit|navigate|load|open|close|select|check|verify|validate|test|ensure|confirm)\b/gi,
      /\b(send|make|perform|execute|call|invoke)\s+(a\s+)?(get|post|put|patch|delete|head|options)\s+(request|call)/gi
    ];
    
    // Common target patterns
    const targetPatterns = [
      /\b(button|link|input|form|field|element|page|url|endpoint|api)\b/gi,
      /\b(header|body|response|status|code|data|payload)\b/gi
    ];
    
    // Common condition patterns
    const conditionPatterns = [
      /\b(if|when|while|unless|provided|given|assuming)\b/gi,
      /\b(with|using|containing|having|including)\b/gi
    ];
    
    // Common validation patterns
    const validationPatterns = [
      /\b(should|must|expect|require|assert|verify|check|validate|ensure|confirm)\b/gi,
      /\b(contains|includes|has|shows|displays|returns|responds)\b/gi
    ];
    
    return {
      actions: this.extractMatches(instruction, actionPatterns),
      targets: this.extractMatches(instruction, targetPatterns),
      conditions: this.extractMatches(instruction, conditionPatterns),
      validations: this.extractMatches(instruction, validationPatterns)
    };
  }

  /**
   * Extract matches from instruction using patterns
   */
  protected extractMatches(instruction: string, patterns: RegExp[]): string[] {
    const matches: string[] = [];
    patterns.forEach(pattern => {
      const found = instruction.match(pattern);
      if (found) {
        matches.push(...found);
      }
    });
    return [...new Set(matches)]; // Remove duplicates
  }

  /**
   * Calculate confidence based on keyword matches and pattern recognition
   */
  protected calculateConfidence(instruction: string, patterns: any): number {
    const instructionLower = instruction.toLowerCase();
    const keywordMatches = this.keywords.filter(keyword => 
      instructionLower.includes(keyword.toLowerCase())
    ).length;
    
    const patternMatches = Object.values(patterns).flat().length;
    const totalPossible = this.keywords.length + 10; // Assume 10 possible patterns
    
    return Math.min((keywordMatches + patternMatches) / totalPossible, 1.0);
  }
}

/**
 * Parser Registry for managing domain-specific parsers
 */
export class ParserRegistry {
  private parsers: Map<string, InstructionParser> = new Map();

  /**
   * Register a domain-specific parser
   */
  public registerParser(domain: string, parser: InstructionParser): void {
    this.parsers.set(domain, parser);
  }

  /**
   * Find the best parser for a given instruction
   */
  public findBestParser(instruction: string): { parser: InstructionParser; confidence: number } | null {
    let bestParser: InstructionParser | null = null;
    let bestConfidence = 0;

    for (const parser of this.parsers.values()) {
      const { canHandle, confidence } = parser.canHandle(instruction);
      if (canHandle && confidence > bestConfidence) {
        bestParser = parser;
        bestConfidence = confidence;
      }
    }

    return bestParser ? { parser: bestParser, confidence: bestConfidence } : null;
  }

  /**
   * Get all parsers that can handle an instruction
   */
  public getAllCapableParsers(instruction: string): Array<{ parser: InstructionParser; confidence: number }> {
    const capableParsers: Array<{ parser: InstructionParser; confidence: number }> = [];

    for (const parser of this.parsers.values()) {
      const { canHandle, confidence } = parser.canHandle(instruction);
      if (canHandle) {
        capableParsers.push({ parser, confidence });
      }
    }

    return capableParsers.sort((a, b) => b.confidence - a.confidence);
  }
}