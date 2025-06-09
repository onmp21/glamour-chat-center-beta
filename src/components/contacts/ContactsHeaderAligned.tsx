
import React from 'react';
import { cn } from '@/lib/utils';
import { Users } from 'lucide-react';

interface ContactsHeaderAlignedProps {
  isDarkMode: boolean;
}

export const ContactsHeaderAligned: React.FC<ContactsHeaderAlignedProps> = ({ isDarkMode }) => {
  return (
    <div className="p-6 border-b border-[#b5103c]/20">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-full bg-[#b5103c]/10">
            <Users size={32} className="text-[#b5103c]" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className={cn("text-3xl font-bold", isDarkMode ? "text-white" : "text-gray-900")}>
              Contatos
            </h1>
            <p className={cn("text-lg", isDarkMode ? "text-[#a1a1aa]" : "text-gray-600")}>
              Gerencie seus contatos e clientes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
