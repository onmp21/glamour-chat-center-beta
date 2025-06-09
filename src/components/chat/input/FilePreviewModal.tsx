
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, Send, FileText, Image, Music, Video } from 'lucide-react';
import { FileData } from '@/types/messageTypes';

interface FilePreviewModalProps {
  fileData: FileData;
  isDarkMode: boolean;
  onSend: (caption?: string) => void;
  onCancel: () => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  fileData,
  isDarkMode,
  onSend,
  onCancel
}) => {
  const [caption, setCaption] = useState('');

  const getFileIcon = () => {
    if (fileData.mimeType.startsWith('image/')) return <Image size={48} />;
    if (fileData.mimeType.startsWith('video/')) return <Video size={48} />;
    if (fileData.mimeType.startsWith('audio/')) return <Music size={48} />;
    return <FileText size={48} />;
  };

  const getFilePreview = () => {
    if (fileData.mimeType.startsWith('image/')) {
      return (
        <img
          src={fileData.base64}
          alt="Preview"
          className="max-w-full max-h-64 object-contain rounded-lg"
        />
      );
    }
    
    if (fileData.mimeType.startsWith('video/')) {
      return (
        <video
          src={fileData.base64}
          className="max-w-full max-h-64 rounded-lg"
          controls
        />
      );
    }
    
    if (fileData.mimeType.startsWith('audio/')) {
      return (
        <audio
          src={fileData.base64}
          className="w-full"
          controls
        />
      );
    }

    return (
      <div className={cn(
        "flex flex-col items-center justify-center p-8 rounded-lg border-2 border-dashed",
        isDarkMode ? "border-zinc-600 bg-zinc-800" : "border-gray-300 bg-gray-50"
      )}>
        <div className={cn(
          "mb-4",
          isDarkMode ? "text-zinc-400" : "text-gray-500"
        )}>
          {getFileIcon()}
        </div>
        <p className={cn(
          "text-sm font-medium",
          isDarkMode ? "text-zinc-300" : "text-gray-700"
        )}>
          {fileData.fileName}
        </p>
        <p className={cn(
          "text-xs mt-1",
          isDarkMode ? "text-zinc-500" : "text-gray-500"
        )}>
          {(fileData.size / 1024 / 1024).toFixed(2)} MB
        </p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className={cn(
        "w-full max-w-lg mx-4 rounded-lg shadow-xl",
        isDarkMode ? "bg-zinc-900" : "bg-white"
      )}>
        {/* Header */}
        <div className={cn(
          "flex items-center justify-between p-4 border-b",
          isDarkMode ? "border-zinc-700" : "border-gray-200"
        )}>
          <h3 className={cn(
            "text-lg font-semibold",
            isDarkMode ? "text-zinc-100" : "text-gray-900"
          )}>
            Pré-visualização do Arquivo
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className={cn(
              "h-8 w-8",
              isDarkMode ? "text-zinc-400 hover:bg-zinc-800" : "text-gray-500 hover:bg-gray-100"
            )}
          >
            <X size={18} />
          </Button>
        </div>

        {/* Preview */}
        <div className="p-4">
          <div className="mb-4 flex justify-center">
            {getFilePreview()}
          </div>

          {/* Caption */}
          <div className="mb-4">
            <label className={cn(
              "block text-sm font-medium mb-2",
              isDarkMode ? "text-zinc-300" : "text-gray-700"
            )}>
              Legenda (opcional)
            </label>
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Adicione uma legenda..."
              className={cn(
                "resize-none",
                isDarkMode 
                  ? "bg-zinc-800 border-zinc-700 text-zinc-100" 
                  : "bg-white border-gray-300"
              )}
              rows={3}
            />
          </div>
        </div>

        {/* Actions */}
        <div className={cn(
          "flex justify-end gap-2 p-4 border-t",
          isDarkMode ? "border-zinc-700" : "border-gray-200"
        )}>
          <Button
            variant="outline"
            onClick={onCancel}
            className={cn(
              isDarkMode ? "border-zinc-600 text-zinc-300 hover:bg-zinc-800" : ""
            )}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => onSend(caption.trim() || undefined)}
            className="bg-[#b5103c] hover:bg-[#a00f36] text-white"
          >
            <Send size={16} className="mr-2" />
            Enviar
          </Button>
        </div>
      </div>
    </div>
  );
};
