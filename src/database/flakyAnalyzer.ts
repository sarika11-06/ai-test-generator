import { TestExecution, FlakyTest, saveFlakyTest, getTestExecutions } from './queries';

export interface FlakyAnalysisResult {
  isFlakey: boolean;
  flakinessScore: number;
  timingVariance: number;
  failureRate: number;
  rootCauses: string[];
  recommendation: string;
}

export class FlakyTestAnalyzer {
  private readonly MIN_EXECUTIONS = 3;
  private readonly FLAKY_THRESHOLD = 30;
  private readonly HIGH_VARIANCE_THRESHOLD = 50;
  private readonly DOM_STABILITY_THRESHOLD = 70;

  /**
   * Analyze test executions to determine if a test is flaky
   */
  public analyze(executions: TestExecution[]): FlakyAnalysisResult {
    if (executions.length < this.MIN_EXECUTIONS) {
      return {
        isFlakey: false,
        flakinessScore: 0,
        timingVariance: 0,
        failureRate: 0,
        rootCauses: [],
        recommendation: `Need at least ${this.MIN_EXECUTIONS} executions for analysis`
      };
    }

    const totalRuns = executions.length;
    const failedRuns = executions.filter(e => e.status === 'failed').length;
    const passedRuns = totalRuns - failedRuns;
    
    // Calculate failure rate
    const failureRate = (failedRuns / totalRuns) * 100;
    
    // Calculate timing variance
    const timingVariance = this.calculateTimingVariance(executions);
    
    // Calculate DOM stability issues
    const domStabilityIssues = this.analyzeDOMStability(executions);
    
    // Calculate wait condition failures
    const waitConditionIssues = this.analyzeWaitConditions(executions);
    
    // Determine if test is flaky
    const hasIntermittentFailures = failedRuns > 0 && passedRuns > 0;
    const hasHighVariance = timingVariance > this.HIGH_VARIANCE_THRESHOLD;
    const hasStabilityIssues = domStabilityIssues.averageScore < this.DOM_STABILITY_THRESHOLD;
    
    const isFlakey = hasIntermittentFailures && (hasHighVariance || hasStabilityIssues || waitConditionIssues.hasIssues);
    
    // Calculate flakiness score
    let flakinessScore = 0;
    if (isFlakey) {
      flakinessScore = this.calculateFlakinessScore({
        failureRate,
        timingVariance,
        domStabilityScore: domStabilityIssues.averageScore,
        waitConditionFailures: waitConditionIssues.averageFailures
      });
    }
    
    // Identify root causes
    const rootCauses = this.identifyRootCauses({
      hasHighVariance,
      hasStabilityIssues,
      waitConditionIssues,
      failureRate,
      timingVariance
    });
    
    // Generate recommendation
    const recommendation = this.generateRecommendation(rootCauses, flakinessScore);
    
    return {
      isFlakey,
      flakinessScore: Math.round(flakinessScore * 10) / 10,
      timingVariance: Math.round(timingVariance * 10) / 10,
      failureRate: Math.round(failureRate * 10) / 10,
      rootCauses,
      recommendation
    };
  }

  /**
   * Analyze all test cases for flakiness and save results
   */
  public async analyzeAllTests(): Promise<{
    analyzed: number;
    flakyFound: number;
    results: FlakyTest[];
  }> {
    const { getAllTestCases, getTestExecutions, getFlakyTest, saveFlakyTest } = await import('./queries');
    
    console.log('🔍 Starting comprehensive flaky test analysis...');
    
    // Get all test cases from database
    const allTestCases = await getAllTestCases();
    console.log(`📊 Found ${allTestCases.length} test cases to analyze`);
    
    let analyzed = 0;
    let flakyFound = 0;
    const results: any[] = [];
    
    for (const testCase of allTestCases) {
      try {
        console.log(`🔍 Analyzing test case: ${testCase.test_case_id}`);
        
        // Get executions for this test case
        const executions = await getTestExecutions(testCase.test_case_id);
        
        if (executions.length < this.MIN_EXECUTIONS) {
          console.log(`⚠️ Skipping ${testCase.test_case_id}: only ${executions.length} executions (need ${this.MIN_EXECUTIONS})`);
          continue;
        }
        
        // Analyze the executions
        const analysis = this.analyze(executions);
        analyzed++;
        
        if (analysis.isFlakey) {
          console.log(`🚨 Flaky test detected: ${testCase.test_case_id} (score: ${analysis.flakinessScore})`);
          
          // Check if flaky test record already exists
          const existingFlakyTest = await getFlakyTest(testCase.test_case_id);
          
          const lastFailedExecution = executions.find(e => e.status === 'failed');
          
          const flakyTestData = {
            test_case_id: testCase.test_case_id,
            flakiness_score: analysis.flakinessScore,
            timing_variance: analysis.timingVariance,
            failure_rate: analysis.failureRate,
            total_runs: executions.length,
            failed_runs: executions.filter(e => e.status === 'failed').length,
            root_causes: analysis.rootCauses,
            last_failed_at: lastFailedExecution?.executed_at
          };
          
          if (existingFlakyTest) {
            console.log(`📝 Updating existing flaky test record for: ${testCase.test_case_id}`);
            // Update existing record (this will be handled by the UPSERT in saveFlakyTest)
          } else {
            console.log(`📝 Creating new flaky test record for: ${testCase.test_case_id}`);
          }
          
          const savedFlakyTest = await saveFlakyTest(flakyTestData);
          results.push(savedFlakyTest);
          flakyFound++;
        } else {
          console.log(`✅ Test appears stable: ${testCase.test_case_id}`);
        }
        
      } catch (error) {
        console.error(`❌ Error analyzing test case ${testCase.test_case_id}:`, error);
      }
    }
    
    console.log(`🎉 Analysis complete: ${analyzed} tests analyzed, ${flakyFound} flaky tests found`);
    
    return {
      analyzed,
      flakyFound,
      results
    };
  }

  /**
   * Analyze a specific test case for flakiness
   */
  public async analyzeTestCase(testCaseId: string): Promise<FlakyAnalysisResult> {
    const executions = await getTestExecutions(testCaseId);
    const analysis = this.analyze(executions);
    
    if (analysis.isFlakey) {
      // Save flaky test to database
      const lastFailedExecution = executions.find(e => e.status === 'failed');
      
      await saveFlakyTest({
        test_case_id: testCaseId,
        flakiness_score: analysis.flakinessScore,
        timing_variance: analysis.timingVariance,
        failure_rate: analysis.failureRate,
        total_runs: executions.length,
        failed_runs: executions.filter(e => e.status === 'failed').length,
        root_causes: analysis.rootCauses,
        last_failed_at: lastFailedExecution?.executed_at
      });
    }
    
    return analysis;
  }

  private calculateTimingVariance(executions: TestExecution[]): number {
    const times = executions.map(e => e.execution_time);
    
    if (times.length < 2) return 0;
    
    const mean = times.reduce((sum, time) => sum + time, 0) / times.length;
    const variance = times.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) / times.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Return coefficient of variation as percentage
    return (standardDeviation / mean) * 100;
  }

  private analyzeDOMStability(executions: TestExecution[]): {
    averageScore: number;
    hasIssues: boolean;
  } {
    const scores = executions
      .map(e => e.dom_stability_score)
      .filter(score => score !== null && score !== undefined) as number[];
    
    if (scores.length === 0) {
      return { averageScore: 100, hasIssues: false };
    }
    
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const hasIssues = averageScore < this.DOM_STABILITY_THRESHOLD;
    
    return { averageScore, hasIssues };
  }

  private analyzeWaitConditions(executions: TestExecution[]): {
    averageFailures: number;
    hasIssues: boolean;
  } {
    const failures = executions.map(e => e.wait_condition_failures || 0);
    const averageFailures = failures.reduce((sum, f) => sum + f, 0) / failures.length;
    const hasIssues = averageFailures > 1;
    
    return { averageFailures, hasIssues };
  }

  private calculateFlakinessScore(metrics: {
    failureRate: number;
    timingVariance: number;
    domStabilityScore: number;
    waitConditionFailures: number;
  }): number {
    const weights = {
      failureRate: 0.4,
      timingVariance: 0.3,
      domStability: 0.2,
      waitConditions: 0.1
    };
    
    const normalizedDomStability = Math.max(0, 100 - metrics.domStabilityScore);
    const normalizedWaitConditions = Math.min(100, metrics.waitConditionFailures * 20);
    
    return (
      metrics.failureRate * weights.failureRate +
      Math.min(100, metrics.timingVariance) * weights.timingVariance +
      normalizedDomStability * weights.domStability +
      normalizedWaitConditions * weights.waitConditions
    );
  }

  private identifyRootCauses(analysis: {
    hasHighVariance: boolean;
    hasStabilityIssues: boolean;
    waitConditionIssues: { hasIssues: boolean };
    failureRate: number;
    timingVariance: number;
  }): string[] {
    const causes: string[] = [];
    
    if (analysis.hasHighVariance) {
      causes.push('High timing variance detected');
    }
    
    if (analysis.hasStabilityIssues) {
      causes.push('DOM stability issues');
    }
    
    if (analysis.waitConditionIssues.hasIssues) {
      causes.push('Wait condition failures');
    }
    
    if (analysis.failureRate > 20 && analysis.failureRate < 80) {
      causes.push('Intermittent failures');
    }
    
    if (analysis.timingVariance > 100) {
      causes.push('Extreme timing inconsistency');
    }
    
    return causes;
  }

  /**
   * Generate sample test executions for demonstration purposes
   * This creates realistic test execution patterns including some flaky ones
   */
  public async generateSampleExecutions(): Promise<{
    testCasesCreated: number;
    executionsCreated: number;
  }> {
    const { saveTestCase, saveTestExecution } = await import('./queries');
    
    console.log('🎭 Generating sample test executions for flaky analysis demo...');
    
    // Sample test cases with different flakiness patterns
    const sampleTestCases = [
      {
        test_case_id: 'LOGIN_TEST_001',
        title: 'User Login Functionality',
        description: 'Test user login with valid credentials',
        type: 'Functional',
        priority: 'High',
        steps: [{ action: 'Navigate to login page' }, { action: 'Enter credentials' }, { action: 'Click login' }],
        expected_result: 'User successfully logs in',
        website_url: 'https://example.com/login'
      },
      {
        test_case_id: 'SEARCH_TEST_002',
        title: 'Search Functionality',
        description: 'Test search with various queries',
        type: 'Functional',
        priority: 'Medium',
        steps: [{ action: 'Navigate to search page' }, { action: 'Enter search term' }, { action: 'Click search' }],
        expected_result: 'Search results are displayed',
        website_url: 'https://example.com/search'
      },
      {
        test_case_id: 'CHECKOUT_TEST_003',
        title: 'Checkout Process',
        description: 'Test e-commerce checkout flow',
        type: 'Functional',
        priority: 'High',
        steps: [{ action: 'Add item to cart' }, { action: 'Go to checkout' }, { action: 'Complete payment' }],
        expected_result: 'Order is successfully placed',
        website_url: 'https://example.com/checkout'
      },
      {
        test_case_id: 'FORM_TEST_004',
        title: 'Contact Form Submission',
        description: 'Test contact form validation and submission',
        type: 'Functional',
        priority: 'Medium',
        steps: [{ action: 'Fill contact form' }, { action: 'Submit form' }],
        expected_result: 'Form is submitted successfully',
        website_url: 'https://example.com/contact'
      },
      {
        test_case_id: 'API_TEST_005',
        title: 'API Response Validation',
        description: 'Test API endpoint response times and data',
        type: 'API',
        priority: 'High',
        steps: [{ action: 'Send API request' }, { action: 'Validate response' }],
        expected_result: 'API returns valid response',
        website_url: 'https://api.example.com/users'
      }
    ];
    
    // Create test cases
    let testCasesCreated = 0;
    for (const testCase of sampleTestCases) {
      try {
        await saveTestCase(testCase);
        testCasesCreated++;
        console.log(`✅ Created test case: ${testCase.test_case_id}`);
      } catch (error) {
        console.log(`⚠️ Test case ${testCase.test_case_id} may already exist`);
      }
    }
    
    // Generate execution patterns for each test case
    let executionsCreated = 0;
    const now = new Date();
    
    for (const testCase of sampleTestCases) {
      const executionCount = Math.floor(Math.random() * 15) + 10; // 10-25 executions
      
      // Determine flakiness pattern for this test case
      let flakinessPattern = 'stable';
      if (testCase.test_case_id === 'CHECKOUT_TEST_003') {
        flakinessPattern = 'highly_flaky'; // 40% failure rate
      } else if (testCase.test_case_id === 'API_TEST_005') {
        flakinessPattern = 'timing_flaky'; // High timing variance
      } else if (testCase.test_case_id === 'SEARCH_TEST_002') {
        flakinessPattern = 'occasionally_flaky'; // 15% failure rate
      }
      
      console.log(`🎯 Generating ${executionCount} executions for ${testCase.test_case_id} (pattern: ${flakinessPattern})`);
      
      for (let i = 0; i < executionCount; i++) {
        const executionDate = new Date(now.getTime() - (executionCount - i) * 24 * 60 * 60 * 1000); // Spread over days
        
        let status = 'passed';
        let executionTime = 1000 + Math.random() * 2000; // Base 1-3 seconds
        let domStabilityScore = 85 + Math.random() * 15; // Generally stable
        let waitConditionFailures = 0;
        let networkCallCount = Math.floor(Math.random() * 5) + 1;
        let errorMessage = null;
        
        // Apply flakiness patterns
        switch (flakinessPattern) {
          case 'highly_flaky':
            if (Math.random() < 0.4) { // 40% failure rate
              status = 'failed';
              errorMessage = 'Timeout waiting for payment confirmation';
              domStabilityScore = 30 + Math.random() * 40;
              waitConditionFailures = Math.floor(Math.random() * 3) + 1;
            }
            executionTime += Math.random() * 3000; // High variance
            break;
            
          case 'timing_flaky':
            if (Math.random() < 0.15) { // 15% failure rate
              status = 'failed';
              errorMessage = 'API response timeout';
            }
            executionTime += Math.random() * 5000; // Very high timing variance
            networkCallCount += Math.floor(Math.random() * 10);
            break;
            
          case 'occasionally_flaky':
            if (Math.random() < 0.15) { // 15% failure rate
              status = 'failed';
              errorMessage = 'Search results not loaded in time';
              waitConditionFailures = 1;
            }
            executionTime += Math.random() * 1500; // Moderate variance
            break;
            
          case 'stable':
          default:
            if (Math.random() < 0.05) { // 5% failure rate (normal)
              status = 'failed';
              errorMessage = 'Network connectivity issue';
            }
            executionTime += Math.random() * 500; // Low variance
            break;
        }
        
        const execution = {
          test_case_id: testCase.test_case_id,
          status: status as 'passed' | 'failed',
          execution_time: Math.round(executionTime),
          dom_stability_score: Math.round(domStabilityScore),
          wait_condition_failures: waitConditionFailures,
          network_call_count: networkCallCount,
          error_message: errorMessage || undefined,
          results: {
            pattern: flakinessPattern,
            execution_number: i + 1,
            simulated: true
          }
        };
        
        // Set the execution date
        await saveTestExecution(execution);
        
        // Update the executed_at timestamp manually (since we want historical data)
        const { pool } = await import('./connection');
        const client = await pool.connect();
        try {
          await client.query(
            'UPDATE test_executions SET executed_at = $1 WHERE test_case_id = $2 AND id = (SELECT MAX(id) FROM test_executions WHERE test_case_id = $2)',
            [executionDate, testCase.test_case_id]
          );
        } finally {
          client.release();
        }
        
        executionsCreated++;
      }
    }
    
    console.log(`🎉 Sample data generation complete: ${testCasesCreated} test cases, ${executionsCreated} executions`);
    
    return {
      testCasesCreated,
      executionsCreated
    };
  }

  private generateRecommendation(rootCauses: string[], flakinessScore: number): string {
    if (flakinessScore === 0) {
      return 'Test appears stable';
    }
    
    const recommendations: string[] = [];
    
    if (rootCauses.includes('High timing variance detected')) {
      recommendations.push('Add explicit waits and reduce timing dependencies');
    }
    
    if (rootCauses.includes('DOM stability issues')) {
      recommendations.push('Improve element selection strategies and wait for DOM stability');
    }
    
    if (rootCauses.includes('Wait condition failures')) {
      recommendations.push('Review and optimize wait conditions');
    }
    
    if (rootCauses.includes('Intermittent failures')) {
      recommendations.push('Investigate race conditions and async operations');
    }
    
    if (flakinessScore > 70) {
      recommendations.push('Consider rewriting test with more robust selectors');
    }
    
    return recommendations.length > 0 
      ? recommendations.join('; ')
      : 'Monitor test execution patterns and investigate failure causes';
  }
}