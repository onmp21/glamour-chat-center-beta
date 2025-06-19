import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, Mic, X, FileText, Image, Music, Video, StopCircle, Check, Sparkles, Zap } from 'lucide-react';
import { EmojiPickerCompact } from './EmojiPickerCompact';
import { ChannelConversation } from '@/types/messages';
import { useMessageSenderExtended } from '@/hooks/useMessageSenderExtended';
import { useAuth } from '@/contexts/AuthContext';
import { FileService } from '@/services/FileService';
import { useAgentMessageLock } from "@/hooks/useAgentMessageLock";
import { getContactDisplayName } from "@/utils/getContactDisplayName";
import { AIQuickResponseModal } from './AIQuickResponseModal';

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

export const ChatInput: React.FC<ChatInputProps> = ({
  isDarkMode,
  selectedConv,
  channelId,
  onSendMessage
}) => {
  const [message, setMessage] = useState('');
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showFilePreviewModal, setShowFilePreviewModal] = useState(false);
  const [showAIQuickResponseModal, setShowAIQuickResponseModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);
  const [sendingAudio, setSendingAudio] = useState(false);

  const {
    sendMessage,
    sending
  } = useMessageSenderExtended();
  const {
    user
  } = useAuth();

  const { beginLock } = useAgentMessageLock();

  const [sendingLocal, setSendingLocal] = useState(false);

  let sendLock: boolean = false;
  const handleSend = async (customCaption?: string) => {
    if (!beginLock() || sending || sendingLocal) return;
    if ((!message.trim() && !filePreview) || !user || !selectedConv || !channelId) return;
    if (filePreview && showFilePreviewModal) return;
    setSendingLocal(true);

    let correctContactName: string | undefined = undefined;
    correctContactName = getContactDisplayName({
      sender: "agent",
      contactName: selectedConv.contact_name,
    });

    let fileData = null;
    let fileType: 'image' | 'video' | 'audio' | 'file' | undefined = undefined;
    try {
      if (filePreview) {
        let base64: string;
        let mimeType = filePreview.file.type;
        base64 = await FileService.convertToBase64(filePreview.file);
        const fullBase64 = ensureDataUrl(base64, mimeType);
        fileData = {
          base64: fullBase64,
          fileName: filePreview.file.name,
          mimeType: mimeType,
          size: filePreview.file.size
        };
        fileType = filePreview.type as 'image' | 'video' | 'audio' | 'file';
      }
    } catch (err) {
      alert("Erro ao processar arquivo de anexo.");
      setSendingLocal(false);
      return;
    }

    let conversationId = selectedConv.contact_phone || selectedConv.id;
    if (conversationId?.includes("_")) conversationId = conversationId.split("_")[0];

    const getMessageTypeFromFileType = (type: FilePreview['type'] | undefined): 'text' | 'file' | 'audio' | 'image' | 'video' | 'document' => {
      if (!type) return 'text';
      if (type === 'file') return 'file';
      if (type === 'audio') return 'audio';
      if (type === 'image') return 'image';
      if (type === 'video') return 'video';
      return 'text';
    };

    const messageType: 'text' | 'file' | 'audio' | 'image' | 'video' | 'document' = fileData
      ? getMessageTypeFromFileType(fileType)
      : 'text';

    const messageData = {
      conversationId,
      channelId,
      content: customCaption !== undefined ? customCaption : message.trim() || (filePreview ? filePreview.file.name : ""),
      sender: 'agent' as const,
      agentName: user.name,
      messageType,
      fileData: fileData || undefined
    };

    const success = await sendMessage(messageData, onSendMessage as ((message: any) => void) | undefined);

    if (success) {
      setMessage('');
      setFilePreview(null);
      setShowFilePreviewModal(false);
      setRecordingTime(0);
    }
    setSendingLocal(false);
  };

  const handleQuickResponseSelect = (response: string) => {
    setMessage(response);
    setShowAIQuickResponseModal(false);
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
    if (file.type.startsWith('image/')) type = 'image';else if (file.type.startsWith('video/')) type = 'video';else if (file.type.startsWith('audio/')) type = 'audio';
    setFilePreview({
      file,
      url,
      type
    });
    if (type === 'image' || type === 'video' || type === 'audio') {
      setShowFilePreviewModal(true);
    }
    event.target.value = '';
  };

  const getMessageType = (type: FilePreview['type'] | undefined): 'text' | 'file' | 'audio' | 'image' | 'video' => {
    if (!type) return 'text';
    if (type === 'file') return 'file';
    if (type === 'audio') return 'audio';
    if (type === 'image') return 'image';
    if (type === 'video') return 'video';
    return 'text';
  };

  const [isPressingMic, setIsPressingMic] = useState(false);
  const handleRecordStart = async () => {
    setIsPressingMic(true);
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
      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      mediaRecorderRef.current = mediaRecorder;
      recordingStartTimeRef.current = Date.now();
      mediaRecorder.start(100);
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
    setIsPressingMic(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/webm;codecs=opus'
        });
        const audioFile = new File([audioBlob], `audio-${Date.now()}.webm`, {
          type: 'audio/webm'
        });

        setSendingLocal(true);
        setSendingAudio(true);

        let convertedBase64 = '';
        try {
          convertedBase64 = await FileService.convertToBase64(audioFile);
        } catch {
          alert('Erro ao codificar áudio');
          setSendingLocal(false);
          setSendingAudio(false);
          return;
        }
        await sendMessage({
          conversationId: selectedConv?.contact_phone || selectedConv?.id,
          channelId,
          content: '[Áudio]',
          sender: 'agent' as const,
          agentName: user?.name,
          messageType: 'audio',
          fileData: {
            base64: convertedBase64.startsWith("data:") ? convertedBase64.split(",")[1] : convertedBase64,
            fileName: audioFile.name,
            mimeType: audioFile.type,
            size: audioFile.size
          }
        }, onSendMessage as ((message: any) => void) | undefined);
        setSendingLocal(false);
        setSendingAudio(false);
        setIsRecording(false);
        setRecordingTime(0);
        if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      };
      mediaRecorderRef.current.stop();
    }
  };

  const handleRecordCancel = () => {
    setIsPressingMic(false);
    console.log('🎤 [AUDIO_RECORDING] Cancelando gravação...');
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

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
      case 'image':
        return <Image size={20} />;
      case 'video':
        return <Video size={20} />;
      case 'audio':
        return <Music size={20} />;
      default:
        return <FileText size={20} />;
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
  };

  const renderFilePreviewModal = () => {
    if (!filePreview) return null;
    return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
        <div className={cn("w-full max-w-lg mx-4 rounded-lg shadow-xl", isDarkMode ? "bg-[#27272a]" : "bg-white")}>
          <div className={cn("flex items-center justify-between p-4 border-b", isDarkMode ? "border-[#3f3f46]" : "border-gray-200")}>
            <h3 className={cn("text-lg font-semibold", isDarkMode ? "text-white" : "text-gray-900")}>
              Enviar Arquivo
            </h3>
            <Button variant="ghost" size="icon" onClick={() => {
            setShowFilePreviewModal(false);
            setFilePreview(null);
          }}>
              <X size={18} />
            </Button>
          </div>

          <div className="p-4">
            <div className="mb-4 flex justify-center">
              {filePreview.type === 'image' && <img src={filePreview.url} alt="Preview" className="max-w-full max-h-64 object-contain rounded-lg" />}
              {filePreview.type === 'video' && <video src={filePreview.url} className="max-w-full max-h-64 rounded-lg" controls />}
              {filePreview.type === 'audio' && <div className="w-full p-4 bg-gray-100 rounded-lg">
                  <audio src={filePreview.url} className="w-full" controls />
                </div>}
              {filePreview.type === 'file' && <div className="w-full p-4 bg-gray-100 rounded-lg flex flex-col items-center text-center">
                  {getFileIcon(filePreview.type)}
                  <p className="mt-2 text-sm font-medium">{filePreview.file.name}</p>
                </div>}
            </div>

            <div className="mb-4">
              <p className={cn("text-sm font-medium", isDarkMode ? "text-white" : "text-gray-900")}>
                {filePreview.file.name}
              </p>
              <p className={cn("text-xs", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                {(filePreview.file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>

            <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Adicione uma legenda..." className={cn("mb-4 resize-none", isDarkMode ? "bg-[#18181b] border-[#3f3f46] text-white" : "bg-white border-gray-300")} rows={3} />
          </div>

          <div className={cn("flex justify-end gap-2 p-4 border-t", isDarkMode ? "border-[#3f3f46]" : "border-gray-200")}>
            <Button variant="outline" onClick={() => {
            setShowFilePreviewModal(false);
            setFilePreview(null);
          }}>
              Cancelar
            </Button>
            <Button onClick={() => handleSend(message)}
          className={cn("bg-[#b5103c] hover:bg-[#9d0e34] text-white", sendingLocal && "opacity-70 cursor-not-allowed")} disabled={sending || sendingLocal}>
              <Send size={16} className="mr-2" />
              {sendingLocal ? "Enviando..." : "Enviar"}
            </Button>
          </div>
        </div>
      </div>;
  };

  if (isRecording || sendingAudio) {
    return <div className={cn("p-4 border-t", isDarkMode ? "border-[#3f3f46] bg-[#18181b]" : "border-gray-200 bg-white")}>
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-3">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span className={cn("text-sm", isDarkMode ? "text-white" : "text-gray-900")}>
            {sendingAudio ?
              <>
                <span className="animate-spin inline-block mr-2 rounded-full h-4 w-4 border-b-2 border-white align-middle"></span>
                Enviando áudio...
              </>
              : <>Gravando áudio... {formatTime(recordingTime)}</>
            }
          </span>
        </div>
        {!sendingAudio && (
          <>
            <Button onPointerUp={handleRecordCancel} variant="ghost" size="icon" className="text-red-500 hover:bg-red-100">
              <X size={18} />
            </Button>
            <Button onPointerUp={handleRecordStop} className="bg-[#b5103c] hover:bg-[#9d0e34] text-white">
              <Check size={18} />
            </Button>
          </>
        )}
      </div>
    </div>;
  }
  
  return <>
      <div className={cn("border-t", isDarkMode ? "border-[#3f3f46] bg-[#18181b]" : "border-gray-200 bg-white")}>
        {filePreview && !showFilePreviewModal && <div className={cn("p-3 border-b flex items-center gap-3", isDarkMode ? "border-[#3f3f46] bg-[#27272a]" : "border-gray-200 bg-gray-50")}>
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-gray-500", isDarkMode ? "bg-[#3f3f46]" : "bg-gray-200")}>
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
            <Button onClick={() => setShowFilePreviewModal(true)} variant="ghost" size="sm" className={cn(isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-700")}>
              Ver
            </Button>
            <Button onClick={() => setFilePreview(null)} variant="ghost" size="icon" className={cn("text-red-500 hover:bg-red-100/20", isDarkMode ? "hover:text-red-400" : "hover:text-red-600")}>
              <X size={16} />
            </Button>
          </div>}

        <div className="p-4">
          <div className="flex items-end gap-3">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className={cn("h-9 w-9", isDarkMode ? "text-gray-400 hover:bg-[#27272a]" : "text-gray-600 hover:bg-gray-100")} title="Anexar arquivo">
                <Paperclip size={20} />
              </Button>
              
              <EmojiPickerCompact onEmojiSelect={handleEmojiSelect} isDarkMode={isDarkMode} />
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowAIQuickResponseModal(true)} 
                className={cn("h-9 w-9", isDarkMode ? "text-gray-400 hover:bg-[#27272a]" : "text-gray-600 hover:bg-gray-100")} 
                title="Respostas Rápidas com IA"
              >
                <Sparkles size={20} />
              </Button>
            </div>

            <div className="flex-1">
              <Textarea value={message} onChange={e => setMessage(e.target.value)} onKeyPress={handleKeyPress} placeholder="Digite sua mensagem..." className={cn("min-h-[40px] max-h-32 resize-none border rounded-xl py-2 px-3", isDarkMode ? "bg-[#27272a] border-[#3f3f46] text-white placeholder:text-gray-500" : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-500")} rows={1} disabled={sending || sendingLocal} />
            </div>

            {message.trim() || filePreview ? <Button
          onClick={filePreview && !showFilePreviewModal ? () => setShowFilePreviewModal(true) : () => handleSend()
          } className="bg-[#b5103c] hover:bg-[#9d0e34] text-white h-10 w-10 flex-shrink-0 rounded-full" disabled={sending || sendingLocal}>
                {sending || sendingLocal ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <Send size={18} />}
              </Button> :
          <Button className="bg-[#b5103c] hover:bg-[#9d0e34] text-white h-10 w-10 flex-shrink-0 rounded-full" onPointerDown={handleRecordStart} onPointerUp={handleRecordStop} onPointerLeave={handleRecordCancel} disabled={sending || sendingLocal} title="Segure para gravar áudio">
                <Mic size={18} />
              </Button>}
          </div>
        </div>

        <input ref={fileInputRef} type="file" onChange={handleFileSelect} className="hidden" accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx" />
      </div>

      {showFilePreviewModal && renderFilePreviewModal()}
      
      {showAIQuickResponseModal && (
        <AIQuickResponseModal
          isDarkMode={isDarkMode}
          conversationId={selectedConv?.id}
          channelId={channelId}
          contactName={selectedConv?.contact_name}
          onClose={() => setShowAIQuickResponseModal(false)}
          onSelectResponse={handleQuickResponseSelect}
        />
      )}
    </>;
};

const ensureDataUrl = (base64: string, mimeType: string) => {
  if (base64.startsWith("data:")) return base64;
  return `data:${mimeType};base64,${base64}`;
};
