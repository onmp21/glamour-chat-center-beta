
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
  Check
} from 'lucide-react';
import { EmojiPickerCompact } from './EmojiPickerCompact';

interface ChatInputProps {
  isDarkMode: boolean;
  onSendMessage: (message: string) => void;
  onSendFile?: (file: File, caption?: string) => void;
  onSendAudio?: (audioBlob: Blob, duration: number) => void;
}

interface FilePreview {
  file: File;
  url: string;
  type: 'image' | 'video' | 'audio' | 'document';
}

export const ChatInput: React.FC<ChatInputProps> = ({ 
  isDarkMode, 
  onSendMessage,
  onSendFile,
  onSendAudio
}) => {
  const [message, setMessage] = useState('');
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);

  const handleSend = () => {
    if (message.trim() || filePreview) {
      if (filePreview) {
        console.log("Sending file:", filePreview.file.name);
        onSendFile?.(filePreview.file, message.trim() || undefined);
        setFilePreview(null);
        setShowFilePreview(false);
        setMessage("");
      } else if (message.trim()) {
        onSendMessage(message.trim());
        setMessage("");
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (filePreview && (filePreview.type === 'image' || filePreview.type === 'video' || filePreview.type === 'audio')) {
        setShowFilePreview(true);
      } else {
        handleSend();
      }
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    let type: 'image' | 'video' | 'audio' | 'document' = 'document';
    
    if (file.type.startsWith('image/')) type = 'image';
    else if (file.type.startsWith('video/')) type = 'video';
    else if (file.type.startsWith('audio/')) type = 'audio';

    setFilePreview({ file, url, type });
    
    // Se for imagem, vídeo ou áudio, mostrar preview automático
    if (type === 'image' || type === 'video' || type === 'audio') {
      setShowFilePreview(true);
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
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        const duration = (Date.now() - recordingStartTimeRef.current) / 1000;
        
        console.log('🎤 [AUDIO_RECORDING] Gravação finalizada:', {
          size: audioBlob.size,
          duration: duration,
          type: audioBlob.type
        });
        
        // Parar todas as tracks do stream
        stream.getTracks().forEach(track => track.stop());
        
        // Enviar áudio
        onSendAudio?.(audioBlob, duration);
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
      mediaRecorderRef.current.stop();
    }
    
    setIsRecording(false);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
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

  const renderFilePreview = () => {
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
                setShowFilePreview(false);
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
                setShowFilePreview(false);
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
        {/* File Preview simples para documentos */}
        {filePreview && filePreview.type === 'document' && (
          <div className={cn(
            "p-3 border-b flex items-center gap-3",
            isDarkMode ? "border-[#3f3f46] bg-[#27272a]" : "border-gray-200 bg-gray-50"
          )}>
            <div className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center",
              isDarkMode ? "bg-[#3f3f46]" : "bg-gray-200"
            )}>
              {getFileIcon(filePreview.type)}
            </div>
            <div className="flex-1">
              <p className={cn("text-sm font-medium", isDarkMode ? "text-white" : "text-gray-900")}>
                {filePreview.file.name}
              </p>
              <p className={cn("text-xs", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                {(filePreview.file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <Button
              onClick={() => setFilePreview(null)}
              variant="ghost"
              size="icon"
              className="text-red-500"
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
              >
                <Paperclip size={20} />
              </Button>
              
              <EmojiPickerCompact onEmojiSelect={handleEmojiSelect} isDarkMode={isDarkMode} />
            </div>

            {/* Message Input */}
            <div className="flex-1">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua mensagem..."
                className={cn(
                  "min-h-[40px] max-h-32 resize-none border rounded-xl",
                  isDarkMode 
                    ? "bg-[#27272a] border-[#3f3f46] text-white placeholder:text-gray-500" 
                    : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                )}
                rows={1}
              />
            </div>

            {/* Send/Mic Button */}
            <Button
              onClick={message.trim() || filePreview ? handleSend : handleRecordStart}
              className="bg-[#b5103c] hover:bg-[#9d0e34] text-white h-10 w-10 flex-shrink-0"
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
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
        />
      </div>

      {/* File Preview Modal */}
      {showFilePreview && renderFilePreview()}
    </>
  );
};
