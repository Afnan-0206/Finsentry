import React, { useState, useEffect } from 'react';
import {
  Settings,
  RefreshCw,
  Download,
  ShieldCheck,
  Cpu,
  Info,
  CheckCircle2,
  FileText,
  Database,
  Sliders,
  User,
  Key,
} from 'lucide-react';
import { api } from '@/services/api';
import type { ChatProviderStatus } from '@/types';
import { cn } from '@/lib/utils';
import { BentoCard, BentoMetric } from '@/components/ui/finance-bento';

export const SettingsPage: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [providerStatus, setProviderStatus] = useState<ChatProviderStatus | null>(null);
  const [resetting, setResetting] = useState<boolean>(false);
  const [resetSuccess, setResetSuccess] = useState<boolean>(false);

  useEffect(() => {
    api.getSystemStatus().then(setSystemStatus).catch(console.error);
    api.getChatProviderStatus().then(setProviderStatus).catch(console.error);
  }, []);

  const handleReset = async () => {
    if (confirm('Reset FinSentry database and re-seed 6-month demonstration transactions?')) {
      try {
        setResetting(true);
        await api.resetDemoData();
        setResetSuccess(true);
        setTimeout(() => setResetSuccess(false), 4000);
      } catch (err) {
        console.error('Failed to reset demo data', err);
        alert('Failed to reset demo data.');
      } finally {
        setResetting(false);
      }
    }
  };

  const handleDownloadSample = () => {
    const csvContent =
      'Date,Merchant,Description,Amount,Type,Category,Payment Method,Reference\n' +
      '2026-03-01,Netflix Entertainment,Netflix Standard Monthly,649.00,expense,Subscriptions,Credit Card,NFLX20260301\n' +
      '2026-03-02,Swiggy,Dinner Delivery Biryani,480.00,expense,Food,UPI,SWIGGY20260302\n' +
      '2026-03-03,Amazon India,Soundcore Earbuds,1299.00,expense,Shopping,Credit Card,AMZ20260303\n' +
      '2026-03-03,Amazon India,Soundcore Earbuds,1299.00,expense,Shopping,Credit Card,AMZ20260303DUP\n' +
      '2026-03-04,Infosys Technologies,Monthly Salary Inflow,85000.00,income,Salary,Net Banking,SAL20260304\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_finsentry_transactions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
          <span>Workspace Settings</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E8FF1F]/10 border border-[#E8FF1F]/30 text-[#E8FF1F] uppercase font-bold">
            Configuration
          </span>
        </h1>
        <p className="text-xs text-white/50 font-mono mt-0.5">
          AI inference runtime, demonstration ledger re-seeding, and ML parameters
        </p>
      </div>

      {/* Grid: Left Column Settings, Right Column Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* User Profile & Currency Card */}
          <BentoCard className="p-6">
            <h3 className="text-base font-extrabold text-white mb-1">Financial Workspace</h3>
            <p className="text-xs text-white/40 font-mono mb-4">Regional parameters & ledger currency</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-2xl bg-[#0B0B0D] border border-white/[0.08]">
                <span className="text-[10px] font-mono text-white/40 uppercase block mb-1">Primary Currency</span>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="text-[#E8FF1F] font-mono font-black text-base">₹</span>
                  <span>Indian Rupee (INR)</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#0B0B0D] border border-white/[0.08]">
                <span className="text-[10px] font-mono text-white/40 uppercase block mb-1">Locale</span>
                <div className="text-sm font-bold text-white font-mono">en-IN (Lakh / Crore)</div>
              </div>
            </div>
          </BentoCard>

          {/* Demonstration Data Management */}
          <BentoCard className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-white">Demonstration Data Management</h3>
                <p className="text-xs text-white/40 font-mono mt-0.5">
                  Populate SQLite with 337+ realistic transactions spanning 6 months
                </p>
              </div>

              <button
                onClick={handleReset}
                disabled={resetting}
                className="px-4 py-2 rounded-xl bg-[#E8FF1F] text-black font-extrabold text-xs flex items-center gap-1.5 hover:bg-[#d4eb17] transition-all disabled:opacity-50 shadow-bento w-fit shrink-0 font-mono"
              >
                {resetSuccess ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                    <span>Re-Seeded!</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
                    <span>{resetting ? 'Seeding...' : 'Reset & Re-Seed'}</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-2 p-3.5 rounded-2xl bg-[#0B0B0D] border border-white/[0.08] text-xs font-mono">
              <span className="text-white/60 font-bold block mb-1 text-[11px] uppercase tracking-wider text-[#E8FF1F]">
                Included Academic Evaluation Scenarios:
              </span>
              <div className="text-white/70 space-y-1">
                <div>• <strong>Scenario A (Creep)</strong>: Netflix increased from ₹499 to ₹649/mo (+₹150).</div>
                <div>• <strong>Scenario B (Duplicate)</strong>: Amazon India dual debit of ₹1,299 within 24h.</div>
                <div>• <strong>Scenario C (ML Outlier)</strong>: Croma Electronics ₹18,500 festive spend (Z-score +4.61).</div>
                <div>• <strong>Scenario D (Surge)</strong>: Food & Dining rose +44% MoM, dropping savings from 38% to 17%.</div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
              <button
                onClick={handleDownloadSample}
                className="flex items-center gap-1.5 text-xs text-[#E8FF1F] hover:underline font-mono"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Sample Statement CSV</span>
              </button>
            </div>
          </BentoCard>
        </div>

        {/* Right Column (5 cols) Diagnostics */}
        <div className="lg:col-span-5 space-y-5">
          {/* AI Inference Architecture */}
          <BentoCard className="p-6">
            <h3 className="text-base font-extrabold text-white mb-1">AI Inference Runtime</h3>
            <p className="text-xs text-white/40 font-mono mb-4">Active multi-provider hierarchy</p>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-[#0B0B0D] border border-white/[0.08]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Local Ollama</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#E8FF1F]/10 text-[#E8FF1F] border border-[#E8FF1F]/30 font-bold">
                    Primary
                  </span>
                </div>
                <p className="text-[11px] text-white/60 font-mono mt-1">
                  Model: Qwen 2.5 7B & 0.5B on localhost:11434
                </p>
                <p className="text-[10px] text-white/40 font-mono mt-0.5">
                  Keep-Alive: 15m • Bounded Context: 2048
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#0B0B0D] border border-white/[0.08]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Cloudflare Workers AI</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/[0.04] text-white/60 border border-white/[0.08]">
                    Production
                  </span>
                </div>
                <p className="text-[11px] text-white/60 font-mono mt-1">
                  Model: @cf/meta/llama-3.1-8b-instruct
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#0B0B0D] border border-white/[0.08]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Deterministic Rules</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#58B58C]/15 text-[#58B58C] border border-[#58B58C]/30 font-bold">
                    Offline Fallback
                  </span>
                </div>
                <p className="text-[11px] text-white/60 font-mono mt-1">
                  100% Guaranteed Grounding with Zero Latency
                </p>
              </div>
            </div>
          </BentoCard>

          {/* Machine Learning Specs */}
          <BentoCard className="p-6">
            <h3 className="text-base font-extrabold text-white mb-1">Machine Learning Stack</h3>
            <p className="text-xs text-white/40 font-mono mb-4">Core Python & Scikit-learn models</p>

            <div className="space-y-2 text-xs font-mono text-white/70">
              <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02]">
                <span>Anomaly Algorithm:</span>
                <span className="text-white font-bold">Isolation Forest</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02]">
                <span>Contamination Rate:</span>
                <span className="text-[#E8FF1F] font-bold">0.05 (5%)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02]">
                <span>Categorization:</span>
                <span className="text-white font-bold">Keyword Rule Engine + Heuristics</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02]">
                <span>Database:</span>
                <span className="text-white font-bold">SQLite 3 (Local ACID)</span>
              </div>
            </div>
          </BentoCard>
        </div>
      </div>
    </div>
  );
};
