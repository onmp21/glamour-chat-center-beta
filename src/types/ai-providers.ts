
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
  content: string;
  created_at: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface ReportHistory {
  id: string;
  title: string;
  generated_at: string;
  provider_used: string;
  status: 'success' | 'failed';
}
