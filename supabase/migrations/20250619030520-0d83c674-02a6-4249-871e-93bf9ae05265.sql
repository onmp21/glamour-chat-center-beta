
-- Criar tabela de contatos para salvar nomes e números automaticamente
CREATE TABLE public.contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number text NOT NULL UNIQUE,
  contact_name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Criar índice para busca rápida por número
CREATE INDEX idx_contacts_phone_number ON public.contacts(phone_number);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_contacts_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_contacts_updated_at_trigger
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_contacts_updated_at();

-- Função para salvar contato automaticamente quando nome_do_contato for preenchido
CREATE OR REPLACE FUNCTION auto_save_contact()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  phone_extracted text;
BEGIN
  -- Extrair número de telefone da session_id (formato esperado: numero@session)
  phone_extracted := split_part(NEW.session_id, '@', 1);
  
  -- Se nome_do_contato não está vazio e temos um telefone válido
  IF NEW.nome_do_contato IS NOT NULL 
     AND NEW.nome_do_contato != '' 
     AND phone_extracted IS NOT NULL 
     AND phone_extracted != '' THEN
    
    -- Inserir ou atualizar contato (upsert)
    INSERT INTO public.contacts (phone_number, contact_name)
    VALUES (phone_extracted, NEW.nome_do_contato)
    ON CONFLICT (phone_number) 
    DO UPDATE SET 
      contact_name = EXCLUDED.contact_name,
      updated_at = now()
    WHERE contacts.contact_name != EXCLUDED.contact_name;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar triggers para todas as tabelas de conversas
CREATE TRIGGER auto_save_contact_yelena
  AFTER INSERT OR UPDATE ON public.yelena_ai_conversas
  FOR EACH ROW
  EXECUTE FUNCTION auto_save_contact();

CREATE TRIGGER auto_save_contact_canarana
  AFTER INSERT OR UPDATE ON public.canarana_conversas
  FOR EACH ROW
  EXECUTE FUNCTION auto_save_contact();

CREATE TRIGGER auto_save_contact_souto
  AFTER INSERT OR UPDATE ON public.souto_soares_conversas
  FOR EACH ROW
  EXECUTE FUNCTION auto_save_contact();

CREATE TRIGGER auto_save_contact_joao
  AFTER INSERT OR UPDATE ON public.joao_dourado_conversas
  FOR EACH ROW
  EXECUTE FUNCTION auto_save_contact();

CREATE TRIGGER auto_save_contact_america
  AFTER INSERT OR UPDATE ON public.america_dourada_conversas
  FOR EACH ROW
  EXECUTE FUNCTION auto_save_contact();

CREATE TRIGGER auto_save_contact_gerente_lojas
  AFTER INSERT OR UPDATE ON public.gerente_lojas_conversas
  FOR EACH ROW
  EXECUTE FUNCTION auto_save_contact();

CREATE TRIGGER auto_save_contact_gerente_externo
  AFTER INSERT OR UPDATE ON public.gerente_externo_conversas
  FOR EACH ROW
  EXECUTE FUNCTION auto_save_contact();
