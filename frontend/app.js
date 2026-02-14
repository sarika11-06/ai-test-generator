class EnhancedAITestGenerator {
    constructor() {
        this.apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
        this.currentTestSuite = null;
        this.currentPlaywrightCode = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupTabNavigation();
    }

    bindEvents() {
        // Form submission
        const form = document.getElementById('testGenerationForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.generateTests();
            });
        }

        // Copy button for test cases
        const copyBtn = document.getElementById('copyBtn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copyTestCases());
        }

        // Copy button for Playwright code
        const copyCodeBtn = document.getElementById('copyCodeBtn');
        if (copyCodeBtn) {
            copyCodeBtn.addEventListener('click', () => this.copyPlaywrightCode());
        }

        // Run tests button
        const runTestsBtn = document.getElementById('runTestsBtn');
        if (runTestsBtn) {
            runTestsBtn.addEventListener('click', () => this.runPlaywrightTests());
        }

        // Download button
        const downloadBtn = document.getElementById('downloadBtn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.downloadTestCases());
        }

        // Flaky analysis form
        const flakyForm = document.getElementById('flakyAnalysisForm');
        if (flakyForm) {
            flakyForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.analyzeFlakyTests();
            });
        }

        // Analyze flaky button
        const analyzeFlakyBtn = document.getElementById('analyzeFlakyBtn');
        if (analyzeFlakyBtn) {
            analyzeFlakyBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.analyzeFlakyTests();
            });
        }

        // View flaky dashboard button
        const viewFlakyDashboardBtn = document.getElementById('viewFlakyDashboardBtn');
        if (viewFlakyDashboardBtn) {
            viewFlakyDashboardBtn.addEventListener('click', () => this.viewFlakyDashboard());
        }

        // Load test cases when flaky tab is opened
        this.loadTestCasesForFlaky();

        // Root cause analysis form
        const rootCauseForm = document.getElementById('rootCauseAnalysisForm');
        if (rootCauseForm) {
            rootCauseForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.analyzeRootCause();
            });
        }

        // Analyze root cause button
        const analyzeRootCauseBtn = document.getElementById('analyzeRootCauseBtn');
        if (analyzeRootCauseBtn) {
            analyzeRootCauseBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.analyzeRootCause();
            });
        }

        // View recent analyses button
        const viewRecentAnalysesBtn = document.getElementById('viewRecentAnalysesBtn');
        if (viewRecentAnalysesBtn) {
            viewRecentAnalysesBtn.addEventListener('click', () => this.viewRecentAnalyses());
        }
    }

    setupTabNavigation() {
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tabId = e.currentTarget.id.replace('tab-', 'content-');
                this.switchTab(tabId);
                
                // Hide flaky results when switching away from flaky tab
                if (tabId !== 'content-flaky') {
                    this.hideFlakyResults();
                }
                
                // Load test cases when flaky tab is opened
                if (tabId === 'content-flaky') {
                    this.loadTestCasesForFlaky();
                }
                
                // Load recent analyses when root cause tab is opened
                if (tabId === 'content-rootcause') {
                    this.viewRecentAnalyses();
                }

                // Load dashboard when dashboard tab is opened
                if (tabId === 'content-dashboard') {
                    this.loadDashboard();
                }

                // Load coverage when coverage tab is opened
                if (tabId === 'content-coverage') {
                    this.loadCoverageVisualizer();
                }
            });
        });
    }

    switchTab(tabId) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.add('hidden');
        });

        // Remove active class from all buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active', 'border-blue-500', 'text-blue-600');
            btn.classList.add('border-transparent', 'text-gray-500');
        });

        // Show selected tab
        const selectedTab = document.getElementById(tabId);
        if (selectedTab) {
            selectedTab.classList.remove('hidden');
        }

        // Add active class to clicked button
        const buttonId = tabId.replace('content-', 'tab-');
        const activeButton = document.getElementById(buttonId);
        if (activeButton) {
            activeButton.classList.add('active', 'border-blue-500', 'text-blue-600');
            activeButton.classList.remove('border-transparent', 'text-gray-500');
        }
    }

    async generateTests() {
        try {
            const formData = new FormData(document.getElementById('testGenerationForm'));
            const websiteUrl = formData.get('websiteUrl');
            const testingIntent = formData.get('testingIntent');
            const outputFormat = formData.get('outputFormat');

            if (!websiteUrl) {
                this.showError('Please enter a website URL');
                return;
            }

            this.showLoadingState('Generating test cases...');

            const response = await fetch(`${this.apiBaseUrl}/generate-tests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: websiteUrl,
                    intent: testingIntent,
                    outputFormat: outputFormat,
                    testTypes: this.getSelectedTestTypes()
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                this.currentTestSuite = result.data;
                this.currentPlaywrightCode = result.data.playwrightCode || '';
                
                this.displayGeneratedTests(result.data);
                
                if (this.currentPlaywrightCode) {
                    this.displayPlaywrightCode(this.currentPlaywrightCode);
                    document.getElementById('playwrightCode').classList.remove('hidden');
                    document.getElementById('runTestsBtn').classList.remove('hidden');
                }
                
                document.getElementById('resultsSection').classList.remove('hidden');
                this.showSuccess('Tests generated successfully!');
            } else {
                this.showError('Failed to generate tests: ' + (result.error || 'Unknown error'));
            }

        } catch (error) {
            console.error('Test generation error:', error);
            this.showError('Error: ' + error.message);
        } finally {
            this.hideLoadingState();
        }
    }

    getSelectedTestTypes() {
        const checkboxes = document.querySelectorAll('input[name="testTypes"]:checked');
        return Array.from(checkboxes).map(cb => cb.value);
    }

    displayGeneratedTests(data) {
        const containerDiv = document.getElementById('testCasesContent');
        if (!containerDiv) return;

        const testCases = data.testCases || [];
        
        if (testCases.length === 0) {
            containerDiv.innerHTML = '<p class="text-gray-600">No test cases generated</p>';
            return;
        }

        containerDiv.innerHTML = `
            <div class="space-y-6">
                ${testCases.map((testCase, index) => `
                    <div class="test-case p-6 rounded-lg border-l-4 border-blue-500 bg-gray-50">
                        <h5 class="text-xl font-bold text-gray-800 mb-2">${testCase.testCaseId || `Test ${index + 1}`}</h5>
                        <p class="text-gray-700 font-medium mb-2">${testCase.title || testCase.expectedResult || 'Test Case'}</p>
                        <p class="text-sm text-gray-600 mb-4">${testCase.description || ''}</p>
                        
                        ${testCase.steps && testCase.steps.length > 0 ? `
                        <div class="mb-4">
                            <h6 class="font-semibold text-gray-800 mb-2">Test Steps:</h6>
                            <div class="space-y-2">
                                ${testCase.steps.map((step, stepIdx) => `
                                    <div class="bg-white p-3 rounded border-l-2 border-blue-300">
                                        <p class="font-medium text-gray-800">Step ${stepIdx + 1}: ${step.action || step.stepNumber || 'Step'}</p>
                                        ${step.expectedResult ? `<p class="text-sm text-green-600 mt-1">Expected: ${step.expectedResult}</p>` : ''}
                                        ${step.expectedBehavior ? `<p class="text-sm text-green-600 mt-1">Expected: ${step.expectedBehavior}</p>` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        ` : ''}
                        
                        <div class="mt-4 pt-4 border-t border-gray-300">
                            <p class="text-sm text-gray-600"><strong>Type:</strong> ${testCase.testType || 'Functional'}</p>
                            <p class="text-sm text-gray-600"><strong>Priority:</strong> ${testCase.priority || 'High'}</p>
                            <p class="text-sm text-gray-600"><strong>Expected Result:</strong> ${testCase.expectedResult || 'Test completes successfully'}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    displayPlaywrightCode(code) {
        const codeDiv = document.getElementById('playwrightCode');
        const displayDiv = document.getElementById('codeDisplay');

        if (!codeDiv || !displayDiv) return;

        displayDiv.textContent = code || '// No code generated';
        codeDiv.classList.remove('hidden');
    }

    copyTestCases() {
        try {
            const testCasesContent = document.getElementById('testCasesContent');
            if (!testCasesContent) {
                this.showError('No test cases to copy');
                return;
            }

            const text = testCasesContent.innerText;
            navigator.clipboard.writeText(text).then(() => {
                this.showSuccess('Test cases copied to clipboard!');
            }).catch(err => {
                console.error('Failed to copy:', err);
                this.showError('Failed to copy test cases');
            });
        } catch (error) {
            console.error('Copy error:', error);
            this.showError('Error copying test cases');
        }
    }

    copyPlaywrightCode() {
        try {
            if (!this.currentPlaywrightCode) {
                this.showError('No Playwright code to copy');
                return;
            }

            navigator.clipboard.writeText(this.currentPlaywrightCode).then(() => {
                this.showSuccess('Playwright code copied to clipboard!');
            }).catch(err => {
                console.error('Failed to copy:', err);
                this.showError('Failed to copy code');
            });
        } catch (error) {
            console.error('Copy error:', error);
            this.showError('Error copying code');
        }
    }

    downloadTestCases() {
        try {
            if (!this.currentTestSuite) {
                this.showError('No test cases to download');
                return;
            }

            const dataStr = JSON.stringify(this.currentTestSuite, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `test-cases-${Date.now()}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            this.showSuccess('Test cases downloaded successfully!');
        } catch (error) {
            console.error('Download error:', error);
            this.showError('Error downloading test cases');
        }
    }

    async runPlaywrightTests() {
        try {
            if (!this.currentPlaywrightCode) {
                this.showError('No Playwright code available to run');
                return;
            }

            this.showLoadingState('Running Playwright tests...');

            const formData = new FormData(document.getElementById('testGenerationForm'));
            const baseUrl = formData.get('websiteUrl');

            const response = await fetch(`${this.apiBaseUrl}/run-playwright-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code: this.currentPlaywrightCode,
                    url: baseUrl
                })
            });

            const result = await response.json();

            if (result.success) {
                const data = result.data;
                const message = `✅ Tests Completed!\n\nPassed: ${data.passed}\nFailed: ${data.failed}\n\nOutput:\n${data.output}`;
                this.showTestResults(message, data);
            } else {
                this.showError(`Test execution failed: ${result.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Test execution error:', error);
            this.showError('Error: ' + error.message);
        } finally {
            this.hideLoadingState();
        }
    }

    showTestResults(message, data) {
        // Create execution logs section
        const logsSection = document.createElement('div');
        logsSection.id = 'executionLogs';
        logsSection.className = 'mt-8 p-6 bg-gray-900 text-white rounded-lg';
        
        // Build execution steps HTML
        let stepsHTML = '';
        if (data.executionSteps && data.executionSteps.length > 0) {
            stepsHTML = `
                <div class="mb-6">
                    <h4 class="font-semibold text-green-400 mb-3">📋 Execution Steps:</h4>
                    <div class="space-y-2 max-h-96 overflow-y-auto font-mono text-sm">
                        ${data.executionSteps.map((step, idx) => `
                            <div class="flex items-start space-x-3 p-2 bg-gray-800 rounded border-l-2 border-green-500">
                                <span class="text-green-400 font-bold">[${idx + 1}]</span>
                                <div class="flex-1">
                                    <p class="text-gray-100">${step.action}</p>
                                    <p class="text-xs text-gray-500">⏱️ ${step.duration}ms</p>
                                </div>
                                <span class="text-green-400">✅</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        logsSection.innerHTML = `
            <div>
                <h3 class="text-2xl font-bold text-white mb-4">🎬 Test Execution Results</h3>
                
                <div class="grid grid-cols-2 gap-4 mb-6">
                    <div class="bg-green-900 bg-opacity-30 border border-green-500 p-4 rounded-lg">
                        <p class="text-green-400 font-semibold">✅ Passed</p>
                        <p class="text-4xl font-bold text-green-400">${data.passed}</p>
                    </div>
                    <div class="bg-red-900 bg-opacity-30 border border-red-500 p-4 rounded-lg">
                        <p class="text-red-400 font-semibold">❌ Failed</p>
                        <p class="text-4xl font-bold text-red-400">${data.failed}</p>
                    </div>
                </div>
                
                ${stepsHTML}
                
                <div class="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <p class="text-gray-300 font-semibold mb-3">📝 Console Output:</p>
                    <pre class="text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap break-words font-mono max-h-96 overflow-y-auto">${data.output || 'No output available'}</pre>
                </div>
            </div>
        `;
        
        // Remove any existing logs section
        const existingLogs = document.getElementById('executionLogs');
        if (existingLogs) {
            existingLogs.remove();
        }
        
        // Insert after the Playwright code section
        const playwrightCodeSection = document.getElementById('playwrightCode');
        if (playwrightCodeSection) {
            playwrightCodeSection.parentNode.insertBefore(logsSection, playwrightCodeSection.nextSibling);
        } else {
            // Fallback: insert at the end of results section
            const resultsSection = document.getElementById('resultsSection');
            if (resultsSection) {
                resultsSection.appendChild(logsSection);
            }
        }
        
        // Scroll to logs
        logsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    showLoadingState(message) {
        const loadingDiv = document.getElementById('loadingState');
        if (loadingDiv) {
            loadingDiv.classList.remove('hidden');
            const msgDiv = loadingDiv.querySelector('#loadingMessage');
            if (msgDiv) msgDiv.textContent = message;
        }
    }

    hideLoadingState() {
        const loadingDiv = document.getElementById('loadingState');
        if (loadingDiv) {
            loadingDiv.classList.add('hidden');
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('errorState');
        const errorMsg = document.getElementById('errorMessage');
        if (errorDiv && errorMsg) {
            errorMsg.textContent = message;
            errorDiv.classList.remove('hidden');
            setTimeout(() => {
                errorDiv.classList.add('hidden');
            }, 5000);
        } else {
            alert('Error: ' + message);
        }
    }

    showSuccess(message) {
        console.log('✅ ' + message);
        // You can add a toast notification here if desired
    }

    async loadTestCasesForFlaky() {
        try {
            const select = document.getElementById('testCaseSelect');
            if (!select) return;

            console.log('📋 Loading test cases for flaky analysis...');
            const response = await fetch(`${this.apiBaseUrl}/test-cases`);
            const result = await response.json();

            const testCases = result.testCases || result.data || [];

            if (testCases.length === 0) {
                select.innerHTML = '<option value="">No test cases found - Generate tests first</option>';
                return;
            }

            select.innerHTML = `
                <option value="">-- Select a test case --</option>
                ${testCases.map(tc => `
                    <option value="${tc.testCaseId || tc.id}">${tc.testCaseId || tc.id} - ${tc.title || tc.name}</option>
                `).join('')}
            `;
            
            console.log(`✅ Loaded ${testCases.length} test cases`);
        } catch (error) {
            console.error('Error loading test cases:', error);
            const select = document.getElementById('testCaseSelect');
            if (select) {
                select.innerHTML = '<option value="">Error loading test cases</option>';
            }
        }
    }

    async analyzeFlakyTests() {
        try {
            const testCaseId = document.getElementById('testCaseSelect').value;

            if (!testCaseId) {
                this.showError('Please select a test case');
                return;
            }

            this.showLoadingState('Analyzing flaky tests...');

            const response = await fetch(`${this.apiBaseUrl}/analyze-flaky-tests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    testCaseId: testCaseId
                })
            });

            const result = await response.json();

            if (result.success) {
                this.displayFlakyResults(result.data);
                document.getElementById('flakyResults').classList.remove('hidden');
                this.showSuccess('Flaky test analysis completed!');
                
                // Auto-hide the results after 8 seconds
                setTimeout(() => {
                    this.hideFlakyResults();
                }, 8000);
            } else {
                this.showError('Failed to analyze: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Flaky analysis error:', error);
            this.showError('Error: ' + error.message);
        } finally {
            this.hideLoadingState();
        }
    }

    hideFlakyResults() {
        const flakyResults = document.getElementById('flakyResults');
        if (flakyResults) {
            flakyResults.classList.add('hidden');
        }
    }

    displayFlakyResults(data) {
        const container = document.getElementById('flakyResultsContent');
        if (!container) return;

        const flakyTests = data.flakyTests || [];

        if (flakyTests.length === 0) {
            container.innerHTML = `
                <div class="bg-green-50 border border-green-200 p-6 rounded-lg">
                    <p class="text-green-800 font-semibold">✅ Test is Stable</p>
                    <p class="text-green-700 text-sm mt-2">This test does not show signs of flakiness. All executions have consistent results.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="space-y-6">
                ${flakyTests.map((test, idx) => `
                    <div class="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
                        <h4 class="text-lg font-bold text-red-800 mb-4">🐛 ${test.test_case_id}</h4>
                        
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div class="bg-white p-3 rounded border border-red-200">
                                <p class="text-xs text-gray-600 font-semibold">Flakiness Score</p>
                                <p class="text-3xl font-bold text-red-600">${test.flakiness_score}</p>
                                <p class="text-xs text-gray-500">/100</p>
                            </div>
                            <div class="bg-white p-3 rounded border border-red-200">
                                <p class="text-xs text-gray-600 font-semibold">Failure Rate</p>
                                <p class="text-3xl font-bold text-red-600">${test.failure_rate}%</p>
                            </div>
                            <div class="bg-white p-3 rounded border border-orange-200">
                                <p class="text-xs text-gray-600 font-semibold">Timing Variance</p>
                                <p class="text-3xl font-bold text-orange-600">${test.timing_variance}%</p>
                            </div>
                            <div class="bg-white p-3 rounded border border-red-200">
                                <p class="text-xs text-gray-600 font-semibold">Failed Runs</p>
                                <p class="text-3xl font-bold text-red-600">${test.failed_runs}/${test.total_runs}</p>
                            </div>
                        </div>
                        
                        ${test.root_causes && test.root_causes.length > 0 ? `
                        <div class="bg-white p-4 rounded border border-red-200">
                            <h5 class="font-semibold text-gray-800 mb-3">🔍 Root Causes Detected:</h5>
                            <ul class="space-y-2">
                                ${test.root_causes.map(cause => `
                                    <li class="flex items-start space-x-2">
                                        <span class="text-red-500 font-bold mt-1">•</span>
                                        <span class="text-gray-700">${cause}</span>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }

    async viewFlakyDashboard() {
        try {
            this.showLoadingState('Loading flaky dashboard...');

            const response = await fetch(`${this.apiBaseUrl}/flaky-dashboard`);
            const result = await response.json();

            if (result.success) {
                this.displayFlakyDashboard(result.data);
                document.getElementById('flakyDashboard').classList.remove('hidden');
            } else {
                this.showError('Failed to load dashboard');
            }
        } catch (error) {
            console.error('Dashboard error:', error);
            this.showError('Error: ' + error.message);
        } finally {
            this.hideLoadingState();
        }
    }

    displayFlakyDashboard(data) {
        const container = document.getElementById('flakyDashboardContent');
        if (!container) return;

        const stats = data.stats || {};
        const flakyTests = data.flakyTests || [];

        container.innerHTML = `
            <div class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <p class="text-sm text-gray-600 font-semibold">Total Tests</p>
                        <p class="text-4xl font-bold text-blue-600">${stats.totalTests || 0}</p>
                    </div>
                    <div class="bg-green-50 p-4 rounded-lg border border-green-200">
                        <p class="text-sm text-gray-600 font-semibold">Total Executions</p>
                        <p class="text-4xl font-bold text-green-600">${stats.totalExecutions || 0}</p>
                    </div>
                    <div class="bg-red-50 p-4 rounded-lg border border-red-200">
                        <p class="text-sm text-gray-600 font-semibold">Flaky Tests</p>
                        <p class="text-4xl font-bold text-red-600">${stats.flakyTests || 0}</p>
                    </div>
                    <div class="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <p class="text-sm text-gray-600 font-semibold">Success Rate</p>
                        <p class="text-4xl font-bold text-purple-600">${stats.successRate || 0}%</p>
                    </div>
                </div>

                ${flakyTests.length > 0 ? `
                <div class="bg-white p-6 rounded-lg border border-gray-200">
                    <h4 class="text-lg font-bold text-gray-800 mb-4">🐛 All Flaky Tests</h4>
                    <div class="space-y-3">
                        ${flakyTests.map(test => `
                            <div class="flex items-center justify-between p-4 bg-red-50 rounded border border-red-200">
                                <div>
                                    <p class="font-semibold text-gray-800">${test.test_case_id}</p>
                                    <p class="text-sm text-gray-600">Failure Rate: ${test.failure_rate}% | Runs: ${test.failed_runs}/${test.total_runs}</p>
                                </div>
                                <div class="text-right">
                                    <p class="text-3xl font-bold text-red-600">${test.flakiness_score}</p>
                                    <p class="text-xs text-gray-500">Score</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : `
                <div class="bg-green-50 border border-green-200 p-6 rounded-lg">
                    <p class="text-green-800 font-semibold">✅ No Flaky Tests Detected</p>
                    <p class="text-green-700 text-sm mt-2">All tests are stable! Keep running tests to detect flakiness patterns.</p>
                </div>
                `}
            </div>
        `;
    }

    // Root Cause Analysis Methods
    async analyzeRootCause() {
        try {
            const testId = document.getElementById('testId')?.value;
            const errorType = document.getElementById('errorType')?.value;
            const errorMessage = document.getElementById('errorMessage')?.value;
            const stackTrace = document.getElementById('stackTrace')?.value;

            if (!testId) {
                this.showError('Please enter a Test ID');
                return;
            }

            this.showLoadingState('Analyzing root cause...');

            // Get test execution history
            const response = await fetch(`${this.apiBaseUrl}/test-cases/${testId}/executions`);
            const result = await response.json();

            if (result.success && result.data.executions.length > 0) {
                const executions = result.data.executions;
                const failedExecutions = executions.filter(e => e.status === 'failed');
                
                this.displayRootCauseAnalysis({
                    testId: testId,
                    errorType: errorType || 'Unknown',
                    errorMessage: errorMessage || 'No error message provided',
                    stackTrace: stackTrace || 'No stack trace provided',
                    executions: executions,
                    failedExecutions: failedExecutions,
                    totalRuns: executions.length,
                    failureRate: Math.round((failedExecutions.length / executions.length) * 100)
                });

                document.getElementById('rootCauseResults').classList.remove('hidden');
            } else {
                this.showError('No execution history found for this test');
            }
        } catch (error) {
            console.error('Root cause analysis error:', error);
            this.showError('Error: ' + error.message);
        } finally {
            this.hideLoadingState();
        }
    }

    displayRootCauseAnalysis(data) {
        const container = document.getElementById('rootCauseResultsContent');
        if (!container) return;

        // Detect root causes based on error type and patterns
        const rootCauses = this.detectRootCauses(data);

        container.innerHTML = `
            <div class="space-y-6">
                <div class="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
                    <h4 class="text-lg font-bold text-blue-800 mb-4">📋 Test Execution Analysis</h4>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div class="bg-white p-3 rounded border border-blue-200">
                            <p class="text-xs text-gray-600 font-semibold">Total Runs</p>
                            <p class="text-2xl font-bold text-blue-600">${data.totalRuns}</p>
                        </div>
                        <div class="bg-white p-3 rounded border border-red-200">
                            <p class="text-xs text-gray-600 font-semibold">Failed Runs</p>
                            <p class="text-2xl font-bold text-red-600">${data.failedExecutions.length}</p>
                        </div>
                        <div class="bg-white p-3 rounded border border-green-200">
                            <p class="text-xs text-gray-600 font-semibold">Passed Runs</p>
                            <p class="text-2xl font-bold text-green-600">${data.totalRuns - data.failedExecutions.length}</p>
                        </div>
                        <div class="bg-white p-3 rounded border border-orange-200">
                            <p class="text-xs text-gray-600 font-semibold">Failure Rate</p>
                            <p class="text-2xl font-bold text-orange-600">${data.failureRate}%</p>
                        </div>
                    </div>
                </div>

                <div class="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
                    <h4 class="text-lg font-bold text-red-800 mb-4">🔍 Detected Root Causes</h4>
                    <div class="space-y-3">
                        ${rootCauses.map((cause, idx) => `
                            <div class="bg-white p-4 rounded border border-red-200">
                                <p class="font-semibold text-gray-800 mb-2">${idx + 1}. ${cause.title}</p>
                                <p class="text-sm text-gray-700 mb-2">${cause.description}</p>
                                <p class="text-xs text-blue-600 font-semibold">💡 Solution: ${cause.solution}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-lg">
                    <h4 class="text-lg font-bold text-yellow-800 mb-4">⚠️ Error Details</h4>
                    <div class="space-y-3">
                        <div class="bg-white p-3 rounded border border-yellow-200">
                            <p class="text-xs text-gray-600 font-semibold">Error Type</p>
                            <p class="text-sm text-gray-800 font-mono">${data.errorType}</p>
                        </div>
                        <div class="bg-white p-3 rounded border border-yellow-200">
                            <p class="text-xs text-gray-600 font-semibold">Error Message</p>
                            <p class="text-sm text-gray-800 font-mono break-words">${data.errorMessage}</p>
                        </div>
                        ${data.stackTrace ? `
                        <div class="bg-white p-3 rounded border border-yellow-200">
                            <p class="text-xs text-gray-600 font-semibold">Stack Trace</p>
                            <pre class="text-xs text-gray-800 font-mono overflow-x-auto bg-gray-100 p-2 rounded">${data.stackTrace}</pre>
                        </div>
                        ` : ''}
                    </div>
                </div>

                <div class="bg-green-50 border-l-4 border-green-500 p-6 rounded-lg">
                    <h4 class="text-lg font-bold text-green-800 mb-4">✅ Recommendations</h4>
                    <ul class="space-y-2">
                        <li class="flex items-start space-x-2">
                            <span class="text-green-600 font-bold">•</span>
                            <span class="text-gray-700">Add explicit waits instead of hard-coded delays</span>
                        </li>
                        <li class="flex items-start space-x-2">
                            <span class="text-green-600 font-bold">•</span>
                            <span class="text-gray-700">Use more specific selectors to avoid timing issues</span>
                        </li>
                        <li class="flex items-start space-x-2">
                            <span class="text-green-600 font-bold">•</span>
                            <span class="text-gray-700">Increase timeout values for slow operations</span>
                        </li>
                        <li class="flex items-start space-x-2">
                            <span class="text-green-600 font-bold">•</span>
                            <span class="text-gray-700">Run tests multiple times to verify stability</span>
                        </li>
                    </ul>
                </div>
            </div>
        `;
    }

    detectRootCauses(data) {
        const causes = [];
        const errorType = data.errorType.toLowerCase();
        const errorMsg = data.errorMessage.toLowerCase();

        // Timeout errors
        if (errorType.includes('timeout') || errorMsg.includes('timeout')) {
            causes.push({
                title: 'Timeout Error',
                description: 'The test exceeded the wait time for an element or action',
                solution: 'Increase timeout value or use explicit waits'
            });
        }

        // Selector not found
        if (errorMsg.includes('locator') || errorMsg.includes('selector') || errorMsg.includes('not found')) {
            causes.push({
                title: 'Element Not Found',
                description: 'The test could not find the expected element on the page',
                solution: 'Verify selectors are correct and elements are visible'
            });
        }

        // Network errors
        if (errorMsg.includes('network') || errorMsg.includes('connection') || errorMsg.includes('failed')) {
            causes.push({
                title: 'Network Issue',
                description: 'Network connectivity or server response issue',
                solution: 'Check network connection and server availability'
            });
        }

        // Timing/Race condition
        if (data.failureRate > 40 && data.failureRate < 100) {
            causes.push({
                title: 'Race Condition / Timing Issue',
                description: 'Test passes sometimes and fails sometimes, indicating timing issues',
                solution: 'Add proper waits for async operations and DOM updates'
            });
        }

        // Flaky test
        if (data.failedExecutions.length > 0 && (data.totalRuns - data.failedExecutions.length) > 0) {
            causes.push({
                title: 'Flaky Test Detected',
                description: 'Test has inconsistent results across multiple runs',
                solution: 'Review test logic and add more robust wait conditions'
            });
        }

        // Default cause if none detected
        if (causes.length === 0) {
            causes.push({
                title: 'Unknown Error',
                description: 'Unable to determine specific root cause',
                solution: 'Review error message and stack trace for more details'
            });
        }

        return causes;
    }

    async viewRecentAnalyses() {
        try {
            this.showLoadingState('Loading recent analyses...');
            
            // Get all flaky tests
            const response = await fetch(`${this.apiBaseUrl}/flaky-tests`);
            const flakyTests = await response.json();

            const container = document.getElementById('rootCauseResultsContent');
            if (!container) return;

            if (flakyTests.length === 0) {
                container.innerHTML = '<p class="text-gray-600">No recent analyses found</p>';
                return;
            }

            container.innerHTML = `
                <div class="space-y-4">
                    <h4 class="text-lg font-bold text-gray-800 mb-4">📊 Recent Root Cause Analyses</h4>
                    ${flakyTests.slice(0, 5).map((test, idx) => `
                        <div class="bg-white p-4 rounded border-l-4 border-red-500">
                            <p class="font-semibold text-gray-800">${idx + 1}. ${test.test_case_id}</p>
                            <p class="text-sm text-gray-600 mt-1">Flakiness Score: ${test.flakiness_score}/100</p>
                            <p class="text-sm text-gray-600">Failure Rate: ${test.failure_rate}%</p>
                            <p class="text-sm text-gray-600">Failed Runs: ${test.failed_runs}/${test.total_runs}</p>
                            ${test.root_causes && test.root_causes.length > 0 ? `
                                <div class="mt-2 text-xs text-gray-700">
                                    <p class="font-semibold">Root Causes:</p>
                                    <ul class="list-disc list-inside">
                                        ${test.root_causes.map(cause => `<li>${cause}</li>`).join('')}
                                    </ul>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            `;

            document.getElementById('rootCauseResults').classList.remove('hidden');
        } catch (error) {
            console.error('Error loading recent analyses:', error);
            this.showError('Error: ' + error.message);
        } finally {
            this.hideLoadingState();
        }
    }

    // Dashboard Methods
    async loadDashboard() {
        try {
            this.showLoadingState('Loading dashboard...');

            // Get dashboard stats
            const statsResponse = await fetch(`${this.apiBaseUrl}/dashboard/stats`);
            const stats = await statsResponse.json();

            // Get all test cases
            const testCasesResponse = await fetch(`${this.apiBaseUrl}/test-cases`);
            const testCasesData = await testCasesResponse.json();
            const testCases = testCasesData.testCases || [];

            // Get flaky tests
            const flakyResponse = await fetch(`${this.apiBaseUrl}/flaky-tests`);
            const flakyTests = await flakyResponse.json();

            this.displayDashboard({
                stats: stats,
                testCases: testCases,
                flakyTests: flakyTests
            });

        } catch (error) {
            console.error('Dashboard error:', error);
            this.showError('Error loading dashboard: ' + error.message);
        } finally {
            this.hideLoadingState();
        }
    }

    displayDashboard(data) {
        const container = document.getElementById('dashboardContent');
        if (!container) return;

        const stats = data.stats || {};
        const testCases = data.testCases || [];
        const flakyTests = data.flakyTests || [];

        // Get recent executions
        const recentTests = testCases.slice(0, 5);

        container.innerHTML = `
            <!-- Stats Cards -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div class="bg-gradient-to-br from-green-400 to-green-600 text-white p-6 rounded-lg shadow-lg">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-green-100 text-sm font-semibold">Total Tests</p>
                            <p class="text-4xl font-bold">${stats.totalTests || 0}</p>
                        </div>
                        <i class="fas fa-edit text-4xl opacity-20"></i>
                    </div>
                </div>

                <div class="bg-gradient-to-br from-blue-400 to-blue-600 text-white p-6 rounded-lg shadow-lg">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-blue-100 text-sm font-semibold">Passed</p>
                            <p class="text-4xl font-bold">${Math.round((stats.totalExecutions * stats.successRate) / 100) || 0}</p>
                        </div>
                        <i class="fas fa-check-circle text-4xl opacity-20"></i>
                    </div>
                </div>

                <div class="bg-gradient-to-br from-red-400 to-red-600 text-white p-6 rounded-lg shadow-lg">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-red-100 text-sm font-semibold">Failed</p>
                            <p class="text-4xl font-bold">${Math.round((stats.totalExecutions * (100 - stats.successRate)) / 100) || 0}</p>
                        </div>
                        <i class="fas fa-times-circle text-4xl opacity-20"></i>
                    </div>
                </div>

                <div class="bg-gradient-to-br from-orange-400 to-orange-600 text-white p-6 rounded-lg shadow-lg">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-orange-100 text-sm font-semibold">Success Rate</p>
                            <p class="text-4xl font-bold">${stats.successRate || 0}%</p>
                        </div>
                        <i class="fas fa-chart-pie text-4xl opacity-20"></i>
                    </div>
                </div>
            </div>

            <!-- Recent Test Executions -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div class="bg-white rounded-lg shadow-lg p-6">
                    <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                        <i class="fas fa-history text-blue-500 mr-3"></i>
                        Recent Test Cases
                    </h3>
                    <div class="space-y-3">
                        ${recentTests.length > 0 ? recentTests.map((test, idx) => `
                            <div class="flex items-center justify-between p-3 bg-gray-50 rounded border-l-4 border-blue-500">
                                <div class="flex-1">
                                    <p class="font-semibold text-gray-800">${test.testCaseId || test.id}</p>
                                    <p class="text-xs text-gray-600">${test.title || test.name || 'Test Case'}</p>
                                </div>
                                <span class="px-3 py-1 rounded-full text-xs font-semibold ${
                                    test.status === 'PASS' || test.status === 'passed' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-gray-100 text-gray-800'
                                }">
                                    ${test.status || 'NOT_RUN'}
                                </span>
                            </div>
                        `).join('') : '<p class="text-gray-600">No test cases yet</p>'}
                    </div>
                </div>

                <!-- Flaky Tests Summary -->
                <div class="bg-white rounded-lg shadow-lg p-6">
                    <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                        <i class="fas fa-bug text-red-500 mr-3"></i>
                        Flaky Tests (${flakyTests.length})
                    </h3>
                    <div class="space-y-3">
                        ${flakyTests.length > 0 ? flakyTests.slice(0, 5).map((test, idx) => `
                            <div class="flex items-center justify-between p-3 bg-red-50 rounded border-l-4 border-red-500">
                                <div class="flex-1">
                                    <p class="font-semibold text-gray-800">${test.test_case_id}</p>
                                    <p class="text-xs text-gray-600">Score: ${test.flakiness_score}/100 | Rate: ${test.failure_rate}%</p>
                                </div>
                                <span class="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                    ${test.failed_runs}/${test.total_runs}
                                </span>
                            </div>
                        `).join('') : '<p class="text-gray-600">No flaky tests detected</p>'}
                    </div>
                </div>
            </div>

            <!-- Statistics Summary -->
            <div class="bg-white rounded-lg shadow-lg p-6">
                <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <i class="fas fa-chart-bar text-purple-500 mr-3"></i>
                    Test Statistics
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="text-center">
                        <p class="text-gray-600 text-sm font-semibold mb-2">Total Executions</p>
                        <p class="text-3xl font-bold text-blue-600">${stats.totalExecutions || 0}</p>
                    </div>
                    <div class="text-center">
                        <p class="text-gray-600 text-sm font-semibold mb-2">Flaky Tests</p>
                        <p class="text-3xl font-bold text-red-600">${stats.flakyTests || 0}</p>
                    </div>
                    <div class="text-center">
                        <p class="text-gray-600 text-sm font-semibold mb-2">Stability</p>
                        <p class="text-3xl font-bold text-green-600">${100 - (stats.flakyTests > 0 ? 20 : 0)}%</p>
                    </div>
                </div>
            </div>
        `;
    }

    // Coverage Visualizer Methods
    async loadCoverageVisualizer() {
        try {
            this.showLoadingState('Loading coverage data...');

            // Get all test cases
            const testCasesResponse = await fetch(`${this.apiBaseUrl}/test-cases`);
            const testCasesData = await testCasesResponse.json();
            const testCases = testCasesData.testCases || [];

            // Calculate coverage metrics
            const coverage = this.calculateCoverageMetrics(testCases);

            this.displayCoverageVisualizer(coverage, testCases);

        } catch (error) {
            console.error('Coverage error:', error);
            this.showError('Error loading coverage: ' + error.message);
        } finally {
            this.hideLoadingState();
        }
    }

    calculateCoverageMetrics(testCases) {
        // Calculate coverage based on test types
        const types = {};
        testCases.forEach(tc => {
            const type = tc.type || tc.testType || 'Unknown';
            types[type] = (types[type] || 0) + 1;
        });

        const totalTests = testCases.length;
        const functionalTests = types['Functional'] || 0;
        const accessibilityTests = types['Accessibility'] || 0;
        const apiTests = types['API'] || 0;
        const inputValidationTests = types['Input Validation'] || 0;

        return {
            totalTests: totalTests,
            functionalCoverage: Math.round((functionalTests / totalTests) * 100) || 0,
            accessibilityCoverage: Math.round((accessibilityTests / totalTests) * 100) || 0,
            apiCoverage: Math.round((apiTests / totalTests) * 100) || 0,
            inputValidationCoverage: Math.round((inputValidationTests / totalTests) * 100) || 0,
            byType: types
        };
    }

    displayCoverageVisualizer(coverage, testCases) {
        const container = document.getElementById('coverageVisualizerContent');
        if (!container) return;

        container.innerHTML = `
            <div class="space-y-8">
                <!-- Coverage Overview -->
                <div class="bg-white rounded-lg shadow-lg p-6">
                    <h3 class="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                        <i class="fas fa-chart-pie text-green-500 mr-3"></i>
                        Test Coverage Overview
                    </h3>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <!-- Coverage Breakdown -->
                        <div>
                            <h4 class="text-lg font-semibold text-gray-800 mb-4">Coverage by Type</h4>
                            <div class="space-y-5">
                                <div>
                                    <div class="flex justify-between items-center mb-2">
                                        <span class="text-sm font-medium text-gray-700">Functional Tests</span>
                                        <span class="text-sm font-bold text-blue-600">${coverage.functionalCoverage}%</span>
                                    </div>
                                    <div class="w-full bg-gray-200 rounded-full h-3">
                                        <div class="bg-blue-500 h-3 rounded-full" style="width: ${coverage.functionalCoverage}%"></div>
                                    </div>
                                </div>

                                <div>
                                    <div class="flex justify-between items-center mb-2">
                                        <span class="text-sm font-medium text-gray-700">Accessibility Tests</span>
                                        <span class="text-sm font-bold text-purple-600">${coverage.accessibilityCoverage}%</span>
                                    </div>
                                    <div class="w-full bg-gray-200 rounded-full h-3">
                                        <div class="bg-purple-500 h-3 rounded-full" style="width: ${coverage.accessibilityCoverage}%"></div>
                                    </div>
                                </div>

                                <div>
                                    <div class="flex justify-between items-center mb-2">
                                        <span class="text-sm font-medium text-gray-700">API Tests</span>
                                        <span class="text-sm font-bold text-green-600">${coverage.apiCoverage}%</span>
                                    </div>
                                    <div class="w-full bg-gray-200 rounded-full h-3">
                                        <div class="bg-green-500 h-3 rounded-full" style="width: ${coverage.apiCoverage}%"></div>
                                    </div>
                                </div>

                                <div>
                                    <div class="flex justify-between items-center mb-2">
                                        <span class="text-sm font-medium text-gray-700 min-w-0">Input Validation Tests</span>
                                        <span class="text-sm font-bold text-orange-600 ml-2">${coverage.inputValidationCoverage}%</span>
                                    </div>
                                    <div class="w-full bg-gray-200 rounded-full h-3">
                                        <div class="h-3 rounded-full" style="width: ${coverage.inputValidationCoverage}%; background-color: #f97316;"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Coverage Stats -->
                        <div>
                            <h4 class="text-lg font-semibold text-gray-800 mb-4">Coverage Statistics</h4>
                            <div class="space-y-3">
                                <div class="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                                    <p class="text-sm text-gray-600 font-semibold">Total Test Cases</p>
                                    <p class="text-3xl font-bold text-blue-600">${coverage.totalTests}</p>
                                </div>

                                <div class="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                                    <p class="text-sm text-gray-600 font-semibold">Overall Coverage</p>
                                    <p class="text-3xl font-bold text-green-600">${Math.round((coverage.functionalCoverage + coverage.accessibilityCoverage + coverage.apiCoverage + coverage.inputValidationCoverage) / 4)}%</p>
                                </div>

                                <div class="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                                    <p class="text-sm text-gray-600 font-semibold">Test Types Covered</p>
                                    <p class="text-3xl font-bold text-purple-600">${Object.keys(coverage.byType).length}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Test Cases by Type -->
                <div class="bg-white rounded-lg shadow-lg p-6">
                    <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                        <i class="fas fa-list text-blue-500 mr-3"></i>
                        Test Cases by Type
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        ${Object.entries(coverage.byType).map(([type, count]) => `
                            <div class="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                                <p class="text-sm font-semibold text-gray-700 mb-2">${type}</p>
                                <p class="text-3xl font-bold text-blue-600">${count}</p>
                                <p class="text-xs text-gray-600 mt-2">${Math.round((count / coverage.totalTests) * 100)}% of total</p>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Coverage Recommendations -->
                <div class="bg-white rounded-lg shadow-lg p-6">
                    <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                        <i class="fas fa-lightbulb text-yellow-500 mr-3"></i>
                        Coverage Recommendations
                    </h3>
                    <div class="space-y-3">
                        ${coverage.functionalCoverage === 0 ? '<div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded"><p class="text-yellow-800">⚠️ Add more Functional tests to improve coverage</p></div>' : ''}
                        ${coverage.accessibilityCoverage === 0 ? '<div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded"><p class="text-yellow-800">⚠️ Consider adding Accessibility tests</p></div>' : ''}
                        ${coverage.apiCoverage === 0 ? '<div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded"><p class="text-yellow-800">⚠️ Consider adding API tests</p></div>' : ''}
                        ${coverage.inputValidationCoverage === 0 ? '<div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded"><p class="text-yellow-800">⚠️ Consider adding Input Validation tests</p></div>' : ''}
                        ${coverage.functionalCoverage > 0 && coverage.accessibilityCoverage > 0 && coverage.apiCoverage > 0 ? '<div class="bg-green-50 border-l-4 border-green-500 p-4 rounded"><p class="text-green-800">✅ Good test coverage across multiple types!</p></div>' : ''}
                    </div>
                </div>
            </div>
        `;
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    new EnhancedAITestGenerator();
});
