import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Zap, FileText, Loader2, Copy, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AIProviderService } from '@/services/AIProviderService';
import { AIProvider } from '@/types/ai-providers';
import { useSimpleMessages } from '@/hooks/useSimpleMessages';

interface AIActionsModalProps {
  isDarkMode: boolean;
  conversationId?: string;
  channelId?: string;
  contactName?: string;
  onClose: () => void;
}

type AIActionType = 'summary' | 'quick_response' | 'report';

interface AIActionResult {
  type: AIActionType;
  content: string;
  provider_used: string;
  model_used: string;
  tokens_used: number;
  generation_time: number;
}

export const AIActionsModal: React.FC<AIActionsModalProps> = ({
  isDarkMode,
  conversationId,
  channelId,
  contactName,
  onClose
}) => {
  const { toast } = useToast();
  const [activeAction, setActiveAction] = useState<AIActionType>('summary');
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<AIActionResult | null>(null);
  const [error, setError] = useState<string>('');

  // INICIO NOVO: Buscar mensagens da conversa usando hook existente
  const { messages, loading: loadingMessages } = useSimpleMessages(channelId || null, conversationId || null);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      const activeProviders = await AIProviderService.getActiveProviders();
      setProviders(activeProviders);
      if (activeProviders.length > 0) {
        setSelectedProvider(activeProviders[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar provedores:', error);
    }
  };

  const getActionConfig = (action: AIActionType) => {
    switch (action) {
      case 'summary':
        return {
          title: 'Resumir Conversa',
          description: 'Gere um resumo inteligente desta conversa',
          icon: Brain,
          color: 'text-blue-600',
          defaultPrompt: 'Faça um resumo detalhado desta conversa, destacando os pontos principais, problemas identificados e soluções propostas.'
        };
      case 'quick_response':
        return {
          title: 'Resposta Rápida',
          description: 'Gere uma sugestão de resposta baseada no contexto',
          icon: Zap,
          color: 'text-green-600',
          defaultPrompt: 'Com base no contexto desta conversa, sugira uma resposta apropriada e profissional para o cliente.'
        };
      case 'report':
        return {
          title: 'Relatório da Conversa',
          description: 'Gere um relatório estruturado desta conversa',
          icon: FileText,
          color: 'text-purple-600',
          defaultPrompt: 'Crie um relatório estruturado desta conversa incluindo: resumo, problemas identificados, ações tomadas e próximos passos.'
        };
    }
  };

  // NOVA FUNCAO: Preparar as mensagens para enviar ao backend
  function prepareMessageContext(messagesArr: any[]) {
    // Prepare up to 50 últimas mensagens para o contexto (mantendo ordem)
    if (!Array.isArray(messagesArr) || messagesArr.length === 0) return [];
    return messagesArr.slice(-50).map(m => ({
      id: m.id,
      nome_do_contato: m.nome_do_contato,
      tipo_remetente: m.tipo_remetente,
      mensagemtype: m.mensagemtype,
      message: m.message,
      read_at: m.read_at,
    }));
  }

  const generateAIContent = async () => {
    // Agora permite 0, 1 ou mais mensagens
    if (!selectedProvider || !conversationId || !channelId) {
      setError('Dados insuficientes para gerar conteúdo');
      return;
    }

    setIsGenerating(true);
    setError('');
    setResult(null);

    try {
      const actionConfig = getActionConfig(activeAction);
      const prompt = customPrompt.trim() || actionConfig.defaultPrompt;

      // Se não houver mensagens, envia contexto vazio mas deixa IA tentar, especialmente quick_response
      const ctxMessages = prepareMessageContext(messages || []);

      const response = await fetch('/functions/v1/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider_id: selectedProvider,
          report_type: 'custom',
          data: {
            conversation_id: conversationId,
            channel_id: channelId,
            contact_name: contactName,
            messages: ctxMessages,
            action_type: activeAction,
          },
          custom_prompt: prompt
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao gerar conteúdo');
      }

      const aiResult = await response.json();
      setResult({
        type: activeAction,
        content: aiResult.content || aiResult.report || 'Sem conteúdo retornado',
        provider_used: aiResult.metadata?.provider_name || 'Desconhecido',
        model_used: aiResult.metadata?.model_used || 'Desconhecido',
        tokens_used: aiResult.metadata?.tokens_used || 0,
        generation_time: aiResult.metadata?.generation_time || 0
      });

      toast({
        title: "Sucesso",
        description: `${actionConfig.title} gerado com sucesso`,
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao gerar conteúdo. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copiado",
        description: "Conteúdo copiado para a área de transferência",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao copiar conteúdo",
        variant: "destructive"
      });
    }
  };

  const downloadContent = (content: string, type: AIActionType) => {
    const actionConfig = getActionConfig(type);
    const filename = `${actionConfig.title.toLowerCase().replace(/\s+/g, '_')}_${conversationId}_${new Date().toISOString().split('T')[0]}.md`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const actionTypes: AIActionType[] = ['summary', 'quick_response', 'report'];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className={cn(
        "max-w-4xl max-h-[90vh] overflow-hidden flex flex-col",
        isDarkMode ? "bg-[#18181b] border-[#3f3f46] text-white" : "bg-white text-gray-900"
      )}>
        <DialogHeader>
          <DialogTitle className={cn("text-xl", isDarkMode ? "text-white" : "text-gray-900")}>
            Ações de Inteligência Artificial
          </DialogTitle>
          <DialogDescription className={cn(isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>
            Use IA para analisar e gerar conteúdo baseado nesta conversa
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-6">
          {/* Seletor de Ação */}
          <div className="grid grid-cols-3 gap-3">
            {actionTypes.map((actionType) => {
              const config = getActionConfig(actionType);
              const IconComponent = config.icon;
              const isActive = activeAction === actionType;
              
              return (
                <Card
                  key={actionType}
                  className={cn(
                    "cursor-pointer transition-all border-2",
                    isActive 
                      ? "border-[#b5103c] bg-[#b5103c]/5" 
                      : isDarkMode 
                        ? "border-[#3f3f46] hover:border-[#52525b] bg-card" 
                        : "border-gray-200 hover:border-gray-300 bg-white"
                  )}
                  onClick={() => setActiveAction(actionType)}
                >
                  <CardContent className="p-4 text-center">
                    <IconComponent 
                      size={24} 
                      className={cn(
                        "mx-auto mb-2",
                        isActive ? "text-[#b5103c]" : config.color
                      )} 
                    />
                    <h3 className={cn(
                      "font-medium text-sm",
                      isDarkMode ? "text-card-foreground" : "text-gray-900"
                    )}>
                      {config.title}
                    </h3>
                    <p className={cn(
                      "text-xs mt-1",
                      isDarkMode ? "text-muted-foreground" : "text-gray-600"
                    )}>
                      {config.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Configurações */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={cn("text-sm font-medium block mb-2", isDarkMode ? "text-muted-foreground" : "text-gray-600")}>
                Provedor de IA
              </label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger className={cn(isDarkMode ? "bg-input-dark border-input-dark text-card-foreground" : "bg-white border-gray-200")}>
                  <SelectValue placeholder="Selecione um provedor" />
                </SelectTrigger>
                <SelectContent className={cn(isDarkMode ? "bg-card border-border text-card-foreground" : "bg-white text-gray-900")}>
                  {providers.map(provider => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name} ({AIProviderService.getProviderTypeLabel(provider.provider_type)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className={cn("text-sm font-medium block mb-2", isDarkMode ? "text-muted-foreground" : "text-gray-600")}>
                Status
              </label>
              <div className="flex items-center gap-2">
                {providers.length > 0 ? (
                  <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Pronto
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Sem provedores
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Prompt Personalizado */}
          <div>
            <label className={cn("text-sm font-medium block mb-2", isDarkMode ? "text-muted-foreground" : "text-gray-600")}>
              Prompt Personalizado (Opcional)
            </label>
            <Textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder={getActionConfig(activeAction).defaultPrompt}
              className={cn(
                "min-h-[80px] text-sm",
                isDarkMode
                  ? "bg-input-dark border-input-dark text-card-foreground placeholder:text-muted-foreground"
                  : "bg-white border-gray-300"
              )}
              rows={3}
            />
          </div>

          {/* Resultado */}
          {(result || isGenerating || error) && (
            <Card className={cn("border shadow-sm", isDarkMode ? "bg-card border-border" : "bg-white border-gray-200")}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className={cn("text-lg", isDarkMode ? "text-card-foreground" : "text-gray-900")}>
                    Resultado
                  </CardTitle>
                  {result && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(result.content)}
                        className={cn(
                          isDarkMode ? "border-border text-muted-foreground hover:bg-accent" : ""
                        )}
                      >
                        <Copy size={14} className="mr-2" />
                        Copiar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadContent(result.content, result.type)}
                        className={cn(
                          isDarkMode ? "border-border text-muted-foreground hover:bg-accent" : ""
                        )}
                      >
                        <Download size={14} className="mr-2" />
                        Download
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-destructive text-sm">{error}</p>
                  </div>
                )}

                {isGenerating && (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b5103c] mx-auto mb-4"></div>
                      <p className={cn("text-sm", isDarkMode ? "text-muted-foreground" : "text-gray-600")}>
                        Gerando conteúdo com IA...
                      </p>
                    </div>
                  </div>
                )}

                {result && (
                  <div className="space-y-4">
                    <div className={cn(
                      "p-3 rounded-lg border max-h-[300px] overflow-auto whitespace-pre-wrap text-sm",
                      isDarkMode
                        ? "bg-input-dark border-input-dark text-card-foreground"
                        : "bg-gray-50 border-gray-200 text-gray-800"
                    )}>
                      {result.content}
                    </div>
                    
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>Provedor: {result.provider_used}</span>
                      <span>•</span>
                      <span>Modelo: {result.model_used}</span>
                      <span>•</span>
                      <span>Tokens: {result.tokens_used}</span>
                      <span>•</span>
                      <span>Tempo: {result.generation_time.toFixed(1)}s</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
        {/* Ações */}
        <div className="flex justify-between pt-4 border-t border-border">
          <Button 
            variant="outline" 
            onClick={onClose}
            className={cn(
              isDarkMode ? "border-border text-muted-foreground hover:bg-accent" : ""
            )}
          >
            Fechar
          </Button>
          <Button 
            onClick={generateAIContent} 
            disabled={isGenerating || !selectedProvider}
            className="bg-[#b5103c] hover:bg-[#9d0e34] text-white"
          >
            {isGenerating ? (
              <>
                <Loader2 size={14} className="mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              `Gerar ${getActionConfig(activeAction).title}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
