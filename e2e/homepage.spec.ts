import { test, expect } from '@playwright/test';

test('homepage loads with key elements', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/My Democracy/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: /contact/i }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /legislators/i }).first()).toBeVisible();
});

test('homepage has state picker', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('combobox', { name: /search for your state/i })).toBeVisible();
});
