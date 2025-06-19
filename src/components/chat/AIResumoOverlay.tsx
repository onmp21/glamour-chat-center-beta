import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Brain, X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { AIProviderService } from "@/services/AIProviderService";
import { AIProvider } from "@/types/ai-providers";
import { supabase } from "@/integrations/supabase/client";
import { getTableNameForChannelSync } from "@/utils/channelMapping";

interface AIResumoOverlayProps {
  open: boolean;
  onClose: () => void;
  summary?: string | null;
  isLoading: boolean;
  error?: string | null;
  isDarkMode?: boolean;
  onCopy?: () => void;
  onDownload?: () => void;
  conversationId?: string;
  channelId?: string;
  contactName?: string;
  messages?: any[];
}

export const AIResumoOverlay: React.FC<AIResumoOverlayProps> = ({
  open,
  onClose,
  summary: externalSummary,
  isLoading: externalLoading,
  error: externalError,
  isDarkMode,
  onCopy,
  onDownload,
  conversationId,
  channelId,
  contactName,
  messages = []
}) => {
  const { toast } = useToast();
  const [internalSummary, setInternalSummary] = useState<string>('');
  const [internalLoading, setInternalLoading] = useState(false);
  const [internalError, setInternalError] = useState<string>('');
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [conversationMessages, setConversationMessages] = useState<any[]>([]);

  // Use external props or internal state
  const summary = externalSummary || internalSummary;
  const isLoading = externalLoading || internalLoading;
  const error = externalError || internalError;

  useEffect(() => {
    if (open && !summary && !isLoading && conversationId && channelId) {
      loadProvidersAndGenerateSummary();
    }
  }, [open, conversationId, channelId]);

  const loadConversationMessages = async () => {
    if (!channelId || !conversationId) {
      console.log('❌ [AI_RESUMO] Missing channelId or conversationId');
      return [];
    }

    try {
      const tableName = getTableNameForChannelSync(channelId);
      console.log(`📊 [AI_RESUMO] Loading messages from table: ${tableName} for session: ${conversationId}`);
      
      const { data, error: queryError } = await supabase
        .from(tableName as any)
        .select('id, message, nome_do_contato, tipo_remetente, read_at, mensagemtype')
        .eq('session_id', conversationId)
        .order('read_at', { ascending: true })
        .limit(100);

      if (queryError) {
        console.error('❌ [AI_RESUMO] Error loading messages:', queryError);
        throw new Error(`Erro ao carregar mensagens: ${queryError.message}`);
      }

      console.log(`📊 [AI_RESUMO] Loaded ${data?.length || 0} messages from ${tableName}`);
      
      if (!data || data.length === 0) {
        setInternalError('Não há mensagens nesta conversa para resumir.');
        return [];
      }

      return data || [];

    } catch (error) {
      console.error('❌ [AI_RESUMO] Error loading conversation messages:', error);
      setInternalError(error instanceof Error ? error.message : 'Erro ao carregar mensagens');
      return [];
    }
  };

  const loadProvidersAndGenerateSummary = async () => {
    try {
      console.log('🔄 [AI_RESUMO] Loading providers...');
      const activeProviders = await AIProviderService.getActiveProviders();
      setProviders(activeProviders);
      
      if (activeProviders.length === 0) {
        setInternalError('Nenhum provedor de IA configurado');
        return;
      }
      
      console.log(`✅ [AI_RESUMO] Found ${activeProviders.length} active providers`);
      
      const messages = await loadConversationMessages();
      setConversationMessages(messages);
      
      if (messages.length > 0) {
        await generateSummary(activeProviders[0].id, messages);
      }
    } catch (error) {
      console.error('❌ [AI_RESUMO] Error loading providers:', error);
      setInternalError('Erro ao carregar configurações de IA');
    }
  };

  const generateSummary = async (providerId?: string, messagesData?: any[]) => {
    if (!conversationId || !channelId) {
      setInternalError('Dados da conversa não disponíveis');
      return;
    }

    const selectedProvider = providerId || providers[0]?.id;
    if (!selectedProvider) {
      setInternalError('Nenhum provedor de IA configurado');
      return;
    }

    setInternalLoading(true);
    setInternalError('');

    try {
      console.log('📝 [AI_RESUMO] Gerando resumo com prompt conversation_summary...');

      // Use mensagens carregadas ou as passadas como prop
      const messagesToUse = messagesData || conversationMessages || messages;
      
      if (messagesToUse.length === 0) {
        console.warn('⚠️ [AI_RESUMO] Nenhuma mensagem encontrada para resumir');
        setInternalError('Não há mensagens nesta conversa para resumir.');
        return;
      }

      // Preparar contexto das mensagens
      const contextMessages = messagesToUse.slice(-50).map(m => ({
        id: m.id,
        nome_do_contato: m.nome_do_contato,
        tipo_remetente: m.tipo_remetente,
        message: m.message,
        read_at: m.read_at,
      }));

      console.log(`📊 [AI_RESUMO] Enviando ${contextMessages.length} mensagens para análise`);

      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: {
          provider_id: selectedProvider,
          report_type: 'conversation_summary',
          action_type: 'conversation_summary',
          data: {
            conversation_id: conversationId,
            channel_id: channelId,
            contact_name: contactName,
            messages: contextMessages,
          }
        }
      });

      console.log('📊 [AI_RESUMO] Resposta da edge function:', { data, error });

      if (error) {
        console.error('❌ [AI_RESUMO] Erro na edge function:', error);
        setInternalError('Erro ao gerar resumo: ' + (error.message || 'Erro desconhecido'));
        return;
      }

      if (data && data.success) {
        const generatedSummary = data.report || data.content || 'Resumo não disponível';
        setInternalSummary(generatedSummary);
        toast({
          title: "Resumo gerado",
          description: "Resumo da conversa gerado com sucesso",
        });
      } else {
        setInternalError(data?.error || 'Erro desconhecido na geração do resumo');
      }

    } catch (error) {
      console.error('❌ [AI_RESUMO] Erro geral:', error);
      setInternalError('Erro ao gerar resumo. Tente novamente.');
    } finally {
      setInternalLoading(false);
    }
  };

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    toast({
      title: "Copiado",
      description: "Resumo copiado para a área de transferência",
    });
    if (onCopy) onCopy();
  };

  const handleDownload = () => {
    if (!summary) return;
    const blob = new Blob([summary], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "resumo-conversa.txt";
    link.click();
    if (onDownload) onDownload();
  };

  const handleRefresh = () => {
    setInternalSummary('');
    setInternalError('');
    if (providers.length > 0) {
      generateSummary();
    } else {
      loadProvidersAndGenerateSummary();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) onClose(); }}>
      <DialogContent className={cn(
        "sm:max-w-lg p-0 overflow-hidden rounded-xl shadow-xl transition-all duration-300",
        isDarkMode ? "bg-[#18181b] border-[#3f3f46] text-white" : "bg-white border-gray-200"
      )}>
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Brain size={20} className="text-[#b5103c]" />
            <DialogTitle className={cn("text-lg font-semibold", isDarkMode ? "text-white" : "text-gray-900")}>
              Resumo da Conversa
            </DialogTitle>
          </div>
          <div className="flex items-center gap-2">
            {conversationId && channelId && (
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className={cn(
                  "rounded-full p-1 transition hover:bg-zinc-200 dark:hover:bg-zinc-700",
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                )}
                aria-label="Atualizar resumo"
              >
                <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
              </button>
            )}
            <button
              className={cn(
                "rounded-full p-1 transition hover:bg-zinc-200 dark:hover:bg-zinc-700",
                isDarkMode ? "text-gray-400" : "text-gray-500"
              )}
              aria-label="Fechar"
              onClick={onClose}
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <div className={cn(
          "p-6 pb-4 max-h-[60vh] min-h-[120px] overflow-y-auto text-base transition-all",
          isDarkMode ? "text-gray-200" : "text-gray-800"
        )}>
          {isLoading ? (
            <div className="flex items-center justify-center h-20 text-xl animate-pulse">Gerando resumo...</div>
          ) : error ? (
            <div className="text-red-500 font-semibold">{error}</div>
          ) : summary ? (
            <pre className="max-w-full whitespace-pre-wrap break-words">{summary}</pre>
          ) : (
            <div className="text-gray-400 italic">Resumo não disponível.</div>
          )}
        </div>
        <div className="flex justify-end gap-2 px-6 pb-4">
          <Button
            variant="ghost"
            size="sm"
            className={isDarkMode ? "text-white hover:bg-zinc-700" : "text-gray-900"}
            onClick={handleCopy}
            disabled={!summary}
          >
            Copiar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={!summary}
            className={isDarkMode ? "border-[#b5103c] text-white" : "border-[#b5103c] text-[#b5103c]"}
          >
            Baixar .txt
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={onClose}
            className="bg-[#b5103c] text-white"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
