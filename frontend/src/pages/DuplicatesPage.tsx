import React, { useState, useEffect } from 'react';
import {
  Copy,
  AlertTriangle,
  RefreshCw,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Info,
} from 'lucide-react';
import { api } from '@/services/api';
import type { DuplicateCandidatePair, DuplicateAnalysisResponse } from '@/types';
import { cn, formatINR } from '@/lib/utils';
import { BentoCard, BentoMetric } from '@/components/ui/finance-bento';

export const DuplicatesPage: React.FC = () => {
  const [duplicates, setDuplicates] = useState<DuplicateCandidatePair[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analysisMeta, setAnalysisMeta] = useState<DuplicateAnalysisResponse | null>(null);

  const fetchDuplicates = async () => {
    try {
      setLoading(true);
      const res = await api.getDuplicates();
      setDuplicates(res.candidates);
      setAnalysisMeta(res);
    } catch (err) {
      console.error('Failed to load duplicate candidates', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDuplicates();
  }, []);

  const handleRunAnalysis = async () => {
    try {
      setAnalyzing(true);
      const res = await api.analyzeDuplicates();
      setDuplicates(res.candidates);
      setAnalysisMeta(res);
    } catch (err) {
      console.error('Failed to run duplicate analysis', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const totalFlaggedAmount = analysisMeta?.total_flagged_amount || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span>Duplicate Debit Auditor</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E8FF1F]/10 border border-[#E8FF1F]/30 text-[#E8FF1F] uppercase font-bold">
              Time-Window Distance Model
            </span>
          </h1>
          <p className="text-xs text-white/50 font-mono mt-0.5">
            Detects suspected duplicate debit captures and double-billing errors within rolling settlement windows
          </p>
        </div>

        <button
          onClick={handleRunAnalysis}
          disabled={analyzing}
          className="px-4 py-2 rounded-xl bg-[#E8FF1F] text-black font-extrabold text-xs flex items-center gap-2 hover:bg-[#d4eb17] transition-all disabled:opacity-50 shadow-bento w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} />
          <span>{analyzing ? 'Scanning Windows...' : 'Re-Scan Ledger Duplicates'}</span>
        </button>
      </div>

      {/* Bento KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <BentoCard glow={duplicates.length > 0}>
          <BentoMetric
            label="Duplicate Pairs Flagged"
            value={`${duplicates.length} Suspected Pair${duplicates.length === 1 ? '' : 's'}`}
            subtext="Within 72-hour settlement gap"
            accentColor="copper"
            isCurrency={false}
            badge={duplicates.length > 0 ? 'Review Needed' : 'Clean'}
          />
        </BentoCard>

        <BentoCard>
          <BentoMetric
            label="Total At-Risk Capital"
            value={totalFlaggedAmount}
            subtext="Potential double-debit capture"
            accentColor="pink"
          />
        </BentoCard>

        <BentoCard>
          <BentoMetric
            label="Matching Criteria"
            value="3 Parameters"
            subtext="Identical Amount + Merchant + Time Window"
            accentColor="lime"
            isCurrency={false}
          />
        </BentoCard>
      </div>

      {/* Advisory Note */}
      <BentoCard className="p-4 bg-white/[0.02] border-white/[0.06]">
        <div className="flex items-start gap-3 text-xs text-white/70 leading-relaxed">
          <Info className="w-4 h-4 text-[#E8FF1F] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-white">How Duplicate Detection Works: </span>
            The algorithm flags transactions sharing the same normalized merchant descriptor and identical amounts occurring within a small timestamp delta (usually 0 to 3 days). 
            Review your physical invoice or merchant statement before disputing charges with your bank.
          </div>
        </div>
      </BentoCard>

      {/* Duplicate Pairs List */}
      {loading ? (
        <div className="py-24 text-center text-white/40">
          <RefreshCw className="w-8 h-8 animate-spin text-[#E8FF1F] mx-auto mb-3" />
          <p className="text-xs font-mono">Evaluating transaction similarity matrices...</p>
        </div>
      ) : duplicates.length === 0 ? (
        <BentoCard className="py-24 text-center text-white/40 font-mono text-xs">
          <CheckCircle2 className="w-8 h-8 text-[#58B58C] mx-auto mb-2" />
          <p className="text-sm font-bold text-white">No Duplicate Debits Detected</p>
          <p className="text-xs text-white/40 mt-1">All debit occurrences across your ledger exhibit unique settlement patterns.</p>
        </BentoCard>
      ) : (
        <div className="space-y-4">
          {duplicates.map((pair, idx) => (
            <BentoCard key={idx} className="p-6 border-[#FFB37A]/30">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                {/* Left: Summary */}
                <div className="space-y-1.5 max-w-md">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FFB37A]/15 text-[#FFB37A] border border-[#FFB37A]/30">
                      Duplicate Match
                    </span>
                    <span className="text-xs font-mono text-white/40">
                      Settlement Gap: {pair.day_difference} day(s)
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-white">{pair.merchant}</h3>
                  <p className="text-xs text-white/60 leading-relaxed">{pair.similarity_reason}</p>
                </div>

                {/* Right: Side-by-Side Transaction Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                  {/* First Transaction */}
                  <div className="p-3.5 rounded-2xl bg-[#0B0B0D] border border-white/[0.08]">
                    <div className="text-[10px] font-mono text-white/40 uppercase mb-1">
                      Occurrence #1
                    </div>
                    <div className="text-sm font-black font-mono text-white">
                      {formatINR(pair.transaction_1.amount)}
                    </div>
                    <p className="text-xs text-white/80 font-medium truncate mt-1">
                      {pair.transaction_1.description}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-white/40 font-mono mt-2 pt-2 border-t border-white/[0.06]">
                      <span>{pair.transaction_1.transaction_date}</span>
                      <span>{pair.transaction_1.payment_method || 'UPI'}</span>
                    </div>
                  </div>

                  {/* Second Transaction */}
                  <div className="p-3.5 rounded-2xl bg-[#0B0B0D] border border-white/[0.08] relative">
                    <div className="text-[10px] font-mono text-amber-400 uppercase mb-1 flex items-center justify-between">
                      <span>Occurrence #2</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                        Suspected Duplicate
                      </span>
                    </div>
                    <div className="text-sm font-black font-mono text-white">
                      {formatINR(pair.transaction_2.amount)}
                    </div>
                    <p className="text-xs text-white/80 font-medium truncate mt-1">
                      {pair.transaction_2.description}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-white/40 font-mono mt-2 pt-2 border-t border-white/[0.06]">
                      <span>{pair.transaction_2.transaction_date}</span>
                      <span>{pair.transaction_2.payment_method || 'UPI'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </BentoCard>
          ))}
        </div>
      )}
    </div>
  );
};

