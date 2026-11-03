import React, { useState } from 'react';
import {
  Bell,
  Menu,
  ShieldAlert,
  Cpu,
  Sparkles,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../services/api';

interface TopNavbarProps {
  title: string;
  unreadAlertsCount: number;
  onOpenAlerts: () => void;
  onOpenMobileSidebar?: () => void;
  onDataReset?: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  title,
  unreadAlertsCount,
  onOpenAlerts,
  onOpenMobileSidebar,
  onDataReset,
}) => {
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleResetDemo = async () => {
    if (confirm('Reset FinSentry database with fresh 6-month demonstration transactions?')) {
      try {
        setResetting(true);
        await api.resetDemoData();
        setResetSuccess(true);
        setTimeout(() => setResetSuccess(false), 3000);
        if (onDataReset) onDataReset();
      } catch (err) {
        console.error('Failed to reset demo data', err);
        alert('Failed to reset demo data.');
      } finally {
        setResetting(false);
      }
    }
  };

  const todayStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <header className="h-16 bg-[#070709] border-b border-white/[0.08] px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-20 select-none">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        {onOpenMobileSidebar && (
          <button
            onClick={onOpenMobileSidebar}
            className="md:hidden p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>{title}</span>
          </h2>
          <p className="text-[10px] text-white/40 font-mono hidden sm:block">
            {todayStr} • Verified SQLite Ledger • Zero Hallucinations
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Currency Identifier */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-mono font-bold text-white/70">
          <span className="text-[#E8FF1F]">₹</span>
          <span>INR</span>
        </div>

        {/* AI Engine Status Pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8FF1F]/[0.08] border border-[#E8FF1F]/20 text-[11px] font-mono font-medium text-[#E8FF1F]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E8FF1F] animate-pulse" />
          <Cpu className="w-3 h-3 text-[#E8FF1F]" />
          <span>Local Qwen 2.5</span>
        </div>

        {/* Notification Bell */}
        <button
          onClick={onOpenAlerts}
          className="relative p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors"
          title="Risk Alerts & Notifications"
          aria-label="Alerts"
        >
          <Bell className="w-4 h-4" />
          {unreadAlertsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse ring-2 ring-[#070709]" />
          )}
        </button>

        {/* Reset Demo Data Pill */}
        <button
          onClick={handleResetDemo}
          disabled={resetting}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold font-mono bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white border border-white/[0.08] transition-all disabled:opacity-40"
          title="Refresh demonstration ledger"
        >
          {resetSuccess ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#58B58C]" />
              <span className="text-[#58B58C] hidden sm:inline">Refreshed</span>
            </>
          ) : (
            <>
              <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Re-Seed</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
