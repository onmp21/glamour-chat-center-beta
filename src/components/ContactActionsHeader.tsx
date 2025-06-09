
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { User, Settings, MoreVertical, Phone, Mail, MessageCircle, Shield, Bell, Trash2 } from 'lucide-react';

interface ContactActionsHeaderProps {
  isDarkMode: boolean;
  contactName?: string;
}

export const ContactActionsHeader: React.FC<ContactActionsHeaderProps> = ({ 
  isDarkMode, 
  contactName 
}) => {
  const [showContactDetails, setShowContactDetails] = useState(false);
  const [showContactSettings, setShowContactSettings] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  const handleContactDetails = () => {
    setShowContactDetails(true);
  };

  const handleContactSettings = () => {
    setShowContactSettings(true);
  };

  const handleMoreOptions = () => {
    setShowMoreOptions(true);
  };

  return (
    <>
      <div className={cn(
        "flex items-center justify-between px-4 py-3 border-b",
        isDarkMode ? "bg-[#232323] border-[#2a2a2a]" : "bg-white border-gray-200"
      )}>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <User size={16} className="text-gray-600" />
          </div>
          <div>
            <h3 className={cn("font-semibold text-sm", isDarkMode ? "text-white" : "text-gray-900")}>
              {contactName || 'Contato'}
            </h3>
            <p className={cn("text-xs", isDarkMode ? "text-gray-400" : "text-gray-500")}>
              Online
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 w-8 p-0",
              isDarkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-600 hover:text-gray-700"
            )}
            title="Dados do Contato"
            onClick={handleContactDetails}
          >
            <User size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 w-8 p-0",
              isDarkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-600 hover:text-gray-700"
            )}
            title="Configurações do Contato"
            onClick={handleContactSettings}
          >
            <Settings size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 w-8 p-0",
              isDarkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-600 hover:text-gray-700"
            )}
            title="Mais opções"
            onClick={handleMoreOptions}
          >
            <MoreVertical size={16} />
          </Button>
        </div>
      </div>

      {/* Contact Details Modal */}
      <Dialog open={showContactDetails} onOpenChange={setShowContactDetails}>
        <DialogContent className={cn(
          "sm:max-w-md",
          isDarkMode ? "bg-[#232323] border-[#2a2a2a] text-white" : "bg-white border-gray-200"
        )}>
          <DialogHeader>
            <DialogTitle className={cn(isDarkMode ? "text-white" : "text-gray-900")}>
              Dados do Contato
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                <User size={24} className="text-gray-600" />
              </div>
            </div>
            <div className="text-center">
              <h3 className={cn("font-semibold text-lg", isDarkMode ? "text-white" : "text-gray-900")}>
                {contactName || 'Nome do Contato'}
              </h3>
              <p className={cn("text-sm", isDarkMode ? "text-gray-400" : "text-gray-500")}>
                Online agora
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: isDarkMode ? "#2a2a2a" : "#f3f4f6" }}>
                <Phone size={16} className="text-[#b5103c]" />
                <div>
                  <p className={cn("text-sm font-medium", isDarkMode ? "text-white" : "text-gray-900")}>
                    Telefone
                  </p>
                  <p className={cn("text-sm", isDarkMode ? "text-gray-400" : "text-gray-500")}>
                    (77) 99999-1234
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: isDarkMode ? "#2a2a2a" : "#f3f4f6" }}>
                <Mail size={16} className="text-[#b5103c]" />
                <div>
                  <p className={cn("text-sm font-medium", isDarkMode ? "text-white" : "text-gray-900")}>
                    Email
                  </p>
                  <p className={cn("text-sm", isDarkMode ? "text-gray-400" : "text-gray-500")}>
                    contato@exemplo.com
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact Settings Modal */}
      <Dialog open={showContactSettings} onOpenChange={setShowContactSettings}>
        <DialogContent className={cn(
          "sm:max-w-md",
          isDarkMode ? "bg-[#232323] border-[#2a2a2a] text-white" : "bg-white border-gray-200"
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
                    <p className={cn("text-xs", isDarkMode ? "text-gray-400" : "text-gray-500")}>
                      Receber notificações deste contato
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
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
                    <p className={cn("text-xs", isDarkMode ? "text-gray-400" : "text-gray-500")}>
                      Impedir mensagens deste contato
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
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
          isDarkMode ? "bg-[#232323] border-[#2a2a2a] text-white" : "bg-white border-gray-200"
        )}>
          <DialogHeader>
            <DialogTitle className={cn(isDarkMode ? "text-white" : "text-gray-900")}>
              Mais Opções
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 h-12"
              onClick={() => console.log('Exportar conversa')}
            >
              <MessageCircle size={16} className="text-[#b5103c]" />
              Exportar Conversa
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 h-12 text-red-500 hover:text-red-600"
              onClick={() => console.log('Excluir conversa')}
            >
              <Trash2 size={16} />
              Excluir Conversa
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
