import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Brain,
  Sparkles,
  AlertOctagon,
  AlertTriangle,
  RefreshCw,
  HelpCircle,
  Copy,
  ExternalLink,
  Info,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { api } from '@/services/api';
import type { AnomalyItem, AnomalyAnalysisResponse } from '@/types';
import { cn, formatINR } from '@/lib/utils';
import { BentoCard, BentoMetric } from '@/components/ui/finance-bento';

export const AnomaliesPage: React.FC = () => {
  const [anomalies, setAnomalies] = useState<AnomalyItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analysisMeta, setAnalysisMeta] = useState<AnomalyAnalysisResponse | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const fetchData = async () => {
    try {
      setLoading(true);
      const anomData = await api.getAnomalies();
      setAnomalies(Array.isArray(anomData) ? anomData : []);
    } catch (err) {
      console.error('Failed to load anomaly data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRetrainModel = async () => {
    try {
      setAnalyzing(true);
      const res = await api.analyzeAnomalies();
      setAnalysisMeta(res);
      if (Array.isArray(res?.anomalies)) {
        setAnomalies(res.anomalies);
      }
    } catch (err) {
      console.error('Failed to run anomaly analysis', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const highRiskCount = anomalies.filter((a) => a.risk_level.toLowerCase() === 'high').length;
  const mediumRiskCount = anomalies.filter((a) => a.risk_level.toLowerCase() === 'medium').length;

  const filtered = anomalies.filter((a) => {
    if (severityFilter === 'high') return a.risk_level.toLowerCase() === 'high';
    if (severityFilter === 'medium') return a.risk_level.toLowerCase() === 'medium';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span>ML Anomaly Detection</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E8FF1F]/10 border border-[#E8FF1F]/30 text-[#E8FF1F] uppercase font-bold">
              Isolation Forest
            </span>
          </h1>
          <p className="text-xs text-white/50 font-mono mt-0.5">
            Unsupervised decision trees isolating statistical outliers from personal category baselines
          </p>
        </div>

        <button
          onClick={handleRetrainModel}
          disabled={analyzing}
          className="px-4 py-2 rounded-xl bg-[#E8FF1F] text-black font-extrabold text-xs flex items-center gap-2 hover:bg-[#d4eb17] transition-all disabled:opacity-50 shadow-bento w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} />
          <span>{analyzing ? 'Evaluating Forest...' : 'Retrain & Scan Ledger'}</span>
        </button>
      </div>

      {/* Model Feedback Alert Banner */}
      {analysisMeta && (
        <BentoCard className="p-4 bg-[#151518] border-[#E8FF1F]/30" glow>
          <div className="flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 font-bold text-white">
              <Brain className="w-4 h-4 text-[#E8FF1F]" />
              <span>{analysisMeta.message}</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-[#E8FF1F] border border-[#E8FF1F]/30">
              Contamination: {analysisMeta.contamination}
            </span>
          </div>
        </BentoCard>
      )}

      {/* Bento Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <BentoCard>
          <BentoMetric
            label="Total Flagged Outliers"
            value={`${anomalies.length} Transactions`}
            subtext="Identified by ML ensemble"
            accentColor="copper"
            isCurrency={false}
          />
        </BentoCard>

        <BentoCard glow={highRiskCount > 0}>
          <BentoMetric
            label="High Severity Outliers"
            value={`${highRiskCount} Transactions`}
            subtext="Severe deviation (>3.0 Z-score)"
            accentColor="pink"
            isCurrency={false}
            badge={highRiskCount > 0 ? 'Urgent' : 'Clear'}
          />
        </BentoCard>

        <BentoCard>
          <BentoMetric
            label="Feature Dimensions"
            value="3 Evaluated"
            subtext="Amount Z-Score, Category Mean, Frequency"
            accentColor="lime"
            isCurrency={false}
          />
        </BentoCard>
      </div>

      {/* Statistical Guidance Card */}
      <BentoCard className="p-4 bg-white/[0.02] border-white/[0.06]">
        <div className="flex items-start gap-3 text-xs text-white/70 leading-relaxed">
          <Info className="w-4 h-4 text-[#E8FF1F] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-white">Understanding Statistical Anomalies: </span>
            Isolation Forest isolates observations by randomly selecting a feature and splitting value. 
            Anomalous transactions (like a rare electronics purchase) have shorter tree path lengths. 
            <strong> An outlier is not automatically fraudulent</strong>; it represents mathematical divergence from your typical spending habits.
          </div>
        </div>
      </BentoCard>

      {/* Filter Chips Bar */}
      <BentoCard className="p-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'all', label: `All Outliers (${anomalies.length})` },
            { id: 'high', label: `High Risk (${highRiskCount})` },
            { id: 'medium', label: `Medium Risk (${mediumRiskCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSeverityFilter(tab.id)}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-xs font-semibold font-mono whitespace-nowrap transition-all',
                severityFilter === tab.id
                  ? 'bg-[#E8FF1F] text-black font-bold shadow-bento'
                  : 'bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </BentoCard>

      {/* Anomalies List */}
      {loading ? (
        <div className="py-24 text-center text-white/40">
          <RefreshCw className="w-8 h-8 animate-spin text-[#E8FF1F] mx-auto mb-3" />
          <p className="text-xs font-mono">Running Isolation Forest scoring across ledger...</p>
        </div>
      ) : filtered.length === 0 ? (
        <BentoCard className="py-20 text-center text-white/30 font-mono text-xs">
          No transactions match the selected anomaly criteria.
        </BentoCard>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => {
            const isHigh = item.risk_level.toLowerCase() === 'high';

            return (
              <BentoCard
                key={item.transaction_id}
                className={cn(
                  'p-5 transition-all',
                  isHigh && 'border-rose-500/30 ring-1 ring-rose-500/20'
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-2xl flex items-center justify-center font-black font-mono text-sm shrink-0',
                        isHigh
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : 'bg-[#FFB37A]/15 text-[#FFB37A] border border-[#FFB37A]/30'
                      )}
                    >
                      {item.merchant ? item.merchant.slice(0, 1).toUpperCase() : '!'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-sm text-white">
                          {item.merchant || 'Unknown Merchant'}
                        </h3>
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border',
                            isHigh
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          )}
                        >
                          {item.risk_level} Risk
                        </span>
                        <span className="text-[10px] font-mono text-white/40 px-2 py-0.5 rounded bg-white/[0.04]">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs text-white/70 mt-1 leading-relaxed">{item.reason}</p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.06]">
                    <div className="text-lg font-black font-mono text-white">
                      {formatINR(item.amount)}
                    </div>
                    <span className="text-[10px] text-white/40 font-mono block">
                      {item.transaction_date}
                    </span>
                    {item.anomaly_score !== undefined && (
                      <span className="text-[10px] font-mono text-rose-400/80 block mt-0.5">
                        Score: {item.anomaly_score.toFixed(3)}
                      </span>
                    )}
                  </div>
                </div>
              </BentoCard>
            );
          })}
        </div>
      )}
    </div>
  );
};
