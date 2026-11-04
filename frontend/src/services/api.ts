import axios from 'axios';
import type {
  DashboardSummary,
  DashboardTrends,
  Transaction,
  TransactionCreate,
  Subscription,
  SubscriptionDetectResult,
  AnomalyItem,
  AnomalyAnalysisResponse,
  DuplicateAnalysisResponse,
  ForecastResponse,
  Recommendation,
  Alert,
  Budget,
  ChatMessage,
  ChatQueryResponse,
  ChatProviderStatus,
  CategorizeResponse,
  CSVImportResponse,
} from '../types';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => {
    // Detect HTML responses sent by static edge hosts when the backend endpoint isn't connected
    if (typeof response.data === 'string' && response.data.trim().toLowerCase().startsWith('<!doctype html>')) {
      return Promise.reject(new Error('Backend endpoint returned HTML. Verify backend server and API URL.'));
    }
    return response;
  },
  (error) => Promise.reject(error)
);

export const api = {
  // Dashboard
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const res = await apiClient.get<DashboardSummary>('/dashboard/summary');
    return res.data;
  },
  getDashboardTrends: async (): Promise<DashboardTrends> => {
    const res = await apiClient.get<DashboardTrends>('/dashboard/trends');
    return res.data;
  },

  // Transactions
  getTransactions: async (params?: Record<string, any>): Promise<Transaction[]> => {
    const res = await apiClient.get<Transaction[]>('/transactions', { params });
    return res.data;
  },
  createTransaction: async (data: TransactionCreate): Promise<Transaction> => {
    const res = await apiClient.post<Transaction>('/transactions', data);
    return res.data;
  },
  updateTransaction: async (id: number, data: Partial<TransactionCreate>): Promise<Transaction> => {
    const res = await apiClient.put<Transaction>(`/transactions/${id}`, data);
    return res.data;
  },
  deleteTransaction: async (id: number): Promise<void> => {
    await apiClient.delete(`/transactions/${id}`);
  },
  importTransactionsCSV: async (file: File): Promise<CSVImportResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<CSVImportResponse>('/transactions/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  exportTransactionsCSV: async (params?: Record<string, any>): Promise<Blob> => {
    const res = await apiClient.get('/transactions/export', {
      params,
      responseType: 'blob',
    });
    return res.data;
  },

  // Subscriptions
  getSubscriptions: async (): Promise<Subscription[]> => {
    const res = await apiClient.get<Subscription[]>('/subscriptions');
    return res.data;
  },
  detectSubscriptions: async (): Promise<SubscriptionDetectResult> => {
    const res = await apiClient.post<SubscriptionDetectResult>('/subscriptions/detect');
    return res.data;
  },
  updateSubscription: async (id: number, data: { status?: string; reviewed?: boolean }): Promise<Subscription> => {
    const res = await apiClient.patch<Subscription>(`/subscriptions/${id}`, data);
    return res.data;
  },

  // Anomalies (Isolation Forest)
  analyzeAnomalies: async (): Promise<AnomalyAnalysisResponse> => {
    const res = await apiClient.post<AnomalyAnalysisResponse>('/anomalies/analyze');
    return res.data;
  },
  getAnomalies: async (): Promise<AnomalyItem[]> => {
    const res = await apiClient.get<AnomalyItem[]>('/anomalies');
    return res.data;
  },

  // Duplicates
  getDuplicates: async (maxDays: number = 3): Promise<DuplicateAnalysisResponse> => {
    const res = await apiClient.get<DuplicateAnalysisResponse>('/duplicates', { params: { max_days: maxDays } });
    return res.data;
  },
  analyzeDuplicates: async (maxDays: number = 3): Promise<DuplicateAnalysisResponse> => {
    const res = await apiClient.post<DuplicateAnalysisResponse>('/duplicates/analyze', null, { params: { max_days: maxDays } });
    return res.data;
  },

  // Forecasting
  get7DayForecast: async (): Promise<ForecastResponse> => {
    const res = await apiClient.get<ForecastResponse>('/forecast/7-day');
    return res.data;
  },
  get30DayForecast: async (): Promise<ForecastResponse> => {
    const res = await apiClient.get<ForecastResponse>('/forecast/30-day');
    return res.data;
  },

  // Recommendations
  getRecommendations: async (): Promise<Recommendation[]> => {
    const res = await apiClient.get<Recommendation[]>('/recommendations');
    return res.data;
  },
  updateRecommendationStatus: async (id: number, status: string): Promise<Recommendation> => {
    const res = await apiClient.patch<Recommendation>(`/recommendations/${id}`, { status });
    return res.data;
  },

  // AI Investigator Chat
  sendChatMessage: async (message: string, model?: string): Promise<ChatQueryResponse> => {
    const res = await apiClient.post<ChatQueryResponse>('/chat', { message, model });
    return res.data;
  },
  streamChatMessage: async (
    message: string,
    model?: string,
    handlers?: {
      onMeta?: (meta: any) => void;
      onToken?: (token: string) => void;
      onDone?: (doneInfo: any) => void;
    },
    abortSignal?: AbortSignal
  ): Promise<void> => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
    const response = await fetch(`${apiBase}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, model }),
      signal: abortSignal,
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('ReadableStream not supported by browser.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const blocks = buffer.split('\n\n');
      buffer = blocks.pop() || '';

      for (const block of blocks) {
        if (!block.trim()) continue;
        const blockLines = block.split('\n');
        let eventType = '';
        let dataStr = '';

        for (const line of blockLines) {
          if (line.startsWith('event:')) {
            eventType = line.replace('event:', '').trim();
          } else if (line.startsWith('data:')) {
            dataStr = line.replace('data:', '').trim();
          }
        }

        if (dataStr) {
          try {
            const parsed = JSON.parse(dataStr);
            if (eventType === 'meta' && handlers?.onMeta) {
              handlers.onMeta(parsed);
            } else if (eventType === 'token' && handlers?.onToken) {
              handlers.onToken(parsed.token);
            } else if (eventType === 'done' && handlers?.onDone) {
              handlers.onDone(parsed);
            }
          } catch (e) {
            console.error('Failed to parse SSE payload', e);
          }
        }
      }
    }
  },
  getChatHistory: async (): Promise<ChatMessage[]> => {
    const res = await apiClient.get<ChatMessage[]>('/chat/history');
    return res.data;
  },
  getChatProviderStatus: async (model?: string): Promise<ChatProviderStatus> => {
    const params = model ? { model } : {};
    const res = await apiClient.get<ChatProviderStatus>('/chat/status', { params });
    return res.data;
  },
  clearChatHistory: async (): Promise<void> => {
    await apiClient.delete('/chat/history');
  },

  // Alerts
  getAlerts: async (params?: Record<string, any>): Promise<Alert[]> => {
    const res = await apiClient.get<Alert[]>('/alerts', { params });
    return res.data;
  },
  getUnreadAlertsCount: async (): Promise<number> => {
    const res = await apiClient.get<{ unread_count: number }>('/alerts/unread-count');
    return res.data.unread_count;
  },
  updateAlert: async (id: number, data: { is_read?: boolean; is_dismissed?: boolean }): Promise<Alert> => {
    const res = await apiClient.patch<Alert>(`/alerts/${id}`, data);
    return res.data;
  },

  // Budgets
  getBudgets: async (): Promise<Budget[]> => {
    const res = await apiClient.get<Budget[]>('/budgets');
    return res.data;
  },
  saveBudget: async (data: { category: string; monthly_limit: number }): Promise<Budget> => {
    const res = await apiClient.post<Budget>('/budgets', data);
    return res.data;
  },

  // AI Categorization
  categorizeText: async (description: string, merchant?: string, amount?: number): Promise<CategorizeResponse> => {
    const res = await apiClient.post<CategorizeResponse>('/ai/categorize', { description, merchant, amount });
    return res.data;
  },
  categorizeTransaction: async (description: string, merchant?: string, amount?: number): Promise<CategorizeResponse> => {
    const res = await apiClient.post<CategorizeResponse>('/ai/categorize', { description, merchant, amount });
    return res.data;
  },

  // System
  resetDemoData: async (): Promise<any> => {
    const res = await apiClient.post('/system/reset-demo');
    return res.data;
  },
  getSystemStatus: async (): Promise<any> => {
    const res = await apiClient.get('/system/status');
    return res.data;
  },
};
