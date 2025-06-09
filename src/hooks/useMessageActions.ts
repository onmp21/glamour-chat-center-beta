
import { useState } from 'react';
import { useMessageSenderExtended } from './useMessageSenderExtended';
import { useAuth } from '@/contexts/AuthContext';
import { FileData, RawMessage } from '@/types/messageTypes';
import { FileService } from '@/services/FileService';

export const useMessageActions = (
  channelId: string,
  conversationId: string,
  addMessageToState: (message: RawMessage) => void
) => {
  const [message, setMessage] = useState('');
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const { sendMessage, sending } = useMessageSenderExtended();
  const { user } = useAuth();

  const handleSend = async (caption?: string) => {
    if ((!message.trim() && !fileData) || sending || !user) return;

    let messageType: string;
    if (fileData) {
      messageType = FileService.getFileType(fileData.mimeType);
    } else {
      messageType = 'text';
    }

    const messageData = {
      conversationId,
      channelId,
      content: caption || message.trim(),
      sender: 'agent' as const,
      agentName: user.name,
      messageType: messageType as any,
      fileData: fileData || undefined
    };

    const success = await sendMessage(messageData, addMessageToState);
    if (success) {
      setMessage('');
      setFileData(null);
      return true;
    }
    return false;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return {
    message,
    setMessage,
    fileData,
    setFileData,
    isRecording,
    setIsRecording,
    sending,
    handleSend,
    handleKeyPress
  };
};
