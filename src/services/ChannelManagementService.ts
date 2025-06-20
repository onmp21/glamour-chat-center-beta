import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { invalidateChannelCache } from '@/utils/channelMapping';

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
  private creatingChannels = new Set<string>(); // Prevenir criações duplicadas

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

      const channelName = data.name.trim();
      
      // Verificar se já está sendo criado um canal com este nome
      if (this.creatingChannels.has(channelName)) {
        console.warn('⚠️ [CHANNEL_MANAGEMENT] Channel creation already in progress:', channelName);
        return { success: false, error: 'Criação de canal já em andamento' };
      }

      // Marcar como em criação
      this.creatingChannels.add(channelName);

      try {
        // Verificar se já existe um canal com mesmo nome
        const { data: existingChannel } = await supabase
          .from('channels')
          .select('id')
          .eq('name', channelName)
          .maybeSingle();

        if (existingChannel) {
          return { success: false, error: 'Já existe um canal com este nome' };
        }

        // Gerar nome da tabela
        const tableName = this.generateTableName(channelName);
        console.log('📋 [CHANNEL_MANAGEMENT] Generated table name:', tableName);

        // Verificar se tabela já existe
        const { data: tableExists } = await supabase.rpc('create_conversation_table', {
          table_name: tableName
        }).select().single().then(
          () => ({ data: false }), // Se a função executou sem erro, tabela não existia
          (error) => {
            if (error.message?.includes('já existe')) {
              return { data: true }; // Tabela já existe
            }
            throw error; // Outro erro
          }
        );

        if (tableExists) {
          console.warn('⚠️ [CHANNEL_MANAGEMENT] Table already exists:', tableName);
          return { success: false, error: 'Tabela de conversas já existe para este canal' };
        }

        // Criar canal na tabela channels PRIMEIRO
        const { data: newChannel, error: channelError } = await supabase
          .from('channels')
          .insert([{
            name: channelName,
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

        console.log('✅ [CHANNEL_MANAGEMENT] Channel record created:', newChannel.id);

        // Só agora criar a tabela de conversas
        const { error: tableError } = await supabase.rpc('create_conversation_table', {
          table_name: tableName
        });

        if (tableError) {
          console.error('❌ [CHANNEL_MANAGEMENT] Error creating conversation table:', tableError);
          
          // Reverter criação do canal
          await supabase.from('channels').delete().eq('id', newChannel.id);
          console.log('🔄 [CHANNEL_MANAGEMENT] Channel record deleted due to table creation failure');
          
          return { success: false, error: 'Erro ao criar tabela de conversas' };
        }

        console.log('✅ [CHANNEL_MANAGEMENT] Conversation table created successfully:', tableName);

        // Invalidar cache para que novos canais sejam reconhecidos
        invalidateChannelCache();

        console.log('✅ [CHANNEL_MANAGEMENT] Channel created successfully:', newChannel.id);
        console.log('🔄 [CHANNEL_MANAGEMENT] Channel cache invalidated');
        
        toast({
          title: 'Sucesso',
          description: `Canal "${channelName}" criado com sucesso!`
        });

        return { success: true, channelId: newChannel.id };

      } finally {
        // Sempre remover da lista de criação
        this.creatingChannels.delete(channelName);
      }

    } catch (error) {
      console.error('❌ [CHANNEL_MANAGEMENT] Unexpected error:', error);
      this.creatingChannels.delete(data.name?.trim() || '');
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
          .maybeSingle();

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

      // Invalidar cache após atualização
      invalidateChannelCache();

      console.log('✅ [CHANNEL_MANAGEMENT] Channel updated successfully');
      console.log('🔄 [CHANNEL_MANAGEMENT] Channel cache invalidated');
      
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
        console.error('❌ [CHANNEL_MANAGEMENT] Channel not found:', fetchError);
        return { success: false, error: 'Canal não encontrado' };
      }

      // Verificar se é canal padrão
      if (channel.is_default) {
        console.warn('⚠️ [CHANNEL_MANAGEMENT] Attempting to delete default channel');
        return { success: false, error: 'Não é possível excluir o canal padrão' };
      }

      const tableName = this.generateTableName(channel.name);
      console.log('📋 [CHANNEL_MANAGEMENT] Generated table name for deletion:', tableName);

      // Iniciar transação manual
      try {
        // 1. Excluir mapeamentos de API relacionados ao canal
        console.log('🔄 [CHANNEL_MANAGEMENT] Deleting API mappings...');
        const { error: mappingError } = await supabase
          .from('channel_api_mappings')
          .delete()
          .eq('channel_id', channelId);

        if (mappingError) {
          console.error('❌ [CHANNEL_MANAGEMENT] Error deleting API mappings:', mappingError);
          // Não falhar por causa disso, apenas logar
        }

        // 2. Excluir mapeamentos de instância relacionados ao canal
        console.log('🔄 [CHANNEL_MANAGEMENT] Deleting instance mappings...');
        const { error: instanceMappingError } = await supabase
          .from('channel_instance_mappings')
          .delete()
          .eq('channel_id', channelId);

        if (instanceMappingError) {
          console.error('❌ [CHANNEL_MANAGEMENT] Error deleting instance mappings:', instanceMappingError);
          // Não falhar por causa disso, apenas logar
        }

        // 3. Criar backup se solicitado
        if (createBackup) {
          console.log('🔄 [CHANNEL_MANAGEMENT] Creating backup...');
          const { error: backupError } = await supabase.rpc('backup_conversation_table', {
            table_name: tableName
          });

          if (backupError) {
            console.error('❌ [CHANNEL_MANAGEMENT] Error creating backup:', backupError);
            // Continuar mesmo se backup falhar, mas avisar
            console.warn('⚠️ [CHANNEL_MANAGEMENT] Continuing deletion without backup');
          } else {
            console.log('✅ [CHANNEL_MANAGEMENT] Backup created successfully');
          }
        }

        // 4. Excluir tabela de conversas
        console.log('🔄 [CHANNEL_MANAGEMENT] Dropping conversation table...');
        const { error: dropError } = await supabase.rpc('drop_conversation_table', {
          table_name: tableName
        });

        if (dropError) {
          console.error('❌ [CHANNEL_MANAGEMENT] Error dropping table:', dropError);
          // Tentar continuar mesmo se a tabela não existir
          if (!dropError.message?.includes('não existe') && !dropError.message?.includes('does not exist')) {
            return { success: false, error: 'Erro ao excluir tabela de conversas' };
          }
          console.warn('⚠️ [CHANNEL_MANAGEMENT] Table may not exist, continuing...');
        } else {
          console.log('✅ [CHANNEL_MANAGEMENT] Conversation table dropped successfully');
        }

        // 5. Excluir canal
        console.log('🔄 [CHANNEL_MANAGEMENT] Deleting channel record...');
        const { error: deleteError } = await supabase
          .from('channels')
          .delete()
          .eq('id', channelId);

        if (deleteError) {
          console.error('❌ [CHANNEL_MANAGEMENT] Error deleting channel:', deleteError);
          return { success: false, error: 'Erro ao excluir canal do banco de dados' };
        }

        console.log('✅ [CHANNEL_MANAGEMENT] Channel record deleted successfully');

        // 6. Invalidar cache após exclusão
        invalidateChannelCache();
        console.log('🔄 [CHANNEL_MANAGEMENT] Channel cache invalidated');
        
        toast({
          title: 'Sucesso',
          description: `Canal "${channel.name}" excluído com sucesso!`
        });

        return { success: true };

      } catch (transactionError) {
        console.error('❌ [CHANNEL_MANAGEMENT] Transaction error:', transactionError);
        return { success: false, error: 'Erro durante a exclusão do canal' };
      }

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
      
      const { data } = await query.maybeSingle();
      return !data; // Retorna true se não existe
    } catch {
      return true; // Se erro, assumir que não existe
    }
  }
}
