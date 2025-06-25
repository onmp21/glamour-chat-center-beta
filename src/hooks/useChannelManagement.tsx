
import { useState } from 'react';
import { ChannelManagementService, CreateChannelData, UpdateChannelData } from '@/services/ChannelManagementService';
import { useChannels } from '@/contexts/ChannelContext';
import { invalidateChannelCache } from '@/utils/channelMapping';

export const useChannelManagement = () => {
  const [loading, setLoading] = useState(false);
  const { refetch } = useChannels();
  const channelService = ChannelManagementService.getInstance();

  const createChannel = async (data: CreateChannelData) => {
    // Prevenir múltiplas chamadas simultâneas
    if (loading) {
      console.warn('⚠️ [CHANNEL_MANAGEMENT_HOOK] Creation already in progress');
      return { success: false, error: 'Criação já em andamento' };
    }

    setLoading(true);
    try {
      console.log('🔄 [CHANNEL_MANAGEMENT_HOOK] Starting channel creation:', data);
      const result = await channelService.createChannel(data);
      
      if (result.success) {
        console.log('✅ [CHANNEL_MANAGEMENT_HOOK] Channel created successfully');
        invalidateChannelCache(); // Invalidar cache após criar canal
        await refetch(); // Recarregar lista de canais
      } else {
        console.error('❌ [CHANNEL_MANAGEMENT_HOOK] Channel creation failed:', result.error);
      }
      
      return result;
    } finally {
      setLoading(false);
    }
  };

  const updateChannel = async (channelId: string, data: UpdateChannelData) => {
    setLoading(true);
    try {
      const result = await channelService.updateChannel(channelId, data);
      if (result.success) {
        invalidateChannelCache(); // Invalidar cache após atualizar canal
        await refetch(); // Recarregar lista de canais
      }
      return result;
    } finally {
      setLoading(false);
    }
  };

  const deleteChannel = async (channelId: string) => {
    setLoading(true);
    try {
      const result = await channelService.deleteChannel(channelId);
      if (result.success) {
        invalidateChannelCache(); // Invalidar cache após excluir canal
        await refetch(); // Recarregar lista de canais
      }
      return result;
    } finally {
      setLoading(false);
    }
  };

  const validateChannelName = async (name: string, excludeId?: string) => {
    return await channelService.validateChannelName(name, excludeId);
  };

  return {
    loading,
    createChannel,
    updateChannel,
    deleteChannel,
    validateChannelName
  };
};
