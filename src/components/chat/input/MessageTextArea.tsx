import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface MessageTextAreaProps {
  value: string;
  onChange: (value: string) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  isDarkMode: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export const MessageTextArea: React.FC<MessageTextAreaProps> = ({
  value,
  onChange,
  onKeyPress,
  isDarkMode,
  disabled = false,
  placeholder = "Mensagem"
}) => {
  return (
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyPress={onKeyPress}
      placeholder={placeholder}
      className={cn(
        "min-h-[40px] max-h-32 resize-none rounded-xl border px-3 py-2 text-sm focus-visible:ring-1 focus-visible:ring-offset-0",
        isDarkMode 
          ? "bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-600" 
          : "bg-gray-50 border-gray-300 focus-visible:ring-gray-400"
      )}
      disabled={disabled}
      rows={1}
    />
  );
};

