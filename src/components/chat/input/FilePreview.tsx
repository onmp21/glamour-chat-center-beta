
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { X, FileText, Music, Video, Image } from 'lucide-react';
import { FileData } from '@/types/messageTypes';
import { FileService } from '@/services/FileService';

interface FilePreviewProps {
  fileData: FileData;
  isDarkMode: boolean;
  onRemove: () => void;
}

export const FilePreview: React.FC<FilePreviewProps> = ({
  fileData,
  isDarkMode,
  onRemove
}) => {
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image size={20} />;
    if (mimeType.startsWith('audio/')) return <Music size={20} />;
    if (mimeType.startsWith('video/')) return <Video size={20} />;
    return <FileText size={20} />;
  };

  const isImage = fileData.mimeType.startsWith('image/');

  return (
    <div className={cn(
      "flex items-center gap-2 p-2 rounded-lg border",
      isDarkMode ? "bg-zinc-800 border-zinc-700" : "bg-gray-50 border-gray-200"
    )}>
      {isImage ? (
        <img
          src={fileData.base64}
          alt={fileData.fileName}
          className="w-12 h-12 object-cover rounded"
        />
      ) : (
        <div className={cn(
          "w-12 h-12 flex items-center justify-center rounded",
          isDarkMode ? "bg-zinc-700 text-zinc-300" : "bg-gray-200 text-gray-600"
        )}>
          {getFileIcon(fileData.mimeType)}
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium truncate",
          isDarkMode ? "text-zinc-200" : "text-gray-800"
        )}>
          {fileData.fileName}
        </p>
        <p className={cn(
          "text-xs",
          isDarkMode ? "text-zinc-400" : "text-gray-500"
        )}>
          {FileService.formatFileSize(fileData.size)}
        </p>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
      >
        <X size={16} />
      </Button>
    </div>
  );
};
