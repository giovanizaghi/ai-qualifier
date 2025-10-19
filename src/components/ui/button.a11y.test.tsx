import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, testA11y } from '@/test/utils'
import { Button } from './button'

describe('Button Accessibility', () => {
  it('should be accessible with default props', async () => {
    await testA11y(<Button>Click me</Button>)
  })

  it('should be accessible when disabled', async () => {
    await testA11y(<Button disabled>Disabled Button</Button>)
  })

  it('should be accessible as a link', async () => {
    await testA11y(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    )
  })

  it('should have proper focus management', () => {
    render(<Button>Focus Test</Button>)
    
    const button = screen.getByRole('button', { name: /focus test/i })
    button.focus()
    
    expect(button).toHaveFocus()
  })

  it('should have accessible color contrast', async () => {
    // Test different variants for color contrast
    await testA11y(<Button variant="default">Default</Button>)
    await testA11y(<Button variant="destructive">Destructive</Button>)
    await testA11y(<Button variant="outline">Outline</Button>)
    await testA11y(<Button variant="secondary">Secondary</Button>)
    await testA11y(<Button variant="ghost">Ghost</Button>)
  })

  it('should work with screen readers', () => {
    render(<Button aria-label="Custom label">Button</Button>)
    
    const button = screen.getByRole('button', { name: /custom label/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('aria-label', 'Custom label')
  })

  it('should support ARIA attributes', async () => {
    await testA11y(
      <Button 
        aria-describedby="description"
        aria-expanded="false"
        aria-haspopup="menu"
      >
        Menu Button
      </Button>
    )
  })

  it('should be keyboard accessible', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Keyboard Test</Button>)
    
    const button = screen.getByRole('button', { name: /keyboard test/i })
    
    // Test Enter key
    button.focus()
    fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' })
    expect(handleClick).toHaveBeenCalledTimes(1)
    
    // Test Space key
    fireEvent.keyDown(button, { key: ' ', code: 'Space' })
    expect(handleClick).toHaveBeenCalledTimes(2)
  })
})