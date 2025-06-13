
-- Criar bucket para armazenar mídias se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('media-files', 'media-files', true)
ON CONFLICT (id) DO NOTHING;

-- Criar políticas permissivas para o bucket
CREATE POLICY "Allow all operations on media-files" ON storage.objects
FOR ALL USING (bucket_id = 'media-files');

-- Função para detectar MIME type de base64 (se não existir)
CREATE OR REPLACE FUNCTION detect_mime_from_base64(base64_content text)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  -- Limpar espaços e quebras de linha
  base64_content := replace(replace(replace(base64_content, ' ', ''), chr(10), ''), chr(13), '');
  
  -- Detectar tipos baseado nas assinaturas
  IF base64_content LIKE '/9j/%' THEN
    RETURN 'image/jpeg';
  ELSIF base64_content LIKE 'iVBORw%' THEN
    RETURN 'image/png';
  ELSIF base64_content LIKE 'R0lGO%' THEN
    RETURN 'image/gif';
  ELSIF base64_content LIKE 'UklGR%' THEN
    RETURN 'image/webp';
  ELSIF base64_content LIKE 'JVBERi%' THEN
    RETURN 'application/pdf';
  ELSIF base64_content LIKE 'SUQz%' OR base64_content LIKE '//uQ%' OR base64_content LIKE '//sw%' THEN
    RETURN 'audio/mpeg';
  ELSIF base64_content LIKE 'T2dn%' THEN
    RETURN 'audio/ogg';
  ELSIF base64_content LIKE 'AAAAGG%' OR base64_content LIKE 'AAAAFG%' OR base64_content LIKE 'AAAAHG%' THEN
    RETURN 'video/mp4';
  ELSE
    RETURN 'application/octet-stream';
  END IF;
END;
$$;

-- Função para buscar mensagens com base64
CREATE OR REPLACE FUNCTION get_base64_messages(table_name text, batch_size integer DEFAULT 10)
RETURNS TABLE(id integer, media_base64 text, session_id text, message text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE format(
    'SELECT id, media_base64, session_id, message FROM %I 
     WHERE media_base64 IS NOT NULL 
     AND media_base64 != '''' 
     AND media_base64 LIKE ''data:%%'' 
     LIMIT %s',
    table_name, batch_size
  );
END;
$$;

-- Função para atualizar URL da mídia
CREATE OR REPLACE FUNCTION update_media_url(table_name text, record_id integer, media_url text, placeholder_message text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE format(
    'UPDATE %I SET media_base64 = %L, message = COALESCE(%L, message) WHERE id = %s',
    table_name, media_url, placeholder_message, record_id
  );
  
  RETURN FOUND;
END;
$$;
