import { supabase } from '@/integrations/supabase/client';
import { EvolutionApiService, EvolutionApiConfig } from './EvolutionApiService';

interface ChannelInstanceMapping {
  channel_id: string;
  instance_id: string;
  instance_name: string;
  api_key: string;
  base_url: string;
  is_active: boolean;
}

interface SendMessageRequest {
  channelId: string;
  phoneNumber: string;
  message: string;
  messageType?: 'text' | 'media';
  mediaUrl?: string;
  mediaType?: 'image' | 'audio' | 'video' | 'document';
  caption?: string;
}

interface SendMessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class EvolutionMessageService {
  /**
   * Obter configurações da API Evolution do localStorage
   */
  private getEvolutionApiConfig(): { baseUrl: string; apiKey: string } | null {
    try {
      const saved = localStorage.getItem('evolution_api_connection');
      if (saved) {
        const connection = JSON.parse(saved);
        if (connection.isValidated && connection.baseUrl && connection.apiKey) {
          return {
            baseUrl: connection.baseUrl,
            apiKey: connection.apiKey
          };
        }
      }
      return null;
    } catch (error) {
      console.error('❌ [EVOLUTION_MESSAGE] Erro ao obter configurações:', error);
      return null;
    }
  }

  /**
   * Obter configurações de IA do localStorage ou Supabase
   */
  private async getOpenAIConfigFromSupabase(): Promise<{ apiKey: string } | null> {
    try {
      // Primeiro tentar localStorage
      let apiKey = localStorage.getItem('openai_api_key');
      
      if (apiKey) {
        return { apiKey };
      }

      // Se não encontrar, buscar do Supabase
      const { data, error } = await supabase
        .from('ai_providers')
        .select('api_key')
        .eq('provider_type', 'openai')
        .eq('is_active', true)
        .single();

      if (error || !data) {
        console.warn('⚠️ [EVOLUTION_MESSAGE] API key da OpenAI não encontrada');
        return null;
      }

      return { apiKey: data.api_key };
    } catch (error) {
      console.error('❌ [EVOLUTION_MESSAGE] Erro ao obter configurações de IA:', error);
      return null;
    }
  }

  /**
   * Atualizar configurações da OpenAI no openaiService
   */
  private async updateOpenAIService(): Promise<void> {
    try {
      const config = await this.getOpenAIConfigFromSupabase();
      if (config) {
        // Atualizar localStorage para que o openaiService possa usar
        localStorage.setItem('openai_api_key', config.apiKey);
        console.log('✅ [EVOLUTION_MESSAGE] Configurações da OpenAI atualizadas');
      }
    } catch (error) {
      console.error('❌ [EVOLUTION_MESSAGE] Erro ao atualizar configurações da OpenAI:', error);
    }
  }

  /**
   * Obter mapeamento de instância para um canal específico
   */
  private async getChannelInstanceMapping(channelId: string): Promise<ChannelInstanceMapping | null> {
    try {
      console.log(`🔍 [EVOLUTION_MESSAGE] Buscando mapeamento para canal: ${channelId}`);
      console.log(`🔍 [EVOLUTION_MESSAGE] Channel ID recebido: ${channelId}`);
      console.log(`🔍 [EVOLUTION_MESSAGE] Tipo de channelId: ${typeof channelId}`);

      const { data, error } = await supabase
        .from("channel_instance_mappings")
        .select("*")
        .eq("channel_id", channelId)
        .eq("is_active", true);

      console.log("🔍 [EVOLUTION_MESSAGE] Resultado da consulta Supabase - Data:", data);
      console.log("🔍 [EVOLUTION_MESSAGE] Resultado da consulta Supabase - Error:", error);

      if (error) {
        console.error("❌ [EVOLUTION_MESSAGE] Erro ao buscar mapeamento:", error);
        console.error("❌ [EVOLUTION_MESSAGE] Dados retornados:", data);
        return null;
      }

      if (!data || data.length === 0) {
        console.warn("⚠️ [EVOLUTION_MESSAGE] Nenhum mapeamento encontrado para o canal:", channelId);
        console.warn("⚠️ [EVOLUTION_MESSAGE] Dados retornados:", data);
        return null;
      }

      // Se houver múltiplos resultados, pegar o primeiro (ou o mais relevante, se houver critério)
      const mapping = Array.isArray(data) ? data[0] : data;
      console.log("✅ [EVOLUTION_MESSAGE] Mapeamento encontrado:", mapping);
      return mapping;
    } catch (error) {
      console.error("❌ [EVOLUTION_MESSAGE] Erro ao buscar mapeamento:", error);
      return null;
    }
  }

  /**
   * Criar instância do serviço Evolution API baseado no mapeamento do canal
   */
  private createEvolutionService(mapping: ChannelInstanceMapping): EvolutionApiService {
    const config: EvolutionApiConfig = {
      baseUrl: mapping.base_url,
      apiKey: mapping.api_key,
      instanceName: mapping.instance_name
    };

    return new EvolutionApiService(config);
  }

  /**
   * Salvar mensagem enviada na tabela específica do canal
   */
  private async saveMessageToChannel(
    channelId: string, 
    phoneNumber: string, 
    message: string, 
    messageType: string = 'text',
    mediaBase64?: string
  ): Promise<void> {
    try {
      // Mapear canais para tabelas do banco de dados usando UUIDs
      const getTableNameForChannel = (channelId: string): string => {
        const channelTableMapping: Record<string, string> = {
          // UUIDs do Supabase
          'af1e5797-edc6-4ba3-a57a-25cf7297c4d6': 'yelena_ai_conversas',
          '011b69ba-cf25-4f63-af2e-4ad0260d9516': 'canarana_conversas',
          'b7996f75-41a7-4725-8229-564f31868027': 'souto_soares_conversas',
          '621abb21-60b2-4ff2-a0a6-172a94b4b65c': 'joao_dourado_conversas',
          '64d8acad-c645-4544-a1e6-2f0825fae00b': 'america_dourada_conversas',
          'd8087e7b-5b06-4e26-aa05-6fc51fd4cdce': 'gerente_lojas_conversas',
          'd2892900-ca8f-4b08-a73f-6b7aa5866ff7': 'gerente_externo_conversas',
          // Nomes legados para compatibilidade
          'chat': 'yelena_ai_conversas',
          'canarana': 'canarana_conversas',
          'souto-soares': 'souto_soares_conversas',
          'joao-dourado': 'joao_dourado_conversas',
          'america-dourada': 'america_dourada_conversas',
          'gerente-lojas': 'gerente_lojas_conversas',
          'gerente-externo': 'gerente_externo_conversas'
        };
        
        return channelTableMapping[channelId] || 'yelena_ai_conversas';
      };

      const tableName = getTableNameForChannel(channelId);
      
      console.log(`💾 [EVOLUTION_MESSAGE] Salvando mensagem na tabela: ${tableName}`);

      const messageData = {
        session_id: phoneNumber,
        message: message,
        nome_do_contato: 'Atendente', // Mensagem enviada pelo atendente
        tipo_remetente: 'agent',
        mensagemtype: messageType,
        media_base64: mediaBase64 || null,
        is_read: true,
        read_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from(tableName)
        .insert(messageData);

      if (error) {
        console.error('❌ [EVOLUTION_MESSAGE] Erro ao salvar mensagem:', error);
      } else {
        console.log('✅ [EVOLUTION_MESSAGE] Mensagem salva com sucesso');
      }

    } catch (error) {
      console.error('❌ [EVOLUTION_MESSAGE] Erro ao salvar mensagem:', error);
    }
  }

  /**
   * Enviar mensagem de texto
   */
  async sendTextMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    try {
      console.log('📤 [EVOLUTION_MESSAGE] Enviando mensagem de texto:', {
        channelId: request.channelId,
        phoneNumber: request.phoneNumber,
        messageLength: request.message.length
      });

      // Primeiro, tentar obter configurações do localStorage
      const apiConfig = this.getEvolutionApiConfig();
      
      if (!apiConfig) {
        return {
          success: false,
          error: 'Configurações da API Evolution não encontradas. Configure na seção API Evolution.'
        };
      }

      // Buscar mapeamento da instância para o canal
      const mapping = await this.getChannelInstanceMapping(request.channelId);
      
      if (!mapping) {
        return {
          success: false,
          error: 'Nenhuma instância configurada para este canal. Configure o mapeamento na seção API Evolution.'
        };
      }

      // Usar configurações do localStorage se disponíveis, senão usar do mapeamento
      const config: EvolutionApiConfig = {
        baseUrl: apiConfig.baseUrl || mapping.base_url,
        apiKey: apiConfig.apiKey || mapping.api_key,
        instanceName: mapping.instance_name
      };

      // Criar serviço Evolution API
      const evolutionService = new EvolutionApiService(config);

      // Enviar mensagem
      const result = await evolutionService.sendTextMessage(
        request.phoneNumber,
        request.message
      );

      // Se a mensagem foi enviada com sucesso, salvar no banco
      if (result.success) {
        await this.saveMessageToChannel(
          request.channelId,
          request.phoneNumber,
          request.message,
          'text'
        );
      }

      return result;

    } catch (error) {
      console.error('❌ [EVOLUTION_MESSAGE] Erro ao enviar mensagem de texto:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Enviar mensagem de mídia
   */
  async sendMediaMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    try {
      console.log('📤 [EVOLUTION_MESSAGE] Enviando mensagem de mídia:', {
        channelId: request.channelId,
        phoneNumber: request.phoneNumber,
        mediaType: request.mediaType,
        hasCaption: !!request.caption
      });

      if (!request.mediaUrl) {
        return {
          success: false,
          error: 'URL da mídia é obrigatória'
        };
      }

      // Buscar mapeamento da instância para o canal
      const mapping = await this.getChannelInstanceMapping(request.channelId);
      
      if (!mapping) {
        return {
          success: false,
          error: 'Nenhuma instância configurada para este canal'
        };
      }

      // Criar serviço Evolution API
      const evolutionService = this.createEvolutionService(mapping);

      // Enviar mensagem de mídia
      const result = await evolutionService.sendMediaMessage(
        request.phoneNumber,
        request.mediaUrl,
        request.caption || '',
        request.mediaType || 'image'
      );

      // Se a mensagem foi enviada com sucesso, salvar no banco
      if (result.success) {
        await this.saveMessageToChannel(
          request.channelId,
          request.phoneNumber,
          request.caption || '[Mídia]',
          request.mediaType || 'image',
          request.mediaUrl // Salvar URL da mídia como base64 temporariamente
        );
      }

      return result;

    } catch (error) {
      console.error('❌ [EVOLUTION_MESSAGE] Erro ao enviar mensagem de mídia:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Verificar status da conexão da instância do canal
   */
  async checkChannelConnectionStatus(channelId: string): Promise<{
    success: boolean;
    connected: boolean;
    instanceName?: string;
    error?: string;
  }> {
    try {
      console.log(`🔍 [EVOLUTION_MESSAGE] Verificando status de conexão para canal: ${channelId}`);

      // Buscar mapeamento da instância para o canal
      const mapping = await this.getChannelInstanceMapping(channelId);
      
      if (!mapping) {
        return {
          success: false,
          connected: false,
          error: 'Nenhuma instância configurada para este canal'
        };
      }

      // Criar serviço Evolution API
      const evolutionService = this.createEvolutionService(mapping);

      // Verificar status de conexão
      const status = await evolutionService.getConnectionStatus();

      return {
        success: status.success,
        connected: status.connected,
        instanceName: mapping.instance_name,
        error: status.error
      };

    } catch (error) {
      console.error('❌ [EVOLUTION_MESSAGE] Erro ao verificar status:', error);
      return {
        success: false,
        connected: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Obter QR Code para conectar instância do canal
   */
  async getChannelQRCode(channelId: string): Promise<{
    success: boolean;
    qrCode?: string;
    instanceName?: string;
    error?: string;
  }> {
    try {
      console.log(`🔲 [EVOLUTION_MESSAGE] Obtendo QR Code para canal: ${channelId}`);

      // Buscar mapeamento da instância para o canal
      const mapping = await this.getChannelInstanceMapping(channelId);
      
      if (!mapping) {
        return {
          success: false,
          error: 'Nenhuma instância configurada para este canal'
        };
      }

      // Criar serviço Evolution API
      const evolutionService = this.createEvolutionService(mapping);

      // Obter QR Code
      const qrResult = await evolutionService.getQRCodeForInstance();

      return {
        success: qrResult.success,
        qrCode: qrResult.qrCode,
        instanceName: mapping.instance_name,
        error: qrResult.error
      };

    } catch (error) {
      console.error('❌ [EVOLUTION_MESSAGE] Erro ao obter QR Code:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Listar todos os mapeamentos de canal-instância
   */
  async listChannelMappings(): Promise<ChannelInstanceMapping[]> {
    try {
      console.log('📋 [EVOLUTION_MESSAGE] Listando mapeamentos de canal-instância');

      const { data, error } = await supabase
        .from('channel_instance_mappings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [EVOLUTION_MESSAGE] Erro ao listar mapeamentos:', error);
        return [];
      }

      return data || [];

    } catch (error) {
      console.error('❌ [EVOLUTION_MESSAGE] Erro ao listar mapeamentos:', error);
      return [];
    }
  }

  /**
   * Criar ou atualizar mapeamento de canal-instância
   */
  async createOrUpdateChannelMapping(mapping: Omit<ChannelInstanceMapping, 'created_at' | 'updated_at'>): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      console.log('💾 [EVOLUTION_MESSAGE] Criando/atualizando mapeamento:', mapping);

      const { error } = await supabase
        .from('channel_instance_mappings')
        .upsert({
          ...mapping,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'channel_id'
        });

      if (error) {
        console.error('❌ [EVOLUTION_MESSAGE] Erro ao salvar mapeamento:', error);
        return {
          success: false,
          error: error.message
        };
      }

      console.log('✅ [EVOLUTION_MESSAGE] Mapeamento salvo com sucesso');
      return {
        success: true
      };

    } catch (error) {
      console.error('❌ [EVOLUTION_MESSAGE] Erro ao salvar mapeamento:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }
}

// Instância singleton do serviço
export const evolutionMessageService = new EvolutionMessageService();

