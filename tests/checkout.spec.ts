import { test, expect } from '@playwright/test';

test('checkout process creates order with confirmed status', async ({ page }) => {
  // Navigate to the menu page
  await page.goto('http://localhost:3002/menu');

  // Wait for the page to load
  await page.waitForLoadState('networkidle');

  // Add an item to cart (assuming there's at least one food item)
  const addToCartButton = page.locator('button').filter({ hasText: 'Add to Cart' }).first();
  await expect(addToCartButton).toBeVisible();
  await addToCartButton.click();

  // Go to cart
  await page.goto('http://localhost:3002/cart');

  // Proceed to checkout
  const checkoutButton = page.locator('button').filter({ hasText: 'Proceed to Checkout' });
  await expect(checkoutButton).toBeVisible();
  await checkoutButton.click();

  // Fill checkout form
  await page.fill('input[name="name"]', 'Test User');
  await page.fill('input[name="phone"]', '1234567890');
  await page.fill('input[name="email"]', 'test@example.com');

  // Select takeaway
  await page.check('input[value="takeaway"]');

  // Select UPI payment
  await page.check('input[value="upi"]');

  // Confirm payment
  const confirmButton = page.locator('button').filter({ hasText: 'Confirm Payment' });
  await expect(confirmButton).toBeVisible();
  await confirmButton.click();

  // Wait for success message
  const successMessage = page.locator('text=Payment Confirmed!');
  await expect(successMessage).toBeVisible({ timeout: 10000 });

  // Verify no error message
  const errorMessage = page.locator('text=Failed to place order');
  await expect(errorMessage).not.toBeVisible();
});