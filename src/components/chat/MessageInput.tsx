import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useChannelConversations } from '@/hooks/useChannelConversations';
import { useEvolutionApiSender } from '@/hooks/useEvolutionApiSender';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Send, Paperclip, Mic, Image, FileText } from 'lucide-react';

interface MessageInputProps {
  channelId: string;
  conversationId?: string;
  isDarkMode: boolean;
  className?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  channelId,
  conversationId,
  isDarkMode,
  className
}) => {
  const { updateConversationStatus } = useChannelConversations(channelId);
  const { sendMessage, sending } = useEvolutionApiSender();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Verificar tamanho do arquivo (máximo 16MB)
    if (file.size > 16 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "Arquivo muito grande. Máximo 16MB permitido.",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);

    // Criar preview para imagens
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileType = (file: File): 'image' | 'audio' | 'video' | 'document' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type.startsWith('video/')) return 'video';
    return 'document';
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remover o prefixo data:type/subtype;base64,
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!content.trim() && !selectedFile) || sending) return;
    
    if (!conversationId) {
      toast({
        title: "Erro",
        description: "Nenhuma conversa selecionada",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Enviando mensagem:', { channelId, conversationId, content, hasFile: !!selectedFile });
      
      let messageType: 'text' | 'image' | 'audio' | 'video' | 'document' = 'text';
      let fileBase64: string | undefined;
      let fileName: string | undefined;

      // Se há arquivo selecionado, processar
      if (selectedFile) {
        messageType = getFileType(selectedFile);
        fileBase64 = await fileToBase64(selectedFile);
        fileName = selectedFile.name;
      }

      // Enviar mensagem usando o hook da Evolution API - removido conversationId
      const success = await sendMessage({
        channelId,
        phoneNumber: conversationId, // Usando conversationId como phoneNumber
        message: content.trim() || (selectedFile ? `Arquivo: ${selectedFile.name}` : ''),
        messageType,
        mediaBase64: fileBase64,
        fileName
      });
      
      if (success) {
        setContent('');
        removeFile();
        
        // Marcar conversa como em andamento
        await updateConversationStatus(conversationId, 'in_progress');
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagem",
        variant: "destructive"
      });
    }
  };

  return (
    <div className={cn("border-t p-4", className)} style={{
      borderColor: isDarkMode ? '#374151' : '#e5e7eb'
    }}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Label className={cn(
          "text-sm font-medium",
          isDarkMode ? "text-gray-300" : "text-gray-700"
        )}>
          Nova mensagem
        </Label>

        {/* Preview do arquivo selecionado */}
        {selectedFile && (
          <div className={cn(
            "p-3 rounded border",
            isDarkMode ? "bg-[#27272a] border-[#3f3f46]" : "bg-gray-50 border-gray-200"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {filePreview ? (
                  <img src={filePreview} alt="Preview" className="w-12 h-12 object-cover rounded" />
                ) : (
                  <FileText size={24} className={isDarkMode ? "text-gray-400" : "text-gray-600"} />
                )}
                <div>
                  <p className={cn(
                    "text-sm font-medium",
                    isDarkMode ? "text-gray-200" : "text-gray-800"
                  )}>
                    {selectedFile.name}
                  </p>
                  <p className={cn(
                    "text-xs",
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  )}>
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={removeFile}
                className="text-red-500 hover:text-red-700"
              >
                Remover
              </Button>
            </div>
          </div>
        )}

        <div className="flex space-x-2">
          <Textarea
            placeholder="Digite sua mensagem..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            className="flex-1 min-h-[60px] resize-none"
            style={{
              backgroundColor: isDarkMode ? '#374151' : '#ffffff',
              borderColor: isDarkMode ? '#4b5563' : '#d1d5db',
              color: isDarkMode ? '#ffffff' : '#111827'
            }}
          />
          
          <div className="flex flex-col gap-2">
            {/* Botão de anexo */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
              className="px-3"
            >
              <Paperclip size={16} />
            </Button>
            
            {/* Botão de envio */}
            <Button
              type="submit"
              disabled={(!content.trim() && !selectedFile) || sending}
              className="px-3"
              style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
            >
              {sending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send size={16} />
              )}
            </Button>
          </div>
        </div>

        {/* Input de arquivo oculto */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />

        <p className={cn(
          "text-xs",
          isDarkMode ? "text-gray-500" : "text-gray-400"
        )}>
          Pressione Enter para enviar, Shift+Enter para nova linha. Máximo 16MB por arquivo.
        </p>
      </form>
    </div>
  );
};
