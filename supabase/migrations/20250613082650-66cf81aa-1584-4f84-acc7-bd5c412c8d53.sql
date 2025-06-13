
-- Criar bucket para armazenar mídias
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media-files',
  'media-files', 
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'audio/mpeg', 'audio/ogg', 'video/mp4', 'application/pdf']
);

-- Política para permitir upload de arquivos
CREATE POLICY "Allow public uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'media-files');

-- Política para permitir visualização de arquivos
CREATE POLICY "Allow public access" ON storage.objects
  FOR SELECT USING (bucket_id = 'media-files');

-- Política para permitir deletar arquivos
CREATE POLICY "Allow public delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'media-files');

-- Função para processar base64 e fazer upload para storage
CREATE OR REPLACE FUNCTION public.process_base64_to_storage(
  base64_content TEXT,
  file_name TEXT DEFAULT NULL,
  mime_type TEXT DEFAULT NULL
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  detected_mime TEXT;
  file_extension TEXT;
  generated_filename TEXT;
  upload_path TEXT;
BEGIN
  -- Detectar tipo MIME se não fornecido
  IF mime_type IS NULL THEN
    detected_mime := detect_mime_from_base64(base64_content);
  ELSE
    detected_mime := mime_type;
  END IF;
  
  -- Determinar extensão do arquivo
  CASE detected_mime
    WHEN 'image/jpeg' THEN file_extension := '.jpg';
    WHEN 'image/png' THEN file_extension := '.png';
    WHEN 'image/gif' THEN file_extension := '.gif';
    WHEN 'image/webp' THEN file_extension := '.webp';
    WHEN 'audio/mpeg' THEN file_extension := '.mp3';
    WHEN 'audio/ogg' THEN file_extension := '.ogg';
    WHEN 'video/mp4' THEN file_extension := '.mp4';
    WHEN 'application/pdf' THEN file_extension := '.pdf';
    ELSE file_extension := '.bin';
  END CASE;
  
  -- Gerar nome do arquivo se não fornecido
  IF file_name IS NULL THEN
    generated_filename := 'media_' || extract(epoch from now()) || '_' || gen_random_uuid() || file_extension;
  ELSE
    generated_filename := file_name || file_extension;
  END IF;
  
  -- Retornar URL do storage (o upload será feito pelo cliente)
  upload_path := 'https://uxccfhptochnfomurulr.supabase.co/storage/v1/object/public/media-files/' || generated_filename;
  
  RETURN upload_path;
END;
$$;

-- Função para migrar base64 existentes (será executada via edge function)
CREATE OR REPLACE FUNCTION public.get_base64_messages(table_name TEXT, batch_size INTEGER DEFAULT 10)
RETURNS TABLE(
  id INTEGER,
  media_base64 TEXT,
  session_id TEXT,
  message TEXT
)
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

-- Função para atualizar registro após upload
CREATE OR REPLACE FUNCTION public.update_media_url(
  table_name TEXT,
  record_id INTEGER,
  media_url TEXT,
  placeholder_message TEXT DEFAULT NULL
)
RETURNS BOOLEAN
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
