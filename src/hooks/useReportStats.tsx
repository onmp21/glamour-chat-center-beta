
import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';

export function useReportStats(startDate: Date, endDate: Date) {
  const [performanceStats, setPerformanceStats] = useState<any[]>([]);
  const [conversationStats, setConversationStats] = useState<any[]>([]);
  const [channelStats, setChannelStats] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Buscar canais
        const { data: channelsData, error: channelsError } = await supabase
          .from('channels')
          .select('*');
        
        if (channelsError) throw channelsError;
        setChannels(channelsData || []);
        
        // Para cada canal, buscar dados da tabela correspondente
        const allConversations: any[] = [];
        
        // Mapeamento de canais para suas respectivas tabelas
        const channelTableMap: { [key: string]: string } = {
          'af1e5797-edc6-4ba3-a57a-25cf7297c4d6': 'yelena_ai_conversas',
          'd2892900-ca8f-4b08-a73f-6b7aa5866ff7': 'gerente_externo_conversas',
          'gustavo': 'gerente_lojas_conversas',
          'canarana': 'canarana_conversas',
          'souto-soares': 'souto_soares_conversas',
          'joao-dourado': 'joao_dourado_conversas',
          'america-dourada': 'america_dourada_conversas'
        };
        
        // Buscar dados de cada tabela de canal
        for (const channel of channelsData || []) {
          const tableName = channelTableMap[channel.id] || channelTableMap[channel.type];
          if (!tableName) continue;
          
          try {
            const { data: tableData, error: tableError } = await supabase
              .from(tableName as any)
              .select('*')
              .limit(100)
              .order('id', { ascending: false });
            
            if (tableError) {
              console.error(`Erro ao buscar dados de ${tableName}:`, tableError);
              continue;
            }
            
            // Processar dados se existirem
            if (tableData && Array.isArray(tableData)) {
              const dataWithChannel = tableData
                .filter(item => item !== null && typeof item === 'object')
                .map(item => {
                  // Type guard to ensure item has required properties
                  if (!item || typeof item !== 'object') return null;
                  
                  // Safely access properties with fallbacks
                  const id = (item as any).id || Math.random();
                  const message = (item as any).message || '';
                  const session_id = (item as any).session_id || 'unknown';
                  const tipo_remetente = (item as any).tipo_remetente || 'CONTATO_EXTERNO';
                  const nome_do_contato = (item as any).nome_do_contato || (item as any).Nome_do_contato || 'Cliente';
                  const timestamp = new Date().toISOString();
                  
                  return {
                    id: id.toString(),
                    channel_id: channel.id,
                    channel_name: channel.name,
                    content: message,
                    timestamp,
                    sender: tipo_remetente === 'USUARIO_INTERNO' || tipo_remetente === 'Yelena-ai' ? 'agent' : 'customer',
                    session_id,
                    contact_name: nome_do_contato
                  };
                })
                .filter(item => item !== null);
              
              allConversations.push(...dataWithChannel);
            }
          } catch (error) {
            console.error(`Erro ao processar tabela ${tableName}:`, error);
          }
        }
        
        // Agrupar mensagens por sessão para formar conversas
        const conversationsMap = new Map();
        allConversations.forEach(message => {
          if (!message || !message.session_id) return;
          
          if (!conversationsMap.has(message.session_id)) {
            conversationsMap.set(message.session_id, {
              session_id: message.session_id,
              channel_id: message.channel_id || 'unknown',
              channel_name: message.channel_name || 'Desconhecido',
              contact_name: message.contact_name || 'Cliente',
              last_message: message.content || '',
              last_timestamp: message.timestamp,
              message_count: 1
            });
          } else {
            const conv = conversationsMap.get(message.session_id);
            if (conv) {
              conv.message_count += 1;
              if (new Date(message.timestamp) > new Date(conv.last_timestamp)) {
                conv.last_message = message.content || '';
                conv.last_timestamp = message.timestamp;
              }
              if (message.sender !== 'agent' && !conv.contact_name) {
                conv.contact_name = message.contact_name || 'Cliente';
              }
            }
          }
        });
        
        setConversations(Array.from(conversationsMap.values()));
        
        // Gerar estatísticas de performance
        const performanceData = channelsData?.map(channel => {
          const channelMessages = allConversations.filter(m => m && m.channel_id === channel.id) || [];
          const responseTimeSum = channelMessages.reduce((sum, msg, i, arr) => {
            if (i > 0 && msg && arr[i-1] && msg.sender === 'agent' && arr[i-1].sender !== 'agent') {
              const responseTime = new Date(msg.timestamp).getTime() - new Date(arr[i-1].timestamp).getTime();
              return sum + responseTime;
            }
            return sum;
          }, 0);
          
          const responseCount = channelMessages.filter((msg, i, arr) => 
            i > 0 && msg && arr[i-1] && msg.sender === 'agent' && arr[i-1].sender !== 'agent'
          ).length;
          
          return {
            channel_id: channel.id,
            channel_name: channel.name,
            message_count: channelMessages.length,
            avg_response_time: responseCount > 0 ? responseTimeSum / responseCount / 1000 : 0,
            first_response_time: 120, // Placeholder
            resolution_rate: 0.85, // Placeholder
            customer_satisfaction: 4.2, // Placeholder
          };
        }) || [];
        
        setPerformanceStats(performanceData);
        
        // Gerar estatísticas de conversas usando dados processados
        const conversationData = Array.from(conversationsMap.values()).map(conv => {
          const convMessages = allConversations.filter(m => m && m.session_id === conv.session_id) || [];
          const customerMessages = convMessages.filter(m => m && m.sender !== 'agent');
          const agentMessages = convMessages.filter(m => m && m.sender === 'agent');
          
          return {
            session_id: conv.session_id,
            channel_id: conv.channel_id,
            channel_name: conv.channel_name,
            contact_name: conv.contact_name || conv.session_id,
            message_count: convMessages.length,
            customer_message_count: customerMessages.length,
            agent_message_count: agentMessages.length,
            first_message: convMessages[0]?.content || '',
            first_timestamp: convMessages[0]?.timestamp || '',
            last_message: convMessages[convMessages.length - 1]?.content || '',
            last_timestamp: convMessages[convMessages.length - 1]?.timestamp || '',
            duration: convMessages.length > 1 
              ? (new Date(convMessages[convMessages.length - 1].timestamp).getTime() - new Date(convMessages[0].timestamp).getTime()) / 1000 / 60
              : 0,
            status: Math.random() > 0.3 ? 'resolved' : 'open', // Placeholder
          };
        });
        
        setConversationStats(conversationData);
        
        // Gerar estatísticas de canais
        const channelData = channelsData?.map(channel => {
          const channelConversations = conversationData.filter(c => c.channel_id === channel.id);
          const totalMessages = channelConversations.reduce((sum, conv) => sum + conv.message_count, 0);
          const resolvedConversations = channelConversations.filter(c => c.status === 'resolved');
          
          return {
            channel_id: channel.id,
            channel_name: channel.name,
            conversation_count: channelConversations.length,
            message_count: totalMessages,
            avg_messages_per_conversation: channelConversations.length > 0 
              ? totalMessages / channelConversations.length 
              : 0,
            resolution_rate: channelConversations.length > 0 
              ? resolvedConversations.length / channelConversations.length 
              : 0,
            avg_response_time: performanceData.find(p => p.channel_id === channel.id)?.avg_response_time || 0,
          };
        }) || [];
        
        setChannelStats(channelData);
        
        // Gerar estatísticas de usuários (agentes) - dados mock
        const userData = [
          {
            user_id: '1',
            user_name: 'Andressa',
            conversation_count: 42,
            message_count: 156,
            avg_response_time: 2.3,
            resolution_rate: 0.92,
            customer_satisfaction: 4.7
          },
          {
            user_id: '2',
            user_name: 'Gustavo',
            conversation_count: 38,
            message_count: 143,
            avg_response_time: 3.1,
            resolution_rate: 0.88,
            customer_satisfaction: 4.5
          },
          {
            user_id: '3',
            user_name: 'Yelena',
            conversation_count: 67,
            message_count: 245,
            avg_response_time: 1.8,
            resolution_rate: 0.95,
            customer_satisfaction: 4.9
          }
        ];
        
        setUserStats(userData);
      } catch (err) {
        console.error('Erro ao buscar estatísticas:', err);
        setError('Falha ao carregar estatísticas');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [startDate, endDate]);
  
  return {
    performanceStats,
    conversationStats,
    channelStats,
    userStats,
    conversations,
    channels,
    loading,
    error
  };
}
