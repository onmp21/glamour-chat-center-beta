
-- Corrigir função para criar tabela de conversas sem media_base64
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
  
  -- Verificar se a tabela já existe (corrigido - usando alias para resolver ambiguidade)
  IF EXISTS (SELECT 1 FROM information_schema.tables t WHERE t.table_name = $1 AND t.table_schema = 'public') THEN
    RAISE EXCEPTION 'Tabela % já existe', table_name;
  END IF;
  
  -- Criar sequence para a tabela
  sequence_name := table_name || '_id_seq';
  EXECUTE format('CREATE SEQUENCE %I', sequence_name);
  
  -- Criar tabela com estrutura padrão (sem media_base64)
  EXECUTE format('
    CREATE TABLE public.%I (
      id integer NOT NULL DEFAULT nextval(%L) PRIMARY KEY,
      session_id character varying NOT NULL,
      message text NOT NULL DEFAULT '''',
      nome_do_contato text,
      mensagemtype text DEFAULT ''text'',
      tipo_remetente text DEFAULT ''CONTATO_EXTERNO'',
      media_url text,
      is_read boolean DEFAULT false,
      read_at timestamp with time zone DEFAULT now()
    )', table_name, sequence_name);
  
  -- Criar trigger para auto-save de contatos
  trigger_name := 'trigger_auto_save_contact_' || replace(table_name, '_conversas', '');
  EXECUTE format('
    CREATE TRIGGER %I
    BEFORE INSERT ON public.%I
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_save_contact_with_channel()', trigger_name, table_name);
  
  RAISE NOTICE 'Tabela % criada com sucesso', table_name;
END;
$$;
