
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Download, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WhatsAppAudioPlayer } from './WhatsAppAudioPlayer';
import { MediaOverlay } from './MediaOverlay';
import { isValidMediaUrl, getMediaTypeFromUrl, getMediaTypeFromMessageType, getMimeTypeFromUrl } from '@/utils/mediaUtils';

interface MediaRendererFixedProps {
  content: string;
  messageType?: string;
  messageId: string;
  isDarkMode?: boolean;
  fileName?: string;
  className?: string;
  balloonColor?: 'sent' | 'received';
}

export const MediaRendererFixed: React.FC<MediaRendererFixedProps> = ({
  content,
  messageType = 'text',
  messageId,
  isDarkMode = false,
  fileName,
  className,
  balloonColor = 'received'
}) => {
  const [loadError, setLoadError] = useState(false);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  console.log('🎨 [MEDIA_RENDERER_FIXED] Rendering:', {
    messageId,
    messageType,
    contentType: typeof content,
    contentLength: content?.length || 0,
    isValidUrl: isValidMediaUrl(content),
    balloonColor
  });

  // Determinar o tipo de mídia baseado no messageType primeiro
  const mediaTypeFromMessage = getMediaTypeFromMessageType(messageType);
  const mediaTypeFromUrl = getMediaTypeFromUrl(content);
  
  // Usar o tipo do messageType se disponível, senão usar o tipo da URL
  const finalMediaType = mediaTypeFromMessage !== 'text' && mediaTypeFromMessage !== 'unknown' 
    ? mediaTypeFromMessage 
    : mediaTypeFromUrl;

  // Verificar se deve renderizar como mídia
  const shouldRenderAsMedia = 
    (messageType && messageType !== 'text' && messageType !== 'conversation') ||
    (isValidMediaUrl(content) && finalMediaType !== 'unknown');

  if (!shouldRenderAsMedia) {
    console.log('❌ [MEDIA_RENDERER_FIXED] Not a media message:', { messageType, content: content.substring(0, 50) });
    return null; // Não renderizar nada para texto simples
  }

  // Verificar se é uma URL malformada (contém placeholders)
  const isMalformedUrl = content && (content.includes('{{ $json.Key }}') || content.includes('{{') || content.includes('}}'));
  
  // Verificar se é uma URL válida
  if (!isValidMediaUrl(content) || isMalformedUrl) {
    console.log('❌ [MEDIA_RENDERER_FIXED] Invalid or malformed media URL:', content);
    return (
      <div className={cn(
        "p-3 border rounded-lg text-center",
        isDarkMode ? "bg-gray-800 border-gray-600 text-gray-300" : "bg-gray-100 border-gray-300 text-gray-600"
      )}>
        <AlertCircle className="h-8 w-8 mx-auto mb-2 text-orange-500" />
        <p className="text-sm">Mídia indisponível</p>
        <p className="text-xs opacity-70">
          {isMalformedUrl ? 'URL malformada detectada' : `Tipo: ${messageType}`}
        </p>
      </div>
    );
  }

  const mimeType = getMimeTypeFromUrl(content);

  // Função para download
  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = content;
      link.download = fileName || `media_${messageId}`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('❌ [MEDIA_RENDERER_FIXED] Download error:', error);
    }
  };

  // Função para abrir em tela cheia
  const handleMediaClick = () => {
    if (finalMediaType === 'image' || finalMediaType === 'video') {
      setIsOverlayOpen(true);
    }
  };

  // Renderizar baseado no tipo de mídia
  const renderMediaContent = () => {
    if (loadError) {
      return (
        <div className={cn(
          "p-4 border rounded-lg text-center",
          isDarkMode ? "bg-gray-800 border-gray-600 text-gray-300" : "bg-gray-100 border-gray-300 text-gray-600"
        )}>
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
          <p className="text-sm">Erro ao carregar mídia</p>
          <p className="text-xs opacity-70">Tipo: {messageType}</p>
          <Button
            onClick={handleDownload}
            variant="outline"
            size="sm"
            className="mt-2"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      );
    }

    switch (finalMediaType) {
      case 'image':
        return (
          <>
            <div className="relative group cursor-pointer" onClick={handleMediaClick}>
              <img
                src={content}
                alt={fileName || 'Imagem'}
                className="max-w-full max-h-64 rounded-lg object-contain hover:opacity-90 transition-opacity"
                onError={() => {
                  console.error('❌ [MEDIA_RENDERER_FIXED] Image load error:', content);
                  setLoadError(true);
                }}
                loading="lazy"
              />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload();
                  }}
                  variant="secondary"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <MediaOverlay
              isOpen={isOverlayOpen}
              onClose={() => setIsOverlayOpen(false)}
              mediaUrl={content}
              mediaType="image"
              isDarkMode={isDarkMode}
            />
          </>
        );

      case 'video':
        return (
          <>
            <div className="relative group cursor-pointer" onClick={handleMediaClick}>
              <video
                src={content}
                className="max-w-full max-h-64 rounded-lg hover:opacity-90 transition-opacity"
                onError={() => {
                  console.error('❌ [MEDIA_RENDERER_FIXED] Video load error:', content);
                  setLoadError(true);
                }}
                preload="metadata"
                controls={false}
              >
                Seu navegador não suporta reprodução de vídeo.
              </video>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload();
                  }}
                  variant="secondary"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <MediaOverlay
              isOpen={isOverlayOpen}
              onClose={() => setIsOverlayOpen(false)}
              mediaUrl={content}
              mediaType="video"
              isDarkMode={isDarkMode}
            />
          </>
        );

      case 'audio':
        return (
          <WhatsAppAudioPlayer
            audioUrl={content}
            isDarkMode={isDarkMode}
            balloonColor={balloonColor}
            onError={() => {
              console.error('❌ [MEDIA_RENDERER_FIXED] Audio load error:', content);
              setLoadError(true);
            }}
            onDownload={handleDownload}
          />
        );

      default:
        return (
          <div className={cn(
            "p-4 border rounded-lg",
            isDarkMode ? "bg-gray-800 border-gray-600 text-gray-300" : "bg-gray-100 border-gray-300 text-gray-600"
          )}>
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-blue-500" />
              <div className="flex-1">
                <p className="font-medium">{fileName || 'Arquivo'}</p>
                <p className="text-sm opacity-70">{mimeType}</p>
                <p className="text-xs opacity-50">Tipo: {messageType}</p>
              </div>
              <Button
                onClick={handleDownload}
                variant="outline"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={cn("media-renderer", className)}>
      {renderMediaContent()}
    </div>
  );
};
