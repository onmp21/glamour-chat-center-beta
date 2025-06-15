
-- Adiciona a coluna 'is_read' se não existir à tabela yelena_ai_conversas
ALTER TABLE yelena_ai_conversas
ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;

-- (Opcional) Atualiza os registros existentes para garantir consistência
UPDATE yelena_ai_conversas SET is_read = false WHERE is_read IS NULL;
