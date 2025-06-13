-- Criação da tabela ai_providers para armazenar configurações de provedores de LLM
CREATE TABLE IF NOT EXISTS ai_providers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    provider_type VARCHAR(100) NOT NULL, -- 'openai', 'google_gemini', 'anthropic_claude', 'custom'
    api_key TEXT NOT NULL,
    base_url TEXT,
    default_model VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Configurações avançadas em JSON
    advanced_settings JSONB DEFAULT '{}',
    
    -- Índices para performance
    CONSTRAINT unique_provider_name_per_user UNIQUE(name, user_id)
);

-- Índices para otimização de consultas
CREATE INDEX IF NOT EXISTS idx_ai_providers_user_id ON ai_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_providers_provider_type ON ai_providers(provider_type);
CREATE INDEX IF NOT EXISTS idx_ai_providers_is_active ON ai_providers(is_active);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_ai_providers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ai_providers_updated_at
    BEFORE UPDATE ON ai_providers
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_providers_updated_at();

-- RLS (Row Level Security) para garantir que usuários só vejam seus próprios provedores
ALTER TABLE ai_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI providers" ON ai_providers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI providers" ON ai_providers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI providers" ON ai_providers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AI providers" ON ai_providers
    FOR DELETE USING (auth.uid() = user_id);

-- Comentários para documentação
COMMENT ON TABLE ai_providers IS 'Armazena configurações de provedores de LLM para cada usuário';
COMMENT ON COLUMN ai_providers.provider_type IS 'Tipo do provedor: openai, google_gemini, anthropic_claude, custom';
COMMENT ON COLUMN ai_providers.api_key IS 'Chave de API do provedor (criptografada)';
COMMENT ON COLUMN ai_providers.base_url IS 'URL base da API (opcional para provedores personalizados)';
COMMENT ON COLUMN ai_providers.default_model IS 'Modelo padrão a ser usado com este provedor';
COMMENT ON COLUMN ai_providers.advanced_settings IS 'Configurações avançadas em formato JSON (temperatura, max_tokens, etc.)';

