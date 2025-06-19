
-- Adicionar coluna channels na tabela contacts
ALTER TABLE public.contacts 
ADD COLUMN channels text[] DEFAULT ARRAY[]::text[];

-- Criar índice para performance nas consultas por canal
CREATE INDEX IF NOT EXISTS idx_contacts_channels ON public.contacts USING GIN(channels);

-- Atualizar a função auto_save_contact para incluir informação do canal
CREATE OR REPLACE FUNCTION public.auto_save_contact_with_channel()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  phone_extracted text;
  table_channel text;
BEGIN
  -- Extrair número de telefone da session_id (formato esperado: numero@session)
  phone_extracted := split_part(NEW.session_id, '@', 1);
  
  -- Determinar canal baseado no nome da tabela
  table_channel := CASE TG_TABLE_NAME
    WHEN 'yelena_ai_conversas' THEN 'chat'
    WHEN 'canarana_conversas' THEN 'canarana'
    WHEN 'souto_soares_conversas' THEN 'souto-soares'
    WHEN 'joao_dourado_conversas' THEN 'joao-dourado'
    WHEN 'america_dourada_conversas' THEN 'america-dourada'
    WHEN 'gerente_lojas_conversas' THEN 'gerente-lojas'
    WHEN 'gerente_externo_conversas' THEN 'gerente-externo'
    ELSE 'unknown'
  END;
  
  -- Se nome_do_contato não está vazio e temos um telefone válido
  IF NEW.nome_do_contato IS NOT NULL 
     AND NEW.nome_do_contato != '' 
     AND phone_extracted IS NOT NULL 
     AND phone_extracted != '' 
     AND table_channel != 'unknown' THEN
    
    -- Inserir ou atualizar contato com canal (upsert)
    INSERT INTO public.contacts (phone_number, contact_name, channels)
    VALUES (phone_extracted, NEW.nome_do_contato, ARRAY[table_channel])
    ON CONFLICT (phone_number) 
    DO UPDATE SET 
      contact_name = CASE 
        WHEN contacts.contact_name != EXCLUDED.contact_name THEN EXCLUDED.contact_name
        ELSE contacts.contact_name
      END,
      channels = CASE
        WHEN NOT (table_channel = ANY(contacts.channels)) THEN 
          array_append(contacts.channels, table_channel)
        ELSE contacts.channels
      END,
      updated_at = now()
    WHERE contacts.contact_name != EXCLUDED.contact_name 
       OR NOT (table_channel = ANY(contacts.channels));
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Criar triggers para todas as tabelas de conversas
DO $$ 
DECLARE
  table_name text;
BEGIN
  FOR table_name IN 
    SELECT unnest(ARRAY[
      'yelena_ai_conversas',
      'canarana_conversas', 
      'souto_soares_conversas',
      'joao_dourado_conversas',
      'america_dourada_conversas',
      'gerente_lojas_conversas',
      'gerente_externo_conversas'
    ])
  LOOP
    -- Remover trigger antigo se existir
    EXECUTE format('DROP TRIGGER IF EXISTS auto_save_contact_trigger ON %I', table_name);
    
    -- Criar novo trigger
    EXECUTE format(
      'CREATE TRIGGER auto_save_contact_with_channel_trigger
       BEFORE INSERT ON %I
       FOR EACH ROW EXECUTE FUNCTION auto_save_contact_with_channel()', 
      table_name
    );
  END LOOP;
END $$;
