import { test, expect } from '@playwright/test';

test('regulations page loads', async ({ page }) => {
  await page.goto('/regulations');
  await expect(page).toHaveTitle(/Regulations/i);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
