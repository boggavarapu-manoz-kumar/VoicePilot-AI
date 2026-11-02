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


export type DuplicatePolicy = 'SKIP' | 'REJECT_ALL' | 'UPDATE' | 'ALLOW_DUPLICATES';

export interface ImportErrorDetail {
  rowNumber: number;
  field: string;
  rawValue?: string | null;
  issue: string;
}

export interface ParsedContactRow {
  rowNumber: number;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  jobTitle?: string | null;
  status: string;
  notes?: string | null;
  accountIdentifier?: string | null;
  valid: boolean;
  duplicate: boolean;
  matchedContactId?: number | null;
  matchedAccountId?: number | null;
  errors: ImportErrorDetail[];
}

export interface ImportPreviewResponse {
  sessionId: string;
  fileName: string;
  totalRows: number;
  validRowCount: number;
  invalidRowCount: number;
  duplicateCount: number;
  detectedHeaders: string[];
  mappedFields: Record<string, string>;
  sampleRows: ParsedContactRow[];
  validationErrors: ImportErrorDetail[];
  expiresAt: string;
}

export interface ImportExecutionRequest {
  sessionId: string;
  duplicatePolicy: DuplicatePolicy;
  skipInvalidRows: boolean;
}

export interface ImportResultReport {
  sessionId: string;
  totalProcessed: number;
  importedCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  durationMs: number;
  affectedContactIds: number[];
  errorDetails: ImportErrorDetail[];
  completedAt: string;
}

// -----------------------------------------------------------------------------
// Contact Segments & Saved Views
// -----------------------------------------------------------------------------

export interface SegmentFilterCriteria {
  search?: string | null;
  status?: ContactStatus | null;
  accountId?: number | null;
  withoutAccount?: boolean | null;
}

export interface Segment {
  id: number;
  name: string;
  description?: string | null;
  filterCriteria: SegmentFilterCriteria;
  matchingContactCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSegmentRequest {
  name: string;
  description?: string | null;
  filterCriteria: SegmentFilterCriteria;
}

export interface UpdateSegmentRequest {
  name: string;
  description?: string | null;
  filterCriteria: SegmentFilterCriteria;
}

