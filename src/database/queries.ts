import { pool } from './connection';

// Types
export interface TestCase {
  id: number;
  test_case_id: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  steps: any[];
  expected_result: string;
  playwright_code?: string;
  website_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface TestExecution {
  id: number;
  test_case_id: string;
  status: 'passed' | 'failed';
  execution_time: number;
  dom_stability_score?: number;
  wait_condition_failures: number;
  network_call_count: number;
  error_message?: string;
  results?: any;
  executed_at: Date;
}

export interface FlakyTest {
  id: number;
  test_case_id: string;
  flakiness_score: number;
  timing_variance: number;
  failure_rate: number;
  total_runs: number;
  failed_runs: number;
  root_causes: any[];
  last_failed_at?: Date;
  is_resolved: boolean;
  detected_at: Date;
}

export interface Website {
  id: number;
  url: string;
  domain: string;
  path?: string;
  created_at: Date;
  updated_at: Date;
}

// Test Case Queries
export async function saveTestCase(testCase: {
  test_case_id: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  steps: any[];
  expected_result: string;
  playwright_code?: string;
  website_url?: string;
}): Promise<TestCase> {
  const client = await pool.connect();
  
  try {
    const query = `
      INSERT INTO test_cases (
        test_case_id, title, description, type, priority, 
        steps, expected_result, playwright_code, website_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (test_case_id) 
      DO UPDATE SET 
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        type = EXCLUDED.type,
        priority = EXCLUDED.priority,
        steps = EXCLUDED.steps,
        expected_result = EXCLUDED.expected_result,
        playwright_code = EXCLUDED.playwright_code,
        website_url = EXCLUDED.website_url,
        updated_at = NOW()
      RETURNING *
    `;
    
    const values = [
      testCase.test_case_id,
      testCase.title,
      testCase.description,
      testCase.type,
      testCase.priority,
      JSON.stringify(testCase.steps),
      testCase.expected_result,
      testCase.playwright_code,
      testCase.website_url
    ];
    
    const result = await client.query(query, values);
    return result.rows[0];
  } finally {
    client.release();
  }
}

export async function getTestCase(testCaseId: string): Promise<TestCase | null> {
  const client = await pool.connect();
  
  try {
    const query = 'SELECT * FROM test_cases WHERE test_case_id = $1';
    const result = await client.query(query, [testCaseId]);
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

export async function getAllTestCases(): Promise<TestCase[]> {
  const client = await pool.connect();
  
  try {
    const query = 'SELECT * FROM test_cases ORDER BY created_at DESC';
    const result = await client.query(query);
    return result.rows;
  } finally {
    client.release();
  }
}

export async function getTestCasesByWebsite(websiteUrl: string): Promise<TestCase[]> {
  const client = await pool.connect();
  
  try {
    const query = 'SELECT * FROM test_cases WHERE website_url = $1 ORDER BY created_at DESC';
    const result = await client.query(query, [websiteUrl]);
    return result.rows;
  } finally {
    client.release();
  }
}

// Test Execution Queries
export async function saveTestExecution(execution: {
  test_case_id: string;
  status: 'passed' | 'failed';
  execution_time: number;
  dom_stability_score?: number;
  wait_condition_failures?: number;
  network_call_count?: number;
  error_message?: string;
  results?: any;
}): Promise<TestExecution> {
  const client = await pool.connect();
  
  try {
    const query = `
      INSERT INTO test_executions (
        test_case_id, status, execution_time, dom_stability_score,
        wait_condition_failures, network_call_count, error_message, results
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const values = [
      execution.test_case_id,
      execution.status,
      execution.execution_time,
      execution.dom_stability_score,
      execution.wait_condition_failures || 0,
      execution.network_call_count || 0,
      execution.error_message,
      execution.results ? JSON.stringify(execution.results) : null
    ];
    
    const result = await client.query(query, values);
    return result.rows[0];
  } finally {
    client.release();
  }
}

export async function getTestExecutions(testCaseId: string): Promise<TestExecution[]> {
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT * FROM test_executions 
      WHERE test_case_id = $1 
      ORDER BY executed_at DESC
    `;
    const result = await client.query(query, [testCaseId]);
    return result.rows;
  } finally {
    client.release();
  }
}

export async function getAllTestExecutions(): Promise<TestExecution[]> {
  const client = await pool.connect();
  
  try {
    const query = 'SELECT * FROM test_executions ORDER BY executed_at DESC';
    const result = await client.query(query);
    return result.rows;
  } finally {
    client.release();
  }
}

// Analyze test executions to find flaky tests (no separate table needed)
export async function analyzeFlakyTests(): Promise<any[]> {
  const client = await pool.connect();
  
  try {
    // Get all executions grouped by test case
    const query = `
      SELECT 
        test_case_id,
        COUNT(*) as total_runs,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_runs,
        SUM(CASE WHEN status = 'passed' THEN 1 ELSE 0 END) as passed_runs,
        AVG(execution_time) as avg_time,
        STDDEV(execution_time) as std_dev
      FROM test_executions
      GROUP BY test_case_id
      HAVING COUNT(*) >= 2 AND 
             SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) > 0 AND
             SUM(CASE WHEN status = 'passed' THEN 1 ELSE 0 END) > 0
      ORDER BY test_case_id
    `;
    
    const result = await client.query(query);
    
    // Calculate flakiness metrics
    const flakyTests = result.rows.map(row => {
      const failureRate = (row.failed_runs / row.total_runs) * 100;
      const timingVariance = row.std_dev ? (row.std_dev / row.avg_time) * 100 : 0;
      const flakiness = Math.min(100, (failureRate * 0.6) + (timingVariance * 0.4));
      
      return {
        test_case_id: row.test_case_id,
        total_runs: row.total_runs,
        failed_runs: row.failed_runs,
        passed_runs: row.passed_runs,
        failure_rate: Math.round(failureRate),
        timing_variance: Math.round(timingVariance * 100) / 100,
        flakiness_score: Math.round(flakiness),
        avg_execution_time: Math.round(row.avg_time)
      };
    });
    
    return flakyTests;
  } finally {
    client.release();
  }
}

// Website Queries
export async function getOrCreateWebsite(url: string): Promise<Website> {
  const client = await pool.connect();
  
  try {
    // Try to get existing website
    let query = 'SELECT * FROM websites WHERE url = $1';
    let result = await client.query(query, [url]);
    
    if (result.rows.length > 0) {
      return result.rows[0];
    }
    
    // Create new website
    const urlObj = new URL(url);
    query = `
      INSERT INTO websites (url, domain, path)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    result = await client.query(query, [
      url,
      urlObj.hostname,
      urlObj.pathname + urlObj.search
    ]);
    
    return result.rows[0];
  } finally {
    client.release();
  }
}

// Dashboard Statistics
export async function getDashboardStats(): Promise<{
  totalTests: number;
  totalExecutions: number;
  flakyTests: number;
  successRate: number;
}> {
  const client = await pool.connect();
  
  try {
    // Get total test cases
    const testCasesResult = await client.query('SELECT COUNT(*) as count FROM test_cases');
    const totalTests = parseInt(testCasesResult.rows[0].count);
    
    // Get total executions
    const executionsResult = await client.query('SELECT COUNT(*) as count FROM test_executions');
    const totalExecutions = parseInt(executionsResult.rows[0].count);
    
    // Get flaky tests
    const flakyResult = await client.query('SELECT COUNT(*) as count FROM flaky_tests WHERE is_resolved = FALSE');
    const flakyTests = parseInt(flakyResult.rows[0].count);
    
    // Get success rate
    const successResult = await client.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'passed' THEN 1 ELSE 0 END) as passed
      FROM test_executions
    `);
    
    const total = parseInt(successResult.rows[0].total);
    const passed = parseInt(successResult.rows[0].passed);
    const successRate = total > 0 ? (passed / total) * 100 : 0;
    
    return {
      totalTests,
      totalExecutions,
      flakyTests,
      successRate: Math.round(successRate * 10) / 10
    };
  } finally {
    client.release();
  }
}


// Save flaky test to database
export async function saveFlakyTest(flakyTest: {
  test_case_id: string;
  flakiness_score: number;
  timing_variance: number;
  failure_rate: number;
  total_runs: number;
  failed_runs: number;
  root_causes: string[];
  last_failed_at?: Date;
}): Promise<FlakyTest> {
  const client = await pool.connect();
  
  try {
    const query = `
      INSERT INTO flaky_tests (
        test_case_id, flakiness_score, timing_variance, failure_rate,
        total_runs, failed_runs, root_causes, last_failed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (test_case_id)
      DO UPDATE SET
        flakiness_score = EXCLUDED.flakiness_score,
        timing_variance = EXCLUDED.timing_variance,
        failure_rate = EXCLUDED.failure_rate,
        total_runs = EXCLUDED.total_runs,
        failed_runs = EXCLUDED.failed_runs,
        root_causes = EXCLUDED.root_causes,
        last_failed_at = EXCLUDED.last_failed_at,
        is_resolved = FALSE
      RETURNING *
    `;
    
    const values = [
      flakyTest.test_case_id,
      flakyTest.flakiness_score,
      flakyTest.timing_variance,
      flakyTest.failure_rate,
      flakyTest.total_runs,
      flakyTest.failed_runs,
      JSON.stringify(flakyTest.root_causes),
      flakyTest.last_failed_at
    ];
    
    const result = await client.query(query, values);
    return result.rows[0];
  } finally {
    client.release();
  }
}

// Analyze test executions and detect flaky tests
export async function analyzeAndDetectFlakyTests(): Promise<FlakyTest[]> {
  const client = await pool.connect();
  
  try {
    // Get all test executions grouped by test_case_id
    const query = `
      SELECT 
        test_case_id,
        COUNT(*) as total_runs,
        SUM(CASE WHEN status = 'passed' THEN 1 ELSE 0 END) as passed_runs,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_runs,
        AVG(execution_time) as avg_time,
        STDDEV(execution_time) as std_dev,
        MAX(executed_at) as last_executed,
        MAX(CASE WHEN status = 'failed' THEN executed_at END) as last_failed_at
      FROM test_executions
      GROUP BY test_case_id
      HAVING COUNT(*) >= 2
    `;
    
    const result = await client.query(query);
    const flakyTestsDetected: FlakyTest[] = [];
    
    for (const row of result.rows) {
      const totalRuns = parseInt(row.total_runs);
      const passedRuns = parseInt(row.passed_runs);
      const failedRuns = parseInt(row.failed_runs);
      const avgTime = parseFloat(row.avg_time) || 0;
      const stdDev = parseFloat(row.std_dev) || 0;
      
      // Test is flaky if it has both passes and failures
      if (passedRuns > 0 && failedRuns > 0) {
        const failureRate = (failedRuns / totalRuns) * 100;
        const timingVariance = avgTime > 0 ? (stdDev / avgTime) * 100 : 0;
        
        // Calculate flakiness score (0-100)
        const flakiness = Math.min(100, (failureRate * 0.6) + (timingVariance * 0.4));
        
        // Detect root causes
        const rootCauses: string[] = [];
        if (failureRate > 50) {
          rootCauses.push('High failure rate - test may be unreliable');
        }
        if (timingVariance > 30) {
          rootCauses.push('High timing variance - test may have race conditions');
        }
        if (stdDev > 5000) {
          rootCauses.push('Slow execution - may timeout intermittently');
        }
        if (rootCauses.length === 0) {
          rootCauses.push('Inconsistent results detected');
        }
        
        // Save to flaky_tests table
        const flakyTestData = {
          test_case_id: row.test_case_id,
          flakiness_score: Math.round(flakiness * 100) / 100,
          timing_variance: Math.round(timingVariance * 100) / 100,
          failure_rate: Math.round(failureRate * 100) / 100,
          total_runs: totalRuns,
          failed_runs: failedRuns,
          root_causes: rootCauses,
          last_failed_at: row.last_failed_at ? new Date(row.last_failed_at) : undefined
        };
        
        // Save to database
        await saveFlakyTest(flakyTestData);
        flakyTestsDetected.push(flakyTestData as FlakyTest);
      }
    }
    
    return flakyTestsDetected;
  } finally {
    client.release();
  }
}


// Get all flaky tests
export async function getFlakyTests(): Promise<FlakyTest[]> {
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT * FROM flaky_tests 
      WHERE is_resolved = FALSE 
      ORDER BY flakiness_score DESC
    `;
    const result = await client.query(query);
    return result.rows;
  } finally {
    client.release();
  }
}

// Get specific flaky test
export async function getFlakyTest(testCaseId: string): Promise<FlakyTest | null> {
  const client = await pool.connect();
  
  try {
    const query = 'SELECT * FROM flaky_tests WHERE test_case_id = $1';
    const result = await client.query(query, [testCaseId]);
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

// Resolve flaky test
export async function resolveFlakyTest(testCaseId: string): Promise<boolean> {
  const client = await pool.connect();
  
  try {
    const query = `
      UPDATE flaky_tests 
      SET is_resolved = TRUE 
      WHERE test_case_id = $1
    `;
    const result = await client.query(query, [testCaseId]);
    return (result.rowCount || 0) > 0;
  } finally {
    client.release();
  }
}
