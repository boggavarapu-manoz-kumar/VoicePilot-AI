/**
 * Frontend CRM domain types mapped directly to backend contracts.
 */

export type ContactStatus = 'LEAD' | 'PROSPECT' | 'CUSTOMER' | 'CHURNED';

export type AccountStatus = 'ACTIVE' | 'INACTIVE' | 'PROSPECT';

export interface AccountSummary {
  id: number;
  name: string;
  domain?: string | null;
}

export interface Account {
  id: number;
  name: string;
  domain?: string | null;
  industry?: string | null;
  phone?: string | null;
  website?: string | null;
  status: AccountStatus;
  contactCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  jobTitle?: string | null;
  status: ContactStatus;
  notes?: string | null;
  account?: AccountSummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface CreateContactRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  jobTitle?: string | null;
  status?: ContactStatus;
  notes?: string | null;
  accountId?: number | null;
}

export interface UpdateContactRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  jobTitle?: string | null;
  status: ContactStatus;
  notes?: string | null;
  accountId?: number | null;
}

export interface CreateAccountRequest {
  name: string;
  domain?: string | null;
  industry?: string | null;
  phone?: string | null;
  website?: string | null;
  status?: AccountStatus;
}

export interface UpdateAccountRequest {
  name: string;
  domain?: string | null;
  industry?: string | null;
  phone?: string | null;
  website?: string | null;
  status: AccountStatus;
}

export interface ContactQueryParams {
  search?: string;
  status?: ContactStatus;
  accountId?: number;
  withoutAccount?: boolean;
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'asc' | 'desc';
}

export interface AccountQueryParams {
  search?: string;
  status?: AccountStatus;
  page?: number;
  size?: number;
  sort?: string;
}

