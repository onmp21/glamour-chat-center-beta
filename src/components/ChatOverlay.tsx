
import React, { useState } from 'react';
import { X, MessageSquare, Phone, Video, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ChatOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  contactName: string;
  isDarkMode: boolean;
}

export const ChatOverlay: React.FC<ChatOverlayProps> = ({
  isOpen,
  onClose,
  contactName,
  isDarkMode
}) => {
  const [messages, setMessages] = useState([
    { id: 1, text: "Olá! Como posso ajudá-lo hoje?", sender: "contact", time: "14:30" },
    { id: 2, text: "Oi! Gostaria de agendar um exame", sender: "user", time: "14:31" },
    { id: 3, text: "Claro! Que tipo de exame você precisa?", sender: "contact", time: "14:32" },
  ]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay background */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Chat container */}
      <div className={cn(
        "relative ml-auto w-full max-w-md h-full flex flex-col shadow-2xl",
        isDarkMode ? "bg-[#09090b]" : "bg-white"
      )}>
        {/* Header */}
        <div className={cn(
          "p-4 flex items-center justify-between",
          isDarkMode ? "bg-[#18181b] border-b border-[#3f3f46]" : "bg-gray-50 border-b border-gray-200"
        )}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                "bg-red-100 text-red-600"
              )}>
                <MessageSquare size={20} />
              </div>
              {/* Removido o indicador de status ativo */}
            </div>
            <div>
              <h3 className={cn(
                "font-medium",
                isDarkMode ? "text-white" : "text-gray-900"
              )}>
                {contactName}
              </h3>
              <p className={cn(
                "text-xs",
                isDarkMode ? "text-[#a1a1aa]" : "text-gray-500"
              )}>
                Online agora
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Phone size={18} />
            </Button>
            <Button variant="ghost" size="icon">
              <Video size={18} />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreVertical size={18} />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X size={18} />
            </Button>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.sender === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-xs px-4 py-2 rounded-lg text-sm",
                  message.sender === "user"
                    ? "bg-[#b5103c] text-white"
                    : (isDarkMode ? "bg-[#27272a] text-white" : "bg-gray-100 text-gray-900")
                )}
              >
                <p>{message.text}</p>
                <p className={cn(
                  "text-xs mt-1 opacity-70",
                  message.sender === "user" ? "text-red-100" : (isDarkMode ? "text-[#a1a1aa]" : "text-gray-500")
                )}>
                  {message.time}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Message input */}
        <div className={cn(
          "p-4 border-t",
          isDarkMode ? "border-[#3f3f46]" : "border-gray-200"
        )}>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Digite sua mensagem..."
              className={cn(
                "flex-1 px-3 py-2 rounded-lg border",
                isDarkMode 
                  ? "bg-[#18181b] border-[#3f3f46] text-white placeholder-[#a1a1aa]"
                  : "bg-white border-gray-200 text-gray-900 placeholder-gray-500"
              )}
            />
            <Button className="bg-[#b5103c] hover:bg-[#9d0e34] text-white">
              Enviar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
