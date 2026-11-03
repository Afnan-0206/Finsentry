import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  User,
  Send,
  Trash2,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  ArrowRight,
  Cpu,
  Copy,
  Check,
  Square,
  ChevronDown,
  ChevronUp,
  Zap,
} from 'lucide-react';
import { api } from '@/services/api';
import type { ChatMessage, ChatProviderStatus } from '@/types';
import { cn } from '@/lib/utils';
import { BentoCard } from '@/components/ui/finance-bento';

const SUGGESTED_QUESTIONS = [
  'Why did my savings decrease this month?',
  'What is my highest spending category?',
  'Which subscriptions are costing me the most?',
  'Are there any suspicious transactions?',
  'How much can I save next month?',
  'Compare this month with last month',
  'Explain my financial health score',
];

export const InvestigatorPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>('qwen2.5:7b');
  const [followups, setFollowups] = useState<string[]>([]);
  const [providerStatus, setProviderStatus] = useState<ChatProviderStatus | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [expandedSources, setExpandedSources] = useState<Record<number, boolean>>({});
  const [activeMetrics, setActiveMetrics] = useState<{ ttft?: number; speed?: number; latency?: number } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchHistoryAndStatus = async () => {
    try {
      const [history, status] = await Promise.allSettled([
        api.getChatHistory(),
        api.getChatProviderStatus(selectedModel),
      ]);
      if (history.status === 'fulfilled') {
        setMessages(history.value);
      }
      if (status.status === 'fulfilled') {
        setProviderStatus(status.value);
      }
    } catch (err) {
      console.error('Failed to load chat initialization data', err);
    }
  };

  useEffect(() => {
    fetchHistoryAndStatus();
  }, [selectedModel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleCopyMessage = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleSourceExpand = (id: number) => {
    setExpandedSources((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isLoading) return;

    const userMsgId = Date.now();
    const asstMsgId = userMsgId + 1;

    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      message: text,
      created_at: new Date().toISOString(),
    };

    const asstPlaceholder: ChatMessage = {
      id: asstMsgId,
      role: 'assistant',
      message: '',
      provider: providerStatus?.active_provider || 'FinSentry Engine',
      model: selectedModel,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg, asstPlaceholder]);
    setInputMessage('');
    setIsLoading(true);
    setActiveMetrics(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let accumulatedText = '';

    try {
      await api.streamChatMessage(
        text,
        selectedModel,
        {
          onMeta: (meta) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === asstMsgId
                  ? {
                      ...m,
                      provider: meta.provider,
                      model: meta.model,
                      intent: meta.intent,
                      supporting_data: meta.supporting_data,
                    }
                  : m
              )
            );
            if (meta.suggested_followups) {
              setFollowups(meta.suggested_followups);
            }
          },
          onToken: (token) => {
            accumulatedText += token;
            setMessages((prev) =>
              prev.map((m) => (m.id === asstMsgId ? { ...m, message: accumulatedText } : m))
            );
          },
          onDone: (doneInfo) => {
            setActiveMetrics({
              ttft: doneInfo.ttft_seconds,
              speed: doneInfo.tokens_per_second,
              latency: doneInfo.latency_seconds,
            });
            setMessages((prev) =>
              prev.map((m) =>
                m.id === asstMsgId
                  ? {
                      ...m,
                      ttft_seconds: doneInfo.ttft_seconds,
                      tokens_per_second: doneInfo.tokens_per_second,
                      latency_seconds: doneInfo.latency_seconds,
                      provider: doneInfo.provider,
                      model: doneInfo.model,
                    }
                  : m
              )
            );
          },
        },
        controller.signal
      );
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === asstMsgId
              ? { ...m, message: accumulatedText + '\n\n*(Generation stopped by user)*' }
              : m
          )
        );
      } else {
        console.error('Streaming chat failed, attempting synchronous fallback:', err);
        try {
          const fallbackRes = await api.sendChatMessage(text, selectedModel);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === asstMsgId
                ? {
                    ...m,
                    message: fallbackRes.response,
                    intent: fallbackRes.intent,
                    provider: fallbackRes.provider,
                    model: fallbackRes.model,
                    supporting_data: fallbackRes.supporting_data,
                  }
                : m
            )
          );
          if (fallbackRes.suggested_followups) {
            setFollowups(fallbackRes.suggested_followups);
          }
        } catch (fallbackErr) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === asstMsgId
                ? {
                    ...m,
                    message:
                      '⚠️ FinSentry AI Investigator could not reach local inference. Verified metrics remain secure in the ledger.',
                  }
                : m
            )
          );
        }
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
      api.getChatProviderStatus(selectedModel).then(setProviderStatus).catch(() => {});
    }
  };

  const handleClearHistory = async () => {
    if (confirm('Clear entire conversation history with FinSentry Investigator?')) {
      try {
        await api.clearChatHistory();
        setMessages([]);
        setFollowups([]);
      } catch (err) {
        console.error('Failed to clear history', err);
      }
    }
  };

  const formatMessageText = (txt: string) => {
    if (!txt) return null;
    return txt.split('\n').map((line, idx) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const renderedParts = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          const content = part.slice(2, -2);
          const isSectionHeader =
            content.includes('Finding') ||
            content.includes('Evidence') ||
            content.includes('Analysis') ||
            content.includes('Financial Impact') ||
            content.includes('Recommended Action');

          return (
            <strong
              key={pIdx}
              className={cn(
                'font-extrabold',
                isSectionHeader ? 'text-[#E8FF1F] block mt-2 mb-1 text-xs' : 'text-white'
              )}
            >
              {content}
            </strong>
          );
        }
        return part;
      });

      if (line.startsWith('• ') || line.startsWith('- ')) {
        return (
          <li key={idx} className="ml-4 list-disc text-white/80 my-0.5 leading-relaxed">
            {renderedParts}
          </li>
        );
      }

      return (
        <p key={idx} className={`${line.trim() === '' ? 'h-2' : 'my-1'} text-white/80 leading-relaxed`}>
          {renderedParts}
        </p>
      );
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-5xl mx-auto rounded-[24px] bg-gradient-to-b from-[#151518] to-[#101012] border border-white/[0.08] shadow-bento overflow-hidden text-xs text-white">
      {/* Header */}
      <div className="p-4 border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0B0B0D] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#E8FF1F] flex items-center justify-center text-black font-extrabold shadow-bento shrink-0">
            <Bot className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
              FinSentry AI Investigator
              <span className="px-2 py-0.5 rounded-full bg-[#E8FF1F]/10 text-[#E8FF1F] text-[10px] font-mono font-bold border border-[#E8FF1F]/30">
                Grounded Copilot
              </span>
            </h3>
            <p className="text-[11px] text-white/40 font-mono">
              Targeted context retrieval • Grounded in verified SQLite transactions • Zero Hallucinations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Model Selector Dropdown */}
          <div className="flex items-center gap-1.5 bg-[#151518] border border-white/[0.1] rounded-xl px-2.5 py-1">
            <Cpu className="w-3.5 h-3.5 text-[#E8FF1F] shrink-0" />
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-transparent text-[11px] font-semibold text-white/90 focus:outline-none cursor-pointer font-mono"
            >
              <option value="qwen2.5:7b" className="bg-[#151518] text-white">Qwen 2.5 7B (Deep Analysis)</option>
              <option value="qwen2.5:0.5b" className="bg-[#151518] text-white">Qwen 2.5 0.5B (Fast Streaming)</option>
              <option value="deterministic" className="bg-[#151518] text-white">Deterministic Engine (Offline)</option>
            </select>
          </div>

          {/* Active Provider Status Indicator */}
          {providerStatus && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[11px] font-mono text-white/70">
              <span
                className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  providerStatus.is_available ? 'bg-[#58B58C] animate-pulse' : 'bg-amber-400'
                )}
              />
              <span>{providerStatus.is_available ? 'Online' : 'Fallback'}</span>
            </div>
          )}

          {messages.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="p-1.5 text-white/40 hover:text-rose-400 text-[11px] transition-colors"
              title="Clear conversation"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.length === 0 ? (
          <div className="max-w-xl mx-auto py-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#E8FF1F]/10 border border-[#E8FF1F]/30 mx-auto flex items-center justify-center text-[#E8FF1F] shadow-bento">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-white text-base">Inquire against your financial ledger</h4>
              <p className="text-white/50 mt-1 text-xs leading-relaxed">
                Ask about savings contraction, category surges, subscription price hikes, ML anomalies, or 30-day cash flow projections.
              </p>
            </div>

            {/* Suggested Question Chips */}
            <div className="pt-2 text-left space-y-2">
              <span className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest block text-center">
                Benchmark Investigation Queries
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {SUGGESTED_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-left font-medium text-white/80 hover:text-white transition-all flex items-center justify-between text-xs group"
                  >
                    <span>{q}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-white/40 group-hover:text-[#E8FF1F] group-hover:translate-x-0.5 transition-all shrink-0 ml-1.5" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isStreamingThis = isLoading && msg.role === 'assistant' && msg.message === '';
            const isExpanded = !!expandedSources[msg.id];

            return (
              <div
                key={msg.id}
                className={cn('flex gap-3 max-w-3xl', isUser ? 'ml-auto flex-row-reverse' : 'mr-auto')}
              >
                <div
                  className={cn(
                    'w-7 h-7 rounded-xl flex items-center justify-center shrink-0 font-bold',
                    isUser
                      ? 'bg-white text-black font-mono text-xs'
                      : 'bg-[#E8FF1F] text-black shadow-bento'
                  )}
                >
                  {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5 fill-current" />}
                </div>

                <div
                  className={cn(
                    'p-4 rounded-2xl relative',
                    isUser
                      ? 'bg-[#1E1E24] text-white border border-white/[0.1] rounded-tr-none'
                      : 'bg-[#0B0B0D] border border-white/[0.08] text-white rounded-tl-none shadow-bento'
                  )}
                >
                  {isUser ? (
                    <p className="leading-relaxed font-medium text-white">{msg.message}</p>
                  ) : (
                    <div>
                      {isStreamingThis ? (
                        <div className="flex items-center gap-2 text-white/50 py-1 font-mono text-xs">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#E8FF1F]" />
                          <span>Generating grounded financial response...</span>
                        </div>
                      ) : (
                        <div>{formatMessageText(msg.message)}</div>
                      )}

                      {/* Collapsible Source Evidence */}
                      {msg.supporting_data && (
                        <div className="mt-3 pt-2 border-t border-white/[0.08] text-[10px]">
                          <button
                            onClick={() => toggleSourceExpand(msg.id)}
                            className="flex items-center gap-1 font-mono font-bold text-[#E8FF1F] hover:underline"
                          >
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            <span>Verified Ledger Evidence (SQLite)</span>
                          </button>
                          {isExpanded && (
                            <pre className="mt-2 p-2.5 bg-black/60 text-white/70 rounded-xl overflow-x-auto text-[9px] font-mono max-h-44 border border-white/[0.06]">
                              {JSON.stringify(msg.supporting_data, null, 2)}
                            </pre>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Card Footer: Telemetry & Copy */}
                  <div className="flex items-center justify-between mt-2.5 pt-1.5 border-t border-white/[0.06] text-[9px] text-white/40 gap-2">
                    {!isUser && msg.provider ? (
                      <div className="flex items-center gap-2 flex-wrap font-mono">
                        <span className="flex items-center gap-1 text-white/50">
                          <ShieldCheck className="w-3 h-3 text-[#58B58C]" />
                          {msg.provider}
                        </span>
                        {msg.ttft_seconds !== undefined && msg.ttft_seconds > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-[#E8FF1F]/10 text-[#E8FF1F] font-mono font-bold flex items-center gap-0.5 border border-[#E8FF1F]/20">
                            <Zap className="w-2.5 h-2.5" />
                            TTFT {msg.ttft_seconds}s
                            {msg.tokens_per_second ? ` • ${msg.tokens_per_second} tok/s` : ''}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span />
                    )}

                    <div className="flex items-center gap-2">
                      {!isUser && msg.message && (
                        <button
                          onClick={() => handleCopyMessage(msg.id, msg.message)}
                          className="hover:text-white transition-colors flex items-center gap-1 font-mono"
                          title="Copy Markdown"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-[#58B58C]" />
                              <span className="text-[#58B58C]">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      )}
                      <span className="font-mono">
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Followups */}
      {followups.length > 0 && !isLoading && (
        <div className="px-5 py-2.5 border-t border-white/[0.06] bg-[#070709] flex items-center gap-2 overflow-x-auto shrink-0">
          <span className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#E8FF1F]" /> Next:
          </span>
          {followups.map((f, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(f)}
              className="px-3 py-1 rounded-full bg-white/[0.04] hover:bg-[#E8FF1F]/10 border border-white/[0.08] hover:border-[#E8FF1F]/30 text-white/70 hover:text-[#E8FF1F] text-[11px] font-mono font-medium whitespace-nowrap transition-all"
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {/* Input Bar */}
      <div className="p-4 border-t border-white/[0.08] bg-[#0B0B0D] shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask about spending increases, subscription price creep, duplicate debits..."
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#151518] border border-white/[0.1] text-white placeholder-white/30 focus:border-[#E8FF1F] focus:ring-1 focus:ring-[#E8FF1F] focus:outline-none text-xs"
          />

          {isLoading ? (
            <button
              type="button"
              onClick={handleStopGeneration}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all flex items-center gap-1.5 shadow-sm font-mono text-xs"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="px-4 py-2.5 rounded-xl bg-[#E8FF1F] hover:bg-[#d4eb17] text-black font-extrabold transition-all disabled:opacity-40 flex items-center gap-1.5 shadow-bento text-xs font-mono"
            >
              <Send className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Investigate</span>
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
