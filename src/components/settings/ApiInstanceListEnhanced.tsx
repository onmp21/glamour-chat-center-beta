import React, { useState } from 'react';
import { ApiInstance, ApiInstanceWithConnection } from '../../types/domain/api/ApiInstance';
import { ApiInstanceForm } from './ApiInstanceForm';
import { ApiInstanceService } from '../../services/ApiInstanceService';
import { MessageSenderEnhanced } from '../../services/MessageSenderEnhanced';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { 
  Wifi, 
  WifiOff, 
  Loader2, 
  QrCode, 
  RefreshCw, 
  LogOut, 
  Edit, 
  Trash2, 
  Plus,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';

interface ApiInstanceListProps {
  instances: ApiInstance[];
  onEdit: (instance: ApiInstance) => void;
  onDelete: (id: string) => void;
  onConnect: (id: string) => Promise<ApiInstanceWithConnection | null>;
}

export const ApiInstanceListEnhanced: React.FC<ApiInstanceListProps> = ({
  instances,
  onEdit,
  onDelete,
  onConnect
}) => {
  const [editingInstance, setEditingInstance] = useState<ApiInstance | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [connectingInstance, setConnectingInstance] = useState<string | null>(null);
  const [connectionDetails, setConnectionDetails] = useState<{
    instanceId: string;
    instanceName: string;
    qrCode?: string;
    pairingCode?: string;
    error?: string;
  } | null>(null);
  const [instanceStatuses, setInstanceStatuses] = useState<Record<string, 'connected' | 'disconnected' | 'connecting'>>({});
  const [testingConnections, setTestingConnections] = useState<Record<string, boolean>>({});

  const apiInstanceService = new ApiInstanceService();

  const handleEdit = (instance: ApiInstance) => {
    setEditingInstance(instance);
    setShowForm(true);
  };

  const handleSubmit = (instance: ApiInstance) => {
    onEdit(instance);
    setEditingInstance(null);
    setShowForm(false);
  };

  const handleCancel = () => {
    setEditingInstance(null);
    setShowForm(false);
  };

  const handleConnect = async (instance: ApiInstance) => {
    if (!instance.id) return;
    
    setConnectingInstance(instance.id);
    
    try {
      console.log(`🔄 [API_INSTANCE_LIST] Conectando instância ${instance.instance_name}`);
      
      // Usar o MessageSenderEnhanced para gerar QR code
      const messageSender = new MessageSenderEnhanced(
        instance.api_key,
        instance.base_url
      );
      
      // Verificar primeiro se a instância já está conectada
      const isConnected = await messageSender.checkInstanceConnection(instance.instance_name);
      
      if (isConnected) {
        console.log(`✅ [API_INSTANCE_LIST] Instância ${instance.instance_name} já está conectada`);
        setConnectionDetails({
          instanceId: instance.id,
          instanceName: instance.instance_name,
          error: 'Instância já está conectada'
        });
        setInstanceStatuses(prev => ({ ...prev, [instance.id!]: 'connected' }));
      } else {
        // Gerar QR code
        const result = await messageSender.generateQRCode(instance.instance_name);
        
        if (result.error) {
          console.error(`❌ [API_INSTANCE_LIST] Erro ao gerar QR code: ${result.error}`);
          setConnectionDetails({
            instanceId: instance.id,
            instanceName: instance.instance_name,
            error: result.error
          });
        } else {
          console.log(`✅ [API_INSTANCE_LIST] QR code gerado com sucesso`);
          setConnectionDetails({
            instanceId: instance.id,
            instanceName: instance.instance_name,
            qrCode: result.qrCode,
            pairingCode: result.pairingCode
          });
          
          // Atualizar status para 'connecting'
          setInstanceStatuses(prev => ({ ...prev, [instance.id!]: 'connecting' }));
          
          // Verificar status periodicamente após gerar QR code
          startStatusPolling(instance);
        }
      }
    } catch (error) {
      console.error(`❌ [API_INSTANCE_LIST] Erro ao conectar instância:`, error);
      setConnectionDetails({
        instanceId: instance.id,
        instanceName: instance.instance_name,
        error: `Erro ao conectar: ${error}`
      });
    } finally {
      setConnectingInstance(null);
    }
  };
  
  // Função para iniciar polling de status após gerar QR code
  const startStatusPolling = (instance: ApiInstance) => {
    if (!instance.id) return;
    
    console.log(`🔄 [API_INSTANCE_LIST] Iniciando polling de status para ${instance.instance_name}`);
    
    // Verificar status a cada 5 segundos
    const intervalId = setInterval(async () => {
      try {
        const status = await apiInstanceService.getInstanceConnectionState(instance.id!);
        setInstanceStatuses(prev => ({ ...prev, [instance.id!]: status }));
        
        console.log(`📊 [API_INSTANCE_LIST] Status da instância ${instance.instance_name}: ${status}`);
        
        // Se conectado, parar o polling
        if (status === 'connected') {
          console.log(`✅ [API_INSTANCE_LIST] Instância ${instance.instance_name} conectada com sucesso`);
          clearInterval(intervalId);
          
          // Fechar modal de QR code se estiver aberto para esta instância
          if (connectionDetails?.instanceId === instance.id) {
            setConnectionDetails(null);
          }
        }
      } catch (error) {
        console.error(`❌ [API_INSTANCE_LIST] Erro ao verificar status:`, error);
        clearInterval(intervalId);
      }
    }, 5000);
    
    // Limpar intervalo após 2 minutos (tempo máximo de espera)
    setTimeout(() => {
      clearInterval(intervalId);
      console.log(`⏱️ [API_INSTANCE_LIST] Tempo de polling expirado para ${instance.instance_name}`);
    }, 120000);
  };

  const handleTestConnection = async (instance: ApiInstance) => {
    if (!instance.id) return;
    
    setTestingConnections(prev => ({ ...prev, [instance.id!]: true }));
    
    try {
      console.log(`🔍 [API_INSTANCE_LIST] Testando conexão da instância ${instance.instance_name}`);
      const status = await apiInstanceService.getInstanceConnectionState(instance.id);
      setInstanceStatuses(prev => ({ ...prev, [instance.id!]: status }));
      
      console.log(`📊 [API_INSTANCE_LIST] Status da instância ${instance.instance_name}: ${status}`);
    } catch (error) {
      console.error(`❌ [API_INSTANCE_LIST] Erro ao testar conexão:`, error);
      setInstanceStatuses(prev => ({ ...prev, [instance.id!]: 'disconnected' }));
    } finally {
      setTestingConnections(prev => ({ ...prev, [instance.id!]: false }));
    }
  };

  const handleRestartInstance = async (instance: ApiInstance) => {
    if (!instance.id) return;
    
    try {
      console.log(`🔄 [API_INSTANCE_LIST] Reiniciando instância ${instance.instance_name}`);
      
      // Usar o MessageSenderEnhanced para reiniciar
      const messageSender = new MessageSenderEnhanced(
        instance.api_key,
        instance.base_url
      );
      
      const success = await messageSender.restartInstance(instance.instance_name);
      
      if (success) {
        console.log(`✅ [API_INSTANCE_LIST] Instância ${instance.instance_name} reiniciada com sucesso`);
        // Atualizar status após reiniciar
        setTimeout(() => handleTestConnection(instance), 2000);
      }
    } catch (error) {
      console.error(`❌ [API_INSTANCE_LIST] Erro ao reiniciar instância:`, error);
    }
  };

  const handleLogoutInstance = async (instance: ApiInstance) => {
    if (!instance.id) return;
    
    try {
      console.log(`🚪 [API_INSTANCE_LIST] Fazendo logout da instância ${instance.instance_name}`);
      
      // Usar o MessageSenderEnhanced para logout
      const messageSender = new MessageSenderEnhanced(
        instance.api_key,
        instance.base_url
      );
      
      const success = await messageSender.logoutInstance(instance.instance_name);
      
      if (success) {
        console.log(`✅ [API_INSTANCE_LIST] Logout da instância ${instance.instance_name} realizado com sucesso`);
        setInstanceStatuses(prev => ({ ...prev, [instance.id!]: 'disconnected' }));
      }
    } catch (error) {
      console.error(`❌ [API_INSTANCE_LIST] Erro ao fazer logout da instância:`, error);
    }
  };

  const handleCloseQRCode = () => {
    setConnectionDetails(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'connecting':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'disconnected':
      default:
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Conectado';
      case 'connecting':
        return 'Conectando';
      case 'disconnected':
      default:
        return 'Desconectado';
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'connected':
        return 'default';
      case 'connecting':
        return 'secondary';
      case 'disconnected':
      default:
        return 'destructive';
    }
  };

  return (
    <div className="space-y-6">
      {showForm ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingInstance ? 'Editar Instância' : 'Nova Instância'}
            </CardTitle>
            <CardDescription>
              Configure uma nova instância da Evolution API para envio de mensagens WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ApiInstanceForm
              initialData={editingInstance || undefined}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Instâncias da Evolution API</h3>
            <p className="text-sm text-muted-foreground">
              Gerencie suas instâncias de WhatsApp conectadas
            </p>
          </div>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Adicionar Instância
          </Button>
        </div>
      )}

      {/* Grid de Cards das Instâncias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {instances.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <QrCode className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma instância cadastrada</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Adicione uma nova instância da Evolution API para começar a enviar mensagens
              </p>
              <Button onClick={() => setShowForm(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Adicionar Primeira Instância
              </Button>
            </CardContent>
          </Card>
        ) : (
          instances.map((instance) => {
            const status = instanceStatuses[instance.id!] || 'disconnected';
            const isTesting = testingConnections[instance.id!];
            const isConnecting = connectingInstance === instance.id;

            return (
              <Card key={instance.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base">{instance.instance_name}</CardTitle>
                      <CardDescription className="text-xs">
                        {new URL(instance.base_url).hostname}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusVariant(status)} className="gap-1">
                      {getStatusIcon(status)}
                      {getStatusText(status)}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Informações da instância */}
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>URL Base:</span>
                      <span className="font-mono truncate max-w-32">{instance.base_url}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>API Key:</span>
                      <span className="font-mono">***{instance.api_key.slice(-4)}</span>
                    </div>
                  </div>

                  {/* Botões de ação */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTestConnection(instance)}
                      disabled={isTesting}
                      className="flex-1 gap-1"
                    >
                      {isTesting ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : status === 'connected' ? (
                        <Wifi className="w-3 h-3" />
                      ) : (
                        <WifiOff className="w-3 h-3" />
                      )}
                      {isTesting ? 'Testando...' : 'Testar'}
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => handleConnect(instance)}
                      disabled={isConnecting || status === 'connected'}
                      className="flex-1 gap-1"
                    >
                      {isConnecting ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <QrCode className="w-3 h-3" />
                      )}
                      {isConnecting ? 'Conectando...' : 'QR Code'}
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(instance)}
                      className="flex-1 gap-1"
                    >
                      <Edit className="w-3 h-3" />
                      Editar
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRestartInstance(instance)}
                      className="gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Reiniciar
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleLogoutInstance(instance)}
                      className="gap-1"
                    >
                      <LogOut className="w-3 h-3" />
                      Logout
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDelete(instance.id!)}
                      className="gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Modal do QR Code */}
      <Dialog open={!!connectionDetails} onOpenChange={handleCloseQRCode}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Conectar {connectionDetails?.instanceName}
            </DialogTitle>
            <DialogDescription>
              {connectionDetails?.error === 'Instância já está conectada' 
                ? 'Esta instância já está conectada ao WhatsApp'
                : 'Escaneie o QR Code com o WhatsApp para conectar esta instância'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {connectionDetails?.error === 'Instância já está conectada' ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-semibold text-green-600">
                  Instância Conectada!
                </p>
                <p className="text-sm text-muted-foreground">
                  Esta instância já está conectada e pronta para uso.
                </p>
              </div>
            ) : connectionDetails?.qrCode ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="p-4 bg-white rounded-lg">
                    <img 
                      src={`data:image/png;base64,${connectionDetails.qrCode}`} 
                      alt="QR Code" 
                      className="w-64 h-64"
                    />
                  </div>
                </div>
                
                {connectionDetails.pairingCode && (
                  <div className="text-center space-y-2">
                    <p className="text-sm font-medium">Código de pareamento:</p>
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-2xl font-bold tracking-wider font-mono">
                        {connectionDetails.pairingCode}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Use este código para conectar sem escanear o QR code
                    </p>
                  </div>
                )}

                <div className="text-center text-sm text-muted-foreground">
                  <p>1. Abra o WhatsApp no seu celular</p>
                  <p>2. Vá em Configurações → Aparelhos conectados</p>
                  <p>3. Toque em "Conectar um aparelho"</p>
                  <p>4. Escaneie este QR code</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <p className="text-lg font-semibold text-red-600">
                  Erro ao Conectar
                </p>
                <p className="text-sm text-muted-foreground">
                  {connectionDetails?.error || 'Não foi possível obter o QR Code'}
                </p>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={handleCloseQRCode}>
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

