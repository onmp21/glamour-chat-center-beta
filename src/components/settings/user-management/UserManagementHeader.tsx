
import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types/auth';

interface UserManagementHeaderProps {
  isDarkMode: boolean;
  searchTerm: string;
  selectedRole: UserRole | 'all';
  onSearchChange: (value: string) => void;
  onRoleChange: (value: UserRole | 'all') => void;
  onNewUser: () => void;
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  salesperson: 'Vendedor',
  manager_external: 'Gerente Externo',
  manager_store: 'Gerente de Loja',
  manager: 'Gerente'
};

export const UserManagementHeader: React.FC<UserManagementHeaderProps> = ({
  isDarkMode,
  searchTerm,
  selectedRole,
  onSearchChange,
  onRoleChange,
  onNewUser
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 md:items-end">
      <div className="flex-1">
        <Input
          placeholder="Buscar por nome ou usuário..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className={cn(isDarkMode ? "bg-[#2a2a2a] border-[#333333] text-white" : "bg-white border-gray-300")}
        />
      </div>
      <div className="w-full md:w-60">
        <Select value={selectedRole} onValueChange={onRoleChange}>
          <SelectTrigger className={cn(isDarkMode ? "bg-[#2a2a2a] border-[#333333] text-white" : "bg-white border-gray-300")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className={cn(isDarkMode ? "bg-[#1a1a1a] border-[#333333] text-white" : "bg-white text-gray-900")}>
            <SelectItem value="all">Todos os papéis</SelectItem>
            {Object.entries(ROLE_LABELS).map(([role, label]) => (
              <SelectItem key={role} value={role}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Button 
          onClick={onNewUser}
          className="bg-[#b5103c] hover:bg-[#9a0e35] text-white"
        >
          <Plus size={16} className="mr-2" />
          Novo Usuário
        </Button>
      </div>
    </div>
  );
};
