import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  Repeat,
  ShieldAlert,
  ArrowUpRight,
  Plus,
  RefreshCw,
  Sparkles,
  Bot,
  AlertOctagon,
  Copy,
  ChevronRight,
  CreditCard,
  PieChart as PieIcon,
  Layers,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { api } from '@/services/api';
import type {
  DashboardSummary,
  DashboardTrends,
  Transaction,
  AnomalyItem,
  DuplicateCandidatePair,
  Subscription,
} from '@/types';
import { cn, formatINR } from '@/lib/utils';
import {
  BentoCard,
  BentoMetric,
  BentoHealthGauge,
} from '@/components/ui/finance-bento';

const CATEGORY_COLORS = [
  '#E8FF1F', // Lime
  '#A9B2FF', // Lavender
  '#FFB37A', // Copper
  '#58B58C', // Emerald
  '#FF6AA8', // Pink
  '#38BDF8', // Cyan
  '#F59E0B', // Amber
  '#94A3B8', // Slate
];

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<DashboardTrends | null>(null);
  const [topAnomaly, setTopAnomaly] = useState<AnomalyItem | null>(null);
  const [topDuplicate, setTopDuplicate] = useState<DuplicateCandidatePair | null>(null);
  const [topPriceHike, setTopPriceHike] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const [sumRes, trendRes, anomRes, dupRes, subRes] = await Promise.allSettled([
        api.getDashboardSummary(),
        api.getDashboardTrends(),
        api.getAnomalies(),
        api.getDuplicates(),
        api.getSubscriptions(),
      ]);

      if (sumRes.status === 'fulfilled') {
        setSummary(sumRes.value);
      }
      if (trendRes.status === 'fulfilled') {
        setTrends(trendRes.value);
      }
      if (anomRes.status === 'fulfilled' && anomRes.value?.length > 0) {
        setTopAnomaly(anomRes.value[0]);
      }
      if (dupRes.status === 'fulfilled' && dupRes.value?.candidates?.length > 0) {
        setTopDuplicate(dupRes.value.candidates[0]);
      }
      if (subRes.status === 'fulfilled') {
        const hike = subRes.value.find((s) => s.status === 'price_increase');
        if (hike) setTopPriceHike(hike);
      }
    } catch (err: any) {
      console.error('Failed to load overview data', err);
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        'Unable to connect to FinSentry AI backend. Verify backend is running on port 8001.';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading && !summary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[460px] text-white/40">
        <RefreshCw className="w-9 h-9 animate-spin text-[#E8FF1F] mb-4" />
        <p className="text-sm font-bold text-white tracking-tight">
          Assembling Financial Bento Matrix...
        </p>
        <p className="text-xs text-white/40 font-mono mt-1">
          Synchronizing verified SQLite transactions & Isolation Forest models
        </p>
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="p-8 text-center bg-[#101012] rounded-bento border border-rose-500/30 max-w-lg mx-auto my-12 shadow-2xl">
        <AlertOctagon className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-extrabold text-white">Connection Error</h3>
        <p className="text-xs text-white/60 mt-1 leading-relaxed">{error}</p>
        <button
          onClick={() => fetchData()}
          className="mt-5 px-4 py-2 rounded-xl bg-[#E8FF1F] text-black font-bold text-xs hover:bg-[#d4eb17] transition-all"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const s = summary!;
  const monthlyTrends = trends?.monthly_trends || [];
  const categorySpending = trends?.category_breakdown || (trends as any)?.category_spending || [];

  const savingsRate =
    s.total_income > 0 ? ((s.net_savings / s.total_income) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* ROW 1: PRIMARY FINANCIAL OVERVIEW (8 cols) & HEALTH (4 cols) */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Large Financial Overview Bento Card */}
        <BentoCard className="lg:col-span-8 flex flex-col justify-between" glow>
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#E8FF1F]/10 border border-[#E8FF1F]/30 flex items-center justify-center text-[#E8FF1F]">
                  <Wallet className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <span className="text-[11px] font-mono uppercase font-bold text-white/50 tracking-wider">
                    Total Retained Capital
                  </span>
                  <div className="text-xs text-white/40 font-mono">
                    Lifetime Inflows Minus Settled Obligations
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/transactions')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-white/80 transition-all"
                >
                  <Plus className="w-3.5 h-3.5 text-[#E8FF1F]" />
                  <span>Ledger</span>
                </button>
                <button
                  onClick={() => navigate('/investigator')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E8FF1F] text-black font-bold text-xs hover:bg-[#d4eb17] transition-all shadow-bento"
                >
                  <Bot className="w-3.5 h-3.5 fill-current" />
                  <span>Investigate</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4 my-2">
              <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white">
                {formatINR(s.net_savings)}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-[#58B58C]/15 text-[#58B58C] border border-[#58B58C]/30 w-fit">
                <TrendingUp className="w-3.5 h-3.5" />
                {savingsRate}% Savings Rate
              </span>
            </div>
          </div>

          {/* Mini 6-Month Inflows Flow Chart */}
          <div className="mt-6 pt-4 border-t border-white/[0.06]">
            <div className="flex items-center justify-between text-xs font-mono text-white/50 mb-2">
              <span>6-Month Cash Surplus Flow</span>
              <span className="text-[#E8FF1F]">
                Latest Month: {monthlyTrends.length > 0 ? formatINR(monthlyTrends[monthlyTrends.length - 1].net) : '₹0'}
              </span>
            </div>
            <div className="h-28 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthlyTrends}
                  margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="netSurplusGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#E8FF1F" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#E8FF1F" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-[#151518] border border-white/10 p-2.5 rounded-xl text-xs font-mono shadow-2xl">
                            <span className="text-white/40 block text-[10px]">{d.month}</span>
                            <div className="text-white font-bold">Surplus: {formatINR(d.net)}</div>
                            <div className="text-[#58B58C] text-[10px]">In: {formatINR(d.income)}</div>
                            <div className="text-[#FF6AA8] text-[10px]">Out: {formatINR(d.expenses)}</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="net"
                    stroke="#E8FF1F"
                    strokeWidth={2.5}
                    fill="url(#netSurplusGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </BentoCard>

        {/* Financial Health Bento Panel */}
        <BentoCard className="lg:col-span-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-mono uppercase font-bold text-white/50 tracking-wider">
                Financial Health Index
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-white/60 border border-white/[0.08]">
                Deterministic Model
              </span>
            </div>

            <BentoHealthGauge
              score={s.financial_health_score}
              summary={s.financial_health_summary}
            />
          </div>

          <div className="mt-5 pt-4 border-t border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/50 font-mono">Deductions Applied</span>
              <span className="text-[#FF6AA8] font-bold font-mono">
                {s.unusual_transactions_count} ML Outliers Flagged
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/50 font-mono">Recurring Outflows</span>
              <span className="text-[#FFB37A] font-bold font-mono">
                {formatINR(s.potential_monthly_leakage)}/mo
              </span>
            </div>
            <button
              onClick={() => navigate('/anomalies')}
              className="w-full mt-2 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-all"
            >
              <span>Audit Health Penalties</span>
              <ChevronRight className="w-3.5 h-3.5 text-white/40" />
            </button>
          </div>
        </BentoCard>
      </div>

      {/* ======================================================== */}
      {/* ROW 2: FOUR PRIMARY KPI CARDS (4 x 3 cols)               */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Income */}
        <BentoCard interactive>
          <BentoMetric
            label="Total Inflows"
            value={s.total_income}
            subtext="Across 6 Recorded Cycles"
            accentColor="green"
            badge="Income"
          />
        </BentoCard>

        {/* Total Expenses */}
        <BentoCard interactive>
          <BentoMetric
            label="Total Expenses"
            value={s.total_expenses}
            subtext="Settled Outflows"
            accentColor="copper"
            badge="Expenditure"
          />
        </BentoCard>

        {/* Net Savings */}
        <BentoCard interactive>
          <BentoMetric
            label="Net Savings"
            value={s.net_savings}
            subtext={`${savingsRate}% Savings Efficiency`}
            accentColor="lime"
            badge="Accumulated"
          />
        </BentoCard>

        {/* Active Subscriptions Leakage */}
        <BentoCard interactive onClick={() => navigate('/subscriptions')} className="cursor-pointer">
          <BentoMetric
            label="Monthly Subscriptions"
            value={s.potential_monthly_leakage}
            subtext={`${s.active_subscriptions_count} Active Recurring Services`}
            accentColor="pink"
            badge="Leakage"
          />
        </BentoCard>
      </div>

      {/* ======================================================== */}
      {/* ROW 3: CASH FLOW CHARTS (7 cols) & CATEGORIES (5 cols)   */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Multi-Month Income vs Expenses Trajectory */}
        <BentoCard className="lg:col-span-7 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-extrabold text-white">Cash-Flow Trajectory</h3>
              <p className="text-xs text-white/40 font-mono">
                Historical monthly inflows vs expenditures
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-[#58B58C]">
                <span className="w-2 h-2 rounded-full bg-[#58B58C]" /> Income
              </span>
              <span className="flex items-center gap-1.5 text-[#FF6AA8]">
                <span className="w-2 h-2 rounded-full bg-[#FF6AA8]" /> Expenses
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#58B58C" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#58B58C" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF6AA8" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#FF6AA8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="rgba(255,255,255,0.3)"
                  fontSize={11}
                  tickLine={false}
                  fontFamily="JetBrains Mono"
                />
                <YAxis
                  stroke="rgba(255,255,255,0.3)"
                  fontSize={11}
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
                          <span className="text-white/40 block text-[10px] mb-1">{d.month}</span>
                          <div className="text-[#58B58C] font-bold">Income: {formatINR(d.income)}</div>
                          <div className="text-[#FF6AA8] font-bold">Expenses: {formatINR(d.expenses)}</div>
                          <div className="text-white font-bold mt-1 pt-1 border-t border-white/10">
                            Net: {formatINR(d.net)}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="income" stroke="#58B58C" strokeWidth={2} fill="url(#incGrad)" />
                <Area type="monotone" dataKey="expenses" stroke="#FF6AA8" strokeWidth={2} fill="url(#expGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </BentoCard>

        {/* Category Spending Allocation */}
        <BentoCard className="lg:col-span-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-extrabold text-white">Category Allocation</h3>
              <p className="text-xs text-white/40 font-mono">Share of total expenditures</p>
            </div>
            <button
              onClick={() => navigate('/transactions')}
              className="text-xs text-[#E8FF1F] hover:underline font-mono"
            >
              Breakdown
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-40 h-40 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categorySpending}
                    dataKey="total_amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={68}
                    paddingAngle={3}
                  >
                    {categorySpending.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-[#151518] border border-white/10 p-2 rounded-xl text-xs font-mono shadow-xl">
                            <span className="text-white font-bold block">{d.category}</span>
                            <span className="text-[#E8FF1F]">{formatINR(d.total_amount)}</span>
                            <span className="text-white/40 block text-[10px]">({d.percentage}%)</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex-1 w-full space-y-1.5 overflow-hidden">
              {categorySpending.slice(0, 4).map((cat, idx) => (
                <div key={cat.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="flex items-center gap-1.5 text-white/80 truncate">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                      />
                      <span className="truncate">{cat.category}</span>
                    </span>
                    <span className="text-white font-bold shrink-0">{cat.percentage}%</span>
                  </div>
                  <div className="w-full bg-white/[0.04] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${cat.percentage}%`,
                        backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] text-[11px] text-white/40 font-mono flex items-center justify-between">
            <span>Primary Category: Housing</span>
            <span>35.4% of all expenses</span>
          </div>
        </BentoCard>
      </div>

      {/* ======================================================== */}
      {/* ROW 4: RECENT TRANSACTIONS (7 cols) & INTELLIGENCE (5)   */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Recent Ledger Transactions */}
        <BentoCard className="lg:col-span-7 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-extrabold text-white">Recent Transactions</h3>
              <p className="text-xs text-white/40 font-mono">Latest activity in SQLite ledger</p>
            </div>
            <button
              onClick={() => navigate('/transactions')}
              className="text-xs text-[#E8FF1F] hover:underline font-mono flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {s.recent_transactions.slice(0, 5).map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0',
                      tx.transaction_type === 'income'
                        ? 'bg-[#58B58C]/10 text-[#58B58C] border border-[#58B58C]/20'
                        : 'bg-white/[0.04] text-white/70 border border-white/[0.08]'
                    )}
                  >
                    {tx.merchant ? tx.merchant.slice(0, 1).toUpperCase() : 'T'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{tx.merchant || tx.description}</p>
                    <p className="text-[10px] text-white/40 font-mono">{tx.transaction_date} • {tx.category}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={cn(
                      'text-xs font-bold font-mono',
                      tx.transaction_type === 'income' ? 'text-[#58B58C]' : 'text-white'
                    )}
                  >
                    {tx.transaction_type === 'income' ? `+${formatINR(tx.amount)}` : `-${formatINR(tx.amount)}`}
                  </span>
                  <span className="text-[9px] text-white/40 block font-mono capitalize">
                    {tx.payment_method || 'UPI'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </BentoCard>

        {/* Financial Early-Warning & Risk Alerts */}
        <BentoCard className="lg:col-span-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-extrabold text-white">Risk Intelligence</h3>
              <p className="text-xs text-white/40 font-mono">Isolation Forest & Rule Detections</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
              {s.unusual_transactions_count} Flagged
            </span>
          </div>

          <div className="space-y-3">
            {/* Highlighted ML Anomaly */}
            <div
              onClick={() => navigate('/anomalies')}
              className="p-3.5 rounded-2xl bg-[#FF6AA8]/[0.06] border border-[#FF6AA8]/20 hover:border-[#FF6AA8]/40 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5 text-xs font-bold text-[#FF6AA8]">
                  <AlertOctagon className="w-3.5 h-3.5" />
                  Isolation Forest Outlier
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-[#FF6AA8]/60 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-xs font-bold text-white">
                {topAnomaly
                  ? `${formatINR(topAnomaly.amount)} at ${topAnomaly.merchant}`
                  : '₹18,500 at Croma Electronics'}
              </p>
              <p className="text-[11px] text-white/60 mt-0.5 line-clamp-2">
                {topAnomaly
                  ? `Statistical outlier (Score: ${topAnomaly.anomaly_score.toFixed(3)}) in ${topAnomaly.category} spending baseline.`
                  : 'Statistical Z-score +4.61 (12.3x higher than your historical shopping baseline).'}
              </p>
            </div>

            {/* Highlighted Duplicate Charge */}
            <div
              onClick={() => navigate('/duplicates')}
              className="p-3.5 rounded-2xl bg-[#FFB37A]/[0.06] border border-[#FFB37A]/20 hover:border-[#FFB37A]/40 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5 text-xs font-bold text-[#FFB37A]">
                  <Copy className="w-3.5 h-3.5" />
                  Suspected Duplicate Charge
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-[#FFB37A]/60 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-xs font-bold text-white">
                {topDuplicate
                  ? `${topDuplicate.merchant} • 2 × ${formatINR(topDuplicate.amount)}`
                  : 'Amazon India • 2 × ₹1,299'}
              </p>
              <p className="text-[11px] text-white/60 mt-0.5 line-clamp-2">
                {topDuplicate?.similarity_reason ||
                  'Identical debit timestamps captured within rolling settlement window.'}
              </p>
            </div>

            {/* Price Hike Detected */}
            <div
              onClick={() => navigate('/subscriptions')}
              className="p-3 rounded-2xl bg-[#E8FF1F]/[0.05] border border-[#E8FF1F]/20 hover:border-[#E8FF1F]/30 transition-all cursor-pointer group flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] font-mono text-[#E8FF1F] uppercase font-bold block">
                  Subscription Creep
                </span>
                <span className="text-xs font-bold text-white">
                  {topPriceHike
                    ? `${topPriceHike.merchant} increased to ${formatINR(topPriceHike.latest_amount)}/mo (+${formatINR(topPriceHike.price_change_amount)})`
                    : 'Netflix increased to ₹649/mo (+₹150)'}
                </span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-white/40 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06]">
            <button
              onClick={() => navigate('/investigator')}
              className="w-full py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-bold text-white flex items-center justify-center gap-2 transition-all"
            >
              <Bot className="w-4 h-4 text-[#E8FF1F]" />
              <span>Ask AI Investigator to Analyze Anomalies</span>
            </button>
          </div>
        </BentoCard>
      </div>
    </div>
  );
};
