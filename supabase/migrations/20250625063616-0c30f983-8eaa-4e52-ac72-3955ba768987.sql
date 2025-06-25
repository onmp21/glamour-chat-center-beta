
-- Alterar coluna read_at para text em todas as tabelas de canais
-- Primeiro, vamos alterar a tabela yelena_ai_conversas
ALTER TABLE public.yelena_ai_conversas 
ALTER COLUMN read_at TYPE text 
USING read_at::text;

-- Alterar a tabela gerente_externo_conversas
ALTER TABLE public.gerente_externo_conversas 
ALTER COLUMN read_at TYPE text 
USING read_at::text;

-- Alterar a tabela america_dourada_conversas
ALTER TABLE public.america_dourada_conversas 
ALTER COLUMN read_at TYPE text 
USING read_at::text;

-- Alterar a tabela joao_dourado_conversas
ALTER TABLE public.joao_dourado_conversas 
ALTER COLUMN read_at TYPE text 
USING read_at::text;

-- Alterar a tabela gerente_lojas_conversas
ALTER TABLE public.gerente_lojas_conversas 
ALTER COLUMN read_at TYPE text 
USING read_at::text;

-- Alterar a tabela canarana_conversas
ALTER TABLE public.canarana_conversas 
ALTER COLUMN read_at TYPE text 
USING read_at::text;

-- Alterar a tabela souto_soares_conversas
ALTER TABLE public.souto_soares_conversas 
ALTER COLUMN read_at TYPE text 
USING read_at::text;

-- Alterar os defaults para usar string ao invés de now()
ALTER TABLE public.yelena_ai_conversas 
ALTER COLUMN read_at SET DEFAULT '';

ALTER TABLE public.gerente_externo_conversas 
ALTER COLUMN read_at SET DEFAULT '';

ALTER TABLE public.america_dourada_conversas 
ALTER COLUMN read_at SET DEFAULT '';

ALTER TABLE public.joao_dourado_conversas 
ALTER COLUMN read_at SET DEFAULT '';

ALTER TABLE public.gerente_lojas_conversas 
ALTER COLUMN read_at SET DEFAULT '';

ALTER TABLE public.canarana_conversas 
ALTER COLUMN read_at SET DEFAULT '';

ALTER TABLE public.souto_soares_conversas 
ALTER COLUMN read_at SET DEFAULT '';
