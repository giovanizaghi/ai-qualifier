import { render, screen } from '@testing-library/react';
import { ScoreBadge } from '../qualify/score-badge';

describe('ScoreBadge', () => {
  test('renders excellent score correctly', () => {
    render(<ScoreBadge score={85} fitLevel="EXCELLENT" />);
    
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('Excellent Fit')).toBeInTheDocument();
  });

  test('renders good score correctly', () => {
    render(<ScoreBadge score={70} fitLevel="GOOD" />);
    
    expect(screen.getByText('70')).toBeInTheDocument();
    expect(screen.getByText('Good Fit')).toBeInTheDocument();
  });

  test('renders fair score correctly', () => {
    render(<ScoreBadge score={50} fitLevel="FAIR" />);
    
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('Fair Fit')).toBeInTheDocument();
  });

  test('renders poor score correctly', () => {
    render(<ScoreBadge score={25} fitLevel="POOR" />);
    
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('Poor Fit')).toBeInTheDocument();
  });

  test('rounds score to nearest integer', () => {
    render(<ScoreBadge score={84.7} fitLevel="EXCELLENT" />);
    
    expect(screen.getByText('85')).toBeInTheDocument();
  });

  test('applies correct color classes for different scores', () => {
    const { rerender } = render(<ScoreBadge score={85} fitLevel="EXCELLENT" />);
    
    let scoreElement = screen.getByText('85');
    expect(scoreElement).toHaveClass('text-green-600');
    
    rerender(<ScoreBadge score={65} fitLevel="GOOD" />);
    scoreElement = screen.getByText('65');
    expect(scoreElement).toHaveClass('text-blue-600');
    
    rerender(<ScoreBadge score={45} fitLevel="FAIR" />);
    scoreElement = screen.getByText('45');
    expect(scoreElement).toHaveClass('text-yellow-600');
    
    rerender(<ScoreBadge score={25} fitLevel="POOR" />);
    scoreElement = screen.getByText('25');
    expect(scoreElement).toHaveClass('text-red-600');
  });

  test('applies different sizes correctly', () => {
    const { rerender } = render(<ScoreBadge score={75} fitLevel="GOOD" size="sm" />);
    
    let badgeElement = screen.getByText('Good Fit');
    expect(badgeElement).toHaveClass('text-xs', 'px-2', 'py-0.5');
    
    rerender(<ScoreBadge score={75} fitLevel="GOOD" size="md" />);
    badgeElement = screen.getByText('Good Fit');
    expect(badgeElement).toHaveClass('text-sm', 'px-3', 'py-1');
    
    rerender(<ScoreBadge score={75} fitLevel="GOOD" size="lg" />);
    badgeElement = screen.getByText('Good Fit');
    expect(badgeElement).toHaveClass('text-base', 'px-4', 'py-1.5');
  });

  test('applies correct badge colors for fit levels', () => {
    const { rerender } = render(<ScoreBadge score={85} fitLevel="EXCELLENT" />);
    
    let badgeElement = screen.getByText('Excellent Fit');
    expect(badgeElement).toHaveClass('bg-green-100', 'text-green-800', 'border-green-300');
    
    rerender(<ScoreBadge score={70} fitLevel="GOOD" />);
    badgeElement = screen.getByText('Good Fit');
    expect(badgeElement).toHaveClass('bg-blue-100', 'text-blue-800', 'border-blue-300');
    
    rerender(<ScoreBadge score={50} fitLevel="FAIR" />);
    badgeElement = screen.getByText('Fair Fit');
    expect(badgeElement).toHaveClass('bg-yellow-100', 'text-yellow-800', 'border-yellow-300');
    
    rerender(<ScoreBadge score={30} fitLevel="POOR" />);
    badgeElement = screen.getByText('Poor Fit');
    expect(badgeElement).toHaveClass('bg-red-100', 'text-red-800', 'border-red-300');
  });
});