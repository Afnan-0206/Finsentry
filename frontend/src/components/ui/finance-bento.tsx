import React, { useId } from 'react';
import { cn, formatINR } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

// ==================== BENTO CARD CONTAINER ====================
export interface BentoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  interactive?: boolean;
}

export const BentoCard: React.FC<BentoCardProps> = ({
  children,
  className,
  glow = false,
  interactive = false,
  ...props
}) => {
  return (
    <div
      className={cn(
        'relative rounded-[24px] bg-gradient-to-b from-[#151518] to-[#101012] border border-white/[0.08] shadow-bento p-5 sm:p-6 transition-all duration-300 overflow-hidden',
        interactive && 'hover:border-white/[0.16] hover:shadow-bento-glow hover:-translate-y-0.5',
        glow && 'ring-1 ring-[#E8FF1F]/20 border-[#E8FF1F]/30',
        className
      )}
      {...props}
    >
      {/* Top ambient highlight line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      {children}
    </div>
  );
};

// ==================== BENTO METRIC DISPLAY ====================
export interface BentoMetricProps {
  label: string;
  value: number | string;
  subtext?: string;
  change?: number;
  changeLabel?: string;
  accentColor?: 'lime' | 'lavender' | 'copper' | 'pink' | 'green' | 'cyan';
  icon?: React.ReactNode;
  badge?: string;
  isCurrency?: boolean;
  className?: string;
}

export const BentoMetric: React.FC<BentoMetricProps> = ({
  label,
  value,
  subtext,
  change,
  changeLabel = 'vs last month',
  accentColor = 'lime',
  icon,
  badge,
  isCurrency = true,
  className,
}) => {
  const formattedValue =
    typeof value === 'number'
      ? isCurrency
        ? formatINR(value)
        : value.toLocaleString('en-IN')
      : value;

  const accentStyles = {
    lime: 'text-[#E8FF1F] bg-[#E8FF1F]/10 border-[#E8FF1F]/20',
    lavender: 'text-[#A9B2FF] bg-[#A9B2FF]/10 border-[#A9B2FF]/20',
    copper: 'text-[#FFB37A] bg-[#FFB37A]/10 border-[#FFB37A]/20',
    pink: 'text-[#FF6AA8] bg-[#FF6AA8]/10 border-[#FF6AA8]/20',
    green: 'text-[#58B58C] bg-[#58B58C]/10 border-[#58B58C]/20',
    cyan: 'text-[#38BDF8] bg-[#38BDF8]/10 border-[#38BDF8]/20',
  }[accentColor];

  return (
    <div className={cn('flex flex-col justify-between h-full', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
          {label}
        </span>
        {badge ? (
          <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold border', accentStyles)}>
            {badge}
          </span>
        ) : icon ? (
          <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white/70">
            {icon}
          </div>
        ) : null}
      </div>

      <div className="my-2.5">
        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono text-white">
          {formattedValue}
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-white/40 pt-1">
        {change !== undefined && change !== null ? (
          <div className="flex items-center gap-1">
            <span
              className={cn(
                'inline-flex items-center gap-0.5 font-bold font-mono text-xs',
                change > 0 ? 'text-[#58B58C]' : change < 0 ? 'text-[#FF6AA8]' : 'text-white/50'
              )}
            >
              {change > 0 ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : change < 0 ? (
                <TrendingDown className="w-3.5 h-3.5" />
              ) : null}
              {change > 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`}
            </span>
            <span className="text-white/40">{changeLabel}</span>
          </div>
        ) : (
          <span>{subtext}</span>
        )}
      </div>
    </div>
  );
};

// ==================== BENTO MINI AREA CHART ====================
export interface BentoChartPoint {
  date: string;
  value: number;
}

export interface BentoMiniAreaChartProps {
  data: BentoChartPoint[];
  color?: string;
  gradientId?: string;
  height?: number;
}

export const BentoMiniAreaChart: React.FC<BentoMiniAreaChartProps> = ({
  data,
  color = '#E8FF1F',
  gradientId,
  height = 90,
}) => {
  const generatedId = useId();
  const id = gradientId || generatedId;

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-20 text-xs text-white/30 font-mono">
        No chart metrics recorded
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0];
                return (
                  <div className="bg-[#151518] border border-white/10 px-2.5 py-1.5 rounded-lg shadow-xl text-xs font-mono">
                    <span className="text-white/50 text-[10px] block">{item.payload.date}</span>
                    <span className="font-bold text-white">{formatINR(Number(item.value))}</span>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fillOpacity={1}
            fill={`url(#${id})`}
            isAnimationActive={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// ==================== BENTO SCHEDULED PAYMENTS LIST ====================
export interface ScheduledPaymentItem {
  id: string | number;
  merchant: string;
  amount: number;
  date: string;
  frequency: string;
  status?: string;
  isPriceCreep?: boolean;
}

export interface BentoScheduledListProps {
  items: ScheduledPaymentItem[];
  maxItems?: number;
  onItemClick?: (item: ScheduledPaymentItem) => void;
}

export const BentoScheduledList: React.FC<BentoScheduledListProps> = ({
  items,
  maxItems = 4,
  onItemClick,
}) => {
  if (!items || items.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-white/30 font-mono">
        No upcoming scheduled commitments
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.slice(0, maxItems).map((item) => (
        <div
          key={item.id}
          onClick={() => onItemClick && onItemClick(item)}
          className={cn(
            'group flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all',
            item.isPriceCreep && 'border-amber-500/30 bg-amber-500/[0.03]'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center font-bold font-mono text-sm text-[#E8FF1F]">
              {item.merchant.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>{item.merchant}</span>
                {item.isPriceCreep && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase">
                    Hike
                  </span>
                )}
              </div>
              <span className="text-[11px] text-white/40">
                {item.date ? `Next: ${item.date}` : `Cycle: ${item.frequency}`}
              </span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm font-bold font-mono text-white">
              {formatINR(item.amount)}
            </div>
            <span className="text-[10px] text-white/40 capitalize">{item.frequency}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// ==================== BENTO HEALTH GAUGE ====================
export interface BentoHealthGaugeProps {
  score: number;
  label?: string;
  summary?: string;
}

export const BentoHealthGauge: React.FC<BentoHealthGaugeProps> = ({
  score,
  label = 'Financial Health',
  summary,
}) => {
  // Clamped score 0 to 100
  const normalized = Math.max(0, Math.min(100, score));
  const strokeDashoffset = 283 - (283 * normalized) / 100;

  const getStatusColor = (val: number) => {
    if (val >= 80) return { stroke: '#58B58C', text: 'text-[#58B58C]', tag: 'Optimal' };
    if (val >= 60) return { stroke: '#E8FF1F', text: 'text-[#E8FF1F]', tag: 'Good' };
    if (val >= 40) return { stroke: '#FFB37A', text: 'text-[#FFB37A]', tag: 'Needs Attention' };
    return { stroke: '#FF6AA8', text: 'text-[#FF6AA8]', tag: 'High Risk' };
  };

  const status = getStatusColor(normalized);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 justify-between">
      <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="transparent"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="10"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="transparent"
            stroke={status.stroke}
            strokeWidth="10"
            strokeDasharray="264"
            strokeDashoffset={264 - (264 * normalized) / 100}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-extrabold font-mono text-white tracking-tight leading-none">
            {normalized}
          </span>
          <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider mt-1">
            / 100
          </span>
        </div>
      </div>

      <div className="space-y-2 text-center sm:text-left flex-1">
        <div className="flex items-center justify-center sm:justify-start gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
            {label}
          </span>
          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-[10px] font-bold border border-white/10 bg-white/[0.04]',
              status.text
            )}
          >
            {status.tag}
          </span>
        </div>
        <p className="text-xs leading-relaxed text-white/60">
          {summary ||
            'Calculated dynamically from savings consistency, anomaly density, and monthly subscription leakage.'}
        </p>
      </div>
    </div>
  );
};

