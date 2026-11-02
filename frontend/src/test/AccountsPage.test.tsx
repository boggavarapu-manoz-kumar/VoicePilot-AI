import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AccountsPage } from '../pages/AccountsPage';
import { accountsApi } from '../lib/accountsApi';
import { contactsApi } from '../lib/contactsApi';
import { ApiErrorResponse } from '../lib/api';

vi.mock('../lib/accountsApi', () => ({
  accountsApi: {
    listAccounts: vi.fn(),
    getAccount: vi.fn(),
    createAccount: vi.fn(),
    updateAccount: vi.fn(),
    deleteAccount: vi.fn(),
  },
}));

vi.mock('../lib/contactsApi', () => ({
  contactsApi: {
    listContacts: vi.fn(),
    getContact: vi.fn(),
    createContact: vi.fn(),
    updateContact: vi.fn(),
    deleteContact: vi.fn(),
  },
}));

describe('AccountsPage Enterprise CRM Suite', () => {
  const mockAccounts = [
    {
      id: 10,
      name: 'Wayne Enterprises',
      domain: 'wayne.corp',
      industry: 'Defense',
      phone: '+1-555-0100',
      website: 'https://wayne.corp',
      status: 'ACTIVE' as const,
      contactCount: 3,
      createdAt: '2026-10-31T00:00:00Z',
      updatedAt: '2026-10-31T00:00:00Z',
    },
    {
      id: 11,
      name: 'Stark Industries',
      domain: 'stark.com',
      industry: 'Aerospace',
      phone: null,
      website: null,
      status: 'PROSPECT' as const,
      contactCount: 0,
      createdAt: '2026-10-31T00:00:00Z',
      updatedAt: '2026-10-31T00:00:00Z',
    },
  ];

  const mockContacts = [
    {
      id: 1,
      firstName: 'Bruce',
      lastName: 'Wayne',
      email: 'bruce@wayne.corp',
      phone: null,
      jobTitle: 'CEO',
      status: 'CUSTOMER' as const,
      account: { id: 10, name: 'Wayne Enterprises', domain: 'wayne.corp' },
      createdAt: '2026-10-31T00:00:00Z',
      updatedAt: '2026-10-31T00:00:00Z',
    },
  ];

  const makePaginatedResponse = <T,>(content: T[]) => ({
    content,
    page: 0,
    size: 15,
    totalElements: content.length,
    totalPages: content.length > 0 ? 1 : 0,
    first: true,
    last: true,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(accountsApi.listAccounts).mockResolvedValue(
      makePaginatedResponse(mockAccounts)
    );
    vi.mocked(contactsApi.listContacts).mockResolvedValue(
      makePaginatedResponse(mockContacts)
    );
  });

  it('1. Initial loading state renders skeleton placeholders while fetching', () => {
    vi.mocked(accountsApi.listAccounts).mockImplementation(() => new Promise(() => {}));

    render(<AccountsPage />);

    expect(screen.getByText('Accounts & Organizations')).toBeDefined();
    expect(screen.getByText('Loading accounts...')).toBeDefined();
  });

  it('2. Renders account table with data rows', async () => {
    render(<AccountsPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Wayne Enterprises').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Stark Industries').length).toBeGreaterThan(0);
      expect(screen.getByText('2 organizations registered')).toBeDefined();
    });
  });

  it('3. Renders empty database state when no accounts exist', async () => {
    vi.mocked(accountsApi.listAccounts).mockResolvedValue(
      makePaginatedResponse([])
    );

    render(<AccountsPage />);

    await waitFor(() => {
      expect(screen.getByText('No Accounts Yet')).toBeDefined();
      expect(screen.getByText('Create First Account')).toBeDefined();
    });
  });

  it('4. Shows "No Matching Accounts" empty state when filters produce no results', async () => {
    render(<AccountsPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Search accounts')).toBeDefined();
    });

    // Type search term and then mock returns empty
    vi.mocked(accountsApi.listAccounts).mockResolvedValue(makePaginatedResponse([]));
    fireEvent.change(screen.getByLabelText('Search accounts'), { target: { value: 'zzz' } });

    await waitFor(
      () => {
        expect(screen.getByText('No Matching Accounts')).toBeDefined();
      },
      { timeout: 1500 }
    );
  });

  it('5. Search triggers debounced API call with search param', async () => {
    render(<AccountsPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Search accounts')).toBeDefined();
    });

    fireEvent.change(screen.getByLabelText('Search accounts'), { target: { value: 'stark' } });

    await waitFor(
      () => {
        expect(accountsApi.listAccounts).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'stark' }),
          expect.any(AbortSignal)
        );
      },
      { timeout: 1000 }
    );
  });

  it('6. Status filter triggers API call with status param', async () => {
    render(<AccountsPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Filter by account status')).toBeDefined();
    });

    fireEvent.change(screen.getByLabelText('Filter by account status'), {
      target: { value: 'ACTIVE' },
    });

    await waitFor(() => {
      expect(accountsApi.listAccounts).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'ACTIVE' }),
        expect.any(AbortSignal)
      );
    });
  });

  it('7. Handles backend error state and shows Retry button', async () => {
    vi.mocked(accountsApi.listAccounts).mockRejectedValueOnce(
      new ApiErrorResponse(500, 'INTERNAL_SERVER_ERROR', 'Database connection failed')
    );

    render(<AccountsPage />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Accounts')).toBeDefined();
      expect(screen.getByText('Database connection failed')).toBeDefined();
    });

    // Setup success for retry
    vi.mocked(accountsApi.listAccounts).mockResolvedValue(
      makePaginatedResponse(mockAccounts)
    );

    fireEvent.click(screen.getByText('Retry'));

    await waitFor(() => {
      expect(screen.getAllByText('Wayne Enterprises').length).toBeGreaterThan(0);
    });
  });

  it('8. Opens create account modal and validates name is required', async () => {
    render(<AccountsPage />);

    await waitFor(() => {
      expect(screen.getByText('Add Account')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Add Account'));

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByRole('heading', { name: 'Create Account' })).toBeDefined();

    // Submit blank form
    fireEvent.click(screen.getByText('Create Account', { selector: 'button[type="submit"]' }));

    await waitFor(() => {
      expect(screen.getByText('Account name is required')).toBeDefined();
    });
  });

  it('9. Successfully creates new account and refreshes table', async () => {
    vi.mocked(accountsApi.createAccount).mockResolvedValue({
      id: 99,
      name: 'New Corp',
      domain: 'newcorp.io',
      industry: null,
      phone: null,
      website: null,
      status: 'ACTIVE',
      contactCount: 0,
      createdAt: '2026-10-31T00:00:00Z',
      updatedAt: '2026-10-31T00:00:00Z',
    });

    render(<AccountsPage />);

    await waitFor(() => {
      expect(screen.getByText('Add Account')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Add Account'));

    fireEvent.change(screen.getByLabelText('Organization / Account Name *'), {
      target: { value: 'New Corp' },
    });

    fireEvent.click(screen.getByText('Create Account', { selector: 'button[type="submit"]' }));

    await waitFor(() => {
      expect(accountsApi.createAccount).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New Corp', status: 'ACTIVE' })
      );
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  it('10. Delete confirmation dialog opens with contact count warning', async () => {
    render(<AccountsPage />);

    await waitFor(() => {
      expect(screen.getAllByLabelText('Delete Wayne Enterprises').length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByLabelText('Delete Wayne Enterprises')[0]);

    expect(screen.getByRole('heading', { name: 'Delete Account' })).toBeDefined();
    expect(
      screen.getByText('Are you sure you want to delete this account?')
    ).toBeDefined();
    // contact preservation warning should mention count
    expect(
      screen.getByText(/3 associated contact\(s\) will remain/)
    ).toBeDefined();
  });

  it('11. Confirms delete calls deleteAccount API and closes dialog', async () => {
    vi.mocked(accountsApi.deleteAccount).mockResolvedValue(undefined);

    render(<AccountsPage />);

    await waitFor(() => {
      expect(screen.getAllByLabelText('Delete Wayne Enterprises').length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByLabelText('Delete Wayne Enterprises')[0]);
    expect(screen.getByRole('heading', { name: 'Delete Account' })).toBeDefined();

    fireEvent.click(screen.getByText('Delete Account', { selector: 'button' }));

    await waitFor(() => {
      expect(accountsApi.deleteAccount).toHaveBeenCalledWith(10);
    });
  });

  it('12. Cancels delete dialog without calling deleteAccount API', async () => {
    render(<AccountsPage />);

    await waitFor(() => {
      expect(screen.getAllByLabelText('Delete Wayne Enterprises').length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByLabelText('Delete Wayne Enterprises')[0]);
    expect(screen.getByRole('heading', { name: 'Delete Account' })).toBeDefined();

    fireEvent.click(screen.getByText('Cancel'));

    expect(accountsApi.deleteAccount).not.toHaveBeenCalled();
    expect(
      screen.queryByText('Are you sure you want to delete this account?')
    ).toBeNull();
  });
});

