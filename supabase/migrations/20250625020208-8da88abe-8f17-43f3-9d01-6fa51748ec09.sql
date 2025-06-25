
-- Padronizar tabela yelena_ai_conversas
ALTER TABLE public.yelena_ai_conversas 
DROP COLUMN IF EXISTS media_url,
DROP COLUMN IF EXISTS media_base64;

-- Adicionar colunas faltantes se não existirem
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'yelena_ai_conversas' AND column_name = 'nome_do_contato') THEN
        ALTER TABLE public.yelena_ai_conversas ADD COLUMN nome_do_contato text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'yelena_ai_conversas' AND column_name = 'mensagemtype') THEN
        ALTER TABLE public.yelena_ai_conversas ADD COLUMN mensagemtype text DEFAULT 'text';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'yelena_ai_conversas' AND column_name = 'tipo_remetente') THEN
        ALTER TABLE public.yelena_ai_conversas ADD COLUMN tipo_remetente text DEFAULT 'CONTATO_EXTERNO';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'yelena_ai_conversas' AND column_name = 'is_read') THEN
        ALTER TABLE public.yelena_ai_conversas ADD COLUMN is_read boolean DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'yelena_ai_conversas' AND column_name = 'read_at') THEN
        ALTER TABLE public.yelena_ai_conversas ADD COLUMN read_at timestamp with time zone DEFAULT now();
    END IF;
END $$;

-- Padronizar defaults para yelena_ai_conversas
ALTER TABLE public.yelena_ai_conversas 
ALTER COLUMN message SET DEFAULT '',
ALTER COLUMN mensagemtype SET DEFAULT 'text',
ALTER COLUMN tipo_remetente SET DEFAULT 'CONTATO_EXTERNO',
ALTER COLUMN is_read SET DEFAULT false,
ALTER COLUMN read_at SET DEFAULT now();

-- Padronizar tabela canarana_conversas
ALTER TABLE public.canarana_conversas 
DROP COLUMN IF EXISTS media_base64;

-- Adicionar colunas faltantes se não existirem
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'canarana_conversas' AND column_name = 'nome_do_contato') THEN
        ALTER TABLE public.canarana_conversas ADD COLUMN nome_do_contato text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'canarana_conversas' AND column_name = 'mensagemtype') THEN
        ALTER TABLE public.canarana_conversas ADD COLUMN mensagemtype text DEFAULT 'text';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'canarana_conversas' AND column_name = 'tipo_remetente') THEN
        ALTER TABLE public.canarana_conversas ADD COLUMN tipo_remetente text DEFAULT 'CONTATO_EXTERNO';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'canarana_conversas' AND column_name = 'is_read') THEN
        ALTER TABLE public.canarana_conversas ADD COLUMN is_read boolean DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'canarana_conversas' AND column_name = 'read_at') THEN
        ALTER TABLE public.canarana_conversas ADD COLUMN read_at timestamp with time zone DEFAULT now();
    END IF;
END $$;

-- Padronizar defaults para canarana_conversas
ALTER TABLE public.canarana_conversas 
ALTER COLUMN message SET DEFAULT '',
ALTER COLUMN mensagemtype SET DEFAULT 'text',
ALTER COLUMN tipo_remetente SET DEFAULT 'CONTATO_EXTERNO',
ALTER COLUMN is_read SET DEFAULT false,
ALTER COLUMN read_at SET DEFAULT now();

-- Padronizar tabela souto_soares_conversas
ALTER TABLE public.souto_soares_conversas 
DROP COLUMN IF EXISTS media_base64;

-- Adicionar colunas faltantes se não existirem
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'souto_soares_conversas' AND column_name = 'nome_do_contato') THEN
        ALTER TABLE public.souto_soares_conversas ADD COLUMN nome_do_contato text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'souto_soares_conversas' AND column_name = 'mensagemtype') THEN
        ALTER TABLE public.souto_soares_conversas ADD COLUMN mensagemtype text DEFAULT 'text';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'souto_soares_conversas' AND column_name = 'tipo_remetente') THEN
        ALTER TABLE public.souto_soares_conversas ADD COLUMN tipo_remetente text DEFAULT 'CONTATO_EXTERNO';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'souto_soares_conversas' AND column_name = 'is_read') THEN
        ALTER TABLE public.souto_soares_conversas ADD COLUMN is_read boolean DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'souto_soares_conversas' AND column_name = 'read_at') THEN
        ALTER TABLE public.souto_soares_conversas ADD COLUMN read_at timestamp with time zone DEFAULT now();
    END IF;
END $$;

-- Padronizar defaults para souto_soares_conversas
ALTER TABLE public.souto_soares_conversas 
ALTER COLUMN message SET DEFAULT '',
ALTER COLUMN mensagemtype SET DEFAULT 'text',
ALTER COLUMN tipo_remetente SET DEFAULT 'CONTATO_EXTERNO',
ALTER COLUMN is_read SET DEFAULT false,
ALTER COLUMN read_at SET DEFAULT now();

-- Padronizar tabela joao_dourado_conversas
ALTER TABLE public.joao_dourado_conversas 
DROP COLUMN IF EXISTS media_url;

-- Adicionar colunas faltantes se não existirem
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'joao_dourado_conversas' AND column_name = 'nome_do_contato') THEN
        ALTER TABLE public.joao_dourado_conversas ADD COLUMN nome_do_contato text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'joao_dourado_conversas' AND column_name = 'mensagemtype') THEN
        ALTER TABLE public.joao_dourado_conversas ADD COLUMN mensagemtype text DEFAULT 'text';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'joao_dourado_conversas' AND column_name = 'tipo_remetente') THEN
        ALTER TABLE public.joao_dourado_conversas ADD COLUMN tipo_remetente text DEFAULT 'CONTATO_EXTERNO';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'joao_dourado_conversas' AND column_name = 'is_read') THEN
        ALTER TABLE public.joao_dourado_conversas ADD COLUMN is_read boolean DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'joao_dourado_conversas' AND column_name = 'read_at') THEN
        ALTER TABLE public.joao_dourado_conversas ADD COLUMN read_at timestamp with time zone DEFAULT now();
    END IF;
END $$;

-- Padronizar defaults para joao_dourado_conversas
ALTER TABLE public.joao_dourado_conversas 
ALTER COLUMN message SET DEFAULT '',
ALTER COLUMN mensagemtype SET DEFAULT 'text',
ALTER COLUMN tipo_remetente SET DEFAULT 'CONTATO_EXTERNO',
ALTER COLUMN is_read SET DEFAULT false,
ALTER COLUMN read_at SET DEFAULT now();

-- Padronizar tabela america_dourada_conversas
ALTER TABLE public.america_dourada_conversas 
DROP COLUMN IF EXISTS media_base64;

-- Adicionar colunas faltantes se não existirem
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'america_dourada_conversas' AND column_name = 'nome_do_contato') THEN
        ALTER TABLE public.america_dourada_conversas ADD COLUMN nome_do_contato text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'america_dourada_conversas' AND column_name = 'mensagemtype') THEN
        ALTER TABLE public.america_dourada_conversas ADD COLUMN mensagemtype text DEFAULT 'text';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'america_dourada_conversas' AND column_name = 'tipo_remetente') THEN
        ALTER TABLE public.america_dourada_conversas ADD COLUMN tipo_remetente text DEFAULT 'CONTATO_EXTERNO';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'america_dourada_conversas' AND column_name = 'is_read') THEN
        ALTER TABLE public.america_dourada_conversas ADD COLUMN is_read boolean DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'america_dourada_conversas' AND column_name = 'read_at') THEN
        ALTER TABLE public.america_dourada_conversas ADD COLUMN read_at timestamp with time zone DEFAULT now();
    END IF;
END $$;

-- Padronizar defaults para america_dourada_conversas
ALTER TABLE public.america_dourada_conversas 
ALTER COLUMN message SET DEFAULT '',
ALTER COLUMN mensagemtype SET DEFAULT 'text',
ALTER COLUMN tipo_remetente SET DEFAULT 'CONTATO_EXTERNO',
ALTER COLUMN is_read SET DEFAULT false,
ALTER COLUMN read_at SET DEFAULT now();

-- Padronizar tabela gerente_lojas_conversas
-- Já tem todas as colunas, apenas padronizar defaults
ALTER TABLE public.gerente_lojas_conversas 
ALTER COLUMN message SET DEFAULT '',
ALTER COLUMN mensagemtype SET DEFAULT 'text',
ALTER COLUMN tipo_remetente SET DEFAULT 'CONTATO_EXTERNO',
ALTER COLUMN is_read SET DEFAULT false,
ALTER COLUMN read_at SET DEFAULT now();

-- Padronizar tabela gerente_externo_conversas
-- Já tem todas as colunas, apenas padronizar defaults
ALTER TABLE public.gerente_externo_conversas 
ALTER COLUMN message SET DEFAULT '',
ALTER COLUMN mensagemtype SET DEFAULT 'text',
ALTER COLUMN tipo_remetente SET DEFAULT 'CONTATO_EXTERNO',
ALTER COLUMN is_read SET DEFAULT false,
ALTER COLUMN read_at SET DEFAULT now();
