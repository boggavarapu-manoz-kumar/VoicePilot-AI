import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SegmentsPage } from '../pages/SegmentsPage';
import { segmentsApi } from '../lib/segmentsApi';
import { accountsApi } from '../lib/accountsApi';

vi.mock('../lib/segmentsApi', () => ({
  segmentsApi: {
    listSegments: vi.fn(),
    getSegmentById: vi.fn(),
    createSegment: vi.fn(),
    updateSegment: vi.fn(),
    deleteSegment: vi.fn(),
    getSegmentContacts: vi.fn(),
    exportSegmentCsv: vi.fn(),
  },
}));

vi.mock('../lib/accountsApi', () => ({
  accountsApi: {
    listAccounts: vi.fn(),
  },
}));

describe('SegmentsPage Test Suite', () => {
  const mockAccounts = [
    {
      id: 1,
      name: 'Cyberdyne Systems',
      domain: 'cyberdyne.com',
      industry: 'Robotics',
      phone: null,
      website: null,
      status: 'ACTIVE' as const,
      contactCount: 1,
      createdAt: '2026-10-31T00:00:00Z',
      updatedAt: '2026-10-31T00:00:00Z',
    },
  ];

  const mockSegments = [
    {
      id: 101,
      name: 'High-Value Leads',
      description: 'Prospective clients in evaluation',
      filterCriteria: {
        search: null,
        status: 'LEAD' as const,
        accountId: null,
        withoutAccount: null,
      },
      matchingContactCount: 2,
      createdAt: '2026-11-01T10:00:00Z',
      updatedAt: '2026-11-01T10:00:00Z',
    },
    {
      id: 102,
      name: 'Cyberdyne Contacts',
      description: 'All contacts linked to Cyberdyne',
      filterCriteria: {
        search: null,
        status: null,
        accountId: 1,
        withoutAccount: false,
      },
      matchingContactCount: 1,
      createdAt: '2026-11-01T11:00:00Z',
      updatedAt: '2026-11-01T11:00:00Z',
    },
  ];

  const mockContacts = [
    {
      id: 201,
      firstName: 'Sarah',
      lastName: 'Connor',
      email: 'sarah@resistance.org',
      phone: '+1-555-0900',
      jobTitle: 'Commander',
      status: 'LEAD' as const,
      notes: null,
      account: null,
      createdAt: '2026-11-01T10:00:00Z',
      updatedAt: '2026-11-01T10:00:00Z',
    },
    {
      id: 202,
      firstName: 'John',
      lastName: 'Connor',
      email: 'john@resistance.org',
      phone: null,
      jobTitle: 'Officer',
      status: 'LEAD' as const,
      notes: null,
      account: null,
      createdAt: '2026-11-01T10:05:00Z',
      updatedAt: '2026-11-01T10:05:00Z',
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
    vi.mocked(segmentsApi.listSegments).mockResolvedValue({
      content: mockSegments,
      page: 0,
      size: 20,
      totalElements: 2,
      totalPages: 1,
      first: true,
      last: true,
    });
    vi.mocked(segmentsApi.getSegmentContacts).mockResolvedValue({
      content: mockContacts,
      page: 0,
      size: 10,
      totalElements: 2,
      totalPages: 1,
      first: true,
      last: true,
    });
  });

  it('renders page header and saved segments list', async () => {
    render(<SegmentsPage />);

    expect(screen.getByText('Contact Segments & Saved Views')).toBeDefined();

    await waitFor(() => {
      expect(screen.getAllByText('High-Value Leads').length).toBeGreaterThan(0);
      expect(screen.getByText('Cyberdyne Contacts')).toBeDefined();
    });

    // Check that contacts of the initially selected segment (first segment) are loaded
    await waitFor(() => {
      expect(screen.getByText('Sarah Connor')).toBeDefined();
      expect(screen.getByText('John Connor')).toBeDefined();
    });
  });

  it('displays empty state when no saved segments exist', async () => {
    vi.mocked(segmentsApi.listSegments).mockResolvedValueOnce({
      content: [],
      page: 0,
      size: 20,
      totalElements: 0,
      totalPages: 0,
      first: true,
      last: true,
    });

    render(<SegmentsPage />);

    await waitFor(() => {
      expect(screen.getByText('No saved segments')).toBeDefined();
    });
  });

  it('opens Create Segment modal and submits new segment', async () => {
    vi.mocked(segmentsApi.createSegment).mockResolvedValueOnce({
      id: 103,
      name: 'Unassigned Contacts',
      description: 'Contacts without account',
      filterCriteria: { search: null, status: null, accountId: null, withoutAccount: true },
      matchingContactCount: 5,
      createdAt: '2026-11-02T10:00:00Z',
      updatedAt: '2026-11-02T10:00:00Z',
    });

    render(<SegmentsPage />);

    const newBtn = screen.getByRole('button', { name: /new segment/i });
    fireEvent.click(newBtn);

    expect(screen.getByText('Create Saved Segment')).toBeDefined();

    const nameInput = screen.getByPlaceholderText(/e\.g\. VIP Customers/i);
    fireEvent.change(nameInput, { target: { value: 'Unassigned Contacts' } });

    const withoutAccountCheckbox = screen.getByLabelText(/unassigned contacts only/i);
    fireEvent.click(withoutAccountCheckbox);

    const submitBtn = screen.getByRole('button', { name: /save segment/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(segmentsApi.createSegment).toHaveBeenCalledWith({
        name: 'Unassigned Contacts',
        description: null,
        filterCriteria: {
          search: null,
          status: null,
          accountId: null,
          withoutAccount: true,
        },
      });
    });
  });

  it('opens Delete modal and confirms segment deletion', async () => {
    vi.mocked(segmentsApi.deleteSegment).mockResolvedValueOnce();

    render(<SegmentsPage />);

    await waitFor(() => {
      expect(screen.getAllByText('High-Value Leads').length).toBeGreaterThan(0);
    });

    const deleteButtons = screen.getAllByTitle('Delete segment');
    fireEvent.click(deleteButtons[0]);

    expect(screen.getByText('Delete Segment')).toBeDefined();
    expect(screen.getByText(/Are you sure you want to delete the saved segment/i)).toBeDefined();

    const confirmBtn = screen.getByRole('button', { name: /confirm delete/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(segmentsApi.deleteSegment).toHaveBeenCalledWith(101);
    });
  });

  it('triggers CSV export for selected segment', async () => {
    const mockBlob = new Blob(['First Name,Last Name\nSarah,Connor'], { type: 'text/csv' });
    vi.mocked(segmentsApi.exportSegmentCsv).mockResolvedValueOnce(mockBlob);

    // Mock createObjectURL & revokeObjectURL
    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/dummy');
    window.URL.revokeObjectURL = vi.fn();

    render(<SegmentsPage />);

    await waitFor(() => {
      expect(screen.getAllByText('High-Value Leads').length).toBeGreaterThan(0);
    });

    const exportBtn = screen.getByRole('button', { name: /export csv/i });
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(segmentsApi.exportSegmentCsv).toHaveBeenCalledWith(101);
      expect(window.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
    });
  });
});
