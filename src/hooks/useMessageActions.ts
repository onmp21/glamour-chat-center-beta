
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
    console.log('[useMessageActions] Início de handleSend');
    console.log('[useMessageActions] message:', message);
    console.log('[useMessageActions] fileData:', fileData);
    console.log('[useMessageActions] sending:', sending);
    console.log('[useMessageActions] user:', user);

    if ((!message.trim() && !fileData) || sending || !user) {
      console.log('[useMessageActions] Condição de guarda ativada. Retornando false.');
      return false; 
    }

    console.log(`[useMessageActions] channelId recebido: ${channelId}`);
    console.log(`[useMessageActions] fileData antes de sendMessage:`, fileData);

    if (!channelId || channelId.trim() === '') {
      console.error("[useMessageActions] channelId é inválido ou vazio. Não é possível enviar a mensagem.");
      return false;
    }

    let messageType: string;
    if (fileData) {
      messageType = FileService.getFileType(fileData.mimeType);
      console.log('[useMessageActions] Tipo de mensagem detectado (fileData):', messageType);
    } else {
      messageType = 'text';
      console.log('[useMessageActions] Tipo de mensagem detectado (texto):', messageType);
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

    console.log('[useMessageActions] messageData preparado para sendMessage:', messageData);
    const success = await sendMessage(messageData, addMessageToState);
    console.log('[useMessageActions] Resultado de sendMessage (success):', success);

    if (success) {
      setMessage('');
      setFileData(null);
      console.log('[useMessageActions] Mensagem enviada com sucesso. Limpando estados.');
      return true;
    }
    console.log('[useMessageActions] Falha no envio da mensagem.');
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


