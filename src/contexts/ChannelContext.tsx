
import React, { createContext, useContext } from 'react';
import { useInternalChannels, InternalChannel } from '@/hooks/useInternalChannels';

interface Channel {
  id: string;
  name: string;
  type: 'general' | 'store' | 'manager' | 'admin';
  isActive: boolean;
  isDefault: boolean;
}

interface ChannelContextType {
  channels: Channel[];
  updateChannelStatus: (channelId: string, isActive: boolean) => Promise<void>;
  loading: boolean;
  refetch: () => Promise<void>;
}

const ChannelContext = createContext<ChannelContextType | undefined>(undefined);

export const ChannelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { channels: internalChannels, updateChannelStatus, loading, refetch } = useInternalChannels();
  
  // Converter formato interno para o formato esperado pelo contexto e filtrar o canal Pedro
  const channels: Channel[] = internalChannels
    .filter(channel => channel.name !== 'Pedro') // Remove o canal Pedro
    .map(channel => ({
      id: channel.id,
      name: channel.name,
      type: channel.type,
      isActive: channel.isActive,
      isDefault: channel.isDefault
    }));

  return (
    <ChannelContext.Provider value={{
      channels,
      updateChannelStatus,
      loading,
      refetch
    }}>
      {children}
    </ChannelContext.Provider>
  );
};

export const useChannels = () => {
  const context = useContext(ChannelContext);
  if (context === undefined) {
    throw new Error('useChannels must be used within a ChannelProvider');
  }
  return context;
};
