import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should display sign in page', async ({ page }) => {
    await page.goto('/auth/signin')
    
    await expect(page).toHaveTitle(/AI Qualifier/)
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible()
    await expect(page.getByRole('textbox', { name: /password/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('should display sign up page', async ({ page }) => {
    await page.goto('/auth/signup')
    
    await expect(page).toHaveTitle(/AI Qualifier/)
    await expect(page.getByRole('heading', { name: /sign up/i })).toBeVisible()
    await expect(page.getByRole('textbox', { name: /name/i })).toBeVisible()
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible()
    await expect(page.getByRole('textbox', { name: /password/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible()
  })

  test('should navigate between sign in and sign up', async ({ page }) => {
    await page.goto('/auth/signin')
    
    // Click link to sign up
    await page.getByRole('link', { name: /sign up/i }).click()
    await expect(page).toHaveURL(/\/auth\/signup/)
    
    // Click link back to sign in
    await page.getByRole('link', { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/auth\/signin/)
  })

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/auth/signin')
    
    // Try to submit empty form
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Should show validation errors
    await expect(page.getByText(/email is required/i)).toBeVisible()
    await expect(page.getByText(/password is required/i)).toBeVisible()
  })

  test('should show validation errors for invalid email', async ({ page }) => {
    await page.goto('/auth/signin')
    
    // Enter invalid email
    await page.getByRole('textbox', { name: /email/i }).fill('invalid-email')
    await page.getByRole('textbox', { name: /password/i }).fill('password123')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Should show email validation error
    await expect(page.getByText(/invalid email/i)).toBeVisible()
  })
})