export interface AIProvider {
  id: string;
  name: string;
  provider_type: 'openai' | 'google_gemini' | 'anthropic_claude' | 'custom';
  api_key?: string; // Não exposto na resposta da API
  base_url?: string;
  default_model: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_tested_at?: string;
  test_status: 'success' | 'error' | 'not_tested';
  test_message?: string;
  advanced_settings: Record<string, any>;
}

export interface AIProviderFormData {
  name: string;
  provider_type: 'openai' | 'google_gemini' | 'anthropic_claude' | 'custom';
  api_key: string;
  base_url?: string;
  default_model: string;
  is_active: boolean;
  advanced_settings?: Record<string, any>;
}

export interface TestProviderRequest {
  provider_type: string;
  api_key: string;
  base_url?: string;
  default_model: string;
  provider_id?: string;
}

export interface ReportGenerationRequest {
  provider_id: string;
  report_type: 'conversations' | 'channels' | 'custom';
  data: any;
  custom_prompt?: string;
  filters?: Record<string, any>;
}

export interface ReportResult {
  report: string;
  metadata: {
    report_id: number;
    generated_at: string;
    provider_type: string;
    provider_name: string;
    model: string;
    report_type: string;
    tokens_used: number;
    generation_time: number;
    data_summary: any;
  };
}

export interface ReportHistory {
  id: number;
  report_type: string;
  prompt: string;
  generated_report: string;
  provider_id: number;
  provider_name?: string;
  model_used: string;
  tokens_used: number;
  generation_time: number;
  created_at: string;
  metadata: Record<string, any>;
}

