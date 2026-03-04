import { test, expect } from '@playwright/test';

test('contact page shows address step', async ({ page }) => {
  await page.goto('/contact');
  await expect(page).toHaveTitle(/Contact/i);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/contact/i);
  await expect(page.getByPlaceholder(/address/i).or(page.getByLabel(/address/i))).toBeVisible();
});
