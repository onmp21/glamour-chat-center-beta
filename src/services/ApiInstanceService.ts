
import { ApiInstance, ApiInstanceWithConnection } from '../types/domain/api/ApiInstance';
import { ApiInstanceRepository } from '../repositories/ApiInstanceRepository';

export class ApiInstanceService {
  private repository: ApiInstanceRepository;

  constructor() {
    this.repository = new ApiInstanceRepository();
  }

  async getAllInstances(): Promise<ApiInstance[]> {
    return this.repository.getAll();
  }

  async getInstance(id: string): Promise<ApiInstance | null> {
    return this.repository.getById(id);
  }

  async createInstance(instance: ApiInstance): Promise<ApiInstance> {
    return this.repository.create(instance);
  }

  async updateInstance(id: string, instance: Partial<ApiInstance>): Promise<ApiInstance> {
    return this.repository.update(id, instance);
  }

  async getInstanceConnectionState(instanceId: string): Promise<'connected' | 'disconnected' | 'connecting'> {
    try {
      const instance = await this.repository.getById(instanceId);
      
      if (!instance) {
        console.error(`❌ [API_INSTANCE_SERVICE] Instance with ID ${instanceId} not found`);
        return 'disconnected';
      }

      if (!instance.instance_name) {
        console.error(`❌ [API_INSTANCE_SERVICE] Instance name is undefined for ID ${instanceId}`);
        return 'disconnected';
      }

      console.log(`🔍 [API_INSTANCE_SERVICE] Verificando status da instância ${instance.instance_name}`);

      // Usar endpoint correto da documentação Evolution API
      const response = await fetch(`${instance.base_url}/instance/connectionState/${instance.instance_name}`, {
        method: 'GET',
        headers: {
          'apikey': instance.api_key
        }
      });

      if (!response.ok) {
        console.error(`❌ [API_INSTANCE_SERVICE] Erro ao verificar status: ${response.status}`);
        return 'disconnected';
      }

      const data = await response.json();
      console.log(`📋 [API_INSTANCE_SERVICE] Status recebido:`, data);
      
      // Verificar se a resposta tem a estrutura correta
      if (data && data.instance) {
        const state = data.instance.state || data.instance.status;
        
        // O estado 'open' significa conectado
        if (state === 'open') {
          return 'connected';
        } else if (state === 'connecting') {
          return 'connecting';
        } else {
          return 'disconnected';
        }
      } else {
        console.warn(`⚠️ [API_INSTANCE_SERVICE] Estrutura de resposta inesperada:`, data);
        return 'disconnected';
      }
    } catch (error) {
      console.error('❌ [API_INSTANCE_SERVICE] Erro ao verificar status da instância:', error);
      return 'disconnected';
    }
  }

  async connectInstance(instanceId: string): Promise<{ pairingCode?: string; qrCode?: string; status: string } | null> {
    try {
      const instance = await this.repository.getById(instanceId);
      
      if (!instance) {
        console.error(`❌ [API_INSTANCE_SERVICE] Instance with ID ${instanceId} not found`);
        return null;
      }

      if (!instance.instance_name) {
        console.error(`❌ [API_INSTANCE_SERVICE] Instance name is undefined for ID ${instanceId}`);
        return null;
      }

      console.log(`🔗 [API_INSTANCE_SERVICE] Conectando instância ${instance.instance_name}`);

      // Usar endpoint correto da documentação Evolution API
      const response = await fetch(`${instance.base_url}/instance/connect/${instance.instance_name}`, {
        method: 'GET',
        headers: {
          'apikey': instance.api_key
        }
      });

      if (!response.ok) {
        console.error(`❌ [API_INSTANCE_SERVICE] Erro ao conectar: ${response.status}`);
        return null;
      }

      const data = await response.json();
      console.log(`✅ [API_INSTANCE_SERVICE] Dados de conexão recebidos:`, data);

      // Verificar diferentes possíveis estruturas de resposta
      let qrCode = null;
      let pairingCode = null;

      // Tentar diferentes campos onde o QR code pode estar
      if (data.qrCode) {
        qrCode = data.qrCode;
      } else if (data.code) {
        qrCode = data.code;
      } else if (data.qr) {
        qrCode = data.qr;
      }

      // Tentar diferentes campos onde o pairing code pode estar
      if (data.pairingCode) {
        pairingCode = data.pairingCode;
      } else if (data.pairing_code) {
        pairingCode = data.pairing_code;
      }

      return {
        pairingCode: pairingCode,
        qrCode: qrCode,
        status: 'connecting'
      };
    } catch (error) {
      console.error('❌ [API_INSTANCE_SERVICE] Erro ao conectar instância:', error);
      return null;
    }
  }

  async getInstanceWithConnectionDetails(instanceId: string): Promise<ApiInstanceWithConnection | null> {
    try {
      const instance = await this.repository.getById(instanceId);
      
      if (!instance) {
        console.error(`❌ [API_INSTANCE_SERVICE] Instance with ID ${instanceId} not found`);
        return null;
      }

      if (!instance.instance_name) {
        console.error(`❌ [API_INSTANCE_SERVICE] Instance name is undefined for ID ${instanceId}`);
        return null;
      }

      const connectionStatus = await this.getInstanceConnectionState(instanceId);
      let qrCode = null;
      
      // Só tentar obter QR Code se a instância não estiver conectada
      if (connectionStatus !== 'connected') {
        const connectionData = await this.connectInstance(instanceId);
        qrCode = connectionData?.qrCode || null;
      }

      return {
        ...instance,
        connection_status: connectionStatus,
        qr_code: qrCode
      };
    } catch (error) {
      console.error('❌ [API_INSTANCE_SERVICE] Erro ao obter detalhes de conexão:', error);
      return null;
    }
  }

  async restartInstance(instanceId: string): Promise<boolean> {
    try {
      const instance = await this.repository.getById(instanceId);
      
      if (!instance) {
        console.error(`❌ [API_INSTANCE_SERVICE] Instance with ID ${instanceId} not found`);
        return false;
      }

      if (!instance.instance_name) {
        console.error(`❌ [API_INSTANCE_SERVICE] Instance name is undefined for ID ${instanceId}`);
        return false;
      }

      console.log(`🔄 [API_INSTANCE_SERVICE] Reiniciando instância ${instance.instance_name}`);

      const response = await fetch(`${instance.base_url}/instance/restart/${instance.instance_name}`, {
        method: 'PUT',
        headers: {
          'apikey': instance.api_key
        }
      });

      if (!response.ok) {
        console.error(`❌ [API_INSTANCE_SERVICE] Erro ao reiniciar: ${response.status}`);
        return false;
      }

      const data = await response.json();
      console.log(`✅ [API_INSTANCE_SERVICE] Instância reiniciada:`, data);
      return true;
    } catch (error) {
      console.error('❌ [API_INSTANCE_SERVICE] Erro ao reiniciar instância:', error);
      return false;
    }
  }

  async logoutInstance(instanceId: string): Promise<boolean> {
    try {
      const instance = await this.repository.getById(instanceId);
      
      if (!instance) {
        console.error(`❌ [API_INSTANCE_SERVICE] Instance with ID ${instanceId} not found`);
        return false;
      }

      if (!instance.instance_name) {
        console.error(`❌ [API_INSTANCE_SERVICE] Instance name is undefined for ID ${instanceId}`);
        return false;
      }

      console.log(`🚪 [API_INSTANCE_SERVICE] Fazendo logout da instância ${instance.instance_name}`);

      const response = await fetch(`${instance.base_url}/instance/logout/${instance.instance_name}`, {
        method: 'DELETE',
        headers: {
          'apikey': instance.api_key
        }
      });

      if (!response.ok) {
        console.error(`❌ [API_INSTANCE_SERVICE] Erro ao fazer logout: ${response.status}`);
        return false;
      }

      const data = await response.json();
      console.log(`✅ [API_INSTANCE_SERVICE] Logout realizado:`, data);
      return data.status === 'SUCCESS';
    } catch (error) {
      console.error('❌ [API_INSTANCE_SERVICE] Erro ao fazer logout da instância:', error);
      return false;
    }
  }

  async deleteInstance(id: string): Promise<void> {
    try {
      const instance = await this.repository.getById(id);
      
      if (!instance) {
        console.error(`❌ [API_INSTANCE_SERVICE] Instance with ID ${id} not found`);
        return;
      }

      if (!instance.instance_name) {
        console.error(`❌ [API_INSTANCE_SERVICE] Instance name is undefined for ID ${id}`);
        return;
      }

      console.log(`🗑️ [API_INSTANCE_SERVICE] Deletando instância ${instance.instance_name}`);

      // Primeiro tentar deletar da Evolution API
      try {
        const response = await fetch(`${instance.base_url}/instance/delete/${instance.instance_name}`, {
          method: 'DELETE',
          headers: {
            'apikey': instance.api_key
          }
        });

        if (response.ok) {
          console.log(`✅ [API_INSTANCE_SERVICE] Instância deletada da Evolution API`);
        } else {
          console.warn(`⚠️ [API_INSTANCE_SERVICE] Falha ao deletar da Evolution API: ${response.status}`);
        }
      } catch (apiError) {
        console.warn(`⚠️ [API_INSTANCE_SERVICE] Erro ao deletar da Evolution API:`, apiError);
      }

      // Sempre deletar do repositório local
      await this.repository.delete(id);
      console.log(`✅ [API_INSTANCE_SERVICE] Instância removida do repositório local`);
    } catch (error) {
      console.error('❌ [API_INSTANCE_SERVICE] Erro ao deletar instância:', error);
      throw error;
    }
  }
}
