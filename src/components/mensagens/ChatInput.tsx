import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Send, 
  Paperclip, 
  Mic,
  X,
  FileText,
  Image,
  Music,
  Video,
  StopCircle,
  Check,
  Sparkles,
  Zap
} from 'lucide-react';
import { EmojiPickerCompact } from './EmojiPickerCompact';
import { openaiService } from '@/services/openaiService';
import { ChannelConversation } from '@/types/messages';
import { useMessageSenderExtended } from '@/hooks/useMessageSenderExtended';
import { useAuth } from '@/contexts/AuthContext';
import { FileService } from '@/services/FileService';

interface ChatInputProps {
  isDarkMode: boolean;
  onSendMessage?: (message: string) => void;
  onSendFile?: (file: File, caption?: string) => void;
  onSendAudio?: (audioBlob: Blob, duration: number) => void;
  selectedConv?: ChannelConversation;
  channelId?: string;
}

interface FilePreview {
  file: File;
  url: string;
  type: 'image' | 'video' | 'audio' | 'file';
}

const QUICK_RESPONSES = [
  "Olá! Como posso ajudá-lo hoje?",
  "Obrigado pelo contato. Vou verificar essa informação para você.",
  "Perfeito! Vou agendar isso para você agora mesmo.",
  "Entendi sua solicitação. Preciso de alguns dados adicionais.",
  "Muito obrigado! Seu atendimento foi finalizado com sucesso.",
  "Vou transferir você para o setor responsável."
];

export const ChatInput: React.FC<ChatInputProps> = ({ 
  isDarkMode, 
  selectedConv,
  channelId
}) => {
  const [message, setMessage] = useState('');
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showFilePreviewModal, setShowFilePreviewModal] = useState(false);
  const [showQuickResponses, setShowQuickResponses] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);

  // NOVO: para envio real via Evolution API
  const { sendMessage, sending } = useMessageSenderExtended();
  const { user } = useAuth();

  // Envio REAL via Evolution
  const handleSend = async () => {
    if ((!message.trim() && !filePreview) || !user || !selectedConv || !channelId || sending) return;

    // Extra: impede duplo envio se arquivo em preview está aberto
    if (filePreview && showFilePreviewModal) return;

    // Montar dados mínimos para o sender
    let fileData = null;
    if (filePreview) {
      // Converte arquivo para base64 usando FileService utility (já utilizada em YelenaChatInput)
      try {
        let base64: string;
        let mimeType = filePreview.file.type;
        if (filePreview.type === "audio") {
          base64 = await FileService.convertAudioToMp3Base64(filePreview.file);
          mimeType = "audio/mpeg";
        } else {
          base64 = await FileService.convertToBase64(filePreview.file);
        }
        fileData = {
          base64,
          fileName: filePreview.file.name,
          mimeType: mimeType,
          size: filePreview.file.size
        };
      } catch (err) {
        alert("Erro ao processar arquivo de anexo.");
        return;
      }
    }

    // Verifica se precisa do número puro para APIs
    let conversationId = selectedConv.contact_phone || selectedConv.id;
    if (conversationId.includes("_")) {
      conversationId = conversationId.split("_")[0];
    }

    await sendMessage({
      conversationId,
      channelId,
      content: message.trim() || (filePreview ? filePreview.file.name : ""),
      sender: "agent",
      agentName: user.name,
      messageType: filePreview ? filePreview.type : "text",
      fileData: fileData || undefined
    });
    setMessage('');
    setFilePreview(null);
    setShowFilePreviewModal(false);
    setRecordingTime(0);
    // não mexer nas props de callbacks antigos, mantemos apenas novo fluxo
  };

  const handleQuickResponse = (response: string) => {
    setMessage(response);
    setShowQuickResponses(false);
  };

  const handleAIQuickResponse = async () => {
    if (!selectedConv || !channelId) {
      console.error('❌ [AI_QUICK_RESPONSE] Conversa ou canal não selecionado');
      return;
    }
  
    // Check if the method exists on openaiService before calling
    if (typeof openaiService.generateSuggestedResponse !== 'function') {
      console.error('❌ [AI_QUICK_RESPONSE] openaiService.generateSuggestedResponse is not a function.');
      setMessage("Desculpe, não consigo gerar uma sugestão agora."); // Fallback message
      return;
    }

    try {
      console.log('🤖 [AI_QUICK_RESPONSE] Gerando resposta rápida com IA...');
      
      // Ensure selectedConv.contact_phone is valid, otherwise use selectedConv.id or a placeholder
      const conversationIdentifier = selectedConv.contact_phone || selectedConv.id;
      if (!conversationIdentifier) {
        console.error('❌ [AI_QUICK_RESPONSE] Identificador de conversa inválido.');
        setMessage("Não foi possível identificar a conversa para gerar uma sugestão.");
        return;
      }

      const suggestedResponse = await openaiService.generateSuggestedResponse(
        channelId, 
        conversationIdentifier 
      );
      
      setMessage(suggestedResponse);
      console.log('✅ [AI_QUICK_RESPONSE] Resposta sugerida gerada:', suggestedResponse);
      
    } catch (error) {
      console.error('❌ [AI_QUICK_RESPONSE] Erro ao gerar resposta:', error);
      
      const fallbackResponses = [
        "Obrigado pelo contato. Como posso ajudá-lo hoje?",
        "Entendi sua solicitação. Vou verificar isso para você.",
        "Agradeço sua paciência. Estou analisando sua situação.",
      ];
      
      const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      setMessage(randomResponse);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (filePreview && (filePreview.type === 'image' || filePreview.type === 'video' || filePreview.type === 'audio')) {
        setShowFilePreviewModal(true);
      } else {
        handleSend();
      }
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    let type: 'image' | 'video' | 'audio' | 'file' = 'file';
    
    if (file.type.startsWith('image/')) type = 'image';
    else if (file.type.startsWith('video/')) type = 'video';
    else if (file.type.startsWith('audio/')) type = 'audio';

    setFilePreview({ file, url, type });
    
    if (type === 'image' || type === 'video' || type === 'audio') {
      setShowFilePreviewModal(true);
    }
    
    event.target.value = '';
  };

  const handleRecordStart = async () => {
    try {
      console.log('🎤 [AUDIO_RECORDING] Iniciando gravação de áudio...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });
      
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current = mediaRecorder;
      recordingStartTimeRef.current = Date.now();
      
      mediaRecorder.start(100); // Coletar dados a cada 100ms
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      console.log('🎤 [AUDIO_RECORDING] Gravação iniciada com sucesso');
    } catch (error) {
      console.error('❌ [AUDIO_RECORDING] Erro ao iniciar gravação:', error);
      alert('Erro ao acessar o microfone. Verifique as permissões.');
    }
  };

  const handleRecordStop = () => {
    console.log('🎤 [AUDIO_RECORDING] Parando gravação...');
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        const url = URL.createObjectURL(audioBlob);
        // Create a File (for consistency)
        const audioFile = new File([audioBlob], `audio-${Date.now()}.webm`, { type: 'audio/webm;codecs=opus' });
        setFilePreview({ file: audioFile, url, type: 'audio' });
        setShowFilePreviewModal(true);
        setIsRecording(false);
        setRecordingTime(0);
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
        }
      };
      mediaRecorderRef.current.stop();
    }
  };

  const handleRecordCancel = () => {
    console.log('🎤 [AUDIO_RECORDING] Cancelando gravação...');
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    // Limpar chunks para não enviar
    audioChunksRef.current = [];
    
    setIsRecording(false);
    setRecordingTime(0);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image size={20} />;
      case 'video': return <Video size={20} />;
      case 'audio': return <Music size={20} />;
      default: return <FileText size={20} />;
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
  };

  const renderFilePreviewModal = () => {
    if (!filePreview) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
        <div className={cn(
          "w-full max-w-lg mx-4 rounded-lg shadow-xl",
          isDarkMode ? "bg-[#27272a]" : "bg-white"
        )}>
          <div className={cn(
            "flex items-center justify-between p-4 border-b",
            isDarkMode ? "border-[#3f3f46]" : "border-gray-200"
          )}>
            <h3 className={cn(
              "text-lg font-semibold",
              isDarkMode ? "text-white" : "text-gray-900"
            )}>
              Enviar Arquivo
            </h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setShowFilePreviewModal(false);
                setFilePreview(null);
              }}
            >
              <X size={18} />
            </Button>
          </div>

          <div className="p-4">
            <div className="mb-4 flex justify-center">
              {filePreview.type === 'image' && (
                <img
                  src={filePreview.url}
                  alt="Preview"
                  className="max-w-full max-h-64 object-contain rounded-lg"
                />
              )}
              {filePreview.type === 'video' && (
                <video
                  src={filePreview.url}
                  className="max-w-full max-h-64 rounded-lg"
                  controls
                />
              )}
              {filePreview.type === 'audio' && (
                <div className="w-full p-4 bg-gray-100 rounded-lg">
                  <audio src={filePreview.url} className="w-full" controls />
                </div>
              )}
              {filePreview.type === 'file' && (
                <div className="w-full p-4 bg-gray-100 rounded-lg flex flex-col items-center text-center">
                  {getFileIcon(filePreview.type)}
                  <p className="mt-2 text-sm font-medium">{filePreview.file.name}</p>
                </div>
              )}
            </div>

            <div className="mb-4">
              <p className={cn("text-sm font-medium", isDarkMode ? "text-white" : "text-gray-900")}>
                {filePreview.file.name}
              </p>
              <p className={cn("text-xs", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                {(filePreview.file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>

            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Adicione uma legenda..."
              className={cn(
                "mb-4 resize-none",
                isDarkMode 
                  ? "bg-[#18181b] border-[#3f3f46] text-white" 
                  : "bg-white border-gray-300"
              )}
              rows={3}
            />
          </div>

          <div className={cn(
            "flex justify-end gap-2 p-4 border-t",
            isDarkMode ? "border-[#3f3f46]" : "border-gray-200"
          )}>
            <Button
              variant="outline"
              onClick={() => {
                setShowFilePreviewModal(false);
                setFilePreview(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSend}
              className="bg-[#b5103c] hover:bg-[#9d0e34] text-white"
            >
              <Send size={16} className="mr-2" />
              Enviar
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (isRecording) {
    return (
      <div className={cn(
        "p-4 border-t",
        isDarkMode ? "border-[#3f3f46] bg-[#18181b]" : "border-gray-200 bg-white"
      )}>
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-3">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className={cn("text-sm", isDarkMode ? "text-white" : "text-gray-900")}>
              Gravando áudio... {formatTime(recordingTime)}
            </span>
          </div>
          <Button
            onClick={handleRecordCancel}
            variant="ghost"
            size="icon"
            className="text-red-500 hover:bg-red-100"
          >
            <X size={18} />
          </Button>
          <Button
            onClick={handleRecordStop}
            className="bg-[#b5103c] hover:bg-[#9d0e34] text-white"
          >
            <Check size={18} />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={cn(
        "border-t",
        isDarkMode ? "border-[#3f3f46] bg-[#18181b]" : "border-gray-200 bg-white"
      )}>
        {/* Quick Responses */}
        {showQuickResponses && (
          <div className={cn(
            "p-3 border-b",
            isDarkMode ? "border-[#3f3f46] bg-[#27272a]" : "border-gray-200 bg-gray-50"
          )}>
            <div className="flex items-center justify-between mb-2">
              <span className={cn("text-sm font-medium", isDarkMode ? "text-white" : "text-gray-900")}>
                Respostas Rápidas
              </span>
              <Button
                onClick={() => setShowQuickResponses(false)}
                variant="ghost"
                size="icon"
                className="h-6 w-6"
              >
                <X size={14} />
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {QUICK_RESPONSES.map((response, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickResponse(response)}
                  className={cn(
                    "text-left text-sm p-2 rounded-lg transition-colors",
                    isDarkMode 
                      ? "bg-[#3f3f46] text-white hover:bg-[#52525b]" 
                      : "bg-white text-gray-900 hover:bg-gray-100"
                  )}
                >
                  {response}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* File Preview simples para documentos (antes do modal) */}
        {filePreview && !showFilePreviewModal && (
          <div className={cn(
            "p-3 border-b flex items-center gap-3",
            isDarkMode ? "border-[#3f3f46] bg-[#27272a]" : "border-gray-200 bg-gray-50"
          )}>
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center text-gray-500",
              isDarkMode ? "bg-[#3f3f46]" : "bg-gray-200"
            )}>
              {getFileIcon(filePreview.type)}
            </div>
            <div className="flex-1">
              <p className={cn("text-sm font-medium truncate", isDarkMode ? "text-white" : "text-gray-900")}>
                {filePreview.file.name}
              </p>
              <p className={cn("text-xs", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                {(filePreview.file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <Button
              onClick={() => setShowFilePreviewModal(true)}
              variant="ghost"
              size="sm"
              className={cn(isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-700")}
            >
              Ver
            </Button>
            <Button
              onClick={() => setFilePreview(null)}
              variant="ghost"
              size="icon"
              className={cn("text-red-500 hover:bg-red-100/20", isDarkMode ? "hover:text-red-400" : "hover:text-red-600")}
            >
              <X size={16} />
            </Button>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4">
          <div className="flex items-end gap-3">
            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "h-9 w-9",
                  isDarkMode ? "text-gray-400 hover:bg-[#27272a]" : "text-gray-600 hover:bg-gray-100"
                )}
                title="Anexar arquivo"
              >
                <Paperclip size={20} />
              </Button>
              
              <EmojiPickerCompact onEmojiSelect={handleEmojiSelect} isDarkMode={isDarkMode} />
              
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowQuickResponses(!showQuickResponses)}
                className={cn(
                  "h-9 w-9",
                  isDarkMode ? "text-gray-400 hover:bg-[#27272a]" : "text-gray-600 hover:bg-gray-100"
                )}
                title="Respostas rápidas"
              >
                <Zap size={20} />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleAIQuickResponse}
                className={cn(
                  "h-9 w-9",
                  isDarkMode ? "text-purple-400 hover:bg-[#27272a]" : "text-purple-600 hover:bg-purple-50"
                )}
                title="Gerar resposta com IA"
              >
                <Sparkles size={20} />
              </Button>
            </div>

            {/* Message Input */}
            <div className="flex-1">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua mensagem..."
                className={cn(
                  "min-h-[40px] max-h-32 resize-none border rounded-xl py-2 px-3",
                  isDarkMode 
                    ? "bg-[#27272a] border-[#3f3f46] text-white placeholder:text-gray-500" 
                    : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                )}
                rows={1}
              />
            </div>

            {/* Send/Mic Button */}
            <Button
              onClick={message.trim() || filePreview ? (filePreview && !showFilePreviewModal ? () => setShowFilePreviewModal(true) : handleSend) : handleRecordStart}
              className="bg-[#b5103c] hover:bg-[#9d0e34] text-white h-10 w-10 flex-shrink-0 rounded-full"
            >
              {message.trim() || filePreview ? <Send size={18} /> : <Mic size={18} />}
            </Button>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
        />
      </div>

      {/* File Preview Modal */}
      {showFilePreviewModal && renderFilePreviewModal()}
    </>
  );
};
