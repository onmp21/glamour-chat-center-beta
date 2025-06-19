
import { supabase } from '@/integrations/supabase/client';

interface Contact {
  phone_number: string;
  contact_name: string;
  channels: string[];
}

export class ContactNameResolver {
  private static cache = new Map<string, Contact>();
  private static cacheExpiry = new Map<string, number>();
  private static readonly CACHE_DURATION = 60000; // 1 minuto

  // Resolver nome do contato usando tabela unificada como fonte primária
  static async resolveName(phoneNumber: string, fallbackName?: string): Promise<string> {
    if (!phoneNumber) return fallbackName || 'Cliente';

    const now = Date.now();
    const cacheKey = phoneNumber;

    // Verificar cache
    if (this.cache.has(cacheKey) && this.cacheExpiry.has(cacheKey)) {
      const expiry = this.cacheExpiry.get(cacheKey)!;
      if (now < expiry) {
        return this.cache.get(cacheKey)!.contact_name;
      }
    }

    try {
      // Consultar tabela contacts primeiro
      const { data: contact, error } = await supabase
        .from('contacts')
        .select('phone_number, contact_name, channels')
        .eq('phone_number', phoneNumber)
        .single();

      if (!error && contact) {
        // Atualizar cache
        this.cache.set(cacheKey, contact);
        this.cacheExpiry.set(cacheKey, now + this.CACHE_DURATION);
        return contact.contact_name;
      }

      // Se não encontrou na tabela contacts, usar fallback
      if (fallbackName && fallbackName.trim()) {
        return fallbackName.trim();
      }

      return 'Cliente';
    } catch (err) {
      console.error('❌ [CONTACT_NAME_RESOLVER] Error resolving name:', err);
      return fallbackName || 'Cliente';
    }
  }

  // Buscar contato completo com canais
  static async getContact(phoneNumber: string): Promise<Contact | null> {
    if (!phoneNumber) return null;

    try {
      const { data: contact, error } = await supabase
        .from('contacts')
        .select('phone_number, contact_name, channels')
        .eq('phone_number', phoneNumber)
        .single();

      return error ? null : contact;
    } catch (err) {
      console.error('❌ [CONTACT_NAME_RESOLVER] Error getting contact:', err);
      return null;
    }
  }

  // Limpar cache
  static clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }
}
