try {
  const { IntegratedTestRouter } = require('./dist/generators/integratedTestRouter');
  module.exports = { IntegratedTestRouter };
} catch (error) {
  console.error('Failed to load IntegratedTestRouter from dist:', error.message);
  
  // Fallback: Create a minimal router if dist is not available
  class IntegratedTestRouter {
    async generateTests(request) {
      console.warn('⚠️ Using fallback router - dist files may not be compiled');
      return {
        testCases: [],
        summary: { total: 0 },
        intent: { primaryType: 'unknown', secondaryTypes: [], confidence: 0 }
      };
    }
  }
  
  module.exports = { IntegratedTestRouter };
}
