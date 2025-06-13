
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
  id?: string;
  session_id: string; // numero do cliente
  message: string; // texto ou base64 da mensagem
  read_at: string; // hora que a mensagem foi enviada (horário de Brasília)
  Nome_do_contato: string; // nome do cliente
  mensagemtype: string; // audioMenssage, imageMenssage, videoMenssage, stickerMessage ou conversation
  tipo_remetente: string; // quem enviou a mensagem "nome do cliente" ou "nome do canal"
}
