
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface InternalChannel {
  id: string;
  name: string;
  type: 'general' | 'store' | 'manager' | 'admin';
  isActive: boolean;
  isDefault: boolean;
  legacyId: string;
}

const DEFAULT_CHANNELS: InternalChannel[] = [
  {
    id: 'af1e5797-edc6-4ba3-a57a-25cf7297c4d6',
    name: 'Yelena-AI',
    type: 'general',
    isActive: true,
    isDefault: true,
    legacyId: 'chat'
  },
  {
    id: '011b69ba-cf25-4f63-af2e-4ad0260d9516',
    name: 'Canarana',
    type: 'store',
    isActive: true,
    isDefault: false,
    legacyId: 'canarana'
  },
  {
    id: 'b7996f75-41a7-4725-8229-564f31868027',
    name: 'Souto Soares',
    type: 'store',
    isActive: true,
    isDefault: false,
    legacyId: 'souto-soares'
  },
  {
    id: '621abb21-60b2-4ff2-a0a6-172a94b4b65c',
    name: 'João Dourado',
    type: 'store',
    isActive: true,
    isDefault: false,
    legacyId: 'joao-dourado'
  },
  {
    id: '64d8acad-c645-4544-a1e6-2f0825fae00b',
    name: 'América Dourada',
    type: 'store',
    isActive: true,
    isDefault: false,
    legacyId: 'america-dourada'
  },
  {
    id: 'd8087e7b-5b06-4e26-aa05-6fc51fd4cdce',
    name: 'Gustavo Gerente das Lojas',
    type: 'manager',
    isActive: true,
    isDefault: false,
    legacyId: 'gerente-lojas'
  },
  {
    id: 'd2892900-ca8f-4b08-a73f-6b7aa5866ff7',
    name: 'Andressa Gerente Externo',
    type: 'manager',
    isActive: true,
    isDefault: false,
    legacyId: 'gerente-externo'
  }
];

export const useInternalChannels = () => {
  const [channels, setChannels] = useState<InternalChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Carregar canais do localStorage ou usar padrões
    const savedChannels = localStorage.getItem('app_channels');
    if (savedChannels) {
      try {
        setChannels(JSON.parse(savedChannels));
      } catch (error) {
        console.error('Erro ao carregar canais salvos:', error);
        setChannels(DEFAULT_CHANNELS);
      }
    } else {
      setChannels(DEFAULT_CHANNELS);
    }
    setLoading(false);
  }, []);

  const saveChannels = (updatedChannels: InternalChannel[]) => {
    localStorage.setItem('app_channels', JSON.stringify(updatedChannels));
    setChannels(updatedChannels);
  };

  const updateChannelStatus = async (channelId: string, isActive: boolean) => {
    try {
      const channel = channels.find(c => c.id === channelId);
      if (!channel) {
        throw new Error('Canal não encontrado');
      }
      
      if (channel.isDefault && !isActive) {
        toast({
          title: "Ação não permitida",
          description: "Canais padrão não podem ser desativados",
          variant: "destructive"
        });
        return;
      }

      const updatedChannels = channels.map(c => 
        c.id === channelId ? { ...c, isActive } : c
      );
      
      saveChannels(updatedChannels);
      
      toast({
        title: "Sucesso",
        description: `Canal ${isActive ? 'ativado' : 'desativado'} com sucesso`,
        variant: "default"
      });
    } catch (error) {
      console.error('Erro ao atualizar canal:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar canal. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const refetch = async () => {
    // Não há necessidade de refetch para dados locais
    return Promise.resolve();
  };

  return {
    channels,
    loading,
    updateChannelStatus,
    refetch
  };
};
