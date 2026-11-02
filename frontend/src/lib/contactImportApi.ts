import { apiRequest } from './api';
import {
  ImportExecutionRequest,
  ImportPreviewResponse,
  ImportResultReport,
} from '../types/crm';

export const contactImportApi = {
  /**
   * Upload CSV file for dry-run parsing, column mapping, and duplicate detection.
   */
  async previewImport(
    file: File,
    overrides?: Record<string, string>,
    signal?: AbortSignal
  ): Promise<ImportPreviewResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (overrides && Object.keys(overrides).length > 0) {
      Object.entries(overrides).forEach(([header, field]) => {
        formData.append(`overrides[${header}]`, field);
      });
    }

    return apiRequest<ImportPreviewResponse>('/contacts/import/preview', {
      method: 'POST',
      body: formData,
      signal,
    });
  },

  /**
   * Execute confirmed import session within transactional boundary.
   */
  async executeImport(
    payload: ImportExecutionRequest,
    signal?: AbortSignal
  ): Promise<ImportResultReport> {
    return apiRequest<ImportResultReport>('/contacts/import/execute', {
      method: 'POST',
      body: JSON.stringify(payload),
      signal,
    });
  },

  /**
   * Cancel in-memory import session without side effects.
   */
  async cancelSession(sessionId: string, signal?: AbortSignal): Promise<void> {
    return apiRequest<void>(`/contacts/import/${sessionId}`, {
      method: 'DELETE',
      signal,
    });
  },
};

