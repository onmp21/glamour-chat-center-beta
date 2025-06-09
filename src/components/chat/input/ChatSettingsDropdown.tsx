
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Settings, Archive, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface ChatSettingsDropdownProps {
  isDarkMode: boolean;
  conversationId: string;
  currentStatus?: 'unread' | 'in_progress' | 'resolved';
  onStatusChange?: (status: 'unread' | 'in_progress' | 'resolved') => void;
}

export const ChatSettingsDropdown: React.FC<ChatSettingsDropdownProps> = ({
  isDarkMode,
  conversationId,
  currentStatus = 'unread',
  onStatusChange
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleDocumentClick = (e: Event) => {
    if (!(e.target as Element).closest('.chat-settings-dropdown-container')) {
      setShowDropdown(false);
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  const handleStatusChange = (status: 'unread' | 'in_progress' | 'resolved') => {
    onStatusChange?.(status);
    setShowDropdown(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unread': return 'text-red-500';
      case 'in_progress': return 'text-yellow-500';
      case 'resolved': return 'text-green-500';
      default: return isDarkMode ? 'text-[#a1a1aa]' : 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'unread': return AlertCircle;
      case 'in_progress': return Clock;
      case 'resolved': return CheckCircle;
      default: return AlertCircle;
    }
  };

  return (
    <div className="relative chat-settings-dropdown-container">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "h-9 w-9",
          isDarkMode ? "text-[#a1a1aa] hover:bg-[#18181b]" : "text-gray-600 hover:bg-gray-100"
        )}
        onClick={(e) => {
          e.stopPropagation();
          setShowDropdown(!showDropdown);
        }}
      >
        <Settings size={18} />
      </Button>
      
      {showDropdown && (
        <div className={cn(
          "absolute bottom-12 right-0 rounded-lg shadow-lg border p-2 z-50 min-w-[200px]",
          isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200"
        )}>
          <div className={cn(
            "px-3 py-2 text-xs font-semibold uppercase tracking-wider border-b mb-2",
            isDarkMode ? "text-[#a1a1aa] border-[#3f3f46]" : "text-gray-500 border-gray-200"
          )}>
            Status da Conversa
          </div>
          
          {(['unread', 'in_progress', 'resolved'] as const).map((status) => {
            const IconComponent = getStatusIcon(status);
            const isActive = currentStatus === status;
            
            return (
              <Button
                key={status}
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-start mb-1 flex items-center space-x-2",
                  isActive && "bg-[#b5103c] text-white hover:bg-[#a00f36]"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusChange(status);
                }}
              >
                <IconComponent size={16} className={isActive ? 'text-white' : getStatusColor(status)} />
                <span className={isActive ? 'text-white' : (isDarkMode ? "text-[#fafafa]" : "text-gray-700")}>
                  {status === 'unread' && 'Não Lida'}
                  {status === 'in_progress' && 'Em Andamento'}
                  {status === 'resolved' && 'Resolvida'}
                </span>
              </Button>
            );
          })}
          
          <div className={cn(
            "border-t mt-2 pt-2",
            isDarkMode ? "border-[#3f3f46]" : "border-gray-200"
          )}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-start flex items-center space-x-2"
              onClick={(e) => {
                e.stopPropagation();
                console.log('Arquivar conversa:', conversationId);
                setShowDropdown(false);
              }}
            >
              <Archive size={16} />
              <span className={isDarkMode ? "text-[#fafafa]" : "text-gray-700"}>Arquivar</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
