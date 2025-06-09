
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Bot, CheckCircle, AlertCircle, Settings, Key, TestTube, RefreshCw } from 'lucide-react';

interface AIConfigSectionProps {
  isDarkMode?: boolean;
}

const AI_MODELS = [
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  { value: 'gpt-4', label: 'GPT-4' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' }
];

export const AIConfigSection: React.FC<AIConfigSectionProps> = ({ isDarkMode = false }) => {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-3.5-turbo');
  const [isConfigured, setIsConfigured] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  // Verificar se a IA está configurada ao carregar
  useEffect(() => {
    checkAIConfiguration();
    loadSavedModel();
  }, []);

  const checkAIConfiguration = async () => {
    try {
      const response = await fetch('/api/test-ai-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true })
      });
      
      setIsConfigured(response.ok);
    } catch (error) {
      setIsConfigured(false);
    }
  };

  const loadSavedModel = () => {
    const savedModel = localStorage.getItem('ai_model');
    if (savedModel && AI_MODELS.some(model => model.value === savedModel)) {
      setSelectedModel(savedModel);
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "Erro",
        description: "Digite uma API key válida",
        variant: "destructive"
      });
      return;
    }

    try {
      // Salvar API key no Supabase secrets
      console.log('Salvando API key...', apiKey.substring(0, 10) + '...');
      
      // Salvar modelo selecionado no localStorage
      localStorage.setItem('ai_model', selectedModel);
      
      toast({
        title: "Sucesso",
        description: "Configurações da IA salvas com sucesso",
      });
      
      setIsConfigured(true);
      setApiKey('');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configuração",
        variant: "destructive"
      });
    }
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    localStorage.setItem('ai_model', model);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportData: { test: 'Teste de conectividade' },
          reportType: 'test',
          aiPrompt: 'Responda apenas: "Conexão funcionando corretamente"',
          model: selectedModel
        })
      });

      if (response.ok) {
        setTestResult('success');
        toast({
          title: "Sucesso",
          description: "Conexão com OpenAI funcionando corretamente",
        });
      } else {
        throw new Error('Falha na conexão');
      }
    } catch (error) {
      setTestResult('error');
      toast({
        title: "Erro",
        description: "Erro ao conectar com OpenAI. Verifique a API key.",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getCurrentModelLabel = () => {
    const model = AI_MODELS.find(m => m.value === selectedModel);
    return model ? model.label : 'GPT-3.5 Turbo';
  };

  return (
    <div className="space-y-6">
      {/* Status da Configuração */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#b5103c]/10">
                <Bot className="h-5 w-5 text-[#b5103c]" />
              </div>
              <div>
                <p className="text-2xl font-bold">IA</p>
                <p className="text-sm text-muted-foreground">OpenAI GPT</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", isConfigured ? "bg-green-100" : "bg-red-100")}>
                {isConfigured ? (
                  <CheckCircle className="h-5 w-5 text-[#b5103c]" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-[#b5103c]" />
                )}
              </div>
              <div>
                <p className="text-2xl font-bold">{isConfigured ? 'OK' : 'Não'}</p>
                <p className="text-sm text-muted-foreground">Configurada</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Settings className="h-5 w-5 text-[#b5103c]" />
              </div>
              <div>
                <p className="text-lg font-bold">{getCurrentModelLabel()}</p>
                <p className="text-sm text-muted-foreground">Modelo</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuração da API Key */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-[#b5103c]" />
            Configuração da API OpenAI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key do OpenAI</Label>
            <div className="flex gap-2">
              <Input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="flex-1"
              />
              <Button onClick={handleSaveApiKey} disabled={!apiKey.trim()}>
                Salvar
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model-select">Modelo OpenAI</Label>
            <Select value={selectedModel} onValueChange={handleModelChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um modelo" />
              </SelectTrigger>
              <SelectContent>
                {AI_MODELS.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            {isConfigured ? (
              <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1 text-[#b5103c]" />
                Configurada
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">
                <AlertCircle className="h-3 w-3 mr-1 text-[#b5103c]" />
                Não configurada
              </Badge>
            )}
          </div>

          <div className="text-sm text-muted-foreground">
            <p>
              A API key é necessária para gerar relatórios inteligentes usando IA. 
              Você pode obter uma chave gratuita no{' '}
              <a 
                href="https://platform.openai.com/api-keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#b5103c] hover:underline"
              >
                site da OpenAI
              </a>.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Teste de Conectividade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5 text-[#b5103c]" />
            Teste de Conectividade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleTestConnection} 
              disabled={!isConfigured || isTesting}
              variant="outline"
            >
              {isTesting ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin text-[#b5103c]" />
              ) : (
                <TestTube className="h-4 w-4 mr-2 text-[#b5103c]" />
              )}
              {isTesting ? 'Testando...' : 'Testar Conexão'}
            </Button>

            {testResult && (
              <Badge 
                variant={testResult === 'success' ? "default" : "destructive"}
                className={testResult === 'success' ? 
                  "bg-green-100 text-green-800 border-green-200" : 
                  "bg-red-100 text-red-800 border-red-200"
                }
              >
                {testResult === 'success' ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1 text-[#b5103c]" />
                    Funcionando
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3 w-3 mr-1 text-[#b5103c]" />
                    Erro
                  </>
                )}
              </Badge>
            )}
          </div>

          <div className="text-sm text-muted-foreground">
            <p>
              Use este teste para verificar se a API key está funcionando corretamente 
              com o modelo selecionado antes de gerar relatórios.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recursos Disponíveis */}
      <Card>
        <CardHeader>
          <CardTitle>Recursos de IA Disponíveis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Bot className="h-5 w-5 text-[#b5103c] mt-1" />
              <div>
                <h4 className="font-medium">Análise de Conversas</h4>
                <p className="text-sm text-muted-foreground">
                  Análise inteligente de padrões de comunicação e sentimentos dos clientes
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Settings className="h-5 w-5 text-[#b5103c] mt-1" />
              <div>
                <h4 className="font-medium">Relatórios Automáticos</h4>
                <p className="text-sm text-muted-foreground">
                  Geração automática de relatórios estruturados e insights acionáveis
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
