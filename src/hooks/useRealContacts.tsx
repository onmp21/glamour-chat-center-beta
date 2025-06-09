
import { useState, useEffect } from 'react';
import { useChannels } from '@/contexts/ChannelContext';
import { usePermissions } from '@/hooks/usePermissions';
import { MessageService } from '@/services/MessageService';

interface RealContact {
  id: string;
  nome: string;
  telefone: string;
  canais: string[];
  ultimaMensagem: string;
  tempo: string;
  status: 'pendente' | 'em_andamento' | 'resolvida';
}

export const useRealContacts = () => {
  const [contacts, setContacts] = useState<RealContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { channels } = useChannels();
  const { getAccessibleChannels } = usePermissions();

  const formatTimeAgo = (timestamp: string | null): string => {
    if (!timestamp) return '';
    
    try {
      const messageDate = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - messageDate.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'agora';
      if (diffMins < 60) return `${diffMins}min`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h`;
      
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d`;
    } catch (error) {
      return '';
    }
  };

  useEffect(() => {
    const loadRealContacts = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const accessibleChannels = getAccessibleChannels();
        const channelMapping = {
          'Yelena-AI': 'chat',
          'Canarana': 'canarana',
          'Souto Soares': 'souto-soares',
          'João Dourado': 'joao-dourado',
          'América Dourada': 'america-dourada',
          'Gustavo Gerente das Lojas': 'gerente-lojas',
          'Andressa Gerente Externo': 'gerente-externo'
        };
        
        const contactsMap = new Map<string, RealContact>();
        
        // Processar apenas canais acessíveis e ativos
        for (const channel of channels.filter(c => c.isActive)) {
          const channelId = channelMapping[channel.name as keyof typeof channelMapping];
          if (!channelId || !accessibleChannels.includes(channelId)) continue;
          
          try {
            const messageService = new MessageService(channelId);
            const conversations = await messageService.getConversations();
            
            for (const conversation of conversations) {
              const contactPhone = conversation.contact_phone || '';
              if (!contactPhone) continue;
              
              const contactName = conversation.contact_name || `Cliente ${contactPhone.slice(-4)}`;
              const status = conversation.status || 'unread';
              
              let contactStatus: 'pendente' | 'em_andamento' | 'resolvida';
              switch(status) {
                case 'unread':
                  contactStatus = 'pendente';
                  break;
                case 'in_progress':
                  contactStatus = 'em_andamento';
                  break;
                case 'resolved':
                  contactStatus = 'resolvida';
                  break;
                default:
                  contactStatus = 'pendente';
              }
              
              // Verificar se já temos esse contato
              if (contactsMap.has(contactPhone)) {
                // Adicionar canal se não existir
                const existingContact = contactsMap.get(contactPhone)!;
                if (!existingContact.canais.includes(channelId)) {
                  existingContact.canais.push(channelId);
                }
                
                // Atualizar mensagem mais recente se for mais nova
                const existingTime = new Date(existingContact.tempo || 0).getTime();
                const newTime = new Date(conversation.last_message_time || 0).getTime();
                
                if (newTime > existingTime) {
                  existingContact.ultimaMensagem = conversation.last_message || 'Sem mensagem';
                  existingContact.tempo = formatTimeAgo(conversation.last_message_time);
                  existingContact.status = contactStatus;
                }
              } else {
                // Criar novo contato
                contactsMap.set(contactPhone, {
                  id: contactPhone,
                  nome: contactName,
                  telefone: contactPhone,
                  canais: [channelId],
                  ultimaMensagem: conversation.last_message || 'Sem mensagem',
                  tempo: formatTimeAgo(conversation.last_message_time),
                  status: contactStatus
                });
              }
            }
          } catch (error) {
            console.error(`Erro ao carregar contatos do canal ${channelId}:`, error);
          }
        }
        
        // Converter Map para array e ordenar por última mensagem
        const sortedContacts = Array.from(contactsMap.values())
          .sort((a, b) => {
            const timeA = new Date(a.tempo || 0).getTime();
            const timeB = new Date(b.tempo || 0).getTime();
            return timeB - timeA;
          });
        
        setContacts(sortedContacts);
      } catch (err) {
        console.error('Erro ao carregar contatos reais:', err);
        setError('Erro ao carregar contatos');
        setContacts([]);
      } finally {
        setLoading(false);
      }
    };
    
    if (channels.length > 0) {
      loadRealContacts();
    }
  }, [channels, getAccessibleChannels]);

  return { contacts, loading, error, refetch: () => setLoading(true) };
};
