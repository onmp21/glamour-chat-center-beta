
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Smile, Paperclip, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMessageSenderExtended } from '@/hooks/useMessageSenderExtended';
import { useAuth } from '@/contexts/AuthContext';
import { EnhancedEmojiPicker } from './input/EnhancedEmojiPicker';
import { FilePreviewModal } from './input/FilePreviewModal';
import { AudioRecorder } from './input/AudioRecorder';
import { FileService } from '@/services/FileService';
import { FileData } from '@/types/messageTypes';

interface YelenaChatInputProps {
  channelId: string;
  conversationId: string;
  isDarkMode: boolean;
  onMessageSent?: () => void;
}

export const YelenaChatInput: React.FC<YelenaChatInputProps> = ({
  channelId,
  conversationId,
  isDarkMode,
  onMessageSent,
}) => {
  const [message, setMessage] = useState('');
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const { sendMessage, sending } = useMessageSenderExtended();
  const { user } = useAuth();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = async (caption?: string) => {
    if ((!message.trim() && !fileData) || sending || !user) return;

    console.log('🚀 Iniciando envio de mensagem:', {
      hasText: !!message.trim(),
      hasFile: !!fileData,
      fileType: fileData?.mimeType,
      userName: user.name
    });

    const messageData = {
      conversationId,
      channelId,
      content: caption || message.trim(),
      sender: 'agent' as const,
      agentName: user.name,
      messageType: fileData ? FileService.getFileType(fileData.mimeType) as any : 'text' as any,
      fileData: fileData || undefined
    };

    const success = await sendMessage(messageData);
    if (success) {
      setMessage('');
      setFileData(null);
      setShowFilePreview(false);
      onMessageSent?.();
      textareaRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (fileData) {
        setShowFilePreview(true);
      } else {
        handleSend();
      }
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newMessage = message.substring(0, start) + emoji + message.substring(end);
      setMessage(newMessage);
      
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      }, 0);
    } else {
      setMessage(prev => prev + emoji);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('📎 Arquivo selecionado:', file.name, file.type, file.size);

    if (!FileService.isValidFileType(file)) {
      const errorMessage = FileService.getUnsupportedFileMessage(file);
      alert(errorMessage);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Arquivo muito grande. Limite de 10MB.');
      return;
    }

    try {
      console.log('🔄 Processando arquivo...');
      let base64: string;
      let finalMimeType = file.type;
      
      // Convert audio files to MP3 automatically
      if (file.type.startsWith('audio/')) {
        console.log('🎵 Arquivo de áudio detectado, convertendo para MP3...');
        base64 = await FileService.convertAudioToMp3Base64(file);
        finalMimeType = 'audio/mpeg';
      } else {
        base64 = await FileService.convertToBase64(file);
      }
      
      console.log('✅ Arquivo processado, tamanho:', base64.length);
      
      const fileDataObj: FileData = {
        base64,
        fileName: file.name,
        mimeType: finalMimeType,
        size: file.size
      };
      
      setFileData(fileDataObj);
      setShowFilePreview(true);
    } catch (error) {
      console.error('❌ Erro ao processar arquivo:', error);
      alert('Erro ao processar arquivo');
    }

    event.target.value = '';
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleAudioReady = (audioData: FileData) => {
    setFileData(audioData);
    setIsRecording(false);
    setShowFilePreview(true);
  };

  const handleCancelRecording = () => {
    setIsRecording(false);
  };

  if (isRecording) {
    return (
      <div className={cn(
        "border-t p-2 sm:p-3",
        isDarkMode ? "border-zinc-800 bg-zinc-900" : "border-gray-200 bg-white"
      )}>
        <AudioRecorder
          isDarkMode={isDarkMode}
          onAudioReady={handleAudioReady}
          onCancel={handleCancelRecording}
        />
      </div>
    );
  }

  return (
    <>
      <div className={cn(
        "border-t p-2 sm:p-3",
        isDarkMode ? "border-zinc-800 bg-zinc-900" : "border-gray-200 bg-white"
      )}>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center flex-shrink-0">
            <EnhancedEmojiPicker onEmojiSelect={handleEmojiSelect} isDarkMode={isDarkMode} />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleAttachmentClick}
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
          </div>

          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Mensagem"
              className={cn(
                "min-h-[40px] max-h-32 resize-none rounded-xl border px-3 py-2 text-sm focus-visible:ring-1 focus-visible:ring-offset-0",
                isDarkMode 
                  ? "bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-600" 
                  : "bg-gray-50 border-gray-300 focus-visible:ring-gray-400"
              )}
              disabled={sending}
              rows={1}
            />
          </div>

          <div className="flex-shrink-0">
            {message.trim() || fileData ? (
              <Button
                onClick={fileData ? () => setShowFilePreview(true) : () => handleSend()}
                disabled={sending}
                size="icon"
                className={cn(
                  "h-9 w-9 rounded-full transition-all duration-200",
                  sending
                    ? isDarkMode 
                      ? "bg-zinc-700 text-zinc-500 cursor-not-allowed" 
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-[#b5103c] hover:bg-[#a00f36] text-white"
                )}
              >
                {sending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                ) : (
                  <Send size={18} />
                )}
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsRecording(true)}
                className={cn(
                  "h-9 w-9 rounded-full",
                  isDarkMode ? "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                )}
              >
                <Mic size={20} />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* File Preview Modal */}
      {showFilePreview && fileData && (
        <FilePreviewModal
          fileData={fileData}
          isDarkMode={isDarkMode}
          onSend={handleSend}
          onCancel={() => {
            setShowFilePreview(false);
            setFileData(null);
          }}
        />
      )}
    </>
  );
};
