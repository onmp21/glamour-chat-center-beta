# TODO - Implementações Pendentes

## 1. Aba Mensagens - Seção Contatos
- [ ] Mostrar contatos de todos os canais, não só do canal Yelena
- [ ] Se o mesmo contato existir em múltiplos canais, mostrar indicativo de qual canal
- [ ] Ao clicar no contato, mostrar opção de qual canal abrir

## 2. Relatórios Inteligentes
- [x] Corrigir cores no modo escuro que estavam bugadas
- [x] Implementar função de seleção múltipla de canais
- [x] Configurar acesso às planilhas:
  - Análise de conversas: acesso à coluna "message" de cada canal selecionado
  - Análise de canais: acesso à planilha toda
  - Análise de exames: acesso à planilha de exames
  - Relatório personalizado: opção de escolher quais tabelas acessar

## 3. API Evolution
- [ ] Ao validar API, mostrar todos os canais ativos
- [ ] Verificar documentação da Evolution API se não estiver retornando canais
- [ ] Configurar webhook para cada canal com eventos:
  - WEBHOOK_BASE64
  - MESSAGES_UPSERT
  - GROUPS_UPSERT
- [ ] Mapear webhooks N8N por canal:
  - Yelena: https://n8n.estudioonmp.com/webhook/ff428473-8d5a-468a-885a-865ec1e474a2wwd1w13we
  - Canarana: https://n8n.estudioonmp.com/webhook/ff428473-8d5a-468a-885a-865ec1e474a2wwd21
  - Souto Soares: https://n8n.estudioonmp.com/webhook/ff428473-8d5a-468a-885a-865ec1e474a2wwd23
  - João Dourado: https://n8n.estudioonmp.com/webhook/ff428473-8d5a-468a-885a-865ec1e474a2wwd123
  - Gerente das Lojas: https://n8n.estudioonmp.com/webhook/ff428473-8d5a-468a-885a-865ec1e474a2wwd12345
  - Gerente do Externo: https://n8n.estudioonmp.com/webhook/ff428473-8d5a-468a-885a-865ec1e474a2wwd324
  - América Dourada: https://n8n.estudioonmp.com/webhook/ff428473-8d5a-468a-885a-865ec1e474a2wwd34

## 4. Aba Painel
- [x] Corrigir cards de estatísticas para mostrar dados de todos os canais (já implementado)
- [x] Implementar seção "Atividades Recentes":
  - Mostrar última mensagem de cada atividade
  - Limitar a 7 linhas

## 5. Overlay do Chat
- [x] Implementar limite de palavras no nome do contato nos cards para não passar das margens

## 6. Mídia no WhatsApp Style
- [x] Modificar MediaProcessor para suportar URLs relativas (file/yelena/...)
- [x] Melhorar detecção de tipo de mídia por extensão de arquivo
- [x] Componentes de renderização já implementados

