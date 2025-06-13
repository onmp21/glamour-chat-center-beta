export interface RawMessage {
  id: string;
  session_id: string;
  message: string;
  sender: 'customer' | 'agent';
  timestamp: string;
  content: string;
  tipo_remetente?: string;
  mensagemtype?: string;
  Nome_do_contato?: string;
  nome_do_contato?: string;
  media_base64?: string;
  read_at?: string;
  is_read?: boolean;
}

export interface ChannelMessage {
  id: string;
  content: string;
  timestamp: string;
  sender: 'customer' | 'agent';
  tipo_remetente?: string;
  messageType?: string;
  Nome_do_contato?: string;
  nome_do_contato?: string;
  mensagemtype?: string;
  contactName?: string;
  isOwn?: boolean;
  agentName?: string;
  fileData?: {
    fileName?: string;
    mimeType?: string;
    base64?: string;
  };
}

export interface ChannelConversation {
  id: string;
  contact_name: string;
  contact_phone: string;
  last_message: string;
  last_message_time: string;
  status: 'unread' | 'in_progress' | 'resolved';
  message_count?: number;
  updated_at: string;
  unread_count: number;
}

export interface CursorPaginationResult<T> {
  data: T[];
  nextCursor?: string;
  hasMore: boolean;
}
