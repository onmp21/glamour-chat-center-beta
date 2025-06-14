
-- REMOVE (DROP) A TABELA USERS E FUNÇÕES ANTIGAS:
DROP FUNCTION IF EXISTS verify_user_credentials CASCADE;
DROP FUNCTION IF EXISTS create_user_with_hash CASCADE;
DROP FUNCTION IF EXISTS update_user_with_hash CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- NOVA ESTRUTURA
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'salesperson', 'manager_external', 'manager_store', 'manager')),
  assigned_tabs TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  assigned_channels TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEX para facilitar buscas por username ativo
CREATE INDEX idx_users_active_username ON users (username, is_active);

-- Função para verificação de login
CREATE OR REPLACE FUNCTION verify_user_credentials(
  input_username TEXT,
  input_password TEXT
)
RETURNS TABLE(
  user_id UUID,
  user_username TEXT,
  user_name TEXT,
  user_role TEXT,
  user_assigned_tabs TEXT[],
  user_assigned_channels TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.username, u.name, u.role, u.assigned_tabs, u.assigned_channels
  FROM users u
  WHERE u.username = input_username
    AND u.password_hash = crypt(input_password, u.password_hash)
    AND u.is_active = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar usuário já com hash
CREATE OR REPLACE FUNCTION create_user_with_hash(
  p_username TEXT,
  p_password TEXT,
  p_name TEXT,
  p_role TEXT,
  p_assigned_tabs TEXT[],
  p_assigned_channels TEXT[]
)
RETURNS UUID AS $$
DECLARE
  new_user_id UUID;
BEGIN
  INSERT INTO users (username, password_hash, name, role, assigned_tabs, assigned_channels)
  VALUES (
    p_username,
    crypt(p_password, gen_salt('bf')),
    p_name,
    p_role,
    p_assigned_tabs,
    p_assigned_channels
  )
  RETURNING id INTO new_user_id;
  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para atualizar usuário (mantém hash se não mudar a senha)
CREATE OR REPLACE FUNCTION update_user_with_hash(
  p_user_id UUID,
  p_username TEXT DEFAULT NULL,
  p_password TEXT DEFAULT NULL,
  p_name TEXT DEFAULT NULL,
  p_role TEXT DEFAULT NULL,
  p_assigned_tabs TEXT[] DEFAULT NULL,
  p_assigned_channels TEXT[] DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE users
  SET
    username = COALESCE(p_username, username),
    password_hash = CASE WHEN p_password IS NOT NULL THEN crypt(p_password, gen_salt('bf')) ELSE password_hash END,
    name = COALESCE(p_name, name),
    role = COALESCE(p_role, role),
    assigned_tabs = COALESCE(p_assigned_tabs, assigned_tabs),
    assigned_channels = COALESCE(p_assigned_channels, assigned_channels),
    updated_at = NOW()
  WHERE id = p_user_id
    AND is_active = TRUE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuário não encontrado ou inativo';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Adiciona usuário admin padrão (senha: admin123)
INSERT INTO users (username, password_hash, name, role, assigned_tabs, assigned_channels)
VALUES (
  'admin',
  crypt('admin123', gen_salt('bf')),
  'Administrador Geral',
  'admin',
  ARRAY['dashboard', 'mensagens', 'exames', 'configuracoes', 'relatorios'],
  ARRAY['chat', 'canarana', 'souto-soares', 'joao-dourado', 'america-dourada', 'gerente-lojas', 'gerente-externo']
);

