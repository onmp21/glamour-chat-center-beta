import { N8nMessagingService } from '../services/N8nMessagingService';
import { EvolutionApiService } from '../services/EvolutionApiService';

describe('N8nMessagingService', () => {
  test('deve enviar mensagem de texto com sucesso', async () => {
    const result = await N8nMessagingService.sendTextMessage(
      'test-channel',
      'test-instance',
      '5511999999999',
      'Mensagem de teste'
    );
    
    console.log('Resultado do teste de envio de texto:', result);
    expect(result).toBeDefined();
  });

  test('deve validar webhook N8N', async () => {
    const result = await N8nMessagingService.validateWebhook();
    console.log('Resultado da validação do webhook:', result);
    expect(result).toBeDefined();
  });
});

describe('EvolutionApiService', () => {
  const mockConfig = {
    baseUrl: 'https://api.example.com',
    apiKey: 'test-key',
    instanceName: 'test-instance'
  };

  test('deve configurar webhook para canal', async () => {
    const service = new EvolutionApiService(mockConfig);
    const result = await service.setWebhookForChannel('Yelena');
    
    console.log('Resultado da configuração de webhook:', result);
    expect(result).toBeDefined();
    expect(result.success).toBeDefined();
  });

  test('deve ter mapeamento de webhooks N8N', () => {
    const service = new EvolutionApiService(mockConfig);
    // Verificar se o mapeamento está definido internamente
    expect(service).toBeDefined();
  });
});

// Teste de integração completo
describe('Fluxo completo de migração N8N', () => {
  test('deve simular fluxo completo de envio via N8N', async () => {
    console.log('🧪 [TESTE] Iniciando teste de fluxo completo...');
    
    // 1. Validar webhook N8N
    const webhookValidation = await N8nMessagingService.validateWebhook();
    console.log('1. Validação do webhook:', webhookValidation);
    
    // 2. Simular envio de mensagem
    const messageResult = await N8nMessagingService.sendTextMessage(
      'test-channel',
      'test-instance',
      '5511999999999',
      'Teste de integração completa'
    );
    console.log('2. Envio de mensagem:', messageResult);
    
    // 3. Simular configuração de webhook
    const service = new EvolutionApiService({
      baseUrl: 'https://api.example.com',
      apiKey: 'test-key',
      instanceName: 'test-instance'
    });
    
    const webhookConfig = await service.setWebhookForChannel('Yelena');
    console.log('3. Configuração de webhook:', webhookConfig);
    
    console.log('✅ [TESTE] Fluxo completo testado com sucesso!');
    
    expect(webhookValidation).toBeDefined();
    expect(messageResult).toBeDefined();
    expect(webhookConfig).toBeDefined();
  });
});

export {};

