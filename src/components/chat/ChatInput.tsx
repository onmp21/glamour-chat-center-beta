
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { YelenaChatInput } from './YelenaChatInput';
import { EnhancedEmojiPicker } from './input/EnhancedEmojiPicker';
import { FileAttachment } from './input/FileAttachment';
import { MessageTextArea } from './input/MessageTextArea';
import { SendButton } from './input/SendButton';
import { FilePreviewModal } from './input/FilePreviewModal';
import { AudioRecorder } from './input/AudioRecorder';
import { useMessageActions } from '@/hooks/useMessageActions';
import { FileData, RawMessage } from '@/types/messageTypes';

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
  // Se for canal Yelena, usar o YelenaChatInput
  if (channelId === 'chat' || channelId === 'af1e5797-edc6-4ba3-a57a-25cf7297c4d6') {
    return (
      <YelenaChatInput
        channelId={channelId}
        conversationId={conversationId}
        isDarkMode={isDarkMode}
        onMessageSent={onMessageSent}
      />
    );
  }

  const [showFilePreview, setShowFilePreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    message,
    setMessage,
    fileData,
    setFileData,
    isRecording,
    setIsRecording,
    sending,
    handleSend,
    handleKeyPress
  } = useMessageActions(channelId, conversationId, addMessageToState);

  const handleSendMessage = async (caption?: string) => {
    const success = await handleSend(caption);
    if (success) {
      setShowFilePreview(false);
      onMessageSent?.();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
  };

  const handleFileSelect = (fileData: FileData) => {
    setFileData(fileData);
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
              onStartRecording={() => setIsRecording(true)}
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
