import React, { useState } from 'react';
import { ApiInstanceList } from './ApiInstanceList';
import { useApiInstances } from '../../hooks/useApiInstances';
import { ApiInstance } from '../../types/domain/api/ApiInstance';

export const ApiInstanceManager: React.FC = () => {
  const {
    instances,
    loading,
    error,
    createInstance,
    updateInstance,
    deleteInstance,
    getInstanceWithConnectionDetails
  } = useApiInstances();

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    show: boolean;
    instanceId: string;
    instanceName: string;
  } | null>(null);

  const handleEdit = async (instance: ApiInstance) => {
    try {
      if (instance.id) {
        await updateInstance(instance.id, instance);
      } else {
        await createInstance(instance);
      }
    } catch (error) {
      console.error('Error saving instance:', error);
    }
  };

  const handleDelete = (id: string) => {
    const instance = instances.find(i => i.id === id);
    if (instance) {
      setDeleteConfirmation({
        show: true,
        instanceId: id,
        instanceName: instance.instance_name
      });
    }
  };

  const confirmDelete = async () => {
    if (deleteConfirmation) {
      try {
        await deleteInstance(deleteConfirmation.instanceId);
        setDeleteConfirmation(null);
      } catch (error) {
        console.error('Error deleting instance:', error);
      }
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation(null);
  };

  const handleConnect = async (id: string) => {
    return await getInstanceWithConnectionDetails(id);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Repositório Central de Instâncias da API</h2>
        <p className="text-gray-600 mb-4">
          Gerencie todas as suas instâncias da API Evolution em um único lugar. Adicione, edite ou remova instâncias conforme necessário.
        </p>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <ApiInstanceList
          instances={instances}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onConnect={handleConnect}
        />
      </div>

      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium mb-2">Confirmar exclusão</h3>
            <p className="mb-4">
              Tem certeza que deseja excluir a instância "{deleteConfirmation.instanceName}"? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

