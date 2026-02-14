import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { testConnection, initializeDatabase } from '../database/connection';
import {
  saveTestCase,
  getTestCase,
  getAllTestCases,
  getTestCasesByWebsite,
  saveTestExecution,
  getTestExecutions,
  getAllTestExecutions,
  getFlakyTests,
  getFlakyTest,
  resolveFlakyTest,
  getDashboardStats,
  getOrCreateWebsite
} from '../database/queries';
import { FlakyTestAnalyzer } from '../database/flakyAnalyzer';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const dbConnected = await testConnection();
    res.json({
      status: 'healthy',
      database: dbConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Dashboard API
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const stats = await getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Test Cases API
app.get('/api/test-cases', async (req, res) => {
  try {
    const { website } = req.query;
    
    let testCases;
    if (website && typeof website === 'string') {
      testCases = await getTestCasesByWebsite(website);
    } else {
      testCases = await getAllTestCases();
    }
    
    res.json(testCases);
  } catch (error) {
    console.error('Get test cases error:', error);
    res.status(500).json({ error: 'Failed to fetch test cases' });
  }
});

app.get('/api/test-cases/:testCaseId', async (req, res) => {
  try {
    const { testCaseId } = req.params;
    const testCase = await getTestCase(testCaseId);
    
    if (!testCase) {
      return res.status(404).json({ error: 'Test case not found' });
    }
    
    res.json(testCase);
  } catch (error) {
    console.error('Get test case error:', error);
    res.status(500).json({ error: 'Failed to fetch test case' });
  }
});

app.post('/api/test-cases', async (req, res) => {
  try {
    const testCaseData = req.body;
    
    // Validate required fields
    const requiredFields = ['test_case_id', 'title', 'description', 'type', 'priority', 'steps', 'expected_result'];
    for (const field of requiredFields) {
      if (!testCaseData[field]) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }
    
    const savedTestCase = await saveTestCase(testCaseData);
    res.status(201).json(savedTestCase);
  } catch (error) {
    console.error('Save test case error:', error);
    res.status(500).json({ error: 'Failed to save test case' });
  }
});

// Test Executions API
app.get('/api/test-cases/:testCaseId/executions', async (req, res) => {
  try {
    const { testCaseId } = req.params;
    const executions = await getTestExecutions(testCaseId);
    res.json(executions);
  } catch (error) {
    console.error('Get test executions error:', error);
    res.status(500).json({ error: 'Failed to fetch test executions' });
  }
});

app.get('/api/test-executions', async (req, res) => {
  try {
    const executions = await getAllTestExecutions();
    res.json(executions);
  } catch (error) {
    console.error('Get all test executions error:', error);
    res.status(500).json({ error: 'Failed to fetch test executions' });
  }
});

app.post('/api/test-executions', async (req, res) => {
  try {
    const executionData = req.body;
    
    // Validate required fields
    if (!executionData.test_case_id || !executionData.status || !executionData.execution_time) {
      return res.status(400).json({ 
        error: 'Missing required fields: test_case_id, status, execution_time' 
      });
    }
    
    const savedExecution = await saveTestExecution(executionData);
    res.status(201).json(savedExecution);
  } catch (error) {
    console.error('Save test execution error:', error);
    res.status(500).json({ error: 'Failed to save test execution' });
  }
});

// Parallel test execution for flaky detection
app.post('/api/test-cases/:testCaseId/rerun-parallel', async (req, res) => {
  try {
    const { testCaseId } = req.params;
    const { runs = 5 } = req.body;
    
    console.log(`Running ${runs} parallel executions for test case: ${testCaseId}`);
    
    // Simulate parallel test executions
    const results = [];
    const promises = Array.from({ length: runs }, async (_, index) => {
      const success = Math.random() > 0.3; // 70% success rate
      const executionTime = Math.floor(Math.random() * 2000) + 500; // 500-2500ms
      const domStabilityScore = Math.floor(Math.random() * 100);
      const waitConditionFailures = success ? 0 : Math.floor(Math.random() * 3);
      const networkCallCount = Math.floor(Math.random() * 10) + 1;
      
      const execution = await saveTestExecution({
        test_case_id: testCaseId,
        status: success ? 'passed' : 'failed',
        execution_time: executionTime,
        dom_stability_score: domStabilityScore,
        wait_condition_failures: waitConditionFailures,
        network_call_count: networkCallCount,
        error_message: success ? undefined : `Simulated failure in run ${index + 1}`,
        results: {
          runNumber: index + 1,
          simulated: true
        }
      });
      
      return {
        runNumber: index + 1,
        success,
        executionTime,
        execution
      };
    });
    
    const executionResults = await Promise.all(promises);
    
    const summary = {
      totalRuns: runs,
      successfulRuns: executionResults.filter(r => r.success).length,
      failedRuns: executionResults.filter(r => !r.success).length,
      averageExecutionTime: Math.round(
        executionResults.reduce((sum, r) => sum + r.executionTime, 0) / runs
      )
    };
    
    res.json({
      success: true,
      summary,
      results: executionResults,
      message: `Completed ${runs} parallel test executions`
    });
  } catch (error) {
    console.error('Parallel execution error:', error);
    res.status(500).json({ error: 'Failed to run parallel executions' });
  }
});

// Flaky Tests API
app.get('/api/flaky-tests', async (req, res) => {
  try {
    const flakyTests = await getFlakyTests();
    res.json(flakyTests);
  } catch (error) {
    console.error('Get flaky tests error:', error);
    res.status(500).json({ error: 'Failed to fetch flaky tests' });
  }
});

app.get('/api/flaky-tests/:testCaseId', async (req, res) => {
  try {
    const { testCaseId } = req.params;
    const flakyTest = await getFlakyTest(testCaseId);
    
    if (!flakyTest) {
      return res.status(404).json({ error: 'Flaky test not found' });
    }
    
    // Also get the test case details and execution history
    const testCase = await getTestCase(testCaseId);
    const executions = await getTestExecutions(testCaseId);
    
    res.json({
      ...flakyTest,
      testCase,
      executions
    });
  } catch (error) {
    console.error('Get flaky test error:', error);
    res.status(500).json({ error: 'Failed to fetch flaky test' });
  }
});

app.post('/api/analyze-flaky-tests', async (req, res) => {
  try {
    const analyzer = new FlakyTestAnalyzer();
    const { testCaseId } = req.body;
    
    if (testCaseId) {
      // Analyze specific test case
      const analysis = await analyzer.analyzeTestCase(testCaseId);
      res.json({
        success: true,
        testCaseId,
        analysis,
        message: analysis.isFlakey ? 'Flaky test detected' : 'Test appears stable'
      });
    } else {
      // Analyze all test cases
      const results = await analyzer.analyzeAllTests();
      res.json({
        success: true,
        ...results,
        message: `Analysis complete: ${results.flakyFound} flaky tests found out of ${results.analyzed} analyzed`
      });
    }
  } catch (error) {
    console.error('Flaky test analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze flaky tests' });
  }
});

app.patch('/api/flaky-tests/:testCaseId/resolve', async (req, res) => {
  try {
    const { testCaseId } = req.params;
    const resolved = await resolveFlakyTest(testCaseId);
    
    if (!resolved) {
      return res.status(404).json({ error: 'Flaky test not found' });
    }
    
    res.json({ success: true, message: 'Flaky test marked as resolved' });
  } catch (error) {
    console.error('Resolve flaky test error:', error);
    res.status(500).json({ error: 'Failed to resolve flaky test' });
  }
});

// Website API
app.post('/api/websites', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    const website = await getOrCreateWebsite(url);
    res.json(website);
  } catch (error) {
    console.error('Create website error:', error);
    res.status(500).json({ error: 'Failed to create website' });
  }
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

export async function startServer(port: number = 3000): Promise<void> {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }
    
    // Initialize database tables
    await initializeDatabase();
    
    // Start server
    app.listen(port, () => {
      console.log(`🚀 AI Test Generator API Server running on port ${port}`);
      console.log(`📊 Dashboard: http://localhost:${port}/api/dashboard/stats`);
      console.log(`🔍 Health Check: http://localhost:${port}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

export { app };