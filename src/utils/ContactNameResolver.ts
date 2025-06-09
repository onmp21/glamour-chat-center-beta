
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
   * Resolve o nome do contato usando a coluna Nome_do_contato das tabelas
   * - Se tem nome na coluna, usa como nome fixo
   * - Se não tem nome, mostra apenas o número até ter um nome
   */
  static resolveContactName(
    phone: string, 
    sessionId: string, 
    providedName?: string, 
    timestamp: string = new Date().toISOString()
  ): string {
    console.log(`📝 [CONTACT_RESOLVER] Resolving name for phone: ${phone}, provided: ${providedName}`);

    // Verificar se já temos um nome resolvido para este contato
    const cached = this.contactCache.get(phone);
    if (cached) {
      console.log(`✅ [CONTACT_RESOLVER] Using cached name: ${cached.finalName} for ${phone}`);
      return cached.finalName;
    }

    // Se há nome fornecido da coluna Nome_do_contato, definir como nome fixo
    if (providedName && providedName.trim()) {
      const finalName = providedName.trim();
      const resolved: ResolvedContact = {
        phone,
        finalName,
        timestamp
      };
      
      this.contactCache.set(phone, resolved);
      
      // Limpar pendências para este contato
      this.pendingContacts.delete(phone);
      
      console.log(`🎯 [CONTACT_RESOLVER] Name fixed from database for ${phone}: ${finalName}`);
      return finalName;
    }

    // Se não há nome, mostrar apenas o número
    const phoneDisplay = phone.length > 4 ? phone.slice(-4) : phone;
    console.log(`📞 [CONTACT_RESOLVER] No name available, showing phone: ${phoneDisplay} for ${phone}`);
    
    return phoneDisplay;
  }

  /**
   * Força a resolução de um nome para um contato específico
   */
  static forceResolveName(phone: string, name: string): void {
    if (!name || !name.trim()) return;

    const finalName = name.trim();
    const resolved: ResolvedContact = {
      phone,
      finalName,
      timestamp: new Date().toISOString()
    };

    this.contactCache.set(phone, resolved);
    this.pendingContacts.delete(phone);

    console.log(`🔧 [CONTACT_RESOLVER] Forced name resolution for ${phone}: ${finalName}`);
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
