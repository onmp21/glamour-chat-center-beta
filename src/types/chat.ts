
export interface FileData {
  base64: string;
  fileName: string;
  mimeType: string;
  size: number;
}

export interface MessageSender {
  id: string;
  name: string;
  type: 'customer' | 'agent' | 'system';
}

export interface ChatMessage {
  id: string;
  content: string;
  timestamp: string;
  sender: MessageSender;
  messageType: 'text' | 'image' | 'audio' | 'video' | 'document';
  isOwn?: boolean;
  fileData?: FileData;
  metadata?: Record<string, any>;
}

export interface ConversationInfo {
  id: string;
  channelId: string;
  contactName: string;
  contactPhone: string;
  lastActivity: string;
  status: 'active' | 'pending' | 'resolved';
}
