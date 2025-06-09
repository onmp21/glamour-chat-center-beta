
import React, { useState, useEffect, useCallback } from 'react';
import { ConversationItem } from './chat/ConversationItem';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChannels } from '@/contexts/ChannelContext';
import { usePermissions } from '@/hooks/usePermissions';
import { ChannelService } from '@/services/ChannelService';
import { ConversationGrouper } from '@/utils/ConversationGrouper';
import { ChannelConversation } from '@/types/messages';
import { Button } from '@/components/ui/button';
import { RefreshCw, Filter, Search, MessageCircle, Users, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { extractPhoneFromSessionId } from '@/utils/sessionIdParser';

interface UnifiedConversation extends ChannelConversation {
  channelId: string;
  message_count: number;
}

interface ChannelsPageLayoutProps {
  isDarkMode: boolean;
  onNavigateToChat: (channelId: string, conversationId: string) => void;
}

export const ChannelsPageLayout: React.FC<ChannelsPageLayoutProps> = ({
  isDarkMode,
  onNavigateToChat
}) => {
  const { channels } = useChannels();
  const { getAccessibleChannels } = usePermissions();
  const [conversations, setConversations] = useState<UnifiedConversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<UnifiedConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Stats para exibição
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    inProgress: 0,
    resolved: 0
  });

  const loadAllConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const accessibleChannelIds = getAccessibleChannels();
      
      if (accessibleChannelIds.length === 0) {
        setConversations([]);
        setFilteredConversations([]);
        setLoading(false);
        return;
      }

      const allConversationsPromises = accessibleChannelIds.map(async channelId => {
        try {
          const channelService = new ChannelService(channelId);
          const rawMessages = await channelService.fetchMessages();
          const grouped = ConversationGrouper.groupMessagesByPhone(rawMessages, channelId);
          
          return grouped.map(conv => ({
            ...conv,
            channelId,
            message_count: rawMessages.filter(msg => extractPhoneFromSessionId(msg.session_id) === conv.contact_phone).length || 0
          }));
        } catch (error) {
          console.error(`Error loading conversations for channel ${channelId}:`, error);
          return [];
        }
      });

      const results = await Promise.all(allConversationsPromises);
      const allConversations = results.flat();
      
      const sortedConversations = allConversations.sort((a, b) => {
        const timeA = a.last_message_time ? new Date(a.last_message_time).getTime() : 0;
        const timeB = b.last_message_time ? new Date(b.last_message_time).getTime() : 0;
        return timeB - timeA;
      });
      
      setConversations(sortedConversations);
      setFilteredConversations(sortedConversations);
      
      // Calcular estatísticas
      const newStats = {
        total: sortedConversations.length,
        unread: sortedConversations.filter(c => c.status === 'unread').length,
        inProgress: sortedConversations.filter(c => c.status === 'in_progress').length,
        resolved: sortedConversations.filter(c => c.status === 'resolved').length
      };
      setStats(newStats);
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg);
      setConversations([]);
      setFilteredConversations([]);
    } finally {
      setLoading(false);
    }
  }, [getAccessibleChannels]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllConversations();
    setRefreshing(false);
  };

  // Filtrar conversas
  useEffect(() => {
    let filtered = conversations;

    // Filtro por canal
    if (selectedChannel !== 'all') {
      filtered = filtered.filter(conv => conv.channelId === selectedChannel);
    }

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(conv => 
        conv.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.contact_phone?.includes(searchTerm) ||
        conv.last_message?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredConversations(filtered);
  }, [conversations, selectedChannel, searchTerm]);

  useEffect(() => {
    loadAllConversations();
    
    const interval = setInterval(() => {
      loadAllConversations();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [loadAllConversations]);

  const handleConversationClick = (channelId: string, conversationId: string) => {
    onNavigateToChat(channelId, conversationId);
  };

  const accessibleChannels = getAccessibleChannels();
  const channelOptions = channels.filter(ch => accessibleChannels.includes(ch.id));

  return (
    <div className={cn("flex h-full flex-col", isDarkMode ? "bg-[#09090b]" : "bg-gray-50")}>
      {/* Header Section */}
      <div className={cn(
        "px-6 py-4 border-b bg-white/50 backdrop-blur-sm",
        isDarkMode ? "border-[#3f3f46] bg-[#18181b]/50" : "border-gray-200"
      )}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className={cn(
              "text-2xl font-bold flex items-center gap-2",
              isDarkMode ? "text-white" : "text-gray-900"
            )}>
              <MessageCircle className="h-6 w-6 text-[#b5103c]" />
              Central de Conversas
            </h1>
            <p className={cn(
              "text-sm mt-1",
              isDarkMode ? "text-gray-400" : "text-gray-600"
            )}>
              Gerencie todas as conversas de todos os canais em um só lugar
            </p>
          </div>
          
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className={cn(
              "gap-2",
              isDarkMode ? "border-[#3f3f46] hover:bg-[#27272a]" : ""
            )}
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            Atualizar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className={cn(
            "p-3 rounded-lg border",
            isDarkMode ? "bg-[#27272a] border-[#3f3f46]" : "bg-white border-gray-200"
          )}>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-blue-500" />
              <span className={cn("text-xs font-medium", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                Total
              </span>
            </div>
            <p className={cn("text-lg font-bold mt-1", isDarkMode ? "text-white" : "text-gray-900")}>
              {stats.total}
            </p>
          </div>
          
          <div className={cn(
            "p-3 rounded-lg border",
            isDarkMode ? "bg-[#27272a] border-[#3f3f46]" : "bg-white border-gray-200"
          )}>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              <span className={cn("text-xs font-medium", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                Não Lidas
              </span>
            </div>
            <p className={cn("text-lg font-bold mt-1", isDarkMode ? "text-white" : "text-gray-900")}>
              {stats.unread}
            </p>
          </div>
          
          <div className={cn(
            "p-3 rounded-lg border",
            isDarkMode ? "bg-[#27272a] border-[#3f3f46]" : "bg-white border-gray-200"
          )}>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-yellow-500" />
              <span className={cn("text-xs font-medium", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                Em Andamento
              </span>
            </div>
            <p className={cn("text-lg font-bold mt-1", isDarkMode ? "text-white" : "text-gray-900")}>
              {stats.inProgress}
            </p>
          </div>
          
          <div className={cn(
            "p-3 rounded-lg border",
            isDarkMode ? "bg-[#27272a] border-[#3f3f46]" : "bg-white border-gray-200"
          )}>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className={cn("text-xs font-medium", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                Resolvidas
              </span>
            </div>
            <p className={cn("text-lg font-bold mt-1", isDarkMode ? "text-white" : "text-gray-900")}>
              {stats.resolved}
            </p>
          </div>
        </div>

        {/* Filters Section */}
        <div className="flex gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome, telefone ou mensagem..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn(
                  "pl-10",
                  isDarkMode ? "bg-[#27272a] border-[#3f3f46]" : ""
                )}
              />
            </div>
          </div>
          
          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
            className={cn(
              "px-3 py-2 rounded-md border text-sm",
              isDarkMode 
                ? "bg-[#27272a] border-[#3f3f46] text-white" 
                : "bg-white border-gray-200"
            )}
          >
            <option value="all">Todos os Canais</option>
            {channelOptions.map(channel => (
              <option key={channel.id} value={channel.id}>
                {channel.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          {loading && (
            <div className="flex items-center justify-center p-12">
              <div className={cn("animate-spin rounded-full h-8 w-8 border-b-2", isDarkMode ? "border-white" : "border-gray-900")}></div>
              <span className={cn("ml-3 text-lg", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                Carregando conversas...
              </span>
            </div>
          )}
          
          {!loading && error && (
            <div className="flex items-center justify-center p-12 text-red-500">
              <div className="text-center">
                <p className="text-lg font-medium">Ocorreu um erro</p>
                <p className="text-sm mt-1">{error}</p>
                <Button onClick={handleRefresh} className="mt-4" variant="outline">
                  Tentar Novamente
                </Button>
              </div>
            </div>
          )}
          
          {!loading && !error && filteredConversations.length === 0 && (
            <div className="flex items-center justify-center p-12">
              <div className="text-center">
                <MessageCircle className={cn("h-12 w-12 mx-auto mb-4", isDarkMode ? "text-gray-600" : "text-gray-400")} />
                <p className={cn("text-lg font-medium", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                  {searchTerm || selectedChannel !== 'all' ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa recente'}
                </p>
                <p className={cn("text-sm mt-1", isDarkMode ? "text-gray-500" : "text-gray-500")}>
                  {searchTerm || selectedChannel !== 'all' ? 'Tente ajustar os filtros' : 'As conversas aparecerão aqui quando houver atividade'}
                </p>
              </div>
            </div>
          )}
          
          {!loading && !error && filteredConversations.length > 0 && (
            <div className="space-y-2 p-4">
              {filteredConversations.map(conversation => (
                <div
                  key={`${conversation.channelId}-${conversation.id}`}
                  className={cn(
                    "p-4 rounded-lg border transition-all hover:shadow-md cursor-pointer",
                    isDarkMode 
                      ? "bg-[#18181b] border-[#3f3f46] hover:bg-[#27272a]" 
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  )}
                  onClick={() => handleConversationClick(conversation.channelId, conversation.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className={cn("font-medium", isDarkMode ? "text-white" : "text-gray-900")}>
                          {conversation.contact_name || 'Contato sem nome'}
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                          {channels.find(ch => ch.id === conversation.channelId)?.name || conversation.channelId}
                        </Badge>
                        <div className={cn(
                          "h-2 w-2 rounded-full",
                          conversation.status === 'unread' ? "bg-red-500" :
                          conversation.status === 'in_progress' ? "bg-yellow-500" : "bg-green-500"
                        )} />
                      </div>
                      
                      <p className={cn("text-sm mb-1", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                        {conversation.contact_phone}
                      </p>
                      
                      <p className={cn("text-sm line-clamp-2", isDarkMode ? "text-gray-300" : "text-gray-700")}>
                        {conversation.last_message || 'Sem mensagem'}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                        <Clock className="h-3 w-3" />
                        {conversation.last_message_time ? 
                          new Date(conversation.last_message_time).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'Sem data'
                        }
                      </div>
                      
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Users className="h-3 w-3" />
                        {conversation.message_count} msgs
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};
