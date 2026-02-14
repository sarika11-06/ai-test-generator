/**
 * Security Intent Classifier
 * Classifies security testing instructions into predefined security intent categories
 * Uses hybrid rule-based + NLP approach for stability and explainability
 */

export interface SecurityIntent {
  id: string;
  type: string;
  description: string;
  keywords: string[];
  minAssertions: string[];
}

export interface ClassificationResult {
  intent: string;
  confidence: number;
  matchedKeywords: string[];
  reasoning: string;
}

export class SecurityIntentClassifier {
  private readonly securityIntents: SecurityIntent[] = [
    {
      id: 'SEC_INJ',
      type: 'Injection',
      description: 'SQL/XSS/NoSQL injection prevention testing',
      keywords: ['inject', 'sql', 'script', '<script>', 'xss', 'nosql', 'or 1=1', 'union select', 'drop table', 'alert(', 'javascript:', 'onload='],
      minAssertions: ['status ≠ 200', 'error present', 'no sensitive data']
    },
    {
      id: 'SEC_AUTH',
      type: 'Authentication',
      description: 'Authentication mechanism testing',
      keywords: ['login', 'password', 'token', 'authenticate', 'signin', 'credentials', 'auth', 'session', 'logout'],
      minAssertions: ['status validation', 'error present']
    },
    {
      id: 'SEC_AUTHZ',
      type: 'Authorization',
      description: 'Access control and permission testing',
      keywords: ['access', 'permission', 'unauthorized', 'forbidden', 'role', 'admin', 'privilege', 'without token', 'no auth'],
      minAssertions: ['status 401/403', 'access denied']
    },
    {
      id: 'SEC_DATA',
      type: 'Sensitive Data Exposure',
      description: 'Sensitive information leakage testing',
      keywords: ['password', 'credit card', 'ssn', 'sensitive', 'personal', 'private', 'confidential', 'secret', 'key'],
      minAssertions: ['sensitive field absent', 'data masking']
    },
    {
      id: 'SEC_HEADER',
      type: 'Security Headers',
      description: 'HTTP security headers validation',
      keywords: ['header', 'csp', 'hsts', 'x-frame-options', 'content-security-policy', 'strict-transport-security', 'x-xss-protection'],
      minAssertions: ['header present', 'header value correct']
    },
    {
      id: 'SEC_METHOD',
      type: 'HTTP Method Misuse',
      description: 'HTTP method security testing',
      keywords: ['method', 'get instead of post', 'post instead of get', 'put', 'delete', 'patch', 'options', 'head'],
      minAssertions: ['method rejected', 'status 405']
    },
    {
      id: 'SEC_RATE',
      type: 'Rate Limiting/Abuse',
      description: 'Rate limiting and abuse prevention testing',
      keywords: ['rate', 'limit', 'throttle', 'abuse', 'flood', 'spam', 'brute force', 'dos', 'multiple requests'],
      minAssertions: ['rate limit triggered', 'status 429']
    }
  ];

  /**
   * Classifies security testing instruction into appropriate intent category
   */
  public classifyIntent(instruction: string): ClassificationResult {
    const normalizedInstruction = this.normalizeInstruction(instruction);
    const scores = this.calculateIntentScores(normalizedInstruction);
    
    // Find best match
    const bestMatch = scores.reduce((prev, current) => 
      current.score > prev.score ? current : prev
    );

    return {
      intent: bestMatch.intentId,
      confidence: bestMatch.score,
      matchedKeywords: bestMatch.matchedKeywords,
      reasoning: this.generateReasoning(bestMatch, normalizedInstruction)
    };
  }

  /**
   * Normalizes instruction text for consistent processing
   */
  private normalizeInstruction(instruction: string): string {
    return instruction
      .toLowerCase()
      .replace(/[^\w\s<>='"-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Calculates intent scores based on keyword matching and context
   */
  private calculateIntentScores(instruction: string): Array<{
    intentId: string;
    score: number;
    matchedKeywords: string[];
  }> {
    return this.securityIntents.map(intent => {
      const matchedKeywords: string[] = [];
      let score = 0;

      // Keyword matching with context awareness
      for (const keyword of intent.keywords) {
        if (instruction.includes(keyword)) {
          matchedKeywords.push(keyword);
          
          // Base score for keyword match
          score += 1;
          
          // Bonus for exact phrase matches
          if (instruction.includes(keyword)) {
            score += 0.5;
          }
          
          // Context-aware scoring
          score += this.getContextualScore(keyword, instruction, intent.id);
        }
      }

      // Normalize score by number of possible keywords
      const normalizedScore = matchedKeywords.length > 0 ? 
        score / intent.keywords.length : 0;

      return {
        intentId: intent.id,
        score: normalizedScore,
        matchedKeywords
      };
    });
  }

  /**
   * Provides contextual scoring based on surrounding words
   */
  private getContextualScore(keyword: string, instruction: string, intentId: string): number {
    let contextScore = 0;

    // Security-specific context patterns
    const securityPatterns = {
      'SEC_INJ': ['prevent', 'block', 'reject', 'fail', 'error'],
      'SEC_AUTH': ['verify', 'check', 'validate', 'require'],
      'SEC_AUTHZ': ['deny', 'forbidden', 'unauthorized', 'restrict'],
      'SEC_DATA': ['hide', 'mask', 'exclude', 'not contain'],
      'SEC_HEADER': ['present', 'set', 'include', 'contain'],
      'SEC_METHOD': ['allow', 'reject', 'support', 'method'],
      'SEC_RATE': ['limit', 'throttle', 'block', 'prevent']
    };

    const patterns = securityPatterns[intentId as keyof typeof securityPatterns] || [];
    
    for (const pattern of patterns) {
      if (instruction.includes(pattern)) {
        contextScore += 0.3;
      }
    }

    return contextScore;
  }

  /**
   * Generates human-readable reasoning for classification
   */
  private generateReasoning(bestMatch: any, instruction: string): string {
    const intent = this.securityIntents.find(i => i.id === bestMatch.intentId);
    
    if (!intent || bestMatch.matchedKeywords.length === 0) {
      return 'No clear security intent detected. Defaulting to general security test.';
    }

    return `Classified as ${intent.type} test based on keywords: ${bestMatch.matchedKeywords.join(', ')}. ` +
           `Confidence: ${(bestMatch.score * 100).toFixed(1)}%`;
  }

  /**
   * Gets security intent details by ID
   */
  public getIntentDetails(intentId: string): SecurityIntent | null {
    return this.securityIntents.find(intent => intent.id === intentId) || null;
  }

  /**
   * Gets all available security intents
   */
  public getAllIntents(): SecurityIntent[] {
    return [...this.securityIntents];
  }

  /**
   * Validates if instruction contains sufficient security context
   */
  public validateSecurityContext(instruction: string): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    const hasSecurityKeywords = this.securityIntents.some(intent =>
      intent.keywords.some(keyword => instruction.toLowerCase().includes(keyword))
    );

    if (!hasSecurityKeywords) {
      issues.push('No security-specific keywords detected');
      suggestions.push('Include security-related terms like "inject", "unauthorized", "password", etc.');
    }

    const hasVerificationAction = /verify|check|ensure|validate|confirm/.test(instruction.toLowerCase());
    if (!hasVerificationAction) {
      issues.push('No verification action specified');
      suggestions.push('Include verification terms like "verify", "check", or "ensure"');
    }

    const hasExpectedBehavior = /fail|error|reject|deny|block|prevent/.test(instruction.toLowerCase());
    if (!hasExpectedBehavior) {
      issues.push('No expected security behavior specified');
      suggestions.push('Specify expected behavior like "should fail", "should be rejected", etc.');
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
  }
}