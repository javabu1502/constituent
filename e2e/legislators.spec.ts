import { test, expect } from '@playwright/test';

test('legislators page renders', async ({ page }) => {
  await page.goto('/legislators');
  await expect(page).toHaveTitle(/Legislators/i);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('legislators page shows state list or picker', async ({ page }) => {
  await page.goto('/legislators');
  const content = page.locator('main');
  await expect(content).not.toBeEmpty();
});
