
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { X } from 'lucide-react';
import { AIProvider, AIProviderFormData } from '@/types/ai-providers';
import { useAIProviders } from '@/hooks/useAIProviders';
import { toast } from 'sonner';

interface AIProviderFormProps {
  provider?: AIProvider | null;
  onClose: () => void;
}

export const AIProviderForm: React.FC<AIProviderFormProps> = ({
  provider,
  onClose
}) => {
  const { createProvider, updateProvider, testProvider } = useAIProviders();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  
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
    if (provider) {
      setFormData({
        name: provider.name,
        provider_type: provider.provider_type,
        api_key: provider.api_key || '',
        base_url: provider.base_url || '',
        default_model: provider.default_model || '',
        is_active: provider.is_active,
        advanced_settings: provider.advanced_settings || {}
      });
    }
  }, [provider]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      if (provider) {
        result = await updateProvider(provider.id, formData);
      } else {
        result = await createProvider(formData);
      }
      
      if (result.success) {
        toast.success(result.message || 'Operação realizada com sucesso!');
        onClose();
      } else {
        toast.error(result.message || 'Erro na operação');
      }
    } catch (error) {
      toast.error('Erro ao salvar provedor');
    } finally {
      setLoading(false);
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

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {provider ? 'Editar Provedor' : 'Novo Provedor'}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Nome do provedor"
              required
            />
          </div>

          <div>
            <Label htmlFor="provider_type">Tipo</Label>
            <Select
              value={formData.provider_type}
              onValueChange={(value: 'openai' | 'anthropic' | 'google' | 'custom') => 
                setFormData(prev => ({ ...prev, provider_type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="anthropic">Anthropic</SelectItem>
                <SelectItem value="google">Google</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="api_key">API Key</Label>
            <Input
              id="api_key"
              type="password"
              value={formData.api_key}
              onChange={(e) => setFormData(prev => ({ ...prev, api_key: e.target.value }))}
              placeholder="Sua API key"
              required
            />
          </div>

          <div>
            <Label htmlFor="base_url">URL Base (opcional)</Label>
            <Input
              id="base_url"
              value={formData.base_url}
              onChange={(e) => setFormData(prev => ({ ...prev, base_url: e.target.value }))}
              placeholder="https://api.example.com"
            />
          </div>

          <div>
            <Label htmlFor="default_model">Modelo Padrão (opcional)</Label>
            <Input
              id="default_model"
              value={formData.default_model}
              onChange={(e) => setFormData(prev => ({ ...prev, default_model: e.target.value }))}
              placeholder="gpt-4, claude-3, etc."
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="is_active">Ativo</Label>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleTest}
              disabled={testing || !formData.api_key}
              className="flex-1"
            >
              {testing ? 'Testando...' : 'Testar Conexão'}
            </Button>
            
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#b5103c] hover:bg-[#b5103c]/90"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
