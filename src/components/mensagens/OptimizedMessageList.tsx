// Componente React otimizado para exibir mensagens com lazy loading de mídias
// Arquivo: src/components/mensagens/OptimizedMessageList.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  media_url?: string; // URL da mídia no Storage
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const MESSAGES_PER_PAGE = 50;

  // Carregar mensagens com paginação (SEM media_base64)
  const loadMessages = useCallback(async (pageNum: number = 0) => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from(`messages_${channel}`)
        .select(`
          id,
          session_id,
          message,
          sender,
          timestamp,
          message_type,
          phone_number,
          channel,
          status,
          media_url,
          created_at,
          updated_at
        `) // Excluir explicitamente media_base64
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true })
        .range(pageNum * MESSAGES_PER_PAGE, (pageNum + 1) * MESSAGES_PER_PAGE - 1);

      if (error) {
        console.error('❌ Erro ao carregar mensagens:', error);
        return;
      }

      if (pageNum === 0) {
        setMessages(data || []);
      } else {
        setMessages(prev => [...prev, ...(data || [])]);
      }

      setHasMore((data || []).length === MESSAGES_PER_PAGE);

    } catch (error) {
      console.error('❌ Erro ao carregar mensagens:', error);
    } finally {
      setLoading(false);
    }
  }, [channel, sessionId]);

  // Carregar mensagens iniciais
  useEffect(() => {
    loadMessages(0);
  }, [loadMessages]);

  // Carregar mais mensagens
  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadMessages(nextPage);
    }
  };

  // Componente para exibir mídia com lazy loading
  const MediaComponent: React.FC<{ message: Message }> = ({ message }) => {
    const [mediaLoaded, setMediaLoaded] = useState(false);
    const [mediaError, setMediaError] = useState(false);

    if (!message.media_url) return null;

    const handleMediaLoad = () => setMediaLoaded(true);
    const handleMediaError = () => setMediaError(true);

    if (mediaError) {
      return (
        <div className="media-error">
          ❌ Erro ao carregar mídia
        </div>
      );
    }

    switch (message.message_type) {
      case 'image':
        return (
          <div className="media-container">
            {!mediaLoaded && <div className="media-loading">📷 Carregando imagem...</div>}
            <img
              src={message.media_url}
              alt="Imagem da mensagem"
              onLoad={handleMediaLoad}
              onError={handleMediaError}
              style={{ display: mediaLoaded ? 'block' : 'none' }}
              className="message-image"
            />
          </div>
        );

      case 'video':
        return (
          <div className="media-container">
            {!mediaLoaded && <div className="media-loading">🎥 Carregando vídeo...</div>}
            <video
              src={message.media_url}
              controls
              onLoadedData={handleMediaLoad}
              onError={handleMediaError}
              style={{ display: mediaLoaded ? 'block' : 'none' }}
              className="message-video"
            />
          </div>
        );

      case 'audio':
        return (
          <div className="media-container">
            {!mediaLoaded && <div className="media-loading">🎵 Carregando áudio...</div>}
            <audio
              src={message.media_url}
              controls
              onLoadedData={handleMediaLoad}
              onError={handleMediaError}
              style={{ display: mediaLoaded ? 'block' : 'none' }}
              className="message-audio"
            />
          </div>
        );

      case 'document':
        return (
          <div className="media-container">
            <a
              href={message.media_url}
              target="_blank"
              rel="noopener noreferrer"
              className="message-document"
            >
              📄 Baixar documento
            </a>
          </div>
        );

      default:
        return null;
    }
  };

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
              <MediaComponent message={message} />
            </div>
            <div className="message-timestamp">
              {new Date(message.timestamp).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loading}
          className="load-more-button"
        >
          {loading ? 'Carregando...' : 'Carregar mais mensagens'}
        </button>
      )}

      {loading && page === 0 && (
        <div className="loading-initial">
          Carregando mensagens...
        </div>
      )}
    </div>
  );
};

export default OptimizedMessageList;

