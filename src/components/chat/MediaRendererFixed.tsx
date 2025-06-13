import React, { useState } from 'react';
import { MediaProcessor } from '@/services/MediaProcessor';
import { AudioPlayerFixed } from './AudioPlayerFixed';
import { MediaOverlay } from './MediaOverlay';
import { AlertCircle, Download, Play, Pause, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MediaResult {
  isProcessed: boolean;
  url?: string;
  type?: string;
  mimeType?: string;
  size?: string;
  error?: string;
}

interface MediaRendererFixedProps {
  content: string;
  messageType?: string;
  messageId: string;
  isDarkMode?: boolean;
  fileName?: string;
  balloonColor?: 'sent' | 'received'; // Nova prop para determinar a cor do balão
}
export const MediaRendererFixed: React.FC<MediaRendererFixedProps> = ({
  content,
  messageType,
  messageId,
  isDarkMode = false,
  fileName,
  balloonColor = 'received'
}) => {
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Processar mídia usando o MediaProcessor melhorado
  const processedResult = React.useMemo(() => {
    console.log('🎯 [MEDIA_RENDERER_FIXED] Processing media:', { 
      messageId, 
      messageType, 
      contentLength: content?.length || 0,
      startsWithData: content?.startsWith('data:')
    });
    
    let result: MediaResult;
    
    // Usar métodos específicos baseado no tipo
    switch (messageType?.toLowerCase()) {
      case 'audio':
      case 'audiomessage':
      case 'ptt':
      case 'voice':
        result = MediaProcessor.processAudio(content);
        break;
      case 'video':
      case 'videomessage':
        result = MediaProcessor.processVideo(content);
        break;
      case 'image':
      case 'imagemessage':
        result = MediaProcessor.processImage(content);
        break;
      default:
        result = MediaProcessor.process(content, messageType);
    }
    
    console.log('🎯 [MEDIA_RENDERER_FIXED] Media processing result:', {
      messageId,
      type: result.type,
      isProcessed: result.isProcessed,
      mimeType: result.mimeType,
      size: result.size,
      error: result.error
    });
    
    return result;
  }, [content, messageType, messageId]);

  // Estado de erro
  const renderError = () => (
    <div className={cn(
      "flex flex-col items-center justify-center min-h-[80px] p-4 rounded-lg border max-w-[300px]",
      isDarkMode ? "bg-destructive/20 border-destructive/50" : "bg-red-50 border-red-200"
    )}>
      <AlertCircle className="text-destructive mb-2" size={24} />
      <div className={cn(
        "text-sm font-medium text-center",
        isDarkMode ? "text-destructive-foreground" : "text-red-600"
      )}>
        Erro ao carregar mídia
      </div>
      <div className={cn(
        "text-xs text-center mt-1",
        isDarkMode ? "text-destructive-foreground/80" : "text-red-500"
      )}>
        {processedResult.error || 'Formato não suportado'}
      </div>
      {/* Debug info em desenvolvimento */}
      {import.meta.env.MODE === 'development' && (
        <div className="text-xs text-muted-foreground mt-2 max-w-full break-all">
          Type: {messageType} | Length: {content?.length || 0}
        </div>
      )}
    </div>
  );

  // Verificar se há erro
  if (!processedResult.isProcessed || !processedResult.url) {
    return renderError();
  }

  const { url, mimeType, type, size } = processedResult;

  // Renderizar áudio
  if (type === 'audio') {
    return (
      <div className="max-w-[300px]">
        <AudioPlayerFixed
          audioContent={content}
          isDarkMode={isDarkMode}
          messageId={messageId}
          balloonColor={balloonColor} // Usar a prop balloonColor
        />
      </div>
    );
  }

  // Renderizar imagem
  if (type === 'image') {
    return (
      <>
        <div className="relative max-w-[300px]">
          <img 
            src={url} 
            alt="Imagem enviada" 
            className="chat-message-media cursor-pointer max-w-full max-h-[400px] object-contain rounded-lg"
            onClick={() => setIsOverlayOpen(true)}
            onError={(e) => {
              console.error('❌ [IMAGE] Erro ao carregar:', messageId, e);
            }}
            onLoad={() => {
              console.log('✅ [IMAGE] Carregada:', messageId);
            }}
          />
          {size && (
            <div className={cn(
              "absolute bottom-2 right-2 px-2 py-1 rounded text-xs",
              "bg-background/50 text-foreground backdrop-blur-sm"
            )}>
              {size}
            </div>
          )}
        </div>
        
        <MediaOverlay
          isOpen={isOverlayOpen}
          onClose={() => setIsOverlayOpen(false)}
          mediaUrl={url}
          mediaType="image"
          isDarkMode={isDarkMode}
        />
      </>
    );
  }

  // Renderizar sticker
  if (type === 'sticker') {
    return (
      <div className="relative max-w-[200px]">
        <img 
          src={url} 
          alt="Sticker" 
          className="chat-message-media cursor-pointer max-w-full max-h-[200px] object-contain"
          onClick={() => setIsOverlayOpen(true)}
          onError={(e) => {
            console.error('❌ [STICKER] Erro ao carregar:', messageId, e);
          }}
          onLoad={() => {
            console.log('✅ [STICKER] Carregado:', messageId);
          }}
        />
        
        <MediaOverlay
          isOpen={isOverlayOpen}
          onClose={() => setIsOverlayOpen(false)}
          mediaUrl={url}
          mediaType="image"
          isDarkMode={isDarkMode}
        />
      </div>
    );
  }

  // Renderizar vídeo
  if (type === 'video') {
    return (
      <>
        <div className="relative max-w-[300px]">
          <video 
            controls 
            preload="metadata"
            className="chat-message-media max-w-full max-h-[400px] rounded-lg"
            onError={(e) => {
              console.error('❌ [VIDEO] Erro ao carregar:', messageId, e);
            }}
            onLoadedMetadata={() => {
              console.log('✅ [VIDEO] Metadata carregada:', messageId);
            }}
          >
            <source src={url} type={mimeType} />
            Seu navegador não suporta vídeo.
          </video>
          
          {size && (
            <div className={cn(
              "absolute bottom-2 right-2 px-2 py-1 rounded text-xs",
              "bg-background/50 text-foreground backdrop-blur-sm"
            )}>
              {size}
            </div>
          )}
        </div>
        
        <MediaOverlay
          isOpen={isOverlayOpen}
          onClose={() => setIsOverlayOpen(false)}
          mediaUrl={url}
          mediaType="video"
          isDarkMode={isDarkMode}
        />
      </>
    );
  }

  // Documentos e outros tipos
  return (
    <div 
      className={cn(
        "flex items-center p-3 rounded-lg border cursor-pointer max-w-[300px] transition-colors",
        isDarkMode ? "bg-card hover:bg-card/80 border-border" : "bg-gray-100 hover:bg-gray-200 border-gray-300"
      )}
      onClick={() => window.open(url, '_blank')}
    >
      <div className="text-2xl mr-3">
        {MediaProcessor.getMediaIcon(type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className={cn(
          "font-medium text-sm truncate",
          isDarkMode ? "text-foreground" : "text-gray-900"
        )}>
          {fileName || 'Documento'}
        </div>
        <div className={cn(
          "text-xs",
          isDarkMode ? "text-muted-foreground" : "text-gray-500"
        )}>
          {size || 'Clique para abrir'}
        </div>
        {mimeType && (
          <div className={cn(
            "text-xs mt-1",
            isDarkMode ? "text-muted-foreground/80" : "text-gray-400"
          )}>
            {mimeType}
          </div>
        )}
      </div>
      <Download size={16} className="text-muted-foreground" />
    </div>
  );
};

