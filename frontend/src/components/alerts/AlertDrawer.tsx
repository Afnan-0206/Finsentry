import React, { useState } from 'react';
import { X, Check, Trash2, AlertTriangle, Info, AlertOctagon, Bell } from 'lucide-react';
import type { Alert } from '../../types';
import { api } from '../../services/api';

interface AlertDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: Alert[];
  onAlertUpdated: () => void;
}

export const AlertDrawer: React.FC<AlertDrawerProps> = ({
  isOpen,
  onClose,
  alerts,
  onAlertUpdated,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('All');

  if (!isOpen) return null;

  const handleMarkRead = async (id: number) => {
    try {
      await api.updateAlert(id, { is_read: true });
      onAlertUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDismiss = async (id: number) => {
    try {
      await api.updateAlert(id, { is_dismissed: true });
      onAlertUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = alerts.filter((a) => {
    if (filterSeverity === 'All') return true;
    return a.severity.toLowerCase() === filterSeverity.toLowerCase();
  });

  const getSeverityBadge = (sev: string) => {
    switch (sev.toLowerCase()) {
      case 'high':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono">
            <AlertOctagon className="w-3 h-3" /> High Risk
          </span>
        );
      case 'warning':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFB37A]/10 text-[#FFB37A] border border-[#FFB37A]/20 font-mono">
            <AlertTriangle className="w-3 h-3" /> Warning
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
            <Info className="w-3 h-3" /> Info
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-[#0F0F12] border-l border-white/[0.08] shadow-2xl flex flex-col h-full z-10 text-white">
        {/* Header */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-[#141418]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-white">
              <Bell className="w-4 h-4 text-[#E8FF1F]" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">Financial Risk Alerts</h3>
              <p className="text-[11px] text-white/40 font-mono">
                {alerts.filter((a) => !a.is_read).length} unread warnings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-3 border-b border-white/[0.06] flex items-center gap-1.5 bg-[#0B0B0D] overflow-x-auto">
          {['All', 'High', 'Warning', 'Info'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterSeverity(s)}
              className={`px-3 py-1 rounded-full text-xs font-semibold font-mono transition-all ${
                filterSeverity === s
                  ? 'bg-[#E8FF1F] text-black font-bold shadow-sm'
                  : 'bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Alert List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-white/30 text-xs font-mono">
              No alerts matching the selected filter.
            </div>
          ) : (
            filtered.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-2xl border transition-all ${
                  alert.is_read
                    ? 'bg-white/[0.02] border-white/[0.06] text-white/60'
                    : 'bg-gradient-to-b from-[#18181D] to-[#121215] border-white/[0.12] text-white shadow-bento'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getSeverityBadge(alert.severity)}
                    <span className="text-[10px] text-white/40 font-mono">
                      {new Date(alert.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {!alert.is_read && (
                      <button
                        onClick={() => handleMarkRead(alert.id)}
                        className="p-1 rounded text-white/40 hover:text-[#58B58C] transition-colors"
                        title="Mark as read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDismiss(alert.id)}
                      className="p-1 rounded text-white/40 hover:text-rose-400 transition-colors"
                      title="Dismiss alert"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="font-bold text-sm text-white mt-2 mb-1">{alert.title}</h4>
                <p className="text-xs text-white/60 leading-relaxed">{alert.description}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
