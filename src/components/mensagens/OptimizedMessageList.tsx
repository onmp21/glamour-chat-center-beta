
import React, { useState } from 'react';

interface Message {
  id: number;
  session_id: string;
  message: string;
  sender: string;
  timestamp: string;
  message_type: string;
  phone_number: string;
  channel: string;
  status: string;
  media_url?: string;
  created_at: string;
  updated_at: string;
}

interface OptimizedMessageListProps {
  channel: string;
  sessionId: string;
}

export const OptimizedMessageList: React.FC<OptimizedMessageListProps> = ({
  channel,
  sessionId
}) => {
  const [messages] = useState<Message[]>([]);
  const [loading] = useState(false);

  // Componente simplificado - removendo queries problemáticas do Supabase
  // A funcionalidade real deve ser implementada nos outros componentes de chat

  return (
    <div className="optimized-message-list">
      <div className="messages-container">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.sender === 'user' ? 'sent' : 'received'}`}
          >
            <div className="message-content">
              {message.message && (
                <div className="message-text">{message.message}</div>
              )}
            </div>
            <div className="message-timestamp">
              {new Date(message.timestamp).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {loading && (
        <div className="loading-initial">
          Carregando mensagens...
        </div>
      )}
    </div>
  );
};

export default OptimizedMessageList;
