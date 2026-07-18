import { test, expect } from '@playwright/test';

test.describe('Smoke tests', () => {
  test('landing page loads with hero text', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /stop re-reading/i })).toBeVisible();
    await expect(page.getByText('START KNOWING.')).toBeVisible();
    await expect(page.getByRole('button', { name: /get started/i })).toBeVisible();
    await expect(page.getByText('The whole thing takes 90 seconds')).toBeVisible();
  });

  test('landing page has working auth navigation', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /enter/i }).first().click();
    await expect(page).toHaveURL(/\/auth/);
  });

  test('auth page shows sign in form', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText("Back already?")).toBeVisible();
    await expect(page.getByText("Good. Your streak was getting worried.")).toBeVisible();
  });

  test('auth page toggles to sign up', async ({ page }) => {
    await page.goto('/auth');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByText("Let's get you in")).toBeVisible();
    await expect(page.getByText("Takes 30 seconds")).toBeVisible();
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText("Back already?")).toBeVisible();
  });

  test('auth page shows validation for weak password', async ({ page }) => {
    await page.goto('/auth');
    await page.getByRole('button', { name: /create account/i }).click();
    // Type a weak password
    await page.getByPlaceholder(/username/i).fill('testuser_e2e');
    await page.getByPlaceholder(/email/i).fill('test@example.com');
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill('weak');
    // Submit should trigger validation
    await page.getByRole('button', { name: /create account/i }).click();
    // Should show an error about password requirements
    await expect(page.getByText(/password|weak|short|8/i)).toBeVisible();
  });

  test('auth page shows forgot password flow', async ({ page }) => {
    await page.goto('/auth');
    await page.getByText(/forgot password/i).click();
    await expect(page.getByText(/reset|forgot/i)).toBeVisible();
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
  });

  test('404 page shows for unknown routes', async ({ page }) => {
    await page.goto('/this-path-does-not-exist');
    await expect(page.getByText('Dead end')).toBeVisible();
    await expect(page.getByText("This synapse doesn't connect")).toBeVisible();
  });

  test('landing page renders all sections', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Drop your notes in')).toBeVisible();
    await expect(page.getByText('Make a room')).toBeVisible();
    await expect(page.getByText('Feed it your notes')).toBeVisible();
    await expect(page.getByText('Study mode', { exact: true })).toBeVisible();
    await expect(page.getByText('Challenge mode', { exact: true })).toBeVisible();
    await expect(page.getByText('Exam mode', { exact: true })).toBeVisible();
    await expect(page.getByText('Your next exam is closer than you think')).toBeVisible();
  });

  test('landing page has theme toggle', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByRole('button', { name: /toggle theme|switch theme/i });
    await expect(toggle).toBeVisible();
    await toggle.click();
    // After click, theme should change — verify by checking class
    await expect(page.locator('html')).toHaveAttribute('class', /dark/);
  });

  test('landing page footer has links', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Synapse').first()).toBeVisible();
    await expect(page.getByText(/All rights reserved/i)).toBeVisible();
  });

  test('redirect from /dashboard without auth goes to /auth', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    // Should redirect to auth since not logged in
    await expect(page).toHaveURL(/\/auth/);
  });

  test('redirect from /profile without auth goes to /auth', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/auth/);
  });

  test('redirect from /preferences without auth goes to /auth', async ({ page }) => {
    await page.goto('/preferences');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/auth/);
  });

  test('recall page without auth redirects', async ({ page }) => {
    await page.goto('/recall');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/auth/);
  });

  test('landing page PWA install section is present', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/install|add to home|pwa/i)).toBeVisible();
  });

  // Accessibility: check basic landmarks exist on landing page
  test('landing page has semantic landmarks', async ({ page }) => {
    await page.goto('/');
    // Check for main content area and navigation
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  // Responsive: verify mobile menu works
  test('landing page is responsive', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await expect(page.getByText('START KNOWING.')).toBeVisible();
    await expect(page.getByRole('button', { name: /get started/i })).toBeVisible();
  });
});
