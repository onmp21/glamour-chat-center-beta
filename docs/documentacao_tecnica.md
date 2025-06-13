# Documentação Técnica - Glamour Chat Center - Integração LLM e Relatórios Inteligentes

## 1. Introdução

Este documento detalha a implementação das melhorias na aba de relatórios do Glamour Chat Center, com a integração de funcionalidades de Large Language Models (LLMs) e uma nova seção para configuração de provedores de IA. O objetivo principal é permitir que os usuários gerem relatórios personalizados e obtenham insights a partir dos dados de conversas, utilizando o poder de LLMs, além de fornecer uma interface intuitiva para gerenciar as credenciais de diferentes provedores de LLM.

## 2. Arquitetura da Solução

A solução foi desenvolvida seguindo uma arquitetura de microsserviços, separando o frontend da aplicação principal do backend responsável pela integração com as LLMs. Isso garante maior segurança, escalabilidade e flexibilidade.

### 2.1. Componentes Principais

- **Frontend (Glamour Chat Center):** Aplicação React/Vite responsável pela interface do usuário. Foi modificado para incluir:
    - **Seção de Configurações de IA:** Para gerenciar os provedores de LLM.
    - **Aba de Relatórios Inteligentes:** Para gerar e visualizar relatórios.
- **Backend de Integração LLM (glamour-llm-backend):** Uma aplicação Flask separada, responsável por:
    - Gerenciar as chamadas às APIs das LLMs de forma segura.
    - Processar os dados antes de enviar para a LLM e formatar a resposta.
    - Atuar como um proxy seguro para as chaves de API das LLMs.
- **Supabase:** Utilizado como banco de dados para armazenar as configurações dos provedores de IA (`ai_providers`).

### 2.2. Fluxo de Dados

1.  **Configuração de Provedores de IA:**
    - O usuário acessa a seção de 


## 3. Estrutura de Diretórios e Arquivos

### 3.1. Frontend (glamour-chat-center)

- `src/components/ai-providers/`: Contém os componentes React para gerenciar os provedores de IA.
    - `AIProviderSettings.tsx`: Componente principal da seção de configurações de IA.
    - `AIProviderForm.tsx`: Formulário para adicionar/editar provedores.
    - `AIProviderList.tsx`: Exibe a lista de provedores configurados.
- `src/components/intelligent-reports/`: Contém o componente principal da aba de relatórios inteligentes.
    - `IntelligentReports.tsx`: Componente que consolida a interface de filtros, configurações e exibição de resultados de relatórios LLM.
- `src/services/`: Contém os serviços para interação com o backend e Supabase.
    - `AIProviderService.ts`: Serviço para operações CRUD em provedores de IA.
    - `ConversationService.ts`: Serviço otimizado para acesso a dados de conversas para análise LLM.
- `src/types/`: Definições de tipos TypeScript.
    - `ai-providers.ts`: Tipos para provedores de IA.
    - `intelligent-reports.ts`: Tipos para relatórios inteligentes.
- `src/hooks/`: Hooks React personalizados.
    - `useAIProviders.ts`: Hook para gerenciar o estado dos provedores de IA.
- `src/components/Sidebar.tsx`: Componente do sidebar, modificado para as novas cores e ícones.
- `src/components/Exams.tsx`: Componente da aba de exames, modificado para as novas cores de cabeçalho.
- `src/components/dashboard/ExamStatsCardsCompact.tsx`: Componente dos cards de exames no painel, modificado para as novas cores.
- `supabase/migrations/create_ai_providers_table.sql`: Script SQL para criação da tabela `ai_providers` no Supabase.

### 3.2. Backend (glamour-llm-backend)

- `src/main.py`: Arquivo principal da aplicação Flask, responsável por inicializar o servidor e registrar os blueprints.
- `src/routes/ai_providers.py`: Blueprint para gerenciar as operações relacionadas aos provedores de IA (testar conexão).
- `src/routes/intelligent_reports.py`: Blueprint para a lógica de geração de relatórios inteligentes, incluindo a chamada à API da LLM.
- `tests/`: Contém os testes unitários para o backend.
    - `test_ai_providers.py`: Testes para o blueprint de provedores de IA.
    - `test_intelligent_reports.py`: Testes para o blueprint de relatórios inteligentes.
- `requirements.txt`: Lista de dependências Python do backend.

## 4. Implementação Detalhada

### 4.1. Configurações de IA (Frontend)

Os componentes `AIProviderSettings`, `AIProviderForm` e `AIProviderList` foram desenvolvidos para permitir que o usuário adicione, edite, liste e teste as configurações de diferentes provedores de LLM. Eles utilizam o `AIProviderService` para interagir com o backend e o Supabase.

### 4.2. Backend de Integração LLM

O backend Flask (`glamour-llm-backend`) foi criado para atuar como um intermediário seguro entre o frontend e as APIs das LLMs. Ele expõe endpoints para:

- **`/api/ai/test-provider` (POST):** Recebe as configurações de um provedor de IA e realiza uma chamada de teste à API da LLM para verificar a conectividade e a validade da chave de API. Isso garante que as credenciais fornecidas pelo usuário são válidas antes de serem salvas.
- **`/api/reports/generate` (POST):** Este é o endpoint principal para a geração de relatórios. Ele recebe:
    - `provider_config`: Configurações do provedor de IA a ser utilizado (tipo, chave de API, modelo padrão).
    - `report_type`: Tipo de relatório a ser gerado (conversas, canais, customizado).
    - `data`: Dados relevantes (conversas, canais) obtidos do Supabase via `ConversationService` no frontend.
    - `custom_prompt`: Prompt personalizado fornecido pelo usuário para relatórios customizados.

O backend então:
1.  Seleciona a LLM apropriada com base no `provider_type`.
2.  Formata o prompt para a LLM, combinando o `custom_prompt` com os `data` fornecidos.
3.  Chama a API da LLM (OpenAI, Gemini, etc.) de forma segura, utilizando as chaves de API armazenadas no ambiente do servidor.
4.  Processa a resposta da LLM e a retorna ao frontend, juntamente com metadados como tokens utilizados e um resumo dos dados analisados.

### 4.3. Aba de Relatórios Inteligentes (Frontend)

O componente `IntelligentReports.tsx` é a interface central para a funcionalidade de relatórios inteligentes. Ele inclui:

- **Seleção de Provedor de IA:** Um dropdown que lista os provedores de IA ativos configurados na seção `AIProviderSettings`.
- **Filtros de Dados:** Campos para filtrar os dados que serão enviados para a LLM (canal, status, data de início, data de fim).
- **Tipo de Relatório:** Seleção entre 

