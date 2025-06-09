
export interface DomainChannel {
  id: string;
  name: string;
  displayName: string;
  isActive: boolean;
  tableName: string;
  description?: string;
  icon?: string;
}

export interface ChannelStats {
  channelId: string;
  totalConversations: number;
  unreadConversations: number;
  activeConversations: number;
  resolvedConversations: number;
  lastActivity?: string;
}
