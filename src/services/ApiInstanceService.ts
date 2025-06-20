
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

  async deleteInstance(id: string): Promise<void> {
    return this.repository.delete(id);
  }

  async getInstanceConnectionState(instanceId: string): Promise<'connected' | 'disconnected' | 'connecting'> {
    try {
      const instance = await this.repository.getById(instanceId);
      
      if (!instance) {
        throw new Error(`Instance with ID ${instanceId} not found`);
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
      
      // O estado 'open' significa conectado
      if (data.instance?.state === 'open') {
        return 'connected';
      } else if (data.instance?.state === 'connecting') {
        return 'connecting';
      } else {
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
        throw new Error(`Instance with ID ${instanceId} not found`);
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

      return {
        pairingCode: data.pairingCode,
        qrCode: data.qrCode, // O campo 'qrCode' contém o QR code base64
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
        return null;
      }

      const connectionStatus = await this.getInstanceConnectionState(instanceId);
      let connectionData = null;
      
      // Sempre tentar conectar para obter o QR Code, independentemente do status atual
      connectionData = await this.connectInstance(instanceId);

      return {
        ...instance,
        connection_status: connectionStatus,
        qr_code: connectionData?.qrCode || null
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
        throw new Error(`Instance with ID ${instanceId} not found`);
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
        throw new Error(`Instance with ID ${instanceId} not found`);
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
}
