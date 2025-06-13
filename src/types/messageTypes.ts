
export interface FileData {
  base64: string;
  mimeType: string;
  fileName: string;
  size?: number;
  duration?: number;
}

export interface ExtendedMessageData {
  conversationId: string;
  channelId: string;
  content: string;
  sender: 'customer' | 'agent';
  agentName?: string;
  messageType?: 'text' | 'file' | 'audio' | 'image' | 'video' | 'document';
  fileData?: FileData;
}

// Use the same RawMessage interface as in messages.ts to avoid conflicts
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
