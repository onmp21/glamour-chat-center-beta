
import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useSimpleMessages } from '@/hooks/useSimpleMessages';
import { MediaRendererFixed } from './MediaRendererFixed';

interface SimpleMessageHistoryProps {
  channelId: string;
  conversationId: string;
  isDarkMode: boolean;
  className?: string;
}

const truncateName = (name: string = ''): string => {
  const parts = (name || '').split(' ').filter(Boolean);
  return parts.slice(0, 2).join(' ') || name || 'Cliente';
};

export const SimpleMessageHistory: React.FC<SimpleMessageHistoryProps> = ({
  channelId,
  conversationId,
  isDarkMode,
  className
}) => {
  const { messages, loading, error } = useSimpleMessages(channelId, conversationId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 0 && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // CORRIGIDO: Função expandida para detectar agentes vs clientes
  const isAgentMessage = (message: any): boolean => {
    // Lista expandida de tipos de agente (interno)
    const agentTypes = [
      'USUARIO_INTERNO',
      'Yelena-ai',
      'Yelena AI',
      'Andressa-ai',
      'Andressa AI',
      'AGENTE',
      'AGENT',
      'INTERNAL_USER',
      'AI_ASSISTANT',
      'Canarana',
      'Souto Soares',
      'João Dourado',
      'America Dourada',
      'Gerente Lojas',
      'Gerente Externo',
      'GerenteLojas',
      'GerenteExterno'
    ];
    
    // PRIORIDADE 1: Verificar tipo_remetente
    if (message.tipo_remetente && agentTypes.includes(message.tipo_remetente)) {
      console.log(`🤖 [AGENT_CHECK] Mensagem de agente detectada via tipo_remetente:`, message.tipo_remetente);
      return true;
    }
    
    // PRIORIDADE 2: Verificar se é uma mensagem enviada pela interface (sem nome de contato válido)
    if (!message.nome_do_contato || message.nome_do_contato ===  'Cliente' || message.nome_do_contato.trim() === '') {
      console.log(`✏️ [AGENT_CHECK] Mensagem de agente detectada via interface interna (sem nome contato)`);
      return true;
    }
    
    // PRIORIDADE 3: Verificar por nomes específicos de agente no nome do contato
    if (message.nome_do_contato) {
      const agentNames = [
        'Yelena', 'yelena', 'YELENA',
        'Andressa', 'andressa', 'ANDRESSA', 
        'Gerente', 'gerente', 'GERENTE',
        'Admin', 'admin', 'ADMIN',
        'Sistema', 'sistema', 'SISTEMA'
      ];
      
      for (const agentName of agentNames) {
        if (message.nome_do_contato.includes(agentName)) {
          console.log(`👤 [AGENT_CHECK] Mensagem de agente detectada via nome:`, message.nome_do_contato);
          return true;
        }
      }
    }
    
    return false;
  };

  const isMediaMessage = (message: any): boolean => {
    // PRIORIDADE 1: Verificar se mensagem contém "media("
    if (message.message && message.message.includes('media(')) {
      console.log(`📄 [MEDIA_CHECK] Mídia detectada via "media(" na mensagem:`, message.message.substring(0, 50));
      return true;
    }

    // PRIORIDADE 2: media_url (link direto)
    if (message.media_url && message.media_url.trim() !== '') {
      console.log(`🔗 [MEDIA_CHECK] Mídia detectada via media_url:`, message.media_url.substring(0, 50));
      return true;
    }

    // PRIORIDADE 3: tipo de mensagem não texto
    if (message.mensagemtype && 
        !['text', 'conversation'].includes(message.mensagemtype)) {
      console.log(`🎭 [MEDIA_CHECK] Mídia detectada via mensagemtype:`, message.mensagemtype);
      return true;
    }

    return false;
  };

  const getMediaContent = (message: any): string => {
    // PRIORIDADE: media_url (mais confiável e já completada)
    if (message.media_url && message.media_url.trim() !== '') {
      console.log(`🔗 [MEDIA_CONTENT] Usando media_url:`, message.media_url.substring(0, 50));
      return message.media_url;
    }

    // FALLBACK: message se parecer mídia
    if (message.message && 
        (message.message.startsWith('data:') || 
         message.message.startsWith('http'))) {
      console.log(`📄 [MEDIA_CONTENT] Usando message como fallback:`, message.message.substring(0, 50));
      return message.message;
    }

    console.log(`❌ [MEDIA_CONTENT] Nenhum conteúdo de mídia encontrado`);
    return '';
  };

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center h-full", className)}>
        <div className="text-center space-y-2">
          <div className={cn(
            "animate-spin rounded-full h-6 w-6 border-b-2 mx-auto",
            isDarkMode ? "border-white" : "border-gray-900"
          )}></div>
          <p className={cn("text-sm", isDarkMode ? "text-gray-400" : "text-gray-600")}>
            Carregando mensagens...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("flex items-center justify-center h-full", className)}>
        <div className="text-center text-red-500">
          <p>Erro ao carregar mensagens</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-full", className)}>
        <div className={cn("text-center", isDarkMode ? "text-gray-400" : "text-gray-500")}>
          <div className="text-4xl mb-4">💬</div>
          <p>Nenhuma mensagem encontrada</p>
          <p className="text-sm mt-1">Esta conversa ainda não possui mensagens</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex-1 overflow-y-auto p-4", className)}>
      <div className="space-y-4">
        {messages.map((message, index) => {
          const isAgent = isAgentMessage(message); // USAR FUNÇÃO CORRIGIDA
          const contactName = message.nome_do_contato || 'Cliente';
          const isMedia = isMediaMessage(message);

          const hora = new Date(message.read_at).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          });

          const nomeExibido = truncateName(contactName);

          return (
            <div
              key={`${message.id}-${index}`}
              className={cn(
                "flex mb-3",
                isAgent ? "justify-end" : "justify-start" // APLICAR CORREÇÃO CORRETA
              )}
            >
              <div className={cn(
                "max-w-[85%] space-y-1",
                isAgent ? "items-end" : "items-start"
              )}>
                <div className={cn(
                  "px-3 py-2 text-sm shadow-sm rounded-lg",
                  isAgent
                    ? "bg-[#b5103c] text-white" // AGENTE = DIREITA = VERMELHO
                    : isDarkMode
                      ? "bg-[#18181b] text-white border border-zinc-800" // CLIENTE = ESQUERDA = ESCURO
                      : "bg-white text-gray-900 border border-gray-200" // CLIENTE = ESQUERDA = CLARO
                )}>
                  {isMedia ? (
                    <MediaRendererFixed 
                      content={getMediaContent(message)}
                      messageType={message.mensagemtype || 'text'}
                      messageId={message.id?.toString?.() || String(message.id)}
                      fileName={
                        (message.media_url && !message.media_url.startsWith('data:') ? 'Arquivo' 
                          : (message.message && message.message.length < 60 ? message.message : undefined)
                        ) || undefined
                      }
                      isDarkMode={isDarkMode}
                      balloonColor={isAgent ? 'sent' : 'received'} // CORRIGIR balloonColor
                    />
                  ) : (
                    <p className="break-words whitespace-pre-wrap">
                      {message.message}
                    </p>
                  )}
                </div>

                <div className={cn(
                  "flex items-center space-x-2 text-xs px-1",
                  isAgent ? "flex-row-reverse space-x-reverse" : "flex-row",
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                )}>
                  <span>
                    {channelId === "chat" || channelId.includes("yelena") ? "Yelena AI" : 
                     channelId.includes("canarana") ? "Canarana" :
                     channelId.includes("souto") ? "Souto Soares" :
                     channelId.includes("joao") ? "João Dourado" :
                     channelId.includes("america") ? "América Dourada" :
                     channelId.includes("gerente-lojas") ? "Gerente Lojas" :
                     channelId.includes("gerente-externo") ? "Gerente Externo" : "Canal"}
                  </span>
                  <span className="font-medium">
                    {isAgent ? 'Agente' : nomeExibido}
                  </span>
                  <span>
                    {hora}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
