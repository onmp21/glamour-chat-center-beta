
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
  channelId: string; // Adicionar identificação específica do canal
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
  private static cache = new Map<string, OptimizedContact[]>();
  private static cacheExpiry = new Map<string, number>();
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
    // Para novo formato: "TELEFONE-NOME" ou "TELEFONE-GRUPO"
    const parts = sessionId.split('-');
    if (parts.length > 1 && /^\d{10,15}$/.test(parts[0])) {
      return parts[0];
    }
    
    // Fallback: procurar por sequência de números
    const phoneMatch = sessionId.match(/(\d{10,15})/);
    return phoneMatch ? phoneMatch[1] : sessionId;
  }

  private static extractNameFromSessionId(sessionId: string, contactName?: string): string {
    // Priorizar nome do contato se disponível
    if (contactName && contactName.trim()) {
      return contactName.trim();
    }
    
    // Para formato: "TELEFONE-NOME"
    const parts = sessionId.split('-');
    if (parts.length > 1) {
      const name = parts.slice(1).join('-').trim();
      return name || 'Cliente';
    }
    
    return 'Cliente';
  }

  private static detectGroup(sessionId: string): boolean {
    // Detectar se é um grupo baseado no session_id
    return sessionId.includes('Grupo') || sessionId.includes('group') || sessionId.includes('@g.us');
  }

  private static groupContactsByPhone(rawContacts: RawContactData[], channelId: string): OptimizedContact[] {
    const contactGroups = new Map<string, RawContactData[]>();
    
    // Agrupar por telefone APENAS dentro do mesmo canal
    rawContacts.forEach(contact => {
      const phone = this.extractPhoneFromSessionId(contact.session_id);
      if (!contactGroups.has(phone)) {
        contactGroups.set(phone, []);
      }
      contactGroups.get(phone)!.push(contact);
    });

    const contacts: OptimizedContact[] = [];

    contactGroups.forEach((messages, phone) => {
      // Ordenar mensagens por data
      messages.sort((a, b) => new Date(b.read_at || '').getTime() - new Date(a.read_at || '').getTime());
      
      const latestMessage = messages[0];
      const unreadCount = messages.filter(m => !m.is_read && m.tipo_remetente !== 'USUARIO_INTERNO').length;
      
      // Detectar se é um grupo
      const isGroup = this.detectGroup(latestMessage.session_id);
      
      // Coletar até 4 nomes únicos das mensagens
      const uniqueNames = new Set<string>();
      messages.forEach(msg => {
        if (msg.nome_do_contato && msg.nome_do_contato.trim()) {
          const name = msg.nome_do_contato.trim();
          // Filtrar nomes de sistema/agente - mais específico
          if (!name.toLowerCase().includes('gerente') && 
              !name.toLowerCase().includes('yelena') && 
              !name.toLowerCase().includes('andressa') &&
              !name.toLowerCase().includes('sistema') &&
              name !== 'Gustavo Gerente das Lojas' &&
              !name.includes('GerenteLojas')) {
            uniqueNames.add(name);
          }
        }
      });

      // Se não há nomes válidos, usar extração do session_id
      if (uniqueNames.size === 0) {
        const extractedName = this.extractNameFromSessionId(latestMessage.session_id, latestMessage.nome_do_contato);
        // Evitar adicionar nomes de sistema
        if (!extractedName.toLowerCase().includes('gerente') && 
            extractedName !== 'GerenteLojas' &&
            extractedName !== 'Gustavo Gerente das Lojas') {
          uniqueNames.add(extractedName);
        }
      }

      // Se ainda não há nomes válidos, usar padrão baseado no tipo
      if (uniqueNames.size === 0) {
        uniqueNames.add(isGroup ? 'Grupo' : 'Cliente');
      }

      // Limitar a 4 nomes e criar string legível
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
        id: `${channelId}-${phone}`, // ID único por canal + telefone
        nome: displayName,
        telefone: phone,
        ultimaMensagem: latestMessage.message || '',
        tempo: this.formatTimeAgo(latestMessage.read_at || ''),
        status: unreadCount > 0 ? 'pendente' : 'resolvida',
        canais: [channelId], // Apenas o canal atual
        channelId: channelId, // Identificação específica do canal
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
    console.log('🔍 [OPTIMIZED_CONTACT_SERVICE] Loading contacts for channels (separate conversations):', channelIds);
    
    const cacheKey = channelIds.sort().join(',');
    const now = Date.now();
    
    // Verificar cache
    if (this.cache.has(cacheKey) && this.cacheExpiry.has(cacheKey)) {
      const expiry = this.cacheExpiry.get(cacheKey)!;
      if (now < expiry) {
        console.log('📋 [OPTIMIZED_CONTACT_SERVICE] Returning cached data');
        return this.cache.get(cacheKey)!;
      }
    }

    const tableMapping = this.getChannelTableMapping();
    const allContacts: OptimizedContact[] = []; // Não agrupar por telefone

    for (const channelId of channelIds) {
      const tableName = tableMapping[channelId];
      if (!tableName) {
        console.warn(`⚠️ [OPTIMIZED_CONTACT_SERVICE] No table mapping for channel: ${channelId}`);
        continue;
      }

      try {
        console.log(`📊 [OPTIMIZED_CONTACT_SERVICE] Querying table: ${tableName}`);
        
        const { data: rawData, error } = await supabase
          .from(tableName as any)
          .select('id, session_id, message, read_at, nome_do_contato, is_read, tipo_remetente')
          .order('read_at', { ascending: false })
          .limit(1000);

        if (error) {
          console.error(`❌ [OPTIMIZED_CONTACT_SERVICE] Error querying ${tableName}:`, error);
          continue;
        }

        if (!rawData || rawData.length === 0) {
          console.log(`📭 [OPTIMIZED_CONTACT_SERVICE] No data found in ${tableName}`);
          continue;
        }

        // Validar e converter dados
        const validData: RawContactData[] = [];
        rawData.forEach((item: any) => {
          if (item && 
              typeof item.id !== 'undefined' && 
              typeof item.session_id === 'string' &&
              typeof item.message === 'string') {
            validData.push({
              id: String(item.id),
              session_id: item.session_id,
              message: item.message,
              read_at: item.read_at || '',
              nome_do_contato: item.nome_do_contato || undefined,
              is_read: Boolean(item.is_read),
              tipo_remetente: item.tipo_remetente || undefined
            });
          }
        });

        const channelContacts = this.groupContactsByPhone(validData, channelId);
        console.log(`✅ [OPTIMIZED_CONTACT_SERVICE] Found ${channelContacts.length} contacts in ${tableName}`);

        // Adicionar todos os contatos do canal (sem agrupamento entre canais)
        allContacts.push(...channelContacts);

      } catch (err) {
        console.error(`❌ [OPTIMIZED_CONTACT_SERVICE] Unexpected error for ${tableName}:`, err);
      }
    }

    // Ordenar contatos (sem agrupar por telefone)
    const finalContacts = allContacts
      .sort((a, b) => {
        // Priorizar conversas pendentes
        if (a.status === 'pendente' && b.status !== 'pendente') return -1;
        if (b.status === 'pendente' && a.status !== 'pendente') return 1;
        
        // Depois ordenar por tempo (mais recente primeiro)
        const timeA = new Date(a.tempo.includes('h') || a.tempo.includes('min') ? Date.now() : a.tempo);
        const timeB = new Date(b.tempo.includes('h') || b.tempo.includes('min') ? Date.now() : b.tempo);
        return timeB.getTime() - timeA.getTime();
      });

    // Atualizar cache
    this.cache.set(cacheKey, finalContacts);
    this.cacheExpiry.set(cacheKey, now + this.CACHE_DURATION);

    console.log(`🎯 [OPTIMIZED_CONTACT_SERVICE] Total separate conversations found: ${finalContacts.length}`);
    return finalContacts;
  }

  static clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
    console.log('🧹 [OPTIMIZED_CONTACT_SERVICE] Cache cleared');
  }
}
