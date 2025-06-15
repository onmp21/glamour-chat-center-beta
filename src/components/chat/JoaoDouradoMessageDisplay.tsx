
import React from "react";
import { cn } from "@/lib/utils";
import { MediaMessageRenderer } from "./MediaMessageRenderer";

// Adequa props igual ao YelenaMessageDisplay
interface JoaoDouradoMessageDisplayProps {
  message: {
    id: string;
    content: string;
    timestamp: string;
    sender: string;
    tipo_remetente?: string;
    isOwn?: boolean;
    agentName?: string;
    Nome_do_contato?: string;
    nome_do_contato?: string;
    mensagemtype?: string;
  };
  isDarkMode: boolean;
  channelName?: string;
  userName?: string;
}

export const JoaoDouradoMessageDisplay: React.FC<JoaoDouradoMessageDisplayProps> = ({
  message,
  isDarkMode,
  channelName = "João Dourado",
  userName
}) => {
  const isAgent =
    message.tipo_remetente === "USUARIO_INTERNO" ||
    message.tipo_remetente === "Yelena-ai" ||
    message.sender === "agent" || 
    message.isOwn;

  const displayName = isAgent
    ? (message.agentName || "Agente")
    : (message.Nome_do_contato || message.nome_do_contato || message.sender || "Cliente");

  const renderMessageContent = () => {
    const isMediaMessage = message.mensagemtype && message.mensagemtype !== "text";
    if (isMediaMessage) {
      return (
        <MediaMessageRenderer
          content={message.content}
          messageType={message.mensagemtype}
          messageId={message.id}
          isDarkMode={isDarkMode}
          balloonColor={isAgent ? "sent" : "received"}
        />
      );
    }
    return <p className="whitespace-pre-wrap break-words">{message.content}</p>;
  };

  return (
    <div className={cn(
      "chat-message-whatsapp message-animate",
      isAgent ? "sent" : "received"
    )}>
      <div className="chat-message-header">
        <div className="channel-name">
          📱 {channelName}
        </div>
        {!isAgent && (
          <div className="chat-message-sender">
            👤 {displayName}
          </div>
        )}
        {isAgent && userName && (
          <div className="user-indicator">
            ✏️ Enviado por: {userName}
          </div>
        )}
      </div>
      <div className="chat-message-content">
        {renderMessageContent()}
      </div>
      <div className="chat-message-timestamp">
        {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        })}
        {isAgent && (
          <span className="checkmark">✓✓</span>
        )}
      </div>
    </div>
  );
};
