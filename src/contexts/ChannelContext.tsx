
import React, { createContext, useContext } from 'react';
import { useInternalChannels, InternalChannel } from '@/hooks/useInternalChannels';

interface Channel {
  id: string;      // <- ATENÇÃO: Agora será SEMPRE o legacyId!
  name: string;
  type: 'general' | 'store' | 'manager' | 'admin';
  isActive: boolean;
  isDefault: boolean;
  // Adiciona, se necessário, o UUID original para consulta
  uuid?: string;
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
  
  // Converter InternalChannel para Channel, expondo legacyId como id principal!
  const channels: Channel[] = internalChannels
    .filter(channel => channel.name !== 'Pedro') // Remove o canal Pedro
    .map(channel => ({
      id: channel.legacyId,        // <- ESSENCIAL: expor .legacyId como id global!
      name: channel.name,
      type: channel.type,
      isActive: channel.isActive,
      isDefault: channel.isDefault,
      uuid: channel.id            // Se precisar acessar o UUID real em filhos, busque pelo campo uuid
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
