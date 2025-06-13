
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types/auth';

interface RoleSelectorProps {
  selectedRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  isDarkMode: boolean;
}

const rolePermissions: Record<UserRole, string[]> = {
  admin: ['general', 'canarana', 'souto-soares', 'joao-dourado', 'america-dourada', 'manager-store', 'manager-external'],
  manager: ['general', 'canarana', 'souto-soares', 'joao-dourado', 'america-dourada'],
  manager_external: ['general', 'manager-external'],
  manager_store: ['general', 'canarana', 'souto-soares', 'joao-dourado', 'america-dourada', 'manager-store'],
  salesperson: ['general']
};

export const RoleSelector: React.FC<RoleSelectorProps> = ({
  selectedRole,
  onRoleChange,
  isDarkMode
}) => {
  const getRoleLabel = (role: UserRole) => {
    const labels: Record<UserRole, string> = {
      admin: 'Administrador',
      manager: 'Gerente',
      manager_external: 'Gerente Externo',
      manager_store: 'Gerente de Loja',
      salesperson: 'Vendedora'
    };
    return labels[role];
  };

  return (
    <div className="space-y-2">
      <Label className={cn(
        isDarkMode ? "text-stone-200" : "text-gray-700"
      )}>Função</Label>
      <Select value={selectedRole} onValueChange={onRoleChange}>
        <SelectTrigger className={cn(
          isDarkMode 
            ? "bg-stone-700 border-stone-600 text-stone-100" 
            : "bg-white border-gray-300"
        )}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(rolePermissions).map(([role]) => (
            <SelectItem key={role} value={role}>
              {getRoleLabel(role as UserRole)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export { rolePermissions };
