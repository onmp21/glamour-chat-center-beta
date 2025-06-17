
import { supabase } from '@/integrations/supabase/client';
import { EvolutionApiService } from './EvolutionApiService';

export class WebhookValidationService {
  private static readonly UNIVERSAL_WEBHOOK = 'https://n8n.estudioonmp.com/webhook/3a0b2487-21d0-43c7-bc7f-07404879df5434232';

  /**
   * Verifica e configura webhook universal para todos os canais ativos
   */
  static async validateAndConfigureAllChannels(): Promise<{ success: boolean; results: any[]; error?: string }> {
    try {
      console.log('🔄 [WEBHOOK_VALIDATION] Verificando configuração de webhooks para todos os canais');

      // Buscar todos os mappings de canais ativos
      const { data: mappings, error: mappingError } = await supabase
        .from('channel_instance_mappings')
        .select('*')
        .eq('is_active', true);

      if (mappingError) {
        console.error('❌ [WEBHOOK_VALIDATION] Erro ao buscar mappings:', mappingError);
        return { success: false, results: [], error: 'Erro ao buscar configurações de canais' };
      }

      if (!mappings || mappings.length === 0) {
        console.warn('⚠️ [WEBHOOK_VALIDATION] Nenhum canal ativo encontrado');
        return { success: true, results: [], error: 'Nenhum canal ativo encontrado' };
      }

      const results = [];

      // Processar cada canal
      for (const mapping of mappings) {
        try {
          console.log(`🔄 [WEBHOOK_VALIDATION] Processando canal: ${mapping.channel_name}`);

          const evolutionService = new EvolutionApiService({
            baseUrl: mapping.base_url,
            apiKey: mapping.api_key,
            instanceName: mapping.instance_name
          });

          // Verificar webhook atual
          const currentWebhook = await evolutionService.getWebhook();
          
          let needsUpdate = false;
          if (!currentWebhook.success || !currentWebhook.webhook) {
            needsUpdate = true;
            console.log(`⚠️ [WEBHOOK_VALIDATION] Canal ${mapping.channel_name}: Webhook não configurado`);
          } else {
            const webhookUrl = currentWebhook.webhook.webhook?.url || currentWebhook.webhook.webhookUrl;
            if (webhookUrl !== this.UNIVERSAL_WEBHOOK) {
              needsUpdate = true;
              console.log(`⚠️ [WEBHOOK_VALIDATION] Canal ${mapping.channel_name}: Webhook incorreto - ${webhookUrl}`);
            }
          }

          // Configurar webhook universal se necessário
          if (needsUpdate) {
            console.log(`🔧 [WEBHOOK_VALIDATION] Configurando webhook universal para ${mapping.channel_name}`);
            const configResult = await evolutionService.setWebhook();
            
            results.push({
              channel: mapping.channel_name,
              instance: mapping.instance_name,
              action: 'updated',
              success: configResult.success,
              error: configResult.error
            });
          } else {
            console.log(`✅ [WEBHOOK_VALIDATION] Canal ${mapping.channel_name}: Webhook já configurado corretamente`);
            results.push({
              channel: mapping.channel_name,
              instance: mapping.instance_name,
              action: 'already_configured',
              success: true
            });
          }

        } catch (error) {
          console.error(`❌ [WEBHOOK_VALIDATION] Erro ao processar canal ${mapping.channel_name}:`, error);
          results.push({
            channel: mapping.channel_name,
            instance: mapping.instance_name,
            action: 'failed',
            success: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido'
          });
        }
      }

      console.log('✅ [WEBHOOK_VALIDATION] Validação concluída:', results);
      return { success: true, results };

    } catch (error) {
      console.error('❌ [WEBHOOK_VALIDATION] Erro geral na validação:', error);
      return { 
        success: false, 
        results: [], 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  /**
   * Obtém status atual dos webhooks de todos os canais
   */
  static async getWebhookStatus(): Promise<{ success: boolean; channels: any[]; error?: string }> {
    try {
      const { data: mappings, error: mappingError } = await supabase
        .from('channel_instance_mappings')
        .select('*')
        .eq('is_active', true);

      if (mappingError || !mappings) {
        return { success: false, channels: [], error: 'Erro ao buscar canais' };
      }

      const channels = [];

      for (const mapping of mappings) {
        try {
          const evolutionService = new EvolutionApiService({
            baseUrl: mapping.base_url,
            apiKey: mapping.api_key,
            instanceName: mapping.instance_name
          });

          const webhookResult = await evolutionService.getWebhook();
          
          channels.push({
            channel: mapping.channel_name,
            instance: mapping.instance_name,
            webhookConfigured: webhookResult.success,
            webhookUrl: webhookResult.webhook?.webhook?.url || webhookResult.webhook?.webhookUrl || null,
            isUniversalWebhook: (webhookResult.webhook?.webhook?.url || webhookResult.webhook?.webhookUrl) === this.UNIVERSAL_WEBHOOK
          });

        } catch (error) {
          channels.push({
            channel: mapping.channel_name,
            instance: mapping.instance_name,
            webhookConfigured: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido'
          });
        }
      }

      return { success: true, channels };

    } catch (error) {
      return { 
        success: false, 
        channels: [], 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }
}
