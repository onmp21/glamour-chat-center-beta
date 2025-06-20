
import { supabase } from '@/integrations/supabase/client';

export interface OptimizedContact {
  id: string;
  nome: string;
  telefone: string;
  ultimaMensagem: string;
  tempo: string;
  status: 'pendente' | 'em_andamento' | 'resolvida';
  canais: string[];
  isGroup?: boolean;
  channelId: string;
}

interface RawContactData {
  id: string;
  session_id: string;
  message: string;
  read_at: string;
  nome_do_contato?: string;
  is_read?: boolean;
  tipo_remetente?: string;
}

export class OptimizedContactService {
  private static cache = new Map<string, { data: OptimizedContact[]; timestamp: number }>();
  private static readonly CACHE_DURATION = 30000; // 30 segundos

  private static getChannelTableMapping(): Record<string, string> {
    return {
      'chat': 'yelena_ai_conversas',
      'af1e5797-edc6-4ba3-a57a-25cf7297c4d6': 'yelena_ai_conversas',
      'canarana': 'canarana_conversas',
      'souto-soares': 'souto_soares_conversas',
      'joao-dourado': 'joao_dourado_conversas',
      'america-dourada': 'america_dourada_conversas',
      'gerente-lojas': 'gerente_lojas_conversas',
      'gerente-externo': 'gerente_externo_conversas',
      'd2892900-ca8f-4b08-a73f-6b7aa5866ff7': 'gerente_externo_conversas'
    };
  }

  private static extractPhoneFromSessionId(sessionId: string): string {
    // Tratamento mais rigoroso para evitar conflitos entre canais
    const parts = sessionId.split('-');
    if (parts.length > 1 && /^\d{10,15}$/.test(parts[0])) {
      return parts[0];
    }
    
    const phoneMatch = sessionId.match(/(\d{10,15})/);
    return phoneMatch ? phoneMatch[1] : sessionId;
  }

  private static extractNameFromSessionId(sessionId: string, contactName?: string): string {
    if (contactName && contactName.trim()) {
      return contactName.trim();
    }
    
    const parts = sessionId.split('-');
    if (parts.length > 1) {
      const name = parts.slice(1).join('-').trim();
      return name || 'Cliente';
    }
    
    return 'Cliente';
  }

  private static detectGroup(sessionId: string): boolean {
    return sessionId.includes('Grupo') || sessionId.includes('group') || sessionId.includes('@g.us');
  }

  private static groupContactsByPhone(rawContacts: RawContactData[], channelId: string): OptimizedContact[] {
    const contactGroups = new Map<string, RawContactData[]>();
    
    // Agrupar por telefone APENAS dentro do canal específico
    rawContacts.forEach(contact => {
      const phone = this.extractPhoneFromSessionId(contact.session_id);
      const uniqueKey = `${channelId}-${phone}`; // Chave única por canal
      if (!contactGroups.has(uniqueKey)) {
        contactGroups.set(uniqueKey, []);
      }
      contactGroups.get(uniqueKey)!.push(contact);
    });

    const contacts: OptimizedContact[] = [];

    contactGroups.forEach((messages, uniqueKey) => {
      const phone = uniqueKey.split('-').slice(1).join('-'); // Remover prefixo do canal
      messages.sort((a, b) => new Date(b.read_at || '').getTime() - new Date(a.read_at || '').getTime());
      
      const latestMessage = messages[0];
      const unreadCount = messages.filter(m => !m.is_read && m.tipo_remetente !== 'USUARIO_INTERNO').length;
      
      const isGroup = this.detectGroup(latestMessage.session_id);
      
      // Filtrar nomes de sistema mais rigorosamente
      const uniqueNames = new Set<string>();
      messages.forEach(msg => {
        if (msg.nome_do_contato && msg.nome_do_contato.trim()) {
          const name = msg.nome_do_contato.trim();
          // Filtro mais rigoroso para evitar nomes de sistema
          if (!name.toLowerCase().includes('pedro') || 
              (!name.toLowerCase().includes('gerente') && 
               !name.toLowerCase().includes('yelena') && 
               !name.toLowerCase().includes('andressa') &&
               !name.toLowerCase().includes('sistema') &&
               name !== 'Gustavo Gerente das Lojas' &&
               !name.includes('GerenteLojas'))) {
            uniqueNames.add(name);
          }
        }
      });

      if (uniqueNames.size === 0) {
        const extractedName = this.extractNameFromSessionId(latestMessage.session_id, latestMessage.nome_do_contato);
        if (!extractedName.toLowerCase().includes('gerente') && 
            extractedName !== 'GerenteLojas' &&
            extractedName !== 'Gustavo Gerente das Lojas') {
          uniqueNames.add(extractedName);
        }
      }

      if (uniqueNames.size === 0) {
        uniqueNames.add(isGroup ? 'Grupo' : 'Cliente');
      }

      const namesArray = Array.from(uniqueNames).slice(0, 4);
      let displayName = '';
      
      if (isGroup) {
        displayName = namesArray.length > 1 
          ? `Grupo: ${namesArray.slice(0, 2).join(', ')}${namesArray.length > 2 ? ` e mais ${namesArray.length - 2}` : ''}`
          : `Grupo: ${namesArray[0] || 'Sem nome'}`;
      } else {
        displayName = namesArray.length > 1 
          ? `${namesArray.slice(0, -1).join(', ')} e ${namesArray[namesArray.length - 1]}`
          : namesArray[0] || 'Cliente';
      }

      const contact: OptimizedContact = {
        id: uniqueKey, // ID único incluindo canal
        nome: displayName,
        telefone: phone,
        ultimaMensagem: latestMessage.message || '',
        tempo: this.formatTimeAgo(latestMessage.read_at || ''),
        status: unreadCount > 0 ? 'pendente' : 'resolvida',
        canais: [channelId],
        channelId: channelId,
        isGroup
      };

      contacts.push(contact);
    });

    return contacts;
  }

  private static formatTimeAgo(dateString: string): string {
    if (!dateString) return '';
    
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes}min`;
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInDays < 7) return `${diffInDays}d`;
    
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }

  static async getContactsForChannels(channelIds: string[]): Promise<OptimizedContact[]> {
    console.log('🔍 [OPTIMIZED_CONTACT_SERVICE] Loading contacts for channels (isolated):', channelIds);
    
    const now = Date.now();
    const tableMapping = this.getChannelTableMapping();
    const allContacts: OptimizedContact[] = [];

    // Processar canais individualmente para garantir isolamento completo
    for (const channelId of channelIds) {
      const cacheKey = `channel_${channelId}`;
      
      // Verificar cache individual por canal
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey)!;
        if (now - cached.timestamp < this.CACHE_DURATION) {
          console.log(`📋 [OPTIMIZED_CONTACT_SERVICE] Using cached data for channel: ${channelId}`);
          allContacts.push(...cached.data);
          continue;
        }
      }

      const tableName = tableMapping[channelId];
      if (!tableName) {
        console.warn(`⚠️ [OPTIMIZED_CONTACT_SERVICE] No table mapping for channel: ${channelId}`);
        continue;
      }

      try {
        console.log(`📊 [OPTIMIZED_CONTACT_SERVICE] Querying table: ${tableName} for channel: ${channelId}`);
        
        const { data: rawData, error } = await supabase
          .from(tableName as any)
          .select('id, session_id, message, read_at, nome_do_contato, is_read, tipo_remetente')
          .order('read_at', { ascending: false })
          .limit(500); // Reduzir limite para melhor performance

        if (error) {
          console.error(`❌ [OPTIMIZED_CONTACT_SERVICE] Error querying ${tableName}:`, error);
          continue;
        }

        if (!rawData || rawData.length === 0) {
          console.log(`📭 [OPTIMIZED_CONTACT_SERVICE] No data found in ${tableName}`);
          continue;
        }

        const validData: RawContactData[] = rawData
          .filter((item: any) => item && item.id && item.session_id && item.message)
          .map((item: any) => ({
            id: String(item.id),
            session_id: item.session_id,
            message: item.message,
            read_at: item.read_at || '',
            nome_do_contato: item.nome_do_contato || undefined,
            is_read: Boolean(item.is_read),
            tipo_remetente: item.tipo_remetente || undefined
          }));

        const channelContacts = this.groupContactsByPhone(validData, channelId);
        console.log(`✅ [OPTIMIZED_CONTACT_SERVICE] Found ${channelContacts.length} contacts in ${tableName}`);

        // Atualizar cache individual do canal
        this.cache.set(cacheKey, { data: channelContacts, timestamp: now });
        
        allContacts.push(...channelContacts);

      } catch (err) {
        console.error(`❌ [OPTIMIZED_CONTACT_SERVICE] Unexpected error for ${tableName}:`, err);
      }
    }

    // Ordenar sem agrupar entre canais
    const finalContacts = allContacts.sort((a, b) => {
      if (a.status === 'pendente' && b.status !== 'pendente') return -1;
      if (b.status === 'pendente' && a.status !== 'pendente') return 1;
      
      const timeA = new Date(a.tempo.includes('h') || a.tempo.includes('min') ? Date.now() : a.tempo);
      const timeB = new Date(b.tempo.includes('h') || b.tempo.includes('min') ? Date.now() : b.tempo);
      return timeB.getTime() - timeA.getTime();
    });

    console.log(`🎯 [OPTIMIZED_CONTACT_SERVICE] Total isolated conversations: ${finalContacts.length}`);
    return finalContacts;
  }

  static clearCache(channelId?: string): void {
    if (channelId) {
      this.cache.delete(`channel_${channelId}`);
      console.log(`🧹 [OPTIMIZED_CONTACT_SERVICE] Cache cleared for channel: ${channelId}`);
    } else {
      this.cache.clear();
      console.log('🧹 [OPTIMIZED_CONTACT_SERVICE] All cache cleared');
    }
  }
}
