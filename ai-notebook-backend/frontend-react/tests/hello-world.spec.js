const { test, expect } = require('@playwright/test');

test('check if element is present', async ({ page }) => {
  await page.goto('http://localhost:3000');
  const element = await page.locator('selector-for-element');
  await expect(element).toBeVisible();
});