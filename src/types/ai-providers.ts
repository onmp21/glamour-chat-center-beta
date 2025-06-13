
export const PROVIDER_TYPES = ['openai', 'anthropic', 'google', 'custom'] as const;
export type ProviderType = typeof PROVIDER_TYPES[number];

export interface AIProvider {
  id: string;
  name: string;
  provider_type: ProviderType;
  api_key?: string;
  base_url?: string;
  default_model?: string;
  advanced_settings?: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface AIProviderFormData {
  name: string;
  provider_type: ProviderType;
  api_key: string;
  base_url?: string;
  default_model?: string;
  is_active: boolean;
  advanced_settings?: Record<string, any>;
}

export interface ReportResult {
  id: string;
  title: string;
  content: string;
  created_at: string;
  provider_id: string;
  report_content: string;
  report_type: string;
  status: string;
}

export interface ReportHistory {
  id: string;
  title: string;
  prompt: string;
  generated_at: string;
  created_at: string;
  provider_used: string;
  provider_id: string;
  provider_name: string;
  model_used: string;
  tokens_used: number;
  generation_time: number;
  metadata: Record<string, any>;
  query: string;
  result: ReportResult;
  timestamp: string;
  status: string;
  report_type: string;
  generated_report: string;
}
