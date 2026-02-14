/**
 * Axe-Core Integration Module
 * 
 * This module provides seamless integration with the Axe-Core accessibility testing library
 * for generating comprehensive accessibility test code in Playwright tests.
 * 
 * Features:
 * - Axe-Core import generation and setup code
 * - WCAG rule set configuration (2.0, 2.1, 2.2, Section 508)
 * - Violation reporting and test failure logic
 * - Configurable scanning and reporting options
 */

export interface AxeCoreConfiguration {
  rulesets: WCAGRuleset[];
  tags: string[];
  violationHandling: ViolationHandlingStrategy;
  reportingLevel: 'violations' | 'incomplete' | 'passes' | 'all';
  includeIframes: boolean;
  timeout: number;
}

export enum WCAGRuleset {
  WCAG20A = 'wcag2a',
  WCAG20AA = 'wcag2aa',
  WCAG21A = 'wcag21a',
  WCAG21AA = 'wcag21aa',
  WCAG22AA = 'wcag22aa',
  SECTION508 = 'section508'
}

export enum ViolationHandlingStrategy {
  FAIL_ON_ANY = 'fail-on-any',
  FAIL_ON_CRITICAL = 'fail-on-critical',
  LOG_ONLY = 'log-only',
  CUSTOM = 'custom'
}

export interface AxeViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  help: string;
  helpUrl: string;
  nodes: AxeViolationNode[];
}

export interface AxeViolationNode {
  target: string[];
  html: string;
  failureSummary: string;
}

export class AxeCoreIntegration {
  private config: AxeCoreConfiguration;

  constructor(config: Partial<AxeCoreConfiguration> = {}) {
    this.config = {
      rulesets: [WCAGRuleset.WCAG21AA],
      tags: [],
      violationHandling: ViolationHandlingStrategy.FAIL_ON_CRITICAL,
      reportingLevel: 'violations',
      includeIframes: true,
      timeout: 30000,
      ...config
    };
  }

  /**
   * Generates Axe-Core import statements and setup code for Playwright tests
   */
  generateAxeSetupCode(): string {
    return `
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Axe-Core configuration
const axeConfig = {
  tags: [${this.config.rulesets.map(r => `'${r}'`).join(', ')}],
  timeout: ${this.config.timeout},
  includeIframes: ${this.config.includeIframes}
};

// Helper function to analyze accessibility results
async function analyzeAccessibilityResults(page, testName = 'Accessibility Test') {
  const axeBuilder = new AxeBuilder({ page })
    .withTags([${this.config.rulesets.map(r => `'${r}'`).join(', ')}])
    .options({ timeout: ${this.config.timeout} });
  
  ${this.config.includeIframes ? 'axeBuilder.include("iframe");' : ''}
  
  const results = await axeBuilder.analyze();
  
  // Log test results
  console.log(\`\\n=== \${testName} - Accessibility Scan Results ===\`);
  console.log(\`Violations: \${results.violations.length}\`);
  console.log(\`Incomplete: \${results.incomplete.length}\`);
  console.log(\`Passes: \${results.passes.length}\`);
  
  return results;
}`.trim();
  }

  /**
   * Generates Axe-Core scanning code with specified rule sets
   */
  generateAxeScanCode(customRulesets?: WCAGRuleset[]): string {
    const rulesets = customRulesets || this.config.rulesets;
    
    return `
  // Perform accessibility scan
  const accessibilityResults = await analyzeAccessibilityResults(page, 'Comprehensive Accessibility Scan');
  
  // Configure Axe-Core with specific rulesets
  const axeBuilder = new AxeBuilder({ page })
    .withTags([${rulesets.map(r => `'${r}'`).join(', ')}])
    .options({ 
      timeout: ${this.config.timeout},
      resultTypes: ['${this.config.reportingLevel}']
    });
  
  ${this.config.includeIframes ? 'axeBuilder.include("iframe");' : ''}
  
  const scanResults = await axeBuilder.analyze();`.trim();
  }

  /**
   * Generates assertion code based on violation handling strategy
   */
  generateAxeAssertionCode(customStrategy?: ViolationHandlingStrategy): string {
    const strategy = customStrategy || this.config.violationHandling;
    
    switch (strategy) {
      case ViolationHandlingStrategy.FAIL_ON_ANY:
        return `
  // Fail test if any violations are found
  expect(scanResults.violations).toHaveLength(0);
  
  if (scanResults.violations.length > 0) {
    console.error('\\n❌ Accessibility violations found:');
    scanResults.violations.forEach((violation, index) => {
      console.error(\`\\n\${index + 1}. \${violation.id} (\${violation.impact})\`);
      console.error(\`   Description: \${violation.description}\`);
      console.error(\`   Help: \${violation.help}\`);
      console.error(\`   Help URL: \${violation.helpUrl}\`);
      violation.nodes.forEach((node, nodeIndex) => {
        console.error(\`   Node \${nodeIndex + 1}: \${node.target.join(', ')}\`);
        console.error(\`   HTML: \${node.html}\`);
        console.error(\`   Failure: \${node.failureSummary}\`);
      });
    });
    throw new Error(\`Found \${scanResults.violations.length} accessibility violations\`);
  }`.trim();

      case ViolationHandlingStrategy.FAIL_ON_CRITICAL:
        return `
  // Fail test only on critical and serious violations
  const criticalViolations = scanResults.violations.filter(v => 
    v.impact === 'critical' || v.impact === 'serious'
  );
  
  expect(criticalViolations).toHaveLength(0);
  
  if (criticalViolations.length > 0) {
    console.error('\\n❌ Critical accessibility violations found:');
    criticalViolations.forEach((violation, index) => {
      console.error(\`\\n\${index + 1}. \${violation.id} (\${violation.impact})\`);
      console.error(\`   Description: \${violation.description}\`);
      console.error(\`   Help: \${violation.help}\`);
      console.error(\`   Help URL: \${violation.helpUrl}\`);
      violation.nodes.forEach((node, nodeIndex) => {
        console.error(\`   Node \${nodeIndex + 1}: \${node.target.join(', ')}\`);
        console.error(\`   HTML: \${node.html}\`);
        console.error(\`   Failure: \${node.failureSummary}\`);
      });
    });
    throw new Error(\`Found \${criticalViolations.length} critical accessibility violations\`);
  }
  
  // Log minor and moderate violations as warnings
  const minorViolations = scanResults.violations.filter(v => 
    v.impact === 'minor' || v.impact === 'moderate'
  );
  
  if (minorViolations.length > 0) {
    console.warn(\`\\n⚠️  Found \${minorViolations.length} minor/moderate accessibility issues:\`);
    minorViolations.forEach((violation, index) => {
      console.warn(\`\${index + 1}. \${violation.id} (\${violation.impact}): \${violation.description}\`);
    });
  }`.trim();

      case ViolationHandlingStrategy.LOG_ONLY:
        return `
  // Log all violations without failing the test
  if (scanResults.violations.length > 0) {
    console.log(\`\\n📊 Found \${scanResults.violations.length} accessibility violations:\`);
    scanResults.violations.forEach((violation, index) => {
      console.log(\`\\n\${index + 1}. \${violation.id} (\${violation.impact})\`);
      console.log(\`   Description: \${violation.description}\`);
      console.log(\`   Help: \${violation.help}\`);
      console.log(\`   Help URL: \${violation.helpUrl}\`);
      violation.nodes.forEach((node, nodeIndex) => {
        console.log(\`   Node \${nodeIndex + 1}: \${node.target.join(', ')}\`);
        console.log(\`   HTML: \${node.html}\`);
        console.log(\`   Failure: \${node.failureSummary}\`);
      });
    });
  } else {
    console.log('\\n✅ No accessibility violations found');
  }`.trim();

      default:
        return `
  // Custom violation handling - implement based on specific requirements
  console.log(\`Accessibility scan completed with \${scanResults.violations.length} violations\`);
  // Add custom assertion logic here`.trim();
    }
  }

  /**
   * Generates comprehensive reporting code for accessibility scan results
   */
  generateAxeReportingCode(): string {
    return `
  // Generate comprehensive accessibility report
  const accessibilityReport = {
    timestamp: new Date().toISOString(),
    url: page.url(),
    violations: scanResults.violations.length,
    incomplete: scanResults.incomplete.length,
    passes: scanResults.passes.length,
    wcagLevel: '${this.config.rulesets.join(', ')}',
    details: {
      violations: scanResults.violations.map(v => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        help: v.help,
        helpUrl: v.helpUrl,
        nodeCount: v.nodes.length,
        nodes: v.nodes.map(n => ({
          target: n.target,
          html: n.html.substring(0, 200) + (n.html.length > 200 ? '...' : ''),
          failureSummary: n.failureSummary
        }))
      })),
      incomplete: scanResults.incomplete.map(i => ({
        id: i.id,
        description: i.description,
        nodeCount: i.nodes.length
      }))
    }
  };
  
  // Log detailed report
  console.log('\\n📋 Detailed Accessibility Report:');
  console.log(JSON.stringify(accessibilityReport, null, 2));
  
  // Save report to file (optional)
  // await page.context().storageState({ path: \`accessibility-report-\${Date.now()}.json\` });
  
  return accessibilityReport;`.trim();
  }

  /**
   * Generates complete Axe-Core integration code for a test case
   */
  generateCompleteAxeIntegration(testName: string, customConfig?: Partial<AxeCoreConfiguration>): string {
    const config = { ...this.config, ...customConfig };
    
    return `
test('${testName}', async ({ page }) => {
  ${this.generateAxeSetupCode()}
  
  // Navigate to the page
  await page.goto('/'); // Replace with actual URL
  
  // Wait for page to be fully loaded
  await page.waitForLoadState('networkidle');
  
  ${this.generateAxeScanCode(config.rulesets)}
  
  ${this.generateAxeAssertionCode(config.violationHandling)}
  
  ${this.generateAxeReportingCode()}
});`.trim();
  }

  /**
   * Generates Axe-Core configuration for specific WCAG compliance levels
   */
  generateWCAGComplianceConfig(level: 'A' | 'AA' | 'AAA', version: '2.0' | '2.1' | '2.2' = '2.1'): AxeCoreConfiguration {
    const rulesetMap = {
      '2.0': { A: [WCAGRuleset.WCAG20A], AA: [WCAGRuleset.WCAG20AA], AAA: [WCAGRuleset.WCAG20AA] },
      '2.1': { A: [WCAGRuleset.WCAG21A], AA: [WCAGRuleset.WCAG21AA], AAA: [WCAGRuleset.WCAG21AA] },
      '2.2': { A: [WCAGRuleset.WCAG22AA], AA: [WCAGRuleset.WCAG22AA], AAA: [WCAGRuleset.WCAG22AA] }
    };

    return {
      ...this.config,
      rulesets: rulesetMap[version][level],
      tags: [`wcag${version.replace('.', '')}${level.toLowerCase()}`],
      violationHandling: level === 'AAA' ? ViolationHandlingStrategy.LOG_ONLY : ViolationHandlingStrategy.FAIL_ON_CRITICAL
    };
  }

  /**
   * Generates Section 508 compliance configuration
   */
  generateSection508Config(): AxeCoreConfiguration {
    return {
      ...this.config,
      rulesets: [WCAGRuleset.SECTION508],
      tags: ['section508'],
      violationHandling: ViolationHandlingStrategy.FAIL_ON_CRITICAL
    };
  }

  /**
   * Updates the current configuration
   */
  updateConfig(newConfig: Partial<AxeCoreConfiguration>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Gets the current configuration
   */
  getConfig(): AxeCoreConfiguration {
    return { ...this.config };
  }
}

// Export default instance with standard configuration
export const defaultAxeIntegration = new AxeCoreIntegration({
  rulesets: [WCAGRuleset.WCAG21AA],
  violationHandling: ViolationHandlingStrategy.FAIL_ON_CRITICAL,
  reportingLevel: 'violations',
  includeIframes: true,
  timeout: 30000
});

// Export utility functions for common use cases
export const AxeCoreUtils = {
  /**
   * Creates a basic accessibility test with Axe-Core integration
   */
  createBasicAccessibilityTest: (testName: string, url: string = '/'): string => {
    return defaultAxeIntegration.generateCompleteAxeIntegration(testName).replace("await page.goto('/');", `await page.goto('${url}');`);
  },

  /**
   * Creates WCAG compliance test for specific level
   */
  createWCAGComplianceTest: (level: 'A' | 'AA' | 'AAA', version: '2.0' | '2.1' | '2.2' = '2.1', url: string = '/'): string => {
    const integration = new AxeCoreIntegration();
    const config = integration.generateWCAGComplianceConfig(level, version);
    integration.updateConfig(config);
    return integration.generateCompleteAxeIntegration(`WCAG ${version} ${level} Compliance Test`).replace("await page.goto('/');", `await page.goto('${url}');`);
  },

  /**
   * Creates Section 508 compliance test
   */
  createSection508Test: (url: string = '/'): string => {
    const integration = new AxeCoreIntegration();
    const config = integration.generateSection508Config();
    integration.updateConfig(config);
    return integration.generateCompleteAxeIntegration('Section 508 Compliance Test').replace("await page.goto('/');", `await page.goto('${url}');`);
  }
};