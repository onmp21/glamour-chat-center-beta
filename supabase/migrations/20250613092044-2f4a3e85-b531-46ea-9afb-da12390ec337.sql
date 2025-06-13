
-- Padronizar nome da coluna para minúsculo em todas as tabelas
ALTER TABLE yelena_ai_conversas 
RENAME COLUMN "Nome_do_contato" TO nome_do_contato;

ALTER TABLE gerente_externo_conversas 
RENAME COLUMN "Nome_do_contato" TO nome_do_contato;
