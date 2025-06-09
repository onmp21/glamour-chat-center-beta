
import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuditLoggerFactory } from '@/services/audit/AuditLoggerFactory';

export const useAuditLoggers = () => {
  const { user } = useAuth();

  const loggers = useMemo(() => {
    return {
      dashboard: AuditLoggerFactory.createDashboardLogger(user),
      channel: AuditLoggerFactory.createChannelLogger(user),
      conversation: AuditLoggerFactory.createConversationLogger(user),
      navigation: AuditLoggerFactory.createNavigationLogger(user),
      ui: AuditLoggerFactory.createUILogger(user),
      profile: AuditLoggerFactory.createProfileLogger(user),
      credentials: AuditLoggerFactory.createCredentialsLogger(user),
      notifications: AuditLoggerFactory.createNotificationLogger(user)
    };
  }, [user]);

  return loggers;
};
