
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { YelenaChatInput } from './YelenaChatInput';
import { EnhancedEmojiPicker } from './input/EnhancedEmojiPicker';
import { FileAttachment } from './input/FileAttachment';
import { MessageTextArea } from './input/MessageTextArea';
import { SendButton } from './input/SendButton';
import { FilePreviewModal } from './input/FilePreviewModal';
import { AudioRecorder } from './input/AudioRecorder';
import { useMessageSenderExtended } from '@/hooks/useMessageSenderExtended';
import { useAuth } from '@/contexts/AuthContext';
import { FileData, RawMessage } from '@/types/messageTypes';
import { openaiService } from '@/services/openaiService';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface ChatInputProps {
  channelId: string;
  conversationId: string;
  isDarkMode: boolean;
  onMessageSent?: () => void;
  addMessageToState: (message: RawMessage) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  channelId,
  conversationId,
  isDarkMode,
  onMessageSent,
  addMessageToState,
}) => {
  if (channelId === 'chat' || channelId === 'af1e5797-edc6-4ba3-a57a-25cf7297c4d6') {
    return (
      <YelenaChatInput
        channelId={channelId}
        conversationId={conversationId}
        isDarkMode={isDarkMode}
        onMessageSent={onMessageSent}
        addMessageToState={addMessageToState}
      />
    );
  }

  const [showFilePreview, setShowFilePreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedReply, setSuggestedReply] = useState<string | null>(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);

  const { sendMessage, sending } = useMessageSenderExtended();
  const { user } = useAuth();

  const [message, setMessage] = useState('');
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const handleSendMessage = async (caption?: string) => {
    if ((!message.trim() && !fileData) || sending || !user) return;

    const payload = {
      conversationId,
      channelId,
      content: caption || message.trim(),
      sender: 'agent' as const,
      agentName: user?.name,
      messageType: fileData ? (fileData.mimeType.startsWith('image')
        ? 'image'
        : fileData.mimeType.startsWith('audio')
        ? 'audio'
        : fileData.mimeType.startsWith('video')
        ? 'video'
        : fileData.mimeType === 'application/pdf' || fileData.mimeType.startsWith('application/')
        ? 'document'
        : 'text') as any : 'text' as any,
      fileData: fileData || undefined,
    };

    const success = await sendMessage(payload, addMessageToState);
    
    if (success) {
      // Limpar tudo após envio bem-sucedido
      setMessage('');
      setFileData(null);
      setShowFilePreview(false);
      setSuggestedReply(null);
      setError(null);
      
      if (onMessageSent) {
        onMessageSent();
      }
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
  };

  const handleFileSelect = (selectedFileData: FileData) => {
    setFileData(selectedFileData);
    setShowFilePreview(true);
    setError(null);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setTimeout(() => setError(null), 3000);
  };

  const handleAudioReady = (audioData: FileData) => {
    setFileData(audioData);
    setIsRecording(false);
    setShowFilePreview(true);
  };

  const fetchSuggestedReply = async () => {
    if (!conversationId) return;
    setIsLoadingSuggestion(true);
    setSuggestedReply(null);
    try {
      console.warn("openaiService.generateSuggestedResponse does not exist. Skipping suggestion.");
    } catch (err) {
      console.error("Error fetching suggested reply:", err);
    } finally {
      setIsLoadingSuggestion(false);
    }
  };

  useEffect(() => {
    if (conversationId && channelId !== 'chat' && channelId !== 'af1e5797-edc6-4ba3-a57a-25cf7297c4d6') {
      fetchSuggestedReply();
    }
  }, [conversationId, channelId]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (fileData) {
        setShowFilePreview(true);
      } else {
        handleSendMessage();
      }
    }
  };

  const handleStartRecording = () => setIsRecording(true);

  if (isRecording) {
    return (
      <div className={cn(
        "border-t p-2 sm:p-3",
        isDarkMode ? "border-zinc-800 bg-zinc-900" : "border-gray-200 bg-white"
      )}>
        <AudioRecorder
          isDarkMode={isDarkMode}
          onAudioReady={handleAudioReady}
          onCancel={() => setIsRecording(false)}
        />
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className={cn(
          "p-2 text-sm text-red-600 bg-red-50 border-t",
          isDarkMode ? "bg-red-900/20 text-red-400" : ""
        )}>
          {error}
        </div>
      )}

      {isLoadingSuggestion && (
        <div className={cn("p-2 text-sm", isDarkMode ? "text-gray-400" : "text-gray-600")}>
          Gerando sugestão...
        </div>
      )}
      {suggestedReply && !sending && (
        <div className={cn("p-2 border-t", isDarkMode ? "border-zinc-800" : "border-gray-200")}>
          <div className="text-xs font-medium mb-1">Sugestão de Resposta:</div>
          <div 
            className={cn(
              "p-2 rounded cursor-pointer", 
              isDarkMode ? "bg-zinc-800 hover:bg-zinc-700" : "bg-gray-100 hover:bg-gray-200"
            )}
            onClick={() => {
              setMessage(suggestedReply);
              setSuggestedReply(null);
            }}
          >
            {suggestedReply}
          </div>
          <div className="flex justify-end items-center mt-1 space-x-2">
            <Button variant="ghost" size="sm" onClick={() => setSuggestedReply(null)} title="Descartar sugestão">
              <ThumbsDown size={14} />
            </Button>
            <Button variant="ghost" size="sm" onClick={fetchSuggestedReply} title="Gerar nova sugestão">
              Nova Sugestão
            </Button>
          </div>
        </div>
      )}

      <div className={cn(
        "border-t p-2 sm:p-3",
        isDarkMode ? "border-zinc-800 bg-zinc-900" : "border-gray-200 bg-white"
      )}>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center flex-shrink-0">
            <EnhancedEmojiPicker onEmojiSelect={handleEmojiSelect} isDarkMode={isDarkMode} />
            <FileAttachment 
              isDarkMode={isDarkMode}
              onFileSelect={handleFileSelect}
              onError={handleError}
            />
          </div>

          <div className="flex-1">
            <MessageTextArea
              value={message}
              onChange={setMessage}
              onKeyPress={handleKeyPress}
              isDarkMode={isDarkMode}
              disabled={sending}
            />
          </div>

          <div className="flex-shrink-0">
            <SendButton
              hasContent={message.trim() !== '' || fileData !== null}
              onSend={() => fileData ? setShowFilePreview(true) : handleSendMessage()}
              onStartRecording={handleStartRecording}
              sending={sending}
              isDarkMode={isDarkMode}
            />
          </div>
        </div>
      </div>

      {showFilePreview && fileData && (
        <FilePreviewModal
          fileData={fileData}
          isDarkMode={isDarkMode}
          onSend={handleSendMessage}
          onCancel={() => {
            setShowFilePreview(false);
            setFileData(null);
          }}
        />
      )}
    </>
  );
};
