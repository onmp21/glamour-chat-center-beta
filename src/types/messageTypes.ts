
export interface FileData {
  base64: string;
  mimeType: string;
  fileName: string;
  size?: number;
  duration?: number; // Adicionar duration para áudio
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

export interface RawMessage {
  id: string; // Manter como string para consistência
  session_id: string;
  message: string;
  read_at: string;
  Nome_do_contato: string;
  mensagemtype: string;
  tipo_remetente: string;
  sender?: 'customer' | 'agent';
  timestamp?: string;
  content?: string;
}
