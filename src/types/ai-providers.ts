
export interface AIProvider {
  id: string;
  name: string;
  provider_type: 'openai' | 'anthropic' | 'google' | 'custom';
  api_key: string;
  base_url?: string;
  default_model?: string;
  is_active: boolean;
  advanced_settings?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  test_status?: 'success' | 'failed' | 'pending';
}

export const PROVIDER_TYPES = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google',
  custom: 'Custom'
} as const;

export interface AIProviderFormData {
  name: string;
  provider_type: 'openai' | 'anthropic' | 'google' | 'custom';
  api_key: string;
  base_url?: string;
  default_model?: string;
  is_active: boolean;
  advanced_settings?: Record<string, any>;
}

export interface TestProviderResult {
  success: boolean;
  message: string;
}

export interface ReportResult {
  id: string;
  title: string;
  content: string;
  created_at: string;
  status: 'pending' | 'completed' | 'failed';
  provider_id: string;
  report_content: string;
  report_type: string;
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
  status: 'success' | 'failed';
  report_type: string;
  generated_report: string;
}
