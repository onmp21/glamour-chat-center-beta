import React, { useState } from 'react';
import { Plus, Edit, Trash2, TestTube, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AIProvider, PROVIDER_TYPES } from '@/types/ai-providers';
import { AIProviderForm } from './AIProviderForm';
import { useAIProviders } from '@/hooks/useAIProviders';
import { toast } from 'sonner';

interface AIProviderListProps {
  providers: AIProvider[];
  loading: boolean;
}

export const AIProviderList: React.FC<AIProviderListProps> = ({
  providers,
  loading
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState<AIProvider | null>(null);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const { deleteProvider, testProvider, updateProvider } = useAIProviders();

  const handleEdit = (provider: AIProvider) => {
    setEditingProvider(provider);
    setShowForm(true);
  };

  const handleDelete = async (provider: AIProvider) => {
    if (window.confirm(`Tem certeza que deseja excluir o provedor "${provider.name}"?`)) {
      try {
        await deleteProvider(provider.id);
        toast.success('Provedor excluído com sucesso!');
      } catch (error) {
        toast.error('Erro ao excluir provedor');
      }
    }
  };

  const handleTest = async (provider: AIProvider) => {
    setTestingProvider(provider.id);
    try {
      const result = await testProvider({
        name: provider.name,
        provider_type: provider.provider_type,
        api_key: provider.api_key,
        base_url: provider.base_url,
        default_model: provider.default_model,
        is_active: provider.is_active,
        advanced_settings: provider.advanced_settings
      });

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Erro ao testar provedor');
    } finally {
      setTestingProvider(null);
    }
  };

  const handleToggleActive = async (providerId: string, currentStatus: boolean) => {
    try {
      await updateProvider(providerId, { is_active: !currentStatus });
    } catch (error) {
      console.error('Error updating provider:', error);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingProvider(null);
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? "default" : "secondary"}>
        {isActive ? "Ativo" : "Inativo"}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-20 bg-gray-200 dark:bg-[#27272a] rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-600 dark:text-[#a1a1aa]">
            {providers.length} provedor(es) configurado(s)
          </p>
        </div>
        <Button 
          onClick={() => setShowForm(true)} 
          className="flex items-center space-x-2 bg-[#b5103c] hover:bg-[#b5103c]/90 text-white"
        >
          <Plus className="h-4 w-4" />
          <span>Adicionar Provedor</span>
        </Button>
      </div>

      {providers.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 dark:text-[#a1a1aa] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhum provedor configurado</h3>
          <p className="text-gray-600 dark:text-[#a1a1aa] mb-4">
            Configure um provedor de IA para começar a gerar relatórios inteligentes
          </p>
          <Button 
            onClick={() => setShowForm(true)} 
            className="flex items-center space-x-2 bg-[#b5103c] hover:bg-[#b5103c]/90 text-white"
          >
            <Plus className="h-4 w-4" />
            <span>Adicionar Primeiro Provedor</span>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {providers.map((provider) => (
            <div
              key={provider.id}
              className="border border-gray-200 dark:border-[#3f3f46] bg-white dark:bg-[#18181b] rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(provider.is_active)}
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{provider.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-[#a1a1aa]">
                        {PROVIDER_TYPES[provider.provider_type]}
                        {provider.default_model && ` • ${provider.default_model}`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {getStatusBadge(provider.is_active)}
                  
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTest(provider)}
                      disabled={testingProvider === provider.id}
                      className="flex items-center space-x-1 border-gray-300 dark:border-[#3f3f46] text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-[#27272a]"
                    >
                      <TestTube className="h-3 w-3" />
                      <span>{testingProvider === provider.id ? 'Testando...' : 'Testar'}</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(provider)}
                      className="flex items-center space-x-1 border-gray-300 dark:border-[#3f3f46] text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-[#27272a]"
                    >
                      <Edit className="h-3 w-3" />
                      <span>Editar</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(provider)}
                      className="flex items-center space-x-1 border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Excluir</span>
                    </Button>
                  </div>
                </div>
              </div>

              {provider.base_url && (
                <div className="mt-2 text-xs text-gray-500 dark:text-[#a1a1aa]">
                  URL: {provider.base_url}
                </div>
              )}

              <div className="mt-2 text-xs text-gray-500 dark:text-[#a1a1aa]">
                Criado em: {new Date(provider.created_at).toLocaleDateString('pt-BR')}
                {provider.updated_at !== provider.created_at && (
                  <span> • Atualizado em: {new Date(provider.updated_at).toLocaleDateString('pt-BR')}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <AIProviderForm
          provider={editingProvider}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
};
