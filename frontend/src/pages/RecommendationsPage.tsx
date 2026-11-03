import React, { useState, useEffect } from 'react';
import {
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Check,
  X,
  ShieldCheck,
} from 'lucide-react';
import { api } from '@/services/api';
import type { Recommendation } from '@/types';
import { cn, formatINR } from '@/lib/utils';
import { BentoCard, BentoMetric } from '@/components/ui/finance-bento';

export const RecommendationsPage: React.FC = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const data = await api.getRecommendations();
      setRecommendations(data);
    } catch (err) {
      console.error('Failed to load recommendations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await api.updateRecommendationStatus(id, status);
      fetchRecommendations();
    } catch (err) {
      console.error('Failed to update recommendation status', err);
    }
  };

  const totalPotentialSavings = recommendations
    .filter((r) => r.status === 'active')
    .reduce((acc, r) => acc + r.estimated_impact, 0);

  const highPriorityCount = recommendations.filter((r) => r.priority === 'high').length;

  const filtered = recommendations.filter((r) => {
    if (priorityFilter === 'high') return r.priority === 'high';
    if (priorityFilter === 'medium') return r.priority === 'medium';
    if (priorityFilter === 'low') return r.priority === 'low';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span>Financial Recommendations</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E8FF1F]/10 border border-[#E8FF1F]/30 text-[#E8FF1F] uppercase font-bold">
              Autonomous Optimization
            </span>
          </h1>
          <p className="text-xs text-white/50 font-mono mt-0.5">
            Actionable cash conservation steps grounded in your verified category baselines
          </p>
        </div>
      </div>

      {/* Bento KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <BentoCard glow>
          <BentoMetric
            label="Recoverable Annual Capital"
            value={totalPotentialSavings}
            subtext="Identified by recommendation engine"
            accentColor="lime"
            badge="Recoverable"
          />
        </BentoCard>

        <BentoCard>
          <BentoMetric
            label="High Priority Actions"
            value={`${highPriorityCount} Actions`}
            subtext="Immediate cash flow impact"
            accentColor="copper"
            isCurrency={false}
            badge="Urgent"
          />
        </BentoCard>

        <BentoCard>
          <BentoMetric
            label="Audit Basis"
            value="100% Deterministic"
            subtext="Strictly verified against SQLite transactions"
            accentColor="green"
            isCurrency={false}
          />
        </BentoCard>
      </div>

      {/* Priority Filter Chips */}
      <BentoCard className="p-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'all', label: `All Actions (${recommendations.length})` },
            { id: 'high', label: `High Priority (${highPriorityCount})` },
            { id: 'medium', label: 'Medium Priority' },
            { id: 'low', label: 'Low Priority' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPriorityFilter(tab.id)}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-xs font-semibold font-mono whitespace-nowrap transition-all',
                priorityFilter === tab.id
                  ? 'bg-[#E8FF1F] text-black font-bold shadow-bento'
                  : 'bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </BentoCard>

      {/* Recommendations Cards */}
      {loading ? (
        <div className="py-24 text-center text-white/40">
          <RefreshCw className="w-8 h-8 animate-spin text-[#E8FF1F] mx-auto mb-3" />
          <p className="text-xs font-mono">Synthesizing personal financial recommendations...</p>
        </div>
      ) : filtered.length === 0 ? (
        <BentoCard className="py-20 text-center text-white/30 font-mono text-xs">
          No recommendations match the selected priority level.
        </BentoCard>
      ) : (
        <div className="space-y-4">
          {filtered.map((rec) => {
            const isHigh = rec.priority === 'high';
            const isImplemented = rec.status === 'implemented';

            return (
              <BentoCard
                key={rec.id}
                className={cn(
                  'p-6 transition-all',
                  isImplemented && 'opacity-60 bg-white/[0.01]'
                )}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Left: Info */}
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={cn(
                          'px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border uppercase',
                          isHigh
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : 'bg-[#FFB37A]/10 text-[#FFB37A] border-[#FFB37A]/20'
                        )}
                      >
                        {rec.priority} Priority
                      </span>
                      {rec.related_category && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-white/50 border border-white/[0.06]">
                          {rec.related_category}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-extrabold text-white">{rec.title}</h3>
                    <p className="text-xs text-white/70 leading-relaxed">{rec.description}</p>
                  </div>

                  {/* Right: Impact & Actions */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/[0.06]">
                    <div className="text-left sm:text-right">
                      <span className="text-xs text-white/40 font-mono block">Estimated Annual Impact</span>
                      <span className="text-xl font-black font-mono text-[#E8FF1F]">
                        +{formatINR(rec.estimated_impact)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isImplemented ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#58B58C]/15 text-[#58B58C] text-xs font-mono font-bold border border-[#58B58C]/30">
                          <Check className="w-3.5 h-3.5" />
                          Implemented
                        </span>
                      ) : (
                        <button
                          onClick={() => handleUpdateStatus(rec.id, 'implemented')}
                          className="px-4 py-2 rounded-xl bg-[#E8FF1F] hover:bg-[#d4eb17] text-black text-xs font-extrabold transition-all shadow-bento flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Mark Done</span>
                        </button>
                      )}
                    </div>
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

