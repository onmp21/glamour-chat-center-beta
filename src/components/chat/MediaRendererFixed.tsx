import React, { useState } from 'react';
import { MediaProcessorUnified } from '@/utils/MediaProcessorUnified';
import { AudioPlayerFixed } from './AudioPlayerFixed';
import { MediaOverlay } from './MediaOverlay';
import { AlertCircle, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MediaRendererFixedProps {
  content: string;
  messageType: string;
  messageId: string;
  isDarkMode?: boolean;
  fileName?: string;
}

export const MediaRendererFixed: React.FC<MediaRendererFixedProps> = ({
  content,
  messageType,
  messageId,
  isDarkMode = false,
  fileName
}) => {
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  // Processar mídia usando método específico para WhatsApp
  const processedResult = React.useMemo(() => {
    console.log('🎯 [MEDIA_RENDERER_FIXED] Processing WhatsApp media:', { 
      messageId, 
      messageType, 
      contentLength: content?.length || 0,
      startsWithData: content?.startsWith('data:')
    });
    
    // Usar método específico para mídias do WhatsApp
    const result = MediaProcessorUnified.processWhatsAppMedia(content, messageType);
    
    console.log('🎯 [MEDIA_RENDERER_FIXED] WhatsApp media result:', {
      messageId,
      success: result.success,
      mimeType: result.mimeType,
      error: result.error
    });
    
    return result;
  }, [content, messageType, messageId]);

  // Estado de erro
  const renderError = () => (
    <div className={cn(
      "flex flex-col items-center justify-center min-h-[80px] p-4 rounded-lg border max-w-[300px]",
      isDarkMode ? "bg-red-900/20 border-red-800" : "bg-red-50 border-red-200"
    )}>
      <AlertCircle className="text-red-500 mb-2" size={24} />
      <div className={cn(
        "text-sm font-medium text-center",
        isDarkMode ? "text-red-300" : "text-red-600"
      )}>
        Erro ao carregar mídia
      </div>
      <div className={cn(
        "text-xs text-center mt-1",
        isDarkMode ? "text-red-400" : "text-red-500"
      )}>
        {processedResult.error || 'Formato não suportado'}
      </div>
      {/* Debug info em desenvolvimento */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 mt-2 max-w-full break-all">
          Type: {messageType} | Length: {content?.length || 0}
        </div>
      )}
    </div>
  );

  // Verificar se há erro
  if (!processedResult.success || !processedResult.dataUrl) {
    return renderError();
  }

  const { dataUrl, mimeType } = processedResult;

  // Renderizar baseado no tipo de mídia
  if (mimeType?.startsWith('audio/')) {
    return (
      <AudioPlayerFixed
        audioContent={content}
        isDarkMode={isDarkMode}
        messageId={messageId}
      />
    );
  }

  if (mimeType?.startsWith('image/')) {
    return (
      <>
        <img 
          src={dataUrl} 
          alt="Imagem enviada" 
          className="chat-message-media cursor-pointer max-w-[300px] max-h-[400px] object-contain rounded-lg"
          onClick={() => setIsOverlayOpen(true)}
          onError={(e) => {
            console.error('❌ [IMAGE] Erro ao carregar:', messageId, e);
          }}
          onLoad={() => {
            console.log('✅ [IMAGE] Carregada:', messageId);
          }}
        />
        
        <MediaOverlay
          isOpen={isOverlayOpen}
          onClose={() => setIsOverlayOpen(false)}
          mediaUrl={dataUrl}
          mediaType="image"
          isDarkMode={isDarkMode}
        />
      </>
    );
  }

  if (mimeType?.startsWith('video/')) {
    return (
      <>
        <video 
          controls 
          preload="metadata"
          className="chat-message-media max-w-[300px] max-h-[400px] rounded-lg"
          onError={(e) => {
            console.error('❌ [VIDEO] Erro ao carregar:', messageId, e);
          }}
          onLoadedMetadata={() => {
            console.log('✅ [VIDEO] Metadata carregada:', messageId);
          }}
        >
          <source src={dataUrl} />
          Seu navegador não suporta vídeo.
        </video>
        
        <MediaOverlay
          isOpen={isOverlayOpen}
          onClose={() => setIsOverlayOpen(false)}
          mediaUrl={dataUrl}
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
        isDarkMode ? "bg-gray-800 hover:bg-gray-700 border-gray-600" : "bg-gray-100 hover:bg-gray-200 border-gray-300"
      )}
      onClick={() => window.open(dataUrl, '_blank')}
    >
      <div className="text-2xl mr-3">📄</div>
      <div className="flex-1 min-w-0">
        <div className={cn(
          "font-medium text-sm truncate",
          isDarkMode ? "text-gray-100" : "text-gray-900"
        )}>
          {fileName || 'Documento'}
        </div>
        <div className={cn(
          "text-xs",
          isDarkMode ? "text-gray-400" : "text-gray-500"
        )}>
          {processedResult.size || 'Clique para abrir'}
        </div>
      </div>
      <Download size={16} className="text-gray-400" />
    </div>
  );
};

