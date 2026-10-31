import { apiRequest } from './api';
import {
  Account,
  AccountQueryParams,
  CreateAccountRequest,
  PaginationResponse,
  UpdateAccountRequest,
} from '../types/crm';

/**
 * Builds query string for Account query parameters.
 */
function buildAccountQueryString(params?: AccountQueryParams): string {
  if (!params) return '';

  const searchParams = new URLSearchParams();

  if (params.search && params.search.trim().length > 0) {
    searchParams.set('search', params.search.trim());
  }
  if (params.status) {
    searchParams.set('status', params.status);
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

  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

export const accountsApi = {
  /**
   * List accounts with pagination and filtering.
   */
  listAccounts(params?: AccountQueryParams, signal?: AbortSignal): Promise<PaginationResponse<Account>> {
    const qs = buildAccountQueryString(params);
    return apiRequest<PaginationResponse<Account>>(`/accounts${qs}`, {
      method: 'GET',
      signal,
    });
  },

  /**
   * Retrieve single account by ID.
   */
  getAccount(id: number, signal?: AbortSignal): Promise<Account> {
    return apiRequest<Account>(`/accounts/${id}`, {
      method: 'GET',
      signal,
    });
  },

  /**
   * Create new account.
   */
  createAccount(payload: CreateAccountRequest, signal?: AbortSignal): Promise<Account> {
    return apiRequest<Account>('/accounts', {
      method: 'POST',
      body: JSON.stringify(payload),
      signal,
    });
  },

  /**
   * Update existing account.
   */
  updateAccount(id: number, payload: UpdateAccountRequest, signal?: AbortSignal): Promise<Account> {
    return apiRequest<Account>(`/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
      signal,
    });
  },
};

