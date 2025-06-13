
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Edit, Plus, RefreshCw } from 'lucide-react';
import { useAIProviders } from '@/hooks/useAIProviders';
import { AIProviderForm } from './AIProviderForm';
import { AIProvider } from '@/types/ai-providers';
import { cn } from '@/lib/utils';

interface AIProviderListProps {
  isDarkMode: boolean;
}

export const AIProviderList: React.FC<AIProviderListProps> = ({ isDarkMode }) => {
  const { providers, loading, refreshing, deleteProvider, refreshProviders } = useAIProviders();
  const [showForm, setShowForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState<AIProvider | null>(null);

  const handleEdit = (provider: AIProvider) => {
    setEditingProvider(provider);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este provedor?')) {
      await deleteProvider(Number(id));
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingProvider(null);
  };

  const handleCreateNew = () => {
    setEditingProvider(null);
    setShowForm(true);
  };

  const handleRefresh = () => {
    refreshProviders();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b5103c]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={cn("text-2xl font-bold", isDarkMode ? "text-white" : "text-gray-900")}>
            Provedores de IA
          </h2>
          <p className={cn("text-sm mt-1", isDarkMode ? "text-gray-400" : "text-gray-600")}>
            Configure e gerencie seus provedores de IA
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            Atualizar
          </Button>
          <Button onClick={handleCreateNew} className="gap-2 bg-[#b5103c] hover:bg-[#9d0e34]">
            <Plus className="h-4 w-4" />
            Novo Provedor
          </Button>
        </div>
      </div>

      {providers.length === 0 ? (
        <Card className={cn(isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "")}>
          <CardContent className="py-8">
            <div className="text-center">
              <p className={cn("text-lg", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                Nenhum provedor configurado
              </p>
              <p className={cn("text-sm mt-1", isDarkMode ? "text-gray-500" : "text-gray-500")}>
                Configure um provedor de IA para começar a usar os recursos avançados
              </p>
              <Button 
                onClick={handleCreateNew} 
                className="mt-4 bg-[#b5103c] hover:bg-[#9d0e34]"
              >
                Criar Primeiro Provedor
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {providers.map((provider) => (
            <Card key={provider.id} className={cn(isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "")}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className={cn("text-lg", isDarkMode ? "text-white" : "text-gray-900")}>
                      {provider.name}
                    </CardTitle>
                    <Badge variant={provider.is_active ? "default" : "secondary"}>
                      {provider.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEdit(provider)}
                      variant="outline"
                      size="sm"
                      className="gap-1"
                    >
                      <Edit className="h-3 w-3" />
                      Editar
                    </Button>
                    <Button
                      onClick={() => handleDelete(provider.id)}
                      variant="outline"
                      size="sm"
                      className="gap-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                      Excluir
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className={cn("font-medium", isDarkMode ? "text-gray-300" : "text-gray-700")}>
                      Tipo:
                    </span>
                    <span className={cn("ml-2", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                      {provider.provider_type}
                    </span>
                  </div>
                  {provider.default_model && (
                    <div>
                      <span className={cn("font-medium", isDarkMode ? "text-gray-300" : "text-gray-700")}>
                        Modelo:
                      </span>
                      <span className={cn("ml-2", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                        {provider.default_model}
                      </span>
                    </div>
                  )}
                  {provider.base_url && (
                    <div className="col-span-2">
                      <span className={cn("font-medium", isDarkMode ? "text-gray-300" : "text-gray-700")}>
                        URL Base:
                      </span>
                      <span className={cn("ml-2 break-all", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                        {provider.base_url}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
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
