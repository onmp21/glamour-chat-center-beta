
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
  fileData?: {
    fileName?: string;
    mimeType?: string;
    base64?: string;
  };
}

export interface CursorPaginationResult<T> {
  data: T[];
  nextCursor?: string;
  hasMore: boolean;
}
