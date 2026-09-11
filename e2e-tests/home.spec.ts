import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the correct title', async ({ page }) => {
    // Check that the page title is correct
    await expect(page).toHaveTitle('Tailspin Toys - Crowdfunding your new favorite game!');
  });

  test('should display the main heading', async ({ page }) => {
    // Check that the main page heading is present
    await expect(page.getByRole('heading', { name: 'Welcome to Tailspin Toys', exact: true })).toBeVisible();
  });

  test('should display the site branding in header', async ({ page }) => {
    // Check that the site branding is present in the header (no longer an h1)
    await expect(page.getByText('Tailspin Toys').first()).toBeVisible();
  });

  test('should display the welcome message', async ({ page }) => {
    // Check that the welcome message is present using more specific locator
    await expect(page.getByText('Find your next game! And maybe even back one! Explore our collection!')).toBeVisible();
  });

  test('should filter games by one or more categories', async ({ page }) => {
    const visibleCards = page.locator('[data-testid="game-card"]:not([hidden])');

    await test.step('Select multiple categories', async () => {
      await page.getByLabel('Strategy', { exact: true }).check();
      await page.getByLabel('Puzzle', { exact: true }).check();
    });

    await test.step('Verify category results', async () => {
      await expect(visibleCards).toHaveCount(8);
      await expect(page.getByTestId('game-filter-count')).toHaveText('8 games shown');
    });
  });

  test('should combine category and publisher filters', async ({ page }) => {
    const visibleCards = page.locator('[data-testid="game-card"]:not([hidden])');

    await page.getByLabel('Strategy', { exact: true }).check();
    await page.getByTestId('publisher-filter').selectOption({ label: 'CodeForge Studios' });

    await expect(visibleCards).toHaveCount(1);
    await expect(visibleCards).toContainText('DevOps Dominion');
    await expect(page.getByTestId('game-filter-count')).toHaveText('1 game shown');
  });

  test('should clear active filters', async ({ page }) => {
    await page.getByLabel('Strategy', { exact: true }).check();
    await page.getByTestId('publisher-filter').selectOption({ label: 'CodeForge Studios' });
    await page.getByTestId('clear-filters').click();

    await expect(page.getByTestId('publisher-filter')).toHaveValue('');
    await expect(page.getByLabel('Strategy', { exact: true })).not.toBeChecked();
    await expect(page.getByTestId('game-filter-count')).toHaveText('21 games shown');
  });
});
