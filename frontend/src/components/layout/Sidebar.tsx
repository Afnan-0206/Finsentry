import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  Repeat,
  ShieldAlert,
  Copy,
  TrendingUp,
  Lightbulb,
  Bot,
  Bell,
  Settings,
  ShieldCheck,
  X,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  unreadAlertsCount?: number;
  onCloseMobile?: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  unreadAlertsCount = 0,
  onCloseMobile,
  className,
}) => {
  const navSections = [
    {
      title: 'OVERVIEW',
      items: [
        { name: 'Overview', path: '/', icon: LayoutDashboard },
      ],
    },
    {
      title: 'FINANCIAL INTELLIGENCE',
      items: [
        { name: 'Transactions', path: '/transactions', icon: Receipt },
        { name: 'Subscriptions', path: '/subscriptions', icon: Repeat },
        {
          name: 'Anomalies',
          path: '/anomalies',
          icon: ShieldAlert,
          badge: unreadAlertsCount > 0 ? `${unreadAlertsCount}` : undefined,
          badgeColor: 'rose',
        },
        { name: 'Duplicates', path: '/duplicates', icon: Copy },
      ],
    },
    {
      title: 'INSIGHTS & AI',
      items: [
        { name: 'Forecasting', path: '/forecasting', icon: TrendingUp },
        { name: 'Recommendations', path: '/recommendations', icon: Lightbulb },
        {
          name: 'AI Investigator',
          path: '/investigator',
          icon: Bot,
          badge: 'AI Copilot',
          badgeColor: 'lime',
        },
        {
          name: 'Risk Alerts',
          path: '/alerts',
          icon: Bell,
          badge: unreadAlertsCount > 0 ? `${unreadAlertsCount}` : undefined,
          badgeColor: 'rose',
        },
      ],
    },
    {
      title: 'PREFERENCES',
      items: [
        { name: 'Settings', path: '/settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        'w-64 bg-[#0A0A0C] text-white flex flex-col h-screen border-r border-white/[0.08] shrink-0 select-none transition-all duration-300 z-30',
        className
      )}
    >
      {/* Brand Header */}
      <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#E8FF1F] flex items-center justify-center text-black font-extrabold shadow-bento">
            <ShieldCheck className="w-5 h-5 text-black stroke-[2.5]" />
          </div>
          <div>
            <div className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
              <span>FinSentry</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#E8FF1F]/10 border border-[#E8FF1F]/30 text-[#E8FF1F] uppercase font-bold">
                AI
              </span>
            </div>
            <p className="text-[10px] text-white/40 font-mono tracking-wider uppercase">
              Financial Intelligence
            </p>
          </div>
        </div>

        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 p-3 space-y-5 overflow-y-auto">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold tracking-widest text-white/30 uppercase font-mono">
              {section.title}
            </div>
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200',
                      isActive
                        ? 'bg-gradient-to-r from-[#E8FF1F]/15 to-transparent text-[#E8FF1F] border border-[#E8FF1F]/30 shadow-sm'
                        : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                    )
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                    <span>{item.name}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.badge && (
                      <span
                        className={cn(
                          'text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold border',
                          item.badgeColor === 'lime'
                            ? 'bg-[#E8FF1F]/10 text-[#E8FF1F] border-[#E8FF1F]/30'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User / Workspace Footer */}
      <div className="p-4 border-t border-white/[0.06] bg-[#070709] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#E8FF1F] to-[#58B58C] flex items-center justify-center text-black font-extrabold text-xs">
            FS
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-white truncate">FinSentry Primary</p>
            <p className="text-[10px] text-white/40 font-mono">INR Ledger • 337 txns</p>
          </div>
        </div>
        <div className="w-2 h-2 rounded-full bg-[#58B58C] animate-pulse" title="Ledger Synchronized" />
      </div>
    </aside>
  );
};
