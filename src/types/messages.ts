
export interface RawMessage {
  id: number;
  session_id: string;
  message: string;
  mensagemtype?: string;
  tipo_remetente?: string;
  nome_do_contato?: string;
  Nome_do_contato?: string;
  media_base64?: string;
  is_read?: boolean;
  read_at?: string;
  sender: string;
  timestamp: string;
  content: string;
}

export interface ChannelMessage {
  id: string;
  content: string;
  sender: string;
  timestamp: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'document';
  isFromUser: boolean;
  mediaUrl?: string;
  session_id: string;
  tipo_remetente?: string;
  mensagemtype?: string;
  Nome_do_contato?: string;
  nome_do_contato?: string;
  contactName?: string;
}

export interface ChannelConversation {
  id: string;
  contact_name: string;
  contact_phone: string;
  last_message: string;
  last_message_time: string | null;
  status: 'unread' | 'in_progress' | 'resolved';
  updated_at: string;
  unread_count: number;
  message_count?: number;
}

export interface CursorPaginationResult<T> {
  data: T[];
  hasMore: boolean;
  nextCursor?: string;
}

export interface ConversationStats {
  totalConversations: number;
  activeConversations: number;
  totalMessages: number;
  unreadMessages: number;
}
