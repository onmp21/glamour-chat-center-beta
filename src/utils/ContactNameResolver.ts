
import { ContactService } from '@/services/ContactService';

interface ContactData {
  phone: string;
  sessionId: string;
  name?: string;
  timestamp: string;
}

interface ResolvedContact {
  phone: string;
  finalName: string;
  timestamp: string;
}

export class ContactNameResolver {
  private static contactCache = new Map<string, ResolvedContact>();
  private static pendingContacts = new Map<string, ContactData[]>();

  /**
   * CORRIGIDO: Resolve o nome do contato priorizando a tabela contacts
   * - Primeiro verifica a tabela contacts no banco
   * - Se não encontrar, usa o nome fornecido
   * - Se não tem nome, mostra apenas o número
   */
  static async resolveContactName(
    phone: string, 
    sessionId: string, 
    providedName?: string, 
    timestamp: string = new Date().toISOString()
  ): Promise<string> {
    console.log(`📝 [CONTACT_RESOLVER] Resolving name for phone: ${phone}, provided: ${providedName}`);

    // Verificar se já temos um nome resolvido no cache
    const cached = this.contactCache.get(phone);
    if (cached) {
      console.log(`✅ [CONTACT_RESOLVER] Using cached name: ${cached.finalName} for ${phone}`);
      return cached.finalName;
    }

    try {
      // NOVO: Buscar primeiro na tabela contacts
      const savedContact = await ContactService.getContactByPhone(phone);
      if (savedContact) {
        const finalName = savedContact.contact_name;
        const resolved: ResolvedContact = {
          phone,
          finalName,
          timestamp: savedContact.updated_at
        };
        
        this.contactCache.set(phone, resolved);
        console.log(`🎯 [CONTACT_RESOLVER] Name found in database for ${phone}: ${finalName}`);
        return finalName;
      }
    } catch (error) {
      console.error(`❌ [CONTACT_RESOLVER] Error fetching contact from database:`, error);
    }

    // Se há nome fornecido da coluna Nome_do_contato, usar e salvar
    if (providedName && providedName.trim()) {
      const finalName = providedName.trim();
      const resolved: ResolvedContact = {
        phone,
        finalName,
        timestamp
      };
      
      this.contactCache.set(phone, resolved);
      
      // Salvar no banco de dados para próximas consultas
      try {
        await ContactService.saveContact(phone, finalName);
        console.log(`💾 [CONTACT_RESOLVER] Contact saved to database: ${phone} -> ${finalName}`);
      } catch (error) {
        console.error(`❌ [CONTACT_RESOLVER] Error saving contact to database:`, error);
      }
      
      // Limpar pendências para este contato
      this.pendingContacts.delete(phone);
      
      console.log(`🎯 [CONTACT_RESOLVER] Name resolved and saved for ${phone}: ${finalName}`);
      return finalName;
    }

    // Se não há nome, mostrar apenas os últimos 4 dígitos do número
    const phoneDisplay = phone.length > 4 ? phone.slice(-4) : phone;
    console.log(`📞 [CONTACT_RESOLVER] No name available, showing phone: ${phoneDisplay} for ${phone}`);
    
    return phoneDisplay;
  }

  /**
   * Versão síncrona para compatibilidade com código existente
   */
  static resolveContactNameSync(
    phone: string, 
    sessionId: string, 
    providedName?: string, 
    timestamp: string = new Date().toISOString()
  ): string {
    // Verificar cache primeiro
    const cached = this.contactCache.get(phone);
    if (cached) {
      return cached.finalName;
    }

    // Se há nome fornecido, usar imediatamente
    if (providedName && providedName.trim()) {
      const finalName = providedName.trim();
      const resolved: ResolvedContact = {
        phone,
        finalName,
        timestamp
      };
      
      this.contactCache.set(phone, resolved);
      
      // Salvar de forma assíncrona
      ContactService.saveContact(phone, finalName).catch(error => {
        console.error(`❌ [CONTACT_RESOLVER] Error saving contact async:`, error);
      });
      
      return finalName;
    }

    // Fallback para número
    return phone.length > 4 ? phone.slice(-4) : phone;
  }

  /**
   * Força a resolução de um nome para um contato específico
   */
  static async forceResolveName(phone: string, name: string): Promise<void> {
    if (!name || !name.trim()) return;

    const finalName = name.trim();
    const resolved: ResolvedContact = {
      phone,
      finalName,
      timestamp: new Date().toISOString()
    };

    this.contactCache.set(phone, resolved);
    this.pendingContacts.delete(phone);

    // Salvar no banco
    try {
      await ContactService.saveContact(phone, finalName);
      console.log(`🔧 [CONTACT_RESOLVER] Forced name resolution and saved for ${phone}: ${finalName}`);
    } catch (error) {
      console.error(`❌ [CONTACT_RESOLVER] Error force saving contact:`, error);
    }
  }

  /**
   * Obter o nome atualmente resolvido para um contato
   */
  static getResolvedName(phone: string): string | null {
    const cached = this.contactCache.get(phone);
    return cached ? cached.finalName : null;
  }

  /**
   * Verificar se um contato está pendente de resolução de nome
   */
  static isPending(phone: string): boolean {
    return this.pendingContacts.has(phone);
  }

  /**
   * Obter estatísticas do resolver
   */
  static getStats(): { resolved: number; pending: number } {
    return {
      resolved: this.contactCache.size,
      pending: this.pendingContacts.size
    };
  }

  /**
   * Limpar cache (útil para testes)
   */
  static clearCache(): void {
    this.contactCache.clear();
    this.pendingContacts.clear();
    console.log(`🧹 [CONTACT_RESOLVER] Cache cleared`);
  }

  /**
   * Processar mensagens pendentes quando um nome é resolvido
   */
  static processPendingMessages(phone: string): ContactData[] {
    const pending = this.pendingContacts.get(phone) || [];
    this.pendingContacts.delete(phone);
    return pending;
  }
}
