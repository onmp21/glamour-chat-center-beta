
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AIProviderService } from '@/services/AIProviderService';
import { AIProvider } from '@/types/ai-providers';
import { useSimpleMessages } from '@/hooks/useSimpleMessages';
import { supabase } from '@/integrations/supabase/client';

interface AIQuickResponseModalProps {
  isDarkMode: boolean;
  conversationId?: string;
  channelId?: string;
  contactName?: string;
  onClose: () => void;
  onSelectResponse: (response: string) => void;
}

export const AIQuickResponseModal: React.FC<AIQuickResponseModalProps> = ({
  isDarkMode,
  conversationId,
  channelId,
  contactName,
  onClose,
  onSelectResponse
}) => {
  const { toast } = useToast();
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiResponses, setAiResponses] = useState<string[]>([]);
  const [initialGenerated, setInitialGenerated] = useState(false);

  const { messages, loading: loadingMessages } = useSimpleMessages(channelId || null, conversationId || null);

  useEffect(() => {
    loadProviders();
  }, []);

  // Auto-generate responses when modal opens and data is ready
  useEffect(() => {
    if (providers.length > 0 && !loadingMessages && messages.length > 0 && !initialGenerated) {
      generateAIResponses();
      setInitialGenerated(true);
    }
  }, [providers, loadingMessages, messages, initialGenerated]);

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

  const generateAIResponses = async () => {
    if (!selectedProvider || !conversationId || !channelId) {
      toast({
        title: "Erro",
        description: "Dados insuficientes para gerar respostas",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      console.log('🤖 [AI_QUICK_RESPONSE] Gerando respostas rápidas com IA...');

      // Preparar contexto das mensagens
      const contextMessages = messages.slice(-20).map(m => ({
        id: m.id,
        nome_do_contato: m.nome_do_contato,
        tipo_remetente: m.tipo_remetente,
        message: m.message,
        read_at: m.read_at,
      }));

      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: {
          provider_id: selectedProvider,
          report_type: 'custom',
          action_type: 'quick_response',
          data: {
            conversation_id: conversationId,
            channel_id: channelId,
            contact_name: contactName,
            messages: contextMessages,
          }
        }
      });

      console.log('📊 [AI_QUICK_RESPONSE] Resposta da edge function:', { data, error });

      if (error) {
        console.error('❌ [AI_QUICK_RESPONSE] Erro na edge function:', error);
        toast({
          title: "Erro",
          description: "Erro ao gerar respostas: " + (error.message || 'Erro desconhecido'),
          variant: "destructive"
        });
        return;
      }

      if (data && data.success) {
        // Dividir a resposta em múltiplas opções
        const generatedContent = data.report || data.content || '';
        const responses = generatedContent
          .split('\n')
          .filter((line: string) => line.trim().length > 10)
          .slice(0, 5); // Máximo 5 respostas

        if (responses.length > 0) {
          setAiResponses(responses);
          toast({
            title: "Sucesso",
            description: `${responses.length} respostas geradas com IA`,
          });
        } else {
          // Fallback para uma resposta única
          setAiResponses([generatedContent]);
        }
      } else {
        toast({
          title: "Erro",
          description: data?.error || 'Erro desconhecido na geração de respostas',
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('❌ [AI_QUICK_RESPONSE] Erro geral:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar respostas. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className={cn(
        "max-w-2xl max-h-[80vh] overflow-hidden flex flex-col",
        isDarkMode ? "bg-[#18181b] border-[#3f3f46] text-white" : "bg-white text-gray-900"
      )}>
        <DialogHeader>
          <DialogTitle className={cn("text-xl flex items-center gap-2", isDarkMode ? "text-white" : "text-gray-900")}>
            <Sparkles size={20} className="text-[#b5103c]" />
            Respostas Rápidas com IA
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4">
          {/* Controles */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Badge 
                variant="default"
                className="bg-[#b5103c] text-white"
              >
                Geradas por IA ({aiResponses.length})
              </Badge>
            </div>

            {providers.length > 0 && (
              <Button
                onClick={generateAIResponses}
                disabled={isGenerating || !selectedProvider}
                variant="outline"
                size="sm"
                className={cn(
                  "flex items-center gap-2",
                  isDarkMode ? "border-border text-muted-foreground hover:bg-accent" : ""
                )}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <RefreshCw size={14} />
                    Gerar Novas
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Lista de Respostas */}
          <div className="space-y-2">
            {aiResponses.map((response, index) => (
              <Card
                key={index}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md border-2",
                  isDarkMode 
                    ? "border-[#3f3f46] hover:border-[#52525b] bg-card" 
                    : "border-gray-200 hover:border-gray-300 bg-white"
                )}
                onClick={() => onSelectResponse(response)}
              >
                <CardContent className="p-4">
                  <p className={cn(
                    "text-sm leading-relaxed",
                    isDarkMode ? "text-card-foreground" : "text-gray-900"
                  )}>
                    {response}
                  </p>
                </CardContent>
              </Card>
            ))}

            {aiResponses.length === 0 && isGenerating && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b5103c] mx-auto mb-4"></div>
                <p className={cn("text-sm", isDarkMode ? "text-muted-foreground" : "text-gray-600")}>
                  Gerando respostas personalizadas com IA...
                </p>
              </div>
            )}

            {aiResponses.length === 0 && !isGenerating && providers.length === 0 && (
              <div className={cn(
                "text-center py-8",
                isDarkMode ? "text-gray-400" : "text-gray-500"
              )}>
                <Sparkles className="mx-auto h-12 w-12 opacity-30 mb-3" />
                <p>Nenhum provedor de IA configurado</p>
                <p className="text-sm mt-1">
                  Configure um provedor de IA para gerar respostas personalizadas
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Botão Fechar */}
        <div className="flex justify-end pt-4 border-t border-border">
          <Button 
            variant="outline" 
            onClick={onClose}
            className={cn(
              isDarkMode ? "border-border text-muted-foreground hover:bg-accent" : ""
            )}
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
