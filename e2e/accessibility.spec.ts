import { test, expect } from '@playwright/test'
import { testAccessibility, a11yConfigs, a11yAssertions } from '../src/test/accessibility'

test.describe('Accessibility Tests', () => {
  test('homepage should be accessible', async ({ page }) => {
    await page.goto('/')
    
    // Run full accessibility scan
    await testAccessibility(page, a11yConfigs.wcag21aa)
    
    // Additional manual checks
    await a11yAssertions.checkHeadingHierarchy(page)
    await a11yAssertions.checkImageAltText(page)
  })

  test('authentication pages should be accessible', async ({ page }) => {
    // Test sign in page
    await page.goto('/auth/signin')
    await testAccessibility(page, a11yConfigs.forms)
    await a11yAssertions.checkFormLabels(page)
    
    // Test sign up page
    await page.goto('/auth/signup')
    await testAccessibility(page, a11yConfigs.forms)
    await a11yAssertions.checkFormLabels(page)
  })

  test('navigation should be keyboard accessible', async ({ page }) => {
    await page.goto('/')
    
    // Test keyboard navigation
    await a11yAssertions.checkKeyboardNavigation(page)
    
    // Test navigation accessibility
    await testAccessibility(page, a11yConfigs.navigation)
  })

  test('assessment interface should be accessible', async ({ page }) => {
    await page.goto('/assessments')
    
    // Run accessibility scan
    await testAccessibility(page, a11yConfigs.wcag21aa)
    
    // Check specific assessment accessibility
    await a11yAssertions.checkHeadingHierarchy(page)
    await a11yAssertions.checkImageAltText(page)
  })

  test('dashboard should be accessible', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Run accessibility scan
    await testAccessibility(page, a11yConfigs.wcag21aa)
    
    // Check dashboard-specific accessibility
    await a11yAssertions.checkHeadingHierarchy(page)
  })

  test('should have proper focus management', async ({ page }) => {
    await page.goto('/')
    
    // Test that focus is trapped in modals/dialogs
    const modalTrigger = page.getByRole('button', { name: /open|menu/i }).first()
    
    if (await modalTrigger.isVisible()) {
      await modalTrigger.click()
      
      // Focus should be inside modal
      const modal = page.locator('[role="dialog"], .modal, [data-modal]').first()
      if (await modal.isVisible()) {
        await page.keyboard.press('Tab')
        const focusedElement = page.locator(':focus')
        const focusInModal = await modal.locator(':focus').count()
        expect(focusInModal).toBeGreaterThan(0)
      }
    }
  })

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/')
    
    // Test color contrast using axe-core
    await a11yAssertions.checkColorContrast(page)
  })

  test('should work with screen readers', async ({ page }) => {
    await page.goto('/')
    
    // Check for proper ARIA labels and roles
    await testAccessibility(page, {
      includeTags: ['wcag2a', 'wcag2aa'],
      rules: {
        'aria-label': { enabled: true },
        'aria-labelledby': { enabled: true },
        'aria-describedby': { enabled: true },
        'button-name': { enabled: true },
        'link-name': { enabled: true }
      }
    })
  })

  test('should be accessible on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    // Run accessibility scan on mobile
    await testAccessibility(page, a11yConfigs.wcag21aa)
    
    // Check mobile-specific accessibility
    await a11yAssertions.checkKeyboardNavigation(page)
  })

  test('should handle reduced motion preferences', async ({ page }) => {
    // Simulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    
    // Check that animations are reduced/disabled
    const animatedElements = await page.locator('[class*="animate"], [style*="animation"]').all()
    
    for (const element of animatedElements) {
      const styles = await element.evaluate((el) => getComputedStyle(el))
      
      // Animations should be disabled or significantly reduced
      if (styles.animationDuration && styles.animationDuration !== '0s') {
        expect(parseFloat(styles.animationDuration)).toBeLessThan(0.2)
      }
    }
  })

  test('should have proper landmark regions', async ({ page }) => {
    await page.goto('/')
    
    // Check for required landmark regions
    await expect(page.locator('[role="main"], main')).toBeVisible()
    await expect(page.locator('[role="navigation"], nav')).toBeVisible()
    
    // Optional landmarks
    const header = await page.locator('[role="banner"], header').count()
    const footer = await page.locator('[role="contentinfo"], footer').count()
    
    // At least one should exist
    expect(header + footer).toBeGreaterThan(0)
  })
})