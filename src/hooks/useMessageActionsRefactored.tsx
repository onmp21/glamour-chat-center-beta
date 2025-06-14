
import { useState } from 'react';
import { useMessageSenderExtended } from './useMessageSenderExtended';
import { useAuth } from '@/contexts/AuthContext';
import { FileData, RawMessage } from '@/types/messageTypes';
import { FileService } from '@/services/FileService';

export const useMessageActionsRefactored = (
  channelId: string,
  conversationId: string,
  addMessageToState: (message: RawMessage) => void
) => {
  const [message, setMessage] = useState('');
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const { sendMessage, sending } = useMessageSenderExtended();
  const { user } = useAuth();

  const validateSendConditions = () => {
    if ((!message.trim() && !fileData) || sending || !user) {
      console.log('[useMessageActionsRefactored] Condição de guarda ativada. Retornando false.');
      return false;
    }

    if (!channelId || channelId.trim() === '') {
      console.error("[useMessageActionsRefactored] channelId é inválido ou vazio. Não é possível enviar a mensagem.");
      return false;
    }

    return true;
  };

  const prepareMessageData = (caption?: string) => {
    let messageType: string;
    if (fileData) {
      messageType = FileService.getFileType(fileData.mimeType);
      console.log('[useMessageActionsRefactored] Tipo de mensagem detectado (fileData):', messageType);
    } else {
      messageType = 'text';
      console.log('[useMessageActionsRefactored] Tipo de mensagem detectado (texto):', messageType);
    }

    return {
      conversationId,
      channelId,
      content: caption || message.trim(),
      sender: 'agent' as const,
      agentName: user!.name,
      messageType: messageType as any,
      fileData: fileData || undefined
    };
  };

  const handleSend = async (caption?: string) => {
    console.log('[useMessageActionsRefactored] Início de handleSend');

    if (!validateSendConditions()) {
      return false;
    }

    const messageData = prepareMessageData(caption);
    console.log('[useMessageActionsRefactored] messageData preparado para sendMessage:', messageData);
    
    const success = await sendMessage(messageData, addMessageToState);
    console.log('[useMessageActionsRefactored] Resultado de sendMessage (success):', success);

    if (success) {
      setMessage('');
      setFileData(null);
      console.log('[useMessageActionsRefactored] Mensagem enviada com sucesso. Limpando estados.');
      return true;
    }
    
    console.log('[useMessageActionsRefactored] Falha no envio da mensagem.');
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
