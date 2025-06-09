import React, { useState } from 'react';
import { ApiInstance, ApiInstanceWithConnection } from '../../types/domain/api/ApiInstance';
import { ApiInstanceForm } from './ApiInstanceForm';
import { ApiInstanceService } from '../../services/ApiInstanceService';
import { MessageSenderEnhanced } from '../../services/MessageSenderEnhanced';

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'text-green-600';
      case 'connecting':
        return 'text-yellow-600';
      case 'disconnected':
      default:
        return 'text-red-600';
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

  return (
    <div className="space-y-6">
      {showForm ? (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">
            {editingInstance ? 'Editar Instância' : 'Nova Instância'}
          </h3>
          <ApiInstanceForm
            initialData={editingInstance || undefined}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Adicionar Nova Instância
        </button>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome da Instância
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                URL Base
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {instances.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                  Nenhuma instância cadastrada
                </td>
              </tr>
            ) : (
              instances.map((instance) => (
                <tr key={instance.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {instance.instance_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {instance.base_url}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${getStatusColor(instanceStatuses[instance.id!] || 'disconnected')}`}>
                        {getStatusText(instanceStatuses[instance.id!] || 'disconnected')}
                      </span>
                      <button
                        onClick={() => handleTestConnection(instance)}
                        disabled={testingConnections[instance.id!]}
                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        {testingConnections[instance.id!] ? 'Testando...' : 'Testar'}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(instance)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => onDelete(instance.id!)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Excluir
                      </button>
                      <button
                        onClick={() => handleConnect(instance)}
                        disabled={connectingInstance === instance.id}
                        className="text-green-600 hover:text-green-900"
                      >
                        {connectingInstance === instance.id ? 'Conectando...' : 'Conectar'}
                      </button>
                      <button
                        onClick={() => handleRestartInstance(instance)}
                        className="text-yellow-600 hover:text-yellow-900"
                      >
                        Reiniciar
                      </button>
                      <button
                        onClick={() => handleLogoutInstance(instance)}
                        className="text-orange-600 hover:text-orange-900"
                      >
                        Logout
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {connectionDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">
              Conectar {connectionDetails.instanceName}
            </h3>
            
            {connectionDetails.error === 'Instância já está conectada' ? (
              <div className="text-center">
                <div className="mb-4 text-green-600 font-medium">
                  Esta instância já está conectada!
                </div>
                <button
                  onClick={handleCloseQRCode}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Fechar
                </button>
              </div>
            ) : connectionDetails.qrCode ? (
              <div className="text-center">
                <p className="mb-4">
                  Escaneie o QR Code abaixo com o WhatsApp para conectar esta instância:
                </p>
                <div className="mb-4 flex justify-center">
                  <img 
                    src={`data:image/png;base64,${connectionDetails.qrCode}`} 
                    alt="QR Code" 
                    className="w-64 h-64"
                  />
                </div>
                {connectionDetails.pairingCode && (
                  <div className="mb-4 p-3 bg-gray-100 rounded-md">
                    <p className="font-medium">Código de pareamento:</p>
                    <p className="text-xl font-bold tracking-wider">{connectionDetails.pairingCode}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Use este código para conectar sem escanear o QR code
                    </p>
                  </div>
                )}
                <button
                  onClick={handleCloseQRCode}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Fechar
                </button>
              </div>
            ) : (
              <div className="text-center">
                <p className="mb-4 text-red-600">
                  {connectionDetails.error || 'Não foi possível obter o QR Code. Verifique se a URL base e a chave de API estão corretas.'}
                </p>
                <button
                  onClick={handleCloseQRCode}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Fechar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

