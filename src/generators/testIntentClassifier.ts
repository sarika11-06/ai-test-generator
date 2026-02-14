/**
 * Test Intent Classifier Module
 * 
 * Analyzes user prompts to determine which test type(s) to generate.
 * Supports classification for functional, accessibility, and API testing.
 * Enhanced with accessibility routing to the enhanced accessibility parser.
 */

/**
 * Website Analysis Interface
 * Minimal interface for website structure analysis
 */
export interface WebsiteAnalysis {
  url: string;
  allInteractive?: Array<{
    tag: string;
    type: string;
    text: string;
    ariaLabel: string;
    role: string;
    [key: string]: any;
  }>;
  forms?: Array<{
    name: string;
    fields: any[];
  }>;
  [key: string]: any;
}

/**
 * Test Intent Classification Result
 */
export interface TestIntent {
  primaryType: 'functional' | 'accessibility' | 'api' | 'mixed' | 'security';
  secondaryTypes: string[];
  confidence: number;
  detectedKeywords: {
    accessibility: string[];
    api: string[];
    functional: string[];
    security?: string[];
  };
  useEnhancedAccessibilityParser?: boolean; // NEW: Flag for enhanced parser routing
}

/**
 * Security testing keywords for intent classification
 */
const SECURITY_KEYWORDS = [
  'security', 'auth', 'authorization', 'authentication', 'token', 'bearer',
  'invalid', 'unauthorized', 'forbidden', 'inject', 'injection', 'sql',
  'xss', 'script', 'malicious', 'payload', 'exploit', 'vulnerability',
  'header', 'x-admin', 'admin', 'privilege', 'escalation', 'bypass'
];

/**
 * Enhanced accessibility keywords for improved detection
 * Requirements: 1.6, 7.1, 7.2
 */
const ENHANCED_ACCESSIBILITY_KEYWORDS = [
  // DOM inspection keywords
  'alt text', 'alt attribute', 'image alt', 'form labels', 'label association',
  'heading hierarchy', 'semantic html', 'landmarks', 'main content', 'navigation',
  'banner', 'contentinfo', 'article', 'section', 'aside', 'figure', 'figcaption',
  
  // Keyboard navigation keywords - ENHANCED
  'keyboard navigation', 'tab sequence', 'focus order', 'keyboard activation',
  'focus management', 'keyboard trap', 'tab key', 'enter key', 'space key',
  'shift tab', 'focus indicator', 'focus visible', 'press tab', 'tab twice',
  'tab three times', 'tab once', 'keyboard input', 'keyboard access', 'keyboard only',
  'tab order', 'keyboard shortcut', 'arrow keys', 'keyboard interaction',
  'keyboard controls', 'tab navigation', 'keyboard focus', 'focus ring',
  'keyboard user', 'keyboard support', 'tab stop', 'focusable element',
  'keyboard accessible', 'keyboard functionality', 'keyboard operation',
  
  // ARIA compliance keywords - ENHANCED
  'aria label', 'aria labelledby', 'aria describedby', 'aria live', 'aria expanded',
  'aria selected', 'aria checked', 'aria pressed', 'aria current', 'aria disabled',
  'aria hidden', 'aria invalid', 'aria required', 'aria readonly', 'aria role',
  'aria states', 'aria properties', 'live regions', 'screen reader announcements',
  'role attribute', 'role value', 'role compatibility', 'element role', 'aria roles',
  'role validation', 'role checking', 'role verification', 'semantic role',
  'element type', 'role mapping', 'role semantics', 'locate elements', 'read role',
  'check role', 'role testing', 'aria compliance', 'role attributes',
  
  // Visual accessibility keywords
  'color contrast', 'contrast ratio', 'focus indicators', 'visual accessibility',
  'wcag aa', 'wcag aaa', 'contrast compliance', 'text contrast', 'background contrast',
  
  // WCAG guideline keywords
  'wcag 1.1.1', 'wcag 1.3.1', 'wcag 2.1.1', 'wcag 2.4.1', 'wcag 2.4.3', 'wcag 2.4.6',
  'wcag 2.4.7', 'wcag 3.3.2', 'wcag 4.1.2', 'wcag 4.1.3', 'wcag guidelines',
  'success criteria', 'bypass blocks', 'skip links', 'info and relationships',
  'headings and labels', 'labels or instructions', 'name role value',
  
  // Axe-core and testing keywords
  'axe core', 'axe-core', 'accessibility scan', 'accessibility audit',
  'accessibility violations', 'accessibility compliance'
];

/**
 * Keyword sets for test type classification
 */
const ACCESSIBILITY_KEYWORDS = [
  'screen reader',
  'keyboard',
  'aria',
  'wcag',
  'a11y',
  'accessible',
  'focus',
  'tab navigation',
  'contrast',
  'semantic',
  'assistive',
  'voiceover',
  'nvda',
  'jaws',
  'talkback',
  'accessibility',
  'keyboard navigation',
  'screen reader',
  'color contrast',
  'focus indicator',
  'aria label',
  'aria role',
  // Keyboard navigation specific keywords
  'press tab',
  'tab key',
  'tab twice',
  'tab navigation',
  'keyboard input',
  'keyboard access',
  'keyboard only',
  'tab order',
  'focus order',
  'tab sequence',
  'keyboard shortcut',
  'enter key',
  'space key',
  'arrow keys',
  'shift tab',
  'keyboard trap',
  'focus management',
  'focus visible',
  'focus indicator',
  'keyboard activation',
  'keyboard interaction',
  // ARIA role specific keywords
  'role attribute',
  'role value',
  'role compatibility',
  'element role',
  'aria roles',
  'role validation',
  'role checking',
  'role verification',
  'semantic role',
  'element type',
  'role mapping',
  'role semantics',
  'locate elements',
  'read role',
  'check role',
  ...ENHANCED_ACCESSIBILITY_KEYWORDS, // Include enhanced keywords
];

const API_KEYWORDS = [
  'api',
  'endpoint',
  'rest',
  'graphql',
  'status code',
  'json',
  'schema',
  'request',
  'response',
  'http',
  'authentication',
  'token',
  'bearer',
  'authorization',
  'header',
  'body',
  'query parameter',
  'post',
  'get',
  'put',
  'patch',
  'delete',
  'rest api',
  'api endpoint',
  'json schema',
  'response code',
];

const FUNCTIONAL_KEYWORDS = [
  'click',
  'fill',
  'navigate',
  'submit',
  'login',
  'search',
  'form',
  'button',
  'link',
  'input',
  'select',
  'checkbox',
  'radio',
  'dropdown',
  'menu',
  'modal',
  'dialog',
  'page',
  'user flow',
  'interaction',
];

/**
 * Classify test intent from user prompt and website analysis
 * Enhanced with accessibility parser routing logic.
 * 
 * Requirements: 1.6, 7.1, 7.2
 * 
 * @param userPrompt - The user's test generation prompt
 * @param websiteAnalysis - Analysis of the website structure
 * @returns TestIntent object with classification results
 */
export function classifyTestIntent(
  userPrompt: string,
  websiteAnalysis: WebsiteAnalysis
): TestIntent {
  const promptLower = userPrompt.toLowerCase();
  
  // Find matching keywords for each category
  const accessibilityMatches = ACCESSIBILITY_KEYWORDS.filter(kw => 
    promptLower.includes(kw.toLowerCase())
  );
  
  const apiMatches = API_KEYWORDS.filter(kw => 
    promptLower.includes(kw.toLowerCase())
  );
  
  const functionalMatches = FUNCTIONAL_KEYWORDS.filter(kw => 
    promptLower.includes(kw.toLowerCase())
  );
  
  // NEW: Check for security keywords
  const securityMatches = SECURITY_KEYWORDS.filter(kw => 
    promptLower.includes(kw.toLowerCase())
  );
  
  // NEW: Check for enhanced accessibility keywords
  const enhancedAccessibilityMatches = ENHANCED_ACCESSIBILITY_KEYWORDS.filter(kw =>
    promptLower.includes(kw.toLowerCase())
  );
  
  // Calculate confidence scores based on keyword density
  // Score = (matches / total keywords) weighted by match count
  const accessibilityScore = calculateConfidenceScore(
    accessibilityMatches.length,
    ACCESSIBILITY_KEYWORDS.length,
    promptLower,
    accessibilityMatches
  );
  
  const apiScore = calculateConfidenceScore(
    apiMatches.length,
    API_KEYWORDS.length,
    promptLower,
    apiMatches
  );
  
  const functionalScore = calculateConfidenceScore(
    functionalMatches.length,
    FUNCTIONAL_KEYWORDS.length,
    promptLower,
    functionalMatches
  );
  
  // NEW: Calculate security score
  const securityScore = calculateConfidenceScore(
    securityMatches.length,
    SECURITY_KEYWORDS.length,
    promptLower,
    securityMatches
  );
  
  // Adjust scores based on website analysis context
  const adjustedScores = adjustScoresWithContext(
    { accessibility: accessibilityScore, api: apiScore, functional: functionalScore, security: securityScore },
    websiteAnalysis
  );
  
  // Sort scores to determine primary and secondary types
  const scoredTypes = [
    { type: 'accessibility' as const, score: adjustedScores.accessibility },
    { type: 'api' as const, score: adjustedScores.api },
    { type: 'functional' as const, score: adjustedScores.functional },
    { type: 'security' as const, score: adjustedScores.security },
  ].sort((a, b) => b.score - a.score);
  
  // Determine primary type (highest score, or 'functional' if all scores are 0)
  const primaryType = scoredTypes[0].score > 0 ? scoredTypes[0].type : 'functional';
  const confidence = scoredTypes[0].score;
  
  // Determine secondary types (score > 0 and not primary)
  // Lower threshold to ensure any detected keywords result in secondary type
  const secondaryTypes = scoredTypes
    .slice(1)
    .filter(s => s.score > 0)
    .map(s => s.type);
  
  // If multiple types have high scores (> 0.6), mark as 'mixed'
  const highScoreTypes = scoredTypes.filter(s => s.score > 0.6);
  const finalPrimaryType = highScoreTypes.length >= 2
    ? 'mixed'
    : primaryType;
  
  // NEW: Determine if enhanced accessibility parser should be used
  // Requirements: 1.6, 7.1, 7.2
  const useEnhancedAccessibilityParser = shouldUseEnhancedAccessibilityParser(
    finalPrimaryType,
    secondaryTypes,
    enhancedAccessibilityMatches,
    accessibilityMatches,
    promptLower
  );
  
  return {
    primaryType: finalPrimaryType,
    secondaryTypes,
    confidence,
    detectedKeywords: {
      accessibility: accessibilityMatches,
      api: apiMatches,
      functional: functionalMatches,
      security: securityMatches,
    },
    useEnhancedAccessibilityParser, // NEW: Include routing flag
  };
}

/**
 * Determine if enhanced accessibility parser should be used
 * 
 * Requirements: 1.6, 7.1, 7.2
 * 
 * @param primaryType - Primary test type
 * @param secondaryTypes - Secondary test types
 * @param enhancedMatches - Enhanced accessibility keyword matches
 * @param basicMatches - Basic accessibility keyword matches
 * @param prompt - User prompt (lowercase)
 * @returns Boolean indicating if enhanced parser should be used
 */
function shouldUseEnhancedAccessibilityParser(
  primaryType: string,
  secondaryTypes: string[],
  enhancedMatches: string[],
  basicMatches: string[],
  prompt: string
): boolean {
  // Use enhanced parser if accessibility is primary type
  if (primaryType === 'accessibility') {
    return true;
  }
  
  // Use enhanced parser if mixed type with accessibility keywords
  if (primaryType === 'mixed' && basicMatches.length > 0) {
    return true;
  }
  
  // Use enhanced parser if accessibility is secondary type and enhanced keywords detected
  if (secondaryTypes.includes('accessibility') && enhancedMatches.length > 0) {
    return true;
  }
  
  // Use enhanced parser for specific accessibility patterns even if not primary type
  const specificAccessibilityPatterns = [
    'wcag', 'aria', 'screen reader', 'keyboard navigation', 'accessibility',
    'a11y', 'contrast', 'focus', 'semantic', 'alt text', 'label',
    'press tab', 'tab key', 'tab twice', 'keyboard', 'focus'
  ];
  
  const hasSpecificPatterns = specificAccessibilityPatterns.some(pattern =>
    prompt.includes(pattern)
  );
  
  if (hasSpecificPatterns) {
    return true;
  }
  
  // Use enhanced parser if multiple enhanced accessibility keywords detected
  if (enhancedMatches.length >= 2) {
    return true;
  }
  
  // Default to basic parser
  return false;
}

/**
 * Calculate confidence score for a test type
 * 
 * @param matchCount - Number of keywords matched
 * @param totalKeywords - Total keywords in the category
 * @param prompt - The user prompt (lowercase)
 * @param matches - Array of matched keywords
 * @returns Confidence score between 0 and 1
 */
function calculateConfidenceScore(
  matchCount: number,
  totalKeywords: number,
  prompt: string,
  matches: string[]
): number {
  if (matchCount === 0) return 0;
  
  // Base score: Even a single keyword match should give high confidence
  // Use a logarithmic scale to give significant weight to first few matches
  const baseScore = Math.min(0.7 + (matchCount - 1) * 0.1, 0.95);
  
  // Boost score based on multiple occurrences of same keyword
  let occurrenceBoost = 0;
  matches.forEach(keyword => {
    const regex = new RegExp(keyword.toLowerCase(), 'g');
    const occurrences = (prompt.match(regex) || []).length;
    if (occurrences > 1) {
      occurrenceBoost += 0.05 * (occurrences - 1);
    }
  });
  
  // Boost score if multiple different keywords are present
  const diversityBoost = matchCount > 1 ? 0.05 * Math.min(matchCount - 1, 2) : 0;
  
  // Calculate final score (capped at 1.0)
  const finalScore = Math.min(baseScore + occurrenceBoost + diversityBoost, 1.0);
  
  return finalScore;
}

/**
 * Adjust confidence scores based on website analysis context
 * 
 * @param scores - Initial confidence scores
 * @param websiteAnalysis - Website structure analysis
 * @returns Adjusted confidence scores
 */
function adjustScoresWithContext(
  scores: { accessibility: number; api: number; functional: number; security: number },
  websiteAnalysis: WebsiteAnalysis
): { accessibility: number; api: number; functional: number; security: number } {
  const adjusted = { ...scores };
  
  // Check for interactive elements (boosts functional/accessibility)
  const hasInteractiveElements = websiteAnalysis.allInteractive && 
    websiteAnalysis.allInteractive.length > 0;
  
  if (hasInteractiveElements) {
    // Boost functional score slightly if interactive elements exist
    adjusted.functional = Math.min(adjusted.functional + 0.1, 1.0);
    
    // Check for accessibility attributes in elements
    const hasAccessibilityAttributes = websiteAnalysis.allInteractive?.some(el =>
      el.ariaLabel || el.role || el.ariaLabel
    );
    
    if (hasAccessibilityAttributes && adjusted.accessibility > 0) {
      // Boost accessibility score if ARIA attributes are present
      adjusted.accessibility = Math.min(adjusted.accessibility + 0.15, 1.0);
    }
  }
  
  // Check for forms (boosts functional)
  const hasForms = websiteAnalysis.forms && websiteAnalysis.forms.length > 0;
  if (hasForms && adjusted.functional > 0) {
    adjusted.functional = Math.min(adjusted.functional + 0.1, 1.0);
  }
  
  // API testing typically doesn't depend on website structure
  // So we don't adjust API score based on website analysis
  
  return adjusted;
}
