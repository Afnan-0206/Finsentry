import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Calendar,
  Wallet,
  AlertCircle,
  RefreshCw,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import { api } from '@/services/api';
import type { ForecastResponse } from '@/types';
import { cn, formatINR } from '@/lib/utils';
import { BentoCard, BentoMetric } from '@/components/ui/finance-bento';

export const ForecastingPage: React.FC = () => {
  const [horizon, setHorizon] = useState<7 | 30>(30);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchForecast = async () => {
    try {
      setLoading(true);
      const res = horizon === 7 ? await api.get7DayForecast() : await api.get30DayForecast();
      setForecast(res);
    } catch (err) {
      console.error('Failed to load forecast', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, [horizon]);

  const chartData = React.useMemo(() => {
    if (!forecast?.daily_projections) return [];
    let runningBalance = 0;
    return forecast.daily_projections.map((p) => {
      runningBalance += p.expected_net;
      return {
        ...p,
        cumulative_balance: runningBalance,
      };
    });
  }, [forecast]);

  const upcomingCommitments = React.useMemo(() => {
    if (!forecast?.daily_projections) return [];
    return forecast.daily_projections.flatMap((p) =>
      p.notes
        .filter((n) => n.startsWith('Subscription renewal:'))
        .map((n) => {
          const match = n.match(/Subscription renewal:\s*(.*?)\s*\(₹([\d,.]+)\)/);
          return {
            date: p.date,
            merchant: match ? match[1] : n.replace('Subscription renewal:', '').trim(),
            amount: match ? parseFloat(match[2].replace(/,/g, '')) : 0,
          };
        })
    );
  }, [forecast]);

  return (
    <div className="space-y-6">
      {/* Header and Horizon Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span>Cash-Flow Forecasting</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E8FF1F]/10 border border-[#E8FF1F]/30 text-[#E8FF1F] uppercase font-bold">
              Predictive Cash Engine
            </span>
          </h1>
          <p className="text-xs text-white/50 font-mono mt-0.5">
            Historical cadence modeling, recurrence projection & forward liquidity planning
          </p>
        </div>

        {/* Horizon Pill Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#101012] border border-white/[0.08] w-fit">
          <button
            onClick={() => setHorizon(7)}
            className={cn(
              'px-4 py-1.5 rounded-xl text-xs font-bold font-mono transition-all',
              horizon === 7
                ? 'bg-[#E8FF1F] text-black shadow-bento'
                : 'text-white/60 hover:text-white'
            )}
          >
            7-Day Forward
          </button>
          <button
            onClick={() => setHorizon(30)}
            className={cn(
              'px-4 py-1.5 rounded-xl text-xs font-bold font-mono transition-all',
              horizon === 30
                ? 'bg-[#E8FF1F] text-black shadow-bento'
                : 'text-white/60 hover:text-white'
            )}
          >
            30-Day Outlook
          </button>
        </div>
      </div>

      {loading && !forecast ? (
        <div className="py-24 text-center text-white/40">
          <RefreshCw className="w-8 h-8 animate-spin text-[#E8FF1F] mx-auto mb-3" />
          <p className="text-xs font-mono">Running forward cash-flow projection models...</p>
        </div>
      ) : forecast ? (
        <>
          {/* Bento KPI Summary Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <BentoCard>
              <BentoMetric
                label="Projected Inflows"
                value={forecast.projected_total_income}
                subtext={`Expected across ${horizon} days`}
                accentColor="green"
                badge="Inflows"
              />
            </BentoCard>

            <BentoCard>
              <BentoMetric
                label="Projected Outflows"
                value={forecast.projected_total_expenses}
                subtext="Living baseline + subscriptions"
                accentColor="pink"
                badge="Outflows"
              />
            </BentoCard>

            <BentoCard glow={forecast.projected_net_savings > 0}>
              <BentoMetric
                label="Expected Surplus"
                value={forecast.projected_net_savings}
                subtext="Unallocated cash margin"
                accentColor="lime"
                badge="Net Surplus"
              />
            </BentoCard>

            <BentoCard>
              <BentoMetric
                label="Locked Subscriptions"
                value={forecast.upcoming_subscriptions_cost}
                subtext="Contractual recurring renewals"
                accentColor="copper"
                badge="Committed"
              />
            </BentoCard>
          </div>

          {/* Forward Day-by-Day Projection Chart */}
          <BentoCard className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-base font-extrabold text-white">
                  Forward Liquidity Trajectory ({horizon}-Day Envelope)
                </h3>
                <p className="text-xs text-white/40 font-mono">
                  Dashed line shows expected cumulative cash balance
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-[#58B58C]">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#58B58C]" /> Inflow
                </span>
                <span className="flex items-center gap-1.5 text-[#FF6AA8]">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#FF6AA8]" /> Outflow
                </span>
                <span className="flex items-center gap-1.5 text-[#E8FF1F]">
                  <span className="w-2 h-0.5 border-t-2 border-dashed border-[#E8FF1F]" /> Net Trajectory
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="rgba(255,255,255,0.3)"
                    fontSize={10}
                    tickLine={false}
                    fontFamily="JetBrains Mono"
                    tickFormatter={(d) => d.slice(5)}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.3)"
                    fontSize={10}
                    tickLine={false}
                    fontFamily="JetBrains Mono"
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-[#151518] border border-white/10 p-3 rounded-xl text-xs font-mono shadow-2xl">
                            <span className="text-white/40 block text-[10px] mb-1">{d.date}</span>
                            <div className="text-[#58B58C] font-bold">Inflow: {formatINR(d.projected_income)}</div>
                            <div className="text-[#FF6AA8] font-bold">Outflow: {formatINR(d.projected_expenses)}</div>
                            <div className="text-[#E8FF1F] font-bold mt-1 pt-1 border-t border-white/10">
                              Net: {formatINR(d.expected_net)}
                            </div>
                            <div className="text-white/60 text-[10px] mt-0.5 font-mono">
                              Cumulative Margin: {formatINR(d.cumulative_balance)}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="projected_income" fill="#58B58C" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="projected_expenses" fill="#FF6AA8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </BentoCard>

          {/* Upcoming Fixed Obligations Breakdown */}
          <BentoCard className="p-6">
            <h3 className="text-base font-extrabold text-white mb-1">
              Upcoming Fixed Obligations In This Period
            </h3>
            <p className="text-xs text-white/40 font-mono mb-4">
              Contractual payments detected by recurrence frequency models
            </p>

            {upcomingCommitments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {upcomingCommitments.map((c, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{c.merchant}</div>
                      <div className="text-[10px] text-white/40 font-mono">Date: {c.date}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold font-mono text-[#E8FF1F]">
                        {formatINR(c.amount)}
                      </div>
                      <div className="text-[9px] text-white/40 uppercase font-mono">Auto-Debit</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-mono text-white/30">
                No fixed subscriptions falling in this specific window.
              </p>
            )}
          </BentoCard>
        </>
      ) : null}
    </div>
  );
};

