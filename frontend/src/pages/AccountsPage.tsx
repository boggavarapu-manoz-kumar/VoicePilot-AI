import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge, BadgeVariant } from '../components/Badge';
import { accountsApi } from '../lib/accountsApi';
import { contactsApi } from '../lib/contactsApi';
import { ApiErrorResponse } from '../lib/api';
import {
  Account,
  Contact,
  AccountStatus,
  PaginationResponse,
  CreateAccountRequest,
  UpdateAccountRequest,
} from '../types/crm';
import {
  Building2,
  Plus,
  Search,
  RefreshCw,
  Globe,
  Phone,
  Users,
  Briefcase,
  Edit2,
  Trash2,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

const STATUS_VARIANTS: Record<AccountStatus, BadgeVariant> = {
  ACTIVE: 'success',
  PROSPECT: 'warning',
  INACTIVE: 'neutral',
};

const STATUS_LABELS: Record<AccountStatus, string> = {
  ACTIVE: 'Active',
  PROSPECT: 'Prospect',
  INACTIVE: 'Inactive',
};

export const AccountsPage: React.FC = () => {
  // Accounts list state
  const [accountsData, setAccountsData] = useState<PaginationResponse<Account> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<AccountStatus | ''>('');
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 15;

  // Selected account for details / associated contacts drawer
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [associatedContacts, setAssociatedContacts] = useState<Contact[]>([]);
  const [isContactsLoading, setIsContactsLoading] = useState(false);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);

  // Form inputs & errors
  const [formData, setFormData] = useState<{
    name: string;
    domain: string;
    industry: string;
    phone: string;
    website: string;
    status: AccountStatus;
  }>({
    name: '',
    domain: '',
    industry: '',
    phone: '',
    website: '',
    status: 'ACTIVE',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formGlobalError, setFormGlobalError] = useState<string | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Toast auto-dismiss
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Fetch accounts list
  const fetchAccounts = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const res = await accountsApi.listAccounts(
        {
          search: debouncedSearch.trim() || undefined,
          status: selectedStatus || undefined,
          page: currentPage,
          size: pageSize,
          sort: 'name',
        },
        controller.signal
      );
      setAccountsData(res);
      setError(null);
    } catch (err: unknown) {
      if (err instanceof ApiErrorResponse) {
        if (err.code === 'NETWORK_ERROR' && err.message.includes('aborted')) {
          return;
        }
        setError(err.message || 'Failed to load accounts');
      } else {
        setError('An unexpected error occurred while communicating with the backend');
      }
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, selectedStatus, currentPage, pageSize]);

  useEffect(() => {
    fetchAccounts();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchAccounts]);

  // Fetch associated contacts when an account is selected
  const fetchAssociatedContacts = useCallback(async (accountId: number) => {
    setIsContactsLoading(true);
    try {
      const res = await contactsApi.listContacts({ accountId, size: 50 });
      setAssociatedContacts(res.content);
    } catch {
      setAssociatedContacts([]);
    } finally {
      setIsContactsLoading(false);
    }
  }, []);

  const handleSelectAccount = (account: Account) => {
    setSelectedAccount(account);
    fetchAssociatedContacts(account.id);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('');
    setCurrentPage(0);
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingAccount(null);
    setFormData({
      name: '',
      domain: '',
      industry: '',
      phone: '',
      website: '',
      status: 'ACTIVE',
    });
    setFormErrors({});
    setFormGlobalError(null);
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (account: Account, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingAccount(account);
    setFormData({
      name: account.name,
      domain: account.domain || '',
      industry: account.industry || '',
      phone: account.phone || '',
      website: account.website || '',
      status: account.status,
    });
    setFormErrors({});
    setFormGlobalError(null);
    setIsFormModalOpen(true);
  };

  // Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) {
      errors.name = 'Account name is required';
    } else if (formData.name.length > 160) {
      errors.name = 'Account name cannot exceed 160 characters';
    }

    if (formData.domain && formData.domain.length > 128) {
      errors.domain = 'Domain cannot exceed 128 characters';
    }
    if (formData.industry && formData.industry.length > 80) {
      errors.industry = 'Industry cannot exceed 80 characters';
    }
    if (formData.phone && formData.phone.length > 32) {
      errors.phone = 'Phone number cannot exceed 32 characters';
    }
    if (formData.website && formData.website.length > 255) {
      errors.website = 'Website cannot exceed 255 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save Account
  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setFormSubmitting(true);
    setFormGlobalError(null);

    try {
      if (editingAccount) {
        const updatePayload: UpdateAccountRequest = {
          name: formData.name.trim(),
          domain: formData.domain.trim() || null,
          industry: formData.industry.trim() || null,
          phone: formData.phone.trim() || null,
          website: formData.website.trim() || null,
          status: formData.status,
        };
        const updated = await accountsApi.updateAccount(editingAccount.id, updatePayload);
        setToastMessage(`Account "${updated.name}" updated successfully.`);
        if (selectedAccount?.id === updated.id) {
          setSelectedAccount(updated);
        }
      } else {
        const createPayload: CreateAccountRequest = {
          name: formData.name.trim(),
          domain: formData.domain.trim() || null,
          industry: formData.industry.trim() || null,
          phone: formData.phone.trim() || null,
          website: formData.website.trim() || null,
          status: formData.status,
        };
        const created = await accountsApi.createAccount(createPayload);
        setToastMessage(`Account "${created.name}" created successfully.`);
      }

      setIsFormModalOpen(false);
      fetchAccounts();
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
        setFormGlobalError('Network error occurred while saving account.');
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (account: Account, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setAccountToDelete(account);
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!accountToDelete) return;

    setDeleteSubmitting(true);
    setDeleteError(null);

    try {
      await accountsApi.deleteAccount(accountToDelete.id);
      setIsDeleteModalOpen(false);
      setToastMessage(`Account "${accountToDelete.name}" deleted. Associated contacts remain intact.`);
      if (selectedAccount?.id === accountToDelete.id) {
        setSelectedAccount(null);
        setAssociatedContacts([]);
      }
      setAccountToDelete(null);
      fetchAccounts();
    } catch (err: unknown) {
      if (err instanceof ApiErrorResponse) {
        setDeleteError(err.message || 'Failed to delete account.');
      } else {
        setDeleteError('Network error occurred while attempting to delete account.');
      }
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const hasActiveFilters = Boolean(searchTerm.trim()) || selectedStatus !== '';

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
        title="Accounts & Organizations"
        description="Enterprise client directory, organizational hierarchies, and associated contact profiles."
        action={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAccounts}
              disabled={isLoading}
              aria-label="Refresh accounts"
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
              Add Account
            </Button>
          </div>
        }
      />

      {/* Search & Filter Controls */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search account name, domain, industry..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                aria-label="Search accounts"
              />
            </div>

            {/* Status */}
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value as AccountStatus | '');
                  setCurrentPage(0);
                }}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                aria-label="Filter by account status"
              >
                <option value="">All Account Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="PROSPECT">Prospect</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center justify-center gap-1 text-xs text-slate-400 hover:text-white px-3 py-2 rounded hover:bg-slate-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Total Summary */}
        <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            <span>
              {accountsData
                ? `${accountsData.totalElements} organization${accountsData.totalElements === 1 ? '' : 's'} registered`
                : 'Loading accounts...'}
            </span>
          </div>
          {selectedAccount && (
            <span className="text-blue-400 font-medium">
              Viewing details for {selectedAccount.name}
            </span>
          )}
        </div>
      </Card>

      {/* Main Layout Grid: Accounts Table + Selected Account Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Accounts Table Column (Span 2) */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="overflow-hidden p-0">
            {/* Error State */}
            {error && (
              <div className="p-8 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-3">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-white">Error Loading Accounts</h3>
                <p className="text-sm text-slate-400 max-w-md mt-1 mb-4">{error}</p>
                <Button variant="primary" size="sm" onClick={fetchAccounts}>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Retry
                </Button>
              </div>
            )}

            {/* Skeleton Loading */}
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

            {/* Empty State */}
            {!isLoading && !error && (!accountsData || accountsData.content.length === 0) && (
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-white">
                  {hasActiveFilters ? 'No Matching Accounts' : 'No Accounts Yet'}
                </h3>
                <p className="text-sm text-slate-400 max-w-sm mt-1 mb-4">
                  {hasActiveFilters
                    ? 'Adjust search keywords or filter values.'
                    : 'Create your first organizational account to associate contacts.'}
                </p>
                {hasActiveFilters ? (
                  <Button variant="outline" size="sm" onClick={handleClearFilters}>
                    Clear Filters
                  </Button>
                ) : (
                  <Button variant="primary" size="sm" onClick={handleOpenCreateModal}>
                    <Plus className="w-4 h-4 mr-1.5" />
                    Create First Account
                  </Button>
                )}
              </div>
            )}

            {/* Data Table */}
            {!isLoading && !error && accountsData && accountsData.content.length > 0 && (
              <div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse" aria-label="Accounts directory">
                    <thead>
                      <tr className="border-b border-slate-800/80 bg-slate-900/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        <th scope="col" className="px-6 py-3.5">
                          Account
                        </th>
                        <th scope="col" className="px-6 py-3.5">
                          Domain & Industry
                        </th>
                        <th scope="col" className="px-6 py-3.5 text-center">
                          Contacts
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
                      {accountsData.content.map((account) => {
                        const isSelected = selectedAccount?.id === account.id;
                        return (
                          <tr
                            key={account.id}
                            onClick={() => handleSelectAccount(account)}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-blue-600/15 border-l-2 border-l-blue-500'
                                : 'hover:bg-slate-800/30'
                            }`}
                          >
                            <td className="px-6 py-4">
                              <div className="font-semibold text-white text-sm">
                                {account.name}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                ID: #{account.id}
                              </div>
                            </td>

                            <td className="px-6 py-4 space-y-1">
                              <div className="flex items-center gap-1.5 text-slate-300">
                                <Globe className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                <span className="truncate max-w-[150px]">
                                  {account.domain || 'No domain'}
                                </span>
                              </div>
                              {account.industry && (
                                <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                                  <Briefcase className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                  <span>{account.industry}</span>
                                </div>
                              )}
                            </td>

                            <td className="px-6 py-4 text-center">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-[11px] font-semibold">
                                <Users className="w-3 h-3 text-slate-400" />
                                {account.contactCount}
                              </span>
                            </td>

                            <td className="px-6 py-4">
                              <Badge variant={STATUS_VARIANTS[account.status]} size="sm" dot>
                                {STATUS_LABELS[account.status]}
                              </Badge>
                            </td>

                            <td className="px-6 py-4 text-right">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => handleOpenEditModal(account, e)}
                                  className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                                  aria-label={`Edit ${account.name}`}
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleOpenDeleteModal(account, e)}
                                  className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-colors"
                                  aria-label={`Delete ${account.name}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-900/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
                  <div>
                    Page <span className="font-semibold text-white">{accountsData.page + 1}</span> of{' '}
                    <span className="font-semibold text-white">{accountsData.totalPages || 1}</span> ({accountsData.totalElements} accounts total)
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 0))}
                      disabled={accountsData.first || isLoading}
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => p + 1)}
                      disabled={accountsData.last || isLoading}
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
        </div>

        {/* Account Details & Associated Contacts Column (Span 1) */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400 mb-4 flex items-center justify-between">
              <span>Account Overview</span>
              {selectedAccount && (
                <button
                  type="button"
                  onClick={() => setSelectedAccount(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Clear Selection
                </button>
              )}
            </h3>

            {selectedAccount ? (
              <div className="space-y-5 text-xs">
                <div>
                  <h4 className="text-base font-bold text-white">{selectedAccount.name}</h4>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant={STATUS_VARIANTS[selectedAccount.status]} size="sm" dot>
                      {STATUS_LABELS[selectedAccount.status]}
                    </Badge>
                    <span className="text-slate-400 font-mono text-[11px]">
                      Created {new Date(selectedAccount.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5 p-3.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                  {selectedAccount.domain && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5" /> Domain
                      </span>
                      <span className="text-white font-mono">{selectedAccount.domain}</span>
                    </div>
                  )}

                  {selectedAccount.industry && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5" /> Industry
                      </span>
                      <span className="text-white">{selectedAccount.industry}</span>
                    </div>
                  )}

                  {selectedAccount.phone && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" /> Phone
                      </span>
                      <span className="text-white">{selectedAccount.phone}</span>
                    </div>
                  )}

                  {selectedAccount.website && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <ExternalLink className="w-3.5 h-3.5" /> Website
                      </span>
                      <a
                        href={selectedAccount.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-400 hover:underline truncate max-w-[140px]"
                      >
                        {selectedAccount.website}
                      </a>
                    </div>
                  )}
                </div>

                {/* Associated Contacts Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <h5 className="font-semibold text-white flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-400" />
                      Associated Contacts ({selectedAccount.contactCount})
                    </h5>
                  </div>

                  {isContactsLoading ? (
                    <div className="py-4 text-center text-slate-400">Loading contacts...</div>
                  ) : associatedContacts.length === 0 ? (
                    <div className="p-3 text-center bg-slate-900/40 rounded-lg text-slate-400 border border-slate-800/60">
                      No contacts currently linked to this account.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {associatedContacts.map((contact) => (
                        <div
                          key={contact.id}
                          className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-between"
                        >
                          <div>
                            <div className="font-semibold text-white">
                              {contact.firstName} {contact.lastName}
                            </div>
                            <div className="text-[11px] text-slate-400">{contact.email}</div>
                          </div>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            {contact.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => handleOpenEditModal(selectedAccount, e)}
                  >
                    <Edit2 className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={(e) => handleOpenDeleteModal(selectedAccount, e)}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                <Building2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                Select any account in the directory to inspect metadata and associated customer contacts.
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Create / Edit Account Modal */}
      {isFormModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="account-form-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
        >
          <div className="relative bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-white space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 id="account-form-title" className="text-base font-bold text-white">
                {editingAccount ? 'Edit Account' : 'Create Account'}
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

            <form onSubmit={handleSaveAccount} className="space-y-3.5 text-xs">
              {/* Account Name */}
              <div>
                <label htmlFor="account-name" className="block font-semibold text-slate-300 mb-1">
                  Organization / Account Name <span className="text-rose-400">*</span>
                </label>
                <input
                  id="account-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2 bg-slate-950 border ${
                    formErrors.name ? 'border-rose-500' : 'border-slate-700'
                  } rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="e.g. Acme Corporation"
                  disabled={formSubmitting}
                />
                {formErrors.name && (
                  <p className="text-rose-400 text-[11px] mt-1">{formErrors.name}</p>
                )}
              </div>

              {/* Domain & Industry */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="account-domain" className="block font-semibold text-slate-300 mb-1">
                    Primary Domain
                  </label>
                  <input
                    id="account-domain"
                    type="text"
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="acme.com"
                    disabled={formSubmitting}
                  />
                  {formErrors.domain && (
                    <p className="text-rose-400 text-[11px] mt-1">{formErrors.domain}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="account-industry" className="block font-semibold text-slate-300 mb-1">
                    Industry
                  </label>
                  <input
                    id="account-industry"
                    type="text"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Software SaaS"
                    disabled={formSubmitting}
                  />
                  {formErrors.industry && (
                    <p className="text-rose-400 text-[11px] mt-1">{formErrors.industry}</p>
                  )}
                </div>
              </div>

              {/* Phone & Website */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="account-phone" className="block font-semibold text-slate-300 mb-1">
                    Corporate Phone
                  </label>
                  <input
                    id="account-phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+1-555-0100"
                    disabled={formSubmitting}
                  />
                </div>

                <div>
                  <label htmlFor="account-website" className="block font-semibold text-slate-300 mb-1">
                    Website URL
                  </label>
                  <input
                    id="account-website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://acme.com"
                    disabled={formSubmitting}
                  />
                </div>
              </div>

              {/* Lifecycle Status */}
              <div>
                <label htmlFor="account-status" className="block font-semibold text-slate-300 mb-1">
                  Account Status
                </label>
                <select
                  id="account-status"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as AccountStatus })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={formSubmitting}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="PROSPECT">Prospect</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              {/* Action Buttons */}
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
                  {editingAccount ? 'Save Changes' : 'Create Account'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && accountToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 flex-shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 id="delete-account-title" className="text-base font-bold text-white">
                  Delete Account
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Are you sure you want to delete this account?
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg text-xs space-y-1.5">
              <div className="font-semibold text-white">{accountToDelete.name}</div>
              {accountToDelete.domain && (
                <div className="text-slate-400">Domain: {accountToDelete.domain}</div>
              )}
              <div className="text-amber-400 font-medium">
                Note: {accountToDelete.contactCount} associated contact(s) will remain in your CRM with their account set to Unassigned.
              </div>
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
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

