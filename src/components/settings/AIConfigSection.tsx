
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { 
  Bot, 
  CheckCircle, 
  AlertCircle, 
  Settings, 
  Key, 
  TestTube, 
  RefreshCw, 
  Plus, 
  Edit, 
  Trash2,
  Brain,
  Loader2
} from 'lucide-react';
import { AIProvider, AIProviderFormData } from '@/types/ai-providers';
import { AIProviderService } from '@/services/AIProviderService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AIConfigSectionProps {
  isDarkMode?: boolean;
}

export const AIConfigSection: React.FC<AIConfigSectionProps> = ({ isDarkMode = false }) => {
  const { toast } = useToast();
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<AIProvider | null>(null);
  const [deleteProvider, setDeleteProvider] = useState<AIProvider | null>(null);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<AIProviderFormData>({
    name: '',
    provider_type: 'openai',
    api_key: '',
    base_url: '',
    default_model: 'gpt-3.5-turbo',
    is_active: true,
    advanced_settings: {}
  });

  // Carregar provedores ao montar o componente
  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const providersData = await AIProviderService.getProviders();
      setProviders(providersData);
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

  const resetForm = () => {
    setFormData({
      name: '',
      provider_type: 'openai',
      api_key: '',
      base_url: '',
      default_model: 'gpt-3.5-turbo',
      is_active: true,
      advanced_settings: {}
    });
    setEditingProvider(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (provider: AIProvider) => {
    setFormData({
      name: provider.name,
      provider_type: provider.provider_type,
      api_key: '', // Não pré-preenchemos por segurança
      base_url: provider.base_url || '',
      default_model: provider.default_model,
      is_active: provider.is_active,
      advanced_settings: provider.advanced_settings || {}
    });
    setEditingProvider(provider);
    setIsDialogOpen(true);
  };

  const handleProviderTypeChange = (type: string) => {
    const newFormData = {
      ...formData,
      provider_type: type as AIProviderFormData['provider_type'],
      base_url: AIProviderService.getDefaultBaseUrl(type),
      default_model: AIProviderService.getDefaultModels(type)[0]
    };
    setFormData(newFormData);
  };

  const handleSaveProvider = async () => {
    try {
      if (!formData.name.trim() || !formData.api_key.trim()) {
        toast({
          title: "Erro",
          description: "Nome e API Key são obrigatórios",
          variant: "destructive"
        });
        return;
      }

      if (editingProvider) {
        await AIProviderService.updateProvider(editingProvider.id, formData);
        toast({
          title: "Sucesso",
          description: "Provedor atualizado com sucesso"
        });
      } else {
        await AIProviderService.createProvider(formData);
        toast({
          title: "Sucesso",
          description: "Provedor criado com sucesso"
        });
      }

      setIsDialogOpen(false);
      resetForm();
      loadProviders();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar provedor",
        variant: "destructive"
      });
    }
  };

  const handleDeleteProvider = async () => {
    if (!deleteProvider) return;

    try {
      await AIProviderService.deleteProvider(deleteProvider.id);
      toast({
        title: "Sucesso",
        description: "Provedor deletado com sucesso"
      });
      setDeleteProvider(null);
      loadProviders();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao deletar provedor",
        variant: "destructive"
      });
    }
  };

  const handleTestProvider = async (provider: AIProvider) => {
    try {
      setTestingProvider(provider.id);
      
      await AIProviderService.testProvider({
        provider_type: provider.provider_type,
        api_key: provider.api_key || '',
        base_url: provider.base_url,
        default_model: provider.default_model,
        provider_id: provider.id
      });

      toast({
        title: "Sucesso",
        description: "Conexão testada com sucesso"
      });
      
      // Recarregar para atualizar status do teste
      loadProviders();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao testar conexão",
        variant: "destructive"
      });
    } finally {
      setTestingProvider(null);
    }
  };

  const getStatusBadge = (provider: AIProvider) => {
    if (provider.test_status === 'success') {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Funcionando
        </Badge>
      );
    } else if (provider.test_status === 'error') {
      return (
        <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
          <AlertCircle className="h-3 w-3 mr-1" />
          Erro
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary">
          <AlertCircle className="h-3 w-3 mr-1" />
          Não testado
        </Badge>
      );
    }
  };

  const activeProviders = providers.filter(p => p.is_active);
  const totalProviders = providers.length;
  return (
    <div className="space-y-6">
      {/* Status da Configuração */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className={cn(isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#b5103c]/10">
                <Brain className="h-5 w-5 text-[#b5103c]" />
              </div>
              <div>
                <p className={cn("text-2xl font-bold", isDarkMode ? "text-white" : "text-gray-900")}>IA</p>
                <p className={cn("text-sm text-muted-foreground", isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>Provedores</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", activeProviders.length > 0 ? "bg-green-100" : "bg-red-100")}>
                {activeProviders.length > 0 ? (
                  <CheckCircle className="h-5 w-5 text-[#b5103c]" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-[#b5103c]" />
                )}
              </div>
              <div>
                <p className={cn("text-2xl font-bold", isDarkMode ? "text-white" : "text-gray-900")}>{activeProviders.length}</p>
                <p className={cn("text-sm text-muted-foreground", isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Settings className="h-5 w-5 text-[#b5103c]" />
              </div>
              <div>
                <p className={cn("text-2xl font-bold", isDarkMode ? "text-white" : "text-gray-900")}>{totalProviders}</p>
                <p className={cn("text-sm text-muted-foreground", isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Provedores */}
      <Card className={cn("border shadow-sm", isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200")}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className={cn("text-lg font-medium", isDarkMode ? "text-white" : "text-gray-900")}>
            Provedores de IA
          </CardTitle>
          <Button onClick={openCreateDialog} size="sm" className="bg-[#b5103c] hover:bg-[#9d0e34] text-white">
            <Plus className="h-4 w-4 mr-2" /> Adicionar Provedor
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#b5103c]" />
              <span className="ml-2 text-muted-foreground">Carregando provedores...</span>
            </div>
          ) : providers.length === 0 ? (
            <p className={cn("text-center text-muted-foreground py-8", isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>
              Nenhum provedor de IA configurado. Clique em "Adicionar Provedor" para começar.
            </p>
          ) : (
            <div className="space-y-4">
              {providers.map((provider) => (
                <div
                  key={provider.id}
                  className={cn(
                    "flex items-center justify-between p-4 border rounded-lg",
                    isDarkMode ? "bg-card border-[#3f3f46]" : "bg-gray-50 border-gray-200"
                  )}
                >
                  <div className="flex-1">
                    <h3 className={cn("font-semibold", isDarkMode ? "text-white" : "text-gray-900")}>
                      {provider.name}
                    </h3>
                    <p className={cn("text-sm text-muted-foreground", isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>
                      {AIProviderService.getProviderTypeLabel(provider.provider_type)} - {provider.default_model}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {getStatusBadge(provider)}
                      {provider.is_active ? (
                        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">
                          Inativo
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestProvider(provider)}
                      disabled={testingProvider === provider.id}
                      className={cn(
                        isDarkMode ? "border-[#3f3f46] text-[#a1a1aa] hover:bg-[#27272a]" : "border-gray-200"
                      )}
                    >
                      {testingProvider === provider.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <TestTube className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(provider)}
                      className={cn(
                        isDarkMode ? "border-[#3f3f46] text-[#a1a1aa] hover:bg-[#27272a]" : "border-gray-200"
                      )}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteProvider(provider)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para Adicionar/Editar Provedor */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className={cn(
          isDarkMode ? "bg-[#18181b] border-[#3f3f46] text-white" : "bg-white text-gray-900"
        )}>
          <DialogHeader>
            <DialogTitle className={cn(isDarkMode ? "text-white" : "text-gray-900")}>
              {editingProvider ? "Editar Provedor de IA" : "Adicionar Novo Provedor de IA"}
            </DialogTitle>
            <DialogDescription className={cn(isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>
              Configure as credenciais e modelos para seu provedor de inteligência artificial.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className={cn(isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>Nome do Provedor</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={cn(isDarkMode ? "bg-[#27272a] border-[#3f3f46] text-white" : "bg-white border-gray-200")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="provider_type" className={cn(isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>Tipo de Provedor</Label>
              <Select value={formData.provider_type} onValueChange={handleProviderTypeChange}>
                <SelectTrigger className={cn(isDarkMode ? "bg-[#27272a] border-[#3f3f46] text-white" : "bg-white border-gray-200")}>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent className={cn(isDarkMode ? "bg-[#18181b] border-[#3f3f46] text-white" : "bg-white text-gray-900")}>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="google_gemini">Google Gemini</SelectItem>
                  <SelectItem value="anthropic_claude">Anthropic Claude</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="api_key" className={cn(isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>API Key</Label>
              <Input
                id="api_key"
                type="password"
                value={formData.api_key}
                onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                placeholder="sk-..." 
                className={cn(isDarkMode ? "bg-[#27272a] border-[#3f3f46] text-white" : "bg-white border-gray-200")}
              />
            </div>
            {formData.provider_type === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="base_url" className={cn(isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>Base URL</Label>
                <Input
                  id="base_url"
                  value={formData.base_url}
                  onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
                  placeholder="https://api.example.com/v1" 
                  className={cn(isDarkMode ? "bg-[#27272a] border-[#3f3f46] text-white" : "bg-white border-gray-200")}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="default_model" className={cn(isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>Modelo Padrão</Label>
              <Select value={formData.default_model} onValueChange={(value) => setFormData({ ...formData, default_model: value })}>
                <SelectTrigger className={cn(isDarkMode ? "bg-[#27272a] border-[#3f3f46] text-white" : "bg-white border-gray-200")}>
                  <SelectValue placeholder="Selecione o modelo" />
                </SelectTrigger>
                <SelectContent className={cn(isDarkMode ? "bg-[#18181b] border-[#3f3f46] text-white" : "bg-white text-gray-900")}>
                  {AIProviderService.getDefaultModels(formData.provider_type).map(model => (
                    <SelectItem key={model} value={model}>{model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                className={cn(
                  "data-[state=checked]:bg-[#b5103c]",
                  isDarkMode ? "data-[state=unchecked]:bg-zinc-700" : ""
                )}
              />
              <Label htmlFor="is_active" className={cn(isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>Ativo</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="advanced_settings" className={cn(isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>Configurações Avançadas (JSON)</Label>
              <Textarea
                id="advanced_settings"
                value={JSON.stringify(formData.advanced_settings, null, 2)}
                onChange={(e) => {
                  try {
                    setFormData({ ...formData, advanced_settings: JSON.parse(e.target.value) });
                  } catch (error) {
                    // Ignorar JSON inválido temporariamente
                  }
                }}
                className={cn(
                  "min-h-[100px] text-sm",
                  isDarkMode 
                    ? "bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500" 
                    : "bg-white border-gray-300"
                )}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              className={cn(
                isDarkMode ? "border-[#3f3f46] text-[#a1a1aa] hover:bg-[#27272a]" : ""
              )}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveProvider} 
              className="bg-[#b5103c] hover:bg-[#9d0e34] text-white"
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={!!deleteProvider} onOpenChange={() => setDeleteProvider(null)}>
        <AlertDialogContent className={cn(
          isDarkMode ? "bg-[#18181b] border-[#3f3f46] text-white" : "bg-white text-gray-900"
        )}>
          <AlertDialogHeader>
            <AlertDialogTitle className={cn(isDarkMode ? "text-white" : "text-gray-900")}>
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription className={cn(isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>
              Tem certeza que deseja excluir o provedor "{deleteProvider?.name}"? Esta ação é irreversível.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={cn(
              isDarkMode ? "border-[#3f3f46] text-[#a1a1aa] hover:bg-[#27272a]" : ""
            )}>
              Cancelar
            </AlertDialogCancel>
            <Button 
              variant="destructive" 
              onClick={handleDeleteProvider}
            >
              Excluir
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
