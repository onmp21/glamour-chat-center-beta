
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

  // CORRIGIDO: Resolver nome do contato priorizando tabela contacts
  static async resolveName(phoneNumber: string, fallbackName?: string): Promise<string> {
    if (!phoneNumber) {
      console.log(`📞 [CONTACT_RESOLVER] Número vazio, usando fallback: ${fallbackName || 'Cliente'}`);
      return fallbackName || 'Cliente';
    }

    const now = Date.now();
    const cacheKey = phoneNumber;

    // Verificar cache
    if (this.cache.has(cacheKey) && this.cacheExpiry.has(cacheKey)) {
      const expiry = this.cacheExpiry.get(cacheKey)!;
      if (now < expiry) {
        const cachedName = this.cache.get(cacheKey)!.contact_name;
        console.log(`✅ [CONTACT_RESOLVER] Nome do cache para ${phoneNumber}: ${cachedName}`);
        return cachedName;
      }
    }

    try {
      // CORREÇÃO: Consultar tabela contacts SEMPRE primeiro
      console.log(`🔍 [CONTACT_RESOLVER] Buscando ${phoneNumber} na tabela contacts`);
      const { data: contact, error } = await supabase
        .from('contacts')
        .select('phone_number, contact_name, channels')
        .eq('phone_number', phoneNumber)
        .single();

      if (!error && contact && contact.contact_name) {
        // Atualizar cache
        this.cache.set(cacheKey, contact);
        this.cacheExpiry.set(cacheKey, now + this.CACHE_DURATION);
        console.log(`🎯 [CONTACT_RESOLVER] Nome encontrado na tabela contacts para ${phoneNumber}: ${contact.contact_name}`);
        return contact.contact_name;
      }

      // CORREÇÃO: Se tem fallbackName, salvar na tabela contacts para próximas consultas
      if (fallbackName && fallbackName.trim() && fallbackName !== 'Cliente') {
        console.log(`💾 [CONTACT_RESOLVER] Salvando nome ${fallbackName} para ${phoneNumber} na tabela contacts`);
        
        try {
          const { error: insertError } = await supabase
            .from('contacts')
            .upsert(
              { 
                phone_number: phoneNumber, 
                contact_name: fallbackName.trim(),
                channels: []
              },
              { 
                onConflict: 'phone_number',
                ignoreDuplicates: false 
              }
            );

          if (!insertError) {
            // Atualizar cache com o nome salvo
            const newContact = {
              phone_number: phoneNumber,
              contact_name: fallbackName.trim(),
              channels: []
            };
            this.cache.set(cacheKey, newContact);
            this.cacheExpiry.set(cacheKey, now + this.CACHE_DURATION);
            console.log(`✅ [CONTACT_RESOLVER] Nome ${fallbackName} salvo com sucesso para ${phoneNumber}`);
            return fallbackName.trim();
          } else {
            console.error(`❌ [CONTACT_RESOLVER] Erro ao salvar contato:`, insertError);
          }
        } catch (saveError) {
          console.error(`❌ [CONTACT_RESOLVER] Erro ao salvar contato:`, saveError);
        }
      }

      // Se não encontrou na tabela e não tem fallback válido, usar número
      const phoneDisplay = phoneNumber.length > 4 ? `...${phoneNumber.slice(-4)}` : phoneNumber;
      console.log(`📞 [CONTACT_RESOLVER] Nenhum nome encontrado, exibindo número: ${phoneDisplay} para ${phoneNumber}`);
      return phoneDisplay;

    } catch (err) {
      console.error('❌ [CONTACT_RESOLVER] Erro na busca:', err);
      // Em caso de erro, usar fallback ou número
      if (fallbackName && fallbackName.trim()) {
        return fallbackName.trim();
      }
      return phoneNumber.length > 4 ? `...${phoneNumber.slice(-4)}` : phoneNumber;
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
      console.error('❌ [CONTACT_RESOLVER] Erro ao buscar contato completo:', err);
      return null;
    }
  }

  // Limpar cache
  static clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
    console.log('🧹 [CONTACT_RESOLVER] Cache limpo');
  }
}
