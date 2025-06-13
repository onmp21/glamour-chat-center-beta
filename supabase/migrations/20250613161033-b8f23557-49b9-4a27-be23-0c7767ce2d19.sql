
-- Criar bucket para armazenar mídias (se não existir)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media-files',
  'media-files', 
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'audio/mpeg', 'audio/ogg', 'video/mp4', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Políticas para permitir upload, visualização e delete de arquivos
DO $$
BEGIN
  -- Política para permitir upload de arquivos
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Allow public uploads') THEN
    CREATE POLICY "Allow public uploads" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'media-files');
  END IF;

  -- Política para permitir visualização de arquivos
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Allow public access') THEN
    CREATE POLICY "Allow public access" ON storage.objects
      FOR SELECT USING (bucket_id = 'media-files');
  END IF;

  -- Política para permitir deletar arquivos
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Allow public delete') THEN
    CREATE POLICY "Allow public delete" ON storage.objects
      FOR DELETE USING (bucket_id = 'media-files');
  END IF;
END $$;

-- Função para buscar mensagens com base64 (se não existir)
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

-- Função para atualizar registro após upload (se não existir)
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

-- Habilitar RLS na tabela ai_providers se não estiver habilitado
ALTER TABLE public.ai_providers ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes para ai_providers (se existirem)
DROP POLICY IF EXISTS "Users can view their own providers" ON public.ai_providers;
DROP POLICY IF EXISTS "Users can create their own providers" ON public.ai_providers;
DROP POLICY IF EXISTS "Users can update their own providers" ON public.ai_providers;
DROP POLICY IF EXISTS "Users can delete their own providers" ON public.ai_providers;

-- Criar políticas RLS para ai_providers
CREATE POLICY "Users can view their own providers" 
  ON public.ai_providers 
  FOR SELECT 
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create their own providers" 
  ON public.ai_providers 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own providers" 
  ON public.ai_providers 
  FOR UPDATE 
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own providers" 
  ON public.ai_providers 
  FOR DELETE 
  USING (auth.uid() = user_id OR user_id IS NULL);
