
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FileData } from '@/types/chat';
import { FileService } from '@/services/FileService';

interface FileAttachmentProps {
  isDarkMode: boolean;
  onFileSelect: (fileData: FileData) => void;
  onError: (message: string) => void;
}

export const FileAttachment: React.FC<FileAttachmentProps> = ({
  isDarkMode,
  onFileSelect,
  onError
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!FileService.isValidFileType(file)) {
      const errorMessage = FileService.getUnsupportedFileMessage(file);
      onError(errorMessage);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      onError('Arquivo muito grande. Limite de 10MB.');
      return;
    }

    try {
      let base64: string;
      
      if (file.type.startsWith('audio/')) {
        base64 = await FileService.convertAudioToMp3Base64(file);
      } else {
        base64 = await FileService.convertToBase64(file);
      }
      
      onFileSelect({
        base64,
        fileName: file.name,
        mimeType: file.type.startsWith('audio/') ? 'audio/mpeg' : file.type,
        size: file.size
      });
    } catch (error) {
      console.error('Error processing file:', error);
      onError('Erro ao processar arquivo');
    }

    event.target.value = '';
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "h-9 w-9 rounded-full",
          isDarkMode ? "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        )}
      >
        <Paperclip size={20} />
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp,.mp3,.wav,.ogg,.webm,.mp4"
      />
    </>
  );
};
