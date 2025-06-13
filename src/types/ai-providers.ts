
export interface AIProvider {
  id: string;
  name: string;
  provider_type: string;
  api_key: string;
  base_url?: string;
  default_model?: string;
  is_active: boolean;
  advanced_settings?: any;
  created_at: string;
  updated_at: string;
  test_status?: 'success' | 'error' | 'pending';
}

export interface AIProviderFormData {
  name: string;
  provider_type: string;
  api_key: string;
  base_url?: string;
  default_model?: string;
  is_active: boolean;
  advanced_settings?: any;
}

export interface ReportResult {
  id: string;
  title: string;
  content: string;
  created_at: string;
  provider_id: string;
  report_content: string; // Add missing property
  report_type: string; // Add missing property
}

export interface ReportHistory {
  id: string;
  query: string;
  result: ReportResult;
  timestamp: string;
  prompt: string; // Add missing property
  created_at: string; // Add missing property
  generated_report: string; // Add missing property
  report_type: string; // Add missing property
  provider_id: string;
  provider_name: string;
  model_used: string;
  tokens_used: number;
  generation_time: number;
  metadata: any;
}

export const PROVIDER_TYPES = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google',
  custom: 'Custom'
} as const;

export const DEFAULT_MODELS = {
  openai: 'gpt-4',
  anthropic: 'claude-3-sonnet',
  google: 'gemini-pro',
  custom: ''
} as const;

export type ProviderType = keyof typeof PROVIDER_TYPES;
