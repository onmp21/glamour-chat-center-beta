import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Mic, Square, X, Send } from 'lucide-react';
import { FileData } from '@/types/messageTypes';
import { AudioConverter } from '@/services/AudioConverter';

interface AudioRecorderProps {
  isDarkMode: boolean;
  onAudioReady: (audioData: FileData) => void;
  onCancel: () => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  isDarkMode,
  onAudioReady,
  onCancel
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    startRecording();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      onCancel();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const handleCancel = () => {
    if (isRecording) {
      stopRecording();
    }
    onCancel();
  };

  const handleSend = async () => {
    if (audioBlob) {
      try {
        console.log('🎵 [AUDIO_RECORDER] Converting audio to MP3...');
        
        // Convert to MP3 before sending
        const mp3Base64 = await AudioConverter.audioToBase64Mp3(audioBlob);
        
        const audioData: FileData = {
          base64: mp3Base64,
          fileName: `audio_${Date.now()}.mp3`,
          mimeType: 'audio/mpeg',
          size: audioBlob.size
        };
        
        console.log('✅ [AUDIO_RECORDER] Audio converted and ready');
        onAudioReady(audioData);
      } catch (error) {
        console.error('❌ [AUDIO_RECORDER] Error processing audio:', error);
        onCancel();
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn(
      "flex items-center justify-between p-4 rounded-lg",
      isDarkMode ? "bg-zinc-800" : "bg-gray-100"
    )}>
      <div className="flex items-center space-x-3">
        <div className={cn(
          "p-2 rounded-full",
          isRecording ? "bg-red-500 animate-pulse" : "bg-gray-500"
        )}>
          <Mic size={20} className="text-white" />
        </div>
        
        <div className="flex flex-col">
          <span className={cn(
            "text-sm font-medium",
            isDarkMode ? "text-zinc-200" : "text-gray-800"
          )}>
            {isRecording ? 'Gravando...' : 'Gravação concluída'}
          </span>
          <span className={cn(
            "text-xs",
            isDarkMode ? "text-zinc-400" : "text-gray-600"
          )}>
            {formatTime(recordingTime)}
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCancel}
          className={cn(
            "h-9 w-9 rounded-full",
            isDarkMode ? "text-zinc-400 hover:bg-zinc-700" : "text-gray-500 hover:bg-gray-200"
          )}
        >
          <X size={18} />
        </Button>

        {isRecording ? (
          <Button
            onClick={stopRecording}
            size="icon"
            className="h-9 w-9 rounded-full bg-red-500 hover:bg-red-600 text-white"
          >
            <Square size={18} />
          </Button>
        ) : (
          <Button
            onClick={handleSend}
            size="icon"
            className="h-9 w-9 rounded-full bg-[#b5103c] hover:bg-[#a00f36] text-white"
          >
            <Send size={18} />
          </Button>
        )}
      </div>
    </div>
  );
};
