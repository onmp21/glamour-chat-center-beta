
export interface ApiInstance {
  id: string; // Required in base interface
  instance_name: string;
  base_url: string;
  api_key: string;
  created_at: string; // Make required for consistency
  updated_at?: string;
  connection_status?: 'connected' | 'disconnected' | 'connecting' | 'unknown';
  qr_code?: string;
}

export interface ApiInstanceWithConnection extends ApiInstance {
  // All properties are inherited, id is required from base
  // created_at is also required from base
  qr_code?: string;
  connection_status?: 'connected' | 'disconnected' | 'connecting' | 'unknown';
}
