import { test, expect } from '@playwright/test'

test.describe('Homepage and Navigation', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/')
    
    await expect(page).toHaveTitle(/AI Qualifier/)
    await expect(page.getByRole('heading', { name: /AI Qualifier/i })).toBeVisible()
  })

  test('should have working navigation menu', async ({ page }) => {
    await page.goto('/')
    
    // Check main navigation links
    await expect(page.getByRole('link', { name: /qualifications/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible()
  })

  test('should navigate to qualifications page', async ({ page }) => {
    await page.goto('/')
    
    await page.getByRole('link', { name: /qualifications/i }).click()
    await expect(page).toHaveURL(/\/qualifications/)
    await expect(page.getByRole('heading', { name: /qualifications/i })).toBeVisible()
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    // Check that mobile menu exists
    await expect(page.getByRole('button', { name: /menu/i })).toBeVisible()
    
    // Open mobile menu
    await page.getByRole('button', { name: /menu/i }).click()
    await expect(page.getByRole('link', { name: /qualifications/i })).toBeVisible()
  })

  test('should have working search functionality', async ({ page }) => {
    await page.goto('/')
    
    // Look for search input
    const searchInput = page.getByRole('searchbox').or(page.getByPlaceholder(/search/i))
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('artificial intelligence')
      await searchInput.press('Enter')
      
      // Should navigate to search results or show results
      await expect(page).toHaveURL(/search|results/)
    }
  })

  test('should display footer with important links', async ({ page }) => {
    await page.goto('/')
    
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    
    // Check footer content
    await expect(page.getByRole('contentinfo')).toBeVisible()
    await expect(page.getByText(/AI Qualifier/i)).toBeVisible()
  })
})