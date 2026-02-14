const { test, expect } = require('@playwright/test');

test('FT_INSTRUCTION_001: Instruction-based Test', async ({ page }) => {
  console.log('🚀 Starting test: FT_INSTRUCTION_001');

  // Step 1: Navigate to page
  console.log('📋 Step 1: Navigate to https://github.com');
  await page.goto('https://github.com', { waitUntil: 'domcontentloaded', timeout: 30000 });
  console.log('✅ Page loaded');

  // Step 2: click Platform
  console.log('📋 Step 2: click Platform');
  const btn_platform_0 = page.locator('button, a, [role="button"]').filter({ hasText: 'Platform' }).first();
  await btn_platform_0.waitFor({ state: 'visible', timeout: 10000 });
  await btn_platform_0.click();
  console.log('✅ Platform clicked');
  await page.waitForTimeout(1000);

  // Step 3: click Why Github
  console.log('📋 Step 3: click Why Github');
  const btn_why_github_1 = page.locator('button, a, [role="button"]').filter({ hasText: 'Why Github' }).first();
  await btn_why_github_1.waitFor({ state: 'visible', timeout: 10000 });
  await btn_why_github_1.click();
  console.log('✅ Why Github clicked');
  await page.waitForTimeout(1000);

  // Step 4: verify Security the SDL
  console.log('📋 Step 4: verify Security the SDL');
  await expect(page.locator('body')).toContainText('Security the SDL', { timeout: 10000 });
  console.log('✅ Verified: Security the SDL');

  // Take final screenshot
  await page.screenshot({ path: 'test-results/FT_INSTRUCTION_001-final.png', fullPage: true });
  console.log('✅ Test completed successfully');
});