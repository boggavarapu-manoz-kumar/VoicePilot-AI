import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

describe('Reusable UI Components Suite', () => {
  it('renders Badge with text and variant classes', () => {
    const { container } = render(<Badge variant="success">Active Status</Badge>);
    expect(container.textContent).toContain('Active Status');
    expect(container.firstElementChild?.className).toContain('text-emerald-700');
  });

  it('renders Button with children and disabled attribute when disabled', () => {
    render(<Button disabled>Click Me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeDefined();
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });

  it('renders Card with title and content', () => {
    render(
      <Card title="Test Card" subtitle="Test Subtitle">
        <div>Card Inner Body</div>
      </Card>
    );
    expect(screen.getByText('Test Card')).toBeDefined();
    expect(screen.getByText('Test Subtitle')).toBeDefined();
    expect(screen.getByText('Card Inner Body')).toBeDefined();
  });
});
