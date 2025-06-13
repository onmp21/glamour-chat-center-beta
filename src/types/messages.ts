
export interface ChannelConversation {
  id: string;
  contact_name: string;
  contact_phone: string;
  last_message: string;
  last_message_time: string | null;
  status: 'unread' | 'in_progress' | 'resolved';
  updated_at: string;
  unread_count?: number;
}

export interface ChannelMessage {
  id: string;
  content: string;
  timestamp: string;
  sender: 'customer' | 'agent';
  isOwn?: boolean;
  agentName?: string;
  contactName?: string;
  contactPhone?: string;
  messageType?: 'text' | 'image' | 'audio' | 'video' | 'document' | 'human' | 'ai';
  tipo_remetente?: string;
  Nome_do_contato?: string;
  nome_do_contato?: string;
  mensagemtype?: string;
}

export interface ProcessedMessage {
  id: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
  contactName: string;
  contactPhone: string;
  agentName?: string;
  tipo_remetente?: string;
  Nome_do_contato?: string;
  mensagemtype?: string;
}

export interface RawMessage {
  id: string; // Keep as string for consistency
  session_id: string;
  message: string;
  read_at: string;
  Nome_do_contato: string;
  mensagemtype: string;
  tipo_remetente: string;
  media_base64?: string;
  sender?: 'customer' | 'agent';
  timestamp?: string;
  content?: string;
  nome_do_contato?: string; // Add missing property for compatibility
}
