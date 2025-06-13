import React from 'react';
import { File, Image, Video, Mic, X } from 'lucide-react';
import ProgressBar from './ProgressBar';

interface MediaUploadIndicatorProps {
  mediaType: 'image' | 'video' | 'audio' | 'document';
  fileName: string;
  progress: number;
  size?: string;
  isCompressing?: boolean;
  compressionRatio?: number;
  onCancel?: () => void;
  className?: string;
}

export const MediaUploadIndicator: React.FC<MediaUploadIndicatorProps> = ({
  mediaType,
  fileName,
  progress,
  size,
  isCompressing = false,
  compressionRatio,
  onCancel,
  className = '',
}) => {
  // Ícone com base no tipo de mídia
  const getIcon = () => {
    switch (mediaType) {
      case 'image':
        return <Image className="h-5 w-5 text-blue-500" />;
      case 'video':
        return <Video className="h-5 w-5 text-purple-500" />;
      case 'audio':
        return <Mic className="h-5 w-5 text-green-500" />;
      case 'document':
        return <File className="h-5 w-5 text-amber-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  // Truncar nome do arquivo se for muito longo
  const truncateFileName = (name: string, maxLength: number = 20) => {
    if (name.length <= maxLength) return name;
    
    const extension = name.split('.').pop() || '';
    const nameWithoutExt = name.substring(0, name.length - extension.length - 1);
    
    return `${nameWithoutExt.substring(0, maxLength - extension.length - 3)}...${extension ? `.${extension}` : ''}`;
  };

  return (
    <div className={`flex flex-col p-3 border rounded-md bg-gray-50 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {getIcon()}
          <div>
            <p className="text-sm font-medium text-gray-700">{truncateFileName(fileName)}</p>
            <div className="flex items-center gap-2">
              {size && <span className="text-xs text-gray-500">{size}</span>}
              {isCompressing && (
                <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                  Comprimindo...
                </span>
              )}
              {compressionRatio && compressionRatio < 1 && (
                <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                  {Math.round((1 - compressionRatio) * 100)}% reduzido
                </span>
              )}
            </div>
          </div>
        </div>
        
        {onCancel && (
          <button 
            onClick={onCancel}
            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
            aria-label="Cancelar upload"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        )}
      </div>
      
      <ProgressBar 
        progress={progress} 
        showPercentage={false}
        height={6}
        color={
          mediaType === 'image' ? 'bg-blue-500' :
          mediaType === 'video' ? 'bg-purple-500' :
          mediaType === 'audio' ? 'bg-green-500' :
          'bg-amber-500'
        }
      />
    </div>
  );
};

export default MediaUploadIndicator;

