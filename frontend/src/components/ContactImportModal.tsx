import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  X,
  ChevronRight,
  ChevronLeft,
  RotateCw,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { Button } from './Button';
import { contactImportApi } from '../lib/contactImportApi';
import {
  DuplicatePolicy,
  ImportExecutionRequest,
  ImportPreviewResponse,
  ImportResultReport,
} from '../types/crm';
import { ApiErrorResponse } from '../lib/api';

interface ContactImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

type ImportStep = 'UPLOAD' | 'PREVIEW' | 'EXECUTING' | 'SUMMARY';

export const ContactImportModal: React.FC<ContactImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const [step, setStep] = useState<ImportStep>('UPLOAD');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Preview data from backend
  const [previewData, setPreviewData] = useState<ImportPreviewResponse | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [duplicatePolicy, setDuplicatePolicy] = useState<DuplicatePolicy>('SKIP');
  const [skipInvalidRows, setSkipInvalidRows] = useState(true);

  // Result data from backend
  const [resultReport, setResultReport] = useState<ImportResultReport | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (file: File | undefined) => {
    setErrorMessage(null);
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv') && !file.name.toLowerCase().endsWith('.txt')) {
      setErrorMessage('Please select a valid CSV (.csv or .txt) file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 5MB maximum limit.');
      return;
    }

    setSelectedFile(file);
  };

  const handleStartUploadAndPreview = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await contactImportApi.previewImport(selectedFile, columnMapping);
      setPreviewData(response);
      setColumnMapping(response.mappedFields || {});
      setStep('PREVIEW');
    } catch (err: any) {
      if (err instanceof ApiErrorResponse) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(err.message || 'Failed to parse and preview CSV.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!previewData) return;

    setIsLoading(true);
    setErrorMessage(null);
    setStep('EXECUTING');

    const request: ImportExecutionRequest = {
      sessionId: previewData.sessionId,
      duplicatePolicy,
      skipInvalidRows,
    };

    try {
      const report = await contactImportApi.executeImport(request);
      setResultReport(report);
      setStep('SUMMARY');
      onImportComplete();
    } catch (err: any) {
      setStep('PREVIEW');
      if (err instanceof ApiErrorResponse) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(err.message || 'Import execution failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (previewData && step !== 'SUMMARY') {
      contactImportApi.cancelSession(previewData.sessionId).catch(() => {});
    }
    // Reset state
    setStep('UPLOAD');
    setSelectedFile(null);
    setPreviewData(null);
    setErrorMessage(null);
    setResultReport(null);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl text-white space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 id="import-modal-title" className="text-base font-bold text-white">
                Import Contacts from CSV
              </h3>
              <p className="text-xs text-slate-400">
                Safe, validated two-phase import with automatic duplicate detection
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div
            role="alert"
            className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-lg flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {/* Step 1: Upload */}
        {step === 'UPLOAD' && (
          <div className="space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                if (e.dataTransfer.files?.[0]) {
                  handleFileChange(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                isDragOver
                  ? 'border-blue-500 bg-blue-500/10'
                  : selectedFile
                  ? 'border-emerald-500/60 bg-emerald-500/5'
                  : 'border-slate-700 hover:border-slate-600 bg-slate-950/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0])}
                aria-label="Upload CSV File"
              />

              {selectedFile ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="font-semibold text-white text-sm">{selectedFile.name}</div>
                  <div className="text-slate-400 text-xs font-mono">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </div>
                  <span className="text-xs text-blue-400 mt-1 hover:underline">
                    Click to choose a different file
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="font-semibold text-white text-sm">
                    Drop your CSV file here, or browse
                  </div>
                  <p className="text-xs text-slate-400 max-w-sm">
                    Supports comma, semicolon, or tab-delimited files up to 5MB. Headers are automatically detected.
                  </p>
                </div>
              )}
            </div>

            <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-lg text-xs space-y-1.5 text-slate-400">
              <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-400" /> Expected Fields
              </div>
              <div>
                • <strong className="text-slate-200">Required:</strong> First Name, Last Name, Email
              </div>
              <div>
                • <strong className="text-slate-200">Optional:</strong> Phone, Job Title, Status, Account/Company Name, Notes
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button variant="outline" size="sm" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!selectedFile || isLoading}
                isLoading={isLoading}
                onClick={handleStartUploadAndPreview}
              >
                Inspect & Preview
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Preview & Validation Review */}
        {step === 'PREVIEW' && previewData && (
          <div className="space-y-4">
            {/* KPI Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg">
                <div className="text-[11px] text-slate-400">Total Rows</div>
                <div className="text-lg font-bold text-white font-mono mt-0.5">
                  {previewData.totalRows}
                </div>
              </div>
              <div className="p-3 bg-slate-950/80 border border-emerald-500/20 rounded-lg">
                <div className="text-[11px] text-emerald-400">Valid Records</div>
                <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
                  {previewData.validRowCount}
                </div>
              </div>
              <div className="p-3 bg-slate-950/80 border border-amber-500/20 rounded-lg">
                <div className="text-[11px] text-amber-400">Duplicates</div>
                <div className="text-lg font-bold text-amber-400 font-mono mt-0.5">
                  {previewData.duplicateCount}
                </div>
              </div>
              <div className="p-3 bg-slate-950/80 border border-rose-500/20 rounded-lg">
                <div className="text-[11px] text-rose-400">Invalid Rows</div>
                <div className="text-lg font-bold text-rose-400 font-mono mt-0.5">
                  {previewData.invalidRowCount}
                </div>
              </div>
            </div>

            {/* Validation warnings / errors alert */}
            {previewData.invalidRowCount > 0 && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-lg space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  {previewData.invalidRowCount} row(s) contain validation errors
                </div>
                <ul className="list-disc list-inside text-[11px] text-rose-300/80 max-h-24 overflow-y-auto space-y-0.5">
                  {previewData.validationErrors.slice(0, 5).map((err, idx) => (
                    <li key={idx}>
                      Row {err.rowNumber} [{err.field}]: {err.issue}
                    </li>
                  ))}
                  {previewData.validationErrors.length > 5 && (
                    <li>...and {previewData.validationErrors.length - 5} more</li>
                  )}
                </ul>
              </div>
            )}

            {/* Duplicate Policy Config */}
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg space-y-2.5">
              <label className="block text-xs font-semibold text-slate-300">
                Duplicate Contact Strategy (when email exists in CRM):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="radio"
                    name="duplicatePolicy"
                    value="SKIP"
                    checked={duplicatePolicy === 'SKIP'}
                    onChange={() => setDuplicatePolicy('SKIP')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-white">Skip Duplicates</div>
                    <div className="text-[10px] text-slate-400">Preserve existing records untouched</div>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="radio"
                    name="duplicatePolicy"
                    value="UPDATE"
                    checked={duplicatePolicy === 'UPDATE'}
                    onChange={() => setDuplicatePolicy('UPDATE')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-white">Update Existing</div>
                    <div className="text-[10px] text-slate-400">Update non-empty fields in existing records</div>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="radio"
                    name="duplicatePolicy"
                    value="ALLOW_DUPLICATES"
                    checked={duplicatePolicy === 'ALLOW_DUPLICATES'}
                    onChange={() => setDuplicatePolicy('ALLOW_DUPLICATES')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-white">Allow Duplicates</div>
                    <div className="text-[10px] text-slate-400">Create new contacts anyway</div>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="radio"
                    name="duplicatePolicy"
                    value="REJECT_ALL"
                    checked={duplicatePolicy === 'REJECT_ALL'}
                    onChange={() => setDuplicatePolicy('REJECT_ALL')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-white">Reject Entire Batch</div>
                    <div className="text-[10px] text-slate-400">Abort if any duplicates exist</div>
                  </div>
                </label>
              </div>

              {previewData.invalidRowCount > 0 && (
                <div className="pt-2 border-t border-slate-800/80">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={skipInvalidRows}
                      onChange={(e) => setSkipInvalidRows(e.target.checked)}
                      className="rounded border-slate-700 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Skip invalid rows and import only valid records</span>
                  </label>
                </div>
              )}
            </div>

            {/* Sample Records Table */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Sample Parsed Records ({previewData.sampleRows.length} of {previewData.totalRows})
              </div>
              <div className="overflow-x-auto border border-slate-800 rounded-lg max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-950 sticky top-0 border-b border-slate-800 text-[10px] uppercase text-slate-400">
                    <tr>
                      <th className="p-2">Line</th>
                      <th className="p-2">Name</th>
                      <th className="p-2">Email</th>
                      <th className="p-2">Account</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {previewData.sampleRows.map((row) => (
                      <tr
                        key={row.rowNumber}
                        className={!row.valid ? 'bg-rose-500/5' : row.duplicate ? 'bg-amber-500/5' : ''}
                      >
                        <td className="p-2 text-slate-400">#{row.rowNumber}</td>
                        <td className="p-2 text-white font-sans">
                          {row.firstName} {row.lastName}
                        </td>
                        <td className="p-2 text-slate-300">{row.email}</td>
                        <td className="p-2 text-slate-400 font-sans">
                          {row.accountIdentifier || (row.matchedAccountId ? `Account #${row.matchedAccountId}` : 'Unassigned')}
                        </td>
                        <td className="p-2">
                          {!row.valid ? (
                            <span className="text-rose-400 text-[10px] font-sans font-semibold">Invalid</span>
                          ) : row.duplicate ? (
                            <span className="text-amber-400 text-[10px] font-sans font-semibold">Duplicate</span>
                          ) : (
                            <span className="text-emerald-400 text-[10px] font-sans font-semibold">Valid</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setStep('UPLOAD')}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleExecuteImport}
                  isLoading={isLoading}
                  disabled={isLoading || (previewData.validRowCount === 0)}
                >
                  Confirm & Import Records
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Executing */}
        {step === 'EXECUTING' && (
          <div className="py-12 text-center space-y-3">
            <RotateCw className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
            <h4 className="text-base font-semibold text-white">Importing Contacts...</h4>
            <p className="text-xs text-slate-400">
              Executing transactional batch import and applying chosen duplicate policies.
            </p>
          </div>
        )}

        {/* Step 4: Summary Report */}
        {step === 'SUMMARY' && resultReport && (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Import Completed Successfully</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Processed in {resultReport.durationMs}ms
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg">
                <div className="text-[11px] text-slate-400">Processed</div>
                <div className="text-lg font-bold text-white font-mono mt-0.5">
                  {resultReport.totalProcessed}
                </div>
              </div>
              <div className="p-3 bg-slate-950/80 border border-emerald-500/20 rounded-lg">
                <div className="text-[11px] text-emerald-400">Imported</div>
                <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
                  {resultReport.importedCount}
                </div>
              </div>
              <div className="p-3 bg-slate-950/80 border border-blue-500/20 rounded-lg">
                <div className="text-[11px] text-blue-400">Updated</div>
                <div className="text-lg font-bold text-blue-400 font-mono mt-0.5">
                  {resultReport.updatedCount}
                </div>
              </div>
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg">
                <div className="text-[11px] text-slate-400">Skipped</div>
                <div className="text-lg font-bold text-slate-400 font-mono mt-0.5">
                  {resultReport.skippedCount}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <Button variant="primary" size="sm" onClick={handleClose}>
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
