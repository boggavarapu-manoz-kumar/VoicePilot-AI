import { apiRequest } from './api';
import {
  Contact,
  CreateSegmentRequest,
  PaginationResponse,
  Segment,
  UpdateSegmentRequest,
} from '../types/crm';

export const segmentsApi = {
  /**
   * List saved segments with pagination.
   */
  listSegments(page = 0, size = 20, signal?: AbortSignal): Promise<PaginationResponse<Segment>> {
    return apiRequest<PaginationResponse<Segment>>(`/segments?page=${page}&size=${size}`, {
      method: 'GET',
      signal,
    });
  },

  /**
   * Get segment by synthetic ID.
   */
  getSegmentById(id: number, signal?: AbortSignal): Promise<Segment> {
    return apiRequest<Segment>(`/segments/${id}`, {
      method: 'GET',
      signal,
    });
  },

  /**
   * Create a new saved segment.
   */
  createSegment(request: CreateSegmentRequest, signal?: AbortSignal): Promise<Segment> {
    return apiRequest<Segment>('/segments', {
      method: 'POST',
      body: JSON.stringify(request),
      signal,
    });
  },

  /**
   * Update an existing segment.
   */
  updateSegment(id: number, request: UpdateSegmentRequest, signal?: AbortSignal): Promise<Segment> {
    return apiRequest<Segment>(`/segments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(request),
      signal,
    });
  },

  /**
   * Delete a saved segment.
   */
  deleteSegment(id: number, signal?: AbortSignal): Promise<void> {
    return apiRequest<void>(`/segments/${id}`, {
      method: 'DELETE',
      signal,
    });
  },

  /**
   * Retrieve paginated contacts matching the segment's filter criteria.
   */
  getSegmentContacts(
    id: number,
    page = 0,
    size = 20,
    signal?: AbortSignal
  ): Promise<PaginationResponse<Contact>> {
    return apiRequest<PaginationResponse<Contact>>(`/segments/${id}/contacts?page=${page}&size=${size}`, {
      method: 'GET',
      signal,
    });
  },

  /**
   * Export segment matching contacts to CSV.
   */
  async exportSegmentCsv(id: number, signal?: AbortSignal): Promise<Blob> {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
    const response = await fetch(`${API_BASE_URL}/segments/${id}/export`, {
      method: 'GET',
      headers: {
        Accept: 'text/csv',
      },
      signal,
    });

    if (!response.ok) {
      throw new Error(`Export failed with HTTP status ${response.status}`);
    }

    return response.blob();
  },
};

