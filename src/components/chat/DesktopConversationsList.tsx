
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useChannelConversations } from '@/hooks/useChannelConversations';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';

interface DesktopConversationsListProps {
  isDarkMode: boolean;
  activeChannel: string;
  activeConversation: string | null;
  onConversationSelect: (conversationId: string) => void;
}

export const DesktopConversationsList: React.FC<DesktopConversationsListProps> = ({
  isDarkMode,
  activeChannel,
  activeConversation,
  onConversationSelect
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { conversations, loading } = useChannelConversations(activeChannel);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unread':
        return 'bg-red-500';
      case 'in_progress':
        return 'bg-yellow-500';
      case 'resolved':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'unread':
        return 'Não lida';
      case 'in_progress':
        return 'Em andamento';
      case 'resolved':
        return 'Resolvida';
      default:
        return status;
    }
  };

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const filteredConversations = conversations.filter(conv => 
    conv.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (conv.last_message && conv.last_message.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className={cn(
      "w-96 border-r h-full flex flex-col",
    )} style={{ backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff", borderColor: isDarkMode ? "#2a2a2a" : "#e5e7eb" }}>
      <Card className={cn(
        "border-0 border-r rounded-none h-full flex flex-col shadow-none",
        isDarkMode ? "dark-bg-secondary dark-border" : "bg-white"
      )}>
        <CardHeader className="pb-4 p-6 border-b flex-shrink-0" style={{ borderColor: isDarkMode ? "#2a2a2a" : "#f1f5f9" }}>
          <CardTitle className={cn(
            "text-lg flex items-center font-semibold",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            Conversas
          </CardTitle>
          <div className="relative mt-3">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar conversas..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className={cn(
                "pl-10 rounded-full border-2",
                isDarkMode
                  ? "dark-bg-primary dark-border text-white placeholder:text-gray-400 focus:border-[#b5103c]"
                  : "bg-gray-50 border-gray-200 focus:border-[#b5103c]"
              )}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
                <p className={cn("mt-2", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                  Carregando conversas...
                </p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center">
                <p className={cn("text-sm", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                  {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa neste canal'}
                </p>
              </div>
            ) : (
              filteredConversations.map(conversation => {
                return (
                  <div
                    key={conversation.id}
                    onClick={() => onConversationSelect(conversation.id)}
                    className={cn(
                      "p-4 hover:bg-primary/5 cursor-pointer transition-all duration-200 border-b border-opacity-20",
                      activeConversation === conversation.id && (isDarkMode ? "bg-[#b5103c]/10 border-l-4 border-l-[#b5103c]" : "bg-[#b5103c]/5 border-l-4 border-l-[#b5103c]"),
                      isDarkMode ? "border-gray-700 hover:bg-gray-800" : "border-gray-100 hover:bg-gray-50"
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className={cn("font-semibold text-sm", isDarkMode ? "text-white" : "text-gray-900")}>
                        {conversation.contact_name}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-xs", isDarkMode ? "text-gray-400" : "text-gray-500")}>
                          {formatTime(conversation.last_message_time)}
                        </span>
                      </div>
                    </div>
                    <p className={cn("text-xs leading-relaxed truncate", isDarkMode ? "text-gray-300" : "text-gray-600")}>
                      {conversation.last_message || 'Sem mensagens'}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
