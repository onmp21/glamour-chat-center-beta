
export class WebhookConfigurationService {
  /**
   * Configurar webhook automaticamente após conexão
   */
  static async configureWebhook(evolutionService: any, instanceName: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🔗 [WEBHOOK_CONFIG] Configurando webhook para instância: ${instanceName}`);
      
      // URL do webhook baseada no projeto atual
      const webhookUrl = `${window.location.origin}/api/webhook/${instanceName}`;
      
      const result = await evolutionService.setWebhook(webhookUrl);
      
      if (result.success) {
        console.log(`✅ [WEBHOOK_CONFIG] Webhook configurado com sucesso para ${instanceName}`);
        return { success: true };
      } else {
        console.error(`❌ [WEBHOOK_CONFIG] Erro ao configurar webhook:`, result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ [WEBHOOK_CONFIG] Erro geral:', error);
      return { success: false, error: `Erro de configuração: ${error}` };
    }
  }
}
