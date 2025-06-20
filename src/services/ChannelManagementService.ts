
import { supabase } from '@/integrations/supabase/client';

export interface CreateChannelData {
  name: string;
  type: 'general' | 'store' | 'manager' | 'admin';
}

export interface UpdateChannelData {
  name?: string;
  type?: 'general' | 'store' | 'manager' | 'admin';
  isActive?: boolean;
  isDefault?: boolean;
}

interface ChannelDeleteResult {
  success: boolean;
  message: string;
  details?: any;
}

export class ChannelManagementService {
  private static instance: ChannelManagementService;

  static getInstance(): ChannelManagementService {
    if (!ChannelManagementService.instance) {
      ChannelManagementService.instance = new ChannelManagementService();
    }
    return ChannelManagementService.instance;
  }

  async createChannel(data: CreateChannelData) {
    console.log('🔄 [CHANNEL_MANAGEMENT] Creating channel:', data);
    
    try {
      // Verificar se já existe um canal com o mesmo nome
      const { data: existingChannel } = await supabase
        .from('channels')
        .select('id')
        .eq('name', data.name)
        .single();

      if (existingChannel) {
        return {
          success: false,
          error: 'Já existe um canal com este nome'
        };
      }

      // Criar o canal
      const { data: newChannel, error } = await supabase
        .from('channels')
        .insert({
          name: data.name,
          type: data.type,
          is_active: true,
          is_default: false
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [CHANNEL_MANAGEMENT] Error creating channel:', error);
        return {
          success: false,
          error: error.message
        };
      }

      console.log('✅ [CHANNEL_MANAGEMENT] Channel created successfully:', newChannel);
      return {
        success: true,
        data: newChannel
      };

    } catch (error) {
      console.error('❌ [CHANNEL_MANAGEMENT] Unexpected error:', error);
      return {
        success: false,
        error: 'Erro inesperado ao criar canal'
      };
    }
  }

  async updateChannel(channelId: string, data: UpdateChannelData) {
    console.log('🔄 [CHANNEL_MANAGEMENT] Updating channel:', channelId, data);
    
    try {
      const { data: updatedChannel, error } = await supabase
        .from('channels')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', channelId)
        .select()
        .single();

      if (error) {
        console.error('❌ [CHANNEL_MANAGEMENT] Error updating channel:', error);
        return {
          success: false,
          error: error.message
        };
      }

      console.log('✅ [CHANNEL_MANAGEMENT] Channel updated successfully');
      return {
        success: true,
        data: updatedChannel
      };

    } catch (error) {
      console.error('❌ [CHANNEL_MANAGEMENT] Unexpected error:', error);
      return {
        success: false,
        error: 'Erro inesperado ao atualizar canal'
      };
    }
  }

  async validateChannelName(name: string, excludeId?: string): Promise<boolean> {
    try {
      let query = supabase
        .from('channels')
        .select('id')
        .eq('name', name);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data } = await query.single();
      return !data; // Retorna true se não existe (nome é válido)
    } catch {
      return true; // Se der erro, assume que o nome é válido
    }
  }

  async deleteChannel(channelId: string): Promise<ChannelDeleteResult> {
    console.log('🗑️ [CHANNEL_MANAGEMENT] Iniciando exclusão do canal:', channelId);
    
    try {
      // 1. Verificar se o canal existe
      const { data: channel, error: channelError } = await supabase
        .from('channels')
        .select('*')
        .eq('id', channelId)
        .single();

      if (channelError || !channel) {
        console.error('❌ [CHANNEL_MANAGEMENT] Canal não encontrado:', channelError);
        return {
          success: false,
          message: 'Canal não encontrado'
        };
      }

      console.log('✅ [CHANNEL_MANAGEMENT] Canal encontrado:', channel.name);

      // 2. Remover mappings de instâncias (usando tabela correta)
      const { error: mappingError } = await supabase
        .from('channel_instance_mappings')
        .delete()
        .eq('channel_id', channelId);

      if (mappingError) {
        console.warn('⚠️ [CHANNEL_MANAGEMENT] Erro ao remover mappings:', mappingError);
        // Não interromper o processo por causa disso
      } else {
        console.log('✅ [CHANNEL_MANAGEMENT] Mappings removidos');
      }

      // 3. Desativar o canal (soft delete)
      const { error: updateError } = await supabase
        .from('channels')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', channelId);

      if (updateError) {
        console.error('❌ [CHANNEL_MANAGEMENT] Erro ao desativar canal:', updateError);
        return {
          success: false,
          message: 'Erro ao desativar canal: ' + updateError.message
        };
      }

      console.log('✅ [CHANNEL_MANAGEMENT] Canal desativado com sucesso');

      // 4. Log da operação para auditoria
      await this.logChannelOperation('DELETE', channelId, {
        channel_name: channel.name,
        deactivated_at: new Date().toISOString()
      });

      return {
        success: true,
        message: `Canal "${channel.name}" foi desativado com sucesso`,
        details: { channelName: channel.name }
      };

    } catch (error) {
      console.error('❌ [CHANNEL_MANAGEMENT] Erro inesperado:', error);
      return {
        success: false,
        message: 'Erro inesperado ao excluir canal: ' + (error instanceof Error ? error.message : 'Erro desconhecido')
      };
    }
  }

  async reactivateChannel(channelId: string): Promise<ChannelDeleteResult> {
    console.log('🔄 [CHANNEL_MANAGEMENT] Reativando canal:', channelId);
    
    try {
      const { data: channel, error: updateError } = await supabase
        .from('channels')
        .update({ 
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', channelId)
        .select()
        .single();

      if (updateError) {
        console.error('❌ [CHANNEL_MANAGEMENT] Erro ao reativar canal:', updateError);
        return {
          success: false,
          message: 'Erro ao reativar canal: ' + updateError.message
        };
      }

      await this.logChannelOperation('REACTIVATE', channelId, {
        channel_name: channel.name,
        reactivated_at: new Date().toISOString()
      });

      return {
        success: true,
        message: `Canal "${channel.name}" foi reativado com sucesso`
      };

    } catch (error) {
      console.error('❌ [CHANNEL_MANAGEMENT] Erro inesperado na reativação:', error);
      return {
        success: false,
        message: 'Erro inesperado ao reativar canal'
      };
    }
  }

  private async logChannelOperation(operation: string, channelId: string, details: any) {
    try {
      await supabase.from('audit_logs').insert({
        user_name: 'Sistema',
        action: operation + '_CHANNEL',
        resource_type: 'channel',
        resource_id: channelId,
        details: details
      });
    } catch (error) {
      console.warn('⚠️ [CHANNEL_MANAGEMENT] Erro ao registrar log:', error);
    }
  }

  async getChannelStats(channelId: string) {
    try {
      const { data: channel } = await supabase
        .from('channels')
        .select('*')
        .eq('id', channelId)
        .single();

      const { data: mappings } = await supabase
        .from('channel_instance_mappings')
        .select('*')
        .eq('channel_id', channelId);

      return {
        channel,
        mappings: mappings || [],
        mappingCount: mappings?.length || 0
      };
    } catch (error) {
      console.error('❌ [CHANNEL_MANAGEMENT] Erro ao obter estatísticas:', error);
      return null;
    }
  }
}
