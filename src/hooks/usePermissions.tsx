
import { useAuth } from '@/contexts/AuthContext';

export const usePermissions = () => {
  const { user } = useAuth();

  const canManageUsers = () => {
    return user?.role === 'admin';
  };

  const canAccessAuditHistory = () => {
    // Apenas administradores podem acessar histórico de auditoria
    return user?.role === 'admin';
  };

  const canManageTabs = () => {
    return user?.role === 'admin';
  };

  // Ativando para todos os usuários poderem alterar suas credenciais
  const canAccessCredentials = () => {
    return true; // Todos os usuários podem alterar suas próprias credenciais
  };

  // Relatórios apenas para administradores e gerentes
  const canAccessReports = () => {
    return user?.role === 'admin' || user?.role === 'manager_external' || user?.role === 'manager_store';
  };

  const canAccessChannel = (channelId: string) => {
    const accessibleChannels = getAccessibleChannels();
    return accessibleChannels.includes(channelId);
  };

  const canSendMessage = () => {
    // Todos os usuários autenticados podem enviar mensagens
    return !!user;
  };

  const getAccessibleChannels = () => {
    if (!user) return [];
    
    // Admin e gerente externo têm acesso a todos os canais (incluindo Yelena) - removido Pedro
    if (user.role === 'admin' || user.role === 'manager_external') {
      return ['chat', 'canarana', 'souto-soares', 'joao-dourado', 'america-dourada', 'gerente-lojas', 'gerente-externo'];
    }
    
    // Gerente de loja tem acesso aos canais das lojas, gerente de lojas e Yelena
    if (user.role === 'manager_store') {
      return ['canarana', 'souto-soares', 'joao-dourado', 'america-dourada', 'gerente-lojas'];
    }
    
    // Vendedoras têm acesso baseado nas cidades atribuídas + Yelena
    if (user.role === 'salesperson') {
      const channels = ['chat']; // Sempre têm acesso ao chat geral (Yelena)
      
      if (user.assignedCities?.includes('canarana')) {
        channels.push('canarana');
      }
      if (user.assignedCities?.includes('souto-soares')) {
        channels.push('souto-soares');
      }
      if (user.assignedCities?.includes('joao-dourado')) {
        channels.push('joao-dourado');
      }
      if (user.assignedCities?.includes('america-dourada')) {
        channels.push('america-dourada');
      }
      
      return channels;
    }
    
    return ['chat']; // Fallback para pelo menos o chat geral (Yelena)
  };

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
