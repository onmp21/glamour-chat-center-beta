
-- Função para criar tabela de conversas dinamicamente
CREATE OR REPLACE FUNCTION public.create_conversation_table(table_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sequence_name text;
  trigger_name text;
BEGIN
  -- Validar nome da tabela
  IF table_name !~ '^[a-zA-Z][a-zA-Z0-9_]*_conversas$' THEN
    RAISE EXCEPTION 'Nome da tabela deve terminar com "_conversas" e conter apenas letras, números e underscore';
  END IF;
  
  -- Verificar se a tabela já existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = table_name AND table_schema = 'public') THEN
    RAISE EXCEPTION 'Tabela % já existe', table_name;
  END IF;
  
  -- Criar sequence para a tabela
  sequence_name := table_name || '_id_seq';
  EXECUTE format('CREATE SEQUENCE %I', sequence_name);
  
  -- Criar tabela com estrutura padrão
  EXECUTE format('
    CREATE TABLE public.%I (
      id integer NOT NULL DEFAULT nextval(%L) PRIMARY KEY,
      session_id character varying NOT NULL,
      message text NOT NULL DEFAULT '''',
      nome_do_contato text,
      mensagemtype text DEFAULT ''text'',
      tipo_remetente text DEFAULT ''CONTATO_EXTERNO'',
      media_base64 text,
      media_url text,
      is_read boolean DEFAULT false,
      read_at timestamp with time zone
    )', table_name, sequence_name);
  
  -- Criar trigger para auto-save de contatos
  trigger_name := 'trigger_auto_save_contact_' || replace(table_name, '_conversas', '');
  EXECUTE format('
    CREATE TRIGGER %I
    BEFORE INSERT ON public.%I
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_save_contact_with_channel()', trigger_name, table_name);
  
  -- Criar trigger para mover base64 para coluna de mídia
  EXECUTE format('
    CREATE TRIGGER trigger_move_base64_%I
    BEFORE INSERT OR UPDATE ON public.%I
    FOR EACH ROW
    EXECUTE FUNCTION public.move_base64_to_media_column()', replace(table_name, '_', ''), table_name);
  
  RAISE NOTICE 'Tabela % criada com sucesso', table_name;
END;
$$;

-- Função para excluir tabela de conversas
CREATE OR REPLACE FUNCTION public.drop_conversation_table(table_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sequence_name text;
BEGIN
  -- Validar nome da tabela
  IF table_name !~ '^[a-zA-Z][a-zA-Z0-9_]*_conversas$' THEN
    RAISE EXCEPTION 'Nome da tabela deve terminar com "_conversas"';
  END IF;
  
  -- Verificar se a tabela existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = table_name AND table_schema = 'public') THEN
    RAISE EXCEPTION 'Tabela % não existe', table_name;
  END IF;
  
  -- Excluir tabela
  EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', table_name);
  
  -- Excluir sequence associada
  sequence_name := table_name || '_id_seq';
  EXECUTE format('DROP SEQUENCE IF EXISTS %I CASCADE', sequence_name);
  
  RAISE NOTICE 'Tabela % excluída com sucesso', table_name;
END;
$$;

-- Função para renomear tabela de conversas
CREATE OR REPLACE FUNCTION public.rename_conversation_table(old_name text, new_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  old_sequence text;
  new_sequence text;
BEGIN
  -- Validar nomes
  IF old_name !~ '^[a-zA-Z][a-zA-Z0-9_]*_conversas$' OR new_name !~ '^[a-zA-Z][a-zA-Z0-9_]*_conversas$' THEN
    RAISE EXCEPTION 'Nomes devem terminar com "_conversas"';
  END IF;
  
  -- Verificar se tabela antiga existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = old_name AND table_schema = 'public') THEN
    RAISE EXCEPTION 'Tabela % não existe', old_name;
  END IF;
  
  -- Verificar se nova tabela não existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = new_name AND table_schema = 'public') THEN
    RAISE EXCEPTION 'Tabela % já existe', new_name;
  END IF;
  
  -- Renomear tabela
  EXECUTE format('ALTER TABLE public.%I RENAME TO %I', old_name, new_name);
  
  -- Renomear sequence
  old_sequence := old_name || '_id_seq';
  new_sequence := new_name || '_id_seq';
  EXECUTE format('ALTER SEQUENCE %I RENAME TO %I', old_sequence, new_sequence);
  
  RAISE NOTICE 'Tabela renomeada de % para %', old_name, new_name;
END;
$$;

-- Função para backup de tabela antes de excluir
CREATE OR REPLACE FUNCTION public.backup_conversation_table(table_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  backup_name text;
  record_count integer;
BEGIN
  backup_name := table_name || '_backup_' || to_char(now(), 'YYYYMMDD_HH24MISS');
  
  -- Criar tabela de backup
  EXECUTE format('CREATE TABLE public.%I AS SELECT * FROM public.%I', backup_name, table_name);
  
  -- Contar registros
  EXECUTE format('SELECT COUNT(*) FROM public.%I', backup_name) INTO record_count;
  
  RAISE NOTICE 'Backup criado: % com % registros', backup_name, record_count;
  RETURN backup_name;
END;
$$;

-- Atualizar trigger de audit log para operações de canal
CREATE OR REPLACE FUNCTION public.log_channel_operation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.create_audit_log(
      'Sistema',
      'CREATE_CHANNEL',
      'channel',
      null,
      NEW.id::text,
      jsonb_build_object('channel_name', NEW.name, 'channel_type', NEW.type)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.create_audit_log(
      'Sistema',
      'UPDATE_CHANNEL',
      'channel',
      null,
      NEW.id::text,
      jsonb_build_object('old_name', OLD.name, 'new_name', NEW.name, 'old_active', OLD.is_active, 'new_active', NEW.is_active)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.create_audit_log(
      'Sistema',
      'DELETE_CHANNEL',
      'channel',
      null,
      OLD.id::text,
      jsonb_build_object('channel_name', OLD.name, 'channel_type', OLD.type)
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Adicionar trigger de auditoria na tabela channels
DROP TRIGGER IF EXISTS trigger_channel_audit ON public.channels;
CREATE TRIGGER trigger_channel_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.channels
  FOR EACH ROW
  EXECUTE FUNCTION public.log_channel_operation();
