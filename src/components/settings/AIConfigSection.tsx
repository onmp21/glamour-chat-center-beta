
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Brain, Plus, Edit, Trash2, Eye, EyeOff, Key, Settings } from 'lucide-react';
import { AIProviderService } from '@/services/AIProviderService';
import { AIProvider, ProviderType } from '@/types/ai-providers';
import { toast } from '@/hooks/use-toast';

interface AIConfigSectionProps {
  isDarkMode: boolean;
}

export const AIConfigSection: React.FC<AIConfigSectionProps> = ({ isDarkMode }) => {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState<AIProvider | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    provider_type: 'openai' as ProviderType,
    api_key: '',
    base_url: '',
    default_model: '',
    advanced_settings: '{}'
  });
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const data = await AIProviderService.getProviders();
      setProviders(data);
    } catch (error) {
      console.error('Erro ao carregar provedores:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar provedores de IA",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await AIProviderService.createProvider({
        ...formData,
        is_active: true,
        advanced_settings: JSON.parse(formData.advanced_settings || '{}')
      });
      
      toast({
        title: "Sucesso",
        description: "Provedor criado com sucesso",
      });
      
      setShowCreateForm(false);
      resetForm();
      loadProviders();
    } catch (error) {
      console.error('Erro ao criar provedor:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar provedor",
        variant: "destructive"
      });
    }
  };

  const handleUpdate = async () => {
    if (!editingProvider) return;
    
    try {
      await AIProviderService.updateProvider(editingProvider.id, {
        ...formData,
        is_active: true,
        advanced_settings: JSON.parse(formData.advanced_settings || '{}')
      });
      
      toast({
        title: "Sucesso",
        description: "Provedor atualizado com sucesso",
      });
      
      setEditingProvider(null);
      resetForm();
      loadProviders();
    } catch (error) {
      console.error('Erro ao atualizar provedor:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar provedor",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (providerId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este provedor?')) return;
    
    try {
      await AIProviderService.deleteProvider(providerId);
      
      toast({
        title: "Sucesso",
        description: "Provedor excluído com sucesso",
      });
      
      loadProviders();
    } catch (error) {
      console.error('Erro ao excluir provedor:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir provedor",
        variant: "destructive"
      });
    }
  };

  const startEdit = (provider: AIProvider) => {
    setEditingProvider(provider);
    setFormData({
      name: provider.name,
      provider_type: provider.provider_type,
      api_key: provider.api_key || '',
      base_url: provider.base_url || '',
      default_model: provider.default_model || '',
      advanced_settings: JSON.stringify(provider.advanced_settings || {}, null, 2)
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      provider_type: 'openai',
      api_key: '',
      base_url: '',
      default_model: '',
      advanced_settings: '{}'
    });
    setShowCreateForm(false);
    setEditingProvider(null);
  };

  const toggleApiKeyVisibility = (providerId: string) => {
    setShowApiKey(prev => ({
      ...prev,
      [providerId]: !prev[providerId]
    }));
  };

  const getProviderTypeLabel = (type: ProviderType) => {
    const labels = {
      openai: 'OpenAI',
      anthropic: 'Anthropic',
      google: 'Google',
      custom: 'Personalizado'
    };
    return labels[type] || type;
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  return (
    <Card className={cn("border shadow-lg")} style={{
      backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
      borderColor: isDarkMode ? '#333333' : '#e5e7eb'
    }}>
      <CardHeader className="pb-4">
        <CardTitle className={cn("flex items-center justify-between", isDarkMode ? "text-white" : "text-gray-900")}>
          <div className="flex items-center space-x-2">
            <Brain size={24} className="text-[#b5103c]" />
            <span className="text-xl font-bold">Configuração de IA</span>
          </div>
          <Button 
            size="sm" 
            onClick={() => setShowCreateForm(true)} 
            className="bg-[#b5103c] hover:bg-[#9a0e35] text-white"
          >
            <Plus size={16} className="mr-2" />
            Novo Provedor
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Create/Edit Form */}
        {(showCreateForm || editingProvider) && (
          <Card className={cn("border", isDarkMode ? "bg-[#2a2a2a] border-[#333333]" : "bg-gray-50 border-gray-200")}>
            <CardHeader className="pb-4">
              <CardTitle className={cn("text-lg", isDarkMode ? "text-white" : "text-gray-900")}>
                {editingProvider ? 'Editar Provedor' : 'Novo Provedor'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name" className={cn(isDarkMode ? "text-gray-300" : "text-gray-700")}>Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Nome do provedor"
                  className={cn(isDarkMode ? "bg-[#333333] border-[#444444] text-white" : "bg-white border-gray-300")}
                />
              </div>

              <div>
                <Label htmlFor="provider_type" className={cn(isDarkMode ? "text-gray-300" : "text-gray-700")}>Tipo</Label>
                <Select value={formData.provider_type} onValueChange={(value: ProviderType) => setFormData({...formData, provider_type: value})}>
                  <SelectTrigger className={cn(isDarkMode ? "bg-[#333333] border-[#444444] text-white" : "bg-white border-gray-300")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={cn(isDarkMode ? "bg-[#2a2a2a] border-[#333333] text-white" : "bg-white text-gray-900")}>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="api_key" className={cn(isDarkMode ? "text-gray-300" : "text-gray-700")}>API Key</Label>
                <Input
                  id="api_key"
                  type="password"
                  value={formData.api_key}
                  onChange={(e) => setFormData({...formData, api_key: e.target.value})}
                  placeholder="Sua API key"
                  className={cn(isDarkMode ? "bg-[#333333] border-[#444444] text-white" : "bg-white border-gray-300")}
                />
              </div>

              <div>
                <Label htmlFor="base_url" className={cn(isDarkMode ? "text-gray-300" : "text-gray-700")}>URL Base (opcional)</Label>
                <Input
                  id="base_url"
                  value={formData.base_url}
                  onChange={(e) => setFormData({...formData, base_url: e.target.value})}
                  placeholder="https://api.openai.com/v1"
                  className={cn(isDarkMode ? "bg-[#333333] border-[#444444] text-white" : "bg-white border-gray-300")}
                />
              </div>

              <div>
                <Label htmlFor="default_model" className={cn(isDarkMode ? "text-gray-300" : "text-gray-700")}>Modelo Padrão</Label>
                <Input
                  id="default_model"
                  value={formData.default_model}
                  onChange={(e) => setFormData({...formData, default_model: e.target.value})}
                  placeholder="gpt-3.5-turbo"
                  className={cn(isDarkMode ? "bg-[#333333] border-[#444444] text-white" : "bg-white border-gray-300")}
                />
              </div>

              <div>
                <Label htmlFor="advanced_settings" className={cn(isDarkMode ? "text-gray-300" : "text-gray-700")}>Configurações Avançadas (JSON)</Label>
                <Textarea
                  id="advanced_settings"
                  value={formData.advanced_settings}
                  onChange={(e) => setFormData({...formData, advanced_settings: e.target.value})}
                  placeholder='{"temperature": 0.7, "max_tokens": 1000}'
                  rows={4}
                  className={cn(isDarkMode ? "bg-[#333333] border-[#444444] text-white" : "bg-white border-gray-300")}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={resetForm}
                  className={cn(isDarkMode ? "border-[#333333] text-white hover:bg-[#333333]" : "border-gray-300")}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={editingProvider ? handleUpdate : handleCreate}
                  className="bg-[#b5103c] hover:bg-[#9a0e35] text-white"
                >
                  {editingProvider ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Providers List */}
        <div className="space-y-4">
          <h3 className={cn("text-lg font-semibold", isDarkMode ? "text-white" : "text-gray-900")}>
            Provedores Configurados ({providers.length})
          </h3>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b5103c] mx-auto"></div>
              <p className={cn("mt-2", isDarkMode ? "text-gray-300" : "text-gray-600")}>
                Carregando provedores...
              </p>
            </div>
          ) : providers.length === 0 ? (
            <div className="text-center py-8">
              <Brain className={cn("h-12 w-12 mx-auto mb-4", isDarkMode ? "text-gray-400" : "text-gray-400")} />
              <p className={cn("text-lg", isDarkMode ? "text-gray-300" : "text-gray-600")}>
                Nenhum provedor configurado.
              </p>
              <Button 
                onClick={() => setShowCreateForm(true)}
                className="mt-4 bg-[#b5103c] hover:bg-[#9a0e35] text-white"
              >
                Criar Primeiro Provedor
              </Button>
            </div>
          ) : (
            providers.map(provider => (
              <Card 
                key={provider.id} 
                className={cn(
                  "border transition-all duration-200 hover:shadow-md",
                  isDarkMode ? "bg-[#2a2a2a] border-[#333333] hover:bg-[#333333]" : "bg-white border-gray-200 hover:bg-gray-50"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className={cn("font-semibold text-lg", isDarkMode ? "text-white" : "text-gray-900")}>
                          {provider.name}
                        </h4>
                        <Badge className={getStatusColor(provider.is_active)}>
                          {provider.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                        <Badge variant="outline" className={cn(isDarkMode ? "border-[#444444] text-gray-300" : "border-gray-300")}>
                          {getProviderTypeLabel(provider.provider_type)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className={cn("font-medium", isDarkMode ? "text-gray-300" : "text-gray-600")}>Modelo:</span>
                          <span className={cn("ml-2", isDarkMode ? "text-gray-400" : "text-gray-500")}>
                            {provider.default_model || 'Não definido'}
                          </span>
                        </div>
                        <div>
                          <span className={cn("font-medium", isDarkMode ? "text-gray-300" : "text-gray-600")}>URL Base:</span>
                          <span className={cn("ml-2", isDarkMode ? "text-gray-400" : "text-gray-500")}>
                            {provider.base_url || 'Padrão'}
                          </span>
                        </div>
                        <div className="md:col-span-2">
                          <span className={cn("font-medium", isDarkMode ? "text-gray-300" : "text-gray-600")}>API Key:</span>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={cn("text-sm font-mono", isDarkMode ? "text-gray-400" : "text-gray-500")}>
                              {showApiKey[provider.id] 
                                ? provider.api_key 
                                : '*'.repeat(Math.min(provider.api_key?.length || 0, 20))
                              }
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleApiKeyVisibility(provider.id)}
                              className={cn("p-1", isDarkMode ? "hover:bg-[#444444]" : "hover:bg-gray-100")}
                            >
                              {showApiKey[provider.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => startEdit(provider)}
                        className={cn(
                          "transition-colors duration-200",
                          isDarkMode ? "border-[#333333] hover:bg-[#333333] text-white" : "border-gray-300 hover:bg-gray-100"
                        )}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDelete(provider.id)}
                        className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 transition-colors duration-200"
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
      </CardContent>
    </Card>
  );
};
