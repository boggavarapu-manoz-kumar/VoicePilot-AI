import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ContactsPage } from '../pages/ContactsPage';
import { contactsApi } from '../lib/contactsApi';
import { accountsApi } from '../lib/accountsApi';
import { ApiErrorResponse } from '../lib/api';

vi.mock('../lib/contactsApi', () => ({
  contactsApi: {
    listContacts: vi.fn(),
    getContact: vi.fn(),
    createContact: vi.fn(),
    updateContact: vi.fn(),
    deleteContact: vi.fn(),
  },
}));

vi.mock('../lib/accountsApi', () => ({
  accountsApi: {
    listAccounts: vi.fn(),
  },
}));

describe('ContactsPage Enterprise CRM Suite', () => {
  const mockContacts = [
    {
      id: 1,
      firstName: 'Bruce',
      lastName: 'Wayne',
      email: 'bruce@wayne.corp',
      phone: '+1-555-0100',
      jobTitle: 'Chairman & CEO',
      status: 'CUSTOMER' as const,
      account: { id: 10, name: 'Wayne Enterprises', domain: 'wayne.corp' },
      createdAt: '2026-10-31T00:00:00Z',
      updatedAt: '2026-10-31T00:00:00Z',
    },
    {
      id: 2,
      firstName: 'Diana',
      lastName: 'Prince',
      email: 'diana@themyscira.gov',
      phone: null,
      jobTitle: 'Ambassador',
      status: 'PROSPECT' as const,
      account: null,
      createdAt: '2026-10-31T00:00:00Z',
      updatedAt: '2026-10-31T00:00:00Z',
    },
  ];

  const mockAccounts = [
    {
      id: 10,
      name: 'Wayne Enterprises',
      domain: 'wayne.corp',
      status: 'ACTIVE' as const,
      contactCount: 1,
      createdAt: '2026-10-31T00:00:00Z',
      updatedAt: '2026-10-31T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(accountsApi.listAccounts).mockResolvedValue({
      content: mockAccounts,
      page: 0,
      size: 100,
      totalElements: 1,
      totalPages: 1,
      first: true,
      last: true,
    });
  });

  it('1. Initial loading state renders skeleton placeholders', () => {
    vi.mocked(contactsApi.listContacts).mockImplementation(() => new Promise(() => {}));

    render(<ContactsPage />);

    expect(screen.getByText('Contacts & Accounts')).toBeDefined();
    expect(screen.getByText('Loading records...')).toBeDefined();
  });

  it('2. Renders contact table with data and account details', async () => {
    vi.mocked(contactsApi.listContacts).mockResolvedValue({
      content: mockContacts,
      page: 0,
      size: 15,
      totalElements: 2,
      totalPages: 1,
      first: true,
      last: true,
    });

    render(<ContactsPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Bruce Wayne').length).toBeGreaterThan(0);
      expect(screen.getAllByText('bruce@wayne.corp').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Wayne Enterprises').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Diana Prince').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Unassigned').length).toBeGreaterThan(0);
      expect(screen.getByText('2 contacts recorded')).toBeDefined();
    });
  });

  it('3. Renders empty database state when no contacts exist', async () => {
    vi.mocked(contactsApi.listContacts).mockResolvedValue({
      content: [],
      page: 0,
      size: 15,
      totalElements: 0,
      totalPages: 0,
      first: true,
      last: true,
    });

    render(<ContactsPage />);

    await waitFor(() => {
      expect(screen.getByText('No Contacts Yet')).toBeDefined();
      expect(screen.getByText('Add First Contact')).toBeDefined();
    });
  });

  it('4. Filters contacts by status selection', async () => {
    vi.mocked(contactsApi.listContacts).mockResolvedValue({
      content: [mockContacts[0]],
      page: 0,
      size: 15,
      totalElements: 1,
      totalPages: 1,
      first: true,
      last: true,
    });

    render(<ContactsPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Filter by contact status')).toBeDefined();
    });

    fireEvent.change(screen.getByLabelText('Filter by contact status'), {
      target: { value: 'CUSTOMER' },
    });

    await waitFor(() => {
      expect(contactsApi.listContacts).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'CUSTOMER' }),
        expect.any(AbortSignal)
      );
    });
  });

  it('5. Filters contacts by account selection', async () => {
    vi.mocked(contactsApi.listContacts).mockResolvedValue({
      content: [mockContacts[0]],
      page: 0,
      size: 15,
      totalElements: 1,
      totalPages: 1,
      first: true,
      last: true,
    });

    render(<ContactsPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Filter by account')).toBeDefined();
    });

    fireEvent.change(screen.getByLabelText('Filter by account'), {
      target: { value: '10' },
    });

    await waitFor(() => {
      expect(contactsApi.listContacts).toHaveBeenCalledWith(
        expect.objectContaining({ accountId: 10 }),
        expect.any(AbortSignal)
      );
    });
  });

  it('6. Search contacts triggers debounced API call', async () => {
    vi.mocked(contactsApi.listContacts).mockResolvedValue({
      content: [mockContacts[1]],
      page: 0,
      size: 15,
      totalElements: 1,
      totalPages: 1,
      first: true,
      last: true,
    });

    render(<ContactsPage />);

    const searchInput = screen.getByLabelText('Search contacts');
    fireEvent.change(searchInput, { target: { value: 'prince' } });

    await waitFor(
      () => {
        expect(contactsApi.listContacts).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'prince' }),
          expect.any(AbortSignal)
        );
      },
      { timeout: 1000 }
    );
  });

  it('7. Handles backend error state and retry click', async () => {
    vi.mocked(contactsApi.listContacts).mockRejectedValueOnce(
      new ApiErrorResponse(500, 'INTERNAL_SERVER_ERROR', 'Database query timed out')
    );

    render(<ContactsPage />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Contacts')).toBeDefined();
      expect(screen.getByText('Database query timed out')).toBeDefined();
    });

    vi.mocked(contactsApi.listContacts).mockResolvedValue({
      content: mockContacts,
      page: 0,
      size: 15,
      totalElements: 2,
      totalPages: 1,
      first: true,
      last: true,
    });

    fireEvent.click(screen.getByText('Retry Connection'));

    await waitFor(() => {
      expect(screen.getAllByText('Bruce Wayne').length).toBeGreaterThan(0);
    });
  });

  it('8. Opens create contact modal and validates required fields', async () => {
    vi.mocked(contactsApi.listContacts).mockResolvedValue({
      content: mockContacts,
      page: 0,
      size: 15,
      totalElements: 2,
      totalPages: 1,
      first: true,
      last: true,
    });

    render(<ContactsPage />);

    await waitFor(() => {
      expect(screen.getByText('Add Contact')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Add Contact'));

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByRole('heading', { name: 'Create Contact' })).toBeDefined();

    // Submit blank form
    fireEvent.click(screen.getByText('Create Contact', { selector: 'button[type="submit"]' }));

    await waitFor(() => {
      expect(screen.getByText('First name is required')).toBeDefined();
      expect(screen.getByText('Last name is required')).toBeDefined();
      expect(screen.getByText('Email address is required')).toBeDefined();
    });
  });

  it('9. Successfully creates new contact and refreshes table', async () => {
    vi.mocked(contactsApi.listContacts).mockResolvedValue({
      content: mockContacts,
      page: 0,
      size: 15,
      totalElements: 2,
      totalPages: 1,
      first: true,
      last: true,
    });

    vi.mocked(contactsApi.createContact).mockResolvedValue({
      id: 3,
      firstName: 'Clark',
      lastName: 'Kent',
      email: 'clark@dailyplanet.com',
      status: 'LEAD',
      createdAt: '2026-10-31T00:00:00Z',
      updatedAt: '2026-10-31T00:00:00Z',
    });

    render(<ContactsPage />);

    await waitFor(() => {
      expect(screen.getByText('Add Contact')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Add Contact'));

    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'Clark' } });
    fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Kent' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'clark@dailyplanet.com' } });

    fireEvent.click(screen.getByText('Create Contact', { selector: 'button[type="submit"]' }));

    await waitFor(() => {
      expect(contactsApi.createContact).toHaveBeenCalledWith({
        firstName: 'Clark',
        lastName: 'Kent',
        email: 'clark@dailyplanet.com',
        phone: null,
        jobTitle: null,
        status: 'LEAD',
        notes: null,
        accountId: null,
      });
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  it('10. Deletes contact after explicit confirmation dialog', async () => {
    vi.mocked(contactsApi.listContacts).mockResolvedValue({
      content: [mockContacts[0]],
      page: 0,
      size: 15,
      totalElements: 1,
      totalPages: 1,
      first: true,
      last: true,
    });
    vi.mocked(contactsApi.deleteContact).mockResolvedValue();

    render(<ContactsPage />);

    await waitFor(() => {
      expect(screen.getAllByLabelText('Delete Bruce Wayne').length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByLabelText('Delete Bruce Wayne')[0]);

    expect(screen.getByRole('heading', { name: 'Delete Contact' })).toBeDefined();
    expect(screen.getByText('Are you sure you want to permanently delete this contact?')).toBeDefined();

    // Confirm delete
    fireEvent.click(screen.getByText('Delete Record'));

    await waitFor(() => {
      expect(contactsApi.deleteContact).toHaveBeenCalledWith(1);
    });
  });

  it('11. Cancels delete dialog without calling delete API', async () => {
    vi.mocked(contactsApi.listContacts).mockResolvedValue({
      content: [mockContacts[0]],
      page: 0,
      size: 15,
      totalElements: 1,
      totalPages: 1,
      first: true,
      last: true,
    });

    render(<ContactsPage />);

    await waitFor(() => {
      expect(screen.getAllByLabelText('Delete Bruce Wayne').length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByLabelText('Delete Bruce Wayne')[0]);
    expect(screen.getByRole('heading', { name: 'Delete Contact' })).toBeDefined();

    // Cancel delete
    fireEvent.click(screen.getByText('Cancel'));

    expect(contactsApi.deleteContact).not.toHaveBeenCalled();
    expect(screen.queryByText('Are you sure you want to permanently delete this contact?')).toBeNull();
  });
});
