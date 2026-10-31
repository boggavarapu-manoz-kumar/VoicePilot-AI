import { apiRequest } from './api';
import {
  Contact,
  ContactQueryParams,
  CreateContactRequest,
  PaginationResponse,
  UpdateContactRequest,
} from '../types/crm';

/**
 * Builds query string for Contact query parameters.
 */
function buildContactQueryString(params?: ContactQueryParams): string {
  if (!params) return '';

  const searchParams = new URLSearchParams();

  if (params.search && params.search.trim().length > 0) {
    searchParams.set('search', params.search.trim());
  }
  if (params.status) {
    searchParams.set('status', params.status);
  }
  if (typeof params.accountId === 'number') {
    searchParams.set('accountId', params.accountId.toString());
  }
  if (typeof params.withoutAccount === 'boolean') {
    searchParams.set('withoutAccount', params.withoutAccount.toString());
  }
  if (typeof params.page === 'number') {
    searchParams.set('page', params.page.toString());
  }
  if (typeof params.size === 'number') {
    searchParams.set('size', params.size.toString());
  }
  if (params.sort) {
    searchParams.set('sort', params.sort);
  }
  if (params.direction) {
    searchParams.set('direction', params.direction);
  }

  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

export const contactsApi = {
  /**
   * List contacts with pagination, search, and filters.
   */
  listContacts(params?: ContactQueryParams, signal?: AbortSignal): Promise<PaginationResponse<Contact>> {
    const qs = buildContactQueryString(params);
    return apiRequest<PaginationResponse<Contact>>(`/contacts${qs}`, {
      method: 'GET',
      signal,
    });
  },

  /**
   * Retrieve single contact by ID.
   */
  getContact(id: number, signal?: AbortSignal): Promise<Contact> {
    return apiRequest<Contact>(`/contacts/${id}`, {
      method: 'GET',
      signal,
    });
  },

  /**
   * Create new contact.
   */
  createContact(payload: CreateContactRequest, signal?: AbortSignal): Promise<Contact> {
    return apiRequest<Contact>('/contacts', {
      method: 'POST',
      body: JSON.stringify(payload),
      signal,
    });
  },

  /**
   * Update existing contact.
   */
  updateContact(id: number, payload: UpdateContactRequest, signal?: AbortSignal): Promise<Contact> {
    return apiRequest<Contact>(`/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
      signal,
    });
  },

  /**
   * Delete contact by ID.
   */
  deleteContact(id: number, signal?: AbortSignal): Promise<void> {
    return apiRequest<void>(`/contacts/${id}`, {
      method: 'DELETE',
      signal,
    });
  },
};

