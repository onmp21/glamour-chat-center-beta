
import React, { useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreVertical, MessageSquare, Clock, CheckCircle, RefreshCw, User, Phone, Calendar, Brain, FileText, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUnifiedConversationStatus } from '@/hooks/useUnifiedConversationStatus';
import { ConversationNotesModal } from './ConversationNotesModal';
import { ConversationTagsModal } from './ConversationTagsModal';
import { AIActionsModal } from './AIActionsModal';
import { format } from 'date-fns';

interface ConversationActionsMenuProps {
  isDarkMode: boolean;
  conversationId?: string;
  channelId?: string;
  currentStatus?: 'unread' | 'in_progress' | 'resolved';
  contactName?: string;
  contactPhone?: string;
  lastActivity?: string;
  onStatusChange?: (status: 'unread' | 'in_progress' | 'resolved') => void;
  onRefresh?: () => void;
}

export const ConversationActionsMenu: React.FC<ConversationActionsMenuProps> = ({
  isDarkMode,
  conversationId,
  channelId,
  currentStatus,
  contactName,
  contactPhone,
  lastActivity,
  onStatusChange,
  onRefresh
}) => {
  const { updateConversationStatus } = useUnifiedConversationStatus();
  const [showAIModal, setShowAIModal] = useState(false);

  const handleStatusChange = async (newStatus: 'unread' | 'in_progress' | 'resolved') => {
    if (!channelId || !conversationId) return;
    
    const success = await updateConversationStatus(channelId, conversationId, newStatus);
    if (success) {
      onStatusChange?.(newStatus);
      onRefresh?.();
    }
  };

  const statusOptions = [
    { 
      value: 'unread', 
      label: 'Marcar como não lida', 
      icon: MessageSquare,
      color: 'text-orange-600'
    },
    { 
      value: 'in_progress', 
      label: 'Marcar em andamento', 
      icon: Clock,
      color: 'text-blue-600'
    },
    { 
      value: 'resolved', 
      label: 'Marcar como resolvida', 
      icon: CheckCircle,
      color: 'text-green-600'
    }
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 rounded-full btn-animate",
            isDarkMode ? "text-zinc-400 hover:bg-zinc-800" : "text-gray-600 hover:bg-gray-100"
          )}
        >
          <MoreVertical size={16} />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent
        align="end"
        className={cn(
          "w-64",
          isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-200"
        )}
      >
        {/* Informações do Contato */}
        {(contactName || contactPhone) && (
          <>
            <div className="p-3 border-b border-zinc-700">
              <h4 className={cn(
                "font-medium text-sm mb-2",
                isDarkMode ? "text-zinc-200" : "text-gray-800"
              )}>
                Informações do Contato
              </h4>
              
              {contactName && (
                <div className="flex items-center gap-2 mb-1">
                  <User size={12} className={cn(
                    isDarkMode ? "text-zinc-400" : "text-gray-500"
                  )} />
                  <span className={cn(
                    "text-xs",
                    isDarkMode ? "text-zinc-300" : "text-gray-600"
                  )}>
                    {contactName}
                  </span>
                </div>
              )}
              
              {contactPhone && (
                <div className="flex items-center gap-2 mb-1">
                  <Phone size={12} className={cn(
                    isDarkMode ? "text-zinc-400" : "text-gray-500"
                  )} />
                  <span className={cn(
                    "text-xs",
                    isDarkMode ? "text-zinc-300" : "text-gray-600"
                  )}>
                    {contactPhone}
                  </span>
                </div>
              )}
              
              {lastActivity && (
                <div className="flex items-center gap-2">
                  <Calendar size={12} className={cn(
                    isDarkMode ? "text-zinc-400" : "text-gray-500"
                  )} />
                  <span className={cn(
                    "text-xs",
                    isDarkMode ? "text-zinc-300" : "text-gray-600"
                  )}>
                    {format(new Date(lastActivity), 'dd/MM/yyyy HH:mm')}
                  </span>
                </div>
              )}
            </div>
            <DropdownMenuSeparator className={isDarkMode ? "bg-zinc-800" : "bg-gray-200"} />
          </>
        )}

        {/* Status Actions */}
        {statusOptions
          .filter(option => option.value !== currentStatus)
          .map((option) => {
            const IconComponent = option.icon;
            return (
              <DropdownMenuItem
                key={option.value}
                onClick={() => handleStatusChange(option.value as any)}
                className={cn(
                  "cursor-pointer",
                  isDarkMode ? "hover:bg-zinc-800 text-zinc-300" : "hover:bg-gray-100"
                )}
              >
                <IconComponent size={16} className={cn("mr-2", option.color)} />
                {option.label}
              </DropdownMenuItem>
            );
          })}

        <DropdownMenuSeparator className={isDarkMode ? "bg-zinc-800" : "bg-gray-200"} />

        {/* Ações de IA */}
        <DropdownMenuItem
          onClick={() => setShowAIModal(true)}
          className={cn(
            "cursor-pointer",
            isDarkMode ? "hover:bg-zinc-800 text-zinc-300" : "hover:bg-gray-100"
          )}
        >
          <Brain size={16} className="mr-2 text-[#b5103c]" />
          Resumir Conversa com IA
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setShowAIModal(true)}
          className={cn(
            "cursor-pointer",
            isDarkMode ? "hover:bg-zinc-800 text-zinc-300" : "hover:bg-gray-100"
          )}
        >
          <Zap size={16} className="mr-2 text-[#b5103c]" />
          Resposta Rápida com IA
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setShowAIModal(true)}
          className={cn(
            "cursor-pointer",
            isDarkMode ? "hover:bg-zinc-800 text-zinc-300" : "hover:bg-gray-100"
          )}
        >
          <FileText size={16} className="mr-2 text-[#b5103c]" />
          Gerar Relatório desta Conversa
        </DropdownMenuItem>

        <DropdownMenuSeparator className={isDarkMode ? "bg-zinc-800" : "bg-gray-200"} />

        {/* Notes */}
        {channelId && conversationId && (
          <ConversationNotesModal
            isDarkMode={isDarkMode}
            channelId={channelId}
            conversationId={conversationId}
          />
        )}

        {/* Tags */}
        {channelId && conversationId && (
          <ConversationTagsModal
            isDarkMode={isDarkMode}
            channelId={channelId}
            conversationId={conversationId}
          />
        )}

        <DropdownMenuSeparator className={isDarkMode ? "bg-zinc-800" : "bg-gray-200"} />

        {/* Refresh */}
        <DropdownMenuItem
          onClick={onRefresh}
          className={cn(
            "cursor-pointer",
            isDarkMode ? "hover:bg-zinc-800 text-zinc-300" : "hover:bg-gray-100"
          )}
        >
          <RefreshCw size={16} className="mr-2 text-gray-500" />
          Atualizar conversa
        </DropdownMenuItem>
      </DropdownMenuContent>

      {/* Modal de Ações de IA */}
      {showAIModal && (
        <AIActionsModal
          isDarkMode={isDarkMode}
          conversationId={conversationId}
          channelId={channelId}
          contactName={contactName}
          onClose={() => setShowAIModal(false)}
        />
      )}
    </DropdownMenu>
  );
};
