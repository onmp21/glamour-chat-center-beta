
import React from 'react';
import { ArrowLeft, Phone, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ChatHeaderFixedProps {
  contactName: string;
  contactPhone: string;
  isDarkMode: boolean;
  onBack?: () => void;
  showBackButton?: boolean;
}

export const ChatHeaderFixed: React.FC<ChatHeaderFixedProps> = ({
  contactName,
  contactPhone,
  isDarkMode,
  onBack,
  showBackButton = false
}) => {
  const formatPhone = (phone: string) => {
    // Remove any non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Format as Brazilian phone number if it has 11 digits
    if (cleanPhone.length === 11) {
      return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 7)}-${cleanPhone.slice(7)}`;
    }
    
    return phone;
  };

  return (
    <div className={cn(
      "flex items-center justify-between p-4 border-b",
      isDarkMode ? "border-[#3f3f46] bg-[#18181b]" : "border-gray-200 bg-white"
    )}>
      <div className="flex items-center space-x-3">
        {showBackButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className={cn(
              "h-8 w-8",
              isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"
            )}
          >
            <ArrowLeft size={18} />
          </Button>
        )}

        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-[#b5103c] flex items-center justify-center text-white font-semibold">
          {contactName.charAt(0).toUpperCase()}
        </div>

        {/* Contact Info */}
        <div className="flex flex-col">
          <h2 className={cn(
            "font-semibold text-base leading-tight",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            {contactName}
          </h2>
          <p className={cn(
            "text-sm leading-tight",
            isDarkMode ? "text-gray-400" : "text-gray-600"
          )}>
            {formatPhone(contactPhone)}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8",
            isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"
          )}
        >
          <Phone size={18} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8",
            isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"
          )}
        >
          <MoreVertical size={18} />
        </Button>
      </div>
    </div>
  );
};
