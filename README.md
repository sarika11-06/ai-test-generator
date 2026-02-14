# AI-Powered Test Case Generation System

🤖 **Industry-grade AI system that automatically generates professional QA test cases**

This system uses advanced AI models to analyze web applications and generate comprehensive, professional-quality test cases that match industry QA standards. It supports multiple output formats and provides detailed analysis of application structure and testing requirements.

## 🎯 Key Features

- **Professional QA Output**: Generates test cases with proper IDs (FT_LOGIN_001, IV_FORM_004, API_AUTH_002), priorities, and validation steps
- **Modular AI Architecture**: Specialized components for application understanding, test type classification, and professional test generation
- **Multiple Output Formats**: Professional QA format, Playwright, Selenium, Cypress automation code
- **Comprehensive Test Coverage**: Functional, Input Validation, API, Accessibility, Performance, and Security tests
- **AI-Powered Analysis**: Intelligent application analysis with confidence scoring and reasoning
- **Industry Standards**: Follows professional QA testing standards and best practices

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ai-test-generator

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Build the project
npm run build
```

### Generate Test Cases (CLI)

```bash
# Generate professional test cases for a website
npm run generate -- generate -u https://example.com/login -o ./tests/login-tests.md

# Generate with specific test types
npm run generate -- generate -u https://example.com/app \
  --types functional,inputValidation,api,security \
  --include-accessibility \
  --include-performance \
  -o ./tests/comprehensive-tests.md

# Analyze a website without generating tests
npm run generate -- analyze -u https://example.com/app -o ./analysis/app-analysis.md

# Run demo with sample websites
npm run generate -- demo
```

### Start API Server

```bash
# Start the API server
npm start

# The server will be available at http://localhost:3000
```

## 📋 How to Generate Test Cases

### Method 1: Command Line Interface (CLI)

The CLI is the fastest way to generate test cases:

```bash
# Basic test generation
npm run generate -- generate -u <website-url> -o <output-file>

# Advanced options
npm run generate -- generate \
  --url https://myapp.com/login \
  --output ./tests/login-suite.md \
  --format professional \
  --types functional,inputValidation,security \
  --priority High \
  --include-accessibility \
  --include-performance \
  --intent "Test user authentication and security"
```

**CLI Options:**
- `-u, --url <url>`: Website URL to analyze (required)
- `-o, --output <file>`: Output file path (default: ./generated-tests.md)
- `-f, --format <format>`: Output format (professional|playwright|selenium|cypress)
- `-t, --types <types>`: Test types to include (comma-separated)
- `-p, --priority <priority>`: Test priority level (Critical|High|Medium|Low)
- `--include-accessibility`: Include accessibility tests
- `--include-performance`: Include performance tests  
- `--include-security`: Include security tests
- `--intent <intent>`: Testing intent description

### Method 2: REST API

Use the REST API for integration with other tools:

```bash
# Generate test cases
curl -X POST http://localhost:3000/api/generate-tests \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/login",
    "testTypes": ["functional", "inputValidation", "security"],
    "priority": "High",
    "includeAccessibility": true,
    "includeSecurity": true
  }'

# Analyze application
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/app"}'

# Format existing tests
curl -X POST http://localhost:3000/api/format-tests \
  -H "Content-Type: application/json" \
  -d '{
    "testSuite": {...},
    "format": "playwright"
  }'
```

### Method 3: Programmatic Usage

Use the AI system directly in your code:

```typescript
import { AIOrchestrator, TestGenerationRequest } from './src';

const orchestrator = new AIOrchestrator();

// Generate test cases
const request: TestGenerationRequest = {
  url: 'https://example.com/login',
  testTypes: ['functional', 'inputValidation', 'security'],
  priority: 'High',
  includeAccessibility: true,
  includeSecurity: true
};

const testSuite = await orchestrator.processTestGenerationRequest(request);
console.log(`Generated ${testSuite.functionalTests.length} functional tests`);

// Analyze application
const analysis = await orchestrator.analyzeApplication('https://example.com/app');
console.log(`Website category: ${analysis.websiteCategory}`);
console.log(`Complexity: ${analysis.complexity}`);
```

## 📊 Example Output

### Professional QA Format

```markdown
### FT_LOGIN_001

**Test Type:** Functional – Smoke
**Priority:** High

**Preconditions:**
- User account exists in system
- Login page is accessible
- Browser supports JavaScript

**Steps:**
1. Navigate to login page
   Expected: Login form displays
2. Enter valid email address (Data: test@example.com)
   Expected: Email field accepts input
3. Enter valid password (Data: validPassword123)
   Expected: Password field accepts input
4. Click Login button
   Expected: Form submits and user is redirected

**Expected Result:** User is redirected to dashboard page and session is established

**Validation:**
- **Dashboard URL detected:** URL contains "/dashboard" or user is redirected from login page
- **User avatar visible:** User avatar or profile element is visible
- **Session token present:** Authentication token exists in localStorage or cookies

**Execution Status:** NOT_RUN
**Stability:** Stable
**Requirements:** REQ-AUTH-001, REQ-DASH-001
```

### Playwright Automation Code

```typescript
import { test, expect } from '@playwright/test';

test('FT_LOGIN_001: Functional', async ({ page }) => {
  // User is redirected to dashboard page and session is established
  await page.goto('https://example.com/login');
  await page.fill('#email', 'test@example.com');
  await page.fill('#password', 'validPassword123');
  await page.click('#loginBtn');
  await expect(page).toHaveURL(/dashboard/i);
});
```

## 🏗️ System Architecture

The system uses a modular AI architecture with specialized components:

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Orchestrator                          │
├─────────────────────────────────────────────────────────────┤
│  Application Understanding → Test Type Classifier →         │
│  Professional Test Generator → Test Validator               │
└─────────────────────────────────────────────────────────────┘
```

### Core Components

1. **Application Understanding Module**: Analyzes DOM structure, APIs, and frameworks
2. **Test Type Classifier**: Determines appropriate test types with confidence scoring
3. **Professional Test Case Generator**: Creates industry-standard test cases
4. **Test Case Validator**: Validates tests using AI + rule-based validation
5. **AI Orchestrator**: Coordinates all components and manages the generation pipeline

## 🧪 Test Types Supported

| Test Type | Description | Example Use Cases |
|-----------|-------------|-------------------|
| **Functional** | Core functionality and user workflows | Login, navigation, form submission |
| **Input Validation** | Form validation and data input handling | Required fields, email format, XSS protection |
| **API** | API endpoints and responses | Authentication APIs, data validation |
| **Accessibility** | WCAG compliance and accessibility | Keyboard navigation, screen reader support |
| **Performance** | Page load times and performance metrics | Load time, API response time |
| **Security** | Common security vulnerabilities | SQL injection, XSS, authentication security |

## 📈 Quality Metrics

The system provides comprehensive quality metrics for generated test suites:

- **Coverage Score**: Percentage of application elements covered by tests
- **Diversity Score**: Variety of test types and scenarios
- **Maintainability Score**: Code quality and structure assessment
- **Professional Standards Score**: Adherence to QA industry standards
- **AI Quality Score**: Overall AI-generated content quality

## 🔧 Configuration

### Environment Variables

```bash
# Server Configuration
NODE_ENV=development
PORT=3000

# AI Model Configuration
MODEL_REGISTRY_URL=http://localhost:5000
TENSORFLOW_BACKEND=cpu
GPU_MEMORY_LIMIT=4096

# Training Configuration
TRAINING_DATA_PATH=./data/training
MODEL_STORAGE_PATH=./models
BATCH_SIZE=32
LEARNING_RATE=0.001

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

### Supported Output Formats

- **Professional**: Industry-standard QA test case format
- **Playwright**: Playwright automation test code
- **Selenium**: Selenium WebDriver test code  
- **Cypress**: Cypress test automation code

## 🧪 Testing

```bash
# Run all tests
npm test

# Run property-based tests
npm test -- --testNamePattern="Property"

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test application-understanding.test.ts
```

## 📚 API Reference

For detailed API documentation including request/response schemas, test case structures, and usage examples, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).

**Quick Reference:**

### POST /api/generate-tests

Generate comprehensive test cases for a website with support for multiple test types.

**New Features:**
- 🎯 **Intelligent Test Type Detection**: Automatically detects whether to generate functional, accessibility, or API tests based on your prompt
- ♿ **Accessibility Testing**: Generate WCAG-compliant accessibility tests with axe-core integration
- 🔌 **API Testing**: Generate comprehensive API tests with schema validation and performance checks
- 🎨 **Multiple Test Types**: Generate multiple test types in a single request using the `testTypes` parameter

**Request Body:**
```json
{
  "url": "https://example.com/login",
  "prompt": "Test keyboard navigation and screen reader compatibility",
  "testTypes": ["functional", "accessibility", "api"],
  "outputFormat": "json",
  "priority": "High",
  "includeAccessibility": true,
  "includePerformance": false,
  "includeSecurity": true,
  "intent": "Test user authentication flow"
}
```

**Key Parameters:**
- `url` (required): Website URL to test
- `prompt` or `intent`: Natural language description of what to test
- `testTypes` (optional): Explicit test types - `["functional", "accessibility", "api"]`
  - If omitted, system auto-detects from prompt
- `outputFormat`: `"json"` (default) or `"playwright"` for executable code

**Response:**
```json
{
  "success": true,
  "data": {
    "testSuiteId": "uuid",
    "generatedAt": "2024-01-07T10:00:00Z",
    "functionalTests": [...],
    "inputValidationTests": [...],
    "accessibilityTests": [...],
    "apiTests": [...],
    "securityTests": [...],
    "testCases": [...],
    "aiQualityScore": 0.92,
    "estimatedExecutionTime": 1800,
    "playwrightCode": "// Generated code (if outputFormat=playwright)"
  },
  "message": "Generated 15 test cases successfully"
}
```

### POST /api/analyze

Analyze a website without generating tests.

**Request Body:**
```json
{
  "url": "https://example.com/app"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "analysis": {
      "websiteCategory": "saas",
      "complexity": "medium",
      "overallConfidence": 0.87,
      "applicationContext": {...},
      "recommendedTestTypes": {...}
    },
    "explanation": "AI Analysis Results for https://example.com/app..."
  }
}
```

### GET /api/test-types

Get supported test types and formats.

**Response:**
```json
{
  "success": true,
  "data": {
    "testTypes": [
      {
        "id": "functional",
        "name": "Functional Testing",
        "description": "Tests core functionality and user workflows"
      }
    ],
    "formats": [
      {
        "id": "professional",
        "name": "Professional QA Format",
        "description": "Industry-standard test case format"
      }
    ]
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with industry-grade QA standards in mind
- Inspired by professional testing methodologies
- Uses modern AI/ML techniques for intelligent test generation
- Designed for real-world enterprise testing scenarios

---

**🎯 Ready to generate professional test cases? Start with:**

```bash
npm run generate -- generate -u https://your-website.com -o ./my-tests.md
```