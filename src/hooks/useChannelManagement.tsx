
import { useState } from 'react';
import { ChannelManagementService, CreateChannelData, UpdateChannelData } from '@/services/ChannelManagementService';
import { useChannels } from '@/contexts/ChannelContext';

export const useChannelManagement = () => {
  const [loading, setLoading] = useState(false);
  const { refetch } = useChannels();
  const channelService = ChannelManagementService.getInstance();

  const createChannel = async (data: CreateChannelData) => {
    setLoading(true);
    try {
      const result = await channelService.createChannel(data);
      if (result.success) {
        await refetch(); // Recarregar lista de canais
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
        await refetch(); // Recarregar lista de canais
      }
      return result;
    } finally {
      setLoading(false);
    }
  };

  const deleteChannel = async (channelId: string, createBackup: boolean = true) => {
    setLoading(true);
    try {
      const result = await channelService.deleteChannel(channelId, createBackup);
      if (result.success) {
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
