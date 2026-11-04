import React, { useState, useEffect } from 'react';
import {
  Bell,
  AlertTriangle,
  AlertOctagon,
  Info,
  CheckCircle2,
  Trash2,
  Check,
  RefreshCw,
  Filter,
} from 'lucide-react';
import { api } from '@/services/api';
import type { Alert } from '@/types';
import { cn } from '@/lib/utils';
import { BentoCard, BentoMetric } from '@/components/ui/finance-bento';

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const data = await api.getAlerts({ limit: 200 });
      setAlerts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load alerts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleMarkRead = async (id: number) => {
    try {
      await api.updateAlert(id, { is_read: true });
      fetchAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDismiss = async (id: number) => {
    try {
      await api.updateAlert(id, { is_dismissed: true });
      fetchAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  const highRiskCount = alerts.filter((a) => a.severity.toLowerCase() === 'high').length;
  const unreadCount = alerts.filter((a) => !a.is_read && !a.is_dismissed).length;

  const filtered = alerts.filter((a) => {
    if (filterSeverity === 'unread') return !a.is_read && !a.is_dismissed;
    if (filterSeverity === 'high') return a.severity.toLowerCase() === 'high';
    if (filterSeverity === 'warning') return a.severity.toLowerCase() === 'warning';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span>Risk Alert Center</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E8FF1F]/10 border border-[#E8FF1F]/30 text-[#E8FF1F] uppercase font-bold">
              Autonomous Early-Warning
            </span>
          </h1>
          <p className="text-xs text-white/50 font-mono mt-0.5">
            Real-time warnings triggered by statistical variance, price creep & payment discrepancies
          </p>
        </div>

        <button
          onClick={fetchAlerts}
          className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/80 hover:text-white border border-white/[0.08] text-xs font-semibold flex items-center gap-1.5 transition-all font-mono w-fit"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Bento KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <BentoCard glow={unreadCount > 0}>
          <BentoMetric
            label="Unread Risk Warnings"
            value={`${unreadCount} Unread`}
            subtext="Awaiting user audit"
            accentColor={unreadCount > 0 ? 'pink' : 'green'}
            isCurrency={false}
            badge={unreadCount > 0 ? 'Pending' : 'All Clear'}
          />
        </BentoCard>

        <BentoCard>
          <BentoMetric
            label="High Severity Events"
            value={`${highRiskCount} Flagged`}
            subtext="Critical financial discrepancies"
            accentColor="copper"
            isCurrency={false}
          />
        </BentoCard>

        <BentoCard>
          <BentoMetric
            label="Total Monitored Events"
            value={`${alerts.length} Logged`}
            subtext="Lifetime alert history"
            accentColor="lime"
            isCurrency={false}
          />
        </BentoCard>
      </div>

      {/* Filter Chips Bar */}
      <BentoCard className="p-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'all', label: `All Alerts (${alerts.length})` },
            { id: 'unread', label: `Unread Only (${unreadCount})` },
            { id: 'high', label: `High Risk (${highRiskCount})` },
            { id: 'warning', label: 'Warnings' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterSeverity(tab.id)}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-xs font-semibold font-mono whitespace-nowrap transition-all',
                filterSeverity === tab.id
                  ? 'bg-[#E8FF1F] text-black font-bold shadow-bento'
                  : 'bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </BentoCard>

      {/* Alerts Feed */}
      {loading ? (
        <div className="py-24 text-center text-white/40">
          <RefreshCw className="w-8 h-8 animate-spin text-[#E8FF1F] mx-auto mb-3" />
          <p className="text-xs font-mono">Loading financial alerts...</p>
        </div>
      ) : filtered.length === 0 ? (
        <BentoCard className="py-20 text-center text-white/30 font-mono text-xs">
          No alerts found for the selected filter.
        </BentoCard>
      ) : (
        <div className="space-y-3.5">
          {filtered.map((alert) => {
            const isHigh = alert.severity.toLowerCase() === 'high';
            const isWarning = alert.severity.toLowerCase() === 'warning';

            return (
              <BentoCard
                key={alert.id}
                className={cn(
                  'p-5 transition-all',
                  !alert.is_read && 'border-white/[0.14] bg-gradient-to-b from-[#18181D] to-[#121215]',
                  isHigh && !alert.is_read && 'border-rose-500/30 ring-1 ring-rose-500/20'
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={cn(
                        'w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0',
                        isHigh
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : isWarning
                          ? 'bg-[#FFB37A]/15 text-[#FFB37A] border border-[#FFB37A]/30'
                          : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                      )}
                    >
                      {isHigh ? (
                        <AlertOctagon className="w-4 h-4" />
                      ) : isWarning ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : (
                        <Info className="w-4 h-4" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border',
                            isHigh
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : isWarning
                              ? 'bg-[#FFB37A]/10 text-[#FFB37A] border-[#FFB37A]/20'
                              : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                          )}
                        >
                          {alert.severity}
                        </span>
                        <span className="text-[10px] text-white/40 font-mono">
                          {new Date(alert.created_at).toLocaleDateString()}
                        </span>
                        {!alert.is_read && (
                          <span className="px-1.5 py-0.2 rounded bg-[#E8FF1F]/10 text-[#E8FF1F] text-[9px] font-mono font-bold border border-[#E8FF1F]/20">
                            Unread
                          </span>
                        )}
                      </div>

                      <h3 className="font-extrabold text-sm text-white">{alert.title}</h3>
                      <p className="text-xs text-white/70 leading-relaxed">{alert.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.06] justify-end">
                    {!alert.is_read && (
                      <button
                        onClick={() => handleMarkRead(alert.id)}
                        className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white transition-all text-xs flex items-center gap-1 font-mono"
                        title="Mark as read"
                      >
                        <Check className="w-3.5 h-3.5 text-[#58B58C]" />
                        <span>Read</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleDismiss(alert.id)}
                      className="p-2 rounded-xl bg-white/[0.04] hover:bg-rose-500/10 text-white/40 hover:text-rose-400 transition-all"
                      title="Dismiss alert"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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

