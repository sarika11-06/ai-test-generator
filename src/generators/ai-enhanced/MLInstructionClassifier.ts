/**
 * ML-Enhanced Instruction Classifier
 * Uses pattern matching and heuristics for intent classification and feature extraction
 * (Lightweight alternative to TensorFlow for better compatibility)
 */

export interface MLClassificationResult {
  primaryIntent: string;
  confidence: number;
  secondaryIntents: Array<{ intent: string; confidence: number }>;
  features: FeatureVector;
  reasoning: string;
}

export interface FeatureVector {
  // Lexical features
  wordCount: number;
  sentenceCount: number;
  avgWordsPerSentence: number;
  
  // Semantic features
  actionWordRatio: number;
  elementWordRatio: number;
  securityWordRatio: number;
  accessibilityWordRatio: number;
}

/**
 * ML Instruction Classifier - Pattern-based implementation
 * Classifies test instructions without heavy ML dependencies
 */
export class MLInstructionClassifier {
  private actionWords = [
    'click', 'enter', 'fill', 'type', 'select', 'check', 'uncheck',
    'hover', 'scroll', 'wait', 'navigate', 'go', 'open', 'visit',
    'submit', 'press', 'tap', 'drag', 'drop', 'upload', 'download'
  ];

  private elementWords = [
    'button', 'link', 'field', 'input', 'form', 'dropdown', 'select',
    'checkbox', 'radio', 'text', 'email', 'password', 'modal', 'dialog',
    'table', 'list', 'menu', 'header', 'footer', 'sidebar', 'navbar'
  ];

  private securityWords = [
    'login', 'logout', 'authenticate', 'password', 'token', 'session',
    'secure', 'ssl', 'https', 'encrypt', 'decrypt', 'permission',
    'access', 'deny', 'allow', 'authorize', 'verify', 'validate'
  ];

  private accessibilityWords = [
    'accessible', 'wcag', 'aria', 'keyboard', 'screen reader', 'contrast',
    'focus', 'tab', 'label', 'alt text', 'semantic', 'heading', 'landmark'
  ];

  /**
   * Classify instruction text and extract features
   */
  classify(instructionText: string): MLClassificationResult {
    const features = this.extractFeatures(instructionText);
    const primaryIntent = this.determinePrimaryIntent(instructionText, features);
    const secondaryIntents = this.determineSecondaryIntents(instructionText, features);
    const confidence = this.calculateConfidence(features, primaryIntent);
    const reasoning = this.generateReasoning(instructionText, features, primaryIntent);

    return {
      primaryIntent,
      confidence,
      secondaryIntents,
      features,
      reasoning
    };
  }

  /**
   * Extract feature vector from instruction text
   */
  private extractFeatures(text: string): FeatureVector {
    const words = text.toLowerCase().split(/\s+/);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

    const actionWordCount = words.filter(w => this.actionWords.includes(w)).length;
    const elementWordCount = words.filter(w => this.elementWords.includes(w)).length;
    const securityWordCount = words.filter(w => this.securityWords.includes(w)).length;
    const accessibilityWordCount = words.filter(w => this.accessibilityWords.includes(w)).length;

    return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      avgWordsPerSentence: words.length / Math.max(sentences.length, 1),
      actionWordRatio: actionWordCount / Math.max(words.length, 1),
      elementWordRatio: elementWordCount / Math.max(words.length, 1),
      securityWordRatio: securityWordCount / Math.max(words.length, 1),
      accessibilityWordRatio: accessibilityWordCount / Math.max(words.length, 1)
    };
  }

  /**
   * Determine primary intent based on features
   */
  private determinePrimaryIntent(text: string, features: FeatureVector): string {
    const lowerText = text.toLowerCase();

    // Check for specific intents
    if (features.securityWordRatio > 0.1 || lowerText.includes('login') || lowerText.includes('authenticate')) {
      return 'authentication';
    }
    if (features.accessibilityWordRatio > 0.05) {
      return 'accessibility';
    }
    if (lowerText.includes('form') || lowerText.includes('submit')) {
      return 'form_submission';
    }
    if (lowerText.includes('navigate') || lowerText.includes('go to') || lowerText.includes('open')) {
      return 'navigation';
    }
    if (features.actionWordRatio > 0.15) {
      return 'interaction';
    }
    if (lowerText.includes('verify') || lowerText.includes('check') || lowerText.includes('assert')) {
      return 'verification';
    }

    return 'functional';
  }

  /**
   * Determine secondary intents
   */
  private determineSecondaryIntents(text: string, features: FeatureVector): Array<{ intent: string; confidence: number }> {
    const secondaryIntents: Array<{ intent: string; confidence: number }> = [];
    const lowerText = text.toLowerCase();

    if (features.actionWordRatio > 0.1) {
      secondaryIntents.push({ intent: 'interaction', confidence: features.actionWordRatio });
    }
    if (features.elementWordRatio > 0.1) {
      secondaryIntents.push({ intent: 'ui_element_testing', confidence: features.elementWordRatio });
    }
    if (lowerText.includes('error') || lowerText.includes('invalid')) {
      secondaryIntents.push({ intent: 'error_handling', confidence: 0.7 });
    }
    if (lowerText.includes('performance') || lowerText.includes('speed')) {
      secondaryIntents.push({ intent: 'performance', confidence: 0.6 });
    }

    return secondaryIntents.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(features: FeatureVector, primaryIntent: string): number {
    let confidence = 0.7; // Base confidence

    // Increase confidence based on feature presence
    if (features.actionWordRatio > 0.1) confidence += 0.1;
    if (features.elementWordRatio > 0.05) confidence += 0.05;
    if (features.sentenceCount > 2) confidence += 0.05;
    if (features.avgWordsPerSentence > 5) confidence += 0.05;

    return Math.min(confidence, 0.99);
  }

  /**
   * Generate reasoning explanation
   */
  private generateReasoning(text: string, features: FeatureVector, primaryIntent: string): string {
    const reasons: string[] = [];

    if (features.actionWordRatio > 0.1) {
      reasons.push(`High action word ratio (${(features.actionWordRatio * 100).toFixed(1)}%)`);
    }
    if (features.elementWordRatio > 0.05) {
      reasons.push(`UI element references detected (${(features.elementWordRatio * 100).toFixed(1)}%)`);
    }
    if (features.securityWordRatio > 0.05) {
      reasons.push('Security-related keywords detected');
    }
    if (features.accessibilityWordRatio > 0.05) {
      reasons.push('Accessibility requirements mentioned');
    }

    return `Classified as ${primaryIntent} based on: ${reasons.join(', ')}`;
  }
}
