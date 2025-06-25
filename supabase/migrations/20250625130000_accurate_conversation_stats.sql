
-- Função para calcular estatísticas precisas de conversas
CREATE OR REPLACE FUNCTION get_accurate_channel_stats(channel_table_name text)
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
        -- Uma conversa é pendente se tem mensagens não lidas de contatos externos
        CASE 
          WHEN COUNT(*) FILTER (WHERE is_read = false AND (tipo_remetente IS NULL OR tipo_remetente != ''USUARIO_INTERNO'')) > 0 
          THEN 1 
          ELSE 0 
        END as is_pending
      FROM %I
      GROUP BY session_id
    )
    SELECT 
      COUNT(*)::bigint as total_conversations,
      COALESCE(SUM(unread_count), 0)::bigint as unread_messages,
      COALESCE(SUM(is_pending), 0)::bigint as pending_conversations
    FROM conversation_stats
  ', channel_table_name);
END;
$$;
