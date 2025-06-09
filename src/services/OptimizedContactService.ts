
import { MessageService } from './MessageService';
import { getChannelDisplayName } from '@/utils/channelMapping';

export interface OptimizedContact {
  id: string;
  nome: string;
  telefone: string;
  canais: string[];
  ultimaMensagem: string;
  tempo: string;
  status: 'pendente' | 'em_andamento' | 'resolvida';
  lastMessageTime: Date;
}

export class OptimizedContactService {
  private static cache = new Map<string, { data: OptimizedContact[]; timestamp: number }>();
  private static readonly CACHE_DURATION = 30000; // 30 segundos

  static async getContactsForChannels(channelIds: string[]): Promise<OptimizedContact[]> {
    const cacheKey = channelIds.sort().join('-');
    const cached = this.cache.get(cacheKey);
    
    // Verificar cache
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`🚀 [OPTIMIZED_CONTACT_SERVICE] Using cached data for channels: ${channelIds.join(', ')}`);
      return cached.data;
    }

    console.log(`🔍 [OPTIMIZED_CONTACT_SERVICE] Loading contacts for channels: ${channelIds.join(', ')}`);
    
    try {
      // Carregar dados de todos os canais em paralelo
      const channelPromises = channelIds.map(async (channelId) => {
        try {
          const messageService = new MessageService(channelId);
          const conversations = await messageService.getConversations();
          
          return conversations.map(conversation => {
            const contactPhone = conversation.contact_phone || '';
            if (!contactPhone) return null;
            
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
            
            const lastMessageTime = conversation.last_message_time 
              ? new Date(conversation.last_message_time)
              : new Date(0);
            
            return {
              id: contactPhone,
              nome: contactName,
              telefone: contactPhone,
              canais: [channelId],
              ultimaMensagem: conversation.last_message || 'Sem mensagem',
              tempo: this.formatTimeAgo(conversation.last_message_time),
              status: contactStatus,
              lastMessageTime,
              channelName: getChannelDisplayName(channelId)
            };
          }).filter(contact => contact !== null);
        } catch (error) {
          console.error(`❌ [OPTIMIZED_CONTACT_SERVICE] Error loading channel ${channelId}:`, error);
          return [];
        }
      });

      // Aguardar todos os canais carregarem
      const channelResults = await Promise.all(channelPromises);
      const allContacts = channelResults.flat();
      
      // Agrupar contatos por telefone
      const contactsMap = new Map<string, OptimizedContact>();
      
      allContacts.forEach(contact => {
        if (!contact) return;
        
        const existingContact = contactsMap.get(contact.telefone);
        
        if (existingContact) {
          // Adicionar canal se não existir
          if (!existingContact.canais.includes(contact.canais[0])) {
            existingContact.canais.push(contact.canais[0]);
          }
          
          // Atualizar mensagem mais recente se for mais nova
          if (contact.lastMessageTime > existingContact.lastMessageTime) {
            existingContact.ultimaMensagem = contact.ultimaMensagem;
            existingContact.tempo = contact.tempo;
            existingContact.status = contact.status;
            existingContact.lastMessageTime = contact.lastMessageTime;
          }
        } else {
          contactsMap.set(contact.telefone, contact);
        }
      });
      
      // Converter para array e ordenar por última mensagem
      const sortedContacts = Array.from(contactsMap.values())
        .sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime());
      
      // Salvar no cache
      this.cache.set(cacheKey, {
        data: sortedContacts,
        timestamp: Date.now()
      });
      
      console.log(`✅ [OPTIMIZED_CONTACT_SERVICE] Loaded ${sortedContacts.length} contacts from ${channelIds.length} channels`);
      return sortedContacts;
      
    } catch (error) {
      console.error(`❌ [OPTIMIZED_CONTACT_SERVICE] Error loading contacts:`, error);
      return [];
    }
  }

  static clearCache(): void {
    this.cache.clear();
    console.log(`🧹 [OPTIMIZED_CONTACT_SERVICE] Cache cleared`);
  }

  private static formatTimeAgo(timestamp: string | null): string {
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
  }
}
