
-- Função para calcular estatísticas de conversas em tempo real
CREATE OR REPLACE FUNCTION get_channel_conversation_stats(channel_table_name text)
RETURNS TABLE(
  total_conversations bigint,
  unread_messages bigint,
  pending_conversations bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE format('
    WITH conversation_stats AS (
      SELECT 
        session_id,
        COUNT(*) as total_messages,
        COUNT(*) FILTER (WHERE is_read = false) as unread_count,
        COUNT(*) FILTER (WHERE is_read = false AND tipo_remetente != ''USUARIO_INTERNO'' AND tipo_remetente != ''Yelena-ai'' AND tipo_remetente != ''Andressa-ai'' AND tipo_remetente != ''Gustavo-ai'') as pending_count
      FROM %I
      GROUP BY session_id
    )
    SELECT 
      COUNT(*)::bigint as total_conversations,
      COALESCE(SUM(unread_count), 0)::bigint as unread_messages,
      COUNT(*) FILTER (WHERE pending_count > 0)::bigint as pending_conversations
    FROM conversation_stats
  ', channel_table_name);
END;
$$;

-- Função para obter estatísticas de todos os canais
CREATE OR REPLACE FUNCTION get_all_channels_stats()
RETURNS TABLE(
  channel_id text,
  table_name text,
  total_conversations bigint,
  unread_messages bigint,
  pending_conversations bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  channel_mapping RECORD;
  stats_record RECORD;
BEGIN
  -- Definir mapeamento de canais para tabelas
  FOR channel_mapping IN 
    SELECT * FROM (VALUES
      ('chat', 'yelena_ai_conversas'),
      ('canarana', 'canarana_conversas'),
      ('souto-soares', 'souto_soares_conversas'),
      ('joao-dourado', 'joao_dourado_conversas'),
      ('america-dourada', 'america_dourada_conversas'),
      ('gerente-lojas', 'gerente_lojas_conversas'),
      ('gerente-externo', 'gerente_externo_conversas')
    ) AS t(channel_id, table_name)
  LOOP
    -- Obter estatísticas para cada canal
    SELECT * INTO stats_record 
    FROM get_channel_conversation_stats(channel_mapping.table_name);
    
    RETURN QUERY SELECT 
      channel_mapping.channel_id,
      channel_mapping.table_name,
      stats_record.total_conversations,
      stats_record.unread_messages,
      stats_record.pending_conversations;
  END LOOP;
END;
$$;
