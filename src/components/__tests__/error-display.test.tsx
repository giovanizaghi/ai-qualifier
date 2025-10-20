import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorDisplay, ErrorCard, ErrorBoundaryFallback, InlineError } from '../shared/error-display';

describe('ErrorDisplay', () => {
  test('renders error variant correctly', () => {
    render(<ErrorDisplay message="Something went wrong" variant="error" />);
    
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  test('renders warning variant correctly', () => {
    render(<ErrorDisplay message="This is a warning" variant="warning" />);
    
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('This is a warning')).toBeInTheDocument();
  });

  test('renders info variant correctly', () => {
    render(<ErrorDisplay message="Here is some info" variant="info" />);
    
    expect(screen.getByText('Information')).toBeInTheDocument();
    expect(screen.getByText('Here is some info')).toBeInTheDocument();
  });

  test('uses custom title when provided', () => {
    render(<ErrorDisplay message="Test message" title="Custom Title" />);
    
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  test('shows retry button when onRetry is provided', () => {
    const onRetry = jest.fn();
    render(<ErrorDisplay message="Test message" onRetry={onRetry} />);
    
    const retryButton = screen.getByText('Try Again');
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  test('does not show retry button when onRetry is not provided', () => {
    render(<ErrorDisplay message="Test message" />);
    
    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
  });
});

describe('ErrorCard', () => {
  test('renders with default title and message', () => {
    render(<ErrorCard message="Error occurred" />);
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Error occurred')).toBeInTheDocument();
  });

  test('renders with custom title', () => {
    render(<ErrorCard title="Custom Error" message="Error message" />);
    
    expect(screen.getByText('Custom Error')).toBeInTheDocument();
  });

  test('shows retry button when onRetry provided', () => {
    const onRetry = jest.fn();
    render(<ErrorCard message="Test" onRetry={onRetry} />);
    
    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  test('shows back button when onBack provided', () => {
    const onBack = jest.fn();
    render(<ErrorCard message="Test" onBack={onBack} />);
    
    const backButton = screen.getByText('Go Back');
    fireEvent.click(backButton);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  test('shows both buttons when both callbacks provided', () => {
    const onRetry = jest.fn();
    const onBack = jest.fn();
    render(<ErrorCard message="Test" onRetry={onRetry} onBack={onBack} />);
    
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Go Back')).toBeInTheDocument();
  });
});

describe('ErrorBoundaryFallback', () => {
  test('renders error message and retry button', () => {
    const error = new Error('Test error message');
    const resetErrorBoundary = jest.fn();
    
    render(<ErrorBoundaryFallback error={error} resetErrorBoundary={resetErrorBoundary} />);
    
    expect(screen.getByText('Application Error')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
    
    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);
    expect(resetErrorBoundary).toHaveBeenCalledTimes(1);
  });
});

describe('InlineError', () => {
  test('renders error message', () => {
    render(<InlineError message="Inline error message" />);
    
    expect(screen.getByText('Inline error message')).toBeInTheDocument();
  });

  test('applies custom className', () => {
    const { container } = render(<InlineError message="Test" className="custom-class" />);
    
    const errorElement = container.querySelector('.custom-class');
    expect(errorElement).toBeInTheDocument();
  });
});