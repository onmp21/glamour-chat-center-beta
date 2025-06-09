import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { ChatMessage } from './ChatMessage';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Send, 
  MoreVertical, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Tag,
  MessageSquare,
  Archive,
  UserX,
  Trash2,
  Bell,
  Shield,
  Paperclip,
  Image,
  FileText
} from 'lucide-react';

interface DesktopChatAreaProps {
  isDarkMode: boolean;
  activeConversation: string | null;
  conversations: any[];
  updateConversationStatus: (conversationId: string, status: any) => void;
  setActiveConversation: (conversationId: string | null) => void;
}

export const DesktopChatArea: React.FC<DesktopChatAreaProps> = ({
  isDarkMode,
  activeConversation,
  conversations,
  updateConversationStatus,
  setActiveConversation
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [showContactDetails, setShowContactDetails] = useState(false);
  const [showContactSettings, setShowContactSettings] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showFileOptions, setShowFileOptions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { canSendMessage } = usePermissions();
  const { user } = useAuth();

  const conversation = conversations.find(conv => conv.id === activeConversation);
  const hasConversations = conversations.length > 0;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation]);

  const handleSendMessage = () => {
    if (newMessage.trim() && activeConversation) {
      console.log('Sending message:', newMessage);
      setNewMessage('');
      setTimeout(scrollToBottom, 100);
    }
  };

  const handleFileUpload = (type: 'image' | 'document') => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === 'image' ? 'image/*' : '.pdf,.doc,.docx,.txt';
      fileInputRef.current.click();
    }
    setShowFileOptions(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('File selected:', file.name);
      // TODO: Implementar upload do arquivo
    }
  };

  return (
    <>
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        {conversation ? (
          <div className="flex items-center justify-between p-4 border-b" style={{
            borderColor: isDarkMode ? "#2a2a2a" : "#e5e7eb",
            backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff"
          }}>
            <div className="flex items-center space-x-3 flex-1">
              <div className="flex-1">
                <h3 className={cn(
                  "font-semibold text-lg",
                  isDarkMode ? "text-white" : "text-gray-900"
                )}>
                  {conversation.contactName}
                </h3>
                <div className="flex items-center space-x-2">
                  <span className={cn(
                    "text-sm",
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  )}>
                    {conversation.contactNumber}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    Online
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowContactDetails(true)}
                className={cn(
                  "h-9 w-9",
                  isDarkMode ? "text-gray-400 hover:text-white hover:bg-gray-700" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                )}
              >
                <User size={18} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowContactSettings(true)}
                className={cn(
                  "h-9 w-9",
                  isDarkMode ? "text-gray-400 hover:text-white hover:bg-gray-700" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                )}
              >
                <Phone size={18} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMoreOptions(true)}
                className={cn(
                  "h-9 w-9",
                  isDarkMode ? "text-gray-400 hover:text-white hover:bg-gray-700" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                )}
              >
                <MoreVertical size={18} />
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4 border-b" style={{
            borderColor: isDarkMode ? "#2a2a2a" : "#e5e7eb",
            backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff"
          }}>
            <h3 className={cn(
              "font-semibold text-lg",
              isDarkMode ? "text-white" : "text-gray-900"
            )}>
              {hasConversations ? "Selecione uma conversa" : "Nenhuma conversa disponível"}
            </h3>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{
          backgroundColor: isDarkMode ? "#0f0f0f" : "#f9fafb"
        }}>
          {conversation ? (
            <>
              <div className="text-center mb-4">
                <span className={cn(
                  "text-xs px-3 py-1 rounded-full",
                  isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-600"
                )}>
                  Conversa iniciada hoje
                </span>
              </div>

              <ChatMessage
                message={{
                  id: '1',
                  content: 'Gostaria de saber sobre os produtos em promoção',
                  timestamp: new Date().toISOString(),
                  sender: conversation.contactName,
                  isOwn: false
                }}
                isDarkMode={isDarkMode}
              />
              
              <ChatMessage
                message={{
                  id: '2',
                  content: 'Olá! Claro, posso ajudá-la com informações sobre nossas promoções. Quais produtos você tem interesse?',
                  timestamp: new Date().toISOString(),
                  sender: user?.name || 'Atendente',
                  isOwn: true
                }}
                isDarkMode={isDarkMode}
              />

              <ChatMessage
                message={{
                  id: '3',
                  content: 'Estou interessada nos produtos de maquiagem',
                  timestamp: new Date().toISOString(),
                  sender: conversation.contactName,
                  isOwn: false
                }}
                isDarkMode={isDarkMode}
              />
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageSquare size={48} className={cn(
                  "mx-auto mb-4",
                  isDarkMode ? "text-gray-600" : "text-gray-400"
                )} />
                <h3 className={cn(
                  "text-xl font-semibold mb-2",
                  isDarkMode ? "text-white" : "text-gray-900"
                )}>
                  {hasConversations ? "Selecione uma conversa" : "Nenhuma conversa disponível"}
                </h3>
                <p className={cn(
                  "text-sm",
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                )}>
                  {hasConversations 
                    ? "Escolha uma conversa da lista para começar a conversar"
                    : "Aguarde novas conversas chegarem"
                  }
                </p>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Area - SEMPRE VISÍVEL */}
        <div className="p-4 border-t" style={{
          borderColor: isDarkMode ? "#2a2a2a" : "#e5e7eb",
          backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff"
        }}>
          <form
            className="flex items-center space-x-3"
            onSubmit={e => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
            <div className="relative">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn("h-9 w-9", isDarkMode ? "text-gray-400 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100")}
                onClick={() => setShowFileOptions(!showFileOptions)}
                disabled={!conversation}
              >
                <Paperclip size={16} />
              </Button>
              
              {showFileOptions && (
                <div className={cn(
                  "absolute bottom-12 left-0 rounded-lg shadow-lg border p-2 z-50 min-w-[140px]",
                  isDarkMode ? "bg-[#1a1a1a] border-[#404040]" : "bg-white border-gray-200"
                )}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 mb-1"
                    onClick={() => handleFileUpload('image')}
                  >
                    <Image size={14} className="text-[#b5103c]" />
                    <span className={isDarkMode ? "text-gray-200" : "text-gray-700"}>Imagem</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2"
                    onClick={() => handleFileUpload('document')}
                  >
                    <FileText size={14} className="text-[#b5103c]" />
                    <span className={isDarkMode ? "text-gray-200" : "text-gray-700"}>Documento</span>
                  </Button>
                </div>
              )}
            </div>
            
            <Input
              placeholder={conversation ? "Digite sua mensagem..." : hasConversations ? "Selecione uma conversa para enviar mensagens" : "Aguarde novas conversas"}
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              disabled={!conversation}
              className={cn(
                "flex-1",
                isDarkMode 
                  ? "bg-[#2a2a2a] border-[#404040] text-white placeholder:text-gray-400 focus:border-[#b5103c] disabled:bg-[#1a1a1a] disabled:text-gray-500"
                  : "bg-gray-50 border-gray-200 focus:border-[#b5103c] disabled:bg-gray-100 disabled:text-gray-400"
              )}
            />
            <Button 
              className="bg-[#b5103c] text-white hover:bg-[#9d0e34] px-6 disabled:bg-gray-400" 
              type="submit"
              disabled={!newMessage.trim() || !conversation}
            >
              <Send size={16} className="mr-2" />
              Enviar
            </Button>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
            />
          </form>
        </div>
      </div>

      {/* Contact Details Modal */}
      <Dialog open={showContactDetails} onOpenChange={setShowContactDetails}>
        <DialogContent className={cn(
          "sm:max-w-lg",
          isDarkMode ? "bg-[#1a1a1a] border-[#404040] text-white" : "bg-white border-gray-200"
        )}>
          <DialogHeader>
            <DialogTitle className={cn(isDarkMode ? "text-white" : "text-gray-900")}>
              Informações do Contato
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className={cn("text-xl font-semibold", isDarkMode ? "text-white" : "text-gray-900")}>
                {conversation?.contactName || 'Nome do Contato'}
              </h3>
              <div className="flex items-center justify-center space-x-2">
                <Badge variant="secondary" className="text-xs">Online</Badge>
                <span className={cn("text-sm", isDarkMode ? "text-gray-400" : "text-gray-500")}>
                  Última atividade: agora
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center space-x-3 p-3 rounded-lg" style={{
                backgroundColor: isDarkMode ? "#2a2a2a" : "#f3f4f6"
              }}>
                <Phone size={16} className="text-[#b5103c] flex-shrink-0" />
                <div>
                  <p className={cn("text-sm font-medium", isDarkMode ? "text-white" : "text-gray-900")}>
                    Telefone
                  </p>
                  <p className={cn("text-sm", isDarkMode ? "text-gray-300" : "text-gray-600")}>
                    {conversation?.contactNumber || '(77) 99999-1234'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg" style={{
                backgroundColor: isDarkMode ? "#2a2a2a" : "#f3f4f6"
              }}>
                <Mail size={16} className="text-[#b5103c] flex-shrink-0" />
                <div>
                  <p className={cn("text-sm font-medium", isDarkMode ? "text-white" : "text-gray-900")}>
                    Email
                  </p>
                  <p className={cn("text-sm", isDarkMode ? "text-gray-300" : "text-gray-600")}>
                    contato@exemplo.com
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg" style={{
                backgroundColor: isDarkMode ? "#2a2a2a" : "#f3f4f6"
              }}>
                <MapPin size={16} className="text-[#b5103c] flex-shrink-0" />
                <div>
                  <p className={cn("text-sm font-medium", isDarkMode ? "text-white" : "text-gray-900")}>
                    Localização
                  </p>
                  <p className={cn("text-sm", isDarkMode ? "text-gray-300" : "text-gray-600")}>
                    Canarana, BA
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-lg" style={{
                backgroundColor: isDarkMode ? "#2a2a2a" : "#f3f4f6"
              }}>
                <Tag size={16} className="text-[#b5103c] flex-shrink-0 mt-0.5" />
                <div>
                  <p className={cn("text-sm font-medium", isDarkMode ? "text-white" : "text-gray-900")}>
                    Tags
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {conversation?.tags?.map((tag: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact Settings Modal */}
      <Dialog open={showContactSettings} onOpenChange={setShowContactSettings}>
        <DialogContent className={cn(
          "sm:max-w-lg",
          isDarkMode ? "bg-[#1a1a1a] border-[#404040] text-white" : "bg-white border-gray-200"
        )}>
          <DialogHeader>
            <DialogTitle className={cn(isDarkMode ? "text-white" : "text-gray-900")}>
              Configurações do Contato
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: isDarkMode ? "#2a2a2a" : "#f3f4f6" }}>
                  <div className="flex items-center gap-3">
                    <Bell size={16} className="text-[#b5103c]" />
                    <div>
                      <p className={cn("text-sm font-medium", isDarkMode ? "text-white" : "text-gray-900")}>
                        Notificações
                      </p>
                      <p className={cn("text-xs", isDarkMode ? "text-gray-200" : "text-gray-500")}>
                        Receber notificações
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" style={{
                    borderColor: isDarkMode ? '#404040' : '#d1d5db',
                    color: isDarkMode ? '#ffffff' : '#374151'
                  }}>
                    Ativado
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: isDarkMode ? "#2a2a2a" : "#f3f4f6" }}>
                  <div className="flex items-center gap-3">
                    <Shield size={16} className="text-[#b5103c]" />
                    <div>
                      <p className={cn("text-sm font-medium", isDarkMode ? "text-white" : "text-gray-900")}>
                        Bloquear Contato
                      </p>
                      <p className={cn("text-xs", isDarkMode ? "text-gray-200" : "text-gray-500")}>
                        Impedir mensagens
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" style={{
                    borderColor: isDarkMode ? '#404040' : '#d1d5db',
                    color: isDarkMode ? '#ffffff' : '#374151'
                  }}>
                    Bloquear
                  </Button>
                </div>
              </div>
            </div>
        </DialogContent>
      </Dialog>

      {/* More Options Modal */}
      <Dialog open={showMoreOptions} onOpenChange={setShowMoreOptions}>
        <DialogContent className={cn(
          "sm:max-w-md",
          isDarkMode ? "bg-[#1a1a1a] border-[#404040] text-white" : "bg-white border-gray-200"
        )}>
          <DialogHeader>
            <DialogTitle className={cn(isDarkMode ? "text-white" : "text-gray-900")}>
              Ações da Conversa
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-3 h-12"
                onClick={() => {
                  console.log('Arquivar conversa');
                  setShowMoreOptions(false);
                }}
              >
                <Archive size={16} className="text-[#b5103c]" />
                <span className={isDarkMode ? "text-gray-200" : "text-gray-700"}>Arquivar Conversa</span>
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-3 h-12"
                onClick={() => {
                  console.log('Atribuir conversa');
                  setShowMoreOptions(false);
                }}
              >
                <UserX size={16} className="text-[#b5103c]" />
                <span className={isDarkMode ? "text-gray-200" : "text-gray-700"}>Atribuir Conversa</span>
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-3 h-12 text-red-500 hover:text-red-600"
                onClick={() => {
                  console.log('Excluir conversa');
                  setShowMoreOptions(false);
                }}
              >
                <Trash2 size={16} />
                <span>Excluir Conversa</span>
              </Button>
            </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
