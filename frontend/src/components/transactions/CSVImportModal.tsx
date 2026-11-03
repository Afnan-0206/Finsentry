import React, { useState } from 'react';
import { X, Upload, CheckCircle2, AlertCircle, FileText, Download } from 'lucide-react';
import { api } from '../../services/api';
import type { CSVImportResponse } from '../../types';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

export const CSVImportModal: React.FC<CSVImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [result, setResult] = useState<CSVImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.endsWith('.csv')) {
        setError('Only .csv files are supported.');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setError(null);
      const res = await api.importTransactionsCSV(selectedFile);
      setResult(res);
      if (res.imported_count > 0) {
        onImportSuccess();
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'CSV upload failed. Please verify headers.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadSample = () => {
    const csvContent =
      'Date,Merchant,Description,Amount,Type,Category,Payment Method,Reference\n' +
      '2026-03-01,Netflix Entertainment,Netflix Standard Monthly,649.00,expense,Subscriptions,Credit Card,NFLX20260301\n' +
      '2026-03-02,Swiggy,Dinner Delivery Biryani,480.00,expense,Food,UPI,SWIGGY20260302\n' +
      '2026-03-03,Amazon India,Soundcore Earbuds,1299.00,expense,Shopping,Credit Card,AMZ20260303\n' +
      '2026-03-03,Amazon India,Soundcore Earbuds,1299.00,expense,Shopping,Credit Card,AMZ20260303DUP\n' +
      '2026-03-04,Infosys Technologies,Monthly Salary Inflow,85000.00,income,Salary,Net Banking,SAL20260304\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_finsentry_transactions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-xs" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-[#121215] rounded-[24px] shadow-2xl border border-white/[0.1] overflow-hidden z-10 text-white">
        {/* Header */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-[#151518]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-white">
              <Upload className="w-4 h-4 text-[#E8FF1F]" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">Import CSV Statement</h3>
              <p className="text-xs text-white/40 font-mono">Bulk batch transaction ingest</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="p-3.5 rounded-xl bg-[#58B58C]/10 border border-[#58B58C]/20 text-[#58B58C] space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Import Batch Successful</span>
              </div>
              <p className="text-[11px] text-white/80 font-mono">
                Ingested {result.imported_count} new entries ({result.duplicate_count + result.rejected_count} skipped/duplicates).
              </p>
            </div>
          )}

          {/* Drag & Drop File Input */}
          <div className="border-2 border-dashed border-white/[0.15] hover:border-[#E8FF1F]/50 rounded-2xl p-6 text-center transition-all bg-[#0B0B0D]">
            <input
              type="file"
              id="csv_file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="csv_file" className="cursor-pointer flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-[#E8FF1F] mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <span className="font-bold text-white text-sm">
                {selectedFile ? selectedFile.name : 'Choose bank statement CSV'}
              </span>
              <span className="text-[11px] text-white/40 font-mono mt-1">
                Standard format: Date, Merchant, Description, Amount, Type
              </span>
            </label>
          </div>

          {/* Sample template link */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleDownloadSample}
              className="flex items-center gap-1.5 text-xs text-[#E8FF1F] hover:underline font-mono"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Sample CSV Template</span>
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/[0.06] font-semibold transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="px-5 py-2 rounded-xl bg-[#E8FF1F] text-black font-extrabold hover:bg-[#d4eb17] transition-all disabled:opacity-40 shadow-bento"
            >
              {isUploading ? 'Ingesting Batch...' : 'Import Statement'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
