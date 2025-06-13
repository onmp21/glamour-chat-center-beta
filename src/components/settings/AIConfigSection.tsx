
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Plus, Edit, Trash2, TestTube, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { useAIProviders } from '@/hooks/useAIProviders';
import { AIProvider, AIProviderFormData, PROVIDER_TYPES } from '@/types/ai-providers';
import { toast } from '@/hooks/use-toast';

interface AIConfigSectionProps {
  isDarkMode: boolean;
}

export const AIConfigSection: React.FC<AIConfigSectionProps> = ({
  isDarkMode
}) => {
  const {
    providers,
    loading,
    refreshing,
    createProvider,
    updateProvider,
    deleteProvider,
    testProvider,
    refreshProviders
  } = useAIProviders();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<AIProvider | null>(null);
  const [testingProviders, setTestingProviders] = useState<Set<string>>(new Set());
  
  const [formData, setFormData] = useState<AIProviderFormData>({
    name: '',
    provider_type: 'openai',
    api_key: '',
    base_url: '',
    default_model: '',
    is_active: true,
    advanced_settings: {}
  });

  useEffect(() => {
    refreshProviders();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      provider_type: 'openai',
      api_key: '',
      base_url: '',
      default_model: '',
      is_active: true,
      advanced_settings: {}
    });
    setEditingProvider(null);
    setIsFormOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingProvider) {
        await updateProvider(editingProvider.id!, formData);
        toast({
          title: "Sucesso",
          description: "Provedor atualizado com sucesso",
        });
      } else {
        await createProvider(formData);
        toast({
          title: "Sucesso",
          description: "Provedor criado com sucesso",
        });
      }
      resetForm();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (provider: AIProvider) => {
    setEditingProvider(provider);
    setFormData({
      name: provider.name,
      provider_type: provider.provider_type,
      api_key: provider.api_key,
      base_url: provider.base_url || '',
      default_model: provider.default_model || '',
      is_active: provider.is_active,
      advanced_settings: provider.advanced_settings || {}
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este provedor?')) {
      try {
        await deleteProvider(id);
        toast({
          title: "Sucesso",
          description: "Provedor excluído com sucesso",
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao excluir provedor",
          variant: "destructive"
        });
      }
    }
  };

  const handleTest = async (provider: AIProvider) => {
    const providerId = provider.id!;
    setTestingProviders(prev => new Set(prev).add(providerId));
    
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
        toast({
          title: "Teste bem-sucedido",
          description: result.message,
        });
      } else {
        toast({
          title: "Teste falhou",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro no teste",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setTestingProviders(prev => {
        const newSet = new Set(prev);
        newSet.delete(providerId);
        return newSet;
      });
    }
  };

  const getStatusIcon = (status?: 'success' | 'failed' | 'pending') => {
    switch (status) {
      case 'success':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'failed':
        return <XCircle size={16} className="text-red-500" />;
      case 'pending':
        return <Clock size={16} className="text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status?: 'success' | 'failed' | 'pending') => {
    if (status === 'failed') {
      return <Badge variant="destructive" className="text-xs">Falhou</Badge>;
    }
    if (status === 'pending') {
      return <Badge variant="secondary" className="text-xs">Testando</Badge>;
    }
    if (status === 'success') {
      return <Badge className="text-xs bg-green-500 text-white">Testado</Badge>;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Provedores de IA</h3>
          <p className="text-muted-foreground">
            Configure provedores de IA para relatórios inteligentes
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={refreshProviders}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            {refreshing ? <Loader2 size={16} className="animate-spin" /> : "Atualizar"}
          </Button>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus size={16} className="mr-2" />
            Novo Provedor
          </Button>
        </div>
      </div>

      {/* Provider Form */}
      {isFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingProvider ? 'Editar Provedor' : 'Novo Provedor'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: OpenAI Principal"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="provider_type">Tipo</Label>
                  <Select
                    value={formData.provider_type}
                    onValueChange={(value: any) => setFormData({ ...formData, provider_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PROVIDER_TYPES).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="api_key">API Key</Label>
                <Input
                  id="api_key"
                  type="password"
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  placeholder="Sua API Key"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="base_url">URL Base (Opcional)</Label>
                  <Input
                    id="base_url"
                    value={formData.base_url}
                    onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
                    placeholder="https://api.openai.com/v1"
                  />
                </div>
                <div>
                  <Label htmlFor="default_model">Modelo Padrão (Opcional)</Label>
                  <Input
                    id="default_model"
                    value={formData.default_model}
                    onChange={(e) => setFormData({ ...formData, default_model: e.target.value })}
                    placeholder="gpt-4, claude-3, etc."
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="advanced_settings">Configurações Avançadas (JSON)</Label>
                <Textarea
                  id="advanced_settings"
                  value={JSON.stringify(formData.advanced_settings, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setFormData({ ...formData, advanced_settings: parsed });
                    } catch {
                      // Invalid JSON, ignore
                    }
                  }}
                  placeholder='{"temperature": 0.7, "max_tokens": 1000}'
                  rows={4}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <Label htmlFor="is_active">Ativo</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingProvider ? 'Atualizar' : 'Criar'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Providers List */}
      <div className="grid gap-4">
        {loading ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Loader2 size={24} className="animate-spin mx-auto mb-2" />
              <p>Carregando provedores...</p>
            </CardContent>
          </Card>
        ) : providers.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">
                Nenhum provedor configurado. Adicione um para começar.
              </p>
            </CardContent>
          </Card>
        ) : (
          providers.map((provider: AIProvider) => (
            <Card key={provider.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{provider.name}</h4>
                      <Badge variant={provider.is_active ? "default" : "secondary"}>
                        {provider.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                      {getStatusBadge(provider.test_status)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Tipo: {PROVIDER_TYPES[provider.provider_type]}
                    </p>
                    {provider.default_model && (
                      <p className="text-sm text-muted-foreground">
                        Modelo: {provider.default_model}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusIcon(provider.test_status)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTest(provider)}
                      disabled={testingProviders.has(provider.id!)}
                    >
                      {testingProviders.has(provider.id!) ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <TestTube size={16} />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(provider)}
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(provider.id!)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
