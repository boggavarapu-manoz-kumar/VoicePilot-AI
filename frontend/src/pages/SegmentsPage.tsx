import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge, BadgeVariant } from '../components/Badge';
import { segmentsApi } from '../lib/segmentsApi';
import { accountsApi } from '../lib/accountsApi';
import {
  Account,
  Contact,
  ContactStatus,
  PaginationResponse,
  Segment,
  SegmentFilterCriteria,
  CreateSegmentRequest,
  UpdateSegmentRequest,
} from '../types/crm';
import {
  Filter,
  Plus,
  Search,
  Download,
  Trash2,
  Edit2,
  Users,
  Building2,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  SlidersHorizontal,
  Mail,
  Phone,
  CheckCircle2,
} from 'lucide-react';

const STATUS_VARIANTS: Record<ContactStatus, BadgeVariant> = {
  LEAD: 'info',
  PROSPECT: 'warning',
  CUSTOMER: 'success',
  CHURNED: 'danger',
};

export const SegmentsPage: React.FC = () => {
  // Segments list state
  const [segments, setSegments] = useState<Segment[]>([]);
  const [isSegmentsLoading, setIsSegmentsLoading] = useState(true);
  const [segmentsError, setSegmentsError] = useState<string | null>(null);

  // Selected segment state
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);
  const [contactsData, setContactsData] = useState<PaginationResponse<Contact> | null>(null);
  const [isContactsLoading, setIsContactsLoading] = useState(false);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [contactsPage, setContactsPage] = useState(0);
  const contactsPageSize = 10;

  // Account options for filter builder
  const [accounts, setAccounts] = useState<Account[]>([]);

  // Create / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSearch, setFormSearch] = useState('');
  const [formStatus, setFormStatus] = useState<ContactStatus | ''>('');
  const [formAccountId, setFormAccountId] = useState<string>('');
  const [formWithoutAccount, setFormWithoutAccount] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [segmentToDelete, setSegmentToDelete] = useState<Segment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Export state
  const [isExporting, setIsExporting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Load accounts for filter dropdown
  useEffect(() => {
    accountsApi.listAccounts({ page: 0, size: 100 })
      .then((res) => setAccounts(res.content))
      .catch((err) => console.error('Failed to load accounts for segment builder', err));
  }, []);

  // Fetch Segments list
  const fetchSegments = useCallback(async (selectId?: number) => {
    setIsSegmentsLoading(true);
    setSegmentsError(null);
    try {
      const response = await segmentsApi.listSegments(0, 100);
      setSegments(response.content);

      if (response.content.length > 0) {
        if (selectId) {
          const match = response.content.find((s) => s.id === selectId);
          setSelectedSegment(match || response.content[0]);
        } else {
          setSelectedSegment((prev) => {
            if (prev) {
              const stillExists = response.content.find((s) => s.id === prev.id);
              return stillExists || response.content[0];
            }
            return response.content[0];
          });
        }
      } else {
        setSelectedSegment(null);
        setContactsData(null);
      }
    } catch (err: unknown) {
      setSegmentsError(err instanceof Error ? err.message : 'Failed to load saved segments.');
    } finally {
      setIsSegmentsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSegments();
  }, [fetchSegments]);

  // Fetch Contacts for the currently selected segment
  useEffect(() => {
    if (!selectedSegment) {
      setContactsData(null);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsContactsLoading(true);
    setContactsError(null);

    segmentsApi.getSegmentContacts(selectedSegment.id, contactsPage, contactsPageSize, controller.signal)
      .then((res) => {
        setContactsData(res);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setContactsError(err instanceof Error ? err.message : 'Failed to load contacts for segment.');
      })
      .finally(() => {
        setIsContactsLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [selectedSegment, contactsPage]);

  // Reset contacts page when segment selection changes
  const handleSelectSegment = (segment: Segment) => {
    setSelectedSegment(segment);
    setContactsPage(0);
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingSegment(null);
    setFormName('');
    setFormDescription('');
    setFormSearch('');
    setFormStatus('');
    setFormAccountId('');
    setFormWithoutAccount(false);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (segment: Segment) => {
    setEditingSegment(segment);
    setFormName(segment.name);
    setFormDescription(segment.description || '');
    setFormSearch(segment.filterCriteria.search || '');
    setFormStatus(segment.filterCriteria.status || '');
    setFormAccountId(segment.filterCriteria.accountId ? segment.filterCriteria.accountId.toString() : '');
    setFormWithoutAccount(Boolean(segment.filterCriteria.withoutAccount));
    setFormError(null);
    setIsModalOpen(true);
  };

  // Submit Create or Edit Form
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Segment name is required.');
      return;
    }

    setFormSubmitting(true);
    setFormError(null);

    const filterCriteria: SegmentFilterCriteria = {
      search: formSearch.trim() || null,
      status: (formStatus as ContactStatus) || null,
      accountId: formWithoutAccount ? null : (formAccountId ? Number(formAccountId) : null),
      withoutAccount: formWithoutAccount || null,
    };

    try {
      if (editingSegment) {
        const updateReq: UpdateSegmentRequest = {
          name: formName.trim(),
          description: formDescription.trim() || null,
          filterCriteria,
        };
        const updated = await segmentsApi.updateSegment(editingSegment.id, updateReq);
        setIsModalOpen(false);
        setToastMessage(`Segment "${updated.name}" updated successfully.`);
        setTimeout(() => setToastMessage(null), 4000);
        await fetchSegments(updated.id);
      } else {
        const createReq: CreateSegmentRequest = {
          name: formName.trim(),
          description: formDescription.trim() || null,
          filterCriteria,
        };
        const created = await segmentsApi.createSegment(createReq);
        setIsModalOpen(false);
        setToastMessage(`Segment "${created.name}" created.`);
        setTimeout(() => setToastMessage(null), 4000);
        await fetchSegments(created.id);
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to save segment. Please check your inputs.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Confirm Delete
  const handleDeleteSegment = async () => {
    if (!segmentToDelete) return;
    setIsDeleting(true);
    try {
      await segmentsApi.deleteSegment(segmentToDelete.id);
      setIsDeleteModalOpen(false);
      setToastMessage(`Segment "${segmentToDelete.name}" deleted.`);
      setTimeout(() => setToastMessage(null), 4000);
      setSegmentToDelete(null);
      await fetchSegments();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete segment.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Export Segment Contacts as CSV
  const handleExportCsv = async () => {
    if (!selectedSegment) return;
    setIsExporting(true);
    try {
      const blob = await segmentsApi.exportSegmentCsv(selectedSegment.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeName = selectedSegment.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      link.href = url;
      link.setAttribute('download', `segment_${safeName}_export.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setToastMessage(`Exported contacts for "${selectedSegment.name}"`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      alert('Failed to export CSV. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Helper to render filter summary pills
  const renderFilterSummary = (criteria: SegmentFilterCriteria) => {
    const pills: { label: string; value: string }[] = [];
    if (criteria.search) {
      pills.push({ label: 'Search', value: `"${criteria.search}"` });
    }
    if (criteria.status) {
      pills.push({ label: 'Status', value: criteria.status });
    }
    if (criteria.withoutAccount) {
      pills.push({ label: 'Account', value: 'Unassigned Only' });
    } else if (criteria.accountId) {
      const matchedAcc = accounts.find((a) => a.id === criteria.accountId);
      pills.push({ label: 'Account', value: matchedAcc ? matchedAcc.name : `Account #${criteria.accountId}` });
    }

    if (pills.length === 0) {
      return <span className="text-sm text-neutral-400 italic">No filters applied (All contacts)</span>;
    }

    return (
      <div className="flex flex-wrap gap-2">
        {pills.map((pill, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-neutral-800 text-neutral-200 border border-neutral-700"
          >
            <span className="text-neutral-400">{pill.label}:</span>
            <span className="text-brand-400 font-semibold">{pill.value}</span>
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-emerald-950 border border-emerald-500/40 text-emerald-200 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="Contact Segments & Saved Views"
        description="Organize, target, and reuse dynamic contact filter definitions without duplicating data."
        action={
          <Button
            variant="primary"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Segment</span>
          </Button>
        }
      />

      {/* Main Grid: Left sidebar (Segments list) & Right pane (Segment contacts) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column: Segments List (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-neutral-200 font-medium text-sm">
                <Filter className="w-4 h-4 text-brand-400" />
                <span>Saved Segments</span>
                <span className="text-xs text-neutral-500 bg-neutral-800 px-2 py-0.5 rounded-full">
                  {segments.length}
                </span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fetchSegments()}
                className="text-neutral-400 hover:text-white p-1"
                title="Refresh list"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Segments Scroll Area */}
            {isSegmentsLoading ? (
              <div className="space-y-2 py-2">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-16 rounded-lg bg-neutral-800/60 animate-pulse" />
                ))}
              </div>
            ) : segmentsError ? (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <div>
                  <p>{segmentsError}</p>
                  <button
                    onClick={() => fetchSegments()}
                    className="mt-1 text-rose-400 underline hover:text-rose-300"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : segments.length === 0 ? (
              <div className="text-center py-8 px-4 border border-dashed border-neutral-800 rounded-xl bg-neutral-900/30">
                <SlidersHorizontal className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                <h4 className="text-sm font-medium text-neutral-300">No saved segments</h4>
                <p className="text-xs text-neutral-500 mt-1 mb-4">
                  Create saved views to quickly filter and export target groups of contacts.
                </p>
                <Button size="sm" variant="secondary" onClick={handleOpenCreateModal}>
                  Create First Segment
                </Button>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
                {segments.map((seg) => {
                  const isSelected = selectedSegment?.id === seg.id;
                  return (
                    <div
                      key={seg.id}
                      onClick={() => handleSelectSegment(seg)}
                      role="button"
                      tabIndex={0}
                      className={`group relative text-left w-full p-3 rounded-xl transition-all border cursor-pointer ${
                        isSelected
                          ? 'bg-brand-950/40 border-brand-500/50 shadow-sm shadow-brand-500/10'
                          : 'bg-neutral-900/50 hover:bg-neutral-800/60 border-neutral-800/80 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4
                            className={`text-sm font-semibold truncate ${
                              isSelected ? 'text-brand-300' : 'text-neutral-200'
                            }`}
                          >
                            {seg.name}
                          </h4>
                          {seg.description && (
                            <p className="text-xs text-neutral-400 truncate mt-0.5">
                              {seg.description}
                            </p>
                          )}
                        </div>
                        <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-neutral-800 text-neutral-300 border border-neutral-700">
                          <Users className="w-3 h-3 text-neutral-400" />
                          {seg.matchingContactCount}
                        </span>
                      </div>

                      {/* Card actions */}
                      <div className="mt-2.5 flex items-center justify-between text-xs text-neutral-500 pt-2 border-t border-neutral-800/60">
                        <span className="truncate">
                          Updated {new Date(seg.updatedAt).toLocaleDateString()}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModal(seg);
                            }}
                            className="p-1 hover:text-white rounded hover:bg-neutral-700/60"
                            title="Edit segment"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSegmentToDelete(seg);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1 hover:text-rose-400 rounded hover:bg-rose-950/40"
                            title="Delete segment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right column: Selected Segment View & Contacts (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {selectedSegment ? (
            <Card className="p-6 space-y-6">
              {/* Header & Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-800">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      {selectedSegment.name}
                    </h2>
                    <Badge variant="primary">
                      {selectedSegment.matchingContactCount} Contacts
                    </Badge>
                  </div>
                  {selectedSegment.description && (
                    <p className="text-sm text-neutral-400 mt-1">
                      {selectedSegment.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleOpenEditModal(selectedSegment)}
                    className="flex items-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Filters</span>
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleExportCsv}
                    disabled={isExporting || selectedSegment.matchingContactCount === 0}
                    className="flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
                  </Button>
                </div>
              </div>

              {/* Active Filter Criteria Summary */}
              <div className="bg-neutral-900/60 p-3.5 rounded-xl border border-neutral-800 space-y-2">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
                  Active Filter Criteria
                </span>
                {renderFilterSummary(selectedSegment.filterCriteria)}
              </div>

              {/* Contacts Table */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
                    <Users className="w-4 h-4 text-brand-400" />
                    <span>Matching Contacts</span>
                  </h3>
                  {contactsData && (
                    <span className="text-xs text-neutral-400">
                      Showing {contactsData.content.length} of {contactsData.totalElements} records
                    </span>
                  )}
                </div>

                {isContactsLoading ? (
                  <div className="space-y-2 py-4">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <div key={n} className="h-12 rounded-lg bg-neutral-800/50 animate-pulse" />
                    ))}
                  </div>
                ) : contactsError ? (
                  <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/40 text-rose-300 text-sm flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                    <span>{contactsError}</span>
                  </div>
                ) : !contactsData || contactsData.content.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-neutral-800 rounded-xl bg-neutral-900/20">
                    <Users className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-neutral-300">No contacts match this segment</p>
                    <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                      Adjust your filter criteria to match more contacts, or import new contacts.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-neutral-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-neutral-900/80 text-neutral-400 font-semibold border-b border-neutral-800 uppercase tracking-wider">
                        <tr>
                          <th className="py-3 px-4">Contact</th>
                          <th className="py-3 px-4">Account</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Phone</th>
                          <th className="py-3 px-4">Job Title</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800/60 bg-neutral-900/30">
                        {contactsData.content.map((c) => (
                          <tr key={c.id} className="hover:bg-neutral-800/40 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-medium text-neutral-200">
                                {c.firstName} {c.lastName}
                              </div>
                              <div className="text-neutral-400 text-[11px] flex items-center gap-1 mt-0.5">
                                <Mail className="w-3 h-3 text-neutral-500" />
                                <span>{c.email}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {c.account ? (
                                <div className="flex items-center gap-1.5 text-neutral-300 font-medium">
                                  <Building2 className="w-3.5 h-3.5 text-neutral-500" />
                                  <span>{c.account.name}</span>
                                </div>
                              ) : (
                                <span className="text-neutral-500 italic">Unassigned</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant={STATUS_VARIANTS[c.status] || 'neutral'}>
                                {c.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-neutral-300">
                              {c.phone ? (
                                <div className="flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-neutral-500" />
                                  <span>{c.phone}</span>
                                </div>
                              ) : (
                                <span className="text-neutral-600">—</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-neutral-400">
                              {c.jobTitle || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination Controls */}
                {contactsData && contactsData.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-neutral-400">
                      Page {contactsData.page + 1} of {contactsData.totalPages}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={contactsData.first || isContactsLoading}
                        onClick={() => setContactsPage((p) => Math.max(0, p - 1))}
                        className="p-1.5"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={contactsData.last || isContactsLoading}
                        onClick={() => setContactsPage((p) => p + 1)}
                        className="p-1.5"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center border-dashed">
              <SlidersHorizontal className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-neutral-300">No segment selected</h3>
              <p className="text-sm text-neutral-500 mt-1 mb-5 max-w-sm mx-auto">
                Select a saved segment from the left panel, or create a new one to begin segmenting contacts.
              </p>
              <Button variant="primary" onClick={handleOpenCreateModal}>
                <Plus className="w-4 h-4 mr-1.5" />
                Create Segment
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* Create / Edit Segment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-brand-400" />
                <h3 className="text-lg font-bold text-white">
                  {editingSegment ? 'Edit Saved Segment' : 'Create Saved Segment'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Segment Name */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Segment Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={120}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. VIP Customers, Marketing Leads"
                  className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-100 placeholder-neutral-500 text-sm focus:outline-none focus:border-brand-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Description <span className="text-neutral-500 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  maxLength={255}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Short note about the purpose of this saved view"
                  className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-100 placeholder-neutral-500 text-sm focus:outline-none focus:border-brand-500"
                />
              </div>

              {/* Filter Criteria Group */}
              <div className="p-4 bg-neutral-950/60 rounded-xl border border-neutral-800/80 space-y-3.5">
                <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider block">
                  Filter Criteria Builder
                </span>

                {/* Free Text Search */}
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">
                    Search Name / Email / Phone
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
                    <input
                      type="text"
                      value={formSearch}
                      onChange={(e) => setFormSearch(e.target.value)}
                      placeholder="Keyword filter..."
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-100 placeholder-neutral-500 text-xs focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">
                    Contact Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ContactStatus | '')}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-100 text-xs focus:outline-none focus:border-brand-500"
                  >
                    <option value="">Any Status</option>
                    <option value="LEAD">Lead</option>
                    <option value="PROSPECT">Prospect</option>
                    <option value="CUSTOMER">Customer</option>
                    <option value="CHURNED">Churned</option>
                  </select>
                </div>

                {/* Account Filter */}
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">
                    Associated Account
                  </label>
                  <select
                    disabled={formWithoutAccount}
                    value={formAccountId}
                    onChange={(e) => setFormAccountId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-100 text-xs focus:outline-none focus:border-brand-500 disabled:opacity-50"
                  >
                    <option value="">Any Account</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Unassigned toggle */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="withoutAccountCheckbox"
                    checked={formWithoutAccount}
                    onChange={(e) => {
                      setFormWithoutAccount(e.target.checked);
                      if (e.target.checked) setFormAccountId('');
                    }}
                    className="rounded bg-neutral-800 border-neutral-700 text-brand-500 focus:ring-brand-500 focus:ring-offset-neutral-900"
                  />
                  <label
                    htmlFor="withoutAccountCheckbox"
                    className="text-xs text-neutral-300 cursor-pointer select-none"
                  >
                    Unassigned Contacts Only (No associated account)
                  </label>
                </div>
              </div>

              {/* Form buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={formSubmitting}
                >
                  {formSubmitting
                    ? 'Saving...'
                    : editingSegment
                    ? 'Update Segment'
                    : 'Save Segment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && segmentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-full bg-rose-950/60 border border-rose-800/50">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Delete Segment</h3>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              Are you sure you want to delete the saved segment{' '}
              <strong className="text-neutral-200">"{segmentToDelete.name}"</strong>?
              This only deletes the saved filter configuration. None of the matching contacts will be modified or deleted.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSegmentToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteSegment}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
