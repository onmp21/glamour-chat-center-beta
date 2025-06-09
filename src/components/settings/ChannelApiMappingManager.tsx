
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

  const handleSaveMapping = async () => {
    if (!selectedChannel || !selectedInstance) return;

    setSaving(true);
    try {
      console.log(`🔗 [MAPPING] Vinculando canal ${selectedChannel} à instância ${selectedInstance}`);
      
      await upsertMapping(selectedChannel, selectedInstance);

      // Configurar WebSocket automaticamente
      const instance = instances.find(inst => inst.id === selectedInstance);
      const channel = activeChannels.find(ch => ch.id === selectedChannel);

      if (instance && channel) {
        console.log(`🔌 [WEBSOCKET] Configurando WebSocket para canal: ${channel.name} → instância: ${instance.instance_name}`);
        
        try {
          // Configurar WebSocket na instância da API Evolution
          const service = new EvolutionApiService({
            baseUrl: instance.base_url,
            apiKey: instance.api_key,
            instanceName: instance.instance_name
          });

          const configResult = await service.configureWebSocket(instance.instance_name);
          if (!configResult.success) {
            console.warn("⚠️ [WEBSOCKET] Falha ao configurar WebSocket:", configResult.error);
          } else {
            console.log(`✅ [WEBSOCKET] WebSocket configurado na API Evolution`);
          }

          // Estabelecer conexão WebSocket local
          const wsResult = await channelWebSocketManager.initializeChannelWebSocket(selectedChannel, {
            baseUrl: instance.base_url,
            apiKey: instance.api_key,
            instanceName: instance.instance_name
          });

          if (wsResult.success) {
            console.log(`✅ [WEBSOCKET] Conexão WebSocket estabelecida para canal: ${channel.name}`);
          } else {
            console.warn("⚠️ [WEBSOCKET] Falha ao estabelecer conexão:", wsResult.error);
          }

        } catch (wsError) {
          console.warn("⚠️ [WEBSOCKET] Erro durante configuração WebSocket:", wsError);
        }
      }

      setSelectedChannel("");
      setSelectedInstance("");
    } catch (error) {
      console.error('❌ [MAPPING] Erro ao salvar mapeamento:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMapping = async (channelId: string) => {
    try {
      console.log(`🗑️ [MAPPING] Removendo mapeamento para canal: ${channelId}`);
      
      const mapping = mappings.find(m => m.channel_id === channelId);
      if (mapping) {
        const instance = instances.find(inst => inst.id === mapping.api_instance_id);
        const channel = activeChannels.find(ch => ch.id === channelId);

        await deleteMapping(channelId);

        // Desconectar WebSocket
        if (instance && channel) {
          console.log(`🔌 [WEBSOCKET] Desconectando WebSocket para canal: ${channel.name}`);
          await channelWebSocketManager.disconnectChannelWebSocket(channelId);
          console.log(`✅ [WEBSOCKET] WebSocket desconectado para canal: ${channel.name}`);
        }
      }
    } catch (error) {
      console.error('❌ [MAPPING] Erro ao deletar mapeamento:', error);
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
    return channelWebSocketManager.isChannelConnected(channelId);
  };

  const getWebSocketStatusBadge = (channelId: string) => {
    const isConnected = getWebSocketStatus(channelId);
    
    return (
      <div className={`flex items-center gap-1 text-xs ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
        <Wifi className="h-3 w-3" />
        {isConnected ? 'WebSocket Ativo' : 'Desconectado'}
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
          Vincule cada canal a uma instância específica da API Evolution com conexão WebSocket automática.
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
                      const hasMapping = getMappingForChannel(channel.id);
                      return (
                        <SelectItem key={channel.id} value={channel.id}>
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
                const mapping = getMappingForChannel(channel.id);
                
                return (
                  <Card key={channel.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Link className="h-4 w-4 text-[#b5103c]" />
                        <div>
                          <p className="font-medium">{channel.name}</p>
                          <p className="text-sm text-gray-500">
                            Canal ID: {channel.id}
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
                              {getWebSocketStatusBadge(channel.id)}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteMapping(channel.id)}
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
