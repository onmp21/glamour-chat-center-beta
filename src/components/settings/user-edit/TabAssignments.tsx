
import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types/auth';
import { rolePermissions } from './RoleSelector';

interface TabAssignmentsProps {
  assignedTabs: string[];
  userRole: UserRole;
  onTabToggle: (tabId: string) => void;
  isDarkMode: boolean;
}

const availableTabs = [
  { id: 'general', name: 'Canal Geral' },
  { id: 'canarana', name: 'Canarana' },
  { id: 'souto-soares', name: 'Souto Soares' },
  { id: 'joao-dourado', name: 'João Dourado' },
  { id: 'america-dourada', name: 'América Dourada' },
  { id: 'manager-store', name: 'Gerente das Lojas' },
  { id: 'manager-external', name: 'Gerente do Externo' },
  { id: 'pedro', name: 'Pedro' }
];

export const TabAssignments: React.FC<TabAssignmentsProps> = ({
  assignedTabs,
  userRole,
  onTabToggle,
  isDarkMode
}) => {
  return (
    <div className="space-y-2">
      <Label className={cn(
        isDarkMode ? "text-stone-200" : "text-gray-700"
      )}>Canais Atribuídos</Label>
      <div className="space-y-2 max-h-32 overflow-y-auto border rounded p-2" style={{
        backgroundColor: isDarkMode ? '#1a1a1a' : '#f9f9f9',
        borderColor: isDarkMode ? '#333333' : '#d1d5db'
      }}>
        {availableTabs.map(tab => (
          <div key={tab.id} className="flex items-center space-x-2">
            <Checkbox
              id={tab.id}
              checked={assignedTabs.includes(tab.id)}
              onCheckedChange={() => onTabToggle(tab.id)}
              disabled={userRole !== 'admin' && !rolePermissions[userRole]?.includes(tab.id)}
            />
            <Label htmlFor={tab.id} className={cn(
              "text-sm",
              isDarkMode ? "text-stone-300" : "text-gray-700"
            )}>
              {tab.name}
              {tab.id === 'general' && (
                <span className={cn(
                  "text-xs ml-2",
                  isDarkMode ? "text-stone-400" : "text-gray-500"
                )}>
                  (Somente admin pode enviar mensagens)
                </span>
              )}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
};

export { availableTabs };
