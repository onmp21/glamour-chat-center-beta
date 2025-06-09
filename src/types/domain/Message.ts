
export interface DomainMessage {
  id: string;
  content: string;
  timestamp: string;
  sender: 'customer' | 'agent';
  contactName: string;
  contactPhone: string;
  messageType: 'human' | 'ai';
  sessionId: string;
}

export interface DomainConversation {
  id: string;
  contactName: string;
  contactPhone: string;
  lastMessage: string | null;
  lastMessageTime: string | null;
  status: 'unread' | 'in_progress' | 'resolved';
  unreadCount?: number;
  updatedAt: string;
}

export interface MessageSendRequest {
  conversationId: string;
  channelId: string;
  content: string;
  sender: 'customer' | 'agent';
  agentName?: string;
}
