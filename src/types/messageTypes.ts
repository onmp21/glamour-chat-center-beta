
export interface FileData {
  base64: string;
  fileName: string;
  mimeType: string;
  size: number;
}

// Use centralized types from messages.ts
export type { 
  RawMessage, 
  ChannelMessage, 
  ChannelConversation 
} from './messages';

export interface ExtendedMessageData {
  conversationId: string;
  channelId: string;
  content: string;
  sender: string;
  agentName?: string;
  messageType?: string;
  fileData?: FileData;
}
