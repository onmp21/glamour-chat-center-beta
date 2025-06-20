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
- [ ] Modificar MediaProcessor para suportar URLs relativas (file/yelena/...)
- [ ] Melhorar detecção de tipo de mídia por extensão de arquivo
- [ ] Componentes de renderização já implementados
- [ ] Analisar `MediaProcessor.ts` para entender como as URLs de mídia são processadas e identificar a causa da não exibição de mídias com links.

## 7. Instâncias Conectadas
- [ ] Verificar o componente ou página que lista as instâncias e garantir que ele utilize `ApiInstanceService.getInstanceWithConnectionDetails` para obter o status e o QR code.
- [ ] Investigar o processo de criação de instâncias para garantir que a nova instância seja corretamente persistida e exibida.
- [ ] Analisar `useApiInstancesEnhanced` e `ApiInstanceCard` para entender como o status de conexão é tratado e exibido.
- [ ] Modificar `useApiInstancesEnhanced` para buscar os detalhes de conexão completos (incluindo QR code) para cada instância.
- [ ] Modificar `ApiInstanceCard` para exibir o QR code e o status de conexão de forma mais proeminente.
- [ ] Modificar `ApiInstanceService.ts` para garantir que `getInstanceWithConnectionDetails` retorne o QR code corretamente.
- [ ] Adicionar `qr_code?: string;` à interface `ApiInstance` em `useApiInstancesEnhanced.ts`.
- [ ] Adicionar `qr_code?: string;` à interface `ApiInstance` em `ApiInstanceCard.tsx`.
- [ ] Analisar `ApiInstanceForm.tsx` para verificar se o processo de criação de instâncias está funcionando corretamente.
- [ ] Analisar `ApiInstanceList.tsx` para verificar se o processo de criação de instâncias está funcionando corretamente.
- [ ] Analisar `ApiInstanceRepository.ts` para verificar se o processo de criação de instâncias está funcionando corretamente.
- [ ] Problema identificado: Erro "Invalid integration" ao criar instância na Evolution API. Verificar se o payload de criação está correto.
- [ ] Problema identificado: Sistema de login não está funcionando com credenciais admin/admin. Verificar configuração de autenticação.

## 8. Roteamento de Conversas
- [ ] Investigar por que canais criados estão abrindo conversas e contatos do canal \'yelena\'.
- [ ] Analisar o código responsável pelo roteamento de mensagens e contatos para os canais corretos.

## 9. Mensagens em Tempo Real
- [ ] Garantir que as mensagens apareçam em tempo real, similar ao WhatsApp.
- [ ] Verificar a implementação de WebSockets ou polling para atualização de mensagens.

## 10. Nomes das Planilhas
- [ ] Verificar a foto das tabelas fornecida pelo usuário para identificar os nomes corretos de todas as planilhas e garantir que o sistema as utilize adequadamente.

## 11. Interface do Usuário
- [ ] Garantir que nenhuma alteração na interface do usuário seja feita, conforme solicitado pelo usuário.


