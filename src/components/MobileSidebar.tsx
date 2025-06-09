
import React from 'react';
import { cn } from '@/lib/utils';
import { MobileSidebarHeader } from './sidebar/MobileSidebarHeader';
import { MobileSidebarNavigation } from './sidebar/MobileSidebarNavigation';
import { MobileSidebarFooter } from './sidebar/MobileSidebarFooter';

interface MobileSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({
  activeSection,
  onSectionChange,
  isDarkMode,
  toggleDarkMode,
  isOpen,
  onClose
}) => {
  const handleItemClick = (sectionId: string) => {
    onSectionChange(sectionId);
    onClose();
  };

  const handleUserClick = () => {
    handleItemClick('settings');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-full w-80 z-50 transform transition-transform duration-300 ease-in-out md:hidden mobile-slide-up",
        isOpen ? "translate-x-0" : "-translate-x-full",
        isDarkMode ? "bg-[#09090b]" : "bg-white"
      )}>
        <MobileSidebarHeader
          isDarkMode={isDarkMode}
          onClose={onClose}
        />

        <MobileSidebarNavigation
          isDarkMode={isDarkMode}
          activeSection={activeSection}
          onItemClick={handleItemClick}
        />

        <MobileSidebarFooter
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
          onUserClick={handleUserClick}
        />
      </div>
    </>
  );
};
