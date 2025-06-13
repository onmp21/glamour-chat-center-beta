
export interface RawMessage {
  id: number;
  session_id: string;
  message: string;
  mensagemtype?: string;
  tipo_remetente?: string;
  nome_do_contato?: string;
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
