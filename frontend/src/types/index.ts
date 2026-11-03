export interface Transaction {
  id: number;
  merchant: string;
  description: string;
  amount: number;
  transaction_type: 'income' | 'expense';
  category: string;
  payment_method: string;
  transaction_date: string;
  reference?: string | null;
  import_batch_id?: number | null;
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
}

export interface TransactionCreate {
  merchant: string;
  description: string;
  amount: number;
  transaction_type: string;
  category: string;
  payment_method: string;
  transaction_date: string;
  reference?: string | null;
  is_recurring?: boolean;
}

export interface Subscription {
  id: number;
  merchant: string;
  category: string;
  average_amount: number;
  latest_amount: number;
  frequency: string;
  estimated_next_date: string;
  last_payment_date: string;
  detection_confidence: number;
  status: 'active' | 'price_increase' | 'possibly_unused' | 'dismissed';
  price_change_amount: number;
  reviewed: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionDetectResult {
  total_subscriptions_detected: number;
  active_subscriptions: number;
  potential_monthly_leakage: number;
  price_increases_detected: number;
  subscriptions: Subscription[];
}

export interface Alert {
  id: number;
  transaction_id?: number | null;
  alert_type: 'unusual_transaction' | 'potential_duplicate' | 'price_increase' | 'upcoming_recurring' | 'spending_spike' | 'budget_exceeded' | 'subscription_leakage';
  severity: 'info' | 'warning' | 'high';
  title: string;
  description: string;
  recommended_action?: string | null;
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
}

export interface Recommendation {
  id: number;
  title: string;
  description: string;
  reason: string;
  related_category?: string | null;
  estimated_impact: number;
  priority: 'high' | 'medium' | 'low';
  status: 'active' | 'reviewed' | 'dismissed' | 'implemented';
  suggested_action?: string | null;
  created_at: string;
}

export interface Budget {
  id: number;
  category: string;
  monthly_limit: number;
  current_spent: number;
  percentage_used: number;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  message: string;
  intent?: string | null;
  provider?: string | null;
  model?: string | null;
  created_at: string;
  supporting_data?: Record<string, any>;
  latency_seconds?: number;
  ttft_seconds?: number;
  tokens_per_second?: number;
}

export interface ChatQueryResponse {
  response: string;
  intent: string;
  supporting_data?: Record<string, any>;
  suggested_followups: string[];
  provider?: string;
  model?: string;
  grounded?: boolean;
  latency_seconds?: number;
  ttft_seconds?: number;
}

export interface ChatProviderStatus {
  configured_provider: string;
  active_provider: string;
  model: string;
  status: string;
  is_available: boolean;
  fallback_available: boolean;
  available_models?: string[];
}

export interface DashboardSummary {
  total_income: number;
  total_expenses: number;
  net_savings: number;
  available_balance: number;
  potential_monthly_leakage: number;
  active_subscriptions_count: number;
  unusual_transactions_count: number;
  unread_alerts_count: number;
  financial_health_score: number;
  financial_health_summary: string;
  recent_transactions: Transaction[];
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

export interface CategorySpending {
  category: string;
  total_amount: number;
  percentage: number;
  transaction_count: number;
}

export interface DashboardTrends {
  monthly_trends: MonthlyTrend[];
  category_breakdown: CategorySpending[];
  daily_spend_last_30_days: { date: string; display_date: string; amount: number }[];
}

export interface AnomalyItem {
  transaction_id: number;
  merchant: string;
  category: string;
  amount: number;
  transaction_date: string;
  anomaly_score: number;
  risk_level: 'low' | 'medium' | 'high';
  reason: string;
  category_baseline: number;
  recommended_action: string;
}

export interface AnomalyAnalysisResponse {
  total_evaluated: number;
  anomalies_detected: number;
  model_trained: boolean;
  contamination: number;
  message: string;
  anomalies: AnomalyItem[];
}

export interface DuplicateCandidatePair {
  id_pair: string;
  transaction_1: Transaction;
  transaction_2: Transaction;
  similarity_reason: string;
  day_difference: number;
  amount: number;
  merchant: string;
  status: string;
}

export interface DuplicateAnalysisResponse {
  total_potential_duplicates: number;
  total_flagged_amount: number;
  candidates: DuplicateCandidatePair[];
}

export interface DailyForecast {
  date: string;
  projected_income: number;
  projected_expenses: number;
  expected_net: number;
  notes: string[];
}

export interface ForecastResponse {
  horizon_days: number;
  projected_total_income: number;
  projected_total_expenses: number;
  projected_net_savings: number;
  upcoming_subscriptions_cost: number;
  methodology: string;
  daily_projections: DailyForecast[];
}

export interface CategorizeResponse {
  category: string;
  confidence: number;
  method: string;
  explanation: string;
}

export interface CSVImportResponse {
  batch_id: number;
  filename: string;
  imported_count: number;
  rejected_count: number;
  duplicate_count: number;
  errors: string[];
  sample_imported: Transaction[];
}

