import { useAuth } from '@/contexts/AuthContext';

export const usePermissions = () => {
  const { user } = useAuth();

  const canManageUsers = () => user?.role === 'admin';
  const canAccessAuditHistory = () => user?.role === 'admin';
  const canManageTabs = () => user?.role === 'admin';
  const canAccessCredentials = () => !!user;
  const canAccessReports = () => user?.role === 'admin';

  // Rework getAccessibleChannels to reflect requested rules.
  const getAccessibleChannels = () => {
    if (!user) return [];

    if (user.role === 'admin') {
      return [
        'chat', 'canarana', 'souto-soares', 'joao-dourado', 'america-dourada', 'gerente-lojas', 'gerente-externo'
      ];
    }

    if (user.role === 'manager_external') {
      return ['chat', 'gerente-externo'];
    }

    if (user.role === 'manager_store') {
      return ['canarana', 'souto-soares', 'joao-dourado', 'america-dourada', 'gerente-lojas'];
    }

    // salesperson (vendedora): access chat + assigned channel(s)
    if (user.role === 'salesperson') {
      const channels = ['chat'];
      const assignments = user.assignedChannels || [];
      channels.push(...assignments.filter(Boolean));
      return Array.from(new Set(channels));
    }
    return ['chat'];
  };

  const canAccessChannel = (channelId: string) => {
    const accessible = getAccessibleChannels();
    return accessible.includes(channelId);
  };

  const canSendMessage = () => !!user;

  return {
    canManageUsers,
    canAccessAuditHistory,
    canManageTabs,
    canAccessCredentials,
    canAccessReports,
    canAccessChannel,
    canSendMessage,
    getAccessibleChannels
  };
};
