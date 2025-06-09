
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import { ConversationTagModal } from './ConversationTagModal';

interface MobileChatHeaderProps {
  isDarkMode: boolean;
  contactName: string;
  contactPhone: string;
  onBack: () => void;
  onContactPress: () => void;
  onInfoPress: () => void;
  onTagPress: () => void;
}

export const MobileChatHeader: React.FC<MobileChatHeaderProps> = ({
  isDarkMode,
  contactName,
  contactPhone,
  onBack,
  onContactPress,
  onInfoPress,
  onTagPress
}) => {
  const [showTagModal, setShowTagModal] = useState(false);

  const handleMoreOptions = () => {
    setShowTagModal(true);
  };

  return (
    <>
      <div className={cn(
        "flex items-center justify-between px-4 py-3 border-b sticky top-0 z-10",
        isDarkMode ? "bg-zinc-950 border-zinc-800" : "bg-white border-gray-200"
      )}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className={cn(
              "flex-shrink-0 rounded-full",
              isDarkMode ? "text-zinc-100 hover:bg-zinc-800" : "text-gray-700 hover:bg-gray-100"
            )}
          >
            <ArrowLeft size={20} />
          </Button>
          
          <div className="flex-1 min-w-0" onClick={onContactPress}>
            <h1 className={cn(
              "font-semibold text-lg truncate cursor-pointer",
              isDarkMode ? "text-zinc-100" : "text-gray-900"
            )}>
              {contactName}
            </h1>
            <p className={cn(
              "text-sm cursor-pointer",
              isDarkMode ? "text-zinc-400" : "text-gray-500"
            )}>
              {contactPhone}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onInfoPress}
          className={cn(
            "flex-shrink-0 rounded-full",
            isDarkMode ? "text-zinc-100 hover:bg-zinc-800" : "text-gray-700 hover:bg-gray-100"
          )}
        >
          <MoreVertical size={20} />
        </Button>
      </div>

      <ConversationTagModal
        isOpen={showTagModal}
        onClose={() => setShowTagModal(false)}
        isDarkMode={isDarkMode}
        onTagSelect={(tag) => {
          console.log('Conversa classificada como:', tag);
          onTagPress();
          setShowTagModal(false);
        }}
      />
    </>
  );
};
