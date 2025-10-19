import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * Accessibility testing utilities for Playwright E2E tests
 */

// Custom accessibility test function
export async function testAccessibility(page: any, options: {
  url?: string
  includeTags?: string[]
  excludeTags?: string[]
  rules?: Record<string, any>
} = {}) {
  const { url, includeTags, excludeTags, rules } = options
  
  if (url) {
    await page.goto(url)
  }

  let axeBuilder = new AxeBuilder({ page })
  
  if (includeTags) {
    axeBuilder = axeBuilder.withTags(includeTags)
  }
  
  if (excludeTags) {
    axeBuilder = axeBuilder.disableRules(excludeTags)
  }
  
  if (rules) {
    axeBuilder = axeBuilder.options({ rules })
  }

  const accessibilityScanResults = await axeBuilder.analyze()
  
  expect(accessibilityScanResults.violations).toEqual([])
  
  return accessibilityScanResults
}

// Common accessibility test configurations
export const a11yConfigs = {
  // WCAG 2.1 Level AA compliance
  wcag21aa: {
    includeTags: ['wcag2a', 'wcag2aa', 'wcag21aa']
  },
  
  // Critical accessibility issues only
  critical: {
    includeTags: ['wcag2a', 'wcag2aa'],
    excludeTags: ['experimental', 'best-practice']
  },
  
  // Form accessibility
  forms: {
    includeTags: ['wcag2a', 'wcag2aa'],
    rules: {
      'label': { enabled: true },
      'form-field-multiple-labels': { enabled: true },
      'duplicate-id-aria': { enabled: true }
    }
  },
  
  // Navigation accessibility
  navigation: {
    includeTags: ['wcag2a', 'wcag2aa'],
    rules: {
      'bypass': { enabled: true },
      'focus-order-semantics': { enabled: true },
      'landmark-one-main': { enabled: true }
    }
  }
}

// Accessibility assertions
export const a11yAssertions = {
  // Check for proper heading hierarchy
  async checkHeadingHierarchy(page: any) {
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all()
    
    if (headings.length === 0) return
    
    let previousLevel = 0
    for (const heading of headings) {
      const tagName = await heading.evaluate((el: HTMLElement) => el.tagName.toLowerCase())
      const currentLevel = parseInt(tagName.replace('h', ''))
      
      if (previousLevel > 0 && currentLevel > previousLevel + 1) {
        throw new Error(`Heading hierarchy violation: ${tagName} follows h${previousLevel}`)
      }
      
      previousLevel = currentLevel
    }
  },

  // Check for alt text on images
  async checkImageAltText(page: any) {
    const images = await page.locator('img').all()
    
    for (const img of images) {
      const alt = await img.getAttribute('alt')
      const ariaLabel = await img.getAttribute('aria-label')
      const ariaLabelledby = await img.getAttribute('aria-labelledby')
      const role = await img.getAttribute('role')
      
      // Decorative images should have empty alt or role="presentation"
      if (role === 'presentation' || alt === '') {
        continue
      }
      
      // Content images should have alt text or aria labels
      if (!alt && !ariaLabel && !ariaLabelledby) {
        const src = await img.getAttribute('src')
        throw new Error(`Image missing alt text: ${src}`)
      }
    }
  },

  // Check for form labels
  async checkFormLabels(page: any) {
    const formControls = await page.locator('input, select, textarea').all()
    
    for (const control of formControls) {
      const type = await control.getAttribute('type')
      
      // Skip hidden inputs and buttons
      if (type === 'hidden' || type === 'submit' || type === 'button') {
        continue
      }
      
      const id = await control.getAttribute('id')
      const ariaLabel = await control.getAttribute('aria-label')
      const ariaLabelledby = await control.getAttribute('aria-labelledby')
      
      // Check for associated label
      let hasLabel = false
      
      if (id) {
        const label = await page.locator(`label[for="${id}"]`).count()
        if (label > 0) hasLabel = true
      }
      
      if (ariaLabel || ariaLabelledby) {
        hasLabel = true
      }
      
      // Check if wrapped in label
      const parentLabel = await control.locator('xpath=ancestor::label').count()
      if (parentLabel > 0) hasLabel = true
      
      if (!hasLabel) {
        const tagName = await control.evaluate((el: HTMLElement) => el.tagName.toLowerCase())
        throw new Error(`Form control missing label: ${tagName}[type="${type}"]`)
      }
    }
  },

  // Check for keyboard navigation
  async checkKeyboardNavigation(page: any) {
    // Tab through interactive elements
    const interactiveElements = await page.locator('a, button, input, select, textarea, [tabindex]').all()
    
    for (let i = 0; i < Math.min(interactiveElements.length, 10); i++) {
      await page.keyboard.press('Tab')
      
      // Check if focus is visible
      const focusedElement = await page.locator(':focus').count()
      expect(focusedElement).toBeGreaterThan(0)
    }
  },

  // Check color contrast
  async checkColorContrast(page: any) {
    // This would require more complex color analysis
    // For now, we'll rely on axe-core's color-contrast rule
    await testAccessibility(page, {
      rules: {
        'color-contrast': { enabled: true }
      }
    })
  }
}