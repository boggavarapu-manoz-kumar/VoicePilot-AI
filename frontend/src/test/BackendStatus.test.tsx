import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BackendStatus } from '../components/BackendStatus';
import { HealthStatus } from '../types/api';

describe('BackendStatus Component Suite', () => {
  it('renders operational state when health status is UP', () => {
    const mockHealth: HealthStatus = {
      status: 'UP',
      version: '0.0.1-SNAPSHOT',
      environment: 'dev',
      timestamp: new Date().toISOString(),
      components: {
        application: { status: 'UP', details: 'Running cleanly' },
        database: { status: 'UP', details: 'Connected to H2' },
      },
    };

    render(
      <BackendStatus
        health={mockHealth}
        isLoading={false}
        error={null}
        onRefresh={vi.fn()}
      />
    );

    expect(screen.getByText('Operational')).toBeDefined();
    expect(screen.getByText('v0.0.1-SNAPSHOT')).toBeDefined();
    expect(screen.getByText('End-to-end verified via CORS-enabled REST API client.')).toBeDefined();
  });

  it('renders unavailable state and error message when backend connection fails', () => {
    render(
      <BackendStatus
        health={null}
        isLoading={false}
        error="Network connection refused"
        onRefresh={vi.fn()}
      />
    );

    expect(screen.getByText('Unavailable')).toBeDefined();
    expect(screen.getByText(/Network connection refused/i)).toBeDefined();
  });

  it('renders loading state when checking backend health', () => {
    render(
      <BackendStatus
        health={null}
        isLoading={true}
        error={null}
        onRefresh={vi.fn()}
      />
    );

    const checkingElements = screen.getAllByText('Checking');
    expect(checkingElements.length).toBeGreaterThanOrEqual(1);
  });
});
