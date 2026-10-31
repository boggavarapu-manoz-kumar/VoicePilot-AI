import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge, BadgeVariant } from '../components/Badge';
import { contactsApi } from '../lib/contactsApi';
import { accountsApi } from '../lib/accountsApi';
import { ApiErrorResponse } from '../lib/api';
import {
  Contact,
  Account,
  ContactStatus,
  PaginationResponse,
  CreateContactRequest,
  UpdateContactRequest,
} from '../types/crm';
import {
  Users,
  Plus,
  Search,
  RefreshCw,
  Building2,
  Phone,
  Mail,
  Edit2,
  Trash2,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';

const STATUS_VARIANTS: Record<ContactStatus, BadgeVariant> = {
  LEAD: 'primary',
  PROSPECT: 'warning',
  CUSTOMER: 'success',
  CHURNED: 'neutral',
};

const STATUS_LABELS: Record<ContactStatus, string> = {
  LEAD: 'Lead',
  PROSPECT: 'Prospect',
  CUSTOMER: 'Customer',
  CHURNED: 'Churned',
};

export const ContactsPage: React.FC = () => {
  // Data state
  const [contactsData, setContactsData] = useState<PaginationResponse<Contact> | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccountsLoading, setIsAccountsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter & pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ContactStatus | ''>('');
  const [selectedAccountId, setSelectedAccountId] = useState<number | 'none' | ''>('');
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 15;

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

  // Form mutation state
  const [formData, setFormData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    jobTitle: string;
    status: ContactStatus;
    accountId: string;
    notes: string;
  }>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    status: 'LEAD',
    accountId: '',
    notes: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formGlobalError, setFormGlobalError] = useState<string | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Request cancellation reference
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounce search term input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load Accounts list once for selector and filter
  const loadAccounts = useCallback(async () => {
    setIsAccountsLoading(true);
    try {
      const res = await accountsApi.listAccounts({ size: 100, sort: 'name' });
      setAccounts(res.content);
    } catch {
      // Accounts failure does not break the contacts view
    } finally {
      setIsAccountsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // Fetch contacts with filters
  const fetchContacts = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const withoutAccount = selectedAccountId === 'none' ? true : undefined;
      const accountId = typeof selectedAccountId === 'number' ? selectedAccountId : undefined;

      const res = await contactsApi.listContacts(
        {
          search: debouncedSearch.trim() || undefined,
          status: selectedStatus || undefined,
          accountId,
          withoutAccount,
          page: currentPage,
          size: pageSize,
          sort: 'lastName',
          direction: 'asc',
        },
        controller.signal
      );

      setContactsData(res);
      setError(null);
    } catch (err: unknown) {
      if (err instanceof ApiErrorResponse) {
        if (err.code === 'NETWORK_ERROR' && err.message.includes('aborted')) {
          return; // Ignore aborted requests
        }
        setError(err.message || 'Failed to load contacts');
      } else {
        setError('An unexpected error occurred while communicating with the backend');
      }
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, selectedStatus, selectedAccountId, currentPage, pageSize]);

  useEffect(() => {
    fetchContacts();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchContacts]);

  // Toast banner auto-dismiss
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Reset all filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('');
    setSelectedAccountId('');
    setCurrentPage(0);
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingContact(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      jobTitle: '',
      status: 'LEAD',
      accountId: '',
      notes: '',
    });
    setFormErrors({});
    setFormGlobalError(null);
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone || '',
      jobTitle: contact.jobTitle || '',
      status: contact.status,
      accountId: contact.account?.id ? contact.account.id.toString() : '',
      notes: contact.notes || '',
    });
    setFormErrors({});
    setFormGlobalError(null);
    setIsFormModalOpen(true);
  };

  // Form client validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    } else if (formData.firstName.length > 80) {
      errors.firstName = 'First name cannot exceed 80 characters';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    } else if (formData.lastName.length > 80) {
      errors.lastName = 'Last name cannot exceed 80 characters';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please provide a valid email address';
    } else if (formData.email.length > 160) {
      errors.email = 'Email cannot exceed 160 characters';
    }

    if (formData.phone && formData.phone.length > 32) {
      errors.phone = 'Phone number cannot exceed 32 characters';
    }
    if (formData.jobTitle && formData.jobTitle.length > 100) {
      errors.jobTitle = 'Job title cannot exceed 100 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save Contact (Create or Edit)
  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setFormSubmitting(true);
    setFormGlobalError(null);

    const accountIdNum = formData.accountId ? parseInt(formData.accountId, 10) : null;

    try {
      if (editingContact) {
        const updatePayload: UpdateContactRequest = {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || null,
          jobTitle: formData.jobTitle.trim() || null,
          status: formData.status,
          notes: formData.notes.trim() || null,
          accountId: accountIdNum,
        };
        await contactsApi.updateContact(editingContact.id, updatePayload);
        setToastMessage(`Contact ${updatePayload.firstName} ${updatePayload.lastName} updated successfully.`);
      } else {
        const createPayload: CreateContactRequest = {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || null,
          jobTitle: formData.jobTitle.trim() || null,
          status: formData.status,
          notes: formData.notes.trim() || null,
          accountId: accountIdNum,
        };
        await contactsApi.createContact(createPayload);
        setToastMessage(`Contact ${createPayload.firstName} ${createPayload.lastName} created successfully.`);
      }

      setIsFormModalOpen(false);
      fetchContacts();
    } catch (err: unknown) {
      if (err instanceof ApiErrorResponse) {
        if (err.details && err.details.length > 0) {
          const fieldMap: Record<string, string> = {};
          err.details.forEach((d) => {
            fieldMap[d.field] = d.issue;
          });
          setFormErrors(fieldMap);
          setFormGlobalError('Please fix the indicated validation issues.');
        } else {
          setFormGlobalError(err.message || 'Server rejected the request.');
        }
      } else {
        setFormGlobalError('Network error occurred while saving contact.');
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (contact: Contact) => {
    setContactToDelete(contact);
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!contactToDelete) return;

    setDeleteSubmitting(true);
    setDeleteError(null);

    try {
      await contactsApi.deleteContact(contactToDelete.id);
      setIsDeleteModalOpen(false);
      setToastMessage(`Contact ${contactToDelete.firstName} ${contactToDelete.lastName} has been deleted.`);
      setContactToDelete(null);
      fetchContacts();
    } catch (err: unknown) {
      if (err instanceof ApiErrorResponse) {
        setDeleteError(err.message || 'Failed to delete contact.');
      } else {
        setDeleteError('Network error occurred while attempting to delete contact.');
      }
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const hasActiveFilters =
    Boolean(searchTerm.trim()) || selectedStatus !== '' || selectedAccountId !== '';

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 bg-emerald-950 border border-emerald-500/30 text-emerald-100 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 backdrop-blur-md text-sm animate-fade-in"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-emerald-400 hover:text-emerald-200 ml-2"
            aria-label="Dismiss message"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="Contacts & Accounts"
        description="Enterprise customer directory, account associations, and lead management."
        action={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchContacts();
                loadAccounts();
              }}
              disabled={isLoading}
              aria-label="Refresh contacts"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreateModal}
              className="shadow-sm shadow-blue-500/20"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Contact
            </Button>
          </div>
        }
      />

      {/* Search and Filters Bar */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search name, email, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                aria-label="Search contacts"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value as ContactStatus | '');
                  setCurrentPage(0);
                }}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                aria-label="Filter by contact status"
              >
                <option value="">All Statuses</option>
                <option value="LEAD">Lead</option>
                <option value="PROSPECT">Prospect</option>
                <option value="CUSTOMER">Customer</option>
                <option value="CHURNED">Churned</option>
              </select>
            </div>

            {/* Account Filter */}
            <div className="relative">
              <select
                value={selectedAccountId}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setSelectedAccountId('');
                  } else if (val === 'none') {
                    setSelectedAccountId('none');
                  } else {
                    setSelectedAccountId(parseInt(val, 10));
                  }
                  setCurrentPage(0);
                }}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                aria-label="Filter by account"
                disabled={isAccountsLoading}
              >
                <option value="">All Accounts</option>
                <option value="none">Unassigned (No Account)</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-1.5 rounded hover:bg-slate-800 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            </div>
          )}
        </div>

        {/* Total Elements Summary */}
        <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span>
              {contactsData
                ? `${contactsData.totalElements} contact${contactsData.totalElements === 1 ? '' : 's'} recorded`
                : 'Loading records...'}
            </span>
          </div>
          {accounts.length > 0 && (
            <div className="flex items-center gap-1 text-slate-400">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>{accounts.length} linked accounts</span>
            </div>
          )}
        </div>
      </Card>

      {/* Main Content Card: Table or Error or Empty */}
      <Card className="overflow-hidden p-0">
        {/* Error State */}
        {error && (
          <div className="p-8 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white">Error Loading Contacts</h3>
            <p className="text-sm text-slate-400 max-w-md mt-1 mb-4">{error}</p>
            <Button variant="primary" size="sm" onClick={fetchContacts}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Retry Connection
            </Button>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && !error && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-5 w-32 bg-slate-800 rounded animate-pulse" />
              <div className="h-5 w-24 bg-slate-800 rounded animate-pulse" />
            </div>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 w-full bg-slate-800/50 rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty States */}
        {!isLoading && !error && (!contactsData || contactsData.content.length === 0) && (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white">
              {hasActiveFilters ? 'No Matching Contacts Found' : 'No Contacts Yet'}
            </h3>
            <p className="text-sm text-slate-400 max-w-sm mt-1 mb-4">
              {hasActiveFilters
                ? 'Try adjusting your search criteria or resetting active filters.'
                : 'Get started by creating your first CRM contact with account linking.'}
            </p>
            {hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                Clear All Filters
              </Button>
            ) : (
              <Button variant="primary" size="sm" onClick={handleOpenCreateModal}>
                <Plus className="w-4 h-4 mr-1.5" />
                Add First Contact
              </Button>
            )}
          </div>
        )}

        {/* Contact Data Table */}
        {!isLoading && !error && contactsData && contactsData.content.length > 0 && (
          <div>
            {/* Desktop / Tablet Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse" aria-label="Contacts list">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-slate-900/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th scope="col" className="px-6 py-3.5">
                      Contact Name
                    </th>
                    <th scope="col" className="px-6 py-3.5">
                      Title & Account
                    </th>
                    <th scope="col" className="px-6 py-3.5">
                      Communication
                    </th>
                    <th scope="col" className="px-6 py-3.5">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {contactsData.content.map((contact) => (
                    <tr
                      key={contact.id}
                      className="hover:bg-slate-800/30 transition-colors group"
                    >
                      {/* Name & ID */}
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white text-sm">
                          {contact.firstName} {contact.lastName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          ID: #{contact.id}
                        </div>
                      </td>

                      {/* Job Title & Account */}
                      <td className="px-6 py-4">
                        <div className="text-slate-200 font-medium">
                          {contact.jobTitle || 'No Title'}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mt-0.5">
                          <Building2 className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span>{contact.account ? contact.account.name : 'Unassigned'}</span>
                        </div>
                      </td>

                      {/* Email & Phone */}
                      <td className="px-6 py-4 space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span className="truncate max-w-[200px]">{contact.email}</span>
                        </div>
                        {contact.phone && (
                          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <span>{contact.phone}</span>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <Badge variant={STATUS_VARIANTS[contact.status]} size="sm" dot>
                          {STATUS_LABELS[contact.status]}
                        </Badge>
                      </td>

                      {/* Action Buttons */}
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(contact)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                            aria-label={`Edit ${contact.firstName} ${contact.lastName}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDeleteModal(contact)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-colors"
                            aria-label={`Delete ${contact.firstName} ${contact.lastName}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Responsive Cards */}
            <div className="block sm:hidden divide-y divide-slate-800/60">
              {contactsData.content.map((contact) => (
                <div key={contact.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm">
                        {contact.firstName} {contact.lastName}
                      </h4>
                      <p className="text-xs text-slate-400">{contact.jobTitle || 'No Title'}</p>
                    </div>
                    <Badge variant={STATUS_VARIANTS[contact.status]} size="sm" dot>
                      {STATUS_LABELS[contact.status]}
                    </Badge>
                  </div>

                  <div className="text-xs space-y-1 text-slate-300">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{contact.email}</span>
                    </div>
                    {contact.phone && (
                      <div className="flex items-center gap-2 text-slate-400">
                        <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{contact.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-slate-400">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{contact.account ? contact.account.name : 'Unassigned'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/40">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEditModal(contact)}
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleOpenDeleteModal(contact)}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-900/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
              <div>
                Showing page <span className="font-semibold text-white">{contactsData.page + 1}</span> of{' '}
                <span className="font-semibold text-white">{contactsData.totalPages || 1}</span> ({contactsData.totalElements} records total)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 0))}
                  disabled={contactsData.first || isLoading}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={contactsData.last || isLoading}
                  aria-label="Next page"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Create / Edit Contact Modal Dialog */}
      {isFormModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="contact-form-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
        >
          <div className="relative bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-white space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 id="contact-form-title" className="text-base font-bold text-white">
                {editingContact ? 'Edit Contact' : 'Create Contact'}
              </h3>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formGlobalError && (
              <div
                role="alert"
                className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-lg flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formGlobalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveContact} className="space-y-3.5 text-xs">
              {/* Names row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="form-firstName" className="block font-semibold text-slate-300 mb-1">
                    First Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="form-firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className={`w-full px-3 py-2 bg-slate-950 border ${
                      formErrors.firstName ? 'border-rose-500' : 'border-slate-700'
                    } rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="e.g. John"
                    disabled={formSubmitting}
                  />
                  {formErrors.firstName && (
                    <p className="text-rose-400 text-[11px] mt-1">{formErrors.firstName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="form-lastName" className="block font-semibold text-slate-300 mb-1">
                    Last Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="form-lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className={`w-full px-3 py-2 bg-slate-950 border ${
                      formErrors.lastName ? 'border-rose-500' : 'border-slate-700'
                    } rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="e.g. Doe"
                    disabled={formSubmitting}
                  />
                  {formErrors.lastName && (
                    <p className="text-rose-400 text-[11px] mt-1">{formErrors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="form-email" className="block font-semibold text-slate-300 mb-1">
                  Email Address <span className="text-rose-400">*</span>
                </label>
                <input
                  id="form-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-3 py-2 bg-slate-950 border ${
                    formErrors.email ? 'border-rose-500' : 'border-slate-700'
                  } rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="john.doe@example.com"
                  disabled={formSubmitting}
                />
                {formErrors.email && (
                  <p className="text-rose-400 text-[11px] mt-1">{formErrors.email}</p>
                )}
              </div>

              {/* Phone & Job Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="form-phone" className="block font-semibold text-slate-300 mb-1">
                    Phone (Optional)
                  </label>
                  <input
                    id="form-phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+1-555-0100"
                    disabled={formSubmitting}
                  />
                  {formErrors.phone && (
                    <p className="text-rose-400 text-[11px] mt-1">{formErrors.phone}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="form-jobTitle" className="block font-semibold text-slate-300 mb-1">
                    Job Title (Optional)
                  </label>
                  <input
                    id="form-jobTitle"
                    type="text"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Director of Operations"
                    disabled={formSubmitting}
                  />
                  {formErrors.jobTitle && (
                    <p className="text-rose-400 text-[11px] mt-1">{formErrors.jobTitle}</p>
                  )}
                </div>
              </div>

              {/* Status & Account */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="form-status" className="block font-semibold text-slate-300 mb-1">
                    Lifecycle Status
                  </label>
                  <select
                    id="form-status"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as ContactStatus })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={formSubmitting}
                  >
                    <option value="LEAD">Lead</option>
                    <option value="PROSPECT">Prospect</option>
                    <option value="CUSTOMER">Customer</option>
                    <option value="CHURNED">Churned</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="form-account" className="block font-semibold text-slate-300 mb-1">
                    Associated Account
                  </label>
                  <select
                    id="form-account"
                    value={formData.accountId}
                    onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={formSubmitting || isAccountsLoading}
                  >
                    <option value="">Unassigned (None)</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="form-notes" className="block font-semibold text-slate-300 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  id="form-notes"
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Key background context, account references..."
                  disabled={formSubmitting}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFormModalOpen(false)}
                  disabled={formSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={formSubmitting}
                  disabled={formSubmitting}
                >
                  {editingContact ? 'Save Changes' : 'Create Contact'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal Dialog */}
      {isDeleteModalOpen && contactToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 flex-shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 id="delete-dialog-title" className="text-base font-bold text-white">
                  Delete Contact
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Are you sure you want to permanently delete this contact?
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg text-xs space-y-1">
              <div className="font-semibold text-white">
                {contactToDelete.firstName} {contactToDelete.lastName}
              </div>
              <div className="text-slate-400">{contactToDelete.email}</div>
              {contactToDelete.account && (
                <div className="text-slate-400">Account: {contactToDelete.account.name}</div>
              )}
            </div>

            {deleteError && (
              <div
                role="alert"
                className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-lg flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={deleteSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmDelete}
                isLoading={deleteSubmitting}
                disabled={deleteSubmitting}
              >
                Delete Record
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
