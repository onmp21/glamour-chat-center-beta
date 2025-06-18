
import React from 'react';
import { Button } from '@/components/ui/button';
import { QRCodeManager } from '@/components/QRCodeManager';
import { cn } from '@/lib/utils';

interface QRCodeModalProps {
  isOpen: boolean;
  channelId: string | null;
  isDarkMode?: boolean;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  channelId,
  isDarkMode = false,
  onClose
}) => {
  if (!isOpen || !channelId) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={cn(
        "bg-white rounded-lg p-6 max-w-md w-full mx-4",
        isDarkMode ? "bg-[#18181b] border border-[#27272a]" : ""
      )}>
        <QRCodeManager
          isDarkMode={isDarkMode}
          channelId={channelId}
        />
        <Button
          onClick={onClose}
          variant="outline"
          className={cn(
            "w-full mt-4",
            isDarkMode ? "border-[#3f3f46] text-zinc-300 hover:bg-[#27272a]" : ""
          )}
        >
          Fechar
        </Button>
      </div>
    </div>
  );
};
