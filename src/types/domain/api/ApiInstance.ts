
export interface ApiInstance {
  id?: string;
  instance_name: string;
  base_url: string;
  api_key: string;
  created_at?: string;
  updated_at?: string;
}

export interface ApiInstanceWithConnection extends ApiInstance {
  qr_code?: string;
  connection_status?: 'connected' | 'disconnected' | 'connecting';
}

export interface InstanceInfo {
  instanceName: string;
  profileName?: string;
  number?: string;
  status: string;
  serverUrl?: string;
  apikey?: string;
  owner?: string;
  profilePictureUrl?: string;
  integration?: string;
}
