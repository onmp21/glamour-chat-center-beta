
import { supabase } from '@/integrations/supabase/client';

export class DatabaseHelpers {
  static async insertMessageDynamic(
    tableName: string,
    sessionId: string,
    message: string,
    messageType: string = 'text',
    tipoRemetente: string = 'USUARIO_INTERNO'
  ): Promise<void> {
    try {
      console.log('💾 [DATABASE_HELPERS] Inserindo mensagem:', {
        tableName,
        sessionId,
        messageType,
        tipoRemetente
      });

      // Mapear nomes de tabelas para garantir segurança
      const allowedTables = [
        'yelena_ai_conversas',
        'canarana_conversas',
        'souto_soares_conversas',
        'joao_dourado_conversas',
        'america_dourada_conversas',
        'gerente_lojas_conversas',
        'gerente_externo_conversas'
      ];

      if (!allowedTables.includes(tableName)) {
        throw new Error(`Tabela não permitida: ${tableName}`);
      }

      // Usar uma abordagem baseada em switch case para inserção segura
      let insertPromise;

      switch (tableName) {
        case 'yelena_ai_conversas':
          insertPromise = supabase
            .from('yelena_ai_conversas')
            .insert({
              session_id: sessionId,
              message: message,
              mensagemtype: messageType,
              tipo_remetente: tipoRemetente
            });
          break;
        case 'canarana_conversas':
          insertPromise = supabase
            .from('canarana_conversas')
            .insert({
              session_id: sessionId,
              message: message,
              mensagemtype: messageType,
              tipo_remetente: tipoRemetente
            });
          break;
        case 'souto_soares_conversas':
          insertPromise = supabase
            .from('souto_soares_conversas')
            .insert({
              session_id: sessionId,
              message: message,
              mensagemtype: messageType,
              tipo_remetente: tipoRemetente
            });
          break;
        case 'joao_dourado_conversas':
          insertPromise = supabase
            .from('joao_dourado_conversas')
            .insert({
              session_id: sessionId,
              message: message,
              mensagemtype: messageType,
              tipo_remetente: tipoRemetente
            });
          break;
        case 'america_dourada_conversas':
          insertPromise = supabase
            .from('america_dourada_conversas')
            .insert({
              session_id: sessionId,
              message: message,
              mensagemtype: messageType,
              tipo_remetente: tipoRemetente
            });
          break;
        case 'gerente_lojas_conversas':
          insertPromise = supabase
            .from('gerente_lojas_conversas')
            .insert({
              session_id: sessionId,
              message: message,
              mensagemtype: messageType,
              tipo_remetente: tipoRemetente
            });
          break;
        case 'gerente_externo_conversas':
          insertPromise = supabase
            .from('gerente_externo_conversas')
            .insert({
              session_id: sessionId,
              message: message,
              mensagemtype: messageType,
              tipo_remetente: tipoRemetente
            });
          break;
        default:
          throw new Error(`Tabela não suportada: ${tableName}`);
      }

      const { error } = await insertPromise;

      if (error) {
        console.error('❌ [DATABASE_HELPERS] Erro ao inserir:', error);
        throw error;
      }

      console.log('✅ [DATABASE_HELPERS] Mensagem inserida com sucesso');
    } catch (error) {
      console.error('❌ [DATABASE_HELPERS] Erro:', error);
      throw error;
    }
  }
}
