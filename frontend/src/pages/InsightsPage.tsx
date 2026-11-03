import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Lightbulb,
  Calendar,
  Wallet,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  PiggyBank,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { api } from '@/services/api';
import type { ForecastResponse, Recommendation, Budget } from '@/types';
import { cn, formatINR } from '@/lib/utils';
import { BentoCard, BentoMetric } from '@/components/ui/finance-bento';

export const InsightsPage: React.FC = () => {
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [horizon, setHorizon] = useState<7 | 30>(30);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [fData, rData, bData] = await Promise.all([
        horizon === 7 ? api.get7DayForecast() : api.get30DayForecast(),
        api.getRecommendations(),
        api.getBudgets(),
      ]);
      setForecast(fData);
      setRecommendations(rData);
      setBudgets(bData);
    } catch (err) {
      console.error('Failed to load insights data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [horizon]);

  const handleUpdateRecStatus = async (id: number, status: string) => {
    try {
      await api.updateRecommendationStatus(id, status);
      fetchData();
    } catch (err) {
      console.error('Failed to update recommendation', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span>Financial Insights & Projections</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E8FF1F]/10 border border-[#E8FF1F]/30 text-[#E8FF1F] uppercase font-bold">
              Integrated Suite
            </span>
          </h1>
          <p className="text-xs text-white/50 font-mono mt-0.5">
            Proactive cash-flow projection, upcoming subscription obligations & behavioral recommendations
          </p>
        </div>

        {/* Horizon Pill */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#101012] border border-white/[0.08] w-fit">
          <button
            onClick={() => setHorizon(30)}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all',
              horizon === 30 ? 'bg-[#E8FF1F] text-black shadow-bento' : 'text-white/60 hover:text-white'
            )}
          >
            30-Day Outlook
          </button>
          <button
            onClick={() => setHorizon(7)}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all',
              horizon === 7 ? 'bg-[#E8FF1F] text-black shadow-bento' : 'text-white/60 hover:text-white'
            )}
          >
            7-Day Forward
          </button>
        </div>
      </div>

      {/* Forecast Metric Bento Cards */}
      {forecast && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <BentoCard>
            <BentoMetric
              label="Projected Income"
              value={forecast.projected_total_income}
              subtext="Detected salary & recurring inflows"
              accentColor="green"
            />
          </BentoCard>

          <BentoCard>
            <BentoMetric
              label="Projected Outflows"
              value={forecast.projected_total_expenses}
              subtext="Subscriptions + moving average"
              accentColor="pink"
            />
          </BentoCard>

          <BentoCard glow={forecast.projected_net_savings > 0}>
            <BentoMetric
              label="Expected Net Savings"
              value={forecast.projected_net_savings}
              subtext="Projected surplus cash buffer"
              accentColor="lime"
            />
          </BentoCard>

          <BentoCard>
            <BentoMetric
              label="Upcoming Commitments"
              value={forecast.upcoming_subscriptions_cost}
              subtext="Locked recurring services"
              accentColor="copper"
            />
          </BentoCard>
        </div>
      )}

      {/* Forecast Chart */}
      {forecast && (
        <BentoCard className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-extrabold text-white">Daily Cash-Flow Forecast</h3>
              <p className="text-xs text-white/40 font-mono">Predicted daily movements</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-[#58B58C]">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#58B58C]" /> Inflow
              </span>
              <span className="flex items-center gap-1.5 text-[#FF6AA8]">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#FF6AA8]" /> Outflow
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={forecast.daily_projections} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
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
                        <div className="bg-[#151518] border border-white/10 p-2.5 rounded-xl text-xs font-mono shadow-2xl">
                          <span className="text-white/40 block text-[10px]">{d.date}</span>
                          <div className="text-[#58B58C] font-bold">In: {formatINR(d.projected_income)}</div>
                          <div className="text-[#FF6AA8] font-bold">Out: {formatINR(d.projected_expenses)}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="projected_income" fill="#58B58C" radius={[3, 3, 0, 0]} />
                <Bar dataKey="projected_expenses" fill="#FF6AA8" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </BentoCard>
      )}

      {/* Behavioral Savings Recommendations */}
      <BentoCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-extrabold text-white">Actionable Financial Recommendations</h3>
            <p className="text-xs text-white/40 font-mono">Autonomous cost-saving opportunities</p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E8FF1F]/10 text-[#E8FF1F] border border-[#E8FF1F]/30 font-bold">
            {recommendations.length} Active
          </span>
        </div>

        <div className="space-y-3">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.04] transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    {rec.priority} Priority
                  </span>
                  <span className="text-xs font-bold text-white">{rec.title}</span>
                </div>
                <p className="text-xs text-white/60">{rec.description}</p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-bold font-mono text-[#E8FF1F]">
                  +{formatINR(rec.estimated_impact)}
                </span>
                {rec.status === 'active' && (
                  <button
                    onClick={() => handleUpdateRecStatus(rec.id, 'implemented')}
                    className="px-3 py-1.5 rounded-xl bg-[#E8FF1F] text-black text-xs font-bold hover:bg-[#d4eb17] transition-all shadow-bento"
                  >
                    Done
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </BentoCard>
    </div>
  );
};
