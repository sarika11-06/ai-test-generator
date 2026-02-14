/**
 * Axe-Core Scanning and Reporting Module
 * 
 * This module provides advanced scanning capabilities and comprehensive reporting
 * for accessibility violations, with intelligent test failure logic and detailed
 * violation analysis.
 */

import { AxeCoreConfiguration, AxeViolation, ViolationHandlingStrategy, WCAGRuleset } from './axeCoreIntegration';

export interface AccessibilityScanResult {
  violations: AxeViolation[];
  incomplete: any[];
  passes: any[];
  timestamp: string;
  url: string;
  scanDuration: number;
  wcagLevel: string;
  summary: AccessibilitySummary;
}

export interface AccessibilitySummary {
  totalViolations: number;
  criticalViolations: number;
  seriousViolations: number;
  moderateViolations: number;
  minorViolations: number;
  incompleteChecks: number;
  passedChecks: number;
  overallScore: number; // 0-100 accessibility score
}

export interface ViolationReport {
  id: string;
  impact: string;
  description: string;
  help: string;
  helpUrl: string;
  wcagCriteria: string[];
  nodeCount: number;
  affectedElements: string[];
  remediationSteps: string[];
  codeExample?: string;
}

export class AxeCoreScanningReporter {
  private config: AxeCoreConfiguration;

  constructor(config: AxeCoreConfiguration) {
    this.config = config;
  }

  /**
   * Generates comprehensive Axe-Core scanning code with violation reporting
   */
  generateAdvancedScanningCode(): string {
    return `
// Advanced Axe-Core scanning with comprehensive reporting
async function performComprehensiveAccessibilityScan(page, scanConfig = {}) {
  const startTime = Date.now();
  
  console.log('🔍 Starting comprehensive accessibility scan...');
  
  // Configure Axe-Core with advanced options
  const axeBuilder = new AxeBuilder({ page })
    .withTags([${this.config.rulesets.map(r => `'${r}'`).join(', ')}])
    .options({
      timeout: ${this.config.timeout},
      resultTypes: ['violations', 'incomplete', 'passes'],
      runOnly: {
        type: 'tag',
        values: [${this.config.rulesets.map(r => `'${r}'`).join(', ')}]
      },
      ...scanConfig
    });

  ${this.config.includeIframes ? `
  // Include iframes in scan
  axeBuilder.include('iframe');
  console.log('📄 Including iframes in accessibility scan');` : ''}

  try {
    // Perform the accessibility scan
    const results = await axeBuilder.analyze();
    const scanDuration = Date.now() - startTime;
    
    // Process and enhance results
    const processedResults = await processAccessibilityResults(results, page.url(), scanDuration);
    
    console.log(\`✅ Accessibility scan completed in \${scanDuration}ms\`);
    return processedResults;
    
  } catch (error) {
    console.error('❌ Accessibility scan failed:', error);
    throw new Error(\`Accessibility scan failed: \${error.message}\`);
  }
}

// Process and enhance accessibility results
async function processAccessibilityResults(rawResults, url, scanDuration) {
  const summary = calculateAccessibilitySummary(rawResults);
  
  const processedResults = {
    violations: rawResults.violations.map(enhanceViolation),
    incomplete: rawResults.incomplete,
    passes: rawResults.passes,
    timestamp: new Date().toISOString(),
    url: url,
    scanDuration: scanDuration,
    wcagLevel: '${this.config.rulesets.join(', ')}',
    summary: summary
  };
  
  return processedResults;
}

// Calculate accessibility summary and score
function calculateAccessibilitySummary(results) {
  const criticalViolations = results.violations.filter(v => v.impact === 'critical').length;
  const seriousViolations = results.violations.filter(v => v.impact === 'serious').length;
  const moderateViolations = results.violations.filter(v => v.impact === 'moderate').length;
  const minorViolations = results.violations.filter(v => v.impact === 'minor').length;
  
  // Calculate accessibility score (0-100)
  const totalChecks = results.violations.length + results.passes.length;
  const weightedViolations = (criticalViolations * 4) + (seriousViolations * 3) + (moderateViolations * 2) + (minorViolations * 1);
  const maxPossibleScore = totalChecks * 4;
  const score = maxPossibleScore > 0 ? Math.max(0, Math.round(((maxPossibleScore - weightedViolations) / maxPossibleScore) * 100)) : 100;
  
  return {
    totalViolations: results.violations.length,
    criticalViolations,
    seriousViolations,
    moderateViolations,
    minorViolations,
    incompleteChecks: results.incomplete.length,
    passedChecks: results.passes.length,
    overallScore: score
  };
}

// Enhance violation with additional context and remediation guidance
function enhanceViolation(violation) {
  return {
    ...violation,
    wcagCriteria: extractWCAGCriteria(violation),
    remediationSteps: generateRemediationSteps(violation),
    affectedElements: violation.nodes.map(node => node.target.join(' > ')),
    codeExample: generateCodeExample(violation)
  };
}

// Extract WCAG criteria from violation
function extractWCAGCriteria(violation) {
  const wcagMap = {
    'color-contrast': ['1.4.3', '1.4.6'],
    'keyboard': ['2.1.1', '2.1.2'],
    'focus-order': ['2.4.3'],
    'link-name': ['2.4.4', '4.1.2'],
    'button-name': ['4.1.2'],
    'image-alt': ['1.1.1'],
    'form-field-multiple-labels': ['3.3.2'],
    'heading-order': ['1.3.1'],
    'landmark-one-main': ['1.3.6'],
    'page-has-heading-one': ['2.4.6'],
    'region': ['1.3.6']
  };
  
  return wcagMap[violation.id] || [];
}

// Generate remediation steps for common violations
function generateRemediationSteps(violation) {
  const remediationMap = {
    'color-contrast': [
      'Increase the contrast ratio between text and background colors',
      'Use tools like WebAIM Contrast Checker to verify ratios',
      'Ensure minimum 4.5:1 ratio for normal text, 3:1 for large text'
    ],
    'keyboard': [
      'Ensure all interactive elements are keyboard accessible',
      'Add proper tabindex values where needed',
      'Implement keyboard event handlers for custom controls'
    ],
    'image-alt': [
      'Add meaningful alt text to images',
      'Use empty alt="" for decorative images',
      'Describe the purpose or content of the image'
    ],
    'link-name': [
      'Provide descriptive link text',
      'Avoid generic text like "click here" or "read more"',
      'Use aria-label or aria-labelledby for additional context'
    ],
    'button-name': [
      'Ensure buttons have accessible names',
      'Use text content, aria-label, or aria-labelledby',
      'Avoid empty or generic button labels'
    ]
  };
  
  return remediationMap[violation.id] || [
    'Review the accessibility violation details',
    'Consult WCAG guidelines for specific requirements',
    'Test with assistive technologies after fixing'
  ];
}

// Generate code example for fixing the violation
function generateCodeExample(violation) {
  const codeExamples = {
    'image-alt': \`<!-- Before -->
<img src="chart.png">

<!-- After -->
<img src="chart.png" alt="Sales increased 25% from Q1 to Q2 2024">\`,
    
    'link-name': \`<!-- Before -->
<a href="/article">Read more</a>

<!-- After -->
<a href="/article">Read more about accessibility testing</a>\`,
    
    'button-name': \`<!-- Before -->
<button><i class="icon-save"></i></button>

<!-- After -->
<button aria-label="Save document"><i class="icon-save"></i></button>\`,
    
    'color-contrast': \`/* Before */
.text { color: #999; background: #fff; } /* 2.8:1 ratio */

/* After */
.text { color: #666; background: #fff; } /* 4.5:1 ratio */\`
  };
  
  return codeExamples[violation.id] || null;
}`.trim();
  }

  /**
   * Generates test failure logic for critical accessibility violations
   */
  generateTestFailureLogic(): string {
    return `
// Test failure logic based on violation handling strategy
async function handleAccessibilityViolations(scanResults, strategy = '${this.config.violationHandling}') {
  const { violations, summary } = scanResults;
  
  switch (strategy) {
    case '${ViolationHandlingStrategy.FAIL_ON_ANY}':
      if (violations.length > 0) {
        await generateViolationReport(scanResults);
        throw new Error(\`❌ Test failed: Found \${violations.length} accessibility violations\`);
      }
      break;
      
    case '${ViolationHandlingStrategy.FAIL_ON_CRITICAL}':
      const criticalViolations = violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
      if (criticalViolations.length > 0) {
        await generateViolationReport(scanResults, criticalViolations);
        throw new Error(\`❌ Test failed: Found \${criticalViolations.length} critical accessibility violations\`);
      }
      
      // Log minor violations as warnings
      const minorViolations = violations.filter(v => v.impact === 'minor' || v.impact === 'moderate');
      if (minorViolations.length > 0) {
        console.warn(\`⚠️  Found \${minorViolations.length} minor accessibility issues (not failing test)\`);
        await generateViolationReport(scanResults, minorViolations, 'warning');
      }
      break;
      
    case '${ViolationHandlingStrategy.LOG_ONLY}':
      if (violations.length > 0) {
        console.log(\`📊 Found \${violations.length} accessibility violations (logging only)\`);
        await generateViolationReport(scanResults, violations, 'info');
      }
      break;
      
    default:
      console.log(\`Accessibility scan completed with \${violations.length} violations\`);
  }
  
  // Log accessibility score
  console.log(\`🎯 Accessibility Score: \${summary.overallScore}/100\`);
  
  return scanResults;
}`.trim();
  }

  /**
   * Generates comprehensive violation reporting code
   */
  generateViolationReportingCode(): string {
    return `
// Generate detailed violation report
async function generateViolationReport(scanResults, specificViolations = null, logLevel = 'error') {
  const { violations, summary, timestamp, url } = scanResults;
  const violationsToReport = specificViolations || violations;
  
  const report = {
    metadata: {
      timestamp,
      url,
      scanDuration: scanResults.scanDuration,
      wcagLevel: scanResults.wcagLevel,
      accessibilityScore: summary.overallScore
    },
    summary: {
      total: summary.totalViolations,
      critical: summary.criticalViolations,
      serious: summary.seriousViolations,
      moderate: summary.moderateViolations,
      minor: summary.minorViolations,
      incomplete: summary.incompleteChecks,
      passed: summary.passedChecks
    },
    violations: violationsToReport.map(violation => ({
      id: violation.id,
      impact: violation.impact,
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      wcagCriteria: violation.wcagCriteria,
      nodeCount: violation.nodes.length,
      affectedElements: violation.affectedElements,
      remediationSteps: violation.remediationSteps,
      codeExample: violation.codeExample,
      nodes: violation.nodes.map(node => ({
        target: node.target,
        html: node.html.substring(0, 300) + (node.html.length > 300 ? '...' : ''),
        failureSummary: node.failureSummary
      }))
    }))
  };
  
  // Console output based on log level
  const logFunction = logLevel === 'error' ? console.error : 
                     logLevel === 'warning' ? console.warn : console.log;
  
  logFunction(\`\\n${'='.repeat(80)}\`);
  logFunction(\`📋 ACCESSIBILITY REPORT - \${new Date(timestamp).toLocaleString()}\`);
  logFunction(\`${'='.repeat(80)}\`);
  logFunction(\`🌐 URL: \${url}\`);
  logFunction(\`🎯 Accessibility Score: \${summary.overallScore}/100\`);
  logFunction(\`⏱️  Scan Duration: \${scanResults.scanDuration}ms\`);
  logFunction(\`📊 WCAG Level: \${scanResults.wcagLevel}\`);
  logFunction(\`\\n📈 SUMMARY:\`);
  logFunction(\`   Total Violations: \${summary.totalViolations}\`);
  logFunction(\`   Critical: \${summary.criticalViolations} | Serious: \${summary.seriousViolations}\`);
  logFunction(\`   Moderate: \${summary.moderateViolations} | Minor: \${summary.minorViolations}\`);
  logFunction(\`   Incomplete Checks: \${summary.incompleteChecks}\`);
  logFunction(\`   Passed Checks: \${summary.passedChecks}\`);
  
  if (violationsToReport.length > 0) {
    logFunction(\`\\n🚨 VIOLATIONS DETAILS:\`);
    violationsToReport.forEach((violation, index) => {
      logFunction(\`\\n\${index + 1}. \${violation.id.toUpperCase()} (\${violation.impact.toUpperCase()})\`);
      logFunction(\`   📝 Description: \${violation.description}\`);
      logFunction(\`   💡 Help: \${violation.help}\`);
      logFunction(\`   🔗 More Info: \${violation.helpUrl}\`);
      
      if (violation.wcagCriteria && violation.wcagCriteria.length > 0) {
        logFunction(\`   📋 WCAG Criteria: \${violation.wcagCriteria.join(', ')}\`);
      }
      
      logFunction(\`   🎯 Affected Elements (\${violation.nodes.length}):\`);
      violation.nodes.slice(0, 3).forEach((node, nodeIndex) => {
        logFunction(\`      \${nodeIndex + 1}. \${node.target.join(' > ')}\`);
        logFunction(\`         HTML: \${node.html.substring(0, 100)}...\`);
      });
      
      if (violation.nodes.length > 3) {
        logFunction(\`      ... and \${violation.nodes.length - 3} more elements\`);
      }
      
      if (violation.remediationSteps && violation.remediationSteps.length > 0) {
        logFunction(\`   🔧 Remediation Steps:\`);
        violation.remediationSteps.forEach((step, stepIndex) => {
          logFunction(\`      \${stepIndex + 1}. \${step}\`);
        });
      }
      
      if (violation.codeExample) {
        logFunction(\`   💻 Code Example:\`);
        logFunction(\`\${violation.codeExample}\`);
      }
    });
  }
  
  logFunction(\`\\n${'='.repeat(80)}\`);
  
  // Return report for further processing
  return report;
}`.trim();
  }

  /**
   * Generates logging code for incomplete accessibility checks
   */
  generateIncompleteChecksLogging(): string {
    return `
// Log incomplete accessibility checks for manual review
function logIncompleteChecks(scanResults) {
  const { incomplete } = scanResults;
  
  if (incomplete.length > 0) {
    console.log(\`\\n🔍 INCOMPLETE ACCESSIBILITY CHECKS (\${incomplete.length}):\`);
    console.log('These checks require manual verification:');
    
    incomplete.forEach((check, index) => {
      console.log(\`\\n\${index + 1}. \${check.id}\`);
      console.log(\`   Description: \${check.description}\`);
      console.log(\`   Help: \${check.help}\`);
      console.log(\`   Elements to review: \${check.nodes.length}\`);
      
      if (check.nodes.length > 0) {
        console.log(\`   Sample elements:\`);
        check.nodes.slice(0, 2).forEach((node, nodeIndex) => {
          console.log(\`      \${nodeIndex + 1}. \${node.target.join(' > ')}\`);
        });
      }
    });
    
    console.log(\`\\n💡 Manual Review Required:\`);
    console.log('Please manually verify these accessibility aspects:');
    incomplete.forEach((check, index) => {
      console.log(\`   • \${check.description}\`);
    });
  }
}`.trim();
  }

  /**
   * Generates complete scanning and reporting integration
   */
  generateCompleteIntegration(): string {
    return `
${this.generateAdvancedScanningCode()}

${this.generateTestFailureLogic()}

${this.generateViolationReportingCode()}

${this.generateIncompleteChecksLogging()}

// Main accessibility testing function
async function runComprehensiveAccessibilityTest(page, testConfig = {}) {
  try {
    // Perform comprehensive scan
    const scanResults = await performComprehensiveAccessibilityScan(page, testConfig.scanOptions);
    
    // Log incomplete checks
    logIncompleteChecks(scanResults);
    
    // Handle violations based on strategy
    await handleAccessibilityViolations(scanResults, testConfig.violationHandling);
    
    // Return results for further processing
    return scanResults;
    
  } catch (error) {
    console.error('❌ Accessibility test failed:', error.message);
    throw error;
  }
}

// Export for use in generated tests
module.exports = {
  runComprehensiveAccessibilityTest,
  performComprehensiveAccessibilityScan,
  handleAccessibilityViolations,
  generateViolationReport,
  logIncompleteChecks
};`.trim();
  }
}

// Export utility functions for test generation
export const ScanningReporterUtils = {
  /**
   * Creates a complete accessibility test with advanced scanning and reporting
   */
  createAdvancedAccessibilityTest: (testName: string, url: string, config: Partial<AxeCoreConfiguration>): string => {
    const reporter = new AxeCoreScanningReporter(config as AxeCoreConfiguration);
    
    return `
test('${testName}', async ({ page }) => {
  ${reporter.generateCompleteIntegration()}
  
  // Navigate to the page
  await page.goto('${url}');
  
  // Wait for page to be fully loaded
  await page.waitForLoadState('networkidle');
  
  // Run comprehensive accessibility test
  const results = await runComprehensiveAccessibilityTest(page, {
    violationHandling: '${config.violationHandling || ViolationHandlingStrategy.FAIL_ON_CRITICAL}',
    scanOptions: {
      timeout: ${config.timeout || 30000}
    }
  });
  
  // Additional assertions can be added here
  expect(results.summary.overallScore).toBeGreaterThan(70); // Minimum 70% accessibility score
});`.trim();
  }
};