import React, { useState, useEffect } from 'react';
import {
  Repeat,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  RefreshCw,
  Clock,
  Sparkles,
  ArrowUpRight,
  Filter,
  Check,
  X,
  CreditCard,
  Zap,
} from 'lucide-react';
import { api } from '@/services/api';
import type { Subscription } from '@/types';
import { cn, formatINR } from '@/lib/utils';
import { BentoCard, BentoMetric } from '@/components/ui/finance-bento';

export const SubscriptionsPage: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [scanning, setScanning] = useState<boolean>(false);
  const [filter, setFilter] = useState<string>('all');

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const data = await api.getSubscriptions();
      setSubscriptions(data);
    } catch (err) {
      console.error('Failed to fetch subscriptions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleRunDetection = async () => {
    try {
      setScanning(true);
      const res = await api.detectSubscriptions();
      setSubscriptions(res.subscriptions);
    } catch (err) {
      console.error('Failed to detect subscriptions', err);
    } finally {
      setScanning(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await api.updateSubscription(id, { status, reviewed: true });
      fetchSubscriptions();
    } catch (err) {
      console.error('Failed to update subscription', err);
    }
  };

  const activeSubs = subscriptions.filter((s) => s.status !== 'dismissed');
  const priceHikes = subscriptions.filter((s) => s.status === 'price_increase');

  const totalMonthlyOutflow = activeSubs.reduce((acc, s) => {
    if (s.frequency === 'monthly') return acc + s.latest_amount;
    if (s.frequency === 'weekly') return acc + s.latest_amount * 4.33;
    if (s.frequency === 'quarterly') return acc + s.latest_amount / 3.0;
    if (s.frequency === 'yearly') return acc + s.latest_amount / 12.0;
    return acc + s.latest_amount;
  }, 0);

  const totalAnnualOutflow = totalMonthlyOutflow * 12;

  const filtered = subscriptions.filter((s) => {
    if (filter === 'price_increase') return s.status === 'price_increase';
    if (filter === 'possibly_unused') return s.status === 'possibly_unused';
    if (filter === 'active') return s.status === 'active';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Subscription Intelligence
          </h1>
          <p className="text-xs text-white/50 font-mono mt-0.5">
            Automatic recurrence detection, silent price hike warnings & annual burn analysis
          </p>
        </div>

        <button
          onClick={handleRunDetection}
          disabled={scanning}
          className="px-4 py-2 rounded-xl bg-[#E8FF1F] text-black font-extrabold text-xs flex items-center gap-2 hover:bg-[#d4eb17] transition-all disabled:opacity-50 shadow-bento w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
          <span>{scanning ? 'Auditing Ledger...' : 'Run Leakage Scan'}</span>
        </button>
      </div>

      {/* Bento KPI Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <BentoCard>
          <BentoMetric
            label="Monthly Outflow"
            value={totalMonthlyOutflow}
            subtext="Committed Monthly Burn"
            accentColor="pink"
            badge="Monthly"
          />
        </BentoCard>

        <BentoCard>
          <BentoMetric
            label="Annualized Outflow"
            value={totalAnnualOutflow}
            subtext="Compounded 12-Month Burden"
            accentColor="copper"
            badge="Annual"
          />
        </BentoCard>

        <BentoCard>
          <BentoMetric
            label="Active Services"
            value={`${activeSubs.length} Recurring`}
            subtext="Tracked Recurring Contracts"
            accentColor="lavender"
            isCurrency={false}
          />
        </BentoCard>

        <BentoCard glow={priceHikes.length > 0}>
          <BentoMetric
            label="Price Creep Detected"
            value={`${priceHikes.length} Hike${priceHikes.length === 1 ? '' : 's'}`}
            subtext={priceHikes.length > 0 ? 'Silent rate hikes flagged' : 'No price hikes found'}
            accentColor={priceHikes.length > 0 ? 'lime' : 'green'}
            isCurrency={false}
            badge={priceHikes.length > 0 ? 'Alert' : 'Normal'}
          />
        </BentoCard>
      </div>

      {/* Filter Chips Bar */}
      <BentoCard className="p-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'all', label: `All Tracked (${subscriptions.length})` },
            { id: 'price_increase', label: `Price Hikes (${priceHikes.length})` },
            { id: 'active', label: `Active (${activeSubs.length})` },
            { id: 'possibly_unused', label: 'Possibly Unused' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-xs font-semibold font-mono whitespace-nowrap transition-all',
                filter === tab.id
                  ? 'bg-[#E8FF1F] text-black font-bold shadow-bento'
                  : 'bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </BentoCard>

      {/* Subscriptions Grid */}
      {loading ? (
        <div className="py-24 text-center text-white/40">
          <RefreshCw className="w-8 h-8 animate-spin text-[#E8FF1F] mx-auto mb-3" />
          <p className="text-xs font-mono">Analyzing recurrence patterns in SQLite transactions...</p>
        </div>
      ) : filtered.length === 0 ? (
        <BentoCard className="py-20 text-center text-white/30 font-mono text-xs">
          No subscriptions found for the active filter.
        </BentoCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((sub) => {
            const hasHike = sub.status === 'price_increase';
            const isUnused = sub.status === 'possibly_unused';

            return (
              <BentoCard
                key={sub.id}
                className={cn(
                  'flex flex-col justify-between p-5 space-y-4',
                  hasHike && 'border-amber-500/30 ring-1 ring-amber-500/20'
                )}
              >
                {/* Top Section */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center font-black font-mono text-base text-[#E8FF1F]">
                        {sub.merchant.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-white">{sub.merchant}</h3>
                        <span className="text-[10px] text-white/40 font-mono capitalize">
                          {sub.category || 'Subscription'} • {sub.frequency}
                        </span>
                      </div>
                    </div>

                    {hasHike ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Price Hike
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#58B58C]/15 text-[#58B58C] border border-[#58B58C]/30 capitalize">
                        {sub.status}
                      </span>
                    )}
                  </div>

                  {/* Price Banner */}
                  <div className="my-3 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-baseline justify-between">
                    <div>
                      <span className="text-2xl font-black font-mono text-white">
                        {formatINR(sub.latest_amount)}
                      </span>
                      <span className="text-[11px] text-white/40 font-mono ml-1">/{sub.frequency}</span>
                    </div>

                    {sub.price_change_amount && sub.price_change_amount > 0 && (
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-amber-400">
                          +{formatINR(sub.price_change_amount)}
                        </span>
                        <span className="text-[9px] text-white/40 block font-mono">
                          Was {formatINR(sub.average_amount)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Date & Confidence */}
                  <div className="space-y-1.5 text-[11px] font-mono text-white/50 pt-1">
                    {sub.estimated_next_date && (
                      <div className="flex items-center justify-between">
                        <span>Expected Renewal:</span>
                        <span className="text-white font-semibold">{sub.estimated_next_date}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span>Model Confidence:</span>
                      <span className="text-[#E8FF1F] font-semibold">{Math.round(sub.detection_confidence * 100)}%</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleUpdateStatus(sub.id, 'dismissed')}
                    className="text-[11px] font-mono text-white/40 hover:text-rose-400 transition-colors"
                  >
                    Dismiss
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(sub.id, 'active')}
                    className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white text-[11px] font-mono font-semibold transition-all border border-white/[0.08]"
                  >
                    Confirm Active
                  </button>
                </div>
              </BentoCard>
            );
          })}
        </div>
      )}
    </div>
  );
};
