import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, TestTube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { AIProvider, AIProviderFormData, PROVIDER_TYPES, DEFAULT_MODELS } from '@/types/ai-providers';
import { useAIProviders } from '@/hooks/useAIProviders';
import { toast } from 'sonner';

interface AIProviderFormProps {
  provider?: AIProvider | null;
  onSave?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}

export const AIProviderForm: React.FC<AIProviderFormProps> = ({
  provider,
  onSave,
  onCancel,
  onClose
}) => {
  const [formData, setFormData] = useState<AIProviderFormData>({
    name: '',
    provider_type: 'openai',
    api_key: '',
    base_url: '',
    default_model: '',
    is_active: true,
    advanced_settings: {}
  });

  const [showApiKey, setShowApiKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  const { createProvider, updateProvider, testProvider, deleteProvider } = useAIProviders();

  useEffect(() => {
    if (provider) {
      setFormData({
        name: provider.name,
        provider_type: provider.provider_type,
        api_key: provider.api_key,
        base_url: provider.base_url || '',
        default_model: provider.default_model || '',
        is_active: provider.is_active,
        advanced_settings: provider.advanced_settings || {}
      });
    }
  }, [provider]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (provider) {
        await updateProvider(provider.id, formData);
        toast.success('Provedor atualizado com sucesso!');
      } else {
        await createProvider(formData);
        toast.success('Provedor criado com sucesso!');
      }
      onSave && onSave();
    } catch (error) {
      toast.error(provider ? 'Erro ao atualizar provedor' : 'Erro ao criar provedor');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const result = await testProvider(formData);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Erro ao testar provedor');
    } finally {
      setTesting(false);
    }
  };

  const getDefaultBaseUrl = (providerType: string) => {
    switch (providerType) {
      case 'openai':
        return 'https://api.openai.com/v1';
      case 'google_gemini':
        return 'https://generativelanguage.googleapis.com/v1';
      case 'anthropic_claude':
        return 'https://api.anthropic.com';
      default:
        return '';
    }
  };

  const handleProviderTypeChange = (value: string) => {
    const newFormData = {
      ...formData,
      provider_type: value as AIProviderFormData['provider_type'],
      base_url: getDefaultBaseUrl(value),
      default_model: DEFAULT_MODELS[value as keyof typeof DEFAULT_MODELS][0] || ''
    };
    setFormData(newFormData);
  };

  const handleDelete = async () => {
    if (provider && window.confirm('Tem certeza que deseja deletar este provedor?')) {
      try {
        await deleteProvider(provider.id);
        onClose && onClose();
      } catch (error) {
        console.error('Error deleting provider:', error);
      }
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#212121] rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-[#3f3f46]">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#3f3f46]">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {provider ? 'Editar Provedor' : 'Adicionar Provedor'}
          </h2>
          <Button variant="ghost" size="sm" onClick={handleClose} className="text-gray-500 dark:text-[#a1a1aa] hover:bg-gray-100 dark:hover:bg-[#27272a]">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-900 dark:text-white">Nome do Provedor *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: OpenAI Principal"
                required
                className="border-gray-300 dark:border-[#3f3f46] bg-white dark:bg-[#18181b] text-gray-900 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider_type" className="text-gray-900 dark:text-white">Tipo de Provedor *</Label>
              <Select value={formData.provider_type} onValueChange={handleProviderTypeChange}>
                <SelectTrigger className="border-gray-300 dark:border-[#3f3f46] bg-white dark:bg-[#18181b] text-gray-900 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#18181b] border-gray-300 dark:border-[#3f3f46]">
                  {Object.entries(PROVIDER_TYPES).map(([key, label]) => (
                    <SelectItem key={key} value={key} className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#27272a]">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="api_key" className="text-gray-900 dark:text-white">Chave de API *</Label>
            <div className="relative">
              <Input
                id="api_key"
                type={showApiKey ? 'text' : 'password'}
                value={formData.api_key}
                onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                placeholder="Sua chave de API"
                required
                className="border-gray-300 dark:border-[#3f3f46] bg-white dark:bg-[#18181b] text-gray-900 dark:text-white pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-[#a1a1aa] hover:bg-gray-100 dark:hover:bg-[#27272a]"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="base_url" className="text-gray-900 dark:text-white">URL Base</Label>
            <Input
              id="base_url"
              value={formData.base_url}
              onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
              placeholder="URL da API (opcional para provedores personalizados)"
              className="border-gray-300 dark:border-[#3f3f46] bg-white dark:bg-[#18181b] text-gray-900 dark:text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="default_model" className="text-gray-900 dark:text-white">Modelo Padrão</Label>
            <Select 
              value={formData.default_model} 
              onValueChange={(value) => setFormData({ ...formData, default_model: value })}
            >
              <SelectTrigger className="border-gray-300 dark:border-[#3f3f46] bg-white dark:bg-[#18181b] text-gray-900 dark:text-white">
                <SelectValue placeholder="Selecione um modelo" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-[#18181b] border-gray-300 dark:border-[#3f3f46]">
                {DEFAULT_MODELS[formData.provider_type].map((model) => (
                  <SelectItem key={model} value={model} className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#27272a]">
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active" className="text-gray-900 dark:text-white">Provedor ativo</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="advanced_settings" className="text-gray-900 dark:text-white">Configurações Avançadas (JSON)</Label>
            <Textarea
              id="advanced_settings"
              value={JSON.stringify(formData.advanced_settings, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  setFormData({ ...formData, advanced_settings: parsed });
                } catch {
                  // Ignore invalid JSON while typing
                }
              }}
              placeholder='{"temperature": 0.7, "max_tokens": 1000}'
              rows={4}
              className="border-gray-300 dark:border-[#3f3f46] bg-white dark:bg-[#18181b] text-gray-900 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-[#a1a1aa]">
              Configurações específicas do provedor em formato JSON (opcional)
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-[#3f3f46]">
            <Button
              type="button"
              variant="outline"
              onClick={handleTest}
              disabled={testing || !formData.api_key}
              className="flex items-center space-x-2 border-gray-300 dark:border-[#3f3f46] text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-[#27272a]"
            >
              <TestTube className="h-4 w-4" />
              <span>{testing ? 'Testando...' : 'Testar Conexão'}</span>
            </Button>

            <div className="flex space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                className="border-gray-300 dark:border-[#3f3f46] text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-[#27272a]"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={saving}
                className="bg-[#b5103c] hover:bg-[#b5103c]/90 text-white"
              >
                {saving ? 'Salvando...' : (provider ? 'Atualizar' : 'Criar')}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
