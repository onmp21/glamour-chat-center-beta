import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface CreateChannelData {
  name: string;
  type: 'general' | 'store' | 'manager' | 'admin';
  isDefault?: boolean;
}

export interface UpdateChannelData {
  name?: string;
  type?: 'general' | 'store' | 'manager' | 'admin';
  isActive?: boolean;
  isDefault?: boolean;
}

export class ChannelManagementService {
  private static instance: ChannelManagementService;

  static getInstance(): ChannelManagementService {
    if (!ChannelManagementService.instance) {
      ChannelManagementService.instance = new ChannelManagementService();
    }
    return ChannelManagementService.instance;
  }

  private generateTableName(channelName: string): string {
    return channelName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '') + '_conversas';
  }

  async createChannel(data: CreateChannelData): Promise<{ success: boolean; channelId?: string; error?: string }> {
    try {
      console.log('🔄 [CHANNEL_MANAGEMENT] Creating channel:', data);

      // Validar dados
      if (!data.name?.trim()) {
        return { success: false, error: 'Nome do canal é obrigatório' };
      }

      // Verificar se já existe um canal com mesmo nome
      const { data: existingChannel } = await supabase
        .from('channels')
        .select('id')
        .eq('name', data.name.trim())
        .maybeSingle();

      if (existingChannel) {
        return { success: false, error: 'Já existe um canal com este nome' };
      }

      // Gerar nome da tabela
      const tableName = this.generateTableName(data.name);

      // Criar canal na tabela channels
      const { data: newChannel, error: channelError } = await supabase
        .from('channels')
        .insert([{
          name: data.name.trim(),
          type: data.type,
          is_active: true,
          is_default: data.isDefault || false
        }])
        .select()
        .single();

      if (channelError) {
        console.error('❌ [CHANNEL_MANAGEMENT] Error creating channel:', channelError);
        return { success: false, error: 'Erro ao criar canal no banco de dados' };
      }

      // Criar tabela de conversas usando o parâmetro correto
      const { error: tableError } = await supabase.rpc('create_conversation_table', {
        table_name: tableName
      });

      if (tableError) {
        console.error('❌ [CHANNEL_MANAGEMENT] Error creating conversation table:', tableError);
        
        // Reverter criação do canal
        await supabase.from('channels').delete().eq('id', newChannel.id);
        
        return { success: false, error: 'Erro ao criar tabela de conversas' };
      }

      console.log('✅ [CHANNEL_MANAGEMENT] Channel created successfully:', newChannel.id);
      
      toast({
        title: 'Sucesso',
        description: `Canal "${data.name}" criado com sucesso!`
      });

      return { success: true, channelId: newChannel.id };
    } catch (error) {
      console.error('❌ [CHANNEL_MANAGEMENT] Unexpected error:', error);
      return { success: false, error: 'Erro inesperado ao criar canal' };
    }
  }

  async updateChannel(channelId: string, data: UpdateChannelData): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 [CHANNEL_MANAGEMENT] Updating channel:', { channelId, data });

      // Buscar canal atual
      const { data: currentChannel, error: fetchError } = await supabase
        .from('channels')
        .select('*')
        .eq('id', channelId)
        .single();

      if (fetchError || !currentChannel) {
        return { success: false, error: 'Canal não encontrado' };
      }

      // Se mudou o nome, verificar se novo nome já existe
      if (data.name && data.name !== currentChannel.name) {
        const { data: existingChannel } = await supabase
          .from('channels')
          .select('id')
          .eq('name', data.name.trim())
          .neq('id', channelId)
          .single();

        if (existingChannel) {
          return { success: false, error: 'Já existe um canal com este nome' };
        }

        // Se mudou o nome, renomear tabela
        const oldTableName = this.generateTableName(currentChannel.name);
        const newTableName = this.generateTableName(data.name);

        if (oldTableName !== newTableName) {
          const { error: renameError } = await supabase.rpc('rename_conversation_table', {
            old_name: oldTableName,
            new_name: newTableName
          });

          if (renameError) {
            console.error('❌ [CHANNEL_MANAGEMENT] Error renaming table:', renameError);
            return { success: false, error: 'Erro ao renomear tabela de conversas' };
          }
        }
      }

      // Atualizar canal
      const { error: updateError } = await supabase
        .from('channels')
        .update({
          ...(data.name && { name: data.name.trim() }),
          ...(data.type && { type: data.type }),
          ...(data.isActive !== undefined && { is_active: data.isActive }),
          ...(data.isDefault !== undefined && { is_default: data.isDefault })
        })
        .eq('id', channelId);

      if (updateError) {
        console.error('❌ [CHANNEL_MANAGEMENT] Error updating channel:', updateError);
        return { success: false, error: 'Erro ao atualizar canal' };
      }

      console.log('✅ [CHANNEL_MANAGEMENT] Channel updated successfully');
      
      toast({
        title: 'Sucesso',
        description: 'Canal atualizado com sucesso!'
      });

      return { success: true };
    } catch (error) {
      console.error('❌ [CHANNEL_MANAGEMENT] Unexpected error:', error);
      return { success: false, error: 'Erro inesperado ao atualizar canal' };
    }
  }

  async deleteChannel(channelId: string, createBackup: boolean = true): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 [CHANNEL_MANAGEMENT] Deleting channel:', { channelId, createBackup });

      // Buscar canal
      const { data: channel, error: fetchError } = await supabase
        .from('channels')
        .select('*')
        .eq('id', channelId)
        .single();

      if (fetchError || !channel) {
        return { success: false, error: 'Canal não encontrado' };
      }

      // Verificar se é canal padrão
      if (channel.is_default) {
        return { success: false, error: 'Não é possível excluir o canal padrão' };
      }

      const tableName = this.generateTableName(channel.name);

      // Criar backup se solicitado
      if (createBackup) {
        const { error: backupError } = await supabase.rpc('backup_conversation_table', {
          table_name: tableName
        });

        if (backupError) {
          console.error('❌ [CHANNEL_MANAGEMENT] Error creating backup:', backupError);
          return { success: false, error: 'Erro ao criar backup' };
        }
      }

      // Excluir tabela de conversas
      const { error: dropError } = await supabase.rpc('drop_conversation_table', {
        table_name: tableName
      });

      if (dropError) {
        console.error('❌ [CHANNEL_MANAGEMENT] Error dropping table:', dropError);
        return { success: false, error: 'Erro ao excluir tabela de conversas' };
      }

      // Excluir canal
      const { error: deleteError } = await supabase
        .from('channels')
        .delete()
        .eq('id', channelId);

      if (deleteError) {
        console.error('❌ [CHANNEL_MANAGEMENT] Error deleting channel:', deleteError);
        return { success: false, error: 'Erro ao excluir canal' };
      }

      console.log('✅ [CHANNEL_MANAGEMENT] Channel deleted successfully');
      
      toast({
        title: 'Sucesso',
        description: `Canal "${channel.name}" excluído com sucesso!`
      });

      return { success: true };
    } catch (error) {
      console.error('❌ [CHANNEL_MANAGEMENT] Unexpected error:', error);
      return { success: false, error: 'Erro inesperado ao excluir canal' };
    }
  }

  async validateChannelName(name: string, excludeId?: string): Promise<boolean> {
    try {
      let query = supabase.from('channels').select('id').eq('name', name.trim());
      
      if (excludeId) {
        query = query.neq('id', excludeId);
      }
      
      const { data } = await query.single();
      return !data; // Retorna true se não existe
    } catch {
      return true; // Se erro, assumir que não existe
    }
  }
}
