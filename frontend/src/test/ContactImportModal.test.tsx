import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ContactImportModal } from '../components/ContactImportModal';
import { contactImportApi } from '../lib/contactImportApi';
import { ImportPreviewResponse, ImportResultReport } from '../types/crm';

vi.mock('../lib/contactImportApi', () => ({
  contactImportApi: {
    previewImport: vi.fn(),
    executeImport: vi.fn(),
    cancelSession: vi.fn(),
  },
}));

describe('ContactImportModal Component Suite', () => {
  const mockOnClose = vi.fn();
  const mockOnImportComplete = vi.fn();

  const mockPreviewResponse: ImportPreviewResponse = {
    sessionId: 'imp_test_session_123',
    fileName: 'test_contacts.csv',
    totalRows: 3,
    validRowCount: 2,
    invalidRowCount: 1,
    duplicateCount: 1,
    detectedHeaders: ['First Name', 'Last Name', 'Email', 'Account'],
    mappedFields: {
      'First Name': 'firstName',
      'Last Name': 'lastName',
      Email: 'email',
      Account: 'account',
    },
    sampleRows: [
      {
        rowNumber: 2,
        firstName: 'Bruce',
        lastName: 'Wayne',
        email: 'bruce@wayne.corp',
        status: 'CUSTOMER',
        accountIdentifier: 'Wayne Enterprises',
        valid: true,
        duplicate: true,
        matchedContactId: 10,
        errors: [],
      },
      {
        rowNumber: 3,
        firstName: 'Clark',
        lastName: 'Kent',
        email: 'clark@dailyplanet.com',
        status: 'LEAD',
        accountIdentifier: 'Daily Planet',
        valid: true,
        duplicate: false,
        errors: [],
      },
      {
        rowNumber: 4,
        firstName: null,
        lastName: 'Invalid',
        email: 'not-an-email',
        status: 'LEAD',
        valid: false,
        duplicate: false,
        errors: [
          { rowNumber: 4, field: 'firstName', issue: 'First name is required' },
          { rowNumber: 4, field: 'email', issue: 'Email must be a valid email address' },
        ],
      },
    ],
    validationErrors: [
      { rowNumber: 4, field: 'firstName', issue: 'First name is required' },
      { rowNumber: 4, field: 'email', issue: 'Email must be a valid email address' },
    ],
    expiresAt: '2026-11-02T09:00:00Z',
  };

  const mockResultReport: ImportResultReport = {
    sessionId: 'imp_test_session_123',
    totalProcessed: 3,
    importedCount: 1,
    updatedCount: 0,
    skippedCount: 1,
    failedCount: 1,
    durationMs: 42,
    affectedContactIds: [101],
    errorDetails: [
      { rowNumber: 4, field: 'firstName', issue: 'First name is required' },
    ],
    completedAt: '2026-11-02T09:00:01Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Renders upload dropzone when opened', () => {
    render(
      <ContactImportModal
        isOpen={true}
        onClose={mockOnClose}
        onImportComplete={mockOnImportComplete}
      />
    );

    expect(screen.getByText('Import Contacts from CSV')).toBeDefined();
    expect(screen.getByText('Drop your CSV file here, or browse')).toBeDefined();
    expect(screen.getByText('Inspect & Preview')).toBeDefined();
  });

  it('2. Rejects files with non-CSV extensions', () => {
    render(
      <ContactImportModal
        isOpen={true}
        onClose={mockOnClose}
        onImportComplete={mockOnImportComplete}
      />
    );

    const input = screen.getByLabelText('Upload CSV File');
    const invalidFile = new File(['hello'], 'image.png', { type: 'image/png' });

    fireEvent.change(input, { target: { files: [invalidFile] } });

    expect(screen.getByText('Please select a valid CSV (.csv or .txt) file.')).toBeDefined();
  });

  it('3. Successfully inspects file and transitions to PREVIEW state', async () => {
    vi.mocked(contactImportApi.previewImport).mockResolvedValue(mockPreviewResponse);

    render(
      <ContactImportModal
        isOpen={true}
        onClose={mockOnClose}
        onImportComplete={mockOnImportComplete}
      />
    );

    const input = screen.getByLabelText('Upload CSV File');
    const validFile = new File(['First Name,Last Name,Email\nJohn,Doe,john@test.com'], 'contacts.csv', {
      type: 'text/csv',
    });

    fireEvent.change(input, { target: { files: [validFile] } });

    const previewButton = screen.getByText('Inspect & Preview');
    fireEvent.click(previewButton);

    await waitFor(() => {
      expect(contactImportApi.previewImport).toHaveBeenCalledWith(validFile, {});
      expect(screen.getByText('Valid Records')).toBeDefined();
      expect(screen.getByText('Duplicates')).toBeDefined();
      expect(screen.getByText('Invalid Rows')).toBeDefined();
      expect(screen.getByText('Duplicate Contact Strategy (when email exists in CRM):')).toBeDefined();
    });
  });

  it('4. Allows selecting duplicate policies in preview step', async () => {
    vi.mocked(contactImportApi.previewImport).mockResolvedValue(mockPreviewResponse);

    render(
      <ContactImportModal
        isOpen={true}
        onClose={mockOnClose}
        onImportComplete={mockOnImportComplete}
      />
    );

    const input = screen.getByLabelText('Upload CSV File');
    const validFile = new File(['sample'], 'contacts.csv', { type: 'text/csv' });
    fireEvent.change(input, { target: { files: [validFile] } });

    fireEvent.click(screen.getByText('Inspect & Preview'));

    await waitFor(() => {
      expect(screen.getByText('Update Existing')).toBeDefined();
    });

    const updateRadio = screen.getByLabelText(/Update Existing/i);
    fireEvent.click(updateRadio);

    expect((updateRadio as HTMLInputElement).checked).toBe(true);
  });

  it('5. Confirms import and displays final completion summary', async () => {
    vi.mocked(contactImportApi.previewImport).mockResolvedValue(mockPreviewResponse);
    vi.mocked(contactImportApi.executeImport).mockResolvedValue(mockResultReport);

    render(
      <ContactImportModal
        isOpen={true}
        onClose={mockOnClose}
        onImportComplete={mockOnImportComplete}
      />
    );

    const input = screen.getByLabelText('Upload CSV File');
    const validFile = new File(['sample'], 'contacts.csv', { type: 'text/csv' });
    fireEvent.change(input, { target: { files: [validFile] } });
    fireEvent.click(screen.getByText('Inspect & Preview'));

    await waitFor(() => {
      expect(screen.getByText('Confirm & Import Records')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Confirm & Import Records'));

    await waitFor(() => {
      expect(contactImportApi.executeImport).toHaveBeenCalledWith({
        sessionId: 'imp_test_session_123',
        duplicatePolicy: 'SKIP',
        skipInvalidRows: true,
      });
      expect(screen.getByText('Import Completed Successfully')).toBeDefined();
      expect(screen.getByText('Processed in 42ms')).toBeDefined();
      expect(mockOnImportComplete).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByText('Done'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('6. Cancelling in preview step calls cancelSession to free server resources', async () => {
    vi.mocked(contactImportApi.previewImport).mockResolvedValue(mockPreviewResponse);
    vi.mocked(contactImportApi.cancelSession).mockResolvedValue();

    render(
      <ContactImportModal
        isOpen={true}
        onClose={mockOnClose}
        onImportComplete={mockOnImportComplete}
      />
    );

    const input = screen.getByLabelText('Upload CSV File');
    const validFile = new File(['sample'], 'contacts.csv', { type: 'text/csv' });
    fireEvent.change(input, { target: { files: [validFile] } });
    fireEvent.click(screen.getByText('Inspect & Preview'));

    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Cancel'));

    expect(contactImportApi.cancelSession).toHaveBeenCalledWith('imp_test_session_123');
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
