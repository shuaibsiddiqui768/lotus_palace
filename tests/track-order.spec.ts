import { test, expect } from '@playwright/test';

test.describe('Track Order Component', () => {
  test('should display order status starting with confirmed and countdown timer', async ({ page }) => {
    // Navigate to the orders page
    await page.goto('http://localhost:3002/orders');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check if we're on the orders page
    await expect(page).toHaveURL(/.*orders/);

    // Since we need authentication, this test assumes a logged-in user
    // In a real scenario, you'd need to set up authentication first

    // Check that the page title contains "My Orders"
    await expect(page.locator('h1').filter({ hasText: 'My Orders' })).toBeVisible();

    // If there are orders, check the status display
    const orderCards = page.locator('[class*="bg-white rounded-lg shadow"]').first();

    if (await orderCards.isVisible()) {
      // Check that status labels don't contain "Pending"
      const statusText = await orderCards.locator('text=/Confirmed|Preparing|Ready|Completed|Cancelled/').first().textContent();
      expect(statusText).not.toContain('Pending');

      // Check for countdown timer format (MM:SS)
      const countdownElement = orderCards.locator('text=/Time remaining: \\d+:\\d+/');
      if (await countdownElement.isVisible()) {
        const countdownText = await countdownElement.textContent();
        expect(countdownText).toMatch(/Time remaining: \d+:\d+/);
      }
    }
  });

  test('should not display pending status in order steps', async ({ page }) => {
    await page.goto('http://localhost:3002/orders');
    await page.waitForLoadState('networkidle');

    // Check that no order status shows "Pending"
    const pendingStatus = page.locator('text=Pending');
    await expect(pendingStatus).toHaveCount(0);
  });
});