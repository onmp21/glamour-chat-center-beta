
import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { User, UserRole } from '@/types/auth';

interface UserCardProps {
  user: User;
  isDarkMode: boolean;
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  salesperson: 'Vendedor',
  manager_external: 'Gerente Externo',
  manager_store: 'Gerente de Loja',
  manager: 'Gerente'
};

const CHANNEL_OPTIONS = [
  { key: 'canarana', label: 'Canarana' },
  { key: 'souto-soares', label: 'Souto Soares' },
  { key: 'joao-dourado', label: 'João Dourado' },
  { key: 'america-dourada', label: 'América Dourada' },
  { key: 'gerente-lojas', label: 'Gerente Lojas' },
  { key: 'gerente-externo', label: 'Gerente Externo' },
  { key: 'chat', label: 'Chat Geral' }
];

export const UserCard: React.FC<UserCardProps> = ({
  user,
  isDarkMode,
  onEdit,
  onDelete
}) => {
  const getRoleBadgeColor = (role: UserRole) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      salesperson: 'bg-blue-100 text-blue-800',
      manager_external: 'bg-purple-100 text-purple-800',
      manager_store: 'bg-green-100 text-green-800',
      manager: 'bg-orange-100 text-orange-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className={cn(
      "p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between shadow-sm",
      isDarkMode ? "bg-[#232327] border-[#27272a]" : "bg-gray-50 border-gray-200"
    )}>
      <div>
        <div className="flex items-center space-x-3 mb-2">
          <h4 className={cn("font-semibold text-lg", isDarkMode ? "text-white" : "text-gray-900")}>
            {user.name}
          </h4>
          <Badge className={getRoleBadgeColor(user.role)}>
            {ROLE_LABELS[user.role]}
          </Badge>
        </div>
        <div className="text-xs text-gray-400">{user.username}</div>
        {user.assignedTabs && user.assignedTabs.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {user.assignedTabs.map(tab => (
              <Badge key={tab} variant="outline" className={cn(
                "text-xs",
                isDarkMode ? "border-[#444444] text-gray-300" : "border-gray-300"
              )}>
                {tab}
              </Badge>
            ))}
          </div>
        )}
        {user.assignedChannels && user.assignedChannels.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {user.assignedChannels.map(channel => (
              <Badge key={channel} variant="outline" className={cn(
                "text-xs",
                isDarkMode ? "border-[#8f1440] text-[#f376aa]" : "border-gray-300"
              )}>
                {CHANNEL_OPTIONS.find(c => c.key === channel)?.label || channel}
              </Badge>
            ))}
          </div>
        )}
      </div>
      <div className="flex space-x-2 mt-4 md:mt-0">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onEdit(user)}
          className={cn(
            "transition-colors duration-200",
            isDarkMode ? "border-[#333333] hover:bg-[#333333] text-white" : "border-gray-300 hover:bg-gray-100"
          )}
        >
          <Edit size={16} />
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onDelete(user.id)}
          className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 transition-colors duration-200"
        >
          <Trash2 size={16} />
        </Button>
      </div>
    </div>
  );
};
