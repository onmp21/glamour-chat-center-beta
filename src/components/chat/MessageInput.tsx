import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Send, Paperclip, Mic, Image, FileText } from 'lucide-react';

interface MessageInputProps {
  channelId: string;
  conversationId?: string;
  isDarkMode: boolean;
  className?: string;
  onSendMessage?: (content: string, file?: File) => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  channelId,
  conversationId,
  isDarkMode,
  className,
  onSendMessage
}) => {
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Verificar tamanho do arquivo (máximo 16MB)
    if (file.size > 16 * 1024 * 1024) {
      alert('Arquivo muito grande. Máximo 16MB permitido.');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!content.trim() && !selectedFile) || sending) return;
    
    if (!conversationId) {
      alert('Nenhuma conversa selecionada');
      return;
    }

    try {
      console.log('Enviando mensagem:', { channelId, conversationId, content, hasFile: !!selectedFile });
      
      setSending(true);
      
      // Simular envio (interface visual apenas)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Callback para componente pai
      onSendMessage?.(content.trim() || (selectedFile ? `Arquivo: ${selectedFile.name}` : ''), selectedFile || undefined);
      
      setContent('');
      removeFile();
      
      console.log('Mensagem enviada com sucesso (simulação)');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      alert('Erro ao enviar mensagem');
    } finally {
      setSending(false);
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

