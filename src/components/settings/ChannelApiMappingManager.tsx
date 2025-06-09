
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApiInstances } from '../../hooks/useApiInstances';
import { useChannelApiMappings } from '../../hooks/useChannelApiMappings';
import { useChannels } from '@/contexts/ChannelContext';
import { Settings, Link, CheckCircle, AlertCircle, Wifi } from 'lucide-react';
import { EvolutionApiService } from '../../services/EvolutionApiService';
import { channelWebSocketManager } from '../../services/ChannelWebSocketManager';

export const ChannelApiMappingManager: React.FC = () => {
  const { instances } = useApiInstances();
  const { mappings, upsertMapping, deleteMapping, loading } = useChannelApiMappings();
  const { channels } = useChannels();
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [selectedInstance, setSelectedInstance] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Filtrar canais ativos
  const activeChannels = channels.filter(channel => channel.isActive);

  // Mapear canais para IDs legados
  const getChannelLegacyId = (channel: any) => {
    const nameToId: Record<string, string> = {
      'Yelena-AI': 'af1e5797-edc6-4ba3-a57a-25cf7297c4d6',
      'Canarana': '011b69ba-cf25-4f63-af2e-4ad0260d9516',
      'Souto Soares': 'b7996f75-41a7-4725-8229-564f31868027',
      'João Dourado': '621abb21-60b2-4ff2-a0a6-172a94b4b65c',
      'América Dourada': '64d8acad-c645-4544-a1e6-2f0825fae00b',
      'Gustavo Gerente das Lojas': 'd8087e7b-5b06-4e26-aa05-6fc51fd4cdce',
      'Andressa Gerente Externo': 'd2892900-ca8f-4b08-a73f-6b7aa5866ff7'
    };
    return nameToId[channel.name] || channel.id;
  };

  const handleSaveMapping = async () => {
    if (!selectedChannel || !selectedInstance) return;

    setSaving(true);
    try {
      await upsertMapping(selectedChannel, selectedInstance);

      // Configurar WebSocket na API Evolution (substitui webhook)
      const instance = instances.find(inst => inst.id === selectedInstance);
      const channel = activeChannels.find(ch => getChannelLegacyId(ch) === selectedChannel);

      if (instance && channel && channel.name !== 'Yelena-AI') {
        console.log(`🔌 [WEBSOCKET] Configurando WebSocket para canal: ${channel.name} → instância: ${instance.instance_name}`);
        
        // Configurar WebSocket na instância
        const service = new EvolutionApiService({
          baseUrl: instance.base_url,
          apiKey: instance.api_key,
          instanceName: instance.instance_name
        });

        const configResult = await service.configureWebSocket(instance.instance_name);
        if (!configResult.success) {
          console.warn("Falha ao configurar WebSocket para a instância:", instance.instance_name);
        } else {
          console.log(`✅ [WEBSOCKET] WebSocket configurado para instância: ${instance.instance_name}`);
          
          // Estabelecer conexão WebSocket usando o channelWebSocketManager
          const wsResult = await channelWebSocketManager.initializeChannelWebSocket(selectedChannel, {
            baseUrl: instance.base_url,
            apiKey: instance.api_key,
            instanceName: instance.instance_name,
            channelId: selectedChannel
          });

          if (wsResult.success) {
            console.log(`✅ [WEBSOCKET] Conexão WebSocket estabelecida para canal: ${channel.name}`);
          } else {
            console.warn("Falha ao conectar WebSocket:", wsResult.error);
          }
        }
      }

      setSelectedChannel("");
      setSelectedInstance("");
    } catch (error) {
      console.error('Erro ao salvar mapeamento:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMapping = async (channelId: string) => {
    try {
      const mapping = mappings.find(m => m.channel_id === channelId);
      if (mapping) {
        const instance = instances.find(inst => inst.id === mapping.api_instance_id);
        const channel = activeChannels.find(ch => getChannelLegacyId(ch) === channelId);

        await deleteMapping(channelId);

        // Desconectar WebSocket usando o novo manager
        if (instance && channel && channel.name !== 'Yelena-AI') {
          console.log(`🔌 [WEBSOCKET] Desconectando WebSocket para canal: ${channel.name}`);
          await channelWebSocketManager.disconnectChannelWebSocket(channelId);
          console.log(`✅ [WEBSOCKET] WebSocket desconectado para canal: ${channel.name}`);
        }
      }
    } catch (error) {
      console.error('Erro ao deletar mapeamento:', error);
    }
  };

  const getMappingForChannel = (channelId: string) => {
    return mappings.find(mapping => mapping.channel_id === channelId);
  };

  const getInstanceName = (instanceId: string) => {
    const instance = instances.find(inst => inst.id === instanceId);
    return instance?.instance_name || 'Instância não encontrada';
  };

  const getWebSocketStatus = (channelId: string) => {
    return channelWebSocketManager.getConnectionStatus(channelId);
  };

  const getWebSocketStatusBadge = (channelId: string) => {
    const status = getWebSocketStatus(channelId);
    const statusConfig = {
      'connected': { color: 'text-green-600', text: 'WebSocket Ativo', icon: Wifi },
      'connecting': { color: 'text-yellow-600', text: 'Conectando...', icon: Settings },
      'disconnected': { color: 'text-red-600', text: 'Desconectado', icon: AlertCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.disconnected;
    const Icon = config.icon;

    return (
      <div className={`flex items-center gap-1 text-xs ${config.color}`}>
        <Icon className="h-3 w-3" />
        {config.text}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b5103c]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Mapeamento Canal ↔ API Evolution</h3>
        <p className="text-gray-600 mb-4">
          Vincule cada canal a uma instância específica da API Evolution com conexão WebSocket em tempo real.
        </p>

        {/* Formulário para novo mapeamento */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Novo Mapeamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Canal</label>
                <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um canal" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeChannels.map((channel) => {
                      const channelId = getChannelLegacyId(channel);
                      const hasMapping = getMappingForChannel(channelId);
                      return (
                        <SelectItem key={channelId} value={channelId}>
                          <div className="flex items-center gap-2">
                            {channel.name}
                            {hasMapping && (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            )}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Instância da API</label>
                <Select value={selectedInstance} onValueChange={setSelectedInstance}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma instância" />
                  </SelectTrigger>
                  <SelectContent>
                    {instances.map((instance) => (
                      <SelectItem key={instance.id} value={instance.id!}>
                        {instance.instance_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handleSaveMapping}
              disabled={!selectedChannel || !selectedInstance || saving}
              className="bg-[#b5103c] hover:bg-[#9d0e34] text-white"
            >
              {saving ? 'Configurando WebSocket...' : 'Salvar Mapeamento'}
            </Button>
          </CardContent>
        </Card>

        {/* Lista de mapeamentos existentes */}
        <div className="space-y-3">
          <h4 className="font-medium">Mapeamentos Ativos</h4>
          
          {activeChannels.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Nenhum canal disponível
            </p>
          ) : (
            <div className="grid gap-3">
              {activeChannels.map((channel) => {
                const channelId = getChannelLegacyId(channel);
                const mapping = getMappingForChannel(channelId);
                
                return (
                  <Card key={channelId} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Link className="h-4 w-4 text-[#b5103c]" />
                        <div>
                          <p className="font-medium">{channel.name}</p>
                          <p className="text-sm text-gray-500">
                            Canal ID: {channelId}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {mapping ? (
                          <>
                            <div className="text-right">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-sm font-medium">
                                  {getInstanceName(mapping.api_instance_id)}
                                </span>
                              </div>
                              {getWebSocketStatusBadge(channelId)}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteMapping(channelId)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Remover
                            </Button>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-amber-600">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-sm">Não mapeado</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {instances.length === 0 && (
          <Card className="p-4 bg-amber-50 border-amber-200">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">
                Nenhuma instância da API Evolution configurada. 
                Adicione uma instância primeiro na seção "Gerenciamento de Instâncias".
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
