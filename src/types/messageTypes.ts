
export interface FileData {
  base64: string;
  mimeType: string;
  fileName: string;
  size?: number;
}

export interface ExtendedMessageData {
  conversationId: string;
  channelId: string;
  content: string;
  sender: 'customer' | 'agent';
  agentName?: string;
  messageType?: 'text' | 'file' | 'audio' | 'image' | 'video';
  fileData?: FileData;
}

export interface RawMessage {
  id: number;
  session_id: string;
  message: string;
  media_base64?: string;
  Nome_do_contato?: string;
  nome_do_contato?: string;
  read_at?: string;
  tipo_remetente?: string;
  mensagemtype?: string;
  is_read?: boolean;
}
