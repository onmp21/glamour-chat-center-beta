
import { supabase } from "../lib/supabase";

export class ChannelUuidResolver {
  private static legacyIdToUuidCache: Record<string, string> = {};

  /**
   * Mapeamento robusto de legacyId → UUID, focado em garantir que
   * canais como 'chat', 'canarana', 'gerente-lojas', etc. sejam resolvidos para UUID.
   */
  static async getChannelUuid(legacyId: string): Promise<string | null> {
    // Permitir UUID direto (validação simples de UUID v4)
    if (/^[0-9a-fA-F-]{36}$/.test(legacyId)) {
      return legacyId;
    }
    
    // Usar cache para performance
    if (this.legacyIdToUuidCache[legacyId]) {
      return this.legacyIdToUuidCache[legacyId];
    }
    
    // Alias conhecidos (garante legacy compatibility)
    const aliasToName: Record<string, string> = {
      "chat": "Yelena-AI",
      "canarana": "Canarana",
      "souto-soares": "Souto Soares",
      "joao-dourado": "João Dourado",
      "america-dourada": "América Dourada",
      "gerente-lojas": "Gerente das Lojas",
      "gerente-externo": "Andressa Gerente Externo"
    };
    
    // Buscar canais do supabase (precisa garantir UUID correto!)
    try {
      const { data, error } = await supabase.from('channels').select('id, name');
      if (error) {
        console.warn("[ChannelUuidResolver] Falha ao buscar canais:", error.message);
        return null;
      }
      if (data) {
        // Preencher o cache
        data.forEach((ch: { id: string; name: string }) => {
          // Mapear tanto pelo legacy quanto pelo name/UUID
          Object.entries(aliasToName).forEach(([legacy, canonical]) => {
            if (ch.name === canonical) {
              this.legacyIdToUuidCache[legacy] = ch.id;
              this.legacyIdToUuidCache[ch.name] = ch.id;
            }
          });
          // Garantir pelo próprio name
          this.legacyIdToUuidCache[ch.name] = ch.id;
          this.legacyIdToUuidCache[ch.id] = ch.id;
        });
        // Resultado final
        const uuid = this.legacyIdToUuidCache[legacyId] || null;
        console.log(`[ChannelUuidResolver:getChannelUuid] legacyId='${legacyId}' ⇒ uuid='${uuid}'`);
        return uuid;
      }
    } catch (e) {
      console.error("[ChannelUuidResolver] Erro inesperado:", e);
    }
    return null;
  }
}
